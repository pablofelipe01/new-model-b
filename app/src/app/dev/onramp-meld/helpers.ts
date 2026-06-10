/**
 * Helpers for the Meld-via-Privy on-ramp validation bench (/dev/onramp-meld).
 *
 * This module is fully isolated from production: it only READS the user's
 * existing embedded wallet address and queries USDC balances. It never touches
 * the treasury simulator, buy_v1/sell_v1, or any production flow.
 */
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";

export const DEV_TOOLS_ENABLED = process.env.NEXT_PUBLIC_DEV_TOOLS === "true";

export type Net = "mainnet" | "devnet";

/**
 * RPC endpoints — reuse the app's existing vars directly (no duplicate names).
 * Devnet already points at your Helius endpoint. Mainnet has no RPC configured
 * in the app today, so it falls back to Solana's public endpoint; if the 15s
 * balance polling gets rate-limited, set NEXT_PUBLIC_MAINNET_RPC to a real
 * mainnet RPC (e.g. Helius) — no new variable needed.
 */
export const RPC: Record<Net, string> = {
  mainnet:
    process.env.NEXT_PUBLIC_MAINNET_RPC || "https://api.mainnet-beta.solana.com",
  devnet:
    process.env.NEXT_PUBLIC_DEVNET_RPC || "https://api.devnet.solana.com",
};

export const USDC_MINT: Record<Net, PublicKey> = {
  mainnet: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
  devnet: new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"),
};

/**
 * Meld crypto widget (direct integration — no SDK). The widget is a hosted page
 * we point an iframe / new tab at, configured entirely via URL params. The
 * public key is meant to be public (it rides in the URL); the sandbox vs live
 * environment is determined by which key you use.
 */
export const MELD = {
  publicKey: process.env.NEXT_PUBLIC_MELD_PUBLIC_KEY || "",
  widgetUrl: process.env.NEXT_PUBLIC_MELD_WIDGET_URL || "https://meldcrypto.com/",
};

export interface MeldParams {
  amount: number;
  fiat: string; // USD | COP
  dest: string; // destinationCurrencyCode, e.g. USDC_SOLANA
  wallet: string; // destination wallet (locked)
  country: string; // ISO-2, e.g. CO
}

/**
 * Build the Meld widget URL with the destination currency, wallet and country
 * locked.
 *
 * IMPORTANT (Meld quirk): the `*Locked` params take the VALUE itself, not
 * `true` (e.g. `destinationCurrencyCodeLocked=USDC_SOLANA`,
 * `walletAddressLocked=<addr>`). A locked param both presets AND freezes the
 * field, so we don't also send the unlocked version. Sending `...Locked=true`
 * is silently ignored and Meld falls back to its default (BTC). See
 * https://docs.meld.io/docs/url-parameters
 */
export function buildMeldUrl(p: MeldParams): string {
  const u = new URL(MELD.widgetUrl);
  const q = u.searchParams;
  q.set("publicKey", MELD.publicKey);
  q.set("destinationCurrencyCodeLocked", p.dest); // e.g. USDC_SOLANA — preset + frozen
  q.set("walletAddressLocked", p.wallet); // the user never sees/edits the address
  q.set("countryCodeLocked", p.country); // forced to CO
  q.set("sourceAmount", String(p.amount));
  q.set("sourceCurrencyCode", p.fiat);
  return u.toString();
}

/** Hide the public key when displaying / logging a widget URL. */
export function maskMeldUrl(url: string): string {
  return url.replace(/(publicKey=)[^&]+/i, "$1•••");
}

/** USDC balance for an owner on a given network. null = query failed (not "0"). */
export async function fetchUsdcBalance(
  net: Net,
  owner: string,
): Promise<number | null> {
  try {
    const conn = new Connection(RPC[net], "confirmed");
    const ata = getAssociatedTokenAddressSync(
      USDC_MINT[net],
      new PublicKey(owner),
    );
    const res = await conn.getTokenAccountBalance(ata);
    return res.value.uiAmount ?? 0;
  } catch (err) {
    // The ATA not existing yet is a normal "0 balance" state, not an error.
    const msg = String(err);
    if (msg.includes("could not find account") || msg.includes("Invalid param")) {
      return 0;
    }
    return null;
  }
}

export interface GeoInfo {
  country?: string;
  code?: string;
  ip?: string;
}

/**
 * Best-effort IP geolocation of the *user's* browser (not the server), so the
 * detected country matches what the on-ramp widget will see. ipapi.co supports
 * https + CORS. Returns {} on any failure — never throws.
 */
export async function detectCountry(): Promise<GeoInfo> {
  try {
    const r = await fetch("https://ipapi.co/json/", { cache: "no-store" });
    if (!r.ok) return {};
    const d = await r.json();
    return {
      country: typeof d.country_name === "string" ? d.country_name : undefined,
      code: typeof d.country_code === "string" ? d.country_code : undefined,
      ip: typeof d.ip === "string" ? d.ip : undefined,
    };
  } catch {
    return {};
  }
}

// ---- Data model ----

export interface LogEvent {
  t: number; // epoch ms
  type: string;
  payload: unknown;
}

export type AttemptStatus = "en curso" | "completada" | "fallida" | "abandonada";
export type Delivery = "pendiente" | "verificada" | "simulada";

export interface Attempt {
  id: string;
  date: string; // ISO
  amount: number;
  fiat: string;
  routedProvider: string; // manual / inferred ("por confirmar" until known)
  status: AttemptStatus;
  delivery: Delivery;
  deliveredAmount: number | null; // mainnet USDC delta when verified
  durationMs: number | null;
  events: LogEvent[];
  notes: string;
}

export interface Checklist {
  routedProvider: string;
  totalSteps: string;
  minAmount: string;
  asked: string; // email / phone / name / address / document / selfie
  kycStep: string;
  walletVisible: string;
  cryptoJargon: string;
  appleGooglePay: string;
  localMethods: string; // PSE / Nequi / other
  copOrUsd: string;
  feeBreakdown: string;
  spanishUi: string;
  friction: string; // 1-10
}

export const EMPTY_CHECKLIST: Checklist = {
  routedProvider: "",
  totalSteps: "",
  minAmount: "",
  asked: "",
  kycStep: "",
  walletVisible: "",
  cryptoJargon: "",
  appleGooglePay: "",
  localMethods: "",
  copOrUsd: "",
  feeBreakdown: "",
  spanishUi: "",
  friction: "",
};

// ---- localStorage (guarded, never throws) ----

const KEY_ATTEMPTS = "matiz-onramp-meld-attempts";
const KEY_CHECKLIST = "matiz-onramp-meld-checklist";

export function loadAttempts(): Attempt[] {
  try {
    const raw = localStorage.getItem(KEY_ATTEMPTS);
    return raw ? (JSON.parse(raw) as Attempt[]) : [];
  } catch {
    return [];
  }
}

export function saveAttempts(attempts: Attempt[]) {
  try {
    localStorage.setItem(KEY_ATTEMPTS, JSON.stringify(attempts));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

export function loadChecklist(): Checklist {
  try {
    const raw = localStorage.getItem(KEY_CHECKLIST);
    return raw ? { ...EMPTY_CHECKLIST, ...JSON.parse(raw) } : EMPTY_CHECKLIST;
  } catch {
    return EMPTY_CHECKLIST;
  }
}

export function saveChecklist(c: Checklist) {
  try {
    localStorage.setItem(KEY_CHECKLIST, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

export function shortAddr(a: string, n = 4): string {
  return a.length > 2 * n ? `${a.slice(0, n)}…${a.slice(-n)}` : a;
}
