"use client";

import { buyBaseAmount, buyTargetAmount, type CurveParams } from "@new-model-b/sdk";
import BN from "bn.js";
import { useMemo, useState } from "react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { useSwap } from "@/hooks/useSwap";
import { formatNumber } from "@/lib/utils";

interface Props {
  tokenBonding: string;
  curve: CurveParams;
  currentSupply: number;
  baseSymbol: string;
  targetSymbol: string;
  targetDecimals: number;
  baseDecimals: number;
}

type Mode = "buy" | "sell";

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
  const { t, lang } = useLanguage();

  const targetFactor = Math.pow(10, targetDecimals);
  const baseFactor = Math.pow(10, baseDecimals);

  // On BUY the input is the USDC amount to spend; on SELL it's the token
  // quantity to sell.
  const numericHuman = Number(amount) || 0;

  const quote = useMemo(() => {
    if (numericHuman <= 0) return { tokensHuman: 0, baseHuman: 0, perTokenHuman: 0 };
    if (mode === "buy") {
      // input = USDC to spend → how many tokens it buys.
      const tokensHuman = buyBaseAmount(curve, currentSupply, numericHuman);
      return {
        tokensHuman,
        baseHuman: numericHuman,
        perTokenHuman: tokensHuman > 0 ? numericHuman / tokensHuman : 0,
      };
    }
    // input = tokens to sell → how much USDC you get back.
    const baseHuman = buyTargetAmount(
      curve,
      Math.max(currentSupply - numericHuman, 0),
      numericHuman,
    );
    return {
      tokensHuman: numericHuman,
      baseHuman,
      perTokenHuman: numericHuman > 0 ? baseHuman / numericHuman : 0,
    };
  }, [mode, numericHuman, curve, currentSupply]);

  async function onSubmit() {
    if (numericHuman <= 0) return;
    if (mode === "buy") {
      // Spend exactly this much USDC (base units).
      const baseAmountBn = new BN(Math.floor(numericHuman * baseFactor));
      await swap.buy(baseAmountBn, "base", slippage);
    } else {
      const tokenAmountBn = new BN(Math.floor(numericHuman * targetFactor));
      await swap.sell(tokenAmountBn, slippage);
    }
  }

  return (
    <div className="trade-panel">
      {/* Buy / Sell tabs */}
      <div className="trade-tabs">
        {(["buy", "sell"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`tt ${mode === m ? "active" : ""}`}
          >
            {m === "buy" ? t.buy : t.sell}
          </button>
        ))}
      </div>

      {/* Amount input — buy: USDC to spend · sell: tokens to sell */}
      <label className="input-label">
        {mode === "buy"
          ? `${t.amountToSpend} (${baseSymbol})`
          : `${t.quantity} (${targetSymbol})`}
      </label>
      <input
        type="number"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0"
        className="input"
        style={{
          fontSize: 22,
          fontWeight: 500,
          fontVariantNumeric: "tabular-nums",
          marginBottom: 16,
        }}
      />

      {/* Summary */}
      <div className="summary">
        <div className="sm-row">
          <span style={{ color: "var(--text-secondary)" }}>
            {mode === "buy" ? t.youReceive : t.youGet}
          </span>
          <span className="num">
            {mode === "buy"
              ? `${formatNumber(quote.tokensHuman, 4)} ${targetSymbol}`
              : `${formatNumber(quote.baseHuman, 6)} ${baseSymbol}`}
          </span>
        </div>
        <div className="sm-row">
          <span style={{ color: "var(--text-secondary)" }}>
            {t.price} / {targetSymbol}
          </span>
          <span className="num">
            {formatNumber(quote.perTokenHuman, 4)} {baseSymbol}
          </span>
        </div>
      </div>

      {/* Slippage */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <span className="muted-small">Slippage</span>
        {[0.005, 0.01, 0.05].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSlippage(s)}
            className={`chip ${slippage === s ? "on" : ""}`}
            style={{ flex: "none", padding: "4px 10px" }}
          >
            {(s * 100).toFixed(s < 0.01 ? 1 : 0)}%
          </button>
        ))}
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={swap.buying || swap.selling || numericHuman <= 0}
        className="btn btn-primary btn-full"
      >
        {swap.buying || swap.selling
          ? "Submitting…"
          : mode === "buy"
            ? t.confirmBuy
            : t.confirmSell}
      </button>

      {swap.error && (
        <p className="muted-small" style={{ color: "var(--state-danger)", marginTop: 8 }}>
          {swap.error.message}
        </p>
      )}

    </div>
  );
}
