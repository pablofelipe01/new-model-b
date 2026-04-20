"use client";

import { MLogo } from "@/components/matiz/MLogo";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function OfflinePage() {
  const { lang } = useLanguage();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 72px)", padding: 48, textAlign: "center" }}>
      <MLogo size={64} />
      <h1 className="display-m fraunces-italic" style={{ marginTop: 24 }}>
        {lang === "es" ? "Sin conexión." : "No connection."}
      </h1>
      <p className="muted" style={{ marginTop: 12, maxWidth: 400 }}>
        {lang === "es"
          ? "Matiz necesita internet para mostrarte los precios en tiempo real. Vuelve cuando tengas conexión."
          : "Matiz needs the internet to show you real-time prices. Come back when you're connected."}
      </p>
    </div>
  );
}
