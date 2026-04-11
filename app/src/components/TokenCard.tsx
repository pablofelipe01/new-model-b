import Link from "next/link";

import { formatNumber, shortenAddress } from "@/lib/utils";

interface Props {
  /** Target mint of the bonded token. URL points to its detail page. */
  mint: string;
  /**
   * Display name. Without an indexer / metaplex metadata fetch we don't
   * have a real on-chain name, so the explore grid passes the shortened
   * mint and the symbol falls back to the first chars of the mint too.
   */
  name?: string;
  symbol?: string;
  price?: number;
  /** Supply in human token units (already divided by 10^decimals). */
  supply?: number;
  /** Reserve in human base units (already divided by 10^decimals). */
  reserve?: number;
  imageUrl?: string;
}

export function TokenCard({
  mint,
  name,
  symbol,
  price,
  supply,
  reserve,
  imageUrl,
}: Props) {
  const displayName = name ?? shortenAddress(mint, 6);
  const displaySymbol = (symbol ?? mint.slice(0, 4)).toUpperCase();

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
            alt={displaySymbol}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-200">
            {displaySymbol.slice(0, 2)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{displayName}</p>
          <p className="truncate text-xs text-zinc-500">
            {displaySymbol} · {shortenAddress(mint)}
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <dt className="text-zinc-500">Price</dt>
          <dd className="font-medium">
            {price !== undefined ? formatNumber(price, 4) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Supply</dt>
          <dd className="font-medium">
            {supply !== undefined ? formatNumber(supply, 2) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Reserve</dt>
          <dd className="font-medium">
            {reserve !== undefined ? formatNumber(reserve, 2) : "—"}
          </dd>
        </div>
      </dl>
    </Link>
  );
}
