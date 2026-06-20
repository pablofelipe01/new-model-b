"use client";

import type { Params } from "./TokenSimulator";

/**
 * Use-case gallery for /simulaciones — three sibling stories (artist, musician,
 * athlete) of the same honest engine: a verifiable community → better income →
 * the creator reinvests a slice → new fans come in. Same idea, different data.
 *
 * The headline insight: the bigger the community, the flatter the curve, so the
 * same creator gesture moves the price +6.0% / +2.7% / +2.2% — visual proof
 * that this can't be pumped. Each card loads its control mapping into the live
 * simulator via onPlay.
 *
 * Spanish-only to match the simulator's voice (its labels/KPIs are Spanish).
 */

type CaseDef = {
  key: string;
  dot: string;
  name: string;
  role: string;
  teaches: string;
  data: { k: string; v: string }[];
  impact: string;
  intro: string;
  happened: string[];
  framing: string;
  params: Params;
};

const CASES: CaseDef[] = [
  {
    key: "artista",
    dot: "#8B7BF7",
    name: "Mariana",
    role: "Muralista e ilustradora",
    teaches: "Comunidad chica pero muy leal. El valor no está en el precio: está en pertenecer a una carrera que sube.",
    data: [
      { k: "Seguidores", v: "~20.000" },
      { k: "Creyentes (mintean)", v: "~1.400 · ~$9 c/u" },
      { k: "Reserva inicial", v: "~$12.600" },
      { k: "Evento de ingreso", v: "Galería le encarga una colección · $12.000" },
      { k: "Creador reinvierte", v: "20% = $2.400 (los conserva)" },
      { k: "Impacto en el precio", v: "~+6,0%" },
      { k: "Duplicar el precio", v: "~7× reserva ≈ $88.200" },
    ],
    impact: "+6,0%",
    intro:
      "Mariana pinta murales. 20.000 personas la siguen y 1.400 creen lo suficiente para minar su token con ~$9 cada una: ~$12.600 bloqueados en la reserva. Una galería le encarga una colección por $12.000 — y la toma en serio porque su comunidad es verificable, no son likes. Mariana devuelve el gesto: mete $2.400 y los conserva.",
    happened: [
      "La reserva arrancó en ~$12.600, respaldando cada token on-chain.",
      "Mariana reinvirtió $2.400: el precio subió ~6,0%. No infló nada — repartió valor entre quienes creyeron primero.",
      "El precio real subió cuando llegaron coleccionistas nuevos, atraídos por una carrera que las galerías ya validan.",
      "Quienes la apoyaron de emergente tienen hoy la posición más valiosa.",
    ],
    framing:
      "El valor se ancla en su carrera y reputación y en pertenecer a su mundo (drops de estudio, prints, primeras opciones), no en una tajada del precio de venta de sus cuadros.",
    params: { demand: 300, sellPct: 2, whaleSize: 0, creatorSpend: 150, creatorFeePct: 1, panicPct: 0 },
  },
  {
    key: "musico",
    dot: "#2DD4BF",
    name: "Lía",
    role: "Música independiente",
    teaches: "Audiencia grande y dinámica repartida entre plataformas. El token es la comunidad que viaja con ella aunque cambie de sello o de red.",
    data: [
      { k: "Seguidores", v: "~120.000" },
      { k: "Creyentes (mintean)", v: "~6.000 · ~$5 c/u" },
      { k: "Reserva inicial", v: "~$30.000" },
      { k: "Evento de ingreso", v: "Marca de audio la patrocina en gira · $25.000" },
      { k: "Creador reinvierte", v: "10% = $2.500 (los conserva)" },
      { k: "Impacto en el precio", v: "~+2,7%" },
      { k: "Duplicar el precio", v: "~7× reserva ≈ $210.000" },
    ],
    impact: "+2,7%",
    intro:
      "Lía saca música independiente. 120.000 personas la escuchan; 6.000 minan su token con ~$5: ~$30.000 en la reserva. Una marca de audio la patrocina en gira por $25.000 — porque puede probar con la blockchain que su comunidad es real. Lía mete $2.500 del patrocinio en su token y los conserva.",
    happened: [
      "La reserva arrancó en ~$30.000, respaldando cada token on-chain.",
      "Lía reinvirtió $2.500: el precio subió ~2,7%. Más comunidad = curva más plana; el gesto reparte, no infla.",
      "El precio despegó cuando un sencillo pegó y entraron fans nuevos. Ese es el motor.",
      "Si mañana cambia de sello o una plataforma la desmoneta, su comunidad tokenizada sigue con ella.",
    ],
    framing:
      "El fan posee y participa; no se le promete ganancia. El valor está en la comunidad portable, no en un rendimiento garantizado.",
    params: { demand: 800, sellPct: 6, whaleSize: 0, creatorSpend: 250, creatorFeePct: 3, panicPct: 0 },
  },
  {
    key: "deportista",
    dot: "#F5B65A",
    name: "Mateo",
    role: "Ciclista",
    teaches: "Masa grande que se dispara alrededor de competencias. El pico viene de fans nuevos que llegan cuando gana — no de repartir sus premios.",
    data: [
      { k: "Seguidores", v: "~300.000" },
      { k: "Creyentes (mintean)", v: "~12.000 · ~$4 c/u" },
      { k: "Reserva inicial", v: "~$48.000" },
      { k: "Evento de ingreso", v: "Marca deportiva lo patrocina · $40.000" },
      { k: "Creador reinvierte", v: "8% = $3.200 (los conserva)" },
      { k: "Impacto en el precio", v: "~+2,2%" },
      { k: "Duplicar el precio", v: "~7× reserva ≈ $336.000" },
    ],
    impact: "+2,2%",
    intro:
      "Mateo es ciclista. 300.000 lo siguen; 12.000 minan su token con ~$4: ~$48.000 en la reserva. Una marca deportiva lo patrocina por $40.000 — porque su afición es verificable y no se puede fingir con bots. Mateo mete $3.200 en su token y los conserva. Luego gana una carrera importante.",
    happened: [
      "La reserva arrancó en ~$48.000, respaldando cada token on-chain.",
      "Mateo reinvirtió $3.200: el precio subió solo ~2,2%. Con una comunidad así de grande, ni el creador puede moverla mucho.",
      "El salto de verdad llegó al ganar: entraron fans nuevos con plata nueva. Demanda real, no inflada.",
      "Los que creyeron cuando era promesa tienen la mejor posición.",
    ],
    framing:
      "El valor se ancla en una afición verificable que le consigue mejores patrocinios, y en que más gente lo apoya cuando gana. Nunca en repartir sus premios o su contrato entre los holders — eso convertiría el token en un valor financiero. El holder participa del fenómeno Mateo, no de su nómina.",
    params: { demand: 600, sellPct: 5, whaleSize: 0, creatorSpend: 200, creatorFeePct: 2, panicPct: 0 },
  },
];

