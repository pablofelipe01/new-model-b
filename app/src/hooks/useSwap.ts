"use client";

import BN from "bn.js";
import { ComputeBudgetProgram, PublicKey } from "@solana/web3.js";
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
 *
 * Uses manual sign → send → confirm instead of AnchorProvider.sendAndConfirm
 * because the latter throws "Unknown action 'undefined'" on Anchor 0.31
 * with custom wallet adapters (including the Privy bridge).
 */
export function useSwap(tokenBonding?: PublicKey | string) {
  const { sdk } = useSdk();
  const [state, setState] = useState<SwapState>({
    buying: false,
    selling: false,
    error: undefined,
  });

  async function sendTx(
    tx: import("@solana/web3.js").Transaction,
  ): Promise<string> {
    if (!sdk) throw new Error("SDK not ready");
    const connection = sdk.provider.connection;
    const wallet = sdk.provider.wallet;

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");
    // Prepend a compute budget increase — the fee model does 3 transfers +
    // mint + curve math which can exceed the 200k CU default.
    const budgetIx = ComputeBudgetProgram.setComputeUnitLimit({
      units: 400_000,
    });
    tx.instructions.unshift(budgetIx);

    tx.recentBlockhash = blockhash;
    tx.lastValidBlockHeight = lastValidBlockHeight;
    tx.feePayer = wallet.publicKey;

    const signed = await wallet.signTransaction(tx);
    const sig = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: true,
    });
    const conf = await connection.confirmTransaction(
      { signature: sig, blockhash, lastValidBlockHeight },
      "confirmed",
    );
    if (conf.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(conf.value.err)}`);
    }
    return sig;
  }

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
      return await sendTx(tx);
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
      return await sendTx(tx);
    } catch (err) {
      setState((s) => ({ ...s, error: err as Error }));
      throw err;
    } finally {
      setState((s) => ({ ...s, selling: false }));
    }
  }

  return { ...state, buy, sell };
}
