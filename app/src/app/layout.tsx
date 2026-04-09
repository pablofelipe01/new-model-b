import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { Header } from "@/components/Header";
import { SdkProvider } from "@/components/providers/SdkProvider";
import { WalletContextProvider } from "@/components/providers/WalletContextProvider";
import { PROJECT_DESCRIPTION, PROJECT_NAME } from "@/lib/constants";

import "./globals.css";

export const metadata: Metadata = {
  title: PROJECT_NAME,
  description: PROJECT_DESCRIPTION,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <WalletContextProvider>
            <SdkProvider>
              <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">{children}</main>
              </div>
            </SdkProvider>
          </WalletContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
