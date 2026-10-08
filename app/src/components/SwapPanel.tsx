"use client";

import { buyBaseAmount, buyTargetAmount, type CurveParams } from "@new-model-b/sdk";
import BN from "bn.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { useSdk } from "@/components/providers/SdkProvider";
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
  const { sdk } = useSdk();
  // Wallet balances in raw units (null = unknown / not connected). Used to
  // block trades that would fail on-chain with "insufficient funds".
  const [balances, setBalances] = useState<{ base: BN; target: BN } | null>(null);
  // Set when "Max" fills the input, so we send the exact raw balance instead
  // of a float round-trip that could overshoot it.
  const [useMax, setUseMax] = useState(false);

  const refreshBalances = useCallback(async () => {
    if (!sdk) return setBalances(null);
    try {
      const bonding = await sdk.getTokenBonding(new PublicKey(tokenBonding));
      if (!bonding) return setBalances(null);
      const owner = sdk.provider.wallet.publicKey;
      const conn = sdk.provider.connection;
      const read = async (mint: PublicKey) => {
        try {
          const ata = getAssociatedTokenAddressSync(mint, owner);
          return new BN((await conn.getTokenAccountBalance(ata)).value.amount);
        } catch {
          return new BN(0); // ATA doesn't exist yet
        }
      };
      const [base, target] = await Promise.all([
        read(bonding.baseMint),
        read(bonding.targetMint),
      ]);
      setBalances({ base, target });
    } catch {
      setBalances(null);
    }
  }, [sdk, tokenBonding]);

  useEffect(() => {
    void refreshBalances();
  }, [refreshBalances]);

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

  const available = balances ? (mode === "buy" ? balances.base : balances.target) : null;
  const decimals = mode === "buy" ? baseDecimals : targetDecimals;
  const requestedRaw =
    useMax && available
      ? available
      : new BN(Math.floor(numericHuman * (mode === "buy" ? baseFactor : targetFactor)));
  const insufficient = available !== null && requestedRaw.gt(available);

  function rawToHuman(raw: BN, dec: number): string {
    const str = raw.toString().padStart(dec + 1, "0");
    const whole = str.slice(0, str.length - dec);
    const frac = str.slice(str.length - dec).replace(/0+$/, "");
    return frac ? `${whole}.${frac}` : whole;
  }

  async function onSubmit() {
    if (numericHuman <= 0 || insufficient) return;
    try {
      if (mode === "buy") {
        // Spend exactly this much USDC (base units).
        await swap.buy(requestedRaw, "base", slippage);
      } else {
        await swap.sell(requestedRaw, slippage);
      }
      setAmount("0");
      setUseMax(false);
    } finally {
      void refreshBalances();
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
            onClick={() => {
              setMode(m);
              setUseMax(false);
            }}
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
        onChange={(e) => {
          setAmount(e.target.value);
          setUseMax(false);
        }}
        placeholder="0"
        className="input"
        style={{
          fontSize: 22,
          fontWeight: 500,
          fontVariantNumeric: "tabular-nums",
          marginBottom: available ? 6 : 16,
        }}
      />
      {available && (
        <div
          className="muted-small"
          style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}
        >
          <span style={{ color: insufficient ? "var(--state-danger)" : undefined }}>
            {insufficient ? t.insufficientBalance : t.balanceLabel}:{" "}
            {formatNumber(Number(rawToHuman(available, decimals)), mode === "buy" ? 2 : 4)}{" "}
            {mode === "buy" ? baseSymbol : targetSymbol}
          </span>
          <button
            type="button"
            className="chip"
            style={{ flex: "none", padding: "2px 10px" }}
            disabled={available.isZero()}
            onClick={() => {
              setAmount(rawToHuman(available, decimals));
              setUseMax(true);
            }}
          >
            {t.maxAmount}
          </button>
        </div>
      )}

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
        disabled={swap.buying || swap.selling || numericHuman <= 0 || insufficient}
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
