"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useCallback, useEffect, useRef, useState } from "react";

import { WalletButton } from "@/components/WalletButton";
import { useSdk } from "@/components/providers/SdkProvider";

import { ErrorBoundary } from "./ErrorBoundary";
import {
  type Attempt,
  type AttemptStatus,
  type Checklist,
  DEV_TOOLS_ENABLED,
  type Delivery,
  type GeoInfo,
  MELD,
  type Net,
  RPC,
  buildMeldUrl,
  detectCountry,
  fetchUsdcBalance,
  loadAttempts,
  loadChecklist,
  maskMeldUrl,
  saveAttempts,
  saveChecklist,
  shortAddr,
} from "./helpers";

const AMOUNTS = [10, 15, 20, 50];
const COUNTRY = "CO";
const DEFAULT_DEST = "USDC_SOLANA"; // editable in the panel if Meld rejects it
const POLL_INTERVAL_MS = 15_000;
const POLL_DEADLINE_MS = 10 * 60_000; // 10 min → "entrega simulada"

export default function OnrampMeldPage() {
  if (!DEV_TOOLS_ENABLED) {
    return (
      <div className="dashboard" style={{ textAlign: "center", paddingTop: 100 }}>
        <h1 className="page-title fraunces-italic">No disponible</h1>
        <p className="muted" style={{ marginTop: 12 }}>
          Esta herramienta de pruebas solo está activa con{" "}
          <code>NEXT_PUBLIC_DEV_TOOLS=true</code>.
        </p>
      </div>
    );
  }
  return <Tool />;
}

function Tool() {
  const { ready: privyReady, authenticated } = usePrivy();
  const { sdk } = useSdk();
  const owner = sdk?.provider.wallet.publicKey?.toBase58() ?? null;

  if (!privyReady) {
    return (
      <div className="dashboard" style={{ paddingTop: 80, textAlign: "center" }}>
        <p className="muted">Cargando…</p>
      </div>
    );
  }
  if (!authenticated || !owner) {
    return (
      <div className="dashboard" style={{ paddingTop: 80, textAlign: "center" }}>
        <h1 className="page-title fraunces-italic">Banco de pruebas — Meld</h1>
        <p className="muted" style={{ margin: "12px 0 24px" }}>
          Inicia sesión con tu wallet Privy para correr las pruebas.
        </p>
        <div style={{ display: "inline-block" }}>
          <WalletButton />
        </div>
      </div>
    );
  }

  return <Bench owner={owner} />;
}

