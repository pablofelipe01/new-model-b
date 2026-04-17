"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useState } from "react";
import { useSdk } from "@/components/providers/SdkProvider";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";
import { shortenAddress } from "@/lib/utils";

/**
 * Auth button with two paths:
 *
 *  1. **Privy** (primary) — "Sign in with Google / Email". Privy creates
 *     an embedded Solana wallet; SdkProvider bridges it to Anchor.
 *
 *  2. **Wallet adapter** (secondary) — "Select Wallet". For crypto-native
 *     users who want to use Phantom / Solflare.
 */
export default function WalletButtonInner() {
  const privy = usePrivyAuth();
  const { sdk, ready } = useSdk();
  const [copied, setCopied] = useState(false);

  // Privy authenticated.
  if (privy?.authenticated && privy.user) {
    const label =
      privy.user.email?.address ??
      privy.user.google?.email ??
      "Signed in";

    const walletAddr = sdk?.provider.wallet.publicKey.toBase58();

    return (
      <div className="flex items-center gap-3">
        {ready && walletAddr && (
          <button
            type="button"
            title="Click to copy address"
            onClick={() => {
              navigator.clipboard.writeText(walletAddr);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
          >
            {shortenAddress(walletAddr)}
            <span className="text-[10px]">{copied ? "Copied!" : "Copy"}</span>
          </button>
        )}
        <span className="text-sm text-zinc-400 max-w-[140px] truncate">
          {label}
        </span>
        {ready && (
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" title="Wallet connected" />
        )}
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

  // Not authenticated — show both options.
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

  // Fallback: no Privy.
  return <WalletMultiButton />;
}
