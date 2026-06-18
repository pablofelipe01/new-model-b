"use client";

import { useMemo, useState } from "react";
import {
  buyBaseAmount,
  buyTargetAmount,
  currentPrice,
  generateCurvePoints,
  reserveForSupply,
  type CurveParams,
} from "@new-model-b/sdk";

/**
 * Interactive token simulator. Uses the REAL square-root bonding curve the
 * launch flow defaults to (price starts 1:1, growth 0.5) so creators can play
 * out what happens to price, liquidity and who wins/loses as buyers enter and
 * exit, a whale pumps & dumps, the creator rewards fans, or panic hits.
 *
 * All math comes from @new-model-b/sdk — float64, fine for a what-if preview.
 */

const CURVE: CurveParams = { c: 0.5, b: 1, pow: 1, frac: 2 };
const N = 36; // pasos de la simulación
const WHALE_IN = 6;
const WHALE_OUT = 19;
const PANIC_STEP = 28;
const PLATFORM_FEE = 0.005;

type Params = {
  demand: number; // USDC/paso de compra orgánica
  sellPct: number; // % del supply vendido por paso
  whaleSize: number; // USDC que entra la ballena (0 = sin ballena)
  creatorSpend: number; // USDC/paso que el creador invierte para premiar fans
  panicPct: number; // % del supply vendido de golpe en el pánico (0 = sin pánico)
};

const PRESETS: Record<string, Params> = {
  normal: { demand: 600, sellPct: 8, whaleSize: 0, creatorSpend: 0, panicPct: 0 },
  optimista: { demand: 1400, sellPct: 4, whaleSize: 0, creatorSpend: 300, panicPct: 0 },
  pesimista: { demand: 300, sellPct: 14, whaleSize: 12000, creatorSpend: 0, panicPct: 45 },
};

type ActorKey = "fans" | "mercado" | "ballena" | "creador";
type Actor = { inv: number; real: number; tok: number };

type Sim = {
  prices: number[];
  markers: { t: number; type: "whaleIn" | "whaleOut" | "panic" }[];
  startP: number;
  finalP: number;
  peakP: number;
  finalS: number;
  peakS: number;
  mcap: number;
  reserve: number;
  volTotal: number;
  fees: number;
  pnl: Record<ActorKey, number>;
  actors: Record<ActorKey, Actor>;
};

function simulate(p: Params): Sim {
  let S = 0;
  let volTotal = 0;
  const actors: Record<ActorKey, Actor> = {
    fans: { inv: 0, real: 0, tok: 0 },
    mercado: { inv: 0, real: 0, tok: 0 },
    ballena: { inv: 0, real: 0, tok: 0 },
    creador: { inv: 0, real: 0, tok: 0 },
  };
  const prices: number[] = [];
  const markers: Sim["markers"] = [];

  const buy = (a: ActorKey, usdc: number) => {
    if (usdc <= 0) return 0;
    const tok = buyBaseAmount(CURVE, S, usdc);
    S += tok;
    actors[a].inv += usdc;
    actors[a].tok += tok;
    volTotal += usdc;
    return tok;
  };
  const sell = (a: ActorKey, tokReq: number) => {
    const tok = Math.min(tokReq, actors[a].tok);
    if (tok <= 1e-9) return 0;
    const proceeds = buyTargetAmount(CURVE, S - tok, tok);
    S -= tok;
    actors[a].tok -= tok;
    actors[a].real += proceeds;
    volTotal += proceeds;
    return proceeds;
  };

  for (let t = 0; t < N; t++) {
    buy("mercado", p.demand);
    sell("mercado", S * (p.sellPct / 100));

    if (p.whaleSize > 0 && t === WHALE_IN) {
      buy("ballena", p.whaleSize);
      markers.push({ t, type: "whaleIn" });
    }
    if (p.whaleSize > 0 && t === WHALE_OUT) {
      sell("ballena", actors.ballena.tok);
      markers.push({ t, type: "whaleOut" });
    }

    if (p.creatorSpend > 0) {
      // El creador compra y regala los tokens a sus fans (fans: costo 0).
      const tok = buyBaseAmount(CURVE, S, p.creatorSpend);
      S += tok;
      actors.creador.inv += p.creatorSpend;
      actors.fans.tok += tok;
      volTotal += p.creatorSpend;
    }

    if (p.panicPct > 0 && t === PANIC_STEP) {
      sell("mercado", Math.min(S * (p.panicPct / 100), actors.mercado.tok));
      markers.push({ t, type: "panic" });
    }

    prices.push(currentPrice(CURVE, S));
  }

  const finalP = currentPrice(CURVE, S);
  const startP = currentPrice(CURVE, 0);
  const peakP = Math.max(...prices, startP);
  const pnl = {} as Record<ActorKey, number>;
  (Object.keys(actors) as ActorKey[]).forEach((k) => {
    pnl[k] = actors[k].real + actors[k].tok * finalP - actors[k].inv;
  });

  return {
    prices,
    markers,
    startP,
    finalP,
    peakP,
    finalS: S,
    peakS: S,
    mcap: finalP * S,
    reserve: reserveForSupply(CURVE, S),
    volTotal,
    fees: volTotal * PLATFORM_FEE,
    pnl,
    actors,
  };
}

