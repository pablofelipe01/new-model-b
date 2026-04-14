/**
 * TypeScript mirrors of the Anchor account & arg structs.
 *
 * These are kept hand-written rather than generated from the IDL so the SDK
 * can be consumed without first running `anchor build`. Once the program is
 * built, replace `unknown` in `Program<unknown>` with the generated IDL type.
 */
import { PublicKey } from "@solana/web3.js";
import type BN from "bn.js";

/** Fixed-point precision used by both on-chain and off-chain math. */
export const PRECISION = 1_000_000_000_000n;

/** Basis-points denominator. 10_000 == 100%. */
export const BPS_DENOMINATOR = 10_000;

// ── Platform constants — must mirror the on-chain `lib.rs` constants ─────

/** Platform master wallet. Hardcoded in the program; mirrored here so the
 *  frontend can show it without an extra RPC. */
export const MASTER_WALLET = new PublicKey(
  "CQ4n8D3ThynAdKyqiQifo9k79sumBWtNRHZH1TCk2BZ1",
);

/** Devnet USDC mint accepted as base. Swap for mainnet USDC at deploy. */
export const USDC_MINT = new PublicKey(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
);

/** USDC has 6 decimals. */
export const USDC_DECIMALS = 6;

/** One-time launch fee charged on `initializeTokenBondingV0`, in raw USDC. */
export const LAUNCH_FEE_USDC_RAW = 25_000_000n;

/** Platform per-trade fee, in basis points (50 == 0.5%). */
export const PLATFORM_FEE_BPS = 50;

/** Hard cap on the launcher-configurable per-trade fee, in basis points. */
export const LAUNCHER_FEE_BPS_MAX = 500;

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
  curveAuthority: PublicKey | null;
  baseStorage: PublicKey;
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
  // Fee model
  platformFeeBasisPoints: number;
  launcherFeeBasisPoints: number;
  masterWallet: PublicKey;
  launcherFeeWallet: PublicKey;
}
