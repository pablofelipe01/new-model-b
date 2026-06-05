"use client";

import { useState } from "react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { FUND_WALLET_OPTIONS } from "@/lib/constants";

interface Props {
  open: boolean;
  onClose: () => void;
  walletAddress?: string;
  /** Called after a real (non-cosmetic) top-up so the dashboard can refresh. */
  onSuccess?: () => void;
}

type Status = "idle" | "processing" | "result";
type Result = { ok: boolean; text: string };

/** Random Visa-looking card details — purely cosmetic, generated once. */
function makeCard() {
  const rnd = (n: number) => Math.floor(Math.random() * n);
  const group = () => String(1000 + rnd(9000));
  const number = `4${String(100 + rnd(900))} ${group()} ${group()} ${group()}`;
  const mm = String(1 + rnd(12)).padStart(2, "0");
  const yy = String(27 + rnd(5));
  return { number, expiry: `${mm}/${yy}`, cvc: String(100 + rnd(900)) };
}

const HOLDERS = ["A. MORALES", "C. RIVERA", "J. SANTOS", "M. TORRES", "L. VARGAS"];

export function FundModal({ open, onClose, walletAddress, onSuccess }: Props) {
  const { lang } = useLanguage();
  const [card] = useState(makeCard);
  const [holder] = useState(() => HOLDERS[Math.floor(Math.random() * HOLDERS.length)]);
  const [status, setStatus] = useState<Status>("idle");
  const [active, setActive] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  if (!open) return null;

  const es = lang === "es";

  function close() {
    setStatus("idle");
    setActive(null);
    setResult(null);
    onClose();
  }

  async function onPay(amount: number) {
    const option = FUND_WALLET_OPTIONS.find((o) => o.amount === amount);
    if (!option || status === "processing") return;

    setStatus("processing");
    setActive(amount);
    setResult(null);

    // Always let the card "charge" for a beat so the demo feels real.
    const minDelay = new Promise((r) => setTimeout(r, 1300));

    // Cosmetic option (cap 0): animate + approve, but move no funds.
    if (option.cap === 0) {
      await minDelay;
      setResult({
        ok: true,
        text: es
          ? `Pago aprobado · $${amount} USDC`
          : `Payment approved · $${amount} USDC`,
      });
      setStatus("result");
      setActive(null);
      return;
    }

    if (!walletAddress) {
      await minDelay;
      setResult({
        ok: false,
        text: es ? "Conecta tu billetera primero." : "Connect your wallet first.",
      });
      setStatus("result");
      setActive(null);
      return;
    }

    try {
      const [res] = await Promise.all([
        fetch("/api/fund-wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: walletAddress, amount }),
        }),
        minDelay,
      ]);
      const data = await res.json();

      if (!res.ok) {
        const declined = res.status === 409;
        setResult({
          ok: false,
          text: declined
            ? es
              ? "Tarjeta rechazada — límite alcanzado para esta billetera."
              : "Card declined — limit reached for this wallet."
            : es
              ? "No se pudo procesar el pago. Intenta de nuevo."
              : "Payment could not be processed. Try again.",
        });
      } else {
        setResult({
          ok: true,
          text: es
            ? `Pago aprobado · $${data.amount} USDC acreditados`
            : `Payment approved · $${data.amount} USDC credited`,
        });
        onSuccess?.();
      }
    } catch {
      setResult({
        ok: false,
        text: es ? "Error de red. Intenta de nuevo." : "Network error. Try again.",
      });
    } finally {
      setStatus("result");
      setActive(null);
    }
  }

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={close}>
          ✕
        </button>

        <h2 className="h2" style={{ marginBottom: 6 }}>
          {es ? "Agregar fondos" : "Add funds"}
        </h2>
        <p className="muted-small" style={{ marginTop: 0, marginBottom: 18 }}>
          {es
            ? "Paga con tu tarjeta y recibe USDC al instante."
            : "Pay by card and receive USDC instantly."}
        </p>

        {/* Simulated credit card */}
        <div
          style={{
            position: "relative",
            borderRadius: "var(--radius-lg)",
            padding: 20,
            marginBottom: 20,
            color: "#F5F1E8",
            background:
              "linear-gradient(135deg, var(--color-indigo) 0%, var(--spec-violet) 55%, var(--color-ember) 130%)",
            boxShadow: "0 12px 30px rgba(96, 98, 232, 0.35)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 22,
            }}
          >
            <div
              style={{
                width: 38,
                height: 28,
                borderRadius: 6,
                background: "linear-gradient(135deg, #F7C25A, #E0A93A)",
              }}
            />
            <span style={{ fontWeight: 700, fontStyle: "italic", letterSpacing: 1 }}>
              VISA
            </span>
          </div>
          <div
            style={{
              fontSize: 19,
              letterSpacing: 2,
              fontVariantNumeric: "tabular-nums",
              marginBottom: 18,
            }}
          >
            {card.number}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              textTransform: "uppercase",
              opacity: 0.92,
            }}
          >
            <div>
              <div style={{ fontSize: 9, opacity: 0.7 }}>
                {es ? "Titular" : "Card holder"}
              </div>
              <div style={{ letterSpacing: 1 }}>{holder}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, opacity: 0.7 }}>
                {es ? "Vence" : "Expires"}
              </div>
              <div style={{ letterSpacing: 1 }}>{card.expiry}</div>
            </div>
          </div>
        </div>

        {status === "result" && result ? (
          <div>
            <div
              style={{
                background: "var(--color-ink)",
                borderRadius: "var(--radius-md)",
                padding: 16,
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontWeight: 600,
                  color: result.ok
                    ? "var(--state-success)"
                    : "var(--state-danger)",
                }}
              >
                {result.ok ? (es ? "✓ " : "✓ ") : "✕ "}
                {result.text}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setStatus("idle");
                  setResult(null);
                }}
              >
                {es ? "Otro monto" : "Another amount"}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={close}
              >
                {es ? "Listo" : "Done"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label className="input-label">{es ? "Monto" : "Amount"}</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8,
                marginTop: 6,
              }}
            >
              {FUND_WALLET_OPTIONS.map((o) => {
                const isActive = active === o.amount;
                return (
                  <button
                    key={o.amount}
                    type="button"
                    onClick={() => onPay(o.amount)}
                    disabled={status === "processing"}
                    className="btn btn-secondary"
                    style={{
                      padding: "16px 0",
                      fontSize: 18,
                      fontWeight: 600,
                      opacity: status === "processing" && !isActive ? 0.4 : 1,
                    }}
                  >
                    {isActive
                      ? es
                        ? "Cobrando…"
                        : "Charging…"
                      : `$${o.amount}`}
                  </button>
                );
              })}
            </div>
            <p
              className="muted-small"
              style={{ marginTop: 14, marginBottom: 0, textAlign: "center" }}
            >
              {status === "processing"
                ? es
                  ? "Procesando pago con tu tarjeta…"
                  : "Processing card payment…"
                : es
                  ? "Pago simulado · entorno de demostración"
                  : "Simulated payment · demo environment"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
