# Setup Guide — new-model-b

Everything you need to get back up and running after a reboot, fresh clone, or new machine.

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| **Node.js** | 24+ | `brew install node` |
| **pnpm** | 9+ | `corepack enable && corepack prepare pnpm@latest --activate` |
| **Rust** | 1.82+ | `rustup update stable` |
| **Solana CLI** | 1.18.26 | `sh -c "$(curl -sSfL https://release.anza.xyz/v1.18.26/install)"` |
| **Anchor CLI** | 0.31.1 | `avm install 0.31.1 && avm use 0.31.1` |

### PATH (add to `~/.zshrc` if not already there)

```bash
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
export PATH="$HOME/.avm/bin:$PATH"
```

After editing, run `source ~/.zshrc`.

### Verify

```bash
node -v          # v24+
pnpm -v          # 9+
rustc --version  # 1.82+
solana --version # 1.18.26
anchor --version # 0.31.1
```

---

## Clone & install

```bash
git clone git@github.com:pablofelipe01/new-model-b.git
cd new-model-b
pnpm install
```

---

## Program keypair

The program identity lives in `target/deploy/spl_token_bonding-keypair.json`.
A backup copy is at `~/keys/spl_token_bonding-keypair.json`.

**If `target/deploy/` is missing** (after `cargo clean` or fresh clone):

```bash
mkdir -p target/deploy
cp ~/keys/spl_token_bonding-keypair.json target/deploy/
```

This keeps the program ID stable at `41nppqSazESeBmrgnud2j5Nz1MbsnPGeyAryPcKAefqa`.

---

## Build the Anchor program

```bash
anchor build
anchor keys list  # should show 41nppqSazESeBmrgnud2j5Nz1MbsnPGeyAryPcKAefqa
```

First build takes ~5-10 min (downloads ~400 crates). Subsequent builds ~30s.

---

## Build the SDK

```bash
pnpm --filter @new-model-b/sdk build
```

If the IDL changed (after `anchor build`), sync it first:

```bash
pnpm --filter @new-model-b/sdk run sync-idl
pnpm --filter @new-model-b/sdk build
```

---

## Environment variables

Create `app/.env.local` (never committed to git):

```
NEXT_PUBLIC_CLUSTER=devnet
NEXT_PUBLIC_DEVNET_RPC=https://devnet.helius-rpc.com/?api-key=<YOUR_HELIUS_KEY>
PINATA_JWT=<YOUR_PINATA_JWT>
PINATA_GATEWAY=https://moccasin-legal-mink-331.mypinata.cloud
```

These same vars must be set in **Vercel → Settings → Environment Variables** for production.

---

## Option A: Run against local validator (fastest for dev)

### Terminal 1 — validator

```bash
solana-test-validator --reset
```

### Terminal 2 — setup & deploy

```bash
solana config set --url localhost
solana airdrop 10
anchor deploy --provider.cluster localnet
```

Create a test base token and fund your Phantom wallet:

```bash
spl-token create-token
# Note the mint address, then:
spl-token create-account <MINT> --owner <PHANTOM_PUBKEY> --fee-payer ~/.config/solana/new_keypair.json
spl-token mint <MINT> 1000 --recipient-owner <PHANTOM_PUBKEY>
solana airdrop 5 <PHANTOM_PUBKEY>
```

Update `app/.env.local`:

```
NEXT_PUBLIC_CLUSTER=devnet
NEXT_PUBLIC_DEVNET_RPC=http://127.0.0.1:8899
```

Set Phantom to **Solana Localnet**.

### Terminal 3 — frontend

```bash
pnpm --filter @new-model-b/app dev
```

Open http://localhost:3000.

---

## Option B: Run against Solana devnet

### Configure CLI

```bash
solana config set --url "https://devnet.helius-rpc.com/?api-key=<YOUR_HELIUS_KEY>"
```

### Deploy (if not already deployed)

```bash
solana airdrop 5
anchor deploy --provider.cluster devnet
```

Program is already deployed at `41nppqSazESeBmrgnud2j5Nz1MbsnPGeyAryPcKAefqa`.

### Fund Phantom on devnet

```bash
solana airdrop 2 <PHANTOM_PUBKEY>
```

If the airdrop rate-limits you, use https://faucet.solana.com.

### Create a base token on devnet (if needed)

