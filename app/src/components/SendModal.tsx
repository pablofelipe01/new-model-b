"use client";

import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  getAccount,
} from "@solana/spl-token";
import {
  ComputeBudgetProgram,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { USDC_MINT, USDC_DECIMALS } from "@new-model-b/sdk";
import { useState } from "react";

import { useSdk } from "@/components/providers/SdkProvider";
import { sponsoredSend, FEE_PAYER } from "@/lib/sponsoredSend";
import { shortenAddress } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Which token to send. Defaults to USDC. */
  mint?: PublicKey;
  mintSymbol?: string;
  mintDecimals?: number;
  onSuccess?: () => void;
}

/**
 * Modal to send tokens (USDC or any SPL token) to another wallet.
 * Uses the gas sponsor relay so the sender doesn't need SOL.
 */
export function SendModal({
  open,
  onClose,
  mint,
  mintSymbol = "USDC",
  mintDecimals = USDC_DECIMALS,
  onSuccess,
}: Props) {
  const { sdk, ready } = useSdk();
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

    // Validate recipient address
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

      // Create recipient ATA if it doesn't exist (rent paid by fee payer).
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

      // SPL token transfer instruction.
      // Import inline to avoid pulling spl-token Transfer type issues.
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
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Send {mintSymbol}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {txSig ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-emerald-100 p-3 text-sm dark:bg-emerald-950">
              <p className="font-medium text-emerald-700 dark:text-emerald-300">
                Sent successfully!
              </p>
              <p className="mt-1 break-all text-xs text-emerald-600 dark:text-emerald-400">
                TX: {shortenAddress(txSig, 12)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-brand-500 py-2.5 font-medium text-white hover:bg-brand-600"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-500">
                Recipient address
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Solana wallet address"
                className="w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-zinc-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-500">
                Amount ({mintSymbol})
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-lg font-medium focus:border-brand-500 focus:outline-none dark:border-zinc-700"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <button
              type="button"
              onClick={onSend}
              disabled={sending || !ready || !recipient || !amount}
              className="w-full rounded-xl bg-brand-500 py-3 font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "Sending..." : `Send ${mintSymbol}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
