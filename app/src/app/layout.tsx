import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Header } from "@/components/Header";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { PrivyAuthProvider } from "@/components/providers/PrivyAuthProvider";
import { SdkProvider } from "@/components/providers/SdkProvider";
import { WalletContextProvider } from "@/components/providers/WalletContextProvider";
import { fontVariables } from "@/lib/fonts";

import "./globals.css";

export const metadata: Metadata = {
  title: "Matiz",
  description: "Launch your token. Let the people who believe in you grow with you.",
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
                </div>
              </SdkProvider>
            </WalletContextProvider>
          </PrivyAuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
