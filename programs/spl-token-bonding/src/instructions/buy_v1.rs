//! Buy tokens along the bonding curve.
//!
//! Two modes — exactly one must be set:
//!   * `desired_target_amount` — fix the tokens received, compute base cost.
//!   * `base_amount`           — fix the base spent, compute tokens out.
//!
//! Fee model on every buy:
//!   `platform_fee = base_total * platform_bps / 10_000` -> MASTER_WALLET ATA
//!   `launcher_fee = base_total * launcher_bps / 10_000` -> launcher_fee ATA
//!   `base_to_reserve = base_total - platform_fee - launcher_fee` -> base_storage
//! Only `base_to_reserve` moves the curve. The fees are skimmed BEFORE the
//! reserve calculation so that the curve invariant
//!     reserve_balance >= integral(curve, 0, supply)
//! is preserved.
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

    /// MASTER_WALLET's USDC ATA. Receives the platform fee.
    #[account(
        mut,
        token::mint = base_mint,
        constraint = master_usdc.owner == token_bonding.master_wallet @ ErrorCode::InvalidFeeAccount,
    )]
    pub master_usdc: Box<Account<'info, TokenAccount>>,

    /// Launcher's USDC ATA. Receives the launcher fee. Owner must equal the
    /// `launcher_fee_wallet` recorded on the bonding at init time.
    #[account(
        mut,
        token::mint = base_mint,
        constraint = launcher_usdc.owner == token_bonding.launcher_fee_wallet @ ErrorCode::InvalidFeeAccount,
    )]
    pub launcher_usdc: Box<Account<'info, TokenAccount>>,

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

    // 3. Compute amounts. The caller fixes either tokens-out or base-in;
    //    we resolve the other side AFTER subtracting the fees, so the curve
    //    only ever sees `base_to_reserve`.
    //
    //    Let f = (platform_bps + launcher_bps) / 10_000 be the total fee rate.
    //    Then for any quoted total `base_total`:
    //        base_to_reserve = base_total * (1 - f)
    //    and equivalently
    //        base_total = base_to_reserve / (1 - f)
    //                   = base_to_reserve * 10_000 / (10_000 - platform_bps - launcher_bps)
    let platform_bps = bonding.platform_fee_basis_points as u128;
    let launcher_bps = bonding.launcher_fee_basis_points as u128;
    let total_fee_bps = platform_bps
        .checked_add(launcher_bps)
        .ok_or(error!(ErrorCode::ArithmeticOverflow))?;
    // Defensive: must always be < 10_000 (we cap launcher at 500 and platform at 50).
    if total_fee_bps >= 10_000 {
        return err!(ErrorCode::ArithmeticOverflow);
    }
    let net_bps = 10_000u128 - total_fee_bps;

    let (target_amount, base_total): (u64, u64) =
        match (args.desired_target_amount, args.base_amount) {
            (Some(_), Some(_)) => return err!(ErrorCode::AmbiguousBuyArgs),
            (None, None) => return err!(ErrorCode::MissingBuyArgs),
            (Some(t), None) => {
                // Fixed tokens out: compute reserve cost from curve, then gross
                // up by the fee rate to find the user's total spend.
                let base_to_reserve = price_for_tokens(&exp_curve, current_supply, t)?;
                // base_total = ceil(base_to_reserve * 10_000 / net_bps)
                let numer = (base_to_reserve as u128)
                    .checked_mul(10_000)
                    .ok_or(error!(ErrorCode::ArithmeticOverflow))?;
                let total = numer
                    .checked_add(net_bps - 1)
                    .ok_or(error!(ErrorCode::ArithmeticOverflow))?
                    / net_bps;
                let total_u64: u64 =
                    total.try_into().map_err(|_| error!(ErrorCode::U64ConversionFailed))?;
                (t, total_u64)
            }
            (None, Some(b)) => {
                // Fixed base in: skim fees, hand the remainder to the curve.
                let base_to_reserve_u128 = (b as u128)
                    .checked_mul(net_bps)
                    .ok_or(error!(ErrorCode::ArithmeticOverflow))?
                    / 10_000;
                let base_to_reserve: u64 = base_to_reserve_u128
                    .try_into()
                    .map_err(|_| error!(ErrorCode::U64ConversionFailed))?;
                let t = tokens_for_price(&exp_curve, current_supply, base_to_reserve)?;
                (t, b)
            }
        };

    // Final fee split derived from `base_total` so on-chain accounting is
    // exact regardless of which mode the caller used.
    let platform_fee: u64 = ((base_total as u128)
        .checked_mul(platform_bps)
        .ok_or(error!(ErrorCode::ArithmeticOverflow))?
        / 10_000)
        .try_into()
        .map_err(|_| error!(ErrorCode::U64ConversionFailed))?;
    let launcher_fee: u64 = ((base_total as u128)
        .checked_mul(launcher_bps)
        .ok_or(error!(ErrorCode::ArithmeticOverflow))?
        / 10_000)
        .try_into()
        .map_err(|_| error!(ErrorCode::U64ConversionFailed))?;
    let base_to_reserve = base_total
        .checked_sub(platform_fee)
        .ok_or(error!(ErrorCode::ArithmeticUnderflow))?
        .checked_sub(launcher_fee)
        .ok_or(error!(ErrorCode::ArithmeticUnderflow))?;

    // 4. Caps & slippage --------------------------------------------------
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
    if let Some(max_base) = args.slippage_max_base {
        if base_total > max_base {
            return err!(ErrorCode::SlippageExceeded);
        }
    }
    if let Some(min_target) = args.slippage_min_target {
        if target_amount < min_target {
            return err!(ErrorCode::SlippageExceeded);
        }
    }

    // 5. Move base tokens: platform fee, launcher fee, then reserve. -------
    if platform_fee > 0 {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.source.to_account_info(),
                    to: ctx.accounts.master_usdc.to_account_info(),
                    authority: ctx.accounts.payer.to_account_info(),
                },
            ),
            platform_fee,
        )?;
    }
    if launcher_fee > 0 {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.source.to_account_info(),
                    to: ctx.accounts.launcher_usdc.to_account_info(),
                    authority: ctx.accounts.payer.to_account_info(),
                },
            ),
            launcher_fee,
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

    // 6. Mint target tokens to the buyer -----------------------------------
    let bonding_key = ctx.accounts.token_bonding.key();
    let mint_auth_bump = ctx.accounts.token_bonding.target_mint_authority_bump_seed;
    let signer_seeds: &[&[&[u8]]] = &[&[
        TokenBondingV0::MINT_AUTHORITY_SEED,
        bonding_key.as_ref(),
        &[mint_auth_bump],
    ]];

    if target_amount > 0 {
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
            target_amount,
        )?;
    }

    // 7. Track virtual reserve & supply -----------------------------------
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
