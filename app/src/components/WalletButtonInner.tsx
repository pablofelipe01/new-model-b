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
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  // Privy authenticated
  if (privy?.authenticated && privy.user) {
    const label =
      privy.user.email?.address ??
      privy.user.google?.email ??
      t.signIn;
    const walletAddr = sdk?.provider.wallet.publicKey.toBase58();

    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {ready && walletAddr && (
          <button
            type="button"
            title="Click to copy address"
            onClick={() => {
              navigator.clipboard.writeText(walletAddr);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="user-chip"
            style={{ cursor: "pointer", minHeight: 32 }}
          >
            {shortenAddress(walletAddr)}{" "}
            <span style={{ fontSize: 10, opacity: 0.7 }}>{copied ? "✓" : "⎘"}</span>
          </button>
        )}
        <span style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </span>
        {ready && (
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--state-success)", flexShrink: 0 }} />
        )}
        <button type="button" onClick={privy.logout} className="btn btn-secondary" style={{ padding: "8px 14px", fontSize: 13 }}>
          {t.signIn === "Entrar" ? "Salir" : "Sign out"}
        </button>
      </div>
    );
  }

  // Not authenticated — both options, same size
  if (privy && !privy.authenticated) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          onClick={privy.login}
          className="btn btn-primary"
          style={{ padding: "10px 20px", fontSize: 14 }}
        >
          {t.signIn}
        </button>
        <WalletMultiButton
          style={{
            fontSize: "14px",
            height: "auto",
            padding: "10px 20px",
            borderRadius: "var(--radius-md)",
            background: "transparent",
            border: "0.5px solid var(--border-strong)",
            color: "var(--text-primary)",
            fontFamily: "inherit",
            fontWeight: 500,
          }}
        />
      </div>
    );
  }

  // Fallback: no Privy
  return (
    <WalletMultiButton
      style={{
        fontSize: "14px",
        height: "auto",
        padding: "10px 20px",
        borderRadius: "var(--radius-md)",
      }}
    />
  );
}
