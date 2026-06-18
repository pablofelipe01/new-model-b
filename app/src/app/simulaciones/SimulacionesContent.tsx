"use client";

import { useState } from "react";

import { useLanguage } from "@/components/providers/LanguageProvider";

import { FinancialDashboard } from "./FinancialDashboard";
import { TokenSimulator } from "./TokenSimulator";

type Tab = "modelo" | "token";

export function SimulacionesContent() {
  const { lang } = useLanguage();
  const en = lang === "en";
  const [tab, setTab] = useState<Tab>("token");

  const tabs: { id: Tab; label: string; desc: string }[] = [
    {
      id: "token",
      label: en ? "Token simulator" : "Simulador de token",
      desc: en
        ? "Play out what happens to a token's price as buyers enter and exit, a whale pumps & dumps, the creator rewards fans, or panic hits."
        : "Juega qué le pasa al precio de un token cuando entran y salen compradores, una ballena infla y vende, el creador premia a sus fans o llega el pánico.",
    },
    {
      id: "modelo",
      label: en ? "Financial model" : "Modelo financiero",
      desc: en
        ? "The pre-seed financial model, live from the planning sheet: revenue, cash, break-even and dilution."
        : "El modelo financiero del pre-seed, en vivo desde la hoja de planeación: ingresos, caja, break-even y dilución.",
    },
  ];

  const cur = tabs.find((t) => t.id === tab)!;

  return (
    <div className="token-screen" style={{ paddingTop: 24, paddingBottom: 64 }}>
      <p className="label" style={{ color: "var(--spec-violet, #8B7BF7)", marginBottom: 8 }}>
        {en ? "Simulations" : "Simulaciones"}
      </p>
      <h1 className="page-title" style={{ marginBottom: 10 }}>
        {en ? "See the engine move" : "Mira el motor en movimiento"}
      </h1>
      <p className="muted" style={{ maxWidth: "64ch", marginBottom: 24 }}>
        {en
          ? "Two interactive models: the token economics a creator plays with, and the financial model behind Matiz."
          : "Dos modelos interactivos: la economía del token con la que juega un creador, y el modelo financiero detrás de Matiz."}
      </p>

      {/* tabs */}
      <div
        style={{
          display: "inline-flex",
          gap: 6,
          background: "var(--color-surface)",
          border: "0.5px solid var(--border-subtle)",
          borderRadius: "var(--radius-full, 999px)",
          padding: 4,
          marginBottom: 16,
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={tab === t.id ? "btn btn-primary" : "btn btn-ghost"}
            style={{ borderRadius: "var(--radius-full, 999px)", padding: "8px 18px", fontSize: 13 }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="muted-small" style={{ maxWidth: "70ch", marginBottom: 20 }}>
        {cur.desc}
      </p>

      {tab === "token" ? <TokenSimulator /> : <FinancialDashboard />}
    </div>
  );
}
