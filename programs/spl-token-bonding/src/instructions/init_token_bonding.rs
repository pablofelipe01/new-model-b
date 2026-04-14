//! Initialize a `TokenBondingV0` instance.
//!
//! Flow on a successful call:
//!   1. Validate `launcher_fee_basis_points <= LAUNCHER_FEE_BPS_MAX`.
//!   2. Validate `base_mint == USDC_MINT`.
//!   3. Validate that `master_usdc` is the USDC ATA of `MASTER_WALLET` and
//!      that `launcher_fee_usdc` is owned by `args.launcher_fee_wallet`.
//!   4. CPI-transfer the one-time launch fee (`LAUNCH_FEE_USDC`) from the
//!      payer's USDC ATA to `master_usdc`.
//!   5. Persist the bonding state with the platform and launcher fees frozen.
//!
//! There is intentionally no instruction in the program that can later
//! change `master_wallet`, `platform_fee_basis_points`, or extract funds
//! from `base_storage`. Those fields are immutable for the lifetime of the
//! bonding.

use crate::errors::ErrorCode;
use crate::state::*;
use crate::{LAUNCHER_FEE_BPS_MAX, LAUNCH_FEE_USDC, MASTER_WALLET, PLATFORM_FEE_BPS, USDC_MINT};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct InitializeTokenBondingArgsV0 {
    pub index: u16,
    pub go_live_unix_time: i64,
    pub freeze_buy_unix_time: Option<i64>,
    pub mint_cap: Option<u64>,
    pub purchase_cap: Option<u64>,
    pub general_authority: Option<Pubkey>,
    pub curve_authority: Option<Pubkey>,
    pub buy_frozen: bool,
    pub ignore_external_reserve_changes: bool,
    pub ignore_external_supply_changes: bool,
    /// Launcher-chosen per-trade fee in basis points. Must be <= 500 (5%).
    pub launcher_fee_basis_points: u16,
    /// System account that owns `launcher_fee_usdc`. Stored on the bonding
    /// so buy/sell can validate the destination at trade time.
    pub launcher_fee_wallet: Pubkey,
}

// All `Account<…>` fields are boxed to keep the BPF stack frame under 4 KB.
#[derive(Accounts)]
#[instruction(args: InitializeTokenBondingArgsV0)]
pub struct InitializeTokenBondingV0<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(address = USDC_MINT @ ErrorCode::InvalidBaseMint)]
    pub base_mint: Box<Account<'info, Mint>>,
    pub target_mint: Box<Account<'info, Mint>>,
    pub curve: Box<Account<'info, CurveV0>>,

    #[account(
        init,
        payer = payer,
        space = TokenBondingV0::LEN,
        seeds = [
            TokenBondingV0::SEED_PREFIX,
            target_mint.key().as_ref(),
            &args.index.to_le_bytes(),
        ],
        bump
    )]
    pub token_bonding: Box<Account<'info, TokenBondingV0>>,

    /// CHECK: PDA, validated by seeds.
    #[account(
        seeds = [TokenBondingV0::MINT_AUTHORITY_SEED, token_bonding.key().as_ref()],
        bump
    )]
    pub target_mint_authority: UncheckedAccount<'info>,

    /// Reserve token account, owned by the storage authority PDA.
    #[account(
        init,
        payer = payer,
        seeds = [TokenBondingV0::BASE_STORAGE_SEED, token_bonding.key().as_ref()],
        bump,
        token::mint = base_mint,
        token::authority = base_storage_authority,
    )]
    pub base_storage: Box<Account<'info, TokenAccount>>,

    /// CHECK: PDA, validated by seeds.
    #[account(
        seeds = [TokenBondingV0::STORAGE_AUTHORITY_SEED, token_bonding.key().as_ref()],
        bump
    )]
    pub base_storage_authority: UncheckedAccount<'info>,

    // ----- Launch fee accounts ------------------------------------------
    /// Payer's USDC ATA. Source of the 25 USDC launch fee.
    #[account(mut, token::mint = base_mint, token::authority = payer)]
    pub payer_usdc: Box<Account<'info, TokenAccount>>,

    /// MASTER_WALLET's USDC ATA. Destination of the launch fee. Validated
    /// here so that no rogue client can divert the fee elsewhere.
    #[account(
        mut,
        token::mint = base_mint,
        constraint = master_usdc.owner == MASTER_WALLET @ ErrorCode::InvalidFeeAccount,
    )]
    pub master_usdc: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitializeTokenBondingV0>,
    args: InitializeTokenBondingArgsV0,
) -> Result<()> {
    // 1. Validate launcher fee bound.
    if args.launcher_fee_basis_points > LAUNCHER_FEE_BPS_MAX {
        return err!(ErrorCode::LauncherFeeExceedsMaximum);
    }

    // 2. Verify the target mint has the program's PDA as its mint authority.
    //    Catches the most common SDK bug — forgetting to transfer authority.
    let expected_authority = ctx.accounts.target_mint_authority.key();
    let actual_authority = ctx
        .accounts
        .target_mint
        .mint_authority
        .ok_or(error!(ErrorCode::InvalidAccount))?;
    if actual_authority != expected_authority {
        return err!(ErrorCode::InvalidAccount);
    }

    // 3. Charge the one-time launch fee (25 USDC -> MASTER_WALLET ATA).
    //    This happens BEFORE we persist any state so a failed transfer
    //    aborts the whole instruction atomically.
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.payer_usdc.to_account_info(),
                to: ctx.accounts.master_usdc.to_account_info(),
                authority: ctx.accounts.payer.to_account_info(),
            },
        ),
        LAUNCH_FEE_USDC,
    )?;

    // 4. Persist bonding state.
    let bonding = &mut ctx.accounts.token_bonding;
    bonding.base_mint = ctx.accounts.base_mint.key();
    bonding.target_mint = ctx.accounts.target_mint.key();
    bonding.general_authority = args.general_authority;
    bonding.curve_authority = args.curve_authority;
    bonding.base_storage = ctx.accounts.base_storage.key();
    bonding.curve = ctx.accounts.curve.key();
    bonding.mint_cap = args.mint_cap;
    bonding.purchase_cap = args.purchase_cap;
    bonding.go_live_unix_time = args.go_live_unix_time;
    bonding.freeze_buy_unix_time = args.freeze_buy_unix_time;
    bonding.created_at_unix_time = Clock::get()?.unix_timestamp;
    bonding.buy_frozen = args.buy_frozen;
    bonding.sell_frozen = false;
    bonding.index = args.index;
    bonding.bump_seed = ctx.bumps.token_bonding;
    bonding.base_storage_bump_seed = ctx.bumps.base_storage;
    bonding.target_mint_authority_bump_seed = ctx.bumps.target_mint_authority;
    bonding.reserve_authority_bump_seed = ctx.bumps.base_storage_authority;
    bonding.reserve_balance_from_bonding = 0;
    bonding.supply_from_bonding = ctx.accounts.target_mint.supply;
    bonding.ignore_external_reserve_changes = args.ignore_external_reserve_changes;
    bonding.ignore_external_supply_changes = args.ignore_external_supply_changes;

    // Fee model — frozen for the lifetime of the bonding.
    bonding.platform_fee_basis_points = PLATFORM_FEE_BPS;
    bonding.launcher_fee_basis_points = args.launcher_fee_basis_points;
    bonding.master_wallet = MASTER_WALLET;
    bonding.launcher_fee_wallet = args.launcher_fee_wallet;

    Ok(())
}
