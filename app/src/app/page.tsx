"use client";

import Link from "next/link";

import { TokenCard } from "@/components/TokenCard";
import { useTokenBondings } from "@/hooks/useTokenBondings";
import { PROJECT_DESCRIPTION, PROJECT_NAME } from "@/lib/constants";

/**
 * Landing / explore page. Lists every TokenBondingV0 the program owns
 * via `program.account.tokenBondingV0.all()`. Each row enriches the
 * raw account with its current spot price + on-chain supply so the
 * grid can render without per-card RPC fan-out.
 */
export default function HomePage() {
  const { rows, loading, error, refresh } = useTokenBondings();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <section className="mb-10">
        <h1 className="text-3xl font-bold">{PROJECT_NAME}</h1>
        <p className="mt-2 max-w-2xl text-zinc-500">{PROJECT_DESCRIPTION}</p>
        <div className="mt-4 flex items-center gap-3">
          <Link
            href="/launch"
            className="inline-block rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Launch a token
          </Link>
          <button
            type="button"
            onClick={refresh}
            className="rounded-xl border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
          >
            Refresh
          </button>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Recent launches</h2>
          <span className="text-xs text-zinc-500">
            {loading ? "Loading…" : `${rows.length} token${rows.length === 1 ? "" : "s"}`}
          </span>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
            Failed to load bondings: {error.message}
          </p>
        )}

        {!loading && rows.length === 0 && !error && (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center text-zinc-500 dark:border-zinc-700">
            <p className="font-medium">No tokens yet</p>
            <p className="mt-1 text-sm">
              Be the first — head to{" "}
              <Link href="/launch" className="text-brand-500 underline">
                Launch
              </Link>{" "}
              to create one.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <TokenCard
              key={row.publicKey.toBase58()}
              mint={row.account.targetMint.toBase58()}
              price={row.price}
              supply={row.supplyRaw / Math.pow(10, row.targetDecimals)}
              reserve={
                row.account.reserveBalanceFromBonding.toNumber() /
                Math.pow(10, row.baseDecimals)
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}
