"use client";

import dynamic from "next/dynamic";

/**
 * The wallet adapter button uses browser-only APIs and must not be SSR'd.
 */
export const WalletButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false },
);
