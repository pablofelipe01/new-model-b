"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import type { ReactNode } from "react";

import { CLUSTER, RPC_ENDPOINT } from "@/lib/constants";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";

/**
 * Privy handles auth (Google / email) and creates an embedded Solana
 * wallet for every new user. The embedded wallet registers itself
 * via the Wallet Standard, so `@solana/wallet-adapter-react` auto-
 * discovers it — our SdkProvider + AnchorProvider work unchanged.
 *
 * Crypto-native users can still connect Phantom / Solflare via the
 * wallet adapter modal; Privy sits alongside, not instead of, the
 * existing wallet infrastructure.
 */
export function PrivyAuthProvider({ children }: { children: ReactNode }) {
  if (!PRIVY_APP_ID) {
    // Graceful fallback: if no Privy App ID is set, skip the provider
    // so the app still works with wallet-adapter only.
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["google", "email"],
        appearance: {
          walletChainType: "solana-only",
          theme: "dark",
        },
        embeddedWallets: {
          solana: {
            createOnLogin: "all-users",
          },
        },
        // No solana.rpcs needed — Anchor manages its own Connection.
      }}
    >
      {children}
    </PrivyProvider>
  );
}
