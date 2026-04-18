import { Connection, PublicKey, Transaction } from "@solana/web3.js";

import { RPC_ENDPOINT } from "./constants";

/**
 * Public key of the gas sponsor wallet. Set at build time via env var.
 * When set, all transactions are relayed through `/api/sponsor-tx` so
 * users don't need SOL for gas. When empty, falls back to direct send
 * (user pays gas).
 */
const FEE_PAYER_ADDRESS = process.env.NEXT_PUBLIC_FEE_PAYER_ADDRESS ?? "";

/** Whether gas sponsorship is enabled. */
export const GAS_SPONSORED = FEE_PAYER_ADDRESS.length > 0;

/** The fee payer public key (null if sponsorship is disabled). */
export const FEE_PAYER: PublicKey | null = GAS_SPONSORED
  ? new PublicKey(FEE_PAYER_ADDRESS)
  : null;

interface AnchorWalletLike {
  publicKey: PublicKey;
  signTransaction: <T extends Transaction>(tx: T) => Promise<T>;
}

/**
 * Send a transaction with gas sponsorship.
 *
 * Flow:
 *   1. Set `feePayer` to the sponsor wallet (user doesn't pay gas)
 *   2. Sign with user's wallet (partial sign — only for the user's accounts)
 *   3. POST to `/api/sponsor-tx` which adds the fee payer signature and broadcasts
 *
 * Falls back to direct send if sponsorship is not configured.
 */
export async function sponsoredSend(
  tx: Transaction,
  wallet: AnchorWalletLike,
  connection: Connection,
): Promise<string> {
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;

  if (FEE_PAYER) {
    // Sponsored path: fee payer is our relay wallet.
    tx.feePayer = FEE_PAYER;

    // User signs their portion (token transfers, etc.)
    const signed = await wallet.signTransaction(tx);

    // Send to relay for fee payer signature + broadcast
    const res = await fetch("/api/sponsor-tx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transaction: Buffer.from(
          signed.serialize({ requireAllSignatures: false }),
        ).toString("base64"),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error ?? `Sponsor relay failed (${res.status})`);
    }
    return data.signature;
  }

  // Direct path: user pays gas.
  tx.feePayer = wallet.publicKey;
  const signed = await wallet.signTransaction(tx);
  const sig = await connection.sendRawTransaction(signed.serialize(), {
    skipPreflight: true,
  });
  const conf = await connection.confirmTransaction(
    { signature: sig, blockhash, lastValidBlockHeight },
    "confirmed",
  );
  if (conf.value.err) {
    throw new Error(`Transaction failed: ${JSON.stringify(conf.value.err)}`);
  }
  return sig;
}
