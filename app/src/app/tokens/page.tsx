"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { TokenCard } from "@/components/TokenCard";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useTokenBondings } from "@/hooks/useTokenBondings";

export default function TokensPage() {
  const { rows, loading, error } = useTokenBondings();
  const { t } = useLanguage();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        (r.tokenName ?? "").toLowerCase().includes(q) ||
        (r.tokenSymbol ?? "").toLowerCase().includes(q),
    );
  }, [rows, query]);

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

      <div style={{ marginBottom: 24, maxWidth: 420 }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchCreators}
          className="input"
        />
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
      {!loading && rows.length > 0 && filtered.length === 0 && (
        <p className="muted-small">{t.noResults}</p>
      )}

      <div className="token-grid">
        {filtered.map((row) => (
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
            holders={row.holders}
          />
        ))}
      </div>
    </div>
  );
}
