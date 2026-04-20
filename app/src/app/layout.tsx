import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

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
  title: "Matiz — Tu matiz tiene una comunidad",
  description:
    "Tokeniza tu marca personal. Tu comunidad, on-chain, portable, y tuya para siempre.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Matiz",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "Matiz — Tu matiz tiene una comunidad",
    description:
      "Tokeniza tu marca personal. Tu comunidad, on-chain, portable, y tuya para siempre.",
    url: "https://matiz.community",
    siteName: "Matiz",
    locale: "es_CO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Matiz — Tu matiz tiene una comunidad",
    description:
      "Tokeniza tu marca personal. Tu comunidad, on-chain, portable, y tuya para siempre.",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
  other: {
    "theme-color": "#0A0B18",
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
                </div>
              </SdkProvider>
            </WalletContextProvider>
          </PrivyAuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
