# Token Launch Platform — Project Brief & Design Handoff

## What is this project?

A **token launch platform** on Solana where anyone — with zero crypto knowledge — can create their own token with automatic liquidity guaranteed by a mathematical bonding curve. The token price rises as people buy and falls as they sell, with the reserve locked by the smart contract. No AMMs, no liquidity providers, no bots.

**The core promise**: a person signs in with Google, pays $25, and gets a shareable link to their token that anyone in the world can buy with a credit card.

---

## What's built and working (as of April 2026)

### On-chain program (Solana / Anchor)
- **Bonding curve math**: `P(S) = c · S^(pow/frac) + b` — supports sqrt, linear, quadratic, and fixed price curves
- **Fee model** (hardcoded, immutable per token):
  - Platform fee: **0.5%** on every buy and sell → `MASTER_WALLET`
  - Launcher fee: **0-5%** configurable by the launcher → their wallet
  - Launch fee: **$25 USDC** one-time on token creation → `MASTER_WALLET`
- **Reserve is untouchable**: the only way USDC leaves `base_storage` is via `sell_v1` (which requires burning tokens). There is no `transfer_reserves` instruction — it was physically deleted from the codebase. This is the #1 trust argument.
- **USDC only**: base mint is hardcoded to USDC. No SOL, no exotic tokens.
- Deployed on devnet: `41nppqSazESeBmrgnud2j5Nz1MbsnPGeyAryPcKAefqa`

### Authentication (Privy)
- **Google login and email login** — no wallet, no seed phrase, no crypto jargon
- **Embedded Solana wallet** created automatically on signup
- **Phantom / Solflare** supported as secondary option for crypto-native users
- Privy ↔ Anchor bridge: the embedded wallet signs transactions transparently

### Gas sponsorship (fee payer relay)
- Users **never need SOL** — not for gas, not for rent, not for anything
- Backend relay (`/api/sponsor-tx`) validates, co-signs, and broadcasts transactions
- Fee payer covers: transaction fees, ATA creation rent, PDA creation rent
- Security: whitelist of allowed programs (only our bonding curve + SPL token + ATA + system)

### SDK (TypeScript)
- `createCurve()` — create a reusable curve definition
- `initTokenBonding()` — launch a token (charges $25, creates mint + metadata + bonding)
- `buy()` — buy tokens along the curve
- `sell()` — sell tokens back along the curve
- Off-chain quotes with fee breakdown (`quoteBuy`, `quoteSell`)
- All methods support `rentPayer` + `sendFn` for gas sponsorship
- Published as `@new-model-b/sdk` workspace package

### Frontend (Next.js 14)
- **Launch wizard** (3 steps):
  1. Token info: name, symbol, description, logo upload (Pinata IPFS)
  2. Pricing model: curve type selector with live preview chart, launcher fee slider (0-5%)
  3. Confirm & pay: summary of all fees, one-click launch
- **Token detail page** (`/token/[mint]`): bonding curve chart, current price, buy/sell panel with slippage control
- **Dashboard** (`/dashboard`):
  - USDC balance
  - "My portfolio": tokens owned, current value, inline trade panel (expand to buy/sell without leaving)
  - "Tokens I launched": tokens created, supply, price
  - **Send button**: modal to send USDC or tokens to any Solana address
- **Explore page** (`/`): grid of all tokens on the platform with price, name, logo
- **Wallet address copy button**: click to copy embedded wallet address to clipboard
- Token logo appears in wallets (Phantom, Backpack) via Metaplex metadata
- Responsive, dark mode, Tailwind CSS

### Infrastructure
- Vercel deployment (frontend + API routes)
- Pinata for IPFS image hosting
- Helius RPC (devnet)

---

## User journeys (current state)

### Journey 1: "I want to launch a token" (non-crypto user)
1. Opens the app → clicks "Sign in" → Google login
2. Privy creates an embedded Solana wallet (invisible to user)
3. Goes to `/launch` → fills in name, symbol, uploads logo
4. Picks curve type (sqrt recommended), sets their fee (e.g. 2%)
5. Confirms → signs 3 transactions (all gas-sponsored, user just approves in Privy popup)
6. Gets a shareable link → sends it to friends via WhatsApp, X, etc.

**What the user needs**: 25 USDC in their embedded wallet (today: sent manually; future: Stripe card payment)

### Journey 2: "I want to buy a token" (fan, non-crypto)
1. Receives a link from a friend → opens `/token/[mint]`
2. Clicks "Sign in" → Google login
3. Types amount → clicks "Buy"
4. Transaction is sponsored (no SOL needed), only USDC is spent
5. Tokens appear in their dashboard

**What the user needs**: USDC in their wallet (future: "Buy with card" button)

### Journey 3: "I want to sell and cash out"
1. Opens dashboard → sees portfolio
2. Clicks "Trade" on a token → switches to "Sell" tab
3. Enters amount → clicks "Sell" → USDC arrives in their wallet
4. Can send USDC to any wallet (exchange, friend, etc.) via "Send" button

