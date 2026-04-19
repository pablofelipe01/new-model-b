import { PublicKey } from "@solana/web3.js";

// PERSONALIZAR cuando haya nombre real.
export const PROJECT_NAME = "Matiz";
export const PROJECT_DESCRIPTION = "Launch your token. Let the people who believe in you grow with you.";
export const PROJECT_URL = "https://matiz.community";

export const MAINNET_RPC =
  process.env.NEXT_PUBLIC_MAINNET_RPC ?? "https://api.mainnet-beta.solana.com";
export const DEVNET_RPC =
  process.env.NEXT_PUBLIC_DEVNET_RPC ?? "https://api.devnet.solana.com";

/** Cluster used by the app. Override with NEXT_PUBLIC_CLUSTER. */
export const CLUSTER = (process.env.NEXT_PUBLIC_CLUSTER ?? "devnet") as "devnet" | "mainnet";
export const RPC_ENDPOINT = CLUSTER === "mainnet" ? MAINNET_RPC : DEVNET_RPC;

/** Replace after `anchor build && anchor keys list`. */
export const TOKEN_BONDING_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? "41nppqSazESeBmrgnud2j5Nz1MbsnPGeyAryPcKAefqa",
);

export interface BaseTokenInfo {
  mint: string;
  symbol: string;
  decimals: number;
}

export const BASE_TOKENS: Record<"devnet" | "mainnet", BaseTokenInfo[]> = {
  devnet: [
    // Devnet test token for base-mint. Created via `spl-token create-token`.
    {
      mint: "578EySLFY4o5R1Tui3KvEbHaseRRBqZcfx1on2NZ8UXb",
      symbol: "TEST",
      decimals: 9,
    },
    // Native SOL (So111...112) requires wrapped-SOL handling that the SDK
    // doesn't implement yet (Phase 5). Disabled to prevent runtime errors.
    // { mint: "So11111111111111111111111111111111111111112", symbol: "SOL", decimals: 9 },
  ],
  mainnet: [
    { mint: "So11111111111111111111111111111111111111112", symbol: "SOL", decimals: 9 },
    { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", symbol: "USDC", decimals: 6 },
    { mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", symbol: "USDT", decimals: 6 },
  ],
};
