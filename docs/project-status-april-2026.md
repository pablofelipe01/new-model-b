# Matiz — Project Status (April 2026)

## What Matiz is

A token launch platform on Solana where anyone — with zero crypto knowledge — can create their own token with automatic liquidity guaranteed by a mathematical bonding curve. Sign in with Google, pay $25, get a shareable link.

**Domain:** matiz.community
**Network:** Solana devnet (ready for mainnet migration)
**Program ID:** `41nppqSazESeBmrgnud2j5Nz1MbsnPGeyAryPcKAefqa`

---

## What's built and working

### On-chain program (Anchor / Rust)

- **Bonding curve:** `P(S) = c · S^(pow/frac) + b` — sqrt, linear, quadratic, fixed price
- **Fee model (immutable per token):**
  - Platform: 0.5% per trade → MASTER_WALLET
  - Launcher: 0-5% configurable → launcher's wallet
  - Launch fee: $25 USDC one-time → MASTER_WALLET
- **Reserve is untouchable:** `transfer_reserves` physically deleted. Only `sell_v1` (which burns tokens) can withdraw from `base_storage`
- **USDC only:** base mint hardcoded to USDC
- **Newton's method optimized:** root-first `(S^(1/q))^p` converges in ~30 iterations instead of diverging
- **Deployed on devnet**, smoke-tested: launch + buy + sell + fees verified on Explorer

### Authentication (Privy)

- **Google login + email login** — no wallet, no seed phrase
- **Embedded Solana wallet** created automatically on signup
- **Phantom / Solflare** as secondary option via single "Connect" modal with two paths
- **Privy ↔ Anchor bridge:** `useSignTransaction` from Privy SDK wrapped in Anchor Wallet interface

### Gas sponsorship (fee payer relay)

- Users **never need SOL** — not for gas, not for rent, not for anything
- `/api/sponsor-tx` validates instructions (whitelist), co-signs with fee payer, broadcasts
- Covers: transaction fees, ATA creation rent, PDA creation rent, SystemProgram.transfer for init
- Security: only allows bonding curve program, SPL Token, ATA, System, Metaplex, Compute Budget

### SDK (TypeScript — `@new-model-b/sdk`)

- `createCurve()` — reusable curve definition
- `initTokenBonding()` — launch token (charges $25, creates mint + metadata + bonding)
- `buy()` — buy tokens along the curve (always sends `desiredTargetAmount`, never `baseAmount` on-chain to avoid CU-expensive bisection)
- `sell()` — sell tokens back
- `quoteBuy()` / `quoteSell()` — off-chain previews with fee breakdown
- All methods support `rentPayer` + `sendFn` for gas sponsorship
- Tolerant `listTokenBondings()` that skips old-layout accounts

### Frontend (Next.js 14 — "Matiz" design)

