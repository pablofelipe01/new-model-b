/**
 * Tiny SVG sparkline showing the bonding curve shape with a dot at the
 * current supply position. Purely decorative — no interaction.
 */
export function Sparkline({
  supply,
  maxSupply,
  width = 120,
  height = 40,
  accent = "#6062E8",
}: {
  supply: number;
  maxSupply: number;
  width?: number;
  height?: number;
  accent?: string;
}) {
  const N = 30;
  const base = 0.1;
  const k = 0.00004;
  const maxPrice = base + k * maxSupply * maxSupply;
  const pts: [number, number][] = [];

  for (let i = 0; i <= N; i++) {
    const s = (i / N) * maxSupply;
    const p = base + k * s * s;
    const x = (s / maxSupply) * width;
    const y = height - (p / maxPrice) * height;
    pts.push([x, y]);
  }

  const d = "M " + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ");
  const dotX = (supply / maxSupply) * width;
  const dotP = base + k * supply * supply;
  const dotY = height - (dotP / maxPrice) * height;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={d} stroke={accent} strokeWidth="1.6" fill="none" opacity="0.5" />
      <circle cx={dotX} cy={dotY} r="3" fill={accent} />
    </svg>
  );
}
