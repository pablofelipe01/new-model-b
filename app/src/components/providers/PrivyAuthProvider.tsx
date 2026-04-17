"use client";

import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { PrivyAuthContext } from "@/hooks/usePrivyAuth";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";

/** Anchor-compatible wallet shape. */
export interface PrivyAnchorWallet {
  publicKey: PublicKey;
  signTransaction: <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>;
  signAllTransactions: <T extends Transaction | VersionedTransaction>(txs: T[]) => Promise<T[]>;
}

const PrivyWalletContext = createContext<PrivyAnchorWallet | null>(null);

/** Hook consumed by SdkProvider to get the Privy wallet as Anchor Wallet. */
export function usePrivyWallet(): PrivyAnchorWallet | null {
  return useContext(PrivyWalletContext);
}

/**
 * Privy handles auth (Google / email) and creates an embedded Solana
 * wallet for every new user. The inner bridge component wraps that wallet
 * in Anchor's Wallet interface and exposes it via context so SdkProvider
 * can use it without knowing about Privy.
 */
export function PrivyAuthProvider({ children }: { children: ReactNode }) {
  if (!PRIVY_APP_ID) {
    return (
      <PrivyAuthContext.Provider value={null}>
        <PrivyWalletContext.Provider value={null}>
          {children}
        </PrivyWalletContext.Provider>
      </PrivyAuthContext.Provider>
    );
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
      }}
    >
      <PrivyWalletBridge>{children}</PrivyWalletBridge>
    </PrivyProvider>
  );
}

/**
 * Inner component that MUST be inside PrivyProvider. Reads the Privy
 * Solana embedded wallet and wraps it in an Anchor-compatible interface.
 */
function PrivyWalletBridge({ children }: { children: ReactNode }) {
  const privy = usePrivy();
  const { wallets } = useWallets();
  const [anchorWallet, setAnchorWallet] = useState<PrivyAnchorWallet | null>(null);

  const authValue = {
    authenticated: privy.authenticated,
    user: privy.user as { email?: { address: string }; google?: { email: string } } | null,
    login: privy.login,
    logout: privy.logout,
  };

  useEffect(() => {
    if (!privy.authenticated || wallets.length === 0) {
      setAnchorWallet(null);
      return;
    }

    // Find the Privy embedded wallet (not an external one like Phantom).
    const pw = wallets.find((w) => {
      // The standard wallet name for Privy's embedded wallet is "Privy".
      const name = w.standardWallet?.name ?? "";
      return name.toLowerCase().includes("privy");
    }) ?? wallets[0];

    if (!pw?.address) {
      setAnchorWallet(null);
      return;
    }

    const pubkey = new PublicKey(pw.address);

    const signTransaction = async <T extends Transaction | VersionedTransaction>(
      tx: T,
    ): Promise<T> => {
      const stdWallet = pw.standardWallet;
      if (!stdWallet) throw new Error("Privy wallet not ready");

      // Access the wallet-standard `solana:signTransaction` feature.
      const feature = stdWallet.features["solana:signTransaction"] as
        | {
            signTransaction: (
              args: { transaction: Uint8Array }[],
            ) => Promise<{ signedTransaction: Uint8Array }[]>;
          }
        | undefined;

      if (!feature) {
        throw new Error(
          "Privy wallet does not support solana:signTransaction. " +
          "Available features: " + Object.keys(stdWallet.features).join(", "),
        );
      }

      // wallet-standard signTransaction takes an array and returns an array.
      const serialized = tx.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      const results = await feature.signTransaction([
        { transaction: new Uint8Array(serialized) },
      ]);

      const signed = results[0]?.signedTransaction;
      if (!signed) throw new Error("No signed transaction returned");

      if (tx instanceof Transaction) {
        return Transaction.from(signed) as T;
      }
      return VersionedTransaction.deserialize(signed) as T;
    };

    setAnchorWallet({
      publicKey: pubkey,
      signTransaction,
      signAllTransactions: async <T extends Transaction | VersionedTransaction>(
        txs: T[],
      ): Promise<T[]> => {
        return Promise.all(txs.map((t) => signTransaction(t)));
      },
    });
  }, [privy.authenticated, wallets]);

  return (
    <PrivyAuthContext.Provider value={authValue}>
      <PrivyWalletContext.Provider value={anchorWallet}>
        {children}
      </PrivyWalletContext.Provider>
    </PrivyAuthContext.Provider>
  );
}
