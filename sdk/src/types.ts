/**
 * TypeScript mirrors of the Anchor account & arg structs.
 *
 * These are kept hand-written rather than generated from the IDL so the SDK
 * can be consumed without first running `anchor build`. Once the program is
 * built, replace `unknown` in `Program<unknown>` with the generated IDL type.
 */
import type { PublicKey } from "@solana/web3.js";
import type BN from "bn.js";

/** Fixed-point precision used by both on-chain and off-chain math. */
export const PRECISION = 1_000_000_000_000n;

/** Basis-points denominator. 10_000 == 100%. */
export const BPS_DENOMINATOR = 10_000;

// ── Curve definitions ──────────────────────────────────────────────────────

export interface ExponentialCurve {
  /** P(S) = c * S^(pow/frac) + b. `c` and `b` are RAW (already × PRECISION). */
  c: BN;
  b: BN;
  pow: number;
  frac: number;
}

/**
 * Wire format of the `PrimitiveCurve` enum. Anchor encodes struct variants
 * by spreading the field names directly under the variant key, so the
 * shape mirrors the on-chain Rust enum field-by-field rather than
 * wrapping in a sub-struct.
 */
export type PrimitiveCurve =
  | { exponentialCurveV0: { c: BN; b: BN; pow: number; frac: number } }
  | { constantPriceCurveV0: { price: BN } };

export interface TimeCurve {
  offset: BN;
  curve: PrimitiveCurve;
  buyTransitionFees: TransitionFee | null;
  sellTransitionFees: TransitionFee | null;
}

export interface TransitionFee {
  percentage: number;
  interval: number;
}

export type PiecewiseCurve = { timeV0: { curves: TimeCurve[] } };

// ── Account types ──────────────────────────────────────────────────────────

export interface ProgramStateV0 {
  wrappedSolMint: PublicKey;
  solStorage: PublicKey;
  bumpSeed: number;
}

export interface CurveV0 {
  definition: PiecewiseCurve;
}

export interface TokenBondingV0 {
  baseMint: PublicKey;
  targetMint: PublicKey;
  generalAuthority: PublicKey | null;
  reserveAuthority: PublicKey | null;
  curveAuthority: PublicKey | null;
  baseStorage: PublicKey;
  buyBaseRoyalties: PublicKey;
  buyTargetRoyalties: PublicKey;
  sellBaseRoyalties: PublicKey;
  sellTargetRoyalties: PublicKey;
  buyBaseRoyaltyPercentage: number;
  buyTargetRoyaltyPercentage: number;
  sellBaseRoyaltyPercentage: number;
  sellTargetRoyaltyPercentage: number;
  curve: PublicKey;
  mintCap: BN | null;
  purchaseCap: BN | null;
  goLiveUnixTime: BN;
  freezeBuyUnixTime: BN | null;
  createdAtUnixTime: BN;
  buyFrozen: boolean;
  sellFrozen: boolean;
  index: number;
  bumpSeed: number;
  baseStorageBumpSeed: number;
  targetMintAuthorityBumpSeed: number;
  reserveAuthorityBumpSeed: number;
  reserveBalanceFromBonding: BN;
  supplyFromBonding: BN;
  ignoreExternalReserveChanges: boolean;
  ignoreExternalSupplyChanges: boolean;
}
