"use client";

import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  getAccount,
} from "@solana/spl-token";
import { PublicKey, Transaction } from "@solana/web3.js";
import { USDC_MINT, USDC_DECIMALS } from "@new-model-b/sdk";
import { useState } from "react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { useSdk } from "@/components/providers/SdkProvider";
import { sponsoredSend, FEE_PAYER } from "@/lib/sponsoredSend";
import { shortenAddress } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  mint?: PublicKey;
  mintSymbol?: string;
  mintDecimals?: number;
  onSuccess?: () => void;
}

export function SendModal({
  open,
  onClose,
  mint,
  mintSymbol = "USDC",
  mintDecimals = USDC_DECIMALS,
  onSuccess,
}: Props) {
  const { sdk, ready } = useSdk();
  const { t, lang } = useLanguage();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null);

  if (!open) return null;

  const tokenMint = mint ?? USDC_MINT;
  const factor = Math.pow(10, mintDecimals);

  async function onSend() {
    if (!sdk || !ready) return;
    setError(null);
    setTxSig(null);

    let recipientPk: PublicKey;
    try {
      recipientPk = new PublicKey(recipient.trim());
    } catch {
      setError("Invalid wallet address");
      return;
    }

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Enter a valid amount");
      return;
    }

    setSending(true);
    try {
      const sender = sdk.provider.wallet.publicKey;
      const connection = sdk.provider.connection;
      const rawAmount = Math.floor(numericAmount * factor);

      const senderAta = getAssociatedTokenAddressSync(tokenMint, sender);
      const recipientAta = getAssociatedTokenAddressSync(tokenMint, recipientPk, true);

      const tx = new Transaction();

      try {
        await getAccount(connection, recipientAta);
      } catch {
        tx.add(
          createAssociatedTokenAccountInstruction(
            FEE_PAYER ?? sender,
            recipientAta,
            recipientPk,
            tokenMint,
          ),
        );
      }

      const { createTransferInstruction } = await import("@solana/spl-token");
      tx.add(
        createTransferInstruction(
          senderAta,
          recipientAta,
          sender,
          BigInt(rawAmount),
        ),
      );

      const sig = await sponsoredSend(tx, sdk.provider.wallet, connection);
      setTxSig(sig);
      setAmount("");
      setRecipient("");
      onSuccess?.();
    } catch (err) {
      const raw = (err as Error).message || "";
      if (raw.includes("Custom\":1") || raw.includes("custom program error: 0x1") || raw.includes("insufficient")) {
        setError(
          lang === "es"
            ? "Fondos insuficientes. Verifica tu saldo y el monto."
            : "Insufficient funds. Check your balance and the amount."
        );
      } else {
        setError(
          lang === "es"
            ? "Algo salió mal. Intenta de nuevo."
            : "Something went wrong. Please try again."
        );
      }
      console.error("[Send error]", raw);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose}>
          ✕
        </button>

        <h2 className="h2" style={{ marginBottom: 20 }}>
          {t.sendTitle} {mintSymbol}
        </h2>

        {txSig ? (
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
              <p style={{ color: "var(--state-success)", fontWeight: 500 }}>
                {t.sendSuccess}
              </p>
              <p className="muted-small" style={{ marginTop: 8, wordBreak: "break-all" }}>
                TX: {shortenAddress(txSig, 12)}
              </p>
            </div>
            <button type="button" className="btn btn-primary btn-full" onClick={onClose}>
              {t.done}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label className="input-label">{t.recipientAddress}</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Solana wallet address"
                className="input"
              />
            </div>
            <div>
              <label className="input-label">
                {t.amount} ({mintSymbol})
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="input"
                style={{ fontSize: 22, fontWeight: 500 }}
              />
            </div>

            {error && (
              <p className="muted-small" style={{ color: "var(--state-danger)" }}>
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={onSend}
              disabled={sending || !ready || !recipient || !amount}
              className="btn btn-primary btn-full"
            >
              {sending ? "Sending..." : `${t.sendTitle} ${mintSymbol}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
