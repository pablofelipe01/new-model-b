"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Embeds the self-contained financial-model dashboard (its own violet/teal
 * design) served from /public/sim/financial-dashboard.html. The iframe is
 * same-origin, so the dashboard fetches live numbers from /api/sim-data and
 * posts its content height back so we can size the frame with no inner scroll.
 */
export function FinancialDashboard() {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(2200);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== ref.current?.contentWindow) return;
      if (e.data?.type === "matiz-sim-height" && typeof e.data.h === "number") {
        setHeight(Math.ceil(e.data.h) + 8);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      ref={ref}
      src="/sim/financial-dashboard.html"
      title="Modelo financiero de Matiz"
      loading="lazy"
      style={{
        width: "100%",
        height,
        border: 0,
        borderRadius: "var(--radius-lg, 16px)",
        background: "#0B0916",
        display: "block",
      }}
    />
  );
}
