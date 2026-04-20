"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useState } from "react";
import { useSdk } from "@/components/providers/SdkProvider";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { shortenAddress } from "@/lib/utils";

export default function WalletButtonInner() {
  const privy = usePrivyAuth();
  const { sdk, ready } = useSdk();
  const { t, lang } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // ─── Already connected ───
  if (privy?.authenticated || ready) {
    const label = privy?.user?.email?.address ?? privy?.user?.google?.email ?? null;
    const walletAddr = sdk?.provider.wallet.publicKey.toBase58();

    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {walletAddr && (
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(walletAddr);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="user-chip"
            style={{ cursor: "pointer" }}
          >
            {shortenAddress(walletAddr)}{" "}
            <span style={{ fontSize: 10, opacity: 0.7 }}>{copied ? "✓" : "⎘"}</span>
          </button>
        )}
        {label && (
          <span style={{ fontSize: 12, color: "var(--text-tertiary)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {label}
          </span>
        )}
        {ready && (
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--state-success)", flexShrink: 0 }} />
        )}
        <button
          type="button"
          onClick={() => privy?.logout?.()}
          className="btn btn-secondary"
          style={{ padding: "8px 14px", fontSize: 13 }}
        >
          {lang === "es" ? "Salir" : "Sign out"}
        </button>
      </div>
    );
  }

  // ─── Not connected: single button ───
  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="btn btn-primary"
        style={{ padding: "10px 20px", fontSize: 14 }}
      >
        {lang === "es" ? "Conectarse" : "Connect"}
      </button>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <button type="button" className="modal-close" onClick={() => setShowModal(false)}>
              ✕
            </button>

            <h2 className="h2" style={{ marginBottom: 8 }}>
              {lang === "es" ? "¿Cómo quieres entrar?" : "How do you want to sign in?"}
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
              {lang === "es"
                ? "Elige la opción que mejor te funcione."
                : "Pick whichever works best for you."}
            </p>

            {/* Option 1: Google / Email */}
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                privy?.login?.();
              }}
              style={{
                width: "100%",
                background: "var(--color-surface-high)",
                border: "0.5px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: "20px",
                cursor: "pointer",
                textAlign: "left",
                marginBottom: 12,
                color: "inherit",
                font: "inherit",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>
                {lang === "es" ? "Google o correo" : "Google or email"}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {lang === "es"
                  ? "No necesitas saber de cripto. Te creamos una billetera automáticamente."
                  : "No crypto knowledge needed. We create a wallet for you automatically."}
              </div>
            </button>

            {/* Option 2: Wallet */}
            <div
              style={{
                width: "100%",
                background: "var(--color-surface-high)",
                border: "0.5px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: "20px",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>
                {lang === "es" ? "Ya tengo billetera" : "I have a wallet"}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 12 }}>
                {lang === "es"
                  ? "Conecta Phantom, Solflare u otra billetera de Solana."
                  : "Connect Phantom, Solflare, or another Solana wallet."}
              </div>
              <WalletMultiButton
                style={{
                  fontSize: "14px",
                  height: "auto",
                  padding: "10px 20px",
                  borderRadius: "var(--radius-md)",
                  width: "100%",
                  justifyContent: "center",
                  background: "var(--color-indigo)",
                  fontFamily: "inherit",
                  fontWeight: 500,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
