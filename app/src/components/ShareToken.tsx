"use client";

import { useState } from "react";

import { useLanguage } from "@/components/providers/LanguageProvider";

interface Props {
  mint: string;
  /** Optional extra class on the wrapper (defaults to the token-header share row). */
  className?: string;
}

/**
 * Copy-link + WhatsApp share buttons for a token. Builds an absolute URL to
 * the token's public page so it can be sent to anyone, signed in or not.
 */
export function ShareToken({ mint, className = "th-share" }: Props) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const tokenUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/token/${mint}`
      : `/token/${mint}`;

  function copyLink() {
    navigator.clipboard.writeText(tokenUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className={className}>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={copyLink}
        style={{ padding: "10px 16px", fontSize: 14 }}
      >
        {copied ? t.copied : t.copyLink}
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(tokenUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-primary"
        style={{ padding: "10px 16px", fontSize: 14 }}
      >
        {t.shareWA}
      </a>
    </div>
  );
}
