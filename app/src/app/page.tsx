import Link from "next/link";

import { TokenCard } from "@/components/TokenCard";
import { PROJECT_DESCRIPTION, PROJECT_NAME } from "@/lib/constants";

/**
 * Landing / explore page. Currently renders a hero + a placeholder grid.
 *
 * Listing real bondings requires either an indexer (Helius / custom) or a
 * `getProgramAccounts` scan filtered by the program ID and discriminator.
 * Both are out of scope for the first iteration — leave the placeholder so
 * the rest of the UX flow is testable end-to-end.
 */
export default function HomePage() {
  const placeholders = Array.from({ length: 6 }).map((_, i) => ({
    mint: `Demo${i.toString().padStart(40, "1")}`,
    name: `Demo Token ${i + 1}`,
    symbol: `DEMO${i + 1}`,
    price: 0.5 + i * 0.1,
    change24h: i % 2 === 0 ? 0.05 : -0.02,
    marketCap: 100_000 + i * 25_000,
  }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <section className="mb-10">
        <h1 className="text-3xl font-bold">{PROJECT_NAME}</h1>
        <p className="mt-2 max-w-2xl text-zinc-500">{PROJECT_DESCRIPTION}</p>
        <Link
          href="/launch"
          className="mt-4 inline-block rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Launch a token
        </Link>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Recent launches</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {placeholders.map((p) => (
            <TokenCard key={p.mint} {...p} />
          ))}
        </div>
        <p className="mt-4 text-xs text-zinc-500">
          Live indexing coming soon — the cards above are placeholders.
        </p>
      </section>
    </div>
  );
}
