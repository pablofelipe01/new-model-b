"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

/**
 * Discrete install banner that appears after 30s on the site.
 * - Android/Chrome: uses `beforeinstallprompt` API
 * - iOS Safari: shows manual instructions
 * - Dismissable, remembers choice for 7 days
 */
export function InstallPrompt() {
  const { lang } = useLanguage();
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Check if dismissed recently
    const dismissed = localStorage.getItem("matiz-install-dismissed");
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    // Detect iOS Safari
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isiOS);

    // Listen for install prompt (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Show after 30 seconds
    const timer = setTimeout(() => {
      if (isiOS || deferredPrompt) {
        setShow(true);
      }
    }, 30000);

    // Also show when deferredPrompt arrives (might be after the timer)
    const checkTimer = setTimeout(() => setShow(true), 31000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
      clearTimeout(checkTimer);
    };
  }, [deferredPrompt]);

  function dismiss() {
    setShow(false);
    localStorage.setItem("matiz-install-dismissed", Date.now().toString());
  }

  async function install() {
    if (deferredPrompt && "prompt" in deferredPrompt) {
      (deferredPrompt as { prompt: () => void }).prompt();
    }
    dismiss();
  }

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
        left: 16,
        right: 16,
        zIndex: 50,
        background: "var(--color-surface-high)",
        border: "0.5px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        animation: "slideUp 0.2s ease",
      }}
    >
      <span style={{ fontSize: 14, color: "var(--text-primary)" }}>
        {isIOS
          ? lang === "es"
            ? "Comparte → Agregar a pantalla de inicio"
            : "Share → Add to Home Screen"
          : lang === "es"
            ? "Instala Matiz como app"
            : "Install Matiz as app"}
      </span>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        {!isIOS && (
          <button type="button" onClick={install} className="btn btn-primary" style={{ padding: "8px 16px", fontSize: 13, minHeight: 36 }}>
            {lang === "es" ? "Instalar" : "Install"}
          </button>
        )}
        <button type="button" onClick={dismiss} className="btn btn-ghost" style={{ padding: "8px 12px", fontSize: 13, minHeight: 36, color: "var(--text-secondary)" }}>
          {lang === "es" ? "Ahora no" : "Not now"}
        </button>
      </div>
    </div>
  );
}
