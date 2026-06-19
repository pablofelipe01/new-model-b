import { type NextRequest, NextResponse } from "next/server";

import { BASE_TOKENS, CLUSTER } from "@/lib/constants";

/**
 * Per-wallet activity feed for the dashboard. On-demand (no DB, no webhook):
 * fetches the wallet's recent transactions from Helius' Enhanced Transactions
 * API server-side (so the Helius key is never exposed to the browser), then
 * classifies each one into a human-friendly move — buy / sell / received /
 * sent / top-up — by reading the token transfers relative to the wallet.
 *
 * The "money" leg (USDC/base) is distinguished from the creator-token leg via
 * the cluster's BASE_TOKENS mints.
 */

export const dynamic = "force-dynamic";

const HELIUS_BASE = CLUSTER === "mainnet" ? "https://api.helius.xyz" : "https://api-devnet.helius.xyz";

type HeliusTransfer = {
  fromUserAccount?: string;
  toUserAccount?: string;
  mint?: string;
  tokenAmount?: number;
};
type HeliusTx = { signature: string; timestamp: number; type?: string; tokenTransfers?: HeliusTransfer[] };

export type ActivityKind = "buy" | "sell" | "received" | "sent" | "topup";
export type ActivityRow = {
  signature: string;
  ts: number;
  kind: ActivityKind;
  tokenMint: string | null;
  tokenAmount: number;
  baseMint: string | null;
  baseAmount: number;
  counterparty: string | null;
};

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get("limit") ?? 25), 1), 50);

  if (!wallet) {
    return NextResponse.json({ activity: [], error: "missing wallet" }, { status: 400 });
  }

  const key = process.env.HELIUS_API_KEY;
  if (!key) {
    // Soft-fail: the dashboard shows an empty state instead of crashing.
    return NextResponse.json({ activity: [], error: "helius-key-missing" });
  }

  const baseMints = new Set(BASE_TOKENS[CLUSTER].map((b) => b.mint));

  let txs: HeliusTx[] = [];
  try {
    const url = `${HELIUS_BASE}/v0/addresses/${wallet}/transactions?api-key=${key}&limit=${limit}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ activity: [], error: `helius-${res.status}` });
    const json = await res.json();
    txs = Array.isArray(json) ? json : [];
  } catch {
    return NextResponse.json({ activity: [], error: "fetch-failed" });
  }

  const sum = (a: HeliusTransfer[]) => a.reduce((s, x) => s + (x.tokenAmount ?? 0), 0);
  const rows: ActivityRow[] = [];

  for (const tx of txs) {
    const transfers = tx.tokenTransfers ?? [];
    const inT = transfers.filter((x) => x.toUserAccount === wallet && x.mint);
    const outT = transfers.filter((x) => x.fromUserAccount === wallet && x.mint);
    const tokenIn = inT.filter((x) => !baseMints.has(x.mint!));
    const tokenOut = outT.filter((x) => !baseMints.has(x.mint!));
    const baseIn = inT.filter((x) => baseMints.has(x.mint!));
    const baseOut = outT.filter((x) => baseMints.has(x.mint!));

    let row: ActivityRow | null = null;
    const base = { signature: tx.signature, ts: tx.timestamp };

    if (tokenIn.length && baseOut.length) {
      row = { ...base, kind: "buy", tokenMint: tokenIn[0].mint!, tokenAmount: sum(tokenIn), baseMint: baseOut[0].mint!, baseAmount: sum(baseOut), counterparty: null };
    } else if (tokenOut.length && baseIn.length) {
      row = { ...base, kind: "sell", tokenMint: tokenOut[0].mint!, tokenAmount: sum(tokenOut), baseMint: baseIn[0].mint!, baseAmount: sum(baseIn), counterparty: null };
    } else if (tokenIn.length) {
      row = { ...base, kind: "received", tokenMint: tokenIn[0].mint!, tokenAmount: sum(tokenIn), baseMint: null, baseAmount: 0, counterparty: tokenIn[0].fromUserAccount ?? null };
    } else if (tokenOut.length) {
      row = { ...base, kind: "sent", tokenMint: tokenOut[0].mint!, tokenAmount: sum(tokenOut), baseMint: null, baseAmount: 0, counterparty: tokenOut[0].toUserAccount ?? null };
    } else if (baseIn.length) {
      row = { ...base, kind: "topup", tokenMint: null, tokenAmount: 0, baseMint: baseIn[0].mint!, baseAmount: sum(baseIn), counterparty: baseIn[0].fromUserAccount ?? null };
    }
    if (row) rows.push(row);
  }

  return NextResponse.json(
    { activity: rows, source: "helius" },
    { headers: { "Cache-Control": "private, max-age=15" } },
  );
}