/* ---------- formatters ---------- */
const R = Math.round;
const money = (n: number) => {
  const a = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${sign}$${(a / 1e3).toFixed(1)}K`;
  return `${sign}$${a < 10 ? a.toFixed(2) : R(a).toLocaleString("en-US")}`;
};
const signMoney = (n: number) => (n >= 0 ? "+" : "") + money(n);

/* ---------- svg helpers ---------- */
function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return m * p;
}
const T = (x: number, y: number, s: string, o: { a?: string; fill?: string; b?: boolean; s?: number } = {}) =>
  `<text x="${x}" y="${y}" fill="${o.fill || "#9990C4"}" text-anchor="${o.a || "start"}" ${o.b ? 'font-weight="600"' : ""} ${o.s ? `font-size="${o.s}"` : ""}>${s}</text>`;

function priceChart(sim: Sim): string {
  const W = 720,
    H = 280,
    pl = 54,
    pr = 16,
    pt = 18,
    pb = 30,
    iw = W - pl - pr,
    ih = H - pt - pb;
  const max = niceMax(sim.peakP);
  const x = (i: number) => pl + (iw * i) / (N - 1);
  const y = (v: number) => pt + ih - (ih * v) / max;
  let g = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;height:auto" font-size="11">`;
  for (let t = 0; t <= 4; t++) {
    const yy = pt + ih - (ih * t) / 4;
    g += `<line x1="${pl}" y1="${yy}" x2="${W - pr}" y2="${yy}" stroke="rgba(255,255,255,.06)"/>`;
    g += T(pl - 8, yy + 3, money((max * t) / 4), { a: "end", fill: "#6B6391" });
  }
  // event markers
  const mk: Record<string, [string, string]> = {
    whaleIn: ["#8B7BF7", "ballena compra"],
    whaleOut: ["#F47186", "ballena vende"],
    panic: ["#F5B65A", "pánico"],
  };
  sim.markers.forEach((m) => {
    const xx = x(m.t);
    const [c, lab] = mk[m.type];
    g += `<line x1="${xx}" y1="${pt}" x2="${xx}" y2="${pt + ih}" stroke="${c}" stroke-dasharray="3 3" stroke-opacity=".7"/>`;
    g += T(xx, pt - 5, lab, { a: "middle", fill: c, s: 10, b: true });
  });
  const line = sim.prices.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const area = `${pl},${y(0)} ${line} ${x(N - 1)},${y(0)}`;
  g += `<defs><linearGradient id="pf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2DD4BF" stop-opacity=".30"/><stop offset="1" stop-color="#2DD4BF" stop-opacity="0"/></linearGradient></defs>`;
  g += `<polygon points="${area}" fill="url(#pf)"/>`;
  g += `<polyline points="${line}" fill="none" stroke="#2DD4BF" stroke-width="2.5" stroke-linejoin="round"/>`;
  g += `<circle cx="${x(N - 1)}" cy="${y(sim.finalP)}" r="4" fill="#fff" stroke="#2DD4BF" stroke-width="2"/>`;
  for (let i = 0; i < N; i += 6) g += T(x(i), H - 9, "P" + (i + 1), { a: "middle", fill: "#6B6391" });
  g += "</svg>";
  return g;
}

function curveChart(sim: Sim): string {
  const W = 720,
    H = 260,
    pl = 54,
    pr = 16,
    pt = 18,
    pb = 28,
    iw = W - pl - pr,
    ih = H - pt - pb;
  const maxS = Math.max(sim.finalS * 1.15, 50);
  const pts = generateCurvePoints(CURVE, maxS, 90);
  const maxP = niceMax(Math.max(...pts.map((p) => p.price)));
  const x = (s: number) => pl + (iw * s) / maxS;
  const y = (v: number) => pt + ih - (ih * v) / maxP;
  let g = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;height:auto" font-size="11">`;
  for (let t = 0; t <= 4; t++) {
    const yy = pt + ih - (ih * t) / 4;
    g += `<line x1="${pl}" y1="${yy}" x2="${W - pr}" y2="${yy}" stroke="rgba(255,255,255,.06)"/>`;
    g += T(pl - 8, yy + 3, money((maxP * t) / 4), { a: "end", fill: "#6B6391" });
  }
  const line = pts.map((p) => `${x(p.supply)},${y(p.price)}`).join(" ");
  g += `<polyline points="${line}" fill="none" stroke="#8B7BF7" stroke-width="2.5"/>`;
  // current position
  const cx = x(sim.finalS),
    cy = y(sim.finalP);
  g += `<line x1="${cx}" y1="${pt}" x2="${cx}" y2="${pt + ih}" stroke="#2DD4BF" stroke-dasharray="3 3" stroke-opacity=".6"/>`;
  g += `<circle cx="${cx}" cy="${cy}" r="5" fill="#2DD4BF" stroke="#0B0916" stroke-width="2"/>`;
  g += T(cx, cy - 12, "aquí estás", { a: "middle", fill: "#2DD4BF", b: true, s: 11 });
  g += T(W - pr, H - 9, "→ supply (tokens)", { a: "end", fill: "#6B6391" });
  g += "</svg>";
  return g;
}

function pnlChart(sim: Sim): string {
  const items: [string, number, boolean][] = [
    ["Fans", sim.pnl.fans, sim.actors.fans.tok > 1e-6],
    ["Mercado", sim.pnl.mercado, sim.actors.mercado.inv > 0],
    ["Ballena", sim.pnl.ballena, sim.actors.ballena.inv > 0],
    ["Creador", sim.pnl.creador, sim.actors.creador.inv > 0],
  ];
  const W = 720,
    H = 240,
    pt = 26,
    pb = 40,
    pl = 12,
    ih = H - pt - pb,
    iw = W - pl - 12;
  const maxAbs = Math.max(1, ...items.map((d) => Math.abs(d[1])));
  const max = niceMax(maxAbs);
  const zero = pt + ih / 2;
  const half = ih / 2;
  const gap = iw / items.length;
  const bw = gap * 0.46;
  let g = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;height:auto" font-size="11">`;
  g += `<line x1="${pl}" y1="${zero}" x2="${W - 12}" y2="${zero}" stroke="rgba(255,255,255,.18)"/>`;
  items.forEach((d, i) => {
    const x = pl + gap * i + (gap - bw) / 2;
    const active = d[2];
    const h = (half * Math.abs(d[1])) / max;
    const up = d[1] >= 0;
    const yTop = up ? zero - h : zero;
    const c = !active ? "#3a3458" : up ? "#2DD4BF" : "#F47186";
    g += `<rect x="${x}" y="${yTop}" width="${bw}" height="${Math.max(0, h)}" fill="${c}" rx="4"/>`;
    g += T(x + bw / 2, up ? yTop - 8 : yTop + h + 16, active ? signMoney(d[1]) : "—", {
      a: "middle",
      fill: active ? (up ? "#2DD4BF" : "#F47186") : "#6B6391",
      b: true,
      s: 13,
    });
    g += T(x + bw / 2, H - 16, d[0], { a: "middle", fill: "#ECEAF6", s: 12 });
  });
  g += T(W - 12, pt - 8, "ganancia / pérdida final", { a: "end", fill: "#6B6391", s: 11 });
  g += "</svg>";
  return g;
}

function narrative(sim: Sim, p: Params): string[] {
  const out: string[] = [];
  const drop = sim.peakP > 0 ? (1 - sim.finalP / sim.peakP) * 100 : 0;
  out.push(
    `El precio fue de ${money(sim.startP)} a un pico de ${money(sim.peakP)} y cerró en ${money(sim.finalP)}.`,
  );
  if (p.whaleSize > 0) {
    out.push(
      sim.pnl.ballena >= 0
        ? `La ballena ganó ${money(sim.pnl.ballena)} comprando barato y vendiendo en el pico — a costa de los compradores tardíos.`
        : `La ballena infló el precio pero perdió ${money(Math.abs(sim.pnl.ballena))} al vender contra su propia curva.`,
    );
  }
  if (p.creatorSpend > 0) {
    out.push(
      `El creador invirtió ${money(sim.actors.creador.inv)} para premiar a sus fans, que terminaron con ${money(sim.actors.fans.tok * sim.finalP)} en tokens.`,
    );
  }
  if (p.panicPct > 0 && drop > 1) {
    out.push(`El pánico (P${PANIC_STEP + 1}) tumbó el precio ${drop.toFixed(0)}% desde el pico.`);
  }
  out.push(
    `La curva siempre tiene ${money(sim.reserve)} de liquidez real respaldando el token: nadie puede vaciarla.`,
  );
  return out;
}

/* ---------- component ---------- */
export function TokenSimulator() {
  const [p, setP] = useState<Params>(PRESETS.normal);
  const [active, setActive] = useState<string>("normal");
  const sim = useMemo(() => simulate(p), [p]);

  const set = (k: keyof Params, v: number) => {
    setP((prev) => ({ ...prev, [k]: v }));
    setActive("custom");
  };
  const preset = (name: string) => {
    setP(PRESETS[name]);
    setActive(name);
  };

  const chg = sim.startP > 0 ? (sim.finalP / sim.startP - 1) * 100 : 0;

  const sliders: { k: keyof Params; label: string; min: number; max: number; step: number; fmt: (v: number) => string; hint?: string }[] = [
    { k: "demand", label: "Compradores entran", min: 0, max: 3000, step: 50, fmt: (v) => `$${v}/paso` },
    { k: "sellPct", label: "Vendedores salen", min: 0, max: 25, step: 1, fmt: (v) => `${v}%/paso` },
    { k: "whaleSize", label: "Ballena (pump & dump)", min: 0, max: 30000, step: 500, fmt: (v) => (v === 0 ? "sin ballena" : `$${(v / 1000).toFixed(1)}K`) },
    { k: "creatorSpend", label: "Creador premia a fans", min: 0, max: 800, step: 25, fmt: (v) => (v === 0 ? "off" : `$${v}/paso`) },
    { k: "panicPct", label: "Pánico — venta masiva", min: 0, max: 80, step: 5, fmt: (v) => (v === 0 ? "off" : `${v}% del supply`) },
  ];

  const kpis: [string, string, string][] = [
    ["Precio final", money(sim.finalP), `${chg >= 0 ? "▲" : "▼"} ${Math.abs(chg).toFixed(0)}% vs inicio`],
    ["Market cap", money(sim.mcap), `${R(sim.finalS).toLocaleString("en-US")} tokens`],
    ["Liquidez (reserva)", money(sim.reserve), "respaldo on-chain"],
    ["Volumen total", money(sim.volTotal), "compras + ventas"],
    ["Fees de plataforma", money(sim.fees), "0.5% del volumen"],
  ];

  return (
    <div className="tsim">
      <style>{CSS}</style>

      <div className="tsim-kpis">
        {kpis.map((k) => (
          <div className="tsim-kpi" key={k[0]}>
            <div className="lab">{k[0]}</div>
            <div className="val">{k[1]}</div>
            <div className="note">{k[2]}</div>
          </div>
        ))}
      </div>

      <div className="tsim-grid">
        {/* controls */}
        <div className="tsim-card tsim-controls">
          <h3>Escenario</h3>
          <div className="tsim-seg">
            {["normal", "optimista", "pesimista"].map((n) => (
              <button key={n} className={active === n ? "on" : ""} onClick={() => preset(n)}>
                {n[0].toUpperCase() + n.slice(1)}
              </button>
            ))}
          </div>
          {sliders.map((s) => (
            <div className="tsim-ctrl" key={s.k}>
              <div className="top">
                <label>{s.label}</label>
                <span className="num">{s.fmt(p[s.k])}</span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={p[s.k]}
                onChange={(e) => set(s.k, Number(e.target.value))}
              />
            </div>
          ))}
          <p className="tsim-hint">
            Curva real de lanzamiento: raíz cuadrada, precio inicial 1:1. La ballena compra en P{WHALE_IN + 1} y vende
            en P{WHALE_OUT + 1}; el pánico ocurre en P{PANIC_STEP + 1}. {N} pasos.
          </p>
        </div>

        {/* charts */}
        <div className="tsim-stack">
          <div className="tsim-card">
            <h3>Precio en el tiempo</h3>
            <p className="desc">Cómo se mueve el precio paso a paso con las entradas, salidas y eventos.</p>
            <div dangerouslySetInnerHTML={{ __html: priceChart(sim) }} />
          </div>
          <div className="tsim-card">
            <h3>¿Quién gana, quién pierde?</h3>
            <p className="desc">Ganancia o pérdida final de cada actor, valorando lo que aún tienen al precio de cierre.</p>
            <div dangerouslySetInnerHTML={{ __html: pnlChart(sim) }} />
          </div>
        </div>
      </div>

      <div className="tsim-card" style={{ marginTop: 16 }}>
        <h3>La curva y dónde quedaste</h3>
        <p className="desc">El precio siempre vive sobre la misma curva de enlace; tu actividad solo te mueve a lo largo de ella.</p>
        <div dangerouslySetInnerHTML={{ __html: curveChart(sim) }} />
      </div>

      <div className="tsim-card tsim-story" style={{ marginTop: 16 }}>
        <h3>Qué pasó</h3>
        <ul>
          {narrative(sim, p).map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const CSS = `
.tsim{--bg:#0B0916;--surface:#141029;--line:rgba(255,255,255,.07);--ink:#ECEAF6;--muted:#9990C4;--faint:#6B6391;--teal:#2DD4BF;--violet:#8B7BF7;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink)}
.tsim h3{font-family:"Hoefler Text",Georgia,serif;font-weight:400;font-size:18px;margin:0 0 2px}
.tsim .desc{color:var(--muted);font-size:12.5px;margin:0 0 14px}
.tsim-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:16px}
.tsim-kpi{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px}
.tsim-kpi .lab{font-size:11.5px;color:var(--muted)}
.tsim-kpi .val{font-family:ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;font-size:21px;font-weight:600;margin-top:6px;color:#fff}
.tsim-kpi .note{font-size:11px;color:var(--faint);margin-top:3px}
.tsim-grid{display:grid;grid-template-columns:300px 1fr;gap:16px;align-items:start}
.tsim-card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:18px}
.tsim-stack{display:flex;flex-direction:column;gap:16px}
.tsim-controls{position:sticky;top:14px}
.tsim-seg{display:flex;gap:6px;background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:4px;margin:10px 0 18px}
.tsim-seg button{flex:1;border:0;background:transparent;color:var(--muted);font:inherit;font-size:12px;padding:8px 4px;border-radius:7px;cursor:pointer;transition:.15s}
.tsim-seg button.on{background:var(--violet);color:#0c0a18;font-weight:600}
.tsim-ctrl{margin-bottom:15px}
.tsim-ctrl .top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:7px}
.tsim-ctrl label{font-size:13px;color:var(--ink)}
.tsim-ctrl .num{font-family:ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;color:var(--teal);font-size:13px;font-weight:600}
.tsim input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:4px;background:linear-gradient(90deg,var(--violet),var(--teal));outline:none}
.tsim input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#fff;border:2px solid var(--violet);cursor:pointer}
.tsim input[type=range]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:#fff;border:2px solid var(--violet);cursor:pointer}
.tsim-hint{font-size:11.5px;color:var(--faint);margin-top:14px;line-height:1.5}
.tsim-story ul{margin:6px 0 0;padding-left:18px;color:var(--muted);font-size:13.5px;line-height:1.7}
.tsim-story li{margin-bottom:4px}
@media (max-width:900px){.tsim-kpis{grid-template-columns:repeat(2,1fr)}.tsim-grid{grid-template-columns:1fr}.tsim-controls{position:static}}
`;
