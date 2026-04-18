import {
  Connection,
  Keypair,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { type NextRequest, NextResponse } from "next/server";

const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_DEVNET_RPC ?? "https://api.devnet.solana.com";

// The program ID our fee payer is willing to sponsor.
const ALLOWED_PROGRAMS = new Set([
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? "41nppqSazESeBmrgnud2j5Nz1MbsnPGeyAryPcKAefqa",
  // SPL Token
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  // Associated Token Account
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
  // Compute Budget
  "ComputeBudget111111111111111111111111111111",
  // System Program (for ATA init)
  "11111111111111111111111111111111",
]);

/**
 * Gas sponsorship relay. Receives a transaction that was partially signed
 * by the user's embedded wallet, validates it, adds the fee payer
 * signature, and broadcasts it to the network.
 *
 * Security: only sponsors transactions whose instructions target our
 * program, SPL token, ATA, or compute budget. Rejects anything else.
 *
 * POST body: { transaction: string (base64-encoded serialized tx) }
 * Response:  { signature: string } or { error: string }
 */
export async function POST(request: NextRequest) {
  // 1. Load fee payer keypair from env
  const secretB64 = process.env.FEE_PAYER_SECRET_KEY;
  if (!secretB64) {
    return NextResponse.json(
      { error: "FEE_PAYER_SECRET_KEY not configured" },
      { status: 500 },
    );
  }

  let feePayer: Keypair;
  try {
    const secretBytes = Buffer.from(secretB64, "base64");
    feePayer = Keypair.fromSecretKey(new Uint8Array(secretBytes));
  } catch {
    return NextResponse.json(
      { error: "Invalid FEE_PAYER_SECRET_KEY" },
      { status: 500 },
    );
  }

  // 2. Parse the request
  let body: { transaction?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.transaction) {
    return NextResponse.json(
      { error: "Missing transaction field" },
      { status: 400 },
    );
  }

  // 3. Deserialize the transaction
  let tx: Transaction;
  try {
    const raw = Buffer.from(body.transaction, "base64");
    tx = Transaction.from(raw);
  } catch {
    return NextResponse.json(
      { error: "Failed to deserialize transaction" },
      { status: 400 },
    );
  }

  // 4. Validate: fee payer must be our fee payer wallet
  if (!tx.feePayer || !tx.feePayer.equals(feePayer.publicKey)) {
    return NextResponse.json(
      { error: "Transaction fee payer does not match the sponsor wallet" },
      { status: 403 },
    );
  }

  // 5. Validate: all instructions must target allowed programs
  for (const ix of tx.instructions) {
    if (!ALLOWED_PROGRAMS.has(ix.programId.toBase58())) {
      return NextResponse.json(
        {
          error: `Unauthorized program: ${ix.programId.toBase58()}. ` +
            "Only the bonding curve program, SPL Token, and ATA programs are allowed.",
        },
        { status: 403 },
      );
    }
  }

  // 6. Sign with fee payer and send
  const connection = new Connection(RPC_ENDPOINT, "confirmed");

  try {
    tx.partialSign(feePayer);

    const signature = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: true,
    });

    // Wait for confirmation before responding so the frontend knows the tx
    // actually landed.
    const blockhash = tx.recentBlockhash;
    const lastValidBlockHeight = tx.lastValidBlockHeight;
    if (blockhash && lastValidBlockHeight) {
      const conf = await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed",
      );
      if (conf.value.err) {
        return NextResponse.json(
          {
            error: `Transaction failed on-chain: ${JSON.stringify(conf.value.err)}`,
            signature,
          },
          { status: 422 },
        );
      }
    }

    return NextResponse.json({ signature });
  } catch (err) {
    return NextResponse.json(
      { error: `Send failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
