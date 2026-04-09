"use client";

import { currentPrice, type CurveParams } from "@new-model-b/sdk";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";

import { useSdk } from "@/components/providers/SdkProvider";

import { useTokenBonding } from "./useTokenBonding";

/**
 * Spot price for a bonding curve token, refreshed at `pollMs` intervals.
 * Computes off-chain so this is sub-millisecond after the initial fetch.
 */
export function useBondedPrice(
  key?: PublicKey | string,
  pollMs = 10_000,
): { price: number | undefined; loading: boolean } {
  const { sdk } = useSdk();
  const { tokenBonding, loading } = useTokenBonding(key);
  const [price, setPrice] = useState<number | undefined>();

  useEffect(() => {
    if (!sdk || !tokenBonding) return;
    let cancelled = false;

    async function refresh() {
      try {
        if (!tokenBonding) return;
        const curve = await sdk!.getCurve(tokenBonding.curve);
        if (!curve) return;
        const piece = curve.definition.timeV0.curves[0]?.curve;
        if (!piece || !("exponentialCurveV0" in piece)) return;
        const e = piece.exponentialCurveV0;
        const params: CurveParams = {
          c: rawToHumanNumber(e.c.toString()),
          b: rawToHumanNumber(e.b.toString()),
          pow: e.pow,
          frac: e.frac,
        };
        const supplyInfo = await sdk!.provider.connection.getTokenSupply(
          tokenBonding.targetMint,
        );
        const supply = Number(supplyInfo.value.amount);
        if (cancelled) return;
        setPrice(currentPrice(params, supply));
      } catch {
        // swallow — UI shows "—"
      }
    }

    refresh();
    const id = setInterval(refresh, pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [sdk, tokenBonding, pollMs]);

  return { price, loading };
}

function rawToHumanNumber(s: string): number {
  if (s.length <= 12) return Number("0." + s.padStart(12, "0"));
  return Number(s.slice(0, -12) + "." + s.slice(-12));
}
