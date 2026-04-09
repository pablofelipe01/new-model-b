/**
 * Off-chain mirror of `programs/spl-token-bonding/src/curve/exponential.rs`.
 *
 * Used by the frontend to render previews and quote prices instantly without
 * round-tripping to the chain. The math here uses native `number` (float64),
 * which is fine for previews but **must not** be used for actual settlement —
 * the on-chain U192 calculation is the source of truth for transactions.
 *
 * Convention: `c` and `b` here are *human-scaled* (i.e. `1.0`, not the raw
 * fixed-point `1_000_000_000_000`). The `bnFromHuman` / `humanFromBn` helpers
 * bridge this representation with the on-chain BN form.
 */
import BN from "bn.js";

import { PRECISION, type ExponentialCurve } from "./types";

/** Human-readable curve params for off-chain math (no fixed-point scaling). */
export interface CurveParams {
  c: number;
  b: number;
  pow: number;
  frac: number;
}

/** Spot price `P(S) = c * S^(pow/frac) + b`. */
export function currentPrice(curve: CurveParams, supply: number): number {
  if (curve.frac === 0) throw new Error("frac must be non-zero");
  return curve.c * Math.pow(supply, curve.pow / curve.frac) + curve.b;
}

/** `R(S)` — total reserve required to back supply `S`. */
export function reserveForSupply(curve: CurveParams, supply: number): number {
  if (supply <= 0) return 0;
  const k = curve.pow / curve.frac;
  return (curve.c * Math.pow(supply, k + 1)) / (k + 1) + curve.b * supply;
}

/** Cost of buying `amount` tokens starting from `supply`. */
export function buyTargetAmount(
  curve: CurveParams,
  supply: number,
  amount: number,
): number {
  return reserveForSupply(curve, supply + amount) - reserveForSupply(curve, supply);
}

/**
 * Tokens received when spending `baseAmount` starting from `supply`. Solved
 * by bisection — robust against any monotonic curve.
 */
export function buyBaseAmount(
  curve: CurveParams,
  supply: number,
  baseAmount: number,
): number {
  if (baseAmount <= 0) return 0;
  const r0 = reserveForSupply(curve, supply);
  const target = r0 + baseAmount;

  let low = 0;
  let high = 1;
  while (reserveForSupply(curve, supply + high) < target) {
    high *= 2;
    if (!Number.isFinite(high)) throw new Error("baseAmount overflows curve domain");
  }
  for (let i = 0; i < 80; i++) {
    const mid = (low + high) / 2;
    if (reserveForSupply(curve, supply + mid) > target) high = mid;
    else low = mid;
    if (high - low < 1e-9) break;
  }
  return low;
}

/** Sample the curve at `n` evenly-spaced points up to `maxSupply`. */
export function generateCurvePoints(
  curve: CurveParams,
  maxSupply: number,
  points = 100,
): { supply: number; price: number; reserveTotal: number }[] {
  const out: { supply: number; price: number; reserveTotal: number }[] = [];
  for (let i = 0; i <= points; i++) {
    const supply = (maxSupply * i) / points;
    out.push({
      supply,
      price: currentPrice(curve, supply),
      reserveTotal: reserveForSupply(curve, supply),
    });
  }
  return out;
}

/** Common presets ready to drop into the launch UI. */
export const CURVES: Record<string, CurveParams> = {
  sqrt: { c: 1, pow: 1, frac: 2, b: 0 },
  linear: { c: 1, pow: 1, frac: 1, b: 0 },
  quadratic: { c: 1, pow: 2, frac: 1, b: 0 },
  fixed: { c: 0, pow: 1, frac: 1, b: 1 },
};

// ── BN bridges ────────────────────────────────────────────────────────────

const PRECISION_BN = new BN(PRECISION.toString());

/** Convert a human number to a raw fixed-point `BN` (× PRECISION). */
export function humanToRaw(n: number): BN {
  // Use a string round-trip to dodge float precision loss for nice numbers.
  const fixed = n.toFixed(12);
  const [intPart, fracPart = ""] = fixed.split(".");
  const padded = (fracPart + "000000000000").slice(0, 12);
  return new BN(intPart + padded);
}

/** Convert a raw fixed-point BN back to a human number. */
export function rawToHuman(raw: BN): number {
  const div = raw.div(PRECISION_BN).toNumber();
  const mod = raw.mod(PRECISION_BN).toNumber() / Number(PRECISION);
  return div + mod;
}

/** Build an `ExponentialCurve` (raw form) from human params. */
export function toExponentialCurve(p: CurveParams): ExponentialCurve {
  return { c: humanToRaw(p.c), b: humanToRaw(p.b), pow: p.pow, frac: p.frac };
}
