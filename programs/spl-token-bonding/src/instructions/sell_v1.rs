//! Sell tokens back along the curve.
//!
//! Flow on a successful call:
//!   1. Burn the seller's `target_amount` tokens.
//!   2. Compute `base_out_gross` from the curve (the integral over the burned
//!      slice of supply).
//!   3. Skim `platform_fee` and `launcher_fee` from the gross, both transferred
//!      out of `base_storage` to their respective ATAs.
//!   4. Transfer `base_out_net = base_out_gross - platform_fee - launcher_fee`
//!      to the seller.
//!
//! All four moves out of `base_storage` (3 transfers + 0 fresh mints) are
//! signed by the storage authority PDA. There is no other path that can
//! withdraw from `base_storage`.

use crate::curve::exponential::price_for_tokens;
use crate::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};

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

    /// MASTER_WALLET's USDC ATA. Receives the platform fee.
    #[account(
        mut,
        token::mint = base_mint,
        constraint = master_usdc.owner == token_bonding.master_wallet @ ErrorCode::InvalidFeeAccount,
    )]
    pub master_usdc: Box<Account<'info, TokenAccount>>,

    /// Launcher's USDC ATA. Receives the launcher fee.
    #[account(
        mut,
        token::mint = base_mint,
        constraint = launcher_usdc.owner == token_bonding.launcher_fee_wallet @ ErrorCode::InvalidFeeAccount,
    )]
    pub launcher_usdc: Box<Account<'info, TokenAccount>>,

    /// Source of target tokens being sold (seller's ATA).
    #[account(mut, token::mint = target_mint, token::authority = seller)]
    pub source: Box<Account<'info, TokenAccount>>,
    /// Destination of base tokens (seller's base ATA).
    #[account(mut, token::mint = base_mint)]
    pub destination: Box<Account<'info, TokenAccount>>,

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

    // base_out_gross = R(S) - R(S - amount) = price_for_tokens at the lower supply.
    let new_supply = current_supply
        .checked_sub(args.target_amount)
        .ok_or(error!(ErrorCode::ArithmeticUnderflow))?;
    let base_out_gross = price_for_tokens(&exp_curve, new_supply, args.target_amount)?;

    // Fees skimmed from the gross. The seller receives the net.
    let platform_bps = bonding.platform_fee_basis_points as u128;
    let launcher_bps = bonding.launcher_fee_basis_points as u128;
    let platform_fee: u64 = ((base_out_gross as u128)
        .checked_mul(platform_bps)
        .ok_or(error!(ErrorCode::ArithmeticOverflow))?
        / 10_000)
        .try_into()
        .map_err(|_| error!(ErrorCode::U64ConversionFailed))?;
    let launcher_fee: u64 = ((base_out_gross as u128)
        .checked_mul(launcher_bps)
        .ok_or(error!(ErrorCode::ArithmeticOverflow))?
        / 10_000)
        .try_into()
        .map_err(|_| error!(ErrorCode::U64ConversionFailed))?;
    let base_out_net = base_out_gross
        .checked_sub(platform_fee)
        .ok_or(error!(ErrorCode::ArithmeticUnderflow))?
        .checked_sub(launcher_fee)
        .ok_or(error!(ErrorCode::ArithmeticUnderflow))?;

    if let Some(min_base) = args.slippage_min_base {
        if base_out_net < min_base {
            return err!(ErrorCode::SlippageExceeded);
        }
    }

    // Reserve solvency check — never overdraw the storage.
    if base_out_gross > ctx.accounts.base_storage.amount {
        return err!(ErrorCode::InsolventReserve);
    }

    // 1. Burn the seller's tokens. Tokens leave the curve domain BEFORE any
    //    base flows out, so an early failure leaves the system in a state
    //    that still satisfies the solvency invariant.
    if args.target_amount > 0 {
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.target_mint.to_account_info(),
                    from: ctx.accounts.source.to_account_info(),
                    authority: ctx.accounts.seller.to_account_info(),
                },
            ),
            args.target_amount,
        )?;
    }

    // 2. Pay out base from storage: platform fee, launcher fee, then seller.
    let bonding_key = ctx.accounts.token_bonding.key();
    let storage_bump = ctx.accounts.token_bonding.reserve_authority_bump_seed;
    let signer_seeds: &[&[&[u8]]] = &[&[
        TokenBondingV0::STORAGE_AUTHORITY_SEED,
        bonding_key.as_ref(),
        &[storage_bump],
    ]];

    if platform_fee > 0 {
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.base_storage.to_account_info(),
                    to: ctx.accounts.master_usdc.to_account_info(),
                    authority: ctx.accounts.base_storage_authority.to_account_info(),
                },
                signer_seeds,
            ),
            platform_fee,
        )?;
    }
    if launcher_fee > 0 {
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.base_storage.to_account_info(),
                    to: ctx.accounts.launcher_usdc.to_account_info(),
                    authority: ctx.accounts.base_storage_authority.to_account_info(),
                },
                signer_seeds,
            ),
            launcher_fee,
        )?;
    }
    if base_out_net > 0 {
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
            base_out_net,
        )?;
    }

    // 3. Update virtual counters. Both supply and reserve drop atomically.
    let bonding = &mut ctx.accounts.token_bonding;
    bonding.supply_from_bonding = bonding
        .supply_from_bonding
        .checked_sub(args.target_amount)
        .ok_or(error!(ErrorCode::ArithmeticUnderflow))?;
    bonding.reserve_balance_from_bonding = bonding
        .reserve_balance_from_bonding
        .checked_sub(base_out_gross)
        .ok_or(error!(ErrorCode::ArithmeticUnderflow))?;

    Ok(())
}
