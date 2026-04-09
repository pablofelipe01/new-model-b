"use client";

import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import { useState } from "react";

import { useSdk } from "@/components/providers/SdkProvider";

interface SwapState {
  buying: boolean;
  selling: boolean;
  error: Error | undefined;
}

/**
 * Trade execution helper. Wraps the SDK's `buy`/`sell` and tracks the
 * pending state so the UI can show spinners.
 */
export function useSwap(tokenBonding?: PublicKey | string) {
  const { sdk } = useSdk();
  const [state, setState] = useState<SwapState>({
    buying: false,
    selling: false,
    error: undefined,
  });

  async function buy(amount: BN, mode: "tokens" | "base", slippage = 0.05): Promise<string> {
    if (!sdk || !tokenBonding) throw new Error("SDK or token bonding missing");
    setState((s) => ({ ...s, buying: true, error: undefined }));
    try {
      const pk = typeof tokenBonding === "string" ? new PublicKey(tokenBonding) : tokenBonding;
      const tx = await sdk.buy({
        tokenBonding: pk,
        desiredTargetAmount: mode === "tokens" ? amount : undefined,
        baseAmount: mode === "base" ? amount : undefined,
        slippage,
      });
      // sendAndConfirm sets the recent blockhash + fee payer + signs with
      // the wallet. Doing this in the hook (rather than the SDK) keeps the
      // SDK's `buy` returning a Transaction so future callers can inspect
      // or batch it before sending.
      return await sdk.provider.sendAndConfirm!(tx);
    } catch (err) {
      setState((s) => ({ ...s, error: err as Error }));
      throw err;
    } finally {
      setState((s) => ({ ...s, buying: false }));
    }
  }

  async function sell(amount: BN, slippage = 0.05): Promise<string> {
    if (!sdk || !tokenBonding) throw new Error("SDK or token bonding missing");
    setState((s) => ({ ...s, selling: true, error: undefined }));
    try {
      const pk = typeof tokenBonding === "string" ? new PublicKey(tokenBonding) : tokenBonding;
      const tx = await sdk.sell({ tokenBonding: pk, targetAmount: amount, slippage });
      const sig = await sdk.provider.sendAndConfirm!(tx);
      return sig;
    } catch (err) {
      setState((s) => ({ ...s, error: err as Error }));
      throw err;
    } finally {
      setState((s) => ({ ...s, selling: false }));
    }
  }

  return { ...state, buy, sell };
}
