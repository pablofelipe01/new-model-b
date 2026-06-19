import type { Metadata } from "next";

import { MarketResearchContent } from "./MarketResearchContent";

export const metadata: Metadata = {
  title: "Investigación de mercado — Matiz",
  description:
    "Resumen ejecutivo visual: tamaño de la oportunidad (tokenización + creator economy), adopción en LATAM, lecciones de los pioneros, diferenciación y FODA de Matiz.",
};

export default function MarketResearchPage() {
  return <MarketResearchContent />;
}
