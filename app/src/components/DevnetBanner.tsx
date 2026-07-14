"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";

export function DevnetBanner() {
  const { t } = useLanguage();

  return (
    <div className="devnet-banner" role="note">
      <span className="devnet-banner-tag">DEVNET</span>
      <span className="devnet-banner-text">{t.devnetBanner}</span>
    </div>
  );
}
