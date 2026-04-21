"use client";

import Link from "next/link";
import { useState } from "react";

import { Sparkline } from "@/components/matiz/Sparkline";
import { BuyWithCard } from "@/components/BuyWithCard";
import { SendModal } from "@/components/SendModal";
import { SwapPanel } from "@/components/SwapPanel";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useSdk } from "@/components/providers/SdkProvider";
import { usePortfolio, type PortfolioRow } from "@/hooks/usePortfolio";
import { formatNumber } from "@/lib/utils";

export function Dashboard() {
  const { ready } = useSdk();
  const { held, launched, usdcBalance, loading, error, refresh } =
    usePortfolio();
  const [sendOpen, setSendOpen] = useState(false);
  const { t, lang } = useLanguage();

  if (!ready) {
    return (
      <div className="dashboard" style={{ textAlign: "center", paddingTop: 120 }}>
        <h1 className="display-m fraunces-italic">{t.signIn}</h1>
        <p className="muted" style={{ marginTop: 12 }}>
          {lang === "es"
            ? "Conecta tu billetera para ver tus posiciones."
            : "Connect your wallet to see your holdings."}
        </p>
      </div>
    );
  }

  const totalValue = held.reduce((a, r) => a + r.valueUsdc, 0) + usdcBalance;

  return (
    <div className="dashboard">
      <div className="page-head">
        <div>
          <div className="label">{t.dashboard}</div>
          <h1 className="page-title fraunces-italic">
            {lang === "es" ? "Buenas" : "Hey there"}
          </h1>
        </div>
        <Link href="/launch" className="btn btn-primary">
          + {t.launch}
        </Link>
      </div>

      <div className="stat-grid">
        <div className="stat-card hero">
          <div className="label">{t.totalValue}</div>
          <div className="numeric-l">${formatNumber(totalValue, 2)}</div>
        </div>
        <div className="stat-card">
          <div className="label">{t.yourBalance}</div>
          <div className="numeric-m">${formatNumber(usdcBalance, 2)}</div>
          <div className="stat-sub">
            {lang === "es" ? "disponible" : "available"}
          </div>
        </div>
        <div className="stat-card">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <BuyWithCard onSuccess={refresh} />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setSendOpen(true)}
                className="btn btn-primary"
                style={{ flex: 1, padding: "10px 16px", fontSize: 14 }}
              >
                {t.send}
              </button>
              <button
                type="button"
                onClick={refresh}
                className="btn btn-secondary"
                style={{ padding: "10px 16px", fontSize: 14 }}
              >
                {t.refresh}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="muted-small" style={{ color: "var(--state-danger)", marginBottom: 16 }}>
          {error.message}
        </p>
      )}

      <div className="dash-grid">
        {/* Holdings */}
        <section>
          <div className="section-sub-head">
            <h2 className="h2">{t.holdings}</h2>
            <span className="muted-small">
              {held.length} {lang === "es" ? "posiciones" : "holdings"}
            </span>
          </div>
          <div className="holdings-list">
            {held.map((row) => (
              <HoldingRow key={row.publicKey.toBase58()} row={row} />
            ))}
            {!loading && held.length === 0 && (
              <Link href="/" className="empty-add">
                + {lang === "es" ? "Cree en alguien nuevo" : "Believe in someone new"}
              </Link>
            )}
          </div>

          {/* Launched tokens */}
          {launched.length > 0 && (
            <>
              <div className="section-sub-head" style={{ marginTop: 32 }}>
                <h2 className="h2">
                  {lang === "es" ? "Tokens que lancé" : "Tokens I launched"}
                </h2>
                <span className="muted-small">{launched.length}</span>
              </div>
              <div className="holdings-list">
                {launched.map((row) => (
                  <HoldingRow key={`l-${row.publicKey.toBase58()}`} row={row} launcher />
                ))}
              </div>
            </>
          )}
        </section>

        {/* Activity placeholder */}
        <section>
          <div className="section-sub-head">
            <h2 className="h2">{t.recentActivity}</h2>
          </div>
          <div
            className="stat-card"
            style={{ textAlign: "center", padding: 32 }}
          >
            <p className="muted-small">
              {lang === "es" ? "Próximamente" : "Coming soon"}
            </p>
          </div>
        </section>
      </div>

      <SendModal
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        onSuccess={refresh}
      />
    </div>
  );
}

function HoldingRow({
  row,
  launcher = false,
}: {
  row: PortfolioRow;
  launcher?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLanguage();
  const symbol = row.tokenSymbol ?? "TOKEN";
  const name = row.tokenName ?? "Unnamed";
  const price = row.price ?? 0;

  return (
    <div>
      <button
        type="button"
        className="holding-row"
        onClick={() => setExpanded((e) => !e)}
        style={{ width: "100%" }}
      >
        {row.tokenImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.tokenImage}
            alt={name}
            className="hr-avatar"
            style={{ objectFit: "cover", borderRadius: "50%" }}
          />
        ) : (
          <div className="hr-avatar" style={{ background: "var(--color-surface-high)" }} />
        )}
        <div>
          <div className="hr-name">{name}</div>
          <div className="hr-meta">
            {launcher
              ? `${t.supply}: ${formatNumber(row.supplyRaw / Math.pow(10, row.targetDecimals), 2)}`
              : `${t.youOwn} ${formatNumber(row.userBalanceHuman, 4)} ${symbol}`}
          </div>
        </div>
        <Sparkline
          supply={row.supplyRaw / Math.pow(10, row.targetDecimals)}
          maxSupply={Math.max(row.supplyRaw / Math.pow(10, row.targetDecimals) * 3, 1000)}
          width={90}
          height={36}
        />
        <div className="hr-value">
          <div className="numeric-m">
            ${formatNumber(launcher ? price : row.valueUsdc, 2)}
          </div>
        </div>
      </button>

      {expanded && row.curveParams && (
        <div
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-lg)",
            padding: 16,
            marginTop: 4,
          }}
        >
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
    </div>
  );
}
