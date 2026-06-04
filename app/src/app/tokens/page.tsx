"use client";

import Link from "next/link";

import { TokenCard } from "@/components/TokenCard";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useTokenBondings } from "@/hooks/useTokenBondings";

export default function TokensPage() {
  const { rows, loading, error } = useTokenBondings();
  const { t } = useLanguage();

  return (
    <div className="dashboard">
      <div className="page-head">
        <div>
          <div className="label">{t.allTokensTitle}</div>
          <h1 className="page-title fraunces-italic">{t.allTokensSub}</h1>
        </div>
        <Link href="/launch" className="btn btn-primary">
          + {t.launch}
        </Link>
      </div>

      {error && (
        <p className="muted-small" style={{ color: "var(--state-danger)" }}>
          {error.message}
        </p>
      )}
      {loading && <p className="muted-small">…</p>}
      {!loading && rows.length === 0 && !error && (
        <Link href="/launch" className="empty-add">
          + {t.launchYourEconomy}
        </Link>
      )}

      <div className="token-grid">
        {rows.map((row) => (
          <TokenCard
            key={row.publicKey.toBase58()}
            mint={row.account.targetMint.toBase58()}
            name={row.tokenName}
            symbol={row.tokenSymbol}
            imageUrl={row.tokenImage}
            price={row.price}
            supply={row.supplyRaw / Math.pow(10, row.targetDecimals)}
            reserve={
              row.account.reserveBalanceFromBonding.toNumber() /
              Math.pow(10, row.baseDecimals)
            }
          />
        ))}
      </div>
    </div>
  );
}
