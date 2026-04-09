# new-model-b

Configurable bonding curve protocol for Solana, inspired by Strata Protocol.
Built with Anchor 0.31.1, a TypeScript SDK, and a Next.js 14 frontend.

## Stack

- **Program**: Anchor 0.31.1, Rust, U192 fixed-point math
- **SDK**: TypeScript + `@coral-xyz/anchor` + hand-written math mirror
- **Frontend**: Next.js 14 + Tailwind + Recharts + Solana wallet adapter

## Status

Phase 1-4 complete. End-to-end validated against `solana-test-validator`:
launch → buy → sell, with on-chain solvency invariants verified
(`reserve == ∫₀ˢ P(s)ds` to within rounding precision).

## Quick start

```bash
# 1. Install JS deps
pnpm install

# 2. Build the program and deploy to a local validator
solana-test-validator --reset    # in another terminal
anchor build
anchor deploy --provider.cluster localnet

# 3. Build the SDK and run the frontend
pnpm --filter @new-model-b/sdk build
pnpm --filter @new-model-b/app dev
```

Open http://localhost:3000, connect Phantom set to Localnet, and use
`/launch` to create a token followed by `/token/<mint>` to trade it.

## Layout

```
programs/spl-token-bonding/   Anchor program (Rust)
sdk/                          TypeScript SDK
app/                          Next.js 14 frontend
target/                       (gitignored) Anchor build output
```
