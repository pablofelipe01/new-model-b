//! On-chain account definitions for `spl-token-bonding`.
//!
//! All structs are versioned with a trailing `V0`. New layouts must bump the
//! version rather than mutating an existing one, so that deserialization stays
//! deterministic across upgrades.

use anchor_lang::prelude::*;

/// Global program state. There is exactly one of these, derived at PDA
/// `["state"]`. Holds canonical references for the wrapped SOL mint and
/// the program's SOL storage.
#[account]
#[derive(Default)]
pub struct ProgramStateV0 {
    pub wrapped_sol_mint: Pubkey,
    pub sol_storage: Pubkey,
    pub bump_seed: u8,
}

impl ProgramStateV0 {
    pub const LEN: usize = 8 + 32 + 32 + 1;
}

/// A reusable curve definition. Token bondings reference a curve account
/// rather than embedding the math, so the same curve can power many bondings.
#[account]
pub struct CurveV0 {
    pub definition: PiecewiseCurve,
}

impl CurveV0 {
    /// Conservative size: discriminator + 1 (enum tag) + 4 (vec len) +
    /// `MAX_CURVE_PIECES` * `TimeCurveV0::SIZE`.
    pub const MAX_CURVE_PIECES: usize = 8;
    pub const LEN: usize = 8 + 1 + 4 + Self::MAX_CURVE_PIECES * TimeCurveV0::SIZE;
}

/// Outer wrapper enum so we can later add `LinearV0`, `LogarithmicV0`, etc.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub enum PiecewiseCurve {
    /// A piecewise curve defined as a sequence of `(offset, primitive)` pairs
    /// where `offset` is the seconds since `go_live_unix_time` at which that
    /// piece becomes active.
    TimeV0 { curves: Vec<TimeCurveV0> },
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct TimeCurveV0 {
    pub offset: u64,
    pub curve: PrimitiveCurve,
    pub buy_transition_fees: Option<TransitionFeeV0>,
    pub sell_transition_fees: Option<TransitionFeeV0>,
}

impl TimeCurveV0 {
    /// Worst-case size in bytes: 8 (offset) + PrimitiveCurve max + 2 *
    /// (1 + TransitionFee). Use a generous upper bound.
    pub const SIZE: usize = 8 + PrimitiveCurve::MAX_SIZE + 2 * (1 + TransitionFeeV0::SIZE);
}

/// We avoid tuple variants on enums that cross the IDL boundary because
/// Anchor 0.30+ encodes tuple variant fields as positional `_0` keys in
/// the TS coder, which is easy to mis-serialize from the client. Inlining
/// the named fields makes the wire format unambiguous on both sides.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub enum PrimitiveCurve {
    ExponentialCurveV0 {
        c: u128,
        b: u128,
        pow: u8,
        frac: u8,
    },
    ConstantPriceCurveV0 {
        price: u64,
    },
}

impl PrimitiveCurve {
    /// Largest variant size + 1 byte for the discriminant.
    pub const MAX_SIZE: usize = 1 + ExponentialCurveV0::SIZE;
}

/// `P(S) = c * S^(pow/frac) + b`.
///
/// `c` and `b` use 12 fixed decimals (i.e. raw value `1_000_000_000_000` ==
/// `1.0`). The exponent is rational so that we can represent fractional
/// powers like `1/2` (square root) without floating point.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct ExponentialCurveV0 {
    pub c: u128,
    pub b: u128,
    pub pow: u8,
    pub frac: u8,
}

impl ExponentialCurveV0 {
    pub const SIZE: usize = 16 + 16 + 1 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct TransitionFeeV0 {
    /// Fee in basis points. 100 == 1.00%.
    pub percentage: u32,
    /// Time in seconds over which the fee linearly decays to zero.
    pub interval: u32,
}

impl TransitionFeeV0 {
    pub const SIZE: usize = 4 + 4;
}

/// One bonding curve instance. The `(target_mint, index)` pair is unique.
#[account]
pub struct TokenBondingV0 {
    pub base_mint: Pubkey,
    pub target_mint: Pubkey,

    pub general_authority: Option<Pubkey>,
    pub reserve_authority: Option<Pubkey>,
    pub curve_authority: Option<Pubkey>,

    /// Token account holding the base reserves.
    pub base_storage: Pubkey,

    pub buy_base_royalties: Pubkey,
    pub buy_target_royalties: Pubkey,
    pub sell_base_royalties: Pubkey,
    pub sell_target_royalties: Pubkey,

    pub buy_base_royalty_percentage: u32,
    pub buy_target_royalty_percentage: u32,
    pub sell_base_royalty_percentage: u32,
    pub sell_target_royalty_percentage: u32,

    pub curve: Pubkey,

    pub mint_cap: Option<u64>,
    pub purchase_cap: Option<u64>,
    pub go_live_unix_time: i64,
    pub freeze_buy_unix_time: Option<i64>,
    pub created_at_unix_time: i64,

    pub buy_frozen: bool,
    pub sell_frozen: bool,

    pub index: u16,
    pub bump_seed: u8,
    pub base_storage_bump_seed: u8,
    pub target_mint_authority_bump_seed: u8,
    pub reserve_authority_bump_seed: u8,

    /// Virtual reserve / supply tracked by the program. Used when the
    /// real mint can be inflated externally and we still want a stable
    /// curve domain.
    pub reserve_balance_from_bonding: u64,
    pub supply_from_bonding: u64,

    pub ignore_external_reserve_changes: bool,
    pub ignore_external_supply_changes: bool,
}

impl TokenBondingV0 {
    pub const LEN: usize = 8 // discriminator
        + 32 + 32                       // base_mint, target_mint
        + (1 + 32) * 3                  // 3 optional authorities
        + 32                            // base_storage
        + 32 * 4                        // royalty destinations
        + 4 * 4                         // royalty percentages
        + 32                            // curve
        + (1 + 8) * 2                   // optional u64 caps
        + 8                             // go_live
        + (1 + 8)                       // optional freeze_buy
        + 8                             // created_at
        + 1 + 1                         // buy_frozen, sell_frozen
        + 2                             // index
        + 1 * 4                         // 4 bump seeds
        + 8 + 8                         // virtual reserve & supply
        + 1 + 1; // ignore flags

    pub const SEED_PREFIX: &'static [u8] = b"token-bonding";
    pub const MINT_AUTHORITY_SEED: &'static [u8] = b"mint-authority";
    pub const BASE_STORAGE_SEED: &'static [u8] = b"base-storage";
    pub const STORAGE_AUTHORITY_SEED: &'static [u8] = b"storage-authority";
    pub const STATE_SEED: &'static [u8] = b"state";
}
