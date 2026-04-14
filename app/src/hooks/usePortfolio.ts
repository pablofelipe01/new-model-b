"use client";

import {
  USDC_MINT,
  currentPrice,
  scaleCurveOnChainToHuman,
  type CurveParams,
} from "@new-model-b/sdk";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";

import { useSdk } from "@/components/providers/SdkProvider";

import { useTokenBondings, type BondingRow } from "./useTokenBondings";

/**
 * A bonding row enriched with the connected wallet's position: their
 * token balance (raw + human) and the live curve params needed to drive
 * the inline swap panel.
 */
export interface PortfolioRow extends BondingRow {
  /** User's target-token balance in raw units. */
  userBalanceRaw: number;
  /** User's target-token balance in human units. */
  userBalanceHuman: number;
  /** Current value of the user's position in USDC (price × balance). */
  valueUsdc: number;
  /** Curve params in human units — re-fetched so SwapPanel can use it. */
  curveParams: CurveParams | null;
}

interface State {
  held: PortfolioRow[];
  launched: PortfolioRow[];
  usdcBalance: number;
  loading: boolean;
  error: Error | undefined;
}

/**
 * Derives the connected wallet's dashboard state from the full bondings
 * list: which tokens they hold, which they launched, and their USDC
 * balance. Re-runs whenever the underlying bonding list changes or the
 * wallet reconnects.
 */
export function usePortfolio(): State & { refresh: () => void } {
  const { sdk } = useSdk();
  const { rows, refresh: refreshBondings } = useTokenBondings();
  const [state, setState] = useState<State>({
    held: [],
    launched: [],
    usdcBalance: 0,
    loading: false,
    error: undefined,
  });

  useEffect(() => {
    if (!sdk || rows.length === 0) {
      setState((s) => ({ ...s, held: [], launched: [], loading: false }));
      return;
    }
    const user = sdk.provider.wallet.publicKey;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: undefined }));

    (async () => {
      try {
        // USDC balance first — cheap and always useful.
        const usdcAta = getAssociatedTokenAddressSync(USDC_MINT, user);
        const usdcRaw = await sdk.provider.connection
          .getTokenAccountBalance(usdcAta)
          .then((r) => Number(r.value.amount))
          .catch(() => 0);
        const usdcBalance = usdcRaw / 1_000_000; // USDC is 6 decimals

        const enriched: PortfolioRow[] = await Promise.all(
          rows.map(async (row) => {
            const userAta = getAssociatedTokenAddressSync(
              row.account.targetMint,
              user,
            );
            const userBalanceRaw = await sdk.provider.connection
              .getTokenAccountBalance(userAta)
              .then((r) => Number(r.value.amount))
              .catch(() => 0);
            const userBalanceHuman =
              userBalanceRaw / Math.pow(10, row.targetDecimals);

            // Fetch the curve in human units so the inline swap panel
            // can use it without a second RPC round-trip when the user
            // expands the card.
            const curve = await sdk.getCurve(row.account.curve);
            const piece = curve?.definition.timeV0.curves[0]?.curve;
            let curveParams: CurveParams | null = null;
            if (piece && "exponentialCurveV0" in piece) {
              const e = piece.exponentialCurveV0;
              curveParams = scaleCurveOnChainToHuman(
                {
                  c: rawToHuman(e.c.toString()),
                  b: rawToHuman(e.b.toString()),
                  pow: e.pow,
                  frac: e.frac,
                },
                row.baseDecimals,
                row.targetDecimals,
              );
            }

            const price = curveParams
              ? currentPrice(
                  curveParams,
                  row.supplyRaw / Math.pow(10, row.targetDecimals),
                )
              : row.price ?? 0;
            const valueUsdc = userBalanceHuman * (price ?? 0);

            return {
              ...row,
              userBalanceRaw,
              userBalanceHuman,
              valueUsdc,
              curveParams,
            };
          }),
        );

        if (cancelled) return;
        const held = enriched.filter((r) => r.userBalanceRaw > 0);
        const launched = enriched.filter(
          (r) =>
            r.account.generalAuthority &&
            r.account.generalAuthority.equals(user),
        );
        setState({
          held,
          launched,
          usdcBalance,
          loading: false,
          error: undefined,
        });
      } catch (err) {
        if (cancelled) return;
        setState((s) => ({ ...s, loading: false, error: err as Error }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sdk, rows]);

  return { ...state, refresh: refreshBondings };
}

function rawToHuman(s: string): number {
  if (s.length <= 12) return Number("0." + s.padStart(12, "0"));
  return Number(s.slice(0, -12) + "." + s.slice(-12));
}
