"use client";

import { useState } from "react";

import { SwapPanel } from "@/components/SwapPanel";
import { useSdk } from "@/components/providers/SdkProvider";
import { usePortfolio, type PortfolioRow } from "@/hooks/usePortfolio";
import { formatNumber } from "@/lib/utils";

/**
 * The connected wallet's home base: USDC balance, tokens held on the
 * platform, and tokens launched by this wallet. Buy/sell happens inline
 * via an expanding swap panel per row so the user never leaves the page.
 */
export function Dashboard() {
  const { ready } = useSdk();
  const { held, launched, usdcBalance, loading, error, refresh } =
    usePortfolio();

  if (!ready) {
    return (
      <Empty
        title="Connect your wallet"
        subtitle="Your holdings and launched tokens will show up here once you connect."
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              USDC balance
            </p>
            <p className="text-3xl font-semibold">
              ${formatNumber(usdcBalance, 2)}
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            aria-label="Refresh dashboard"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:border-brand-500 dark:border-zinc-700"
          >
            Refresh
          </button>
        </div>
      </section>

      {error && (
        <p className="text-sm text-red-500">
          Failed to load portfolio: {error.message}
        </p>
      )}

      <Section
        title="My portfolio"
        subtitle="Tokens you own on the platform"
        empty={
          !loading && held.length === 0
            ? "You don't own any platform tokens yet. Explore to buy your first."
            : undefined
        }
      >
        {held.map((row) => (
          <PortfolioCard key={row.publicKey.toBase58()} row={row} />
        ))}
      </Section>

      <Section
        title="Tokens I launched"
        subtitle="Tokens where you are the general authority"
        empty={
          !loading && launched.length === 0
            ? "You haven't launched any tokens yet."
            : undefined
        }
      >
        {launched.map((row) => (
          <PortfolioCard key={row.publicKey.toBase58()} row={row} launcher />
        ))}
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  empty,
  children,
}: {
  title: string;
  subtitle: string;
  empty?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-xs text-zinc-500">{subtitle}</p>
      </div>
      {empty ? (
        <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          {empty}
        </p>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </section>
  );
}

function PortfolioCard({
  row,
  launcher = false,
}: {
  row: PortfolioRow;
  launcher?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const symbol = row.tokenSymbol ?? "TOKEN";
  const name = row.tokenName ?? "Unnamed token";
  const price = row.price ?? 0;

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex items-center gap-4 p-4">
        {row.tokenImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.tokenImage}
            alt={`${name} logo`}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-500 to-purple-500" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {name}{" "}
            <span className="text-sm font-normal text-zinc-500">({symbol})</span>
          </p>
          <p className="text-xs text-zinc-500">
            Price ${formatNumber(price, 6)}
          </p>
        </div>
        <div className="text-right">
          {launcher ? (
            <>
              <p className="text-xs text-zinc-500">Supply</p>
              <p className="font-medium">
                {formatNumber(
                  row.supplyRaw / Math.pow(10, row.targetDecimals),
                  2,
                )}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-zinc-500">Your balance</p>
              <p className="font-medium">
                {formatNumber(row.userBalanceHuman, 4)} {symbol}
              </p>
              <p className="text-xs text-zinc-500">
                ≈ ${formatNumber(row.valueUsdc, 2)}
              </p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-label={expanded ? "Hide trade panel" : "Trade this token"}
          className="ml-2 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          {expanded ? "Close" : "Trade"}
        </button>
      </header>

      {expanded && row.curveParams && (
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <SwapPanel
            tokenBonding={row.publicKey.toBase58()}
            curve={row.curveParams}
            currentSupply={row.supplyRaw / Math.pow(10, row.targetDecimals)}
            baseSymbol="USDC"
            targetSymbol={symbol}
            targetDecimals={row.targetDecimals}
            baseDecimals={row.baseDecimals}
          />
        </div>
      )}
      {expanded && !row.curveParams && (
        <p className="border-t border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-800">
          Curve data unavailable — cannot trade from here.
        </p>
      )}
    </article>
  );
}

function Empty({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      <h1 className="mb-2 text-xl font-semibold">{title}</h1>
      <p className="text-sm text-zinc-500">{subtitle}</p>
    </div>
  );
}
