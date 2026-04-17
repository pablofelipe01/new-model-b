"use client";

import { AnchorProvider } from "@coral-xyz/anchor";
import { TokenBondingSDK } from "@new-model-b/sdk";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { createContext, useContext, useMemo, type ReactNode } from "react";

import { TOKEN_BONDING_PROGRAM_ID } from "@/lib/constants";

import { usePrivyWallet } from "./PrivyAuthProvider";

interface SdkContextValue {
  sdk: TokenBondingSDK | null;
  /** True once a wallet is connected and the SDK is ready for tx-builders. */
  ready: boolean;
}

const SdkContext = createContext<SdkContextValue>({ sdk: null, ready: false });

/**
 * Builds a TokenBondingSDK on top of whichever wallet source is available:
 *
 *  1. **Wallet-adapter** (Phantom, Solflare) — crypto-native path.
 *  2. **Privy embedded wallet** — Google / email sign-in path.
 *
 * Wallet-adapter takes priority: if both are connected, the external
 * wallet wins (the user explicitly chose it).
 */
export function SdkProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const privyWallet = usePrivyWallet();

  const value = useMemo<SdkContextValue>(() => {
    const wallet = anchorWallet ?? privyWallet;
    if (!wallet) return { sdk: null, ready: false };

    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
      skipPreflight: true,
    });
    const sdk = TokenBondingSDK.init(provider, {
      programId: TOKEN_BONDING_PROGRAM_ID,
    });
    return { sdk, ready: true };
  }, [connection, anchorWallet, privyWallet]);

  return <SdkContext.Provider value={value}>{children}</SdkContext.Provider>;
}

export function useSdk(): SdkContextValue {
  return useContext(SdkContext);
}
