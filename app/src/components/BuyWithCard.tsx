"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import BN from "bn.js";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useSdk } from "@/components/providers/SdkProvider";
import { useSwap } from "@/hooks/useSwap";
import { PublicKey } from "@solana/web3.js";

/**
 * "Buy with card" — one-click flow:
 *
 *  1. User clicks "Buy with card" on a token page
 *  2. Stripe Onramp opens → user pays with card
 *  3. USDC arrives in embedded wallet
 *  4. Auto-triggers token buy → Privy sign popup
 *  5. User approves → has tokens
 *
 * Two interactions total: card + approve. No confusion.
 */
export function BuyWithCard({
  onSuccess,
  amount,
  tokenBonding,
  targetDecimals,
}: {
  onSuccess?: () => void;
  amount?: number;
  /** If provided, auto-buy this token after USDC arrives */
  tokenBonding?: string;
  /** Decimals of the target token (for computing raw amount) */
  targetDecimals?: number;
}) {
  const { lang } = useLanguage();
  const { sdk, ready } = useSdk();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "paying" | "buying" | "done">("idle");
  const containerRef = useRef<HTMLDivElement>(null);
  const swap = useSwap(tokenBonding);

  const createSession = useCallback(async () => {
    if (!sdk || !ready) return;
    setLoading(true);
    setError(null);
    setStatus("idle");

    try {
      const walletAddress = sdk.provider.wallet.publicKey.toBase58();
      const res = await fetch("/api/create-onramp-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create session");
      setClientSecret(data.clientSecret);
      setOpen(true);
      setStatus("paying");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [sdk, ready, amount]);

  // Mount Stripe onramp widget
  useEffect(() => {
    if (!open || !clientSecret || !containerRef.current) return;
    let mounted = true;

    (async () => {
      try {
        const { loadStripeOnramp } = await import("@stripe/crypto");
        const stripeOnramp = await loadStripeOnramp(
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
        );
        if (!stripeOnramp || !mounted || !containerRef.current) return;

        containerRef.current.innerHTML = "";
        const session = stripeOnramp.createSession({
          clientSecret,
          appearance: { theme: "dark" },
        });

        session.addEventListener("onramp_session_updated", (e: unknown) => {
          const evt = e as { payload?: { session?: { status?: string } } };
          const sessionStatus = evt?.payload?.session?.status;

          if (sessionStatus === "fulfillment_complete" && mounted) {
            // USDC arrived — close Stripe widget and auto-buy
            setStatus("buying");
            setOpen(false);
            setClientSecret(null);
          }
        });

        session.mount(containerRef.current);
      } catch (err) {
        console.error("Failed to load Stripe onramp:", err);
        if (mounted) setError("Failed to load payment widget");
      }
    })();

    return () => { mounted = false; };
  }, [open, clientSecret]);

  // Auto-buy after USDC arrives
  useEffect(() => {
    if (status !== "buying" || !tokenBonding || !sdk) return;

    (async () => {
      try {
        // Wait a moment for USDC to be confirmed on-chain
        await new Promise((r) => setTimeout(r, 2000));

        // Check how much USDC arrived
        const { getAssociatedTokenAddressSync } = await import("@solana/spl-token");
        const { USDC_MINT } = await import("@new-model-b/sdk");
        const userAta = getAssociatedTokenAddressSync(
          USDC_MINT,
          sdk.provider.wallet.publicKey,
        );
        const balance = await sdk.provider.connection
          .getTokenAccountBalance(userAta)
          .then((r) => Number(r.value.uiAmount))
          .catch(() => 0);

        if (balance <= 0) {
          setError(lang === "es" ? "No se detectaron fondos. Intenta de nuevo." : "No funds detected. Try again.");
          setStatus("idle");
          return;
        }

        // Use the USDC balance to buy tokens via the bonding curve.
        // The swap hook handles the full flow including gas sponsorship.
        // We buy by base amount (USDC), not by token amount.
        const decimals = targetDecimals ?? 9;
        const factor = Math.pow(10, decimals);

        // Estimate how many tokens we can get for this USDC
        // (rough — the on-chain program will compute exact)
        const usdcToSpend = Math.min(balance, amount ?? balance);
        // We pass baseAmount mode — SDK will compute tokens off-chain
        const rawAmount = Math.floor(usdcToSpend * factor);

        await swap.buy(new BN(rawAmount), "base", 0.05);

        setStatus("done");
        onSuccess?.();
      } catch (err) {
        const raw = (err as Error).message || "";
        console.error("[BuyWithCard auto-buy]", raw);
        if (raw.includes("Custom\":1") || raw.includes("insufficient")) {
          setError(lang === "es" ? "Fondos insuficientes para la compra." : "Insufficient funds for purchase.");
        } else {
          setError(lang === "es" ? "La compra falló. Tu USDC está en tu billetera — puedes comprar manualmente." : "Purchase failed. Your USDC is in your wallet — you can buy manually.");
        }
        setStatus("idle");
      }
    })();
  }, [status, tokenBonding, sdk, swap, amount, targetDecimals, lang, onSuccess]);

  const statusLabel = {
    idle: lang === "es" ? "Comprar con tarjeta" : "Buy with card",
    paying: lang === "es" ? "Procesando pago…" : "Processing payment…",
    buying: lang === "es" ? "Comprando tokens…" : "Buying tokens…",
    done: lang === "es" ? "Compra exitosa" : "Purchase complete",
  };

  return (
    <>
      <button
        type="button"
        onClick={createSession}
        disabled={loading || !ready || status === "buying" || status === "paying"}
        className="btn btn-secondary btn-full"
        style={{ fontSize: 14, padding: "12px 20px" }}
      >
        {loading ? "..." : statusLabel[status]}
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

      {open &&
        createPortal(
          <div
            className="modal-backdrop"
            onClick={() => {
              setOpen(false);
              setClientSecret(null);
              setStatus("idle");
            }}
          >
            <div
              className="modal"
              style={{ maxWidth: 480, padding: 0, overflow: "hidden" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="modal-close"
                style={{ zIndex: 10, top: 12, right: 12 }}
                onClick={() => {
                  setOpen(false);
                  setClientSecret(null);
                  setStatus("idle");
                }}
              >
                ✕
              </button>
              <div
                ref={containerRef}
                style={{ minHeight: 400, background: "var(--color-ink)" }}
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
