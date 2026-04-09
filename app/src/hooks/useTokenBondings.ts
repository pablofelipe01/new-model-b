"use client";

import {
  currentPrice,
  scaleCurveOnChainToHuman,
  type CurveParams,
  type TokenBondingV0,
} from "@new-model-b/sdk";
import type { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";

import { useSdk } from "@/components/providers/SdkProvider";

/**
 * Single row in the explore grid: a bonding plus enough fetched data to
 * render a card without each card having to issue its own RPC calls.
 */
export interface BondingRow {
  publicKey: PublicKey;
  account: TokenBondingV0;
  /** Spot price computed off-chain from the live curve and supply. */
  price: number | undefined;
  /** Raw on-chain supply (smallest units of the target mint). */
  supplyRaw: number;
}

interface State {
  rows: BondingRow[];
  loading: boolean;
  error: Error | undefined;
}

/**
 * Fetches every TokenBondingV0 the program owns and enriches each one
 * with its spot price + supply. Re-runs on demand via the returned
 * `refresh` function. Designed for the explore page; for a single
 * detail view use `useTokenBonding(key)` instead.
 */
export function useTokenBondings(): State & { refresh: () => void } {
  const { sdk } = useSdk();
  const [state, setState] = useState<State>({
    rows: [],
    loading: false,
    error: undefined,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!sdk) return;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: undefined }));

    (async () => {
      try {
        const bondings = await sdk.listTokenBondings();
        // Cache curve fetches by curve pubkey to avoid hitting the same
        // CurveV0 account once per bonding when several share a curve.
        const curveCache = new Map<string, CurveParams | null>();

        const enriched = await Promise.all(
          bondings.map(async ({ publicKey, account }) => {
            // Pull supply (raw) and the decimals of both mints in
            // parallel so we can convert the on-chain curve back into
            // human units before computing a price.
            const [supplyInfo, targetMintInfo, baseMintInfo] = await Promise.all([
              sdk.provider.connection.getTokenSupply(account.targetMint).catch(() => null),
              sdk.provider.connection.getTokenSupply(account.targetMint).catch(() => null),
              sdk.provider.connection.getTokenSupply(account.baseMint).catch(() => null),
            ]);
            const targetDecimals = targetMintInfo?.value.decimals ?? 9;
            const baseDecimals = baseMintInfo?.value.decimals ?? 9;
            const supplyRaw = supplyInfo
              ? Number(supplyInfo.value.amount)
              : account.supplyFromBonding.toNumber();

            // Cache key includes decimals because the same curve account
            // can be referenced by bondings with different mint decimals,
            // and the human-scaled params differ accordingly.
            const cacheKey = `${account.curve.toBase58()}|${baseDecimals}|${targetDecimals}`;
            let curveParams = curveCache.get(cacheKey) ?? null;
            if (!curveCache.has(cacheKey)) {
              const onChain = await fetchCurveParams(sdk, account.curve);
              curveParams = onChain
                ? scaleCurveOnChainToHuman(onChain, baseDecimals, targetDecimals)
                : null;
              curveCache.set(cacheKey, curveParams);
            }

            const supplyHuman = supplyRaw / Math.pow(10, targetDecimals);
            const price = curveParams
              ? currentPrice(curveParams, supplyHuman)
              : undefined;

            return { publicKey, account, price, supplyRaw } satisfies BondingRow;
          }),
        );

        if (cancelled) return;
        setState({ rows: enriched, loading: false, error: undefined });
      } catch (err) {
        if (cancelled) return;
        setState({ rows: [], loading: false, error: err as Error });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sdk, tick]);

  return { ...state, refresh: () => setTick((t) => t + 1) };
}

/**
 * Pull a CurveV0 from chain and convert its first piece into the
 * human-units `CurveParams` shape used by the off-chain math. Returns
 * `null` if the curve is empty or uses an unsupported variant.
 */
async function fetchCurveParams(
  sdk: NonNullable<ReturnType<typeof useSdk>["sdk"]>,
  key: PublicKey,
): Promise<CurveParams | null> {
  const curve = await sdk.getCurve(key);
  if (!curve) return null;
  const piece = curve.definition.timeV0.curves[0]?.curve;
  if (!piece || !("exponentialCurveV0" in piece)) return null;
  const e = piece.exponentialCurveV0;
  return {
    c: rawToHumanNumber(e.c.toString()),
    b: rawToHumanNumber(e.b.toString()),
    pow: e.pow,
    frac: e.frac,
  };
}

function rawToHumanNumber(s: string): number {
  if (s.length <= 12) return Number("0." + s.padStart(12, "0"));
  return Number(s.slice(0, -12) + "." + s.slice(-12));
}