function Bench({ owner }: { owner: string }) {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [amount, setAmount] = useState(15);
  const [fiat, setFiat] = useState<"USD" | "COP">("USD");
  const [dest, setDest] = useState(DEFAULT_DEST);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [balances, setBalances] = useState<Record<Net, number | null>>({
    mainnet: null,
    devnet: null,
  });
  const [balLoading, setBalLoading] = useState(false);
  const [geo, setGeo] = useState<GeoInfo>({});

  const currentIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- persistence ----
  useEffect(() => {
    setAttempts(loadAttempts());
    setChecklist(loadChecklist());
  }, []);
  useEffect(() => {
    if (checklist) saveChecklist(checklist);
  }, [checklist]);

  const persistAttempts = useCallback((next: Attempt[]) => {
    setAttempts(next);
    saveAttempts(next);
  }, []);

  const updateAttempt = useCallback((id: string, patch: Partial<Attempt>) => {
    setAttempts((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...patch } : a));
      saveAttempts(next);
      return next;
    });
  }, []);

  const pushEvent = useCallback((id: string, type: string, payload: unknown) => {
    setAttempts((prev) => {
      const next = prev.map((a) =>
        a.id === id
          ? { ...a, events: [...a.events, { t: Date.now(), type, payload }] }
          : a,
      );
      saveAttempts(next);
      return next;
    });
  }, []);

  // ---- balances ----
  const refreshBalances = useCallback(async () => {
    setBalLoading(true);
    const [m, d] = await Promise.all([
      fetchUsdcBalance("mainnet", owner),
      fetchUsdcBalance("devnet", owner),
    ]);
    setBalances({ mainnet: m, devnet: d });
    setBalLoading(false);
  }, [owner]);

  useEffect(() => {
    refreshBalances();
    detectCountry().then(setGeo);
    const t = setInterval(refreshBalances, 30_000);
    return () => clearInterval(t);
  }, [refreshBalances]);

  // ---- delivery poller (mainnet) ----
  const stopPoller = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPoller = useCallback(
    (id: string, startBal: number) => {
      stopPoller();
      const deadline = Date.now() + POLL_DEADLINE_MS;
      pollRef.current = setInterval(async () => {
        const now = await fetchUsdcBalance("mainnet", owner);
        if (now !== null && now > startBal + 1e-6) {
          const delta = now - startBal;
          pushEvent(id, "delivery.verified", { startBal, now, delta });
          updateAttempt(id, {
            delivery: "verificada",
            deliveredAmount: Number(delta.toFixed(6)),
            durationMs: Date.now() - startTimeRef.current,
          });
          setBalances((b) => ({ ...b, mainnet: now }));
          stopPoller();
          return;
        }
        if (Date.now() > deadline) {
          pushEvent(id, "delivery.timeout", { startBal, minutes: 10 });
          updateAttempt(id, { delivery: "simulada" });
          stopPoller();
        }
      }, POLL_INTERVAL_MS);
    },
    [owner, pushEvent, stopPoller, updateAttempt],
  );

  useEffect(() => () => stopPoller(), [stopPoller]);

  // ---- capture any postMessage from the Meld widget (best-effort, cross-origin) ----
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (typeof e.origin !== "string" || !/meld/i.test(e.origin)) return;
      const id = currentIdRef.current;
      if (!id) return;
      let payload: unknown = e.data;
      try {
        payload = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch {
        payload = String(e.data);
      }
      pushEvent(id, "meld.message", payload);
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [pushEvent]);

  const launch = useCallback(async () => {
    if (!MELD.publicKey) return;
    const id = crypto.randomUUID();
    const startBal = (await fetchUsdcBalance("mainnet", owner)) ?? 0;
    const url = buildMeldUrl({ amount, fiat, dest, wallet: owner, country: COUNTRY });
    const attempt: Attempt = {
      id,
      date: new Date().toISOString(),
      amount,
      fiat,
      routedProvider: "por confirmar",
      status: "en curso",
      delivery: "pendiente",
      deliveredAmount: null,
      durationMs: null,
      notes: "",
      events: [
        {
          t: Date.now(),
          type: "meld.open",
          payload: { amount, fiat, dest, country: COUNTRY, url: maskMeldUrl(url), startBal },
        },
      ],
    };
    currentIdRef.current = id;
    startTimeRef.current = Date.now();
    persistAttempts([attempt, ...loadAttempts()]);
    startPoller(id, startBal);
    setIframeUrl(url);
  }, [amount, fiat, dest, owner, persistAttempts, startPoller]);

  function exportJson() {
    const blob = new Blob([JSON.stringify(attempts, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meld-onramp-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const current = attempts.find((a) => a.id === currentIdRef.current) ?? null;

  return (
    <div className="dashboard" style={{ maxWidth: 980 }}>
      <div className="page-head">
        <div>
          <div className="label">Dev · On-ramp</div>
          <h1 className="page-title fraunces-italic">Validación de Meld (widget directo)</h1>
        </div>
        <button type="button" className="btn btn-secondary" onClick={refreshBalances} disabled={balLoading}>
          {balLoading ? "Actualizando…" : "Refrescar"}
        </button>
      </div>

      {/* ---------- HEADER: wallet + balances + país ---------- */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="label">Wallet embebida (destino)</div>
          <div className="numeric-m" style={{ fontSize: 16 }}>{shortAddr(owner, 6)}</div>
          <div className="stat-sub" style={{ wordBreak: "break-all", fontSize: 11 }}>{owner}</div>
        </div>
        <div className="stat-card">
          <div className="label">USDC mainnet</div>
          <div className="numeric-m">{fmtBal(balances.mainnet)}</div>
          <div className="stat-sub">entrega real del on-ramp</div>
        </div>
        <div className="stat-card">
          <div className="label">USDC devnet</div>
          <div className="numeric-m">{fmtBal(balances.devnet)}</div>
          <div className="stat-sub">referencia (simulador)</div>
        </div>
        <div className="stat-card">
          <div className="label">País por IP</div>
          <div className="numeric-m" style={{ fontSize: 18 }}>
            {geo.code ? `${geo.country ?? geo.code} (${geo.code})` : "—"}
          </div>
          <div className="stat-sub">{geo.ip ? `IP ${geo.ip}` : "best-effort"}</div>
        </div>
      </div>

      {/* ---------- PANEL DE MELD (widget directo) ---------- */}
      <ErrorBoundary label="Panel de Meld">
        {!MELD.publicKey ? (
          <SetupCard />
        ) : (
          <div className="review-card" style={{ marginBottom: 24 }}>
            <h2 className="h2" style={{ marginBottom: 4 }}>Widget de Meld</h2>
            <p className="muted-small" style={{ marginBottom: 16 }}>
              Wallet pre-llenada y <strong>bloqueada</strong>, país forzado a{" "}
              <strong>Colombia (CO)</strong>. El widget muestra qué proveedor enruta Meld.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-end" }}>
              <div>
                <label className="input-label">Monto</label>
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  {AMOUNTS.map((a) => (
                    <button key={a} type="button" onClick={() => setAmount(a)}
                      className={`btn ${amount === a ? "btn-primary" : "btn-secondary"}`}
                      style={{ padding: "8px 14px" }}>${a}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="input-label">Moneda fiat</label>
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  {(["USD", "COP"] as const).map((f) => (
                    <button key={f} type="button" onClick={() => setFiat(f)}
                      className={`btn ${fiat === f ? "btn-primary" : "btn-secondary"}`}
                      style={{ padding: "8px 14px" }}>{f}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="input-label">destinationCurrencyCode</label>
                <input className="input" value={dest} onChange={(e) => setDest(e.target.value)}
                  style={{ minHeight: 0, padding: "8px 10px", width: 160, fontSize: 13 }} />
              </div>
              <button type="button" className="btn btn-primary" onClick={launch} style={{ minWidth: 180 }}>
                Iniciar funding con Meld
              </button>
            </div>

            <p className="muted-small" style={{ marginTop: 10 }}>
              Si Meld rechaza <code>{dest}</code>, prueba otro código (p. ej. <code>SOL</code>,{" "}
              <code>USDC_SOL</code>) — se documenta aquí, no falla mudo. <code>sourceCurrencyCode={fiat}</code>{" "}
              es lo que pedimos como moneda fiat; si el widget muestra USD igual, anótalo en el checklist.
            </p>

            {iframeUrl && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                  <a className="btn btn-secondary" href={iframeUrl} target="_blank" rel="noopener noreferrer"
                    style={{ padding: "8px 14px" }}>
                    Abrir en pestaña nueva ↗
                  </a>
                  <span className="muted-small">
                    Recomendado para el KYC real (cámara/selfie suele requerir ventana completa).
                  </span>
                </div>
                <div className="muted-small" style={{ wordBreak: "break-all", marginBottom: 8 }}>
                  <code>{maskMeldUrl(iframeUrl)}</code>
                </div>
                <iframe
                  title="Meld widget"
                  src={iframeUrl}
                  allow="payment; camera; microphone; accelerometer; gyroscope"
                  style={{
                    width: "100%",
                    height: 620,
                    border: "0.5px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    background: "#fff",
                  }}
                />
              </div>
            )}

            {current && (
              <div style={{ marginTop: 20 }}>
                <div className="label" style={{ marginBottom: 8 }}>
                  Eventos del intento en curso · entrega: <b>{current.delivery}</b>
                  {current.deliveredAmount != null && ` (+${current.deliveredAmount} USDC)`}
                </div>
                <div style={{
                  background: "var(--color-ink)", borderRadius: "var(--radius-md)", padding: 12,
                  maxHeight: 200, overflow: "auto", fontFamily: "var(--font-mono, monospace)", fontSize: 12,
                }}>
                  {current.events.map((e, i) => (
                    <div key={i} style={{ marginBottom: 4, color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--text-tertiary)" }}>{new Date(e.t).toLocaleTimeString()}</span>{" "}
                      <b style={{ color: "var(--color-indigo-hi)" }}>{e.type}</b>{" "}
                      {JSON.stringify(e.payload)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="muted-small" style={{ marginTop: 12, color: "var(--text-tertiary)" }}>
              El widget es cross-origin: capturamos cualquier <code>postMessage</code> que Meld emita (best-effort)
              y la <strong>entrega real</strong> se verifica con el balance poller on-chain. El{" "}
              <strong>proveedor enrutado</strong> y el <strong>KYC</strong> se observan en la UI del widget y se
              anotan en el checklist.
            </p>
          </div>
        )}
      </ErrorBoundary>

      {/* ---------- CHECKLIST ---------- */}
      <ErrorBoundary label="Checklist manual">
        {checklist && <ChecklistForm value={checklist} onChange={setChecklist} />}
      </ErrorBoundary>

      {/* ---------- TABLA ---------- */}
      <ErrorBoundary label="Tabla de resultados">
        <div className="section-sub-head" style={{ marginTop: 32 }}>
          <h2 className="h2">Resultados acumulados</h2>
          <button type="button" className="btn btn-secondary" onClick={exportJson}
            disabled={attempts.length === 0} style={{ padding: "8px 14px" }}>
            Exportar JSON
          </button>
        </div>
        <ResultsTable
          attempts={attempts}
          onEdit={updateAttempt}
          onDelete={(id) => persistAttempts(attempts.filter((a) => a.id !== id))}
        />
      </ErrorBoundary>

      <p className="muted-small" style={{ marginTop: 24, color: "var(--text-tertiary)" }}>
        RPC mainnet: <code>{maskRpc(RPC.mainnet)}</code> · devnet: <code>{maskRpc(RPC.devnet)}</code>. La prueba
        definitiva (enrutamiento real + KYC para Colombia) es en producción — ver{" "}
        <code>README-onramp-meld.md</code>.
      </p>
    </div>
  );
}

function SetupCard() {
  return (
    <div className="review-card" style={{ marginBottom: 24 }}>
      <h2 className="h2" style={{ marginBottom: 8 }}>Falta configurar Meld</h2>
      <p className="muted" style={{ marginBottom: 12 }}>
        No hay <code>NEXT_PUBLIC_MELD_PUBLIC_KEY</code> definida. Para activar el widget:
      </p>
      <ol className="paper" style={{ paddingLeft: 18, fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)" }}>
        <li>Crea una cuenta en <a className="link" href="https://www.meld.io/" target="_blank" rel="noopener noreferrer">meld.io</a> (dashboard de desarrollador).</li>
        <li>Obtén tu <strong>public widget key</strong> (sandbox para pruebas). Es pública: va en la URL del widget, no es un secreto.</li>
        <li>Ponla en <code>app/.env.local</code>: <code>NEXT_PUBLIC_MELD_PUBLIC_KEY=...</code></li>
        <li>Reinicia <code>pnpm dev</code> (o redeploy en Vercel).</li>
      </ol>
      <p className="muted-small" style={{ marginTop: 12 }}>
        Opcional: <code>NEXT_PUBLIC_MELD_WIDGET_URL</code> si Meld te da un host de sandbox distinto a{" "}
        <code>meldcrypto.com</code>.
      </p>
    </div>
  );
}

// ---------- checklist ----------

const CHECKLIST_FIELDS: { key: keyof Checklist; label: string }[] = [
  { key: "routedProvider", label: "Proveedor que enrutó Meld" },
  { key: "totalSteps", label: "Nº total de pantallas/pasos" },
  { key: "minAmount", label: "Monto mínimo ofrecido" },
  { key: "asked", label: "Qué pidió (email/teléfono/nombre/dirección/documento/selfie)" },
  { key: "kycStep", label: "¿En qué paso apareció el KYC?" },
  { key: "walletVisible", label: "¿Dirección de wallet visible o editable?" },
  { key: "cryptoJargon", label: '¿Jerga crypto ("Solana", "network", "gas")? ¿dónde?' },
  { key: "appleGooglePay", label: "¿Apple Pay / Google Pay?" },
  { key: "localMethods", label: "¿PSE / Nequi u otro método local?" },
  { key: "copOrUsd", label: "¿COP o solo USD?" },
  { key: "feeBreakdown", label: "¿Desglose de fees antes de confirmar? ¿cuánto?" },
  { key: "spanishUi", label: "¿UI en español?" },
  { key: "friction", label: "Fricción subjetiva 1-10" },
];

function ChecklistForm({
  value,
  onChange,
}: {
  value: Checklist;
  onChange: (c: Checklist) => void;
}) {
  return (
    <div className="review-card">
      <h2 className="h2" style={{ marginBottom: 4 }}>Checklist del tester</h2>
      <p className="muted-small" style={{ marginBottom: 16 }}>
        Se guarda automáticamente en este navegador (localStorage).
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {CHECKLIST_FIELDS.map((f) => (
          <div key={f.key}>
            <label className="input-label" style={{ fontSize: 12 }}>{f.label}</label>
            <input
              type="text"
              className="input"
              value={value[f.key]}
              onChange={(e) => onChange({ ...value, [f.key]: e.target.value })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const STATUSES: AttemptStatus[] = ["en curso", "completada", "fallida", "abandonada"];
const DELIVERIES: Delivery[] = ["pendiente", "verificada", "simulada"];

function ResultsTable({
  attempts,
  onEdit,
  onDelete,
}: {
  attempts: Attempt[];
  onEdit: (id: string, patch: Partial<Attempt>) => void;
  onDelete: (id: string) => void;
}) {
  if (attempts.length === 0) {
    return <p className="muted-small">Aún no hay intentos. Inicia un funding arriba.</p>;
  }
  return (
    <div className="paper-table-wrap">
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 720 }}>
        <thead>
          <tr>
            {["Fecha", "Monto", "Proveedor", "Dur.", "Eventos", "Estado", "Entrega", "Notas", ""].map((h) => (
              <th key={h} style={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {attempts.map((a) => (
            <tr key={a.id}>
              <td style={td}>{new Date(a.date).toLocaleString()}</td>
              <td style={td}>${a.amount} {a.fiat}</td>
              <td style={td}>
                <input className="input" style={cellInput} value={a.routedProvider}
                  onChange={(e) => onEdit(a.id, { routedProvider: e.target.value })} />
              </td>
              <td style={td}>{a.durationMs != null ? `${Math.round(a.durationMs / 1000)}s` : "—"}</td>
              <td style={td}>{a.events.length}</td>
              <td style={td}>
                <select className="input" style={cellInput} value={a.status}
                  onChange={(e) => onEdit(a.id, { status: e.target.value as AttemptStatus })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
              <td style={td}>
                <select className="input" style={cellInput} value={a.delivery}
                  onChange={(e) => onEdit(a.id, { delivery: e.target.value as Delivery })}>
                  {DELIVERIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {a.deliveredAmount != null && <div className="muted-small">+{a.deliveredAmount}</div>}
              </td>
              <td style={td}>
                <input className="input" style={cellInput} value={a.notes}
                  onChange={(e) => onEdit(a.id, { notes: e.target.value })} />
              </td>
              <td style={td}>
                <button type="button" onClick={() => onDelete(a.id)} className="btn btn-secondary"
                  style={{ padding: "4px 8px", fontSize: 12 }}>✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left", padding: "8px 10px", borderBottom: "0.5px solid var(--border-subtle)",
  color: "var(--text-secondary)", fontWeight: 500, whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "8px 10px", borderBottom: "0.5px solid var(--border-subtle)",
  verticalAlign: "top", color: "var(--text-primary)",
};
const cellInput: React.CSSProperties = {
  minHeight: 0, padding: "6px 8px", fontSize: 12, width: "100%",
};

function fmtBal(b: number | null): string {
  if (b === null) return "error";
  return `$${b.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
}

function maskRpc(url: string): string {
  return url.replace(/([?&]api-key=)[^&]+/i, "$1•••");
}
