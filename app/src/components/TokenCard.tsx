import Link from "next/link";

import { Sparkline } from "@/components/matiz/Sparkline";
import { formatNumber, shortenAddress } from "@/lib/utils";

interface Props {
  mint: string;
  name?: string;
  symbol?: string;
  price?: number;
  supply?: number;
  reserve?: number;
  imageUrl?: string;
  holders?: number;
}

export function TokenCard({
  mint,
  name,
  symbol,
  price,
  supply,
  imageUrl,
  holders,
}: Props) {
  const displayName = name ?? shortenAddress(mint, 6);
  const displaySymbol = (symbol ?? mint.slice(0, 4)).toUpperCase();

  return (
    <Link href={`/token/${mint}`} className="token-card">
      <div className="tc-head">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={displaySymbol}
            className="tc-avatar"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div
            className="tc-avatar"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {displaySymbol.slice(0, 2)}
          </div>
        )}
        <div className="tc-id">
          <div className="tc-name">{displayName}</div>
          <div className="tc-handle">${displaySymbol}</div>
        </div>
      </div>

      <div className="tc-spark">
        <Sparkline
          supply={supply ?? 0}
          maxSupply={Math.max((supply ?? 0) * 3, 1000)}
          width={260}
          height={56}
        />
      </div>

      <div className="tc-foot">
        <div>
          <div className="tc-label">Price</div>
          <div className="tc-price">
            ${price !== undefined ? formatNumber(price, 4) : "—"}
          </div>
        </div>
        <div>
          <div className="tc-label">Believers</div>
          <div className="tc-holders">{holders ?? "—"}</div>
        </div>
      </div>
    </Link>
  );
}
