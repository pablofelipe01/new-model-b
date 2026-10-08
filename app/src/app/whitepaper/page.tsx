import type { Metadata } from "next";

import { WhitepaperContent } from "./WhitepaperContent";

export const metadata: Metadata = {
  title: "Whitepaper — Matiz Protocol",
  description:
    "Social Tokenization: a mathematical framework for the on-chain brand economy on Solana.",
};

export default function WhitepaperPage() {
  return <WhitepaperContent />;
}
