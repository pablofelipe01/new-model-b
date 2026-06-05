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

import { FUND_WALLET_OPTIONS } from "@/lib/constants";

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
 * trade. The requested `amount` must be one of FUND_WALLET_OPTIONS, and is
 * capped per wallet per amount (see FUND_WALLET_OPTIONS), derived from
 * on-chain history so there's no database to keep in sync.
 *
 * POST body: { wallet: string (base58 pubkey), amount: number }
 * Response:  { signature, amount, used, left } | { error }
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

  // 2. Parse + validate the recipient and requested amount.
  let body: { wallet?: string; amount?: number };
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

  const option = FUND_WALLET_OPTIONS.find((o) => o.amount === body.amount);
  if (!option) {
    return NextResponse.json(
      { error: "Unsupported amount" },
      { status: 400 },
    );
  }
  // cap 0 = cosmetic-only option; the checkout handles it client-side and
  // should never reach the API. Reject defensively so it can't drain funds.
  if (option.cap === 0) {
    return NextResponse.json(
      { error: "This amount is demo-only", used: 0, left: 0 },
      { status: 409 },
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

  const amountHuman = option.amount;
  const amountRaw = BigInt(Math.round(amountHuman * 10 ** USDC_DECIMALS));

  // 3. Count how many times the treasury already funded this wallet with
  //    this exact amount, so each amount enforces its own per-wallet cap.
  let fundingsUsed: number;
  try {
    fundingsUsed = await countTreasuryFundings(
      connection,
      treasury.publicKey,
      recipientAta,
      amountRaw,
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to read funding history: ${(err as Error).message}` },
      { status: 502 },
    );
  }

  if (fundingsUsed >= option.cap) {
    return NextResponse.json(
      {
        error: "Funding limit reached for this wallet",
        used: fundingsUsed,
        left: 0,
      },
      { status: 409 },
    );
  }

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
      used: fundingsUsed + 1,
      left: option.cap - (fundingsUsed + 1),
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Send failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}

/**
 * Counts USDC transfers from the treasury into `recipientAta` for the exact
 * `amountRaw`, by scanning the ATA's recent signatures. Only transfers whose
 * authority is the treasury are counted, so the user's own spends (e.g.
 * paying the launch fee) are ignored. Matching on amount lets each top-up
 * size (e.g. $30 vs $5) enforce its own per-wallet cap independently.
 */
async function countTreasuryFundings(
  connection: Connection,
  treasury: PublicKey,
  recipientAta: PublicKey,
  amountRaw: bigint,
): Promise<number> {
  const amountStr = amountRaw.toString();
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
          amount?: string;
          tokenAmount?: { amount?: string };
        };
      };
      if (parsed.type !== "transfer" && parsed.type !== "transferChecked") {
        continue;
      }
      const info = parsed.info ?? {};
      const authority = info.authority ?? info.multisigAuthority;
      // `transfer` carries info.amount; `transferChecked` nests it under
      // info.tokenAmount.amount. Match either against the requested amount.
      const txAmount = info.tokenAmount?.amount ?? info.amount;
      if (
        info.destination === recipientAtaStr &&
        authority === treasuryStr &&
        txAmount === amountStr
      ) {
        count++;
      }
    }
  }

  return count;
}
