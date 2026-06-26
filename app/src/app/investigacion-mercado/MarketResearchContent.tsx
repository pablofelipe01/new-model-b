"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useLanguage } from "@/components/providers/LanguageProvider";

/**
 * Investor-facing market research — bilingual React route (not a static HTML
 * page). Reuses the executive-summary data, charts and violet/navy styling,
 * driven by useLanguage so it renders in es/en like the rest of the app.
 */

const GRID = "#262C52";
const TICK = "#9AA0C0";
const VIOLET = "#6D5CFF";
const VIOLET2 = "#8E80FF";
const MINT = "#2EE6A6";

const tooltipStyle = {
  background: "#11142E",
  border: "1px solid #262C52",
  borderRadius: 8,
  color: "#EDEEF7",
  fontSize: 12,
};

type L = { es: string; en: string };
const t = (l: L, es: boolean) => (es ? l.es : l.en);

export function MarketResearchContent() {
  const { lang } = useLanguage();
  const es = lang === "es";

  // ---- chart data ----
  const creatorData = [
    { year: "2023", v: 250 },
    { year: "2024", v: 305 },
    { year: "2025", v: 365 },
    { year: "2026", v: 425 },
    { year: "2027", v: 480 },
  ];
  const tokenData = [
    { name: "McKinsey ’30", v: 3, c: VIOLET + "AA" },
    { name: "Citi ’30", v: 4.5, c: VIOLET + "AA" },
    { name: "Ark ’30", v: 11, c: VIOLET },
    { name: "BCG ’30", v: 16, c: VIOLET },
    { name: "BCG/Ripple ’33", v: 19, c: MINT },
    { name: "Std Chartered ’34", v: 30, c: MINT },
  ];
  const stableData = [
    { name: "Argentina", v: 72, c: MINT },
    { name: "Brasil", v: 70, c: MINT + "CC" },
    { name: "Colombia", v: 55, c: MINT + "AA" },
    { name: es ? "Promedio LATAM" : "LATAM average", v: 55, c: MINT + "88" },
  ];
  const igData = [
    { name: "Argentina*", reach: 81.7 },
    { name: "Chile*", reach: 79.8 },
    { name: "Brasil", users: 113 },
    { name: "México", users: 49 },
    { name: "Colombia", users: 18 },
  ];

  const stats = [
    { n: "US$480B", k: "v", l: { es: "Creator economy proyectada a 2027", en: "Creator economy projected to 2027" }, s: "Goldman Sachs Research" },
    { n: "US$16B*", k: "v", l: { es: "Activos tokenizados a 2030 (*billones)", en: "Tokenized assets by 2030 (*trillions)" }, s: es ? "BCG — escenario base" : "BCG — base case" },
    { n: "#2", k: "m", l: { es: "Región del mundo en adopción cripto", en: "World region by crypto adoption" }, s: "Chainalysis 2024" },
    { n: "72%", k: "m", l: { es: "de compras cripto en stablecoins (Argentina)", en: "of crypto buys in stablecoins (Argentina)" }, s: "Bitso 2024" },
  ];

  const pioneers: { p: string; net: string; validated: L; traction: L; lesson: L }[] = [
    { p: "friend.tech", net: "Base", validated: { es: "Demanda por “invertir” en personas", en: "Demand to “invest” in people" }, traction: { es: "~US$50M TVL; ~US$90M en fees (2023)", en: "~US$50M TVL; ~US$90M in fees (2023)" }, lesson: { es: "Sin utilidad ni retención, la especulación se agota", en: "Without utility or retention, speculation fizzles out" } },
    { p: "pump.fun", net: "Solana", validated: { es: "Bonding curve + fees = ingresos masivos", en: "Bonding curve + fees = massive revenue" }, traction: { es: ">US$1B en ingresos; ICO US$1.3B (2025)", en: ">US$1B in revenue; ICO US$1.3B (2025)" }, lesson: { es: "Hay hueco para una alternativa no especulativa", en: "There's room for a non-speculative alternative" } },
    { p: "Strata", net: "Solana", validated: { es: "Viabilidad técnica de social tokens", en: "Technical viability of social tokens" }, traction: { es: "Absorbido por Helium (2022)", en: "Absorbed by Helium (2022)" }, lesson: { es: "El foso es la UX y la distribución, no el contrato", en: "The moat is UX and distribution, not the contract" } },
    { p: "Rally", net: es ? "Sidechain ETH" : "ETH sidechain", validated: { es: "Apetito de creadores por su economía", en: "Creators' appetite for their own economy" }, traction: { es: "US$57M recaudados (2021)", en: "US$57M raised (2021)" }, lesson: { es: "Infraestructura propia y frágil es un riesgo existencial", en: "Proprietary, fragile infra is an existential risk" } },
    { p: "BitClout / DeSo", net: es ? "Cadena propia" : "Own chain", validated: { es: "Tokenización de perfiles a escala", en: "Tokenizing profiles at scale" }, traction: { es: "~US$257M; ~250k usuarios pico", en: "~US$257M; ~250k peak users" }, lesson: { es: "El encuadre legal y el marketing importan", en: "Legal framing and marketing matter" } },
  ];

  const diff: { cap: L; vals: { t: "yes" | "no" | "partial"; l: L }[] }[] = [
    { cap: { es: "Sin wallet cripto (login con Google)", en: "No crypto wallet (Google login)" }, vals: [{ t: "yes", l: { es: "Sí", en: "Yes" } }, { t: "no", l: { es: "No", en: "No" } }, { t: "no", l: { es: "No", en: "No" } }, { t: "yes", l: { es: "N/A", en: "N/A" } }] },
    { cap: { es: "Compra con tarjeta en moneda local", en: "Card purchase in local currency" }, vals: [{ t: "yes", l: { es: "Sí", en: "Yes" } }, { t: "no", l: { es: "No", en: "No" } }, { t: "no", l: { es: "No", en: "No" } }, { t: "yes", l: { es: "Sí", en: "Yes" } }] },
    { cap: { es: "Reserva intocable verificable on-chain", en: "Untouchable reserve verifiable on-chain" }, vals: [{ t: "yes", l: { es: "Sí", en: "Yes" } }, { t: "no", l: { es: "No", en: "No" } }, { t: "partial", l: { es: "Parcial", en: "Partial" } }, { t: "no", l: { es: "N/A", en: "N/A" } }] },
    { cap: { es: "Curva sostenible (raíz cuadrada)", en: "Sustainable curve (square root)" }, vals: [{ t: "yes", l: { es: "Sí", en: "Yes" } }, { t: "no", l: { es: "No", en: "No" } }, { t: "no", l: { es: "No", en: "No" } }, { t: "no", l: { es: "N/A", en: "N/A" } }] },
    { cap: { es: "El fan participa del éxito (upside)", en: "Fans share in the upside" }, vals: [{ t: "yes", l: { es: "Sí", en: "Yes" } }, { t: "partial", l: { es: "Parcial", en: "Partial" } }, { t: "partial", l: { es: "Parcial", en: "Partial" } }, { t: "no", l: { es: "No", en: "No" } }] },
    { cap: { es: "Foco LATAM / monedas locales", en: "LATAM focus / local currencies" }, vals: [{ t: "yes", l: { es: "Sí", en: "Yes" } }, { t: "no", l: { es: "No", en: "No" } }, { t: "no", l: { es: "No", en: "No" } }, { t: "no", l: { es: "No", en: "No" } }] },
  ];

  const swot: { color: string; title: L; items: L[] }[] = [
    { color: MINT, title: { es: "Fortalezas", en: "Strengths" }, items: [
      { es: "UX fiat-first: login con Google + tarjeta en COP/MXN/BRL. Nadie lo combinó.", en: "Fiat-first UX: Google login + card in COP/MXN/BRL. No one combined it." },
      { es: "Foco LATAM: región #2 en adopción y líder en stablecoins.", en: "LATAM focus: #2 region in adoption and stablecoin leader." },
      { es: "Credibilidad on-chain: reserva intocable verificable.", en: "On-chain credibility: verifiable untouchable reserve." },
      { es: "Solana: comisiones casi nulas para microtransacciones.", en: "Solana: near-zero fees for microtransactions." },
      { es: "Fee de creador (0–5% perpetuo): modelo validado por pump.fun.", en: "Creator fee (0–5% perpetual): model validated by pump.fun." },
    ] },
    { color: "#F2B85A", title: { es: "Debilidades", en: "Weaknesses" }, items: [
      { es: "La ventaja está en UX, marca y distribución, no en la tecnología.", en: "The edge is in UX, brand and distribution, not technology." },
      { es: "Etapa temprana: pre-ingresos, en testnet, equipo compacto que esta ronda amplía.", en: "Early stage: pre-revenue, on testnet, lean team this round expands." },
      { es: "Dependencia de terceros (Privy/Stripe y on-ramp por definir).", en: "Third-party dependence (Privy/Stripe and on-ramp TBD)." },
    ] },
    { color: VIOLET2, title: { es: "Oportunidades", en: "Opportunities" }, items: [
      { es: "Hueco “anti-memecoin”: demanda probada, vacío de producto serio.", en: "“Anti-memecoin” gap: proven demand, no serious product." },
      { es: "Ventana regulatoria favorable en EEUU (2025–2026).", en: "Favorable regulatory window in the US (2025–2026)." },
      { es: "Creadores de larga cola mal monetizados (>50% gana <US$15k/año).", en: "Poorly-monetized long-tail creators (>50% earn <US$15k/yr)." },
      { es: "Bancarización incompleta + adopción de dólar digital en LATAM.", en: "Incomplete banking + digital-dollar adoption in LATAM." },
    ] },
    { color: "#C0556E", title: { es: "Amenazas (y mitigación)", en: "Threats (and mitigation)" }, items: [
      { es: "Retención: se sostiene con utilidad y pertenencia, no especulación.", en: "Retention: sustained by utility and belonging, not speculation." },
      { es: "Riesgo de valores: se mitiga con encuadre legal desde el día uno.", en: "Securities risk: mitigated with legal framing from day one." },
      { es: "Entrada de un incumbente: el foso es la UX fiat-first + LATAM.", en: "Incumbent entry: the moat is fiat-first UX + LATAM." },
      { es: "VASP Brasil (feb 2026): contemplado en la secuenciación regional.", en: "Brazil VASP (Feb 2026): contemplated in regional sequencing." },
    ] },
  ];

  const road: { step: L; items: L[] }[] = [
    { step: { es: "1 · Antes del cierre", en: "1 · Before closing" }, items: [
      { es: "Opinión legal sobre la clasificación del token", en: "Legal opinion on token classification" },
      { es: "Publicar la prueba on-chain de la reserva intocable", en: "Publish on-chain proof of the untouchable reserve" },
      { es: "Ampliar el equipo (smart contracts + cumplimiento)", en: "Expand the team (smart contracts + compliance)" },
    ] },
    { step: { es: "2 · Hitos a demostrar (KPIs)", en: "2 · Milestones to prove (KPIs)" }, items: [
      { es: "Retención de holders a 30/90 días post-mainnet", en: "Holder retention at 30/90 days post-mainnet" },
      { es: "Creadores con comunidades reales", en: "Creators with real communities" },
      { es: "Volumen vía on-ramp fiat", en: "Volume via fiat on-ramp" },
      { es: "Avance de cumplimiento VASP en Brasil", en: "VASP compliance progress in Brazil" },
    ] },
    { step: { es: "3 · Gestión de riesgos", en: "3 · Risk management" }, items: [
      { es: "Baja retención → más utilidad y perks", en: "Low retention → more utility and perks" },
      { es: "Entra un incumbente → reforzar foso UX + LATAM", en: "Incumbent enters → reinforce UX + LATAM moat" },
      { es: "VASP costoso → secuenciar México y Colombia", en: "Costly VASP → sequence Mexico and Colombia" },
    ] },
  ];

  return (
    <div className="mkr">
      <style>{CSS}</style>
      <div className="mkr-wrap">
        <header className="mkr-head">
          <div className="brand">
            <div className="wordmark">matiz</div>
            <div className="sub">{es ? "Resumen ejecutivo · Investigación de mercado" : "Executive summary · Market research"}</div>
          </div>
          <div className="tag">
            <div><b>{es ? "Ronda pre-seed" : "Pre-seed round"}</b> · US$200K (SAFE)</div>
            <div>US$4M post-money · Solana</div>
            <div className="pill">{es ? "Junio 2026 · Confidencial" : "June 2026 · Confidential"}</div>
          </div>
        </header>

        <h1 className="mkr-title">
          {es ? "La tokenización de personas y marcas, " : "Tokenizing people and brands, "}
          <span className="accent">{es ? "aterrizada en LATAM" : "grounded in LATAM"}</span>
        </h1>
        <p className="lede">
          {es
            ? "Matiz se sitúa en la intersección de dos megatendencias validadas por las mayores instituciones del mundo: la tokenización de activos y la creator economy. Este resumen visual condensa el tamaño de la oportunidad, la adopción en la región y el posicionamiento competitivo."
            : "Matiz sits at the intersection of two megatrends validated by the world's largest institutions: asset tokenization and the creator economy. This visual summary condenses the size of the opportunity, regional adoption and competitive positioning."}
        </p>

        {/* STAT BAND */}
        <section style={{ marginTop: 30 }}>
          <div className="stats">
            {stats.map((s) => (
              <div className="stat" key={s.n}>
                <div className={`n ${s.k}`}>{s.n}</div>
                <div className="l">{t(s.l, es)}</div>
                <div className="src">{s.s}</div>
              </div>
            ))}
          </div>
        </section>

        {/* INSTITUTIONAL QUOTE */}
        <section>
          <div className="eyebrow">{es ? "Validación institucional" : "Institutional validation"}</div>
          <h2>{es ? "La tokenización es la apuesta declarada de las finanzas tradicionales" : "Tokenization is the declared bet of traditional finance"}</h2>
          <p className="sec-sub">{es ? "No es una narrativa cripto de nicho: es la tesis central de los gestores de activos más grandes del planeta." : "It's not a niche crypto narrative: it's the core thesis of the planet's largest asset managers."}</p>
          <div className="quote">
            <p>{es
              ? "“Cada acción, cada bono, cada fondo —cada activo— puede ser tokenizado. Si lo son, revolucionará la inversión (…). La tokenización hace la inversión mucho más democrática.”"
              : "“Every stock, every bond, every fund — every asset — can be tokenized. If they are, it will revolutionize investing (…). Tokenization makes investing far more democratic.”"}</p>
            <div className="who">{es
              ? "— Larry Fink, CEO de BlackRock (~US$14 billones bajo gestión) · Carta anual a inversores, 2025–2026"
              : "— Larry Fink, CEO of BlackRock (~US$14T under management) · Annual letter to investors, 2025–2026"}</div>
          </div>
        </section>

        {/* MARKET SIZE */}
        <section>
          <div className="eyebrow">{es ? "El tamaño de la oportunidad" : "The size of the opportunity"}</div>
          <div className="grid g2">
            <div className="card">
              <h3>{es ? "Creator economy global" : "Global creator economy"}</h3>
              <div className="note">{es ? "Camino a duplicarse en cuatro años" : "On track to double in four years"}</div>
              <div className="chart-box">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={creatorData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor={VIOLET} stopOpacity={0.35} />
                        <stop offset="1" stopColor={VIOLET} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <XAxis dataKey="year" tick={{ fill: TICK, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => "US$" + v + "B"} tick={{ fill: TICK, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`US$${v}B`, es ? "Tamaño" : "Size"]} />
                    <Area dataKey="v" stroke={VIOLET} strokeWidth={3} fill="url(#cg)" dot={{ fill: VIOLET2, r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="src">{es ? "Fuente: Goldman Sachs Research (~US$250B en 2023 → ~US$480B en 2027)." : "Source: Goldman Sachs Research (~US$250B in 2023 → ~US$480B in 2027)."}</div>
            </div>
            <div className="card">
              <h3>{es ? "Activos tokenizados (RWA) — proyecciones" : "Tokenized assets (RWA) — projections"}</h3>
              <div className="note">{es ? "En billones de USD, por firma y horizonte" : "In USD trillions, by firm and horizon"}</div>
              <div className="chart-box">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tokenData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: TICK, fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis tickFormatter={(v) => "US$" + v + "T"} tick={{ fill: TICK, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(109,92,255,.08)" }} formatter={(v: number) => [`US$${v}T`, es ? "Proyección" : "Projection"]} />
                    <Bar dataKey="v" radius={[6, 6, 0, 0]}>
                      {tokenData.map((d) => (
                        <Cell key={d.name} fill={d.c} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="src">{es ? "Mercado actual ~US$20–25B. Fuentes: McKinsey, Citi, Ark Invest, BCG, BCG/Ripple, Standard Chartered." : "Current market ~US$20–25B. Sources: McKinsey, Citi, Ark Invest, BCG, BCG/Ripple, Standard Chartered."}</div>
            </div>
          </div>
        </section>

        {/* LATAM */}
        <section>
          <div className="eyebrow">{es ? "Por qué LATAM, por qué ahora" : "Why LATAM, why now"}</div>
          <h2>{es ? "La región ya adoptó el dólar digital por necesidad" : "The region already adopted the digital dollar out of necessity"}</h2>
          <p className="sec-sub">{es ? "Inflación, devaluación y controles de capital convirtieron a las stablecoins en la puerta de entrada cripto de la región. Es el terreno ideal para una propuesta fiat-first." : "Inflation, devaluation and capital controls turned stablecoins into the region's crypto gateway. It's the ideal ground for a fiat-first proposition."}</p>
          <div className="grid g2">
            <div className="card">
              <h3>{es ? "Participación de stablecoins en compras cripto" : "Stablecoin share of crypto buys"}</h3>
              <div className="note">{es ? "Las stablecoins dominan los flujos minoristas" : "Stablecoins dominate retail flows"}</div>
              <div className="chart-box">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stableData} layout="vertical" margin={{ top: 8, right: 16, left: 24, bottom: 0 }}>
                    <CartesianGrid stroke={GRID} horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => v + "%"} tick={{ fill: TICK, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: TICK, fontSize: 12 }} axisLine={false} tickLine={false} width={96} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(46,230,166,.08)" }} formatter={(v: number) => [`${v}%`, es ? "En stablecoins" : "In stablecoins"]} />
                    <Bar dataKey="v" radius={[0, 6, 6, 0]}>
                      {stableData.map((d) => (
                        <Cell key={d.name} fill={d.c} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="src">{es ? "Fuentes: Chainalysis 2024–2025; Bitso (Argentina, 2024). Cifras aproximadas." : "Sources: Chainalysis 2024–2025; Bitso (Argentina, 2024). Approximate figures."}</div>
            </div>
            <div className="card">
              <h3>{es ? "Penetración de Instagram — mercados clave" : "Instagram penetration — key markets"}</h3>
              <div className="note">{es ? "Alcance / usuarios donde nacen los creadores" : "Reach / users where creators are born"}</div>
              <div className="chart-box">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={igData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: TICK, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis yAxisId="left" domain={[0, 100]} tickFormatter={(v) => v + "%"} tick={{ fill: TICK, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 140]} tick={{ fill: TICK, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(109,92,255,.08)" }} formatter={(v: number, n) => (n === "reach" ? [`${v}%`, es ? "Alcance" : "Reach"] : [`${v}M`, es ? "Usuarios" : "Users"])} />
                    <Bar yAxisId="left" dataKey="reach" fill={VIOLET} radius={[6, 6, 0, 0]} />
                    <Bar yAxisId="right" dataKey="users" fill={VIOLET2 + "99"} radius={[6, 6, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mkr-legend">
                <span><i style={{ background: VIOLET }} />{es ? "Alcance (%)" : "Reach (%)"}</span>
                <span><i style={{ background: VIOLET2 + "99" }} />{es ? "Usuarios (M)" : "Users (M)"}</span>
              </div>
              <div className="src">{es ? "Fuentes: DataReportal / Statista 2024. Argentina y Chile por tasa de alcance; resto por millones de usuarios." : "Sources: DataReportal / Statista 2024. Argentina and Chile by reach rate; rest by millions of users."}</div>
            </div>
          </div>
        </section>

        {/* PIONEERS */}
        <section>
          <div className="eyebrow">{es ? "Lecciones de los pioneros" : "Lessons from the pioneers"}</div>
          <h2>{es ? "La demanda está probada; las causas de fracaso, identificadas" : "Demand is proven; the causes of failure, identified"}</h2>
          <p className="sec-sub">{es ? "Cada pionero validó el apetito del mercado antes de tropezar con un obstáculo concreto. Matiz está diseñado para corregir esas tres causas: fricción, especulación y desconfianza en la custodia." : "Each pioneer validated market appetite before hitting a concrete obstacle. Matiz is designed to fix those three causes: friction, speculation and custody distrust."}</p>
          <div className="card tablecard">
            <table>
              <thead>
                <tr>
                  <th>{es ? "Plataforma" : "Platform"}</th>
                  <th>{es ? "Red" : "Network"}</th>
                  <th>{es ? "Lo que validó" : "What it validated"}</th>
                  <th>{es ? "Tracción alcanzada" : "Traction reached"}</th>
                  <th>{es ? "Lección para Matiz" : "Lesson for Matiz"}</th>
                </tr>
              </thead>
              <tbody>
                {pioneers.map((r) => (
                  <tr key={r.p}>
                    <td><span className="name">{r.p}</span></td>
                    <td>{r.net}</td>
                    <td>{t(r.validated, es)}</td>
                    <td>{t(r.traction, es)}</td>
                    <td>{t(r.lesson, es)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* VIDEO */}
        <section>
          <div className="eyebrow">{es ? "En video" : "On video"}</div>
          <h2>{es ? "La autopsia de SocialFi: diseñando el token de creador de 2.ª generación" : "The autopsy of SocialFi: architecting the Gen-2 creator token"}</h2>
          <p className="sec-sub">{es ? "Por qué fracasó la primera ola de social tokens y cómo Matiz corrige sus causas de raíz." : "Why the first wave of social tokens failed and how Matiz fixes its root causes."}</p>
          <figure style={{ margin: "8px 0 0" }}>
            <iframe
              src="https://www.youtube-nocookie.com/embed/iFizJrDWOCs?rel=0"
              title={es ? "La autopsia de SocialFi" : "The autopsy of SocialFi"}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: 16, border: "1px solid var(--line)", display: "block", background: "#0A0C1C" }}
            />
            <figcaption style={{ fontSize: 12.5, color: "var(--muted2)", textAlign: "center", marginTop: 10 }}>
              {es ? "Análisis en video · Matiz Protocol" : "Video analysis · Matiz Protocol"}
            </figcaption>
          </figure>
        </section>

        {/* DIFFERENTIATION */}
        <section>
          <div className="eyebrow">{es ? "Diferenciación" : "Differentiation"}</div>
          <h2>{es ? "Lo que ningún predecesor combinó" : "What no predecessor combined"}</h2>
          <p className="sec-sub">{es ? "La ventaja no está en la matemática (las bonding curves son commodity), sino en eliminar la fricción y garantizar la confianza." : "The edge isn't in the math (bonding curves are commodity), but in removing friction and guaranteeing trust."}</p>
          <div className="card tablecard">
            <table>
              <thead>
                <tr>
                  <th>{es ? "Capacidad" : "Capability"}</th>
                  <th>Matiz</th>
                  <th>friend.tech</th>
                  <th>pump.fun</th>
                  <th>Patreon</th>
                </tr>
              </thead>
              <tbody>
                {diff.map((r) => (
                  <tr key={r.cap.en}>
                    <td>{t(r.cap, es)}</td>
                    {r.vals.map((v, i) => (
                      <td key={i} className={v.t}>{t(v.l, es)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SWOT */}
        <section>
          <div className="eyebrow">{es ? "Posicionamiento" : "Positioning"}</div>
          <h2>{es ? "Análisis FODA" : "SWOT analysis"}</h2>
          <div className="swot">
            {swot.map((q) => (
              <div className="card" key={q.title.en}>
                <h3 className="swot-h"><span className="dot" style={{ background: q.color }} />{t(q.title, es)}</h3>
                <ul>
                  {q.items.map((it) => (
                    <li key={it.en}>{t(it, es)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ROADMAP */}
        <section>
          <div className="eyebrow">{es ? "Plan de acción" : "Action plan"}</div>
          <h2>{es ? "Cómo convertimos el pre-seed en hitos verificables" : "How we turn the pre-seed into verifiable milestones"}</h2>
          <div className="road">
            {road.map((r) => (
              <div className="card" key={r.step.en}>
                <div className="step">{t(r.step, es)}</div>
                <ul>
                  {r.items.map((it) => (
                    <li key={it.en}>{t(it, es)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <footer className="mkr-foot">
          <div>{es ? "matiz.community · Documento confidencial · Junio 2026" : "matiz.community · Confidential document · June 2026"}</div>
          <div>{es ? "Fuentes" : "Sources"}: Goldman Sachs, BlackRock, BCG, McKinsey, Standard Chartered, Citi, Ark Invest, Chainalysis, a16z, DataReportal, Solidus Labs.</div>
        </footer>
      </div>
    </div>
  );
}

const CSS = `
.mkr{--navy:#0A0C1C;--panel:#11142E;--panel2:#151A38;--line:#262C52;--violet:#6D5CFF;--violet2:#8E80FF;--mint:#2EE6A6;--amber:#F2B85A;--text:#EDEEF7;--muted:#9AA0C0;--muted2:#6E749A;
  background:var(--navy);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.5;-webkit-font-smoothing:antialiased;display:block}
.mkr *{box-sizing:border-box}
.mkr-wrap{max-width:1180px;margin:0 auto;padding:0 26px 80px}
.mkr-head{padding:34px 0 22px;border-bottom:1px solid var(--line);display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap}
.mkr .wordmark{font-size:26px;font-weight:800;letter-spacing:-.01em}
.mkr .brand .sub{color:var(--muted);font-size:13px;letter-spacing:.14em;text-transform:uppercase;margin-top:12px}
.mkr .tag{text-align:right;color:var(--muted)}
.mkr .tag b{color:var(--text)}
.mkr .tag .pill{display:inline-block;margin-top:8px;font-size:12px;color:var(--mint);border:1px solid rgba(46,230,166,.35);background:rgba(46,230,166,.08);padding:4px 10px;border-radius:99px}
.mkr-title{font-size:30px;font-weight:800;letter-spacing:-.01em;margin:30px 0 6px}
.mkr-title .accent{color:var(--violet2)}
.mkr .lede{color:var(--muted);max-width:760px;font-size:15px}
.mkr section{margin-top:46px}
.mkr .eyebrow{display:flex;align-items:center;gap:10px;color:var(--violet2);font-size:12px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;margin-bottom:14px}
.mkr .eyebrow::before{content:"";width:26px;height:2px;background:var(--violet);border-radius:2px}
.mkr h2{font-size:21px;font-weight:750;margin-bottom:4px}
.mkr .sec-sub{color:var(--muted);font-size:14px;margin-bottom:18px;max-width:820px}
.mkr .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.mkr .stat{background:linear-gradient(160deg,var(--panel),var(--panel2));border:1px solid var(--line);border-radius:14px;padding:18px 16px}
.mkr .stat .n{font-size:26px;font-weight:800;letter-spacing:-.01em}
.mkr .stat .n.v{color:var(--violet2)} .mkr .stat .n.m{color:var(--mint)}
.mkr .stat .l{color:var(--muted);font-size:12.5px;margin-top:5px}
.mkr .stat .src{color:var(--muted2);font-size:10.5px;margin-top:8px}
.mkr .grid{display:grid;gap:16px}
.mkr .g2{grid-template-columns:1fr 1fr}
.mkr .card{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:20px}
.mkr .card h3{font-size:15px;font-weight:700;margin-bottom:2px}
.mkr .card .note{color:var(--muted);font-size:12.5px;margin-bottom:14px}
.mkr .chart-box{position:relative;height:300px}
.mkr .src{color:var(--muted2);font-size:11px;margin-top:12px}
.mkr .tablecard{padding:6px}
.mkr table{width:100%;border-collapse:collapse;font-size:13px}
.mkr th,.mkr td{text-align:left;padding:11px 12px;border-bottom:1px solid var(--line);vertical-align:top}
.mkr thead th{background:#0E1230;color:var(--muted);font-size:11px;letter-spacing:.06em;text-transform:uppercase;font-weight:700}
.mkr tbody tr:hover{background:rgba(109,92,255,.05)}
.mkr td .name{font-weight:700;color:var(--text)}
.mkr td.yes{color:var(--mint);font-weight:700} .mkr td.no{color:#6E749A} .mkr td.partial{color:var(--amber)}
.mkr .swot{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.mkr .swot-h{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.mkr .dot{width:9px;height:9px;border-radius:99px;display:inline-block}
.mkr .swot ul,.mkr .road ul{list-style:none;display:flex;flex-direction:column;gap:8px;margin:0;padding:0}
.mkr .swot li{font-size:13px;color:#D7DAEC;padding-left:16px;position:relative}
.mkr .swot li::before{content:"";position:absolute;left:0;top:8px;width:5px;height:5px;border-radius:99px;background:var(--muted2)}
.mkr .road{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.mkr .road .card{border-top:3px solid var(--violet)}
.mkr .road .step{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--violet2);font-weight:700;margin-bottom:8px}
.mkr .road li{font-size:13px;color:#D7DAEC;padding-left:18px;position:relative}
.mkr .road li::before{content:"\\2192";position:absolute;left:0;color:var(--violet2)}
.mkr .quote{background:linear-gradient(160deg,rgba(109,92,255,.10),rgba(109,92,255,.02));border:1px solid rgba(109,92,255,.30);border-left:4px solid var(--violet);border-radius:14px;padding:20px 22px;margin-top:8px}
.mkr .quote p{font-size:17px;font-style:italic;color:#F2F2FB} .mkr .quote .who{color:var(--muted);font-size:13px;margin-top:10px;font-style:normal}
.mkr .mkr-legend{display:flex;gap:16px;margin-top:10px;font-size:12px;color:var(--muted)}
.mkr .mkr-legend span{display:inline-flex;align-items:center;gap:6px}
.mkr .mkr-legend i{width:11px;height:11px;border-radius:3px;display:inline-block}
.mkr-foot{margin-top:54px;padding-top:20px;border-top:1px solid var(--line);color:var(--muted2);font-size:12px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px}
@media(max-width:820px){.mkr .stats{grid-template-columns:1fr 1fr}.mkr .g2,.mkr .swot,.mkr .road{grid-template-columns:1fr}.mkr-title{font-size:24px}}
`;
