//! Buy tokens along the bonding curve.
//!
//! Two modes — exactly one must be set:
//!   * `desired_target_amount` — fix the tokens received, compute base cost.
//!   * `base_amount`           — fix the base spent, compute tokens out.
//!
//! Royalty handling: a percentage of the base spend goes to
//! `buy_base_royalties`, and a percentage of the tokens minted goes to
//! `buy_target_royalties`. The royalty target tokens come *out* of the user's
//! mint amount (i.e. the same total supply increment, just split).
//!
//! Slippage: `slippage_max_base` (when buying tokens-out fixed) or
//! `slippage_min_target` (when buying base-fixed) bounds the worst direction.

use crate::curve::exponential::{price_for_tokens, tokens_for_price};
use crate::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct BuyV1Args {
    pub desired_target_amount: Option<u64>,
    pub base_amount: Option<u64>,
    pub slippage_max_base: Option<u64>,
    pub slippage_min_target: Option<u64>,
}

#[derive(Accounts)]
pub struct BuyV1<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

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

    /// CHECK: PDA, validated by seeds. Used as mint authority signer.
    #[account(
        seeds = [TokenBondingV0::MINT_AUTHORITY_SEED, token_bonding.key().as_ref()],
        bump = token_bonding.target_mint_authority_bump_seed,
    )]
    pub target_mint_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        address = token_bonding.base_storage @ ErrorCode::InvalidAccount,
    )]
    pub base_storage: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        address = token_bonding.buy_base_royalties @ ErrorCode::InvalidAccount,
    )]
    pub buy_base_royalties: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        address = token_bonding.buy_target_royalties @ ErrorCode::InvalidAccount,
    )]
    pub buy_target_royalties: Box<Account<'info, TokenAccount>>,

    /// Source of base tokens spent by the buyer.
    #[account(mut, token::mint = base_mint, token::authority = payer)]
    pub source: Box<Account<'info, TokenAccount>>,
    /// Destination of newly minted target tokens.
    #[account(mut, token::mint = target_mint)]
    pub destination: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<BuyV1>, args: BuyV1Args) -> Result<()> {
    // 1. State checks ------------------------------------------------------
    let bonding = &ctx.accounts.token_bonding;
    let now = ctx.accounts.clock.unix_timestamp;

    if bonding.buy_frozen {
        return err!(ErrorCode::BuyFrozen);
    }
    if now < bonding.go_live_unix_time {
        return err!(ErrorCode::NotLiveYet);
    }
    if let Some(freeze_at) = bonding.freeze_buy_unix_time {
        if now >= freeze_at {
            return err!(ErrorCode::BuyWindowClosed);
        }
    }

    // 2. Resolve current curve & supply -----------------------------------
    let curve_def = match &ctx.accounts.curve.definition {
        PiecewiseCurve::TimeV0 { curves } => {
            let elapsed = (now - bonding.go_live_unix_time).max(0) as u64;
            // Pick the latest piece whose offset has been reached.
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
        PrimitiveCurve::ConstantPriceCurveV0 { price } => {
            // Treat constant as `c=0, b=price` so the rest of the math works.
            ExponentialCurveV0 {
                c: 0,
                b: (*price as u128) * crate::curve::precise_number::ONE_PREC,
                pow: 1,
                frac: 1,
            }
        }
    };

    let current_supply = if bonding.ignore_external_supply_changes {
        bonding.supply_from_bonding
    } else {
        ctx.accounts.target_mint.supply
    };

    // 3. Compute amounts ---------------------------------------------------
    let (target_amount, base_needed): (u64, u64) =
        match (args.desired_target_amount, args.base_amount) {
            (Some(_), Some(_)) => return err!(ErrorCode::AmbiguousBuyArgs),
            (None, None) => return err!(ErrorCode::MissingBuyArgs),
            (Some(t), None) => {
                let cost = price_for_tokens(&exp_curve, current_supply, t)?;
                (t, cost)
            }
            (None, Some(b)) => {
                let t = tokens_for_price(&exp_curve, current_supply, b)?;
                (t, b)
            }
        };

    if let Some(cap) = bonding.purchase_cap {
        if target_amount > cap {
            return err!(ErrorCode::PurchaseCapExceeded);
        }
    }
    if let Some(cap) = bonding.mint_cap {
        let new_supply = current_supply
            .checked_add(target_amount)
            .ok_or(error!(ErrorCode::ArithmeticOverflow))?;
        if new_supply > cap {
            return err!(ErrorCode::MintCapExceeded);
        }
    }

    // 4. Royalty splits ----------------------------------------------------
    let buy_base_royalty = ((base_needed as u128)
        * bonding.buy_base_royalty_percentage as u128
        / 10_000u128) as u64;
    let buy_target_royalty = ((target_amount as u128)
        * bonding.buy_target_royalty_percentage as u128
        / 10_000u128) as u64;

    let base_to_reserve = base_needed
        .checked_sub(buy_base_royalty)
        .ok_or(error!(ErrorCode::ArithmeticUnderflow))?;
    let target_to_buyer = target_amount
        .checked_sub(buy_target_royalty)
        .ok_or(error!(ErrorCode::ArithmeticUnderflow))?;

    // 5. Slippage checks ---------------------------------------------------
    if let Some(max_base) = args.slippage_max_base {
        if base_needed > max_base {
            return err!(ErrorCode::SlippageExceeded);
        }
    }
    if let Some(min_target) = args.slippage_min_target {
        if target_amount < min_target {
            return err!(ErrorCode::SlippageExceeded);
        }
    }

    // 6. Transfer base from buyer -----------------------------------------
    if buy_base_royalty > 0 {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.source.to_account_info(),
                    to: ctx.accounts.buy_base_royalties.to_account_info(),
                    authority: ctx.accounts.payer.to_account_info(),
                },
            ),
            buy_base_royalty,
        )?;
    }
    if base_to_reserve > 0 {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.source.to_account_info(),
                    to: ctx.accounts.base_storage.to_account_info(),
                    authority: ctx.accounts.payer.to_account_info(),
                },
            ),
            base_to_reserve,
        )?;
    }

    // 7. Mint target tokens (royalty + buyer) ------------------------------
    let bonding_key = ctx.accounts.token_bonding.key();
    let mint_auth_bump = ctx.accounts.token_bonding.target_mint_authority_bump_seed;
    let signer_seeds: &[&[&[u8]]] = &[&[
        TokenBondingV0::MINT_AUTHORITY_SEED,
        bonding_key.as_ref(),
        &[mint_auth_bump],
    ]];

    if buy_target_royalty > 0 {
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.target_mint.to_account_info(),
                    to: ctx.accounts.buy_target_royalties.to_account_info(),
                    authority: ctx.accounts.target_mint_authority.to_account_info(),
                },
                signer_seeds,
            ),
            buy_target_royalty,
        )?;
    }
    if target_to_buyer > 0 {
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.target_mint.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                    authority: ctx.accounts.target_mint_authority.to_account_info(),
                },
                signer_seeds,
            ),
            target_to_buyer,
        )?;
    }

    // 8. Track virtual reserve & supply -----------------------------------
    let bonding = &mut ctx.accounts.token_bonding;
    bonding.supply_from_bonding = bonding
        .supply_from_bonding
        .checked_add(target_amount)
        .ok_or(error!(ErrorCode::ArithmeticOverflow))?;
    bonding.reserve_balance_from_bonding = bonding
        .reserve_balance_from_bonding
        .checked_add(base_to_reserve)
        .ok_or(error!(ErrorCode::ArithmeticOverflow))?;

    Ok(())
}
