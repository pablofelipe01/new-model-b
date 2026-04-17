"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { shortenAddress } from "@/lib/utils";

/**
 * Renders:
 *  - When not logged in: "Sign in" (Privy) + "Connect wallet" (Phantom etc.)
 *  - When logged in via Privy: user email/avatar + "Sign out"
 *  - When connected via wallet adapter only: default wallet button
 */
export default function WalletButtonInner() {
  // Privy may not be available if the app ID is missing; guard with try/catch.
  let privy: ReturnType<typeof usePrivy> | null = null;
  try {
    privy = usePrivy();
  } catch {
    // PrivyProvider not in the tree — wallet-adapter only mode.
  }

  const { publicKey } = useWallet();

  // If Privy is available and user is authenticated.
  if (privy?.authenticated && privy.user) {
    const label =
      privy.user.email?.address ??
      privy.user.google?.email ??
      (publicKey ? shortenAddress(publicKey.toBase58()) : "Signed in");

    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-400 max-w-[160px] truncate">
          {label}
        </span>
        <button
          type="button"
          onClick={privy.logout}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:border-brand-500 dark:border-zinc-700"
        >
          Sign out
        </button>
      </div>
    );
  }

  // If Privy is available but user is NOT authenticated — show both options.
  if (privy && !privy.authenticated) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={privy.login}
          className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          Sign in
        </button>
        <WalletMultiButton
          style={{
            fontSize: "0.875rem",
            height: "auto",
            padding: "6px 12px",
            borderRadius: "0.5rem",
          }}
        />
      </div>
    );
  }

  // Fallback: no Privy, wallet-adapter only.
  return <WalletMultiButton />;
}
