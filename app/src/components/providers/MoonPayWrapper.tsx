"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const MoonPayProvider = dynamic(
  () => import("@moonpay/moonpay-react").then((mod) => mod.MoonPayProvider),
  { ssr: false },
);

const MOONPAY_PK = process.env.NEXT_PUBLIC_MOONPAY_PK || "";

/**
 * Wraps the app with MoonPayProvider for the buy widget.
 * Gracefully degrades if no API key is set.
 */
export function MoonPayWrapper({ children }: { children: ReactNode }) {
  if (!MOONPAY_PK) return <>{children}</>;

  return (
    <MoonPayProvider apiKey={MOONPAY_PK} debug={false}>
      {children}
    </MoonPayProvider>
  );
}
