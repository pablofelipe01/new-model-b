//! # spl-token-bonding
//!
//! Configurable bonding curve protocol for Solana SPL tokens, inspired by
//! Strata Protocol. Lets anyone create an SPL token whose price is determined
//! by a deterministic curve `P(S) = c * S^(pow/frac) + b`. Buys mint new
//! supply against a base-token reserve, sells burn supply and return base
//! tokens out of the reserve. The reserve is always >= the integral of the
//! curve, guaranteeing solvency by construction.

use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey;

pub mod curve;
pub mod errors;
pub mod instructions;
pub mod state;

pub use errors::ErrorCode;
pub use instructions::*;
pub use state::*;

declare_id!("41nppqSazESeBmrgnud2j5Nz1MbsnPGeyAryPcKAefqa");

/// Platform master wallet. Receives the one-time launch fee and the 0.5% per-trade
/// platform fee. Hardcoded so that any auditor can verify the recipient by reading
/// the source: the program has no instruction that can change this.
pub const MASTER_WALLET: Pubkey = pubkey!("CQ4n8D3ThynAdKyqiQifo9k79sumBWtNRHZH1TCk2BZ1");

/// Base mint accepted as the reserve currency. Currently devnet USDC.
/// To migrate to mainnet, replace with `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
/// and redeploy.
pub const USDC_MINT: Pubkey = pubkey!("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

/// One-time launch fee charged to the creator on `initialize_token_bonding_v0`.
/// 25 USDC, with USDC's 6 decimals.
pub const LAUNCH_FEE_USDC: u64 = 25_000_000;

/// Platform fee charged on every buy and sell, in basis points (50 = 0.5%).
pub const PLATFORM_FEE_BPS: u16 = 50;

/// Hard cap on the launcher-configurable fee, in basis points (500 = 5%).
pub const LAUNCHER_FEE_BPS_MAX: u16 = 500;

#[program]
pub mod spl_token_bonding {
    use super::*;

    /// Initialize the global program state. Idempotent: callable once.
    pub fn initialize_program_v0(
        ctx: Context<InitializeProgramV0>,
        args: InitializeProgramArgsV0,
    ) -> Result<()> {
        instructions::initialize_program::handler(ctx, args)
    }

    /// Create a reusable curve definition account.
    pub fn create_curve_v0(ctx: Context<CreateCurveV0>, args: CreateCurveArgsV0) -> Result<()> {
        instructions::create_curve::handler(ctx, args)
    }

    /// Initialize a token bonding tied to a (base_mint, target_mint, curve).
    /// If `target_mint` is freshly created, the bonding's PDA mint authority
    /// becomes its mint authority.
    pub fn initialize_token_bonding_v0(
        ctx: Context<InitializeTokenBondingV0>,
        args: InitializeTokenBondingArgsV0,
    ) -> Result<()> {
        instructions::init_token_bonding::handler(ctx, args)
    }

    /// Update authorities, royalty destinations, freeze flags.
    pub fn update_token_bonding_v0(
        ctx: Context<UpdateTokenBondingV0>,
        args: UpdateTokenBondingArgsV0,
    ) -> Result<()> {
        instructions::update_token_bonding::handler(ctx, args)
    }

    /// Buy tokens along the curve. Either fix `desired_target_amount` and
    /// compute the base cost, or fix `base_amount` and compute the tokens out.
    pub fn buy_v1(ctx: Context<BuyV1>, args: BuyV1Args) -> Result<()> {
        instructions::buy_v1::handler(ctx, args)
    }

    /// Sell tokens back along the curve.
    pub fn sell_v1(ctx: Context<SellV1>, args: SellV1Args) -> Result<()> {
        instructions::sell_v1::handler(ctx, args)
    }
}