### Journey 4: Crypto-native user with Phantom
1. Clicks "Select Wallet" → connects Phantom
2. Everything works the same but with their own wallet
3. No Privy, no embedded wallet, direct signing

---

## What's NOT built yet

### Stripe Crypto Onramp (next major feature)
- **"Buy with card" button**: user enters credit card → Stripe buys USDC → auto-executes buy on bonding curve → user sees tokens
- The user never knows USDC exists — they just "bought $50 of this token"
- Requires Stripe account with Crypto Onramp enabled (beta, application required)
- Webhook-driven: Stripe notifies when USDC arrives → backend auto-buys
- **Prerequisite**: polished UI/UX (Stripe reviews the app before approving)

### UX/UI redesign (working with Claude Design)
- Current UI is functional but raw — needs professional design
- Target: "feels like a consumer app, not a crypto app"
- Language must be simple: "funds" not "USDC", "price" not "spot price", "$" not "lamports"
- No visible wallet addresses unless the user explicitly looks for them
- The bonding curve chart should be beautiful and intuitive, not a developer tool
- Mobile-first responsive design

### Token public page improvements
- Open Graph tags for rich previews on WhatsApp, X, Telegram, iMessage
- Fee transparency section (mandatory): shows platform fee, launcher fee, reserve address, all verifiable on Explorer
- Last 20 transactions feed
- Share buttons: WhatsApp, X, Telegram, copy link

### Custom domain
- Need own domain (not `.vercel.app`) for Stripe approval and brand credibility
- SSL, proper SEO, sitemap

### Tests
- Anchor program tests (invariants: reserve untouchable, fee limits, correct splits)
- End-to-end tests for the full launch → buy → sell → send flow

### Mainnet deployment
- Change `USDC_MINT` constant to mainnet USDC (`EPjFWdd5...`)
- Change `MASTER_WALLET` if needed
- Dedicated fee payer wallet (not the deploy keypair)
- Rate limiting on the sponsor relay
- Monitoring on fee payer SOL balance

---

## Technical architecture

```
┌─────────────────────────────────────────────────┐
│                    Frontend                      │
│              Next.js 14 + Tailwind               │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Launch   │  │  Token   │  │Dashboard │       │
│  │  Wizard   │  │  Page    │  │+Portfolio│       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │              │              │             │
│  ┌────▼──────────────▼──────────────▼────┐       │
│  │         SDK (@new-model-b/sdk)         │       │
│  │  createCurve · initTokenBonding        │       │
│  │  buy · sell · quoteBuy · quoteSell     │       │
│  └────────────────┬──────────────────────┘       │
│                   │                               │
│  ┌────────────────▼──────────────────────┐       │
│  │     SdkProvider (Anchor bridge)        │       │
│  │  Privy wallet OR Phantom wallet        │       │
│  └────────────────┬──────────────────────┘       │
│                   │                               │
│  ┌────────────────▼──────────────────────┐       │
│  │     sponsoredSend (gas relay)          │       │
│  │  Sets feePayer → user signs →          │       │
│  │  POST /api/sponsor-tx                  │       │
│  └────────────────┬──────────────────────┘       │
└───────────────────┼──────────────────────────────┘
                    │
        ┌───────────▼───────────┐
        │   /api/sponsor-tx     │
        │   Validates tx        │
        │   Signs with fee payer│
        │   Broadcasts          │
        └───────────┬───────────┘
                    │
        ┌───────────▼───────────┐
        │   Solana (devnet)     │
        │                       │
        │  spl-token-bonding    │
        │  ┌─────────────────┐  │
        │  │ init_token_bond │  │
        │  │ buy_v1          │  │
        │  │ sell_v1         │  │
        │  │ create_curve    │  │
        │  │ update_bonding  │  │
        │  └─────────────────┘  │
        │                       │
        │  Token accounts:      │
        │  · base_storage (USDC)│ ← LOCKED, only sell can withdraw
        │  · target_mint        │
        │  · MASTER_WALLET ATA  │ ← receives platform fees
        │  · launcher ATA       │ ← receives launcher fees
        └───────────────────────┘
```

---

## Fee flow diagram

```
          BUY $100 of tokens
          ──────────────────
          User pays: $100 USDC

     ┌──────────────────────────────┐
     │  Platform fee (0.5%): $0.50  │──→ MASTER_WALLET
     ├──────────────────────────────┤
     │  Launcher fee (e.g. 2%): $2  │──→ Launcher's wallet
     ├──────────────────────────────┤
     │  To reserve: $97.50          │──→ base_storage (LOCKED)
     └──────────────────────────────┘
                    │
                    ▼
          Mint tokens to buyer
          (amount determined by curve integral)


          SELL tokens
          ──────────
          User burns N tokens → curve computes $X gross

     ┌──────────────────────────────┐
     │  Gross from curve: $X        │
     ├──────────────────────────────┤
     │  Platform fee (0.5%)         │──→ MASTER_WALLET
     │  Launcher fee (e.g. 2%)      │──→ Launcher's wallet
     ├──────────────────────────────┤
     │  Net to seller               │──→ Seller's wallet
     └──────────────────────────────┘
```

