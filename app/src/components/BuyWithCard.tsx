"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useSdk } from "@/components/providers/SdkProvider";

/**
 * "Buy with card" button + Stripe Crypto Onramp modal.
 *
 * Flow:
 *  1. User clicks "Buy with card"
 *  2. We POST to /api/create-onramp-session with their wallet address
 *  3. Stripe returns a clientSecret
 *  4. We load the Stripe onramp widget and mount it in a modal
 *  5. User completes payment in the widget
 *  6. USDC arrives in their wallet (Stripe handles everything)
 *  7. Widget shows success, user closes modal
 *  8. onSuccess callback refreshes balances
 */
export function BuyWithCard({
  onSuccess,
  amount,
}: {
  onSuccess?: () => void;
  amount?: number;
}) {
  const { lang } = useLanguage();
  const { sdk, ready } = useSdk();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const createSession = useCallback(async () => {
    if (!sdk || !ready) return;
    setLoading(true);
    setError(null);

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
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [sdk, ready, amount]);

  // Mount Stripe onramp widget when clientSecret is ready
  useEffect(() => {
    if (!open || !clientSecret || !containerRef.current) return;

    let mounted = true;

    (async () => {
      try {
        // Dynamic import to avoid SSR issues
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
          const status = evt?.payload?.session?.status;
          if (status === "fulfillment_complete") {
            // USDC delivered — close modal and refresh
            setTimeout(() => {
              setOpen(false);
              setClientSecret(null);
              onSuccess?.();
            }, 2000); // Brief delay so user sees "success" in the widget
          }
        });

        session.mount(containerRef.current);
      } catch (err) {
        console.error("Failed to load Stripe onramp:", err);
        if (mounted) setError("Failed to load payment widget");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, clientSecret, onSuccess]);

  return (
    <>
      <button
        type="button"
        onClick={createSession}
        disabled={loading || !ready}
        className="btn btn-secondary btn-full"
        style={{ fontSize: 14, padding: "12px 20px" }}
      >
        {loading
          ? "..."
          : lang === "es"
            ? "Comprar con tarjeta"
            : "Buy with card"}
      </button>

      {error && (
        <p className="muted-small" style={{ color: "var(--state-danger)", marginTop: 8 }}>
          {error}
        </p>
      )}

      {open &&
        createPortal(
          <div
            className="modal-backdrop"
            onClick={() => {
              setOpen(false);
              setClientSecret(null);
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
