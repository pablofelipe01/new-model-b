import { USDC_DECIMALS, USDC_MINT } from "@new-model-b/sdk";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { type NextRequest, NextResponse } from "next/server";

import { FUND_WALLET_AMOUNTS } from "@/lib/constants";

const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_DEVNET_RPC ?? "https://api.devnet.solana.com";

// How many recent signatures of the recipient's USDC ATA we scan to count
// prior treasury fundings. A fresh wallet has 0-3, so this is plenty; a
// wallet that has traded heavily could push older fundings out of this
// window, at which point we'd allow a re-top-up — acceptable for a devnet
// demo. Swap to a ledger/DB (the future fiduciary) if you need hard caps.
const SIG_SCAN_LIMIT = 100;

/**
 * Wallet-funding dispenser (devnet demo only).
 *
 * Transfers devnet USDC from the treasury (the fee-payer wallet) to a
 * freshly created user wallet so it can pay the on-chain launch fee and
 * trade. Capped at FUND_WALLET_AMOUNTS per wallet (first 30, then 10),
 * derived from on-chain history so there's no database to keep in sync.
 *
 * POST body: { wallet: string (base58 pubkey) }
 * Response:  { signature, amount, fundingsUsed, fundingsLeft } | { error }
 */
export async function POST(request: NextRequest) {
  // 1. Load treasury keypair (same wallet that sponsors gas).
  const secretB64 = process.env.FEE_PAYER_SECRET_KEY;
  if (!secretB64) {
    return NextResponse.json(
      { error: "Treasury wallet not configured (FEE_PAYER_SECRET_KEY)" },
      { status: 500 },
    );
  }

  let treasury: Keypair;
  try {
    treasury = Keypair.fromSecretKey(
      new Uint8Array(Buffer.from(secretB64, "base64")),
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid FEE_PAYER_SECRET_KEY" },
      { status: 500 },
    );
  }

  // 2. Parse + validate the recipient.
  let body: { wallet?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let recipient: PublicKey;
  try {
    if (!body.wallet) throw new Error("missing");
    recipient = new PublicKey(body.wallet);
  } catch {
    return NextResponse.json(
      { error: "Missing or invalid wallet address" },
      { status: 400 },
    );
  }

  if (recipient.equals(treasury.publicKey)) {
    return NextResponse.json(
      { error: "Cannot fund the treasury wallet itself" },
      { status: 400 },
    );
  }

  const connection = new Connection(RPC_ENDPOINT, "confirmed");
  const recipientAta = getAssociatedTokenAddressSync(USDC_MINT, recipient);
  const treasuryAta = getAssociatedTokenAddressSync(
    USDC_MINT,
    treasury.publicKey,
  );

  // 3. Count how many times the treasury already funded this wallet.
  let fundingsUsed: number;
  try {
    fundingsUsed = await countTreasuryFundings(
      connection,
      treasury.publicKey,
      recipientAta,
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to read funding history: ${(err as Error).message}` },
      { status: 502 },
    );
  }

  if (fundingsUsed >= FUND_WALLET_AMOUNTS.length) {
    return NextResponse.json(
      {
        error: "Funding limit reached for this wallet",
        fundingsUsed,
        fundingsLeft: 0,
      },
      { status: 409 },
    );
  }

  const amountHuman = FUND_WALLET_AMOUNTS[fundingsUsed];
  const amountRaw = BigInt(Math.round(amountHuman * 10 ** USDC_DECIMALS));

  // 4. Make sure the treasury can cover it.
  const treasuryBalRaw = await connection
    .getTokenAccountBalance(treasuryAta)
    .then((r) => BigInt(r.value.amount))
    .catch(() => 0n);
  if (treasuryBalRaw < amountRaw) {
    return NextResponse.json(
      {
        error:
          "Treasury is out of USDC. Top it up on devnet and try again.",
        treasuryBalance: Number(treasuryBalRaw) / 10 ** USDC_DECIMALS,
      },
      { status: 503 },
    );
  }

  // 5. Build, sign, send: create the recipient's ATA if needed, then transfer.
  const tx = new Transaction().add(
    createAssociatedTokenAccountIdempotentInstruction(
      treasury.publicKey, // payer (rent)
      recipientAta,
      recipient,
      USDC_MINT,
    ),
    createTransferCheckedInstruction(
      treasuryAta,
      USDC_MINT,
      recipientAta,
      treasury.publicKey, // authority
      amountRaw,
      USDC_DECIMALS,
    ),
  );
  tx.feePayer = treasury.publicKey;

  try {
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash;
    tx.sign(treasury);

    const signature = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
    });
    const conf = await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed",
    );
    if (conf.value.err) {
      return NextResponse.json(
        {
          error: `Transfer failed on-chain: ${JSON.stringify(conf.value.err)}`,
          signature,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      signature,
      amount: amountHuman,
      fundingsUsed: fundingsUsed + 1,
      fundingsLeft: FUND_WALLET_AMOUNTS.length - (fundingsUsed + 1),
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Send failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}

/**
 * Counts USDC transfers from the treasury into `recipientAta` by scanning
 * the ATA's recent signatures. Only transfers whose authority is the
 * treasury are counted, so the user's own spends (e.g. paying the launch
 * fee) are ignored.
 */
async function countTreasuryFundings(
  connection: Connection,
  treasury: PublicKey,
  recipientAta: PublicKey,
): Promise<number> {
  const sigs = await connection.getSignaturesForAddress(recipientAta, {
    limit: SIG_SCAN_LIMIT,
  });
  if (sigs.length === 0) return 0;

  const treasuryStr = treasury.toBase58();
  const recipientAtaStr = recipientAta.toBase58();
  let count = 0;

  for (const { signature, err } of sigs) {
    if (err) continue;
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });
    if (!tx) continue;

    for (const ix of tx.transaction.message.instructions) {
      if (!("parsed" in ix) || ix.program !== "spl-token") continue;
      const parsed = ix.parsed as {
        type?: string;
        info?: {
          destination?: string;
          authority?: string;
          multisigAuthority?: string;
        };
      };
      if (parsed.type !== "transfer" && parsed.type !== "transferChecked") {
        continue;
      }
      const info = parsed.info ?? {};
      const authority = info.authority ?? info.multisigAuthority;
      if (info.destination === recipientAtaStr && authority === treasuryStr) {
        count++;
      }
    }
  }

  return count;
}
