"use client";

import BN from "bn.js";
import { ComputeBudgetProgram, PublicKey } from "@solana/web3.js";
import { useState } from "react";

import { useSdk } from "@/components/providers/SdkProvider";
import { sponsoredSend, FEE_PAYER } from "@/lib/sponsoredSend";

interface SwapState {
  buying: boolean;
  selling: boolean;
  error: Error | undefined;
}

/**
 * Trade execution helper. Wraps the SDK's `buy`/`sell` and tracks the
 * pending state so the UI can show spinners.
 *
 * All transactions go through the gas sponsorship relay so users don't
 * need SOL for gas — only USDC for the trade itself.
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
        rentPayer: FEE_PAYER ?? undefined,
      });

      // buy_v1 does U192 Newton's method + 4 CPI calls — needs extra compute.
      const budgetIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 600_000,
      });
      tx.instructions.unshift(budgetIx);

      return await sponsoredSend(tx, sdk.provider.wallet, sdk.provider.connection);
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
      const tx = await sdk.sell({
        tokenBonding: pk,
        targetAmount: amount,
        slippage,
        rentPayer: FEE_PAYER ?? undefined,
      });

      const budgetIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 600_000,
      });
      tx.instructions.unshift(budgetIx);

      return await sponsoredSend(tx, sdk.provider.wallet, sdk.provider.connection);
    } catch (err) {
      setState((s) => ({ ...s, error: err as Error }));
      throw err;
    } finally {
      setState((s) => ({ ...s, selling: false }));
    }
  }

  return { ...state, buy, sell };
}
