"use client";

import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { useWallets, useSignTransaction } from "@privy-io/react-auth/solana";
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

export function usePrivyWallet(): PrivyAnchorWallet | null {
  return useContext(PrivyWalletContext);
}

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
 * Bridges Privy's embedded Solana wallet into Anchor's Wallet interface.
 *
 * Uses `useSignTransaction` from Privy which takes `{transaction: Uint8Array,
 * wallet}` and returns `{signedTransaction: Uint8Array}`. This is the correct
 * hook for Anchor because AnchorProvider.sendAndConfirm calls
 * wallet.signTransaction(tx) and then sends the signed bytes itself.
 */
function PrivyWalletBridge({ children }: { children: ReactNode }) {
  const privy = usePrivy();
  const { wallets } = useWallets();
  const { signTransaction: privySignTx } = useSignTransaction();
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

    const pw = wallets.find((w) => {
      const name = w.standardWallet?.name ?? "";
      return name.toLowerCase().includes("privy");
    }) ?? wallets[0];

    if (!pw?.address) {
      setAnchorWallet(null);
      return;
    }

    const pubkey = new PublicKey(pw.address);

    setAnchorWallet({
      publicKey: pubkey,

      signTransaction: async <T extends Transaction | VersionedTransaction>(
        tx: T,
      ): Promise<T> => {
        const serialized = tx.serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        });

        const { signedTransaction } = await privySignTx({
          transaction: new Uint8Array(serialized),
          wallet: pw,
        });

        // Deserialize back into the same type Anchor expects.
        if (tx instanceof Transaction) {
          return Transaction.from(signedTransaction) as T;
        }
        return VersionedTransaction.deserialize(signedTransaction) as T;
      },

      signAllTransactions: async <T extends Transaction | VersionedTransaction>(
        txs: T[],
      ): Promise<T[]> => {
        const results: T[] = [];
        for (const tx of txs) {
          const serialized = tx.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
          });
          const { signedTransaction } = await privySignTx({
            transaction: new Uint8Array(serialized),
            wallet: pw,
          });
          if (tx instanceof Transaction) {
            results.push(Transaction.from(signedTransaction) as T);
          } else {
            results.push(VersionedTransaction.deserialize(signedTransaction) as T);
          }
        }
        return results;
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privy.authenticated, wallets.length]);

  return (
    <PrivyAuthContext.Provider value={authValue}>
      <PrivyWalletContext.Provider value={anchorWallet}>
        {children}
      </PrivyWalletContext.Provider>
    </PrivyAuthContext.Provider>
  );
}
