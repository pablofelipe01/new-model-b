//! Initialize a `TokenBondingV0` instance.
//!
//! The caller passes in the base mint, an existing curve, and a target mint
//! whose mint authority is the program's `mint-authority` PDA. (The frontend /
//! SDK is responsible for creating the target mint and assigning authority
//! before calling this — keeping the on-chain footprint smaller.)

use crate::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct InitializeTokenBondingArgsV0 {
    pub index: u16,
    pub go_live_unix_time: i64,
    pub freeze_buy_unix_time: Option<i64>,
    pub buy_base_royalty_percentage: u32,
    pub buy_target_royalty_percentage: u32,
    pub sell_base_royalty_percentage: u32,
    pub sell_target_royalty_percentage: u32,
    pub mint_cap: Option<u64>,
    pub purchase_cap: Option<u64>,
    pub general_authority: Option<Pubkey>,
    pub reserve_authority: Option<Pubkey>,
    pub curve_authority: Option<Pubkey>,
    pub buy_frozen: bool,
    pub ignore_external_reserve_changes: bool,
    pub ignore_external_supply_changes: bool,
}

// All `Account<…>` fields are boxed because the un-boxed struct frame
// exceeds the BPF 4 KB stack budget — Anchor 0.30 stores `…Bumps` inline
// in the `try_accounts` frame and `TokenBondingV0` + `CurveV0` + 6
// `TokenAccount`s push the total over 6 KB. Box moves the heap pointer
// onto the stack, dropping the per-field cost to 8 bytes.
#[derive(Accounts)]
#[instruction(args: InitializeTokenBondingArgsV0)]
pub struct InitializeTokenBondingV0<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

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

    /// Royalty destinations. Stored as `UncheckedAccount` rather than
    /// `Account<TokenAccount>` to keep the `try_accounts` stack frame
    /// under the 4 KB BPF limit — full deserialization of 4 token
    /// accounts pushes the frame over budget. The buy/sell instructions
    /// re-validate these as `TokenAccount`s when actually used, so the
    /// looser typing here is safe.
    /// CHECK: stored only; validated at buy/sell time.
    pub buy_base_royalties: UncheckedAccount<'info>,
    /// CHECK: stored only; validated at buy/sell time.
    pub buy_target_royalties: UncheckedAccount<'info>,
    /// CHECK: stored only; validated at buy/sell time.
    pub sell_base_royalties: UncheckedAccount<'info>,
    /// CHECK: stored only; validated at buy/sell time.
    pub sell_target_royalties: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    // `rent: Sysvar<'info, Rent>` is intentionally omitted — Anchor 0.30
    // calls `Rent::get()` from the runtime when an `init` constraint
    // needs it, so the explicit field just inflates the `try_accounts`
    // stack frame for no benefit.
}

pub fn handler(
    ctx: Context<InitializeTokenBondingV0>,
    args: InitializeTokenBondingArgsV0,
) -> Result<()> {
    // Sanity-check royalty percentages. 10_000 bps == 100%.
    let bps_max = 10_000u32;
    if args.buy_base_royalty_percentage > bps_max
        || args.buy_target_royalty_percentage > bps_max
        || args.sell_base_royalty_percentage > bps_max
        || args.sell_target_royalty_percentage > bps_max
    {
        return err!(ErrorCode::InvalidRoyalty);
    }

    // Verify the target mint has the program's PDA as its mint authority.
    // This catches the most common SDK bug — forgetting to transfer authority.
    let expected_authority = ctx.accounts.target_mint_authority.key();
    let actual_authority = ctx
        .accounts
        .target_mint
        .mint_authority
        .ok_or(error!(ErrorCode::InvalidAccount))?;
    if actual_authority != expected_authority {
        return err!(ErrorCode::InvalidAccount);
    }

    let bonding = &mut ctx.accounts.token_bonding;
    bonding.base_mint = ctx.accounts.base_mint.key();
    bonding.target_mint = ctx.accounts.target_mint.key();
    bonding.general_authority = args.general_authority;
    bonding.reserve_authority = args.reserve_authority;
    bonding.curve_authority = args.curve_authority;
    bonding.base_storage = ctx.accounts.base_storage.key();
    bonding.buy_base_royalties = ctx.accounts.buy_base_royalties.key();
    bonding.buy_target_royalties = ctx.accounts.buy_target_royalties.key();
    bonding.sell_base_royalties = ctx.accounts.sell_base_royalties.key();
    bonding.sell_target_royalties = ctx.accounts.sell_target_royalties.key();
    bonding.buy_base_royalty_percentage = args.buy_base_royalty_percentage;
    bonding.buy_target_royalty_percentage = args.buy_target_royalty_percentage;
    bonding.sell_base_royalty_percentage = args.sell_base_royalty_percentage;
    bonding.sell_target_royalty_percentage = args.sell_target_royalty_percentage;
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

    Ok(())
}
