# Matiz — Design System v2

> **Changes from v1:** Dark-only palette (no light mode). The logo is now a single M brushstroke (no wordmark). All color tokens, component rules, and logo usage have been updated accordingly.

## 1. Brand at a glance

**Name:** Matiz
**Domain:** matiz.community
**Category:** Personal brand tokenization platform
**Mode:** Dark-only — every screen is dark by default. There is no light mode.
**Logo:** A single `M` rendered as a continuous brushstroke. No wordmark.
**Tagline (ES):** Tu matiz tiene una comunidad.
**Tagline (EN):** Your hue has a community.
**One-line thesis (ES):** Tu marca personal ya es una economía. Deja que quienes creen en ti crezcan contigo.
**One-line thesis (EN):** Your personal brand is already an economy. Let the people who believe in you grow with you.

### What Matiz does in one paragraph

Matiz lets anyone — artists, creators, clubs, communities, any personal brand — launch a shareable asset (a "token") that fans can buy and sell. The price rises as more people buy and falls when they sell, along a mathematical curve that is guaranteed by a smart contract. The reserve that backs every token is locked on-chain and verifiable by anyone. No exchanges, no middlemen, no crypto knowledge required. Sign in with Google, launch in three steps, share a link.

### Audiences — design for three, never name them

1. **The Launcher** — the artist, the creator, the personal brand. Usually not technical. Should feel like opening a Shopify store, never like deploying a smart contract.
2. **The Fan / Believer** — the friend, follower, supporter who wants to back someone. Usually arrives via a WhatsApp or Instagram link on a phone. Must feel like buying merch or tipping on a creator platform.
3. **The Crypto-native** — the power user who arrives with Phantom or Solflare. Needs enough technical detail visible (contract address, explorer links, reserve balance) to trust what's under the hood. Should feel respected, not pandered to.

---

## 2. Positioning & voice

### Core principles that govern every decision

1. **Zero crypto language visible by default.** The user never sees "Solana", "blockchain", "mint", "wallet address", "USDC", "lamports", "gas", "slippage tolerance" (call it "price range"), or "bonding curve" (call it "the curve" or "the price"). Exception: when a user explicitly opts into technical detail (Phantom flow, "see on-chain" expanders, explorer links). The word "token" is allowed because it's the product.

2. **The curve is the product, not a feature.** The graph of price vs. supply is the hero element on every token page. It must be beautiful, interactive, instantly understandable. The story it tells: *the earlier you believe, the lower the price.*

3. **Trust through transparency.** Every token page shows: exact fee structure (platform + launcher %), link to reserve on Solana Explorer, and this sentence in clear type — *"The reserve cannot be withdrawn by anyone. Verified on-chain." / "La reserva no puede ser retirada por nadie. Verificado on-chain."*

4. **Mobile-first always.** Most users arrive via a phone link from WhatsApp, Telegram, or Instagram. The buy flow must be flawless on mobile Safari and Chrome. Desktop is the second-class citizen, not the first.

5. **The share moment is everything.** After a successful launch, the success screen must make it irresistible to share. Big "Share on WhatsApp" button, copyable link, live preview of the Open Graph card.

6. **The dashboard is home.** Feels like a fintech app (Cash App, Nubank, Revolut), not a blockchain explorer. Your balance, your holdings, your earnings.

7. **Dark is the canvas.** The whole interface is dark. This is a deliberate choice that signals premium, cinematic, and night-bright — colors and illustrations glow against it. It also differentiates Matiz sharply from standard fintech and from the bright, bro-y aesthetic of most crypto apps.

### Voice: what Matiz sounds like

**Warm, precise, bilingual-native, human before technical.** Stories before features. Short sentences. No hype, no "revolutionary", no "onboard the next billion", no crypto buzzwords, no aggressive caps, no emojis in headers. Sentence case everywhere.

### Do / Don't examples

