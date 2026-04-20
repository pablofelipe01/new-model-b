"use client";

import Link from "next/link";

import { FAQ } from "@/components/FAQ";
import { MLogo } from "@/components/matiz/MLogo";
import { Sparkline } from "@/components/matiz/Sparkline";
import { TokenCard } from "@/components/TokenCard";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useTokenBondings } from "@/hooks/useTokenBondings";

const EXPLORER_URL =
  "https://explorer.solana.com/address/41nppqSazESeBmrgnud2j5Nz1MbsnPGeyAryPcKAefqa";
const TED_URL =
  "https://www.ted.com/talks/adam_mosseri_a_creator_led_internet_built_on_blockchain";

export default function HomePage() {
  const { rows, loading, error } = useTokenBondings();
  const { t } = useLanguage();

  return (
    <div className="landing">
      {/* ═══════ 1. HERO ═══════ */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="eyebrow">{t.eyebrow}</div>
            <h1 className="display-xl" style={{ marginBottom: 0 }}>
              {t.heroH1}
            </h1>
            <h2 className="display-xl" style={{ marginTop: 8 }}>
              {t.heroH2}
              <em style={{ color: "var(--color-ember)" }}>{t.heroH2Accent}</em>
            </h2>
            <p className="hero-thesis">{t.heroSub}</p>
            <div className="hero-ctas">
              <Link href="/launch" className="btn btn-primary">
                {t.launchYourEconomy} →
              </Link>
              <a href="#featured" className="btn btn-ghost">
                {t.seeWhoAlready}
              </a>
            </div>
            <div className="hero-meta">
              <span className="dot" />
              <span>{t.heroMeta1}</span>
              <span className="sep">·</span>
              <span>{t.heroMeta2}</span>
              <span className="sep">·</span>
              <span>{t.heroMeta3}</span>
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-art-frame">
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 40% 40%, var(--color-indigo) 0%, transparent 70%)", opacity: 0.3 }} />
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 70% 70%, var(--spec-magenta) 0%, transparent 60%)", opacity: 0.2 }} />
              <div className="float-card" style={{ position: "absolute", bottom: "8%", right: "-8%", zIndex: 2 }}>
                <div className="fc-row">
                  <div className="fc-avatar" style={{ background: "var(--color-surface-high)" }} />
                  <div>
                    <div className="fc-name">matiz</div>
                    <div className="fc-handle">@matiz</div>
                  </div>
                  <div className="fc-price">$1.00</div>
                </div>
                <Sparkline supply={420} maxSupply={2600} width={180} height={44} />
                <div className="fc-foot">
                  <span>12 {t.believersWord}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 2. LAS TRES PROMESAS ═══════ */}
      <section className="how">
        <div className="section-head">
          <div className="label">{t.promisesHeader}</div>
        </div>
        <div className="how-grid">
          {[1, 2, 3].map((n) => (
            <div key={n} className="how-card">
              <div className="how-num">{`0${n}`}</div>
              <h3 style={{ fontSize: 20, fontWeight: 500, margin: "0 0 12px" }}>
                {t[`promise${n}Title`]}
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                {t[`promise${n}Body`]}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ 3. CÓMO FUNCIONA ═══════ */}
      <section className="how">
        <div className="section-head">
          <div className="label">{t.howHeader}</div>
        </div>
        <div className="how-grid">
          {[1, 2, 3].map((n) => (
            <div key={n} className="how-card">
              <div className="how-num">{`0${n}`}</div>
              <h3 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 10px" }}>
                {t[`step${n}Title`]}
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.55, margin: 0 }}>
                {t[`step${n}Body`]}
              </p>
            </div>
          ))}
        </div>

        {/* +1 block */}
        <div style={{ borderTop: "0.5px solid var(--border-subtle)", paddingTop: 48, marginTop: 16 }}>
          <div style={{ maxWidth: 720 }}>
            <span className="fraunces-italic" style={{ fontSize: 40, color: "var(--color-ember)" }}>
              {t.plusOneTitle.split(".")[0]}.
            </span>
            <span className="fraunces-italic" style={{ fontSize: 40 }}>
              {" "}{t.plusOneTitle.split(". ").slice(1).join(". ")}
            </span>
            <p style={{ color: "var(--text-secondary)", fontSize: 17, lineHeight: 1.6, marginTop: 16 }}>
              {t.plusOneBody}
            </p>
          </div>
        </div>

        {/* Curve banner */}
        <div className="curve-banner" style={{ marginTop: 48 }}>
          <div>
            <div className="label">{t.curveCaptionShort.split(".")[0]}</div>
            <h3 className="fraunces-italic" style={{ fontSize: 28, margin: "6px 0 0" }}>
              {t.curveCaptionShort}
            </h3>
          </div>
          <div>
            <Sparkline supply={420} maxSupply={2600} width={480} height={180} />
          </div>
        </div>
      </section>

      {/* ═══════ 4. LA GARANTÍA MATEMÁTICA ═══════ */}
      <section style={{ background: "var(--color-surface)", padding: "64px 48px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
          <div>
            <h2 className="display-m fraunces-italic">{t.guaranteeTitle}</h2>
            <p className="muted" style={{ marginTop: 16 }}>{t.guaranteeBody1}</p>
            <p style={{ color: "var(--text-primary)", fontSize: 15, lineHeight: 1.6, marginTop: 16 }}>
              {t.guaranteeBody2.replace(/\*\*/g, "")}
            </p>
            <p style={{ color: "var(--text-primary)", fontSize: 15, fontWeight: 500, marginTop: 16 }}>
              {t.guaranteeBody3}
            </p>
            <a href={EXPLORER_URL} target="_blank" rel="noopener noreferrer" className="link" style={{ marginTop: 16, display: "inline-block" }}>
              {t.guaranteeCta}
            </a>
          </div>
          <div style={{ background: "var(--color-surface-high)", borderRadius: "var(--radius-md)", padding: 24 }}>
            <pre className="mono" style={{ fontSize: 13, lineHeight: 1.8, margin: 0, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
{`// instructions/
pub mod buy_v1;
pub mod sell_v1;
pub mod init_token_bonding;
pub mod create_curve;
pub mod update_bonding;`}
              {"\n"}
              <span style={{ textDecoration: "line-through", color: "var(--state-danger)" }}>
                {"// pub mod transfer_reserves;  ← DELETED"}
              </span>
            </pre>
          </div>
        </div>
      </section>

      {/* ═══════ 5. MOSSERI ═══════ */}
      <section style={{ padding: "96px 48px", maxWidth: 860, margin: "0 auto" }}>
        <h2 className="display-m fraunces-italic">{t.mosseriTitle}</h2>
        <p className="muted" style={{ marginTop: 24 }}>{t.mosseriIntro}</p>
        <blockquote style={{ margin: "32px 0", padding: "24px 0 24px 24px", borderLeft: "2px solid var(--color-indigo)" }}>
          <p className="fraunces-italic" style={{ fontSize: 24, lineHeight: 1.4, color: "var(--text-primary)", margin: 0 }}>
            {t.mosseriQuote}
          </p>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 12 }}>
            {t.mosseriAttrib}
          </p>
        </blockquote>
        <p style={{ fontSize: 17, color: "var(--text-primary)", lineHeight: 1.6 }}>
          {t.mosseriPunch}
        </p>
        <p className="display-m fraunces-italic" style={{ marginTop: 16, color: "var(--color-indigo)" }}>
          {t.mosseriWeDid}
        </p>
        <a href={TED_URL} target="_blank" rel="noopener noreferrer" className="link" style={{ marginTop: 16, display: "inline-block" }}>
          {t.mosseriCta}
        </a>
      </section>

      {/* ═══════ 6. PARA QUIÉN ES ═══════ */}
      <section style={{ padding: "64px 48px", maxWidth: 1240, margin: "0 auto" }}>
        <div className="section-head">
          <div className="label">{t.forWhomHeader}</div>
        </div>
        {[1, 2, 3].map((n) => (
          <div key={n} style={{
            display: "grid",
            gridTemplateColumns: n % 2 === 1 ? "1fr 1fr" : "1fr 1fr",
            gap: 48,
            alignItems: "center",
            marginBottom: 64,
            direction: n % 2 === 0 ? "rtl" : "ltr",
          }}>
            <div style={{ direction: "ltr" }}>
              <h3 style={{ fontSize: 24, fontWeight: 500, marginBottom: 16 }}>
                {t[`forWhom${n}Title`]}
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: 17, lineHeight: 1.6 }}>
                {t[`forWhom${n}Body`]}
              </p>
            </div>
            <div style={{
              direction: "ltr",
              background: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              aspectRatio: "4/3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{ color: "var(--text-tertiary)", fontSize: 14 }}>
                Illustration
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* ═══════ 7. FEATURED TOKENS ═══════ */}
      <section className="featured" id="featured">
        <div className="section-head">
          <div className="label">{t.featuredLabel}</div>
          <h2 className="display-m"><em>{t.featuredTitle}</em></h2>
        </div>

        {error && <p className="muted-small" style={{ color: "var(--state-danger)" }}>{error.message}</p>}
        {loading && <p className="muted-small">...</p>}
        {!loading && rows.length === 0 && !error && (
          <div className="empty-add">
            <Link href="/launch" className="link">{t.launchYourEconomy}</Link>
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
              reserve={row.account.reserveBalanceFromBonding.toNumber() / Math.pow(10, row.baseDecimals)}
            />
          ))}
        </div>
      </section>

      {/* ═══════ 8. FAQ ═══════ */}
      <section style={{ padding: "64px 48px", maxWidth: 860, margin: "0 auto" }}>
        <div className="section-head">
          <div className="label">{t.faqHeader}</div>
        </div>
        <FAQ />
      </section>

      {/* ═══════ 9. CTA FINAL ═══════ */}
      <section style={{ padding: "128px 48px", textAlign: "center" }}>
        <h2 className="display-l fraunces-italic">{t.ctaH1}</h2>
        <h3 className="display-l fraunces-italic" style={{ marginTop: 8, color: "var(--text-secondary)" }}>
          {t.ctaH2}
        </h3>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
          <Link href="/launch" className="btn btn-primary">{t.launchYourEconomy}</Link>
          <a href="#featured" className="btn btn-secondary">{t.seeWhoAlready}</a>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer style={{ borderTop: "0.5px solid var(--border-subtle)", padding: "48px", maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, marginBottom: 32 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 12 }}>{t.footProduct}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <a href="#" className="link" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t.footExplore}</a>
              <a href="#" className="link" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t.footHowItWorks}</a>
              <a href="#" className="link" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t.footFaq}</a>
              <a href="#" className="link" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t.footPricing}</a>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 12 }}>{t.footCompany}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <a href="#" className="link" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t.footAbout}</a>
              <a href="#" className="link" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t.footBlog}</a>
              <a href="#" className="link" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t.footContact}</a>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 12 }}>{t.footLegal}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <a href="#" className="link" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t.footTerms}</a>
              <a href="#" className="link" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t.footPrivacy}</a>
              <a href="#" className="link" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t.footAccessibility}</a>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 12 }}>{t.footCommunity}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <a href="#" className="link" style={{ fontSize: 13, color: "var(--text-secondary)" }}>Twitter</a>
              <a href="#" className="link" style={{ fontSize: 13, color: "var(--text-secondary)" }}>Instagram</a>
              <a href="#" className="link" style={{ fontSize: 13, color: "var(--text-secondary)" }}>Discord</a>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, paddingTop: 24, borderTop: "0.5px solid var(--border-subtle)" }}>
          <MLogo size={28} />
          <div>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>{t.footSolanaNote}</p>
            <a href={EXPLORER_URL} target="_blank" rel="noopener noreferrer" className="mono" style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              Program ID: 41nppq...efqa
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
