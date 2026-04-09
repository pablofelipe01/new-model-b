"use client";

import { buyBaseAmount, buyTargetAmount, type CurveParams } from "@new-model-b/sdk";
import BN from "bn.js";
import { useMemo, useState } from "react";

import { useSwap } from "@/hooks/useSwap";
import { cn, formatNumber } from "@/lib/utils";

interface Props {
  tokenBonding: string;
  curve: CurveParams;
  /** On-chain supply in raw smallest units. */
  currentSupply: number;
  baseSymbol: string;
  targetSymbol: string;
  /** Decimals of the target mint — used to convert between human and raw amounts. */
  targetDecimals: number;
  /** Decimals of the base mint — used to render the cost / proceeds. */
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
  const baseFactor = Math.pow(10, baseDecimals);

  // The user types in human units. The on-chain math operates on raw
  // smallest units, so we multiply through `targetFactor` for both the
  // off-chain quote and the BN passed to the SDK. The displayed cost
  // is converted back to human units via `baseFactor`.
  const numericHuman = Number(amount) || 0;
  const numericRaw = numericHuman * targetFactor;

  const quote = useMemo(() => {
    if (numericRaw <= 0) return { baseHuman: 0, perTokenHuman: 0 };
    let baseRaw: number;
    if (mode === "buy") {
      baseRaw = buyTargetAmount(curve, currentSupply, numericRaw);
    } else {
      baseRaw = buyTargetAmount(
        curve,
        Math.max(currentSupply - numericRaw, 0),
        numericRaw,
      );
    }
    const baseHuman = baseRaw / baseFactor;
    return { baseHuman, perTokenHuman: baseHuman / numericHuman };
  }, [mode, numericRaw, numericHuman, curve, currentSupply, baseFactor]);

  async function onSubmit() {
    if (numericRaw <= 0) return;
    const amountBn = new BN(Math.floor(numericRaw));
    if (mode === "buy") {
      await swap.buy(amountBn, "tokens", slippage);
    } else {
      await swap.sell(amountBn, slippage);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        {(["buy", "sell"] as const).map((m) => (
          <button
            key={m}
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

      <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-500">
        Amount ({targetSymbol})
      </label>
      <input
        type="number"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
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

      <div className="mb-4 flex items-center gap-2 text-xs">
        <span className="text-zinc-500">Slippage</span>
        {[0.005, 0.01, 0.05].map((s) => (
          <button
            key={s}
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
        onClick={onSubmit}
        disabled={swap.buying || swap.selling || numericHuman <= 0}
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
