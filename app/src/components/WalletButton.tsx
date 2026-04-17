"use client";

import dynamic from "next/dynamic";

/**
 * Auth button with two paths:
 *
 *  1. **Privy** (primary) — "Sign in with Google / Email". Creates an
 *     embedded Solana wallet automatically. Zero crypto knowledge needed.
 *
 *  2. **Wallet adapter** (secondary) — "Connect Phantom". For users who
 *     already have a wallet and want to use it directly.
 *
 * Both paths end up with a wallet connected to the Anchor SDK via
 * `useAnchorWallet()`.
 *
 * We dynamic-import the real component to avoid SSR issues with Privy
 * and wallet-adapter browser APIs.
 */
export const WalletButton = dynamic(() => import("./WalletButtonInner"), {
  ssr: false,
});