```bash
spl-token create-token
spl-token create-account <MINT> --owner <PHANTOM_PUBKEY> --fee-payer ~/.config/solana/new_keypair.json
spl-token mint <MINT> 1000 --recipient-owner <PHANTOM_PUBKEY>
```

Update the mint in `app/src/lib/constants.ts` under `BASE_TOKENS.devnet`.

Set Phantom to **Solana Devnet**.

### Start frontend

```bash
pnpm --filter @new-model-b/app dev
```

---

## Deploy frontend to Vercel

Already deployed at https://new-model-b-app-1.vercel.app.

Auto-deploys on every push to `main`. If you need to redeploy manually:

1. Vercel dashboard → Deployments → Redeploy

### Vercel project settings

| Setting | Value |
|---|---|
| Root Directory | `app` |
| Framework | Next.js (auto-detected) |
| Install Command | `cd .. && pnpm install` |
| Build Command | `cd .. && pnpm --filter @new-model-b/sdk build && cd app && pnpm build` |

### Environment Variables in Vercel

| Name | Value |
|---|---|
| `NEXT_PUBLIC_CLUSTER` | `devnet` |
| `NEXT_PUBLIC_DEVNET_RPC` | `https://devnet.helius-rpc.com/?api-key=<KEY>` |
| `PINATA_JWT` | `eyJ...` |
| `PINATA_GATEWAY` | `https://moccasin-legal-mink-331.mypinata.cloud` |

---

## Key addresses

| What | Address |
|---|---|
| **Program ID** | `41nppqSazESeBmrgnud2j5Nz1MbsnPGeyAryPcKAefqa` |
| **CLI wallet** | `XrMiSyRsttChRumZiEsTUiBa2Vgt2tJxbia93PsFYW6` |
| **Phantom wallet** | `CQ4n8D3ThynAdKyqiQifo9k79sumBWtNRHZH1TCk2BZ1` |
| **Devnet TEST mint** | `578EySLFY4o5R1Tui3KvEbHaseRRBqZcfx1on2NZ8UXb` |
| **CLI keypair file** | `~/.config/solana/new_keypair.json` |
| **Program keypair backup** | `~/keys/spl_token_bonding-keypair.json` |

---

## Key files

```
programs/spl-token-bonding/   Anchor program (Rust)
  src/lib.rs                  Entrypoint + declare_id!
  src/state.rs                Account structs
  src/curve/                  U192 math + price formulas
  src/instructions/           All 7 instructions

sdk/                          TypeScript SDK
  src/TokenBondingSDK.ts      Main class
  src/math.ts                 Off-chain price calculator
  src/pdas.ts                 PDA derivation
  src/idl/                    Generated IDL + types

app/                          Next.js 14 frontend
  src/app/page.tsx            Explore (real indexer)
  src/app/launch/page.tsx     Launch wizard
  src/app/token/[mint]/       Token detail + trade
  src/app/api/m/              Metadata JSON endpoint
  src/app/api/upload/         Pinata upload proxy
  src/components/             UI components
  src/hooks/                  React hooks
  .env.local                  Local env vars (gitignored)

Anchor.toml                   Anchor config
Cargo.toml                    Rust workspace
target/deploy/                Program .so + keypair
~/keys/                       Keypair backup
```

---

## Troubleshooting

### `anchor build` fails with `edition2024`
The BPF toolchain bundled with Solana 1.18 uses an older cargo. Make sure you're on Anchor 0.31.1 (`anchor --version`).

### `anchor build` fails with `source_file` on `anchor-syn`
Anchor 0.30.x had this bug. Upgrade to 0.31.1: `avm install 0.31.1 && avm use 0.31.1`.

### Program ID mismatch after `cargo clean`
Restore the keypair: `cp ~/keys/spl_token_bonding-keypair.json target/deploy/`
Then: `anchor keys sync && anchor build`.

### `Transaction too large: > 1232`
The metadata URI might be too long. Use a shorter image URL or the upload feature (which generates a short IPFS URL).

### `NotLiveYet` error when buying
The token's go-live time is in the future. Launch a new token (go-live is now set to "immediately" by default).

### Phantom shows wrong balance on localnet
Phantom's localnet RPC might not match your validator. Verify with `solana balance <PUBKEY>` — that's the truth.

### `pino-pretty` build error on Vercel
Already handled in `next.config.js` (externalized for server, aliased to false for client).
