"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import BN from "bn.js";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useSdk } from "@/components/providers/SdkProvider";
import { useSwap } from "@/hooks/useSwap";

// Dynamic import to avoid SSR issues with MoonPay
const MoonPayBuyWidget = dynamic(
  () => import("@moonpay/moonpay-react").then((mod) => mod.MoonPayBuyWidget),
  { ssr: false },
);

const MOONPAY_PK = process.env.NEXT_PUBLIC_MOONPAY_PK || "";

/**
 * "Buy with card" — frictionless flow:
 *
 *  1. User clicks "Buy with card" on a token page
 *  2. MoonPay widget opens (overlay) → user pays with card
 *  3. MoonPay deposits USDC in user's embedded wallet
 *  4. Widget closes → auto-triggers token buy
 *  5. Privy sign popup → user approves → has tokens
 */
export function BuyWithCard({
  onSuccess,
  amount,
  tokenBonding,
  targetDecimals,
}: {
  onSuccess?: () => void;
  amount?: number;
  tokenBonding?: string;
  targetDecimals?: number;
}) {
  const { lang } = useLanguage();
  const { sdk, ready } = useSdk();
  const [showWidget, setShowWidget] = useState(false);
  const [status, setStatus] = useState<"idle" | "paying" | "buying" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const swap = useSwap(tokenBonding);

  const walletAddress = sdk?.provider.wallet.publicKey.toBase58() ?? "";

  const handleOpen = useCallback(() => {
    if (!ready || !walletAddress) {
      setError(lang === "es" ? "Conecta tu billetera primero" : "Connect your wallet first");
      return;
    }
    setError(null);
    setShowWidget(true);
    setStatus("paying");
  }, [ready, walletAddress, lang]);

  // Auto-buy after MoonPay completes
  useEffect(() => {
    if (status !== "buying" || !tokenBonding || !sdk) return;

    let cancelled = false;

    (async () => {
      try {
        // Wait for USDC to settle on-chain
        await new Promise((r) => setTimeout(r, 3000));

        const { getAssociatedTokenAddressSync } = await import("@solana/spl-token");
        const { USDC_MINT } = await import("@new-model-b/sdk");
        const userAta = getAssociatedTokenAddressSync(USDC_MINT, sdk.provider.wallet.publicKey);
        const balance = await sdk.provider.connection
          .getTokenAccountBalance(userAta)
          .then((r) => Number(r.value.uiAmount))
          .catch(() => 0);

        if (cancelled) return;
        if (balance <= 0) {
          setError(lang === "es" ? "No se detectaron fondos aún. Espera un momento y compra manualmente." : "Funds not detected yet. Wait a moment and buy manually.");
          setStatus("idle");
          return;
        }

        const decimals = targetDecimals ?? 9;
        const factor = Math.pow(10, decimals);
        const usdcToSpend = Math.min(balance, amount ?? balance);
        const rawAmount = Math.floor(usdcToSpend * factor);

        await swap.buy(new BN(rawAmount), "base", 0.05);

        if (!cancelled) {
          setStatus("done");
          onSuccess?.();
        }
      } catch (err) {
        if (cancelled) return;
        const raw = (err as Error).message || "";
        console.error("[BuyWithCard auto-buy]", raw);
        setError(
          lang === "es"
            ? "La compra automática falló. Tu USDC está en tu billetera — puedes comprar manualmente."
            : "Auto-buy failed. Your USDC is in your wallet — you can buy manually."
        );
        setStatus("idle");
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, tokenBonding]);

  const statusLabel = {
    idle: lang === "es" ? "Comprar con tarjeta" : "Buy with card",
    paying: lang === "es" ? "Procesando pago…" : "Processing payment…",
    buying: lang === "es" ? "Comprando tokens…" : "Buying tokens…",
    done: lang === "es" ? "Compra exitosa" : "Purchase complete",
  };

  if (!MOONPAY_PK) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={!ready || status === "buying" || status === "paying"}
        className="btn btn-secondary btn-full"
        style={{ fontSize: 14, padding: "12px 20px" }}
      >
        {statusLabel[status]}
      </button>

      {error && (
        <p className="muted-small" style={{ color: "var(--state-danger)", marginTop: 8 }}>
          {error}
        </p>
      )}

      {status === "done" && (
        <p className="muted-small" style={{ color: "var(--state-success)", marginTop: 8 }}>
          {lang === "es" ? "Tokens comprados con éxito." : "Tokens purchased successfully."}
        </p>
      )}

      {showWidget && walletAddress && (
        <MoonPayBuyWidget
          variant="overlay"
          baseCurrencyCode="usd"
          currencyCode="usdc_sol"
          walletAddress={walletAddress}
          theme="dark"
          colorCode="#6062E8"
          language={lang}
          baseCurrencyAmount={amount?.toString()}
          visible={showWidget}
          onUrlSignatureRequested={async (url: string) => {
            // Server-side signing required for walletAddress
            const res = await fetch("/api/moonpay-sign", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ urlForSignature: url }),
            });
            const data = await res.json();
            return data.signature;
          }}
          onCloseOverlay={() => {
            setShowWidget(false);
            if (status === "paying") {
              setStatus("buying");
            }
          }}
        />
      )}
    </>
  );
}
