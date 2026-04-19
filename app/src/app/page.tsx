"use client";

import Link from "next/link";

import { MLogo } from "@/components/matiz/MLogo";
import { Sparkline } from "@/components/matiz/Sparkline";
import { TokenCard } from "@/components/TokenCard";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useTokenBondings } from "@/hooks/useTokenBondings";

export default function HomePage() {
  const { rows, loading, error } = useTokenBondings();
  const { t, lang } = useLanguage();

  return (
    <div className="landing">
      {/* ─── Hero ─── */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="eyebrow">matiz.community</div>
            <h1 className="display-xl">
              <em>{t.heroTag}</em>
            </h1>
            <p className="hero-thesis">{t.heroThesis}</p>
            <div className="hero-ctas">
              <Link href="/launch" className="btn btn-primary">
                {t.launchYours} →
              </Link>
              <a href="#featured" className="btn btn-ghost">
                {t.seeExamples}
              </a>
            </div>
            <div className="hero-meta">
              <span className="dot" />
              <span>
                {lang === "es" ? "3 pasos para lanzar" : "3 steps to launch"}
              </span>
              <span className="sep">·</span>
              <span>
                {lang === "es" ? "Sin cripto" : "No crypto required"}
              </span>
              <span className="sep">·</span>
              <span>
                {lang === "es" ? "Entras con Google" : "Sign in with Google"}
              </span>
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-art-frame">
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(circle at 40% 40%, var(--color-indigo) 0%, transparent 70%)",
                  opacity: 0.3,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(circle at 70% 70%, var(--spec-magenta) 0%, transparent 60%)",
                  opacity: 0.2,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "8%",
                  right: "-8%",
                  zIndex: 2,
                }}
                className="float-card"
              >
                <div className="fc-row">
                  <div
                    className="fc-avatar"
                    style={{ background: "var(--color-surface-high)" }}
                  />
                  <div>
                    <div className="fc-name">matiz</div>
                    <div className="fc-handle">@matiz</div>
                  </div>
                  <div className="fc-price">$1.00</div>
                </div>
                <Sparkline supply={420} maxSupply={2600} width={180} height={44} />
                <div className="fc-foot">
                  <span>{lang === "es" ? "creyentes" : "believers"}</span>
                  <span className="fc-up">+12.4%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="how">
        <div className="section-head">
          <div className="label">
            {lang === "es" ? "Cómo funciona" : "How it works"}
          </div>
          <h2 className="display-m">
            <em>
              {lang === "es"
                ? "Una curva. Una comunidad."
                : "One curve. One community."}
            </em>
          </h2>
        </div>
        <div className="how-grid">
          <div className="how-card">
            <div className="how-num">01</div>
            <h3>
              {lang === "es"
                ? "Lanzas tu token"
                : "You launch your token"}
            </h3>
            <p>
              {lang === "es"
                ? "Tres campos, una foto, un botón. Sin saber nada de cripto."
                : "Three fields, a photo, a button. No crypto knowledge needed."}
            </p>
          </div>
          <div className="how-card">
            <div className="how-num">02</div>
            <h3>
              {lang === "es"
                ? "Tu gente entra temprano"
                : "Your people arrive early"}
            </h3>
            <p>
              {lang === "es"
                ? "Compras tempranas bajan la curva. Creer temprano cuesta menos."
                : "Early buys sit low on the curve. Believing early costs less."}
            </p>
          </div>
          <div className="how-card">
            <div className="how-num">03</div>
            <h3>
              {lang === "es" ? "Crecen contigo" : "They grow with you"}
            </h3>
            <p>
              {lang === "es"
                ? "Si tu historia sube, el precio sube con ella. Verificable."
                : "If your story rises, the price rises with it. Verifiable."}
            </p>
          </div>
        </div>
        <div className="curve-banner">
          <div>
            <div className="label">{t.curve_caption.split(".")[0]}</div>
            <h3
              className="fraunces-italic"
              style={{ fontSize: 28, margin: "6px 0 0" }}
            >
              {t.curve_caption}
            </h3>
          </div>
          <div>
            <Sparkline
              supply={420}
              maxSupply={2600}
              width={480}
              height={180}
            />
          </div>
        </div>
      </section>

      {/* ─── Featured tokens ─── */}
      <section className="featured" id="featured">
        <div className="section-head">
          <div className="label">
            {lang === "es" ? "En movimiento" : "Moving now"}
          </div>
          <h2 className="display-m">
            <em>
              {lang === "es"
                ? "Gente en la que creer"
                : "People to believe in"}
            </em>
          </h2>
        </div>

        {error && (
          <p className="muted-small" style={{ color: "var(--state-danger)" }}>
            {error.message}
          </p>
        )}

        {loading && (
          <p className="muted-small">
            {lang === "es" ? "Cargando…" : "Loading…"}
          </p>
        )}

        {!loading && rows.length === 0 && !error && (
          <div className="empty-add">
            <p>
              {lang === "es" ? "Aún no hay tokens." : "No tokens yet."}{" "}
              <Link href="/launch" className="link">
                {t.launchYours}
              </Link>
            </p>
          </div>
        )}

        <div className="token-grid">
          {rows.map((row) => (
            <TokenCard
              key={row.publicKey.toBase58()}
              mint={row.account.targetMint.toBase58()}
              name={row.tokenName}
              symbol={row.tokenSymbol}
              imageUrl={row.tokenImage}
              price={row.price}
              supply={row.supplyRaw / Math.pow(10, row.targetDecimals)}
              reserve={
                row.account.reserveBalanceFromBonding.toNumber() /
                Math.pow(10, row.baseDecimals)
              }
            />
          ))}
        </div>
      </section>

      {/* ─── About ─── */}
      <section className="about">
        <div className="about-inner">
          <div className="label">{t.aboutMatiz}</div>
          <p className="about-body">{t.aboutBody}</p>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="landing-foot">
        <div className="foot-row">
          <MLogo size={28} />
          <span className="foot-note">
            matiz.community ·{" "}
            {lang === "es" ? "Hecho con matices" : "Made with hues"}
          </span>
        </div>
      </footer>
    </div>
  );
}
