"use client";

import { buyBaseAmount, buyTargetAmount, type CurveParams } from "@new-model-b/sdk";
import BN from "bn.js";
import { useMemo, useState } from "react";

import { useSwap } from "@/hooks/useSwap";
import { cn, formatNumber } from "@/lib/utils";

interface Props {
  tokenBonding: string;
  /**
   * Curve parameters in HUMAN units. The page is responsible for
   * inverting the on-chain decimal scaling before passing the curve
   * down (see `scaleCurveOnChainToHuman`).
   */
  curve: CurveParams;
  /** Current supply in HUMAN token units (NOT raw lamports). */
  currentSupply: number;
  baseSymbol: string;
  targetSymbol: string;
  /** Decimals of the target mint — used to convert the user's input to raw before sending on-chain. */
  targetDecimals: number;
  /** Decimals of the base mint. Currently unused but kept for symmetry / future formatting. */
  baseDecimals: number;
}

type Mode = "buy" | "sell";

/**
 * Trade panel with buy/sell toggle. The user types human-readable token
 * amounts (e.g. `1.5`) which we convert to raw smallest units before
 * sending on-chain, mirroring how every wallet UI on Solana works.
 */
export function SwapPanel({
  tokenBonding,
  curve,
  currentSupply,
  baseSymbol,
  targetSymbol,
  targetDecimals,
  baseDecimals,
}: Props) {
  const [mode, setMode] = useState<Mode>("buy");
  const [amount, setAmount] = useState<string>("0");
  const [slippage, setSlippage] = useState<number>(0.01);
  const swap = useSwap(tokenBonding);

  const targetFactor = Math.pow(10, targetDecimals);
  // `baseDecimals` is no longer used here because all of the math now
  // happens in HUMAN units — the curve, the supply and the quote are
  // all human-scaled by the page that owns this panel. We still keep
  // the prop in the API in case future formatting wants it.
  void baseDecimals;

  const numericHuman = Number(amount) || 0;

  // Off-chain quote operates entirely in human units now. The only
  // raw conversion happens at the boundary, when we hand the amount
  // to the SDK as a `BN`.
  const quote = useMemo(() => {
    if (numericHuman <= 0) return { baseHuman: 0, perTokenHuman: 0 };
    let baseHuman: number;
    if (mode === "buy") {
      baseHuman = buyTargetAmount(curve, currentSupply, numericHuman);
    } else {
      baseHuman = buyTargetAmount(
        curve,
        Math.max(currentSupply - numericHuman, 0),
        numericHuman,
      );
    }
    return { baseHuman, perTokenHuman: baseHuman / numericHuman };
  }, [mode, numericHuman, curve, currentSupply]);

  async function onSubmit() {
    if (numericHuman <= 0) return;
    // `1` token entered by the user → `1 * 10^targetDecimals` raw
    // lamports on-chain. Floor to drop any sub-lamport remainder
    // introduced by float arithmetic.
    const amountBn = new BN(Math.floor(numericHuman * targetFactor));
    if (mode === "buy") {
      await swap.buy(amountBn, "tokens", slippage);
    } else {
      await swap.sell(amountBn, slippage);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div
        aria-label="Trade mode"
        className="mb-4 flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800"
      >
        {(["buy", "sell"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-label={`Switch to ${m} mode`}
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 rounded-md py-2 text-sm font-medium capitalize transition",
              mode === m
                ? "bg-white text-zinc-900 shadow dark:bg-zinc-700 dark:text-white"
                : "text-zinc-500",
            )}
          >
            {m}
          </button>
        ))}
      </div>

      <label
        htmlFor="swap-amount"
        className="mb-1 block text-xs uppercase tracking-wide text-zinc-500"
      >
        Amount ({targetSymbol})
      </label>
      <input
        id="swap-amount"
        type="number"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        aria-label={`Amount in ${targetSymbol}`}
        placeholder="0"
        className="mb-4 w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-lg font-medium focus:border-brand-500 focus:outline-none dark:border-zinc-700"
      />

      <dl className="mb-4 space-y-1 text-sm">
        <div className="flex justify-between text-zinc-500">
          <dt>{mode === "buy" ? "You pay" : "You receive"}</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-100">
            {formatNumber(quote.baseHuman, 6)} {baseSymbol}
          </dd>
        </div>
        <div className="flex justify-between text-zinc-500">
          <dt>Avg price / {targetSymbol}</dt>
          <dd>
            {formatNumber(quote.perTokenHuman, 8)} {baseSymbol}
          </dd>
        </div>
      </dl>

      <div
        aria-label="Slippage tolerance"
        className="mb-4 flex items-center gap-2 text-xs"
      >
        <span className="text-zinc-500">Slippage</span>
        {[0.005, 0.01, 0.05].map((s) => (
          <button
            key={s}
            type="button"
            aria-label={`${(s * 100).toFixed(s < 0.01 ? 1 : 0)} percent slippage`}
            onClick={() => setSlippage(s)}
            className={cn(
              "rounded px-2 py-1",
              slippage === s
                ? "bg-brand-500 text-white"
                : "bg-zinc-100 dark:bg-zinc-800",
            )}
          >
            {(s * 100).toFixed(s < 0.01 ? 1 : 0)}%
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={swap.buying || swap.selling || numericHuman <= 0}
        aria-label={mode === "buy" ? "Buy tokens" : "Sell tokens"}
        className="w-full rounded-xl bg-brand-500 py-3 font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {swap.buying || swap.selling ? "Submitting…" : mode === "buy" ? "Buy" : "Sell"}
      </button>

      {swap.error && (
        <p className="mt-2 text-xs text-red-500">{swap.error.message}</p>
      )}
    </div>
  );
}
