"use client";

import { generateCurvePoints, type CurveParams } from "@new-model-b/sdk";
import { useMemo } from "react";
import {
  Area,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn, formatNumber } from "@/lib/utils";

interface Props {
  curve: CurveParams;
  currentSupply: number;
  /** Used to scale the X axis. Defaults to 2x the current supply (or 100). */
  maxSupply?: number;
  baseMintSymbol?: string;
  className?: string;
}

/**
 * Renders the bonding curve as price-vs-supply with the area under the curve
 * shaded (= reserve), a vertical line at `currentSupply`, and a numeric
 * tooltip on hover.
 */
export function BondingCurveChart({
  curve,
  currentSupply,
  maxSupply,
  baseMintSymbol = "base",
  className,
}: Props) {
  const xMax = maxSupply ?? Math.max(currentSupply * 2, 100);
  const data = useMemo(
    () => generateCurvePoints(curve, xMax, 120),
    [curve, xMax],
  );

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <defs>
            <linearGradient id="reserveFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(139 92 246)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="rgb(139 92 246)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="supply"
            type="number"
            domain={[0, xMax]}
            tickFormatter={(v: number) => formatNumber(v, 0)}
            stroke="currentColor"
            opacity={0.6}
            fontSize={11}
          />
          <YAxis
            tickFormatter={(v: number) => formatNumber(v, 4)}
            stroke="currentColor"
            opacity={0.6}
            fontSize={11}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgb(24 24 27)",
              border: "1px solid rgb(63 63 70)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => [
              formatNumber(value, 6),
              name === "price" ? `Price (${baseMintSymbol})` : name,
            ]}
            labelFormatter={(label: number) => `Supply: ${formatNumber(label, 2)}`}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="none"
            fill="url(#reserveFill)"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="rgb(139 92 246)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <ReferenceLine
            x={currentSupply}
            stroke="rgb(244 114 182)"
            strokeDasharray="4 4"
            label={{ value: "now", position: "top", fill: "rgb(244 114 182)", fontSize: 10 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
