"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { type ActivityRow, useActivity } from "@/hooks/useActivity";
import { CLUSTER } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

export type TokenInfo = { symbol?: string; name?: string; image?: string };

function relTime(ts: number, es: boolean): string {
  const s = Math.max(1, Math.floor(Date.now() / 1000 - ts));
  if (s < 60) return es ? "hace un momento" : "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return es ? `hace ${m} min` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return es ? `hace ${h} h` : `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return es ? `hace ${d} d` : `${d}d ago`;
  const mo = Math.floor(d / 30);
  return es ? `hace ${mo} mes` : `${mo}mo ago`;
}

const solscanTx = (sig: string) =>
  `https://solscan.io/tx/${sig}${CLUSTER === "devnet" ? "?cluster=devnet" : ""}`;

const KIND_COLOR: Record<ActivityRow["kind"], string> = {
  buy: "var(--state-success, #4FE0BE)",
  sell: "var(--state-danger, #FF6B55)",
  received: "var(--state-success, #4FE0BE)",
  sent: "var(--text-secondary)",
  topup: "var(--text-secondary)",
};

function Row({ row, tokenInfo, es }: { row: ActivityRow; tokenInfo: Record<string, TokenInfo>; es: boolean }) {
  const info = row.tokenMint ? tokenInfo[row.tokenMint] : undefined;
  const sym = info?.symbol ?? (row.tokenMint ? row.tokenMint.slice(0, 4) : "");
  const tokenAmt = formatNumber(row.tokenAmount, row.tokenAmount < 1 ? 4 : 2);
  const baseAmt = formatNumber(row.baseAmount, 2);

  let title: string;
  let right = "";
  switch (row.kind) {
    case "buy":
      title = es ? `Compraste ${tokenAmt} ${sym}` : `Bought ${tokenAmt} ${sym}`;
      right = `−$${baseAmt}`;
      break;
    case "sell":
      title = es ? `Vendiste ${tokenAmt} ${sym}` : `Sold ${tokenAmt} ${sym}`;
      right = `+$${baseAmt}`;
      break;
    case "received":
      title = es ? `Recibiste ${tokenAmt} ${sym}` : `Received ${tokenAmt} ${sym}`;
      break;
    case "sent":
      title = row.baseMint
        ? es
          ? `Enviaste $${baseAmt}`
          : `Sent $${baseAmt}`
        : es
          ? `Enviaste ${tokenAmt} ${sym}`
          : `Sent ${tokenAmt} ${sym}`;
      break;
    case "topup":
    default:
      title = es ? `Recarga de $${baseAmt}` : `Top-up of $${baseAmt}`;
      break;
  }

  const initial = (info?.symbol ?? info?.name ?? sym ?? "$").slice(0, 1).toUpperCase();

  return (
    <a
      href={solscanTx(row.signature)}
      target="_blank"
      rel="noopener noreferrer"
      className="holding-row"
      style={{ width: "100%", textDecoration: "none" }}
    >
      {info?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={info.image} alt={sym} className="hr-avatar" style={{ objectFit: "cover", borderRadius: "50%" }} />
      ) : (
        <div
          className="hr-avatar"
          style={{
            background: "var(--color-surface-high)",
            display: "grid",
            placeItems: "center",
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          {initial}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="hr-name">{title}</div>
        <div className="hr-meta">{relTime(row.ts, es)}</div>
      </div>
      {right && (
        <div className="hr-value mono" style={{ color: KIND_COLOR[row.kind] }}>
          {right}
        </div>
      )}
    </a>
  );
}

export function ActivityFeed({ tokenInfo }: { tokenInfo: Record<string, TokenInfo> }) {
  const { lang } = useLanguage();
  const es = lang === "es";
  const { activity, loading } = useActivity();

  if (loading && activity.length === 0) {
    return (
      <div className="stat-card" style={{ textAlign: "center", padding: 32 }}>
        <p className="muted-small">{es ? "Cargando actividad…" : "Loading activity…"}</p>
      </div>
    );
  }

  if (activity.length === 0) {
    return (
      <div className="stat-card" style={{ textAlign: "center", padding: 32 }}>
        <p className="muted-small">
          {es ? "Aún no hay movimientos. Tu primera compra aparecerá aquí." : "No moves yet. Your first buy will show up here."}
        </p>
      </div>
    );
  }

  return (
    <div className="holdings-list">
      {activity.map((row) => (
        <Row key={row.signature} row={row} tokenInfo={tokenInfo} es={es} />
      ))}
    </div>
  );
}
