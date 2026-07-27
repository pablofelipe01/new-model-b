import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { ChatWidget } from "@/components/ChatWidget";
import { Header } from "@/components/Header";
import { InstallPrompt } from "@/components/InstallPrompt";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { PrivyAuthProvider } from "@/components/providers/PrivyAuthProvider";
import { SdkProvider } from "@/components/providers/SdkProvider";
import { WalletContextProvider } from "@/components/providers/WalletContextProvider";
import { fontVariables } from "@/lib/fonts";

import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Matiz — Convierte suscriptores en backers",
  description:
    "Convierte tu audiencia gratis en una economía de early backers. Como una ronda seed de startup, pero para tu comunidad de creador.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Matiz",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "Matiz — Convierte suscriptores en backers",
    description:
      "Convierte tu audiencia gratis en una economía de early backers. Como una ronda seed de startup, pero para tu comunidad de creador.",
    url: "https://matiz.community",
    siteName: "Matiz",
    locale: "es_CO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Matiz — Convierte suscriptores en backers",
    description:
      "Convierte tu audiencia gratis en una economía de early backers. Como una ronda seed de startup, pero para tu comunidad de creador.",
  },
  icons: {
    icon: [{ url: "/favicon0002.png", type: "image/png" }],
    apple: [{ url: "/favicon0002.png" }],
  },
  other: {
    "theme-color": "#F5F6F1",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={fontVariables}>
      <body>
        <LanguageProvider>
          <PrivyAuthProvider>
            <WalletContextProvider>
              <SdkProvider>
                <div className="app">
                  <Header />
                  <main className="screen">{children}</main>
                  <InstallPrompt />
                  <ChatWidget />
                </div>
                <Analytics />
              </SdkProvider>
            </WalletContextProvider>
          </PrivyAuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
