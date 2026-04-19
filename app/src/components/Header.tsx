"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { MLogo } from "@/components/matiz/MLogo";

import { WalletButton } from "./WalletButton";

export function Header() {
  const pathname = usePathname();
  const { lang, setLang, t } = useLanguage();

  return (
    <nav className="top-nav">
      <Link href="/" className="nav-logo">
        <MLogo size={28} />
        <span className="nav-logo-word">matiz</span>
      </Link>

      <div className="nav-links">
        <Link
          href="/"
          className={`nav-link ${pathname === "/" ? "active" : ""}`}
        >
          {t.explore}
        </Link>
        <Link
          href="/launch"
          className={`nav-link ${pathname === "/launch" ? "active" : ""}`}
        >
          {t.launch}
        </Link>
        <Link
          href="/dashboard"
          className={`nav-link ${pathname === "/dashboard" ? "active" : ""}`}
        >
          {t.dashboard}
        </Link>
      </div>

      <div className="nav-right">
        <button
          type="button"
          className="lang-toggle"
          onClick={() => setLang(lang === "es" ? "en" : "es")}
        >
          {t.langSwitch}
        </button>
        <WalletButton />
      </div>
    </nav>
  );
}
