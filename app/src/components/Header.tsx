"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { MLogo } from "@/components/matiz/MLogo";

import { WalletButton } from "./WalletButton";

export function Header() {
  const pathname = usePathname();
  const { lang, setLang, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "/", label: t.explore },
    { href: "/launch", label: t.launch },
    { href: "/dashboard", label: t.dashboard },
  ];

  return (
    <>
      <nav className="top-nav">
        <Link href="/" className="nav-logo">
          <MLogo size={28} />
          <span className="nav-logo-word">matiz</span>
        </Link>

        {/* Desktop nav links */}
        <div className="nav-links nav-desktop-only">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link ${pathname === l.href ? "active" : ""}`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="nav-right">
          <button
            type="button"
            className="lang-toggle"
            onClick={() => setLang(lang === "es" ? "en" : "es")}
          >
            {t.langSwitch}
          </button>
          <div className="nav-desktop-only">
            <WalletButton />
          </div>
          {/* Hamburger — mobile only */}
          <button
            type="button"
            className="nav-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              {menuOpen ? (
                <path d="M6 6L18 18M6 18L18 6" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="nav-mobile-drawer">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-mobile-link ${pathname === l.href ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <div style={{ paddingTop: 16, borderTop: "0.5px solid var(--border-subtle)" }}>
            <WalletButton />
          </div>
        </div>
      )}
    </>
  );
}
