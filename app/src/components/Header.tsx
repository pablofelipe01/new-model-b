import Link from "next/link";

import { PROJECT_NAME } from "@/lib/constants";

import { WalletButton } from "./WalletButton";

export function Header() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <span className="inline-block h-6 w-6 rounded-full bg-brand-500" />
          <span>{PROJECT_NAME}</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/" className="hover:text-brand-500">
            Explore
          </Link>
          <Link href="/launch" className="hover:text-brand-500">
            Launch
          </Link>
          <WalletButton />
        </nav>
      </div>
    </header>
  );
}
