import { type NextRequest, NextResponse } from "next/server";

import { BASE_TOKENS, CLUSTER } from "@/lib/constants";

/**
 * Per-wallet activity feed for the dashboard. On-demand (no DB, no webhook):
 * fetches the wallet's recent transactions from Helius' Enhanced Transactions
 * API server-side (so the Helius key is never exposed to the browser), then
 * classifies each one into a human-friendly move — buy / sell / received /
 * sent / top-up.
 *
 * Robust classification: the creator token is identified by the mint (buy) or
 * burn (sell) leg — the transfer with no counterparty — so we DON'T depend on
 * knowing the exact base/money mint (which varies per token on the curve). The
 * money leg is simply the other side of the wallet's net flow. BASE mints are
 * used only to label a plain incoming transfer as a "top-up".
 */

export const dynamic = "force-dynamic";

const HELIUS_BASE = CLUSTER === "mainnet" ? "https://api.helius.xyz" : "https://api-devnet.helius.xyz";

/** Known "money" (base) mints, used to label plain transfers as top-ups / sends. */
const EXTRA_BASE_MINTS: Record<"devnet" | "mainnet", string[]> = {
  // Platform money token currently used by the curves on devnet.
  devnet: ["4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"],
  mainnet: [],
};
const BASE_HINT = new Set([...BASE_TOKENS[CLUSTER].map((b) => b.mint), ...EXTRA_BASE_MINTS[CLUSTER]]);

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

  const rows: ActivityRow[] = [];

  for (const tx of txs) {
    const transfers = (tx.tokenTransfers ?? []).filter((x) => x.mint);
    if (transfers.length === 0) continue;

    // Net token flow for the wallet (positive = gained, negative = spent),
    // plus detection of the mint/burn leg that marks the creator token.
    const net = new Map<string, number>();
    let mintedMint: string | null = null; // creator token bought (minted to wallet)
    let burnedMint: string | null = null; // creator token sold (burned from wallet)
    const counterpartyByMint = new Map<string, string | null>();

    for (const x of transfers) {
      const amt = x.tokenAmount ?? 0;
      const from = x.fromUserAccount || "";
      const to = x.toUserAccount || "";
      if (to === wallet) net.set(x.mint!, (net.get(x.mint!) ?? 0) + amt);
      if (from === wallet) net.set(x.mint!, (net.get(x.mint!) ?? 0) - amt);
      if (!from && to === wallet) mintedMint = x.mint!; // minted into wallet
      if (!to && from === wallet) burnedMint = x.mint!; // burned from wallet
      if (to === wallet && from) counterpartyByMint.set(x.mint!, from);
      if (from === wallet && to) counterpartyByMint.set(x.mint!, to);
    }

    const flows = [...net.entries()].filter(([, v]) => Math.abs(v) > 1e-9);
    if (flows.length === 0) continue;
    const gained = flows.filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    const spent = flows.filter(([, v]) => v < 0).sort((a, b) => a[1] - b[1]);

    const base = { signature: tx.signature, ts: tx.timestamp };
    let row: ActivityRow | null = null;

    if (mintedMint && net.get(mintedMint)! > 0) {
      // BUY: creator token minted to wallet, money = the spent leg.
      const money = spent[0];
      row = { ...base, kind: "buy", tokenMint: mintedMint, tokenAmount: net.get(mintedMint)!, baseMint: money?.[0] ?? null, baseAmount: money ? Math.abs(money[1]) : 0, counterparty: null };
    } else if (burnedMint && net.get(burnedMint)! < 0) {
      // SELL: creator token burned from wallet, money = the gained leg.
      const money = gained[0];
      row = { ...base, kind: "sell", tokenMint: burnedMint, tokenAmount: Math.abs(net.get(burnedMint)!), baseMint: money?.[0] ?? null, baseAmount: money ? money[1] : 0, counterparty: null };
    } else if (gained.length) {
      // Plain incoming transfer: top-up if it's a base/money mint, else received.
      const [m, v] = gained[0];
      const isBase = BASE_HINT.has(m);
      row = { ...base, kind: isBase ? "topup" : "received", tokenMint: isBase ? null : m, tokenAmount: isBase ? 0 : v, baseMint: isBase ? m : null, baseAmount: isBase ? v : 0, counterparty: counterpartyByMint.get(m) ?? null };
    } else if (spent.length) {
      const [m, v] = spent[0];
      const isBase = BASE_HINT.has(m);
      row = { ...base, kind: "sent", tokenMint: isBase ? null : m, tokenAmount: isBase ? 0 : Math.abs(v), baseMint: isBase ? m : null, baseAmount: isBase ? Math.abs(v) : 0, counterparty: counterpartyByMint.get(m) ?? null };
    }
    if (row) rows.push(row);
  }

  return NextResponse.json(
    { activity: rows, source: "helius" },
    { headers: { "Cache-Control": "private, max-age=15" } },
  );
}