---

## Design principles for Claude Design

1. **Zero crypto language visible to users**. Never show: "Solana", "blockchain", "mint", "lamports", "ATA", "PDA", "USDC" (show "$" instead). The word "token" is OK because it's the product.

2. **The bonding curve is the product, not a feature**. The chart showing price vs. supply should be the hero element on every token page — beautiful, interactive, immediately understandable. "The earlier you buy, the lower the price."

3. **Trust through transparency**. Every token page must show:
   - The fee structure (platform + launcher, exact percentages)
   - A link to the reserve on Solana Explorer ("verify the funds are locked")
   - "The reserve cannot be withdrawn by anyone. Verified on-chain."

4. **Three audiences, one interface**:
   - **Launcher** (creates token): wizard must feel like creating a Shopify store, not deploying a smart contract
   - **Fan/buyer** (buys token): must feel like buying a product on an e-commerce site
   - **Crypto-native** (connects Phantom): must see enough detail to trust the smart contract

5. **Mobile-first**. Most users will receive a token link via WhatsApp/Telegram on their phone. The buy flow must work perfectly on mobile Safari/Chrome.

6. **The share moment is everything**. After launching a token, the success screen must make it irresistible to share. Big "Share on WhatsApp" button, copyable link, preview of how the link looks when shared (OG card preview).

7. **The dashboard is "home"**. After sign-in, the dashboard should feel like a fintech app: your balance, your holdings, your earnings. Not a blockchain explorer.

---

## File structure (current)

```
new-model-b/
├── programs/spl-token-bonding/    # Anchor program (Rust)
│   └── src/
│       ├── lib.rs                 # Constants (MASTER_WALLET, USDC_MINT, fees)
│       ├── state.rs               # TokenBondingV0 account layout
│       ├── errors.rs              # Custom errors
│       ├── curve/                 # Bonding curve math (U192, Newton's method)
│       └── instructions/          # buy_v1, sell_v1, init_token_bonding, etc.
├── sdk/                           # TypeScript SDK
│   └── src/
│       ├── TokenBondingSDK.ts     # High-level helpers
│       ├── types.ts               # Account types + constants
│       ├── math.ts                # Off-chain curve math
│       └── pdas.ts                # PDA derivation
├── app/                           # Next.js frontend
│   └── src/
│       ├── app/
│       │   ├── page.tsx           # Explore (all tokens)
│       │   ├── launch/page.tsx    # Launch wizard
│       │   ├── dashboard/page.tsx # User dashboard
│       │   ├── token/[mint]/page.tsx  # Token detail + buy/sell
│       │   └── api/
│       │       ├── sponsor-tx/    # Gas sponsorship relay
│       │       ├── upload/        # Pinata image upload
│       │       └── m/             # Metadata JSON endpoint
│       ├── components/
│       │   ├── LaunchForm.tsx     # 3-step wizard
│       │   ├── SwapPanel.tsx      # Buy/sell with slippage
│       │   ├── Dashboard.tsx      # Portfolio + launched tokens
│       │   ├── SendModal.tsx      # Send USDC/tokens modal
│       │   ├── BondingCurveChart.tsx
│       │   ├── TokenCard.tsx
│       │   ├── Header.tsx
│       │   ├── WalletButton.tsx   # Privy login + Phantom fallback
│       │   └── providers/
│       │       ├── PrivyAuthProvider.tsx  # Privy → Anchor bridge
│       │       ├── SdkProvider.tsx        # SDK context
│       │       └── WalletContextProvider.tsx
│       ├── hooks/
│       │   ├── useSwap.ts         # Buy/sell execution
│       │   ├── usePortfolio.ts    # User holdings
│       │   ├── useTokenBondings.ts
│       │   ├── useTokenBonding.ts
│       │   ├── useBondedPrice.ts
│       │   └── usePrivyAuth.ts
│       └── lib/
│           ├── sponsoredSend.ts   # Gas relay helper
│           ├── constants.ts
│           └── utils.ts
└── docs/
    └── this file
```

---

## Key URLs & accounts

| Item | Value |
|---|---|
| Program ID | `41nppqSazESeBmrgnud2j5Nz1MbsnPGeyAryPcKAefqa` |
| MASTER_WALLET | `CQ4n8D3ThynAdKyqiQifo9k79sumBWtNRHZH1TCk2BZ1` |
| Fee payer (devnet) | `XrMiSyRsttChRumZiEsTUiBa2Vgt2tJxbia93PsFYW6` |
| USDC mint (devnet) | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` |
| Privy App ID | `cmo35d8aa00n50bl1pkst91n7` |
| Network | devnet (Helius RPC) |
| GitHub | `github.com/pablofelipe01/new-model-b` |