| ❌ Don't say | ✅ Say |
|---|---|
| "Mint your token on Solana" | "Launch your token" / "Lanza tu token" |
| "Connect wallet" | "Sign in" / "Entrar" |
| "Slippage tolerance 1%" | "Price range ±1%" / "Margen de precio ±1%" |
| "USDC balance" | "Your balance" / "Tu saldo" |
| "Buy with SOL for gas" | (Invisible — we sponsor gas) |
| "Transaction hash" | "Receipt" / "Comprobante" |
| "DeFi-powered" | (Never — we don't mention DeFi) |
| "Join the revolution" | "Join Matiz" / "Entra a Matiz" |

### Bilingual rule

Every piece of user-facing copy must be written in **both ES and EN from day 1**. Not translation — native phrasing in each. The language toggle is visible in the header, not buried in the footer. Default language detection uses the browser, but the user's choice overrides and persists.

---

## 3. Color system (dark-only)

Matiz is dark-first and dark-only. There is no light-mode variant. The palette is designed to hit WCAG AA contrast with paper-on-ink as the default text pairing, and to let the Spectrum (section below) glow when it appears.

### Base palette — runs 95% of the interface

| Token | Hex | Role |
|---|---|---|
| `--color-ink` | `#0A0B18` | Primary background — the canvas of every screen |
| `--color-surface` | `#14162A` | Cards, modals, inputs, elevated containers |
| `--color-surface-high` | `#1C1E33` | Elevated surfaces (dropdowns, tooltips, active rows) |
| `--color-paper` | `#F5F1E8` | Primary text, strong emphasis, mark color |
| `--color-indigo` | `#6062E8` | **Hero / action color.** Primary CTAs, active states, links, focus rings, the price curve |
| `--color-ember` | `#FF5E3A` | **Scarce accent.** Use sparingly: the ember dot in the logo, one emphasis per screen, celebratory moments |

> The indigo was brightened from v1 (`#3D3FD4` → `#6062E8`) to maintain contrast and vibrancy on the deep ink background. The ember holds because it already pops on dark.

### Text tokens

| Token | Hex / value | Role |
|---|---|---|
| `--text-primary` | `#F5F1E8` | Headings, body, emphasis |
| `--text-secondary` | `rgba(245, 241, 232, 0.65)` | Muted body, labels, captions |
| `--text-tertiary` | `rgba(245, 241, 232, 0.42)` | Hints, placeholders, timestamps |
| `--text-dim` | `rgba(245, 241, 232, 0.25)` | Decorative, disabled states |

### Border tokens

| Token | Value | Use |
|---|---|---|
| `--border-subtle` | `rgba(245, 241, 232, 0.08)` | Default borders, card edges (0.5px) |
| `--border-strong` | `rgba(245, 241, 232, 0.16)` | Hover, focused elements |
| `--border-accent` | `#6062E8` | Focused inputs (2px ring), active selections |

### Spectrum — brand & illustration only

These six colors **never appear in product UI** (no buttons, no form fields, no dashboard elements). They live exclusively in: the landing page, hero illustrations, token page headers (as accent), OG share cards, onboarding celebrations, success screens, and marketing materials. This separation is what keeps the premium feel premium.

All Spectrum values are calibrated to sing against `#0A0B18` — they are slightly brighter than their equivalents would be in a light system.

| Token | Hex | Emotional use |
|---|---|---|
| `--spec-magenta` | `#F2407E` | Energy, creative, emphasis |
| `--spec-violet` | `#9B6EF7` | Mystery, depth, night |
| `--spec-sky` | `#4FC0FF` | Openness, possibility, morning |
| `--spec-mint` | `#4FE0BE` | Growth, success, freshness |
| `--spec-gold` | `#F7C25A` | Celebration, value, warmth |
| `--spec-peach` | `#FFB89D` | Softness, welcome, human skin tone |

### Semantic states

| Token | Hex | Use |
|---|---|---|
| `--state-success` | `#4FE0BE` | Confirmations, positive deltas (reuses mint for on-brand feel) |
| `--state-warning` | `#F7C25A` | Cautions, non-blocking alerts |
| `--state-danger` | `#FF6B55` | Errors, destructive actions |
| `--state-info` | `#6062E8` | Informational — reuses indigo |

### Color rules

- **Never use the Spectrum inside product UI.** A dashboard button in magenta is a bug.
- **Ember is scarce.** Max one ember element per screen. Its power comes from rarity.
- **Indigo is the only blue.** Don't introduce a second blue for links, charts, or accents.
- **Solid fills only.** No gradients, no mesh backgrounds, no glow effects. Depth comes from layering surfaces at different levels (`--color-ink` → `--color-surface` → `--color-surface-high`), not from shadows or blurs.
- **The one exception** is inside illustrations on the brand layer, where the watercolor aesthetic allows for soft bleeds and organic color transitions. That's illustration, not UI.

---

## 4. Typography

### Type families

| Role | Font | Notes |
|---|---|---|
| Display / editorial | **Fraunces** (variable, SOFT=100, opsz=144) | Italic for hero and emotional moments. Upright for section headers. |
| UI / body / numeric | **Inter** (variable, 400 and 500 only) | Everything functional: dashboard, forms, tables, prices, buttons. |
| Mono (rare) | **JetBrains Mono** | Only for contract addresses, hashes, technical IDs in "see on-chain" expanders. |

### Type scale

| Style | Size / weight / line | Use |
|---|---|---|
| Display XL | Fraunces Italic 72/1.05 | Landing hero only |
| Display L | Fraunces Italic 48/1.1 | Section openers |
| Display M | Fraunces Italic 32/1.15 | Empty states, celebratory moments |
| H1 | Inter 500 · 32/1.2 | Page titles |
| H2 | Inter 500 · 24/1.25 | Section titles |
| H3 | Inter 500 · 18/1.3 | Card titles, subsections |
| Body L | Inter 400 · 17/1.6 | Landing prose |
| Body | Inter 400 · 15/1.55 | Default UI |
| Body S | Inter 400 · 13/1.5 | Secondary info, metadata |
| Caption | Inter 400 · 12/1.45 | Timestamps, helper text |
| Label | Inter 500 · 11/1.4 · uppercase · letter-spacing 0.14em | Eyebrow labels, section tags |
| Numeric L | Inter 500 · 40/1 · tabular-nums | Balances, prices hero |
| Numeric M | Inter 500 · 22/1 · tabular-nums | Token prices inline |

### Type rules

- **Only two Inter weights:** 400 and 500. Never 600, 700, 800, or 900.
- **Sentence case always.** Never Title Case, never ALL CAPS (exception: the Label style with deliberate tracking).
- **No mid-sentence bolding.** Bold is for headings and labels only. Class names, addresses, and technical IDs use `monospace`, not bold.
- **Fraunces is editorial, not decorative.** It earns its place on headers and the hero. If everything is in Fraunces, nothing is special.
- **Tabular numerals for every price and balance.** `font-variant-numeric: tabular-nums`. This keeps columns aligned and values legible.
- **On dark, don't use pure paper for body text at small sizes.** Use `--text-primary` (paper) for headings and key numbers, but Body and Body S can breathe with `--text-secondary` when large blocks of prose appear — reduces eye fatigue on dark.

---

## 5. Logo — the M brushstroke

### The only mark

Matiz is represented by a single letter `M` rendered as a continuous brushstroke. No wordmark, no lockups, no secondary treatments. Everywhere the brand appears as a visual mark — app icon, favicon, header, social avatars, app loaders, splash screens, OG cards — it is the M.

The word "matiz" appears in running text, URLs, page titles, and legal copy as lowercase Inter or Fraunces. It is never stylized into a wordmark logo.

### Anatomy of the mark

- A single continuous stroke that traces an M shape: up-left stem, down-center valley, up-right peak, down-right stem.
- Stroke weight roughly **7% of the mark's bounding height** — substantial, painterly, confident.
- **Stroke-linecap: round. Stroke-linejoin: round.** The terminals are soft, not sharp.
- A small **ember dot** (`--color-ember`) sits at the top-right terminal of the stroke, as if a drop of pigment is about to fall. This dot is the only color accent on the mark and is inseparable from it.
- The stroke itself is `--color-paper` (`#F5F1E8`) by default against `--color-ink` backgrounds.
- No outline, no fill inside the M shape, no shadow, no gradient.

### Color variants

| Variant | When to use | Stroke | Dot |
|---|---|---|---|
| Default | On ink or dark surface backgrounds (99% of uses) | `--color-paper` | `--color-ember` |
| Inverse | On Spectrum-colored or paper backgrounds (rare: OG cards, merch, print) | `--color-ink` | `--color-ember` |
| Celebratory | On success screens, launch completion moments (very rare) | `--color-ember` | none |

### Usage rules

- **Minimum size:** 24×24 px. Below that, the brushstroke character breaks down — use a simplified favicon version with thicker stroke if needed at 16px.
- **Clear space:** Always leave a minimum padding of 25% of the mark's bounding height on all sides.
- **Never:** rotate the mark, skew it, fill the inside of the M, add an outline, drop-shadow it, or place it on busy photographs without a solid backing surface.
- **Never recolor the stroke in Spectrum colors.** The mark stays paper, ink, or ember — never magenta, violet, sky, etc. This keeps it recognizable.
- **The ember dot is non-negotiable.** It's what makes the mark feel painterly rather than geometric. The only variant that omits it is the celebratory ember stroke (where the whole stroke is already ember).

### SVG reference (starting point)

```svg
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path
    d="M 22 74 L 22 32 Q 22 26 28 26 Q 33 26 36 32 L 50 60 L 64 32 Q 67 26 72 26 Q 78 26 78 32 L 78 74"
    stroke="#F5F1E8"
    stroke-width="7"
    fill="none"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <circle cx="82" cy="26" r="4" fill="#FF5E3A" />
</svg>
```

> This is a starting point for illustrators. The final mark should be redrawn with genuine painterly character — a slight taper in the stroke, a bleed in the dot — but the proportions and structure above are canonical.

---

## 6. Illustration & art direction

### Two visual layers — never mix them on the same element

| Layer | What it is | Where it lives |
|---|---|---|
| **Product layer** | Flat, clean, Inter-forward, tight grids, generous whitespace. Linear / Vercel / Railway aesthetic in dark mode. | Dashboard, launch wizard, forms, tables, buy/sell flow, modals, settings |
| **Brand layer** | Watercolor illustrations, vibrant Spectrum palette, hand-drawn feel, organic splashes, character-driven | Landing page, hero, empty states, success screens, onboarding, OG cards, marketing, email headers |

### Illustration principles

- Watercolor style with visible pigment texture — not flat digital vector.
- Characters welcome when they help (personal brand is a human story), but never generic stock illustrations of diverse office workers.
- Always include at least one accidental splash or bleed — perfection looks like stock art.
- **Backgrounds behind illustrations remain `--color-ink` (`#0A0B18`).** Watercolors glow beautifully against deep dark — do not put illustrations on paper-colored backgrounds. The single exception is merch, print, and OG cards destined for third-party platforms (Twitter, WhatsApp), where a lighter field may be needed for legibility.
- The Spectrum colors are calibrated to pop against dark — use them freely inside illustrations, but still with intent (2–3 dominant colors per composition, not all six at once).

### What the illustration set must cover

1. **Hero illustration** for the landing — a prismatic moment: a single figure (artist / creator / any person), watercolor splashes refracting into the Spectrum around them, sitting against ink.
2. **Three character scenes** — one per audience (Launcher, Fan, Crypto-native), each illustrating their moment of "aha".
3. **Empty states** — dashboard with no tokens yet, explore with no results, portfolio before first buy. Small, warm, never sad.
4. **Success screens** — "You launched!" / "You believed!" — celebratory but not cartoonish.
5. **Open Graph card template** — 1200×630, the M mark + launcher name + current price over a watercolor field. This one may use a lighter background for platform legibility.

### What illustration must NOT do

- Never enter the product layer. A dashboard card does not get a watercolor splash behind it.
- Never depict money (coins, bills, wallets, piggy banks). Matiz is about belief, not cash.
- Never use crypto iconography (lightning bolts, chains, blockchains, rockets, moons).
- Never use AI-generated stock (the NFT style is deliberate; don't dilute it).

---

## 7. Layout & spacing

### Grid

- **12-column** on desktop (≥1024px), 72px max-container padding on sides, 24px gutter.
- **4-column** on tablet (640–1023px), 32px padding, 16px gutter.
- **Single column** on mobile (<640px), 20px padding.

### Spacing scale (use exclusively)

`4, 8, 12, 16, 24, 32, 48, 64, 96, 128` (pixels). Any value outside this scale is a bug.

### Breakpoints

| Name | Min width |
|---|---|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

### Radius

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 6px | Small inline elements (pills, tags, small buttons) |
| `--radius-md` | 10px | Inputs, default buttons |
| `--radius-lg` | 14px | Cards, modals, panels |
| `--radius-xl` | 22px | Hero surfaces, large feature cards |
| `--radius-full` | 9999px | Avatars, toggle switches, status pills |

---

## 8. Component guidelines (dark-only)

### Buttons

- **Primary:** `--color-indigo` fill, `--text-primary` (paper) text, 10px radius, 14px vertical padding, 24px horizontal, 15/500. Hover: brighten indigo to `#7577EF`. Active: scale 0.98.
- **Secondary:** Transparent fill, 0.5px `--border-strong` border, paper text. Hover: `--color-surface` fill.
- **Ghost:** Transparent, paper text, no border. Hover: `--color-surface` fill.
- **Destructive:** `--state-danger` fill for account deletion, sell-all, unsubscribe. Use rarely.
- **Ember button exists for exactly one purpose:** the launch completion CTA ("Launch my token" / "Lanzar mi token") on the final step of the wizard. Nowhere else.

### Inputs

- 44px min height (mobile-friendly tap target), 10px radius, `--color-surface` fill, 0.5px `--border-subtle` outline.
- Focus: 2px `--border-accent` (indigo) ring, no shadow.
- Error: 2px `--state-danger` ring, helper text below in danger color.
- Placeholder: `--text-tertiary`.
- Label above, not inside (no floating labels — they fail in bilingual contexts with variable string lengths).

### Cards

- `--color-surface` fill, 0.5px `--border-subtle`, 14px radius, 24px padding.
- Hover (if interactive): border becomes `--border-strong`, fill lifts to `--color-surface-high`.
- Never use drop-shadows for elevation. Depth comes from surface level + border contrast, not blur.

### The curve chart

This is the single most important component. It appears on every token page and must be:

- A smooth line in `--color-indigo`, 2px weight.
- X-axis = tokens sold (hidden label; context is obvious). Y-axis = price (with `$` prefix, tabular-nums).
- Axis ticks and labels use `--text-tertiary` at 11px.
- Current position marked with a small `--color-ember` dot + horizontal dashed guide in `--border-strong`.
- The area under the curve filled with indigo at 14% opacity (slightly more visible against dark than it would be on light).
- Interactive: hover shows price at that point of supply in a small `--color-surface-high` tooltip with paper text.
- Mobile: curve dominates the viewport; buy/sell CTAs float below in a sticky bottom sheet with `--color-surface` background.

### Navigation

- **Top nav on desktop:** M mark left (32×32), primary links center-left in paper at 15/500 (Explore, Dashboard, Launch), language toggle + sign-in right.
- **Bottom tab bar on mobile:** 4 tabs maximum — Home, Explore, Launch (center, ember accent), Portfolio. Background `--color-surface`, active tab paper, inactive `--text-tertiary`.
- Language toggle is always visible, always labeled `ES / EN` (not flag icons — flags are politically fraught and bad UX).

### Modals & overlays

- Backdrop: `--color-ink` at 72% opacity (not black) — preserves the brand's indigo undertone.
- Modal container: `--color-surface-high`, 14px radius, 32px padding, no shadow.
- Max width 480px on desktop; full-width with 16px inset on mobile.
- Close affordance: X icon top-right in `--text-secondary`, 16×16.

---

## 9. Accessibility

- **Minimum contrast:** 4.5:1 for body text, 3:1 for large text (18px+ or 14px bold). Paper on ink is 15:1 — well above the floor.
- **Focus states:** always visible, 2px indigo ring, never removed even for "design reasons".
- **Touch targets:** 44×44px minimum on mobile.
- **Motion:** respect `prefers-reduced-motion`. No parallax, no autoplay carousels.
- **Language attribute:** `<html lang="es">` or `<html lang="en">` set correctly so screen readers pronounce content properly.
- **Icons:** never carry meaning alone. Always paired with text or `aria-label`.
- **Dark-only implications:** some users will have OS-level "force light mode" or high-contrast settings. Matiz respects those by design tokens but does not render a second theme — we document this decision in an accessibility statement in the footer.

---

## 10. What Matiz is NOT (negative space)

Sometimes the clearest way to describe a brand is by what it rejects. When in doubt, compare against these references.

**Matiz is not:**
- Pump.fun / Friend.tech — we are not edgy, gambler-facing, or meme-driven (even though we share their dark palette, our soul is different)
- Rally / bitclout — we are not tied to specific creators or walled gardens
- Patreon / OnlyFans — we are not a subscription platform
- A crypto exchange — we do not list tokens for trading beyond their own curve
- A generic fintech — we have art and soul; we are not Stripe Dashboard neutral

**Matiz is closer to:**
- Linear's typographic discipline and dark restraint
- Vercel's premium dark surfaces and indigo accenting
- Spotify Wrapped's emotional celebration of individual identity
- Shopify's "anyone can launch" promise
- Linktree's simplicity of onboarding

---

## 11. References for the AI generator

When Claude Design (or any AI) generates screens, ask it to ground its output in:

- **Mode:** Dark only. No light mode. Backgrounds are `--color-ink` or `--color-surface`, never paper.
- **Color:** Indigo primary, Ember scarce, Spectrum forbidden in product UI.
- **Type:** Fraunces italic for headers and emotional moments, Inter for everything else, two weights only.
- **Layout:** Generous whitespace, 0.5px borders in `--border-subtle`, no shadows, rounded corners 10–14px.
- **Logo:** M brushstroke only, ember dot top-right, never a wordmark.
- **Illustration:** Watercolor + characters only on marketing layer, never product layer, always over ink background.
- **Copy:** Bilingual ES + EN, sentence case, no crypto jargon, warm and precise.
- **Audience:** Design for the non-crypto Launcher first; the Fan on mobile second; the Crypto-native in expanders third.

---

*Document version 2.0 — April 2026. Owned by Pablo. Evolve this document as decisions solidify.*