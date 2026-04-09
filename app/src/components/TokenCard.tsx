import Link from "next/link";

import { cn, formatNumber, shortenAddress } from "@/lib/utils";

interface Props {
  mint: string;
  name: string;
  symbol: string;
  price?: number;
  change24h?: number;
  marketCap?: number;
  imageUrl?: string;
}

export function TokenCard({
  mint,
  name,
  symbol,
  price,
  change24h,
  marketCap,
  imageUrl,
}: Props) {
  const positive = (change24h ?? 0) >= 0;
  return (
    <Link
      href={`/token/${mint}`}
      className="group block rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-brand-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mb-3 flex items-center gap-3">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={symbol}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-200">
            {symbol.slice(0, 2)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="truncate text-xs text-zinc-500">
            {symbol} · {shortenAddress(mint)}
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <dt className="text-zinc-500">Price</dt>
          <dd className="font-medium">{formatNumber(price ?? 0)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">24h</dt>
          <dd
            className={cn(
              "font-medium",
              positive ? "text-emerald-500" : "text-red-500",
            )}
          >
            {change24h !== undefined ? `${(change24h * 100).toFixed(2)}%` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">MC</dt>
          <dd className="font-medium">{formatNumber(marketCap ?? 0, 0)}</dd>
        </div>
      </dl>
    </Link>
  );
}
