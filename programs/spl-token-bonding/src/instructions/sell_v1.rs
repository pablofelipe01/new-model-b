//! Sell tokens back along the curve. Burn from the seller, transfer base out
//! of `base_storage` (signed by the storage authority PDA).

use crate::curve::exponential::price_for_tokens;
use crate::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer};

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct SellV1Args {
    pub target_amount: u64,
    /// Minimum base tokens the seller is willing to receive (slippage floor).
    pub slippage_min_base: Option<u64>,
}

#[derive(Accounts)]
pub struct SellV1<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(
        mut,
        seeds = [
            TokenBondingV0::SEED_PREFIX,
            target_mint.key().as_ref(),
            &token_bonding.index.to_le_bytes(),
        ],
        bump = token_bonding.bump_seed,
    )]
    pub token_bonding: Box<Account<'info, TokenBondingV0>>,

    pub curve: Account<'info, CurveV0>,

    #[account(mut, address = token_bonding.base_mint @ ErrorCode::InvalidAccount)]
    pub base_mint: Box<Account<'info, Mint>>,
    #[account(mut, address = token_bonding.target_mint @ ErrorCode::InvalidAccount)]
    pub target_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        address = token_bonding.base_storage @ ErrorCode::InvalidAccount,
    )]
    pub base_storage: Box<Account<'info, TokenAccount>>,

    /// CHECK: PDA, validated by seeds. Signs base_storage transfers.
    #[account(
        seeds = [TokenBondingV0::STORAGE_AUTHORITY_SEED, token_bonding.key().as_ref()],
        bump = token_bonding.reserve_authority_bump_seed,
    )]
    pub base_storage_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        address = token_bonding.sell_base_royalties @ ErrorCode::InvalidAccount,
    )]
    pub sell_base_royalties: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        address = token_bonding.sell_target_royalties @ ErrorCode::InvalidAccount,
    )]
    pub sell_target_royalties: Box<Account<'info, TokenAccount>>,

    /// Source of target tokens being sold (seller's ATA).
    #[account(mut, token::mint = target_mint, token::authority = seller)]
    pub source: Box<Account<'info, TokenAccount>>,
    /// Destination of base tokens (seller's base ATA).
    #[account(mut, token::mint = base_mint)]
    pub destination: Box<Account<'info, TokenAccount>>,

    /// Mint authority PDA — needed to mint the target-side royalty.
    /// CHECK: PDA, validated by seeds.
    #[account(
        seeds = [TokenBondingV0::MINT_AUTHORITY_SEED, token_bonding.key().as_ref()],
        bump = token_bonding.target_mint_authority_bump_seed,
    )]
    pub target_mint_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<SellV1>, args: SellV1Args) -> Result<()> {
    let bonding = &ctx.accounts.token_bonding;

    if bonding.sell_frozen {
        return err!(ErrorCode::SellFrozen);
    }
    let now = ctx.accounts.clock.unix_timestamp;
    if now < bonding.go_live_unix_time {
        return err!(ErrorCode::NotLiveYet);
    }

    // Resolve current curve piece (same logic as buy_v1).
    let curve_def = match &ctx.accounts.curve.definition {
        PiecewiseCurve::TimeV0 { curves } => {
            let elapsed = (now - bonding.go_live_unix_time).max(0) as u64;
            let mut chosen = &curves[0];
            for piece in curves.iter() {
                if piece.offset <= elapsed {
                    chosen = piece;
                }
            }
            chosen
        }
    };
    let exp_curve = match &curve_def.curve {
        PrimitiveCurve::ExponentialCurveV0 { c, b, pow, frac } => ExponentialCurveV0 {
            c: *c,
            b: *b,
            pow: *pow,
            frac: *frac,
        },
        PrimitiveCurve::ConstantPriceCurveV0 { price } => ExponentialCurveV0 {
            c: 0,
            b: (*price as u128) * crate::curve::precise_number::ONE_PREC,
            pow: 1,
            frac: 1,
        },
    };

    let current_supply = if bonding.ignore_external_supply_changes {
        bonding.supply_from_bonding
    } else {
        ctx.accounts.target_mint.supply
    };

    if args.target_amount > current_supply {
        return err!(ErrorCode::ArithmeticUnderflow);
    }

    // base_out = R(S) - R(S - amount) = price_for_tokens at the lower supply.
    let new_supply = current_supply - args.target_amount;
    let base_out = price_for_tokens(&exp_curve, new_supply, args.target_amount)?;

    // Royalty split (same convention as buy).
    let sell_base_royalty = ((base_out as u128)
        * bonding.sell_base_royalty_percentage as u128
        / 10_000u128) as u64;
    let sell_target_royalty = ((args.target_amount as u128)
        * bonding.sell_target_royalty_percentage as u128
        / 10_000u128) as u64;

    let base_to_seller = base_out
        .checked_sub(sell_base_royalty)
        .ok_or(error!(ErrorCode::ArithmeticUnderflow))?;
    let amount_to_burn = args
        .target_amount
        .checked_sub(sell_target_royalty)
        .ok_or(error!(ErrorCode::ArithmeticUnderflow))?;

    if let Some(min_base) = args.slippage_min_base {
        if base_to_seller < min_base {
            return err!(ErrorCode::SlippageExceeded);
        }
    }

    // Reserve solvency check — we should never overdraw the storage.
    if base_out > ctx.accounts.base_storage.amount {
        return err!(ErrorCode::InsolventReserve);
    }

    // Burn the bulk of the seller's tokens.
    if amount_to_burn > 0 {
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.target_mint.to_account_info(),
                    from: ctx.accounts.source.to_account_info(),
                    authority: ctx.accounts.seller.to_account_info(),
                },
            ),
            amount_to_burn,
        )?;
    }

    // The target-side royalty is implemented as: burn the full amount from the
    // seller, then mint the royalty back to the royalty account. We already
    // only burned `amount_to_burn`, so the remaining `sell_target_royalty`
    // tokens still sit in the seller's account — we need to *transfer* those
    // to the royalty destination instead of minting fresh ones, to keep total
    // supply consistent with the curve.
    if sell_target_royalty > 0 {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.source.to_account_info(),
                    to: ctx.accounts.sell_target_royalties.to_account_info(),
                    authority: ctx.accounts.seller.to_account_info(),
                },
            ),
            sell_target_royalty,
        )?;
        // Suppress unused-import warning when royalty == 0.
        let _ = MintTo {
            mint: ctx.accounts.target_mint.to_account_info(),
            to: ctx.accounts.sell_target_royalties.to_account_info(),
            authority: ctx.accounts.target_mint_authority.to_account_info(),
        };
    }

    // Transfer base out of storage to seller (and royalty destination).
    let bonding_key = ctx.accounts.token_bonding.key();
    let storage_bump = ctx.accounts.token_bonding.reserve_authority_bump_seed;
    let signer_seeds: &[&[&[u8]]] = &[&[
        TokenBondingV0::STORAGE_AUTHORITY_SEED,
        bonding_key.as_ref(),
        &[storage_bump],
    ]];

    if sell_base_royalty > 0 {
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.base_storage.to_account_info(),
                    to: ctx.accounts.sell_base_royalties.to_account_info(),
                    authority: ctx.accounts.base_storage_authority.to_account_info(),
                },
                signer_seeds,
            ),
            sell_base_royalty,
        )?;
    }
    if base_to_seller > 0 {
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.base_storage.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                    authority: ctx.accounts.base_storage_authority.to_account_info(),
                },
                signer_seeds,
            ),
            base_to_seller,
        )?;
    }

    // Update virtual counters. We model the royalty target tokens as still
    // circulating (they were transferred, not burned) — only `amount_to_burn`
    // leaves the curve domain.
    let bonding = &mut ctx.accounts.token_bonding;
    bonding.supply_from_bonding = bonding
        .supply_from_bonding
        .checked_sub(amount_to_burn)
        .ok_or(error!(ErrorCode::ArithmeticUnderflow))?;
    bonding.reserve_balance_from_bonding = bonding
        .reserve_balance_from_bonding
        .checked_sub(base_out)
        .ok_or(error!(ErrorCode::ArithmeticUnderflow))?;

    Ok(())
}
