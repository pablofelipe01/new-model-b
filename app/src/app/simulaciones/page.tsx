import type { Metadata } from "next";

import { SimulacionesContent } from "./SimulacionesContent";

export const metadata: Metadata = {
  title: "Simulaciones — Matiz",
  description:
    "Modelos interactivos de Matiz: simulador de la economía de un token (curva, ballenas, fans, pánico) y el modelo financiero del pre-seed en vivo.",
};

export default function SimulacionesPage() {
  return <SimulacionesContent />;
}
