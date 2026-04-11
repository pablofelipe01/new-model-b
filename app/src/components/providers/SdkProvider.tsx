"use client";

import { AnchorProvider } from "@coral-xyz/anchor";
import { TokenBondingSDK } from "@new-model-b/sdk";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { createContext, useContext, useMemo, type ReactNode } from "react";

import { TOKEN_BONDING_PROGRAM_ID } from "@/lib/constants";

interface SdkContextValue {
  sdk: TokenBondingSDK | null;
  /** True once a wallet is connected and the SDK is ready for tx-builders. */
  ready: boolean;
}

const SdkContext = createContext<SdkContextValue>({ sdk: null, ready: false });

/**
 * Builds a TokenBondingSDK on top of the connected wallet. Until the user
 * connects a wallet we still expose a read-only SDK so that pages can render
 * accounts, but `ready` will be false and tx-building helpers should be
 * gated behind the wallet button.
 *
 * `useAnchorWallet()` (vs raw `useWallet()`) returns a wallet object whose
 * shape exactly matches Anchor's `Wallet` interface — sign methods + a
 * `publicKey` — so we can hand it to `AnchorProvider` without any casts.
 */
export function SdkProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const value = useMemo<SdkContextValue>(() => {
    if (!wallet) {
      return { sdk: null, ready: false };
    }
    // skipPreflight avoids the "This transaction has already been
    // processed" simulation error that devnet RPCs produce when a
    // transaction landed on one node but the preflight simulation
    // runs against another that already saw it. Safe to skip because
    // the program validates everything on-chain anyway.
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
      skipPreflight: true,
    });
    const sdk = TokenBondingSDK.init(provider, { programId: TOKEN_BONDING_PROGRAM_ID });
    return { sdk, ready: true };
  }, [connection, wallet]);

  return <SdkContext.Provider value={value}>{children}</SdkContext.Provider>;
}

export function useSdk(): SdkContextValue {
  return useContext(SdkContext);
}
