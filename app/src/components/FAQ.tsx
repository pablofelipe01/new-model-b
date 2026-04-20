"use client";

import { useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

const FAQS = [
  { q: "faq1q", a: "faq1a" },
  { q: "faq2q", a: "faq2a" },
  { q: "faq3q", a: "faq3a" },
  { q: "faq4q", a: "faq4a" },
  { q: "faq5q", a: "faq5a" },
];

export function FAQ() {
  const { t } = useLanguage();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div>
      {FAQS.map((faq, i) => {
        const isOpen = openIdx === i;
        return (
          <div
            key={i}
            style={{ borderBottom: "0.5px solid var(--border-subtle)" }}
          >
            <button
              type="button"
              onClick={() => setOpenIdx(isOpen ? null : i)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 0",
                background: "none",
                border: "none",
                color: "var(--text-primary)",
                font: "inherit",
                fontSize: 16,
                fontWeight: 500,
                cursor: "pointer",
                textAlign: "left",
                minHeight: 48,
                touchAction: "manipulation",
              }}
            >
              <span>{t[faq.q]}</span>
              <span
                style={{
                  fontSize: 20,
                  color: "var(--text-tertiary)",
                  transition: "transform 0.2s ease",
                  transform: isOpen ? "rotate(45deg)" : "none",
                  flexShrink: 0,
                  marginLeft: 16,
                }}
              >
                +
              </span>
            </button>
            <div
              style={{
                maxHeight: isOpen ? 400 : 0,
                overflow: "hidden",
                transition: "max-height 0.2s ease",
              }}
            >
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: 15,
                  lineHeight: 1.6,
                  padding: "0 0 20px",
                  margin: 0,
                }}
              >
                {t[faq.a]}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