**Design system:**
- Dark-only, indigo (#6062E8) + ember (#FF5E3A) palette
- Fraunces (serif/italic) + Inter (UI) + JetBrains Mono
- M brushstroke logo with ember dot
- Bilingual ES/EN with language toggle (localStorage persistent)

**Pages:**

| Route | What it does |
|---|---|
| `/` | Landing with 9-section narrative arc: hero, promises, how it works, guarantee, Mosseri quote, for whom, featured tokens, FAQ, CTA |
| `/launch` | 3-step wizard: story → curve → confirm+pay. Success screen with WhatsApp share |
| `/token/[mint]` | 2-column layout: curve chart + stats left, trade panel right. Trust card with Explorer link |
| `/dashboard` | Balance, portfolio (tokens held), tokens launched, send modal, inline swap |
| `/terms` | Terms of Service + Risk Disclaimer (bilingual) |
| `/privacy` | Privacy Policy (bilingual) |
| `/offline` | PWA offline fallback |

**Components:**
- **SwapPanel:** buy/sell with slippage, fee summary, quantity input
- **SendModal:** send USDC/tokens to any wallet address
- **FAQ:** accordion with +/× toggle
- **TokenCard:** sparkline, price, believers count
- **Header:** hamburger menu mobile, single "Connect" button with dual-path modal
- **InstallPrompt:** PWA install banner after 30s (iOS instructions, Android beforeinstallprompt)

### PWA

- `manifest.json` with icons (192, 512, maskable)
- Service worker via `@ducanh2912/next-pwa` with runtime caching:
  - Fonts: CacheFirst (1 year)
  - Images: CacheFirst (30 days)
  - API routes: NetworkFirst (5 min)
  - Solana/Helius RPC: NetworkOnly (never cache prices)
- Offline fallback page
- M brushstroke favicon

### Infrastructure

- **Vercel:** frontend + API routes + analytics
- **Pinata:** IPFS image hosting for token logos
- **Helius:** Solana RPC (paid plan)
- **Privy:** auth + embedded wallets (Stripe-owned)

---

## What's NOT built

### Fiat on-ramp (card → USDC → tokens)

**Status:** Evaluated Stripe (no LATAM), MoonPay (30-min KYC for $2), Onramper (expensive). None work frictionlessly for LATAM small amounts. **Parked.**

**Alternatives to explore:**
- P2P USDC transfers between users
- Local payment gateways (Nequi, PSE, Mercado Pago) → custom bridge
- Solana Pay QR (user buys USDC on Binance, scans QR)
- Wait for Privy/Stripe native LATAM on-ramp

### Custom domain

- Currently on Vercel `.vercel.app`
- Need `matiz.community` with SSL for production credibility

### Mainnet deployment

- Change `USDC_MINT` to mainnet (`EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`)
- Dedicated fee payer wallet (not the deploy keypair)
- Rate limiting on sponsor relay
- Fee payer SOL balance monitoring
- Program audit

### Tests

- Anchor program tests (invariants: reserve untouchable, fee limits, splits)
- E2E tests for launch → buy → sell → send

### Additional features from PRD

- Open Graph cards for token pages (WhatsApp/X/Telegram previews)
- Activity feed (recent buys/sells)
- Token search/filter
- Bottom nav on mobile app screens
- Sticky CTA on landing mobile

---

## Architecture

```
User (browser/PWA)
  │
  ├── Privy (Google/email auth → embedded Solana wallet)
  │
  ├── Next.js Frontend (Vercel)
  │     ├── SDK (@new-model-b/sdk)
  │     ├── sponsoredSend → /api/sponsor-tx (fee payer relay)
  │     ├── /api/upload (Pinata IPFS)
  │     └── /api/m (metadata JSON)
  │
  └── Solana (devnet → mainnet)
        ├── spl-token-bonding program
        │     ├── init_token_bonding (creates token + charges $25)
        │     ├── buy_v1 (platform fee + launcher fee + reserve)
        │     ├── sell_v1 (burn → fees → seller)
        │     ├── create_curve
        │     └── update_bonding
        ├── base_storage (USDC reserve — LOCKED)
        ├── MASTER_WALLET ATA (platform fees)
        └── launcher ATA (launcher fees)
```

---

## Key accounts (devnet)

| Item | Address |
|---|---|
| Program ID | `41nppqSazESeBmrgnud2j5Nz1MbsnPGeyAryPcKAefqa` |
| MASTER_WALLET | `CQ4n8D3ThynAdKyqiQifo9k79sumBWtNRHZH1TCk2BZ1` |
| Fee payer | `XrMiSyRsttChRumZiEsTUiBa2Vgt2tJxbia93PsFYW6` |
| USDC mint (devnet) | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` |

---

## Environment variables (Vercel)

| Variable | Type | Purpose |
|---|---|---|
| `NEXT_PUBLIC_CLUSTER` | public | `devnet` or `mainnet` |
| `NEXT_PUBLIC_DEVNET_RPC` | public | Helius RPC URL |
| `NEXT_PUBLIC_PRIVY_APP_ID` | public | Privy auth |
| `NEXT_PUBLIC_FEE_PAYER_ADDRESS` | public | Gas sponsor wallet (hardcoded fallback) |
| `FEE_PAYER_SECRET_KEY` | server | Base64 keypair for sponsor relay |
| `PINATA_JWT` | server | IPFS image upload |
| `PINATA_GATEWAY` | server | Pinata gateway URL |

---

## Legal documents

- **Terms of Service** (`/terms`) — technology platform, not securities, not investment advice, Panama arbitration
- **Risk Disclaimer** (inside `/terms`) — "you can lose 100%", bonding curve mechanics explained
- **Privacy Policy** (`/privacy`) — minimal data collection, blockchain transparency

**Status:** Draft. Must be reviewed by attorney before mainnet launch.

---

## Design documents

- `docs/matiz-design-system-v2.md` — full design system (palette, typography, components, logo)
- `docs/matiz-landing-narrative-v1.md` — 9-section landing copy ES/EN
- `docs/terms-of-service.md` — complete legal text for attorney review

---

*Last updated: April 23, 2026*
