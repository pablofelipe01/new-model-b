import { NextResponse } from "next/server";

/**
 * Live financial-model data for /simulaciones.
 *
 * Reads the public Google Sheet (the source of truth for the pre-seed model)
 * server-side as CSV — avoids browser CORS — parses the relevant tabs, and
 * returns a JSON shape that mirrors the dashboard's `BASE` object. If the
 * Sheet is unreachable or a field can't be parsed, we fall back to the
 * baked-in values so the dashboard always renders.
 *
 * Sheet: https://docs.google.com/spreadsheets/d/1PKpa8EVSOFvV6qulrFwAZhKqBcsc9CXtTqugcwr6CsA
 */

const SHEET_ID = "1PKpa8EVSOFvV6qulrFwAZhKqBcsc9CXtTqugcwr6CsA";

// Re-fetch the Sheet at most once per hour (ISR-style caching).
export const revalidate = 3600;

/** Baked-in fallback — must stay in sync with the model's documented base case. */
const FALLBACK = {
  raise: 200000,
  equity: 0.05,
  launchFee: 25,
  feePct: 0.005,
  ticket: 20,
  tx: 25,
  act: 0.6,
  nominaPre: 7300,
  nominaPost: 22000,
  infraPre: 648,
  infraPost: 760,
  postMktg: 12000,
  seedAmt: 1500000,
  seedEq: 0.15,
  aEq: 0.167,
  esop: 0.1,
  launches: [8, 15, 25, 38, 52, 65, 85, 105, 125, 145, 165, 185, 205, 225, 245, 265, 285, 305, 325, 345, 365, 385, 405, 425],
  paying: [0, 0, 0.1, 0.2, 0.3, 0.4, 0.55, 0.6, 0.65, 0.7, 0.7, 0.7, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9],
  onetime: [7500, 25000, 10000, 2500, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  mktg: [5000, 8000, 12000, 14000, 15000, 16000, 12000, 12000, 12000, 12000, 12000, 12000, 12000, 12000, 12000, 12000, 12000, 12000, 12000, 12000, 12000, 12000, 12000, 12000],
  uof: [
    { label: "Adquisición de creadores + marketing (6m)", amount: 70000 },
    { label: "Nómina equipo (6 meses)", amount: 43800 },
    { label: "Auditoría de smart contract", amount: 25000 },
    { label: "Constitución Inc. + legal/regulatorio", amount: 17500 },
    { label: "Branding y web", amount: 2500 },
    { label: "Infraestructura y SaaS (6 meses)", amount: 3888 },
    { label: "Reserva / contingencia", amount: 37312 },
  ],
  source: "fallback" as "fallback" | "sheet",
};

type Model = typeof FALLBACK;

/** Minimal CSV parser: handles quoted fields, embedded commas and "" escapes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** "$7,300" → 7300 · "0.5%" → 0.005 · "1.8x" → 1.8 · "-"/"" → 0 */
function parseNum(raw: string | undefined): number {
  if (!raw) return 0;
  const s = raw.trim();
  if (s === "" || s === "-" || s === "—") return 0;
  const isPct = s.includes("%");
  const cleaned = s.replace(/[$,%x×\s]/g, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return 0;
  return isPct ? n / 100 : n;
}

async function fetchTab(tab: string): Promise<string[][] | null> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
  try {
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) return null;
    return parseCsv(await res.text());
  } catch {
    return null;
  }
}

/** Find a row whose first cell contains `needle` (case-insensitive). */
function findRow(rows: string[][], needle: string): string[] | undefined {
  const n = needle.toLowerCase();
  return rows.find((r) => (r[0] ?? "").toLowerCase().includes(n));
}

/** Pull a scalar from a label/value tab (Supuestos): value is in column index 1. */
function scalar(rows: string[][], needle: string, fallback: number): number {
  const row = findRow(rows, needle);
  if (!row) return fallback;
  const v = parseNum(row[1]);
  return v || fallback;
}

/** Pull the 24 monthly values from a row, starting at column `from`. */
function monthly(rows: string[][], needle: string, fallback: number[], from = 1): number[] {
  const row = findRow(rows, needle);
  if (!row) return fallback;
  const out = row.slice(from, from + 24).map(parseNum);
  return out.length === 24 ? out : fallback;
}

export async function GET() {
  const model: Model = { ...FALLBACK, source: "fallback" };

  try {
    const [supuestos, ingresos, costos, uso] = await Promise.all([
      fetchTab("Supuestos"),
      fetchTab("Ingresos"),
      fetchTab("Costos"),
      fetchTab("Uso_de_Fondos"),
    ]);

    let got = false;

    if (supuestos) {
      model.raise = scalar(supuestos, "monto pre-seed", model.raise);
      model.equity = scalar(supuestos, "equity vendido", model.equity);
      model.nominaPre = scalar(supuestos, "nómina mensual — fase pre-seed", model.nominaPre);
      model.nominaPost = scalar(supuestos, "nómina mensual — fase post-seed", model.nominaPost);
      model.infraPre = scalar(supuestos, "infra mensual — base", model.infraPre);
      model.infraPost = scalar(supuestos, "infra mensual — post-seed", model.infraPost);
      model.feePct = scalar(supuestos, "fee de plataforma", model.feePct);
      model.launchFee = scalar(supuestos, "fee de lanzamiento", model.launchFee);
      model.ticket = scalar(supuestos, "ticket promedio", model.ticket);
      model.tx = scalar(supuestos, "transacciones por token activo", model.tx);
      model.act = scalar(supuestos, "tasa de tokens activos", model.act);
      model.seedAmt = scalar(supuestos, "seed — monto", model.seedAmt);
      model.seedEq = scalar(supuestos, "seed — equity", model.seedEq);
      model.aEq = scalar(supuestos, "serie a — equity", model.aEq);
      model.esop = scalar(supuestos, "pool de opciones", model.esop);
      got = true;
    }

    if (ingresos) {
      model.launches = monthly(ingresos, "lanzamientos nuevos", model.launches);
      model.paying = monthly(ingresos, "lanzamientos que pagan", model.paying);
      got = true;
    }

    if (costos) {
      model.onetime = monthly(costos, "costos únicos", model.onetime);
      model.mktg = monthly(costos, "marketing", model.mktg);
      model.postMktg = model.mktg[6] || model.postMktg; // post-seed marketing = M7+
      got = true;
    }

    if (uso) {
      const items: { label: string; amount: number }[] = [];
      for (const row of uso) {
        const label = (row[0] ?? "").trim();
        if (!label || /total|objetivo del pre-seed|concepto/i.test(label)) continue;
        const amount = parseNum(row[1]);
        if (amount > 0) items.push({ label, amount });
      }
      if (items.length) {
        model.uof = items.sort((a, b) => b.amount - a.amount);
        got = true;
      }
    }

    if (got) model.source = "sheet";
  } catch {
    // keep fallback
  }

  return NextResponse.json(model, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