export function UseCases({ onPlay }: { onPlay: (params: Params, label: string) => void }) {
  return (
    <div className="ucases">
      <style>{CSS}</style>

      {/* headline insight */}
      <div className="uc-insight">
        <div className="uc-insight-head">A mayor comunidad, más plana la curva</div>
        <p>
          El mismo gesto del creador (reinvertir una parte de un ingreso) mueve el precio cada vez menos. Si lees los
          tres en orden, enseñan solos que esto no se puede bombear: el motor son los fans, no la billetera del creador.
        </p>
        <div className="uc-impacts">
          {CASES.map((c) => (
            <div className="uc-impact" key={c.key}>
              <span className="dot" style={{ background: c.dot }} />
              <div>
                <div className="ui-name">{c.name}</div>
                <div className="ui-val" style={{ color: c.dot }}>{c.impact}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* case cards */}
      <div className="uc-grid">
        {CASES.map((c) => (
          <div className="uc-card" key={c.key} style={{ borderTopColor: c.dot }}>
            <div className="uc-card-head">
              <span className="dot lg" style={{ background: c.dot }} />
              <div>
                <h3>{c.name}</h3>
                <div className="uc-role">{c.role}</div>
              </div>
            </div>
            <p className="uc-teaches">{c.teaches}</p>

            <div className="uc-data">
              {c.data.map((d) => (
                <div className="uc-data-row" key={d.k}>
                  <span className="k">{d.k}</span>
                  <span className="v">{d.v}</span>
                </div>
              ))}
            </div>

            <p className="uc-intro">{c.intro}</p>

            <div className="uc-block-label">Qué pasó</div>
            <ul className="uc-happened">
              {c.happened.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>

            <div className="uc-framing">
              <span className="uc-framing-tag">Encuadre</span>
              {c.framing}
            </div>

            <button type="button" className="uc-play" onClick={() => onPlay(c.params, c.name)}>
              Probar en el simulador →
            </button>
          </div>
        ))}
      </div>

      <p className="uc-foot">
        Nombres ilustrativos y ficticios. Mismas relaciones que el caso base: precio ∝ reserva^(1/3), market cap = 1,5 ×
        reserva, los primeros reciben varias veces más tokens por dólar, y duplicar el precio exige ~7× la reserva. Fee
        de plataforma 0,5% · lanzamiento $25 · el fee del creador (0–5%) va al creador.
      </p>
    </div>
  );
}

const CSS = `
.ucases{--bg:#0B0916;--surface:#141029;--line:rgba(255,255,255,.07);--ink:#ECEAF6;--muted:#9990C4;--faint:#6B6391;--violet:#8B7BF7;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink)}
.ucases .dot{width:9px;height:9px;border-radius:99px;display:inline-block}
.ucases .dot.lg{width:12px;height:12px}
.uc-insight{background:linear-gradient(155deg,rgba(139,123,247,.16),rgba(45,212,191,.05));border:1px solid rgba(139,123,247,.32);border-radius:16px;padding:20px;margin-bottom:18px}
.uc-insight-head{font-family:"Hoefler Text",Georgia,serif;font-size:19px;margin-bottom:6px}
.uc-insight p{color:var(--muted);font-size:13.5px;max-width:80ch;margin:0 0 14px}
.uc-impacts{display:flex;flex-wrap:wrap;gap:10px}
.uc-impact{display:flex;align-items:center;gap:10px;background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:10px 16px;flex:1;min-width:160px}
.uc-impact .ui-name{font-size:12.5px;color:var(--muted)}
.uc-impact .ui-val{font-family:ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;font-size:20px;font-weight:700}
.uc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.uc-card{background:var(--surface);border:1px solid var(--line);border-top:3px solid var(--violet);border-radius:16px;padding:18px;display:flex;flex-direction:column}
.uc-card-head{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.uc-card-head h3{font-family:"Hoefler Text",Georgia,serif;font-weight:400;font-size:20px;margin:0}
.uc-role{font-size:12px;color:var(--muted)}
.uc-teaches{font-size:13px;color:#D7DAEC;margin:0 0 14px}
.uc-data{background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:6px 12px;margin-bottom:14px}
.uc-data-row{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid var(--line);font-size:12px}
.uc-data-row:last-child{border-bottom:0}
.uc-data-row .k{color:var(--muted)}
.uc-data-row .v{color:var(--ink);text-align:right;font-variant-numeric:tabular-nums}
.uc-intro{font-size:13px;color:#D7DAEC;line-height:1.6;margin:0 0 14px}
.uc-block-label{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--violet);font-weight:700;margin-bottom:6px}
.uc-happened{list-style:none;margin:0 0 14px;padding:0;display:flex;flex-direction:column;gap:7px}
.uc-happened li{font-size:12.5px;color:var(--muted);padding-left:16px;position:relative;line-height:1.5}
.uc-happened li::before{content:"";position:absolute;left:0;top:7px;width:5px;height:5px;border-radius:99px;background:var(--violet)}
.uc-framing{font-size:12px;color:var(--muted);line-height:1.5;background:rgba(255,255,255,.02);border-left:3px solid var(--faint);border-radius:0 8px 8px 0;padding:10px 12px;margin-bottom:16px}
.uc-framing-tag{display:block;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint);font-weight:700;margin-bottom:4px}
.uc-play{margin-top:auto;background:var(--violet);color:#0c0a18;border:0;border-radius:10px;padding:11px;font:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:.15s}
.uc-play:hover{filter:brightness(1.08)}
.uc-foot{font-size:11.5px;color:var(--faint);line-height:1.6;margin-top:18px;max-width:95ch}
@media(max-width:900px){.uc-grid{grid-template-columns:1fr}}
`;
