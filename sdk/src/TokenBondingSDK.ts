/**
 * High-level SDK for the spl-token-bonding Anchor program.
 *
 * Exposes a small number of imperative helpers (`createCurve`,
 * `initTokenBonding`, `buy`, `sell`) plus typed account getters. Aimed at
 * the frontend & integration tests.
 */
import {
  AnchorProvider,
  BN,
  Program,
  utils as anchorUtils,
} from "@coral-xyz/anchor";

import idlJson from "./idl/spl_token_bonding.json";
import type { SplTokenBonding } from "./idl/spl_token_bonding";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
  MINT_SIZE,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptMint,
  getAccount,
} from "@solana/spl-token";
import {
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  Transaction,
} from "@solana/web3.js";

import {
  baseStorageAuthorityPda,
  baseStoragePda,
  targetMintAuthorityPda,
  tokenBondingPda,
} from "./pdas";
import {
  buyBaseAmount as offchainBuyBaseAmount,
  buyTargetAmount as offchainBuyTargetAmount,
  type CurveParams,
} from "./math";
import {
  LAUNCHER_FEE_BPS_MAX,
  MASTER_WALLET,
  USDC_MINT,
  type CurveV0,
  type PiecewiseCurve,
  type TokenBondingV0,
} from "./types";

/** Fully-typed Anchor program handle. */
type AnchorProgram = Program<SplTokenBonding>;

export interface TokenBondingSDKOptions {
  /** Optional override for the program ID. Defaults to the address baked into the IDL. */
  programId?: PublicKey;
}

export class TokenBondingSDK {
  readonly provider: AnchorProvider;
  readonly programId: PublicKey;
  readonly program: AnchorProgram;

  constructor(provider: AnchorProvider, opts: TokenBondingSDKOptions = {}) {
    this.provider = provider;
    const idl = idlJson as unknown as SplTokenBonding;
    this.program = new Program<SplTokenBonding>(idl, provider);
    this.programId = opts.programId ?? this.program.programId;
  }

  static init(
    provider: AnchorProvider,
    opts: TokenBondingSDKOptions = {},
  ): TokenBondingSDK {
    return new TokenBondingSDK(provider, opts);
  }

  // ── Curve creation ─────────────────────────────────────────────────────

  async createCurve(args: {
    definition: PiecewiseCurve;
  }): Promise<{ curveKey: PublicKey; signature: string }> {
    const curveKp = Keypair.generate();
    const signature = await this.program.methods
      .createCurveV0({ definition: args.definition as never })
      .accountsPartial({
        payer: this.provider.wallet.publicKey,
        curve: curveKp.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([curveKp])
      .rpc();
    return { curveKey: curveKp.publicKey, signature };
  }

  // ── Token bonding init ─────────────────────────────────────────────────

  /**
   * Initialize a `TokenBondingV0`. Charges the launch fee (25 USDC) on-chain
   * via the program's `initialize_token_bonding_v0` ix.
   *
   * The base mint is hardcoded to USDC — the program enforces this and the
   * SDK does not expose it as an option.
   *
   * If `targetMint` is omitted, a fresh mint is created and its mint
   * authority is set to the program's `mint-authority` PDA before the
   * `init_token_bonding_v0` ix is run.
   */
  async initTokenBonding(args: {
    curve: PublicKey;
    /** Launcher's per-trade fee in basis points (0..=500). */
    launcherFeeBasisPoints: number;
    /** Wallet that owns the launcher's USDC ATA where fees are deposited. */
    launcherFeeWallet?: PublicKey;
    targetMint?: PublicKey;
    decimals?: number;
    index?: number;
    goLiveDate?: Date;
    freezeBuyDate?: Date;
    mintCap?: BN;
    purchaseCap?: BN;
    /** Token metadata — if set, a Metaplex metadata account is created
     *  alongside the mint so wallets display the name/symbol. */
    tokenName?: string;
    tokenSymbol?: string;
    tokenUri?: string;
    generalAuthority?: PublicKey | null;
    curveAuthority?: PublicKey | null;
    ignoreExternalReserveChanges?: boolean;
    ignoreExternalSupplyChanges?: boolean;
    /** Who pays SOL rent for new accounts (mint, PDAs, ATAs). Defaults to
     *  the connected wallet. Pass the gas sponsor pubkey so the user
     *  doesn't need SOL. */
    rentPayer?: PublicKey;
    /** Custom send function. When provided, the SDK builds + partially signs
     *  the transactions but delegates sending to the caller (e.g. the gas
     *  sponsor relay). Receives the serialized tx (may need one more
     *  signature from the relay). Must return the tx signature string. */
    sendFn?: (serializedTx: Buffer, extraSigners?: Keypair[]) => Promise<string>;
  }): Promise<{
    tokenBondingKey: PublicKey;
    targetMint: PublicKey;
    signature: string;
  }> {
    if (
      args.launcherFeeBasisPoints < 0 ||
      args.launcherFeeBasisPoints > LAUNCHER_FEE_BPS_MAX
    ) {
      throw new Error(
        `launcherFeeBasisPoints must be in [0, ${LAUNCHER_FEE_BPS_MAX}]`,
      );
    }

    const payer = this.provider.wallet.publicKey;
    const index = args.index ?? 0;
    const decimals = args.decimals ?? 9;
    const launcherFeeWallet = args.launcherFeeWallet ?? payer;
    const rentPayer = args.rentPayer ?? payer;

    // ── TX A: create the mint + metadata + transfer authority ──────────
    let targetMint: PublicKey;
    if (args.targetMint) {
      targetMint = args.targetMint;
    } else {
      const mintKp = Keypair.generate();
      targetMint = mintKp.publicKey;

      const txA = new Transaction();
      const lamports = await getMinimumBalanceForRentExemptMint(this.provider.connection);
      txA.add(
        SystemProgram.createAccount({
          fromPubkey: rentPayer,
          newAccountPubkey: targetMint,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(targetMint, decimals, payer, payer),
      );

      if (args.tokenName) {
        const [metadataPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("metadata"),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            targetMint.toBuffer(),
          ],
          TOKEN_METADATA_PROGRAM_ID,
        );
        txA.add(
          createCreateMetadataAccountV3Instruction(
            {
              metadata: metadataPda,
              mint: targetMint,
              mintAuthority: payer,
              payer: rentPayer,
              updateAuthority: payer,
            },
            {
              createMetadataAccountArgsV3: {
                data: {
                  name: args.tokenName,
                  symbol: args.tokenSymbol ?? "",
                  uri: args.tokenUri ?? "",
                  sellerFeeBasisPoints: 0,
                  creators: null,
                  collection: null,
                  uses: null,
                },
                isMutable: true,
                collectionDetails: null,
              },
            },
          ),
        );
      }

      const [tokenBondingPk] = tokenBondingPda(this.programId, targetMint, index);
      const [mintAuthorityA] = targetMintAuthorityPda(this.programId, tokenBondingPk);
      txA.add(
        createSetAuthorityInstruction(
          targetMint,
          payer,
          AuthorityType.MintTokens,
          mintAuthorityA,
        ),
      );

      const { blockhash, lastValidBlockHeight } =
        await this.provider.connection.getLatestBlockhash("confirmed");
      txA.recentBlockhash = blockhash;
      txA.lastValidBlockHeight = lastValidBlockHeight;
      txA.feePayer = rentPayer;
      txA.partialSign(mintKp);
      const signedA = await this.provider.wallet.signTransaction(txA);

      if (args.sendFn) {
        await args.sendFn(
          Buffer.from(signedA.serialize({ requireAllSignatures: false })),
        );
      } else {
        const sigA = await this.provider.connection.sendRawTransaction(
          signedA.serialize(),
          { skipPreflight: true },
        );
        const confA = await this.provider.connection.confirmTransaction(
          { signature: sigA, blockhash, lastValidBlockHeight },
          "confirmed",
        );
        if (confA.value.err) {
          throw new Error(
            `Mint creation failed: ${JSON.stringify(confA.value.err)}. TX: ${sigA}`,
          );
        }
      }
    }

    // ── TX B: ensure fee ATAs exist + initTokenBonding ─────────────────
    const tx = new Transaction();

    const [tokenBonding] = tokenBondingPda(this.programId, targetMint, index);
    const [mintAuthority] = targetMintAuthorityPda(this.programId, tokenBonding);
    const [baseStorage] = baseStoragePda(this.programId, tokenBonding);
    const [baseStorageAuthority] = baseStorageAuthorityPda(this.programId, tokenBonding);

    const payerUsdc = getAssociatedTokenAddressSync(USDC_MINT, payer);
    const masterUsdc = getAssociatedTokenAddressSync(USDC_MINT, MASTER_WALLET, true);

    // Idempotent: only add the create ix if the master ATA doesn't exist.
    // The payer ATA is the user's responsibility — if missing, the fee
    // transfer will simply fail with a clear error.
    try {
      await getAccount(this.provider.connection, masterUsdc);
    } catch {
      tx.add(
        createAssociatedTokenAccountInstruction(
          rentPayer,
          masterUsdc,
          MASTER_WALLET,
          USDC_MINT,
        ),
      );
    }

    const goLive = new BN(Math.floor((args.goLiveDate ?? new Date()).getTime() / 1000));
    const freezeBuy = args.freezeBuyDate
      ? new BN(Math.floor(args.freezeBuyDate.getTime() / 1000))
      : null;

    const ixArgs = {
      index,
      goLiveUnixTime: goLive,
      freezeBuyUnixTime: freezeBuy,
      mintCap: args.mintCap ?? null,
      purchaseCap: args.purchaseCap ?? null,
      generalAuthority: args.generalAuthority === undefined ? payer : args.generalAuthority,
      curveAuthority: args.curveAuthority === undefined ? payer : args.curveAuthority,
      buyFrozen: false,
      ignoreExternalReserveChanges: args.ignoreExternalReserveChanges ?? false,
      ignoreExternalSupplyChanges: args.ignoreExternalSupplyChanges ?? false,
      launcherFeeBasisPoints: args.launcherFeeBasisPoints,
      launcherFeeWallet,
    };

    const initIx = await this.program.methods
      .initializeTokenBondingV0(ixArgs)
      .accountsPartial({
        payer,
        baseMint: USDC_MINT,
        targetMint,
        curve: args.curve,
        tokenBonding,
        targetMintAuthority: mintAuthority,
        baseStorage,
        baseStorageAuthority,
        payerUsdc,
        masterUsdc,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
    tx.add(initIx);

    const { blockhash: bh, lastValidBlockHeight: lvbh } =
      await this.provider.connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = bh;
    tx.lastValidBlockHeight = lvbh;
    tx.feePayer = rentPayer;
    const signedB = await this.provider.wallet.signTransaction(tx);

    let signature: string;
    if (args.sendFn) {
      signature = await args.sendFn(
        Buffer.from(signedB.serialize({ requireAllSignatures: false })),
      );
    } else {
      signature = await this.provider.connection.sendRawTransaction(
        signedB.serialize(),
        { skipPreflight: true },
      );
      const confB = await this.provider.connection.confirmTransaction(
        { signature, blockhash: bh, lastValidBlockHeight: lvbh },
        "confirmed",
      );
      if (confB.value.err) {
        throw new Error(
          `Token bonding init failed: ${JSON.stringify(confB.value.err)}. TX: ${signature}`,
        );
      }
    }
    return { tokenBondingKey: tokenBonding, targetMint, signature };
  }

  // ── Trading ────────────────────────────────────────────────────────────

  async buy(args: {
    tokenBonding: PublicKey;
    desiredTargetAmount?: BN;
    baseAmount?: BN;
    /** Slippage as a fraction. 0.05 == 5 %. */
    slippage?: number;
    destination?: PublicKey;
    /** Who pays rent for ATA creation. Defaults to the connected wallet.
     *  Pass the gas sponsor's pubkey when using fee-payer relay so the
     *  user doesn't need SOL. */
    rentPayer?: PublicKey;
  }): Promise<Transaction> {
    const payer = this.provider.wallet.publicKey;
    const rentPayer = args.rentPayer ?? payer;
    const slippage = args.slippage ?? 0.05;

    const bonding = await this.getTokenBonding(args.tokenBonding);
    if (!bonding) throw new Error("token bonding account not found");

    const [mintAuthority] = targetMintAuthorityPda(this.programId, args.tokenBonding);
    const destination =
      args.destination ?? getAssociatedTokenAddressSync(bonding.targetMint, payer);
    const source = getAssociatedTokenAddressSync(bonding.baseMint, payer);

    const masterUsdc = getAssociatedTokenAddressSync(
      bonding.baseMint,
      bonding.masterWallet,
      true,
    );
    const launcherUsdc = getAssociatedTokenAddressSync(
      bonding.baseMint,
      bonding.launcherFeeWallet,
      true,
    );

    const tx = new Transaction();

    // Best-effort: create destination + fee ATAs if missing. `rentPayer`
    // funds the rent — when gas-sponsored this is the relay wallet so
    // the user doesn't need SOL at all.
    for (const [mint, ata, owner] of [
      [bonding.targetMint, destination, payer],
      [bonding.baseMint, masterUsdc, bonding.masterWallet],
      [bonding.baseMint, launcherUsdc, bonding.launcherFeeWallet],
    ] as const) {
      try {
        await getAccount(this.provider.connection, ata);
      } catch {
        tx.add(
          createAssociatedTokenAccountInstruction(rentPayer, ata, owner, mint),
        );
      }
    }

    // Quote off-chain first. We ALWAYS send `desiredTargetAmount` to the
    // program — never `baseAmount` — because the on-chain inverse solve
    // (bisection over reserve_for_supply) is too CU-expensive for BPF
    // (~1.4M CU). The forward `price_for_tokens` only costs ~40k CU.
    const quote = await this.quoteBuy(bonding, {
      desiredTargetAmount: args.desiredTargetAmount,
      baseAmount: args.baseAmount,
    });

    // Resolve the target amount: either the caller set it directly, or
    // we computed it from baseAmount via the off-chain quote.
    const targetAmount = args.desiredTargetAmount ?? new BN(quote.targetAmount);

    // Slippage: cap the base cost the user is willing to pay.
    const slippageMaxBase = new BN(Math.ceil(quote.baseAmount * (1 + slippage)));

    const ix = await this.program.methods
      .buyV1({
        desiredTargetAmount: targetAmount,
        baseAmount: null,
        slippageMaxBase,
        slippageMinTarget: null,
      })
      .accountsPartial({
        payer,
        tokenBonding: args.tokenBonding,
        curve: bonding.curve,
        baseMint: bonding.baseMint,
        targetMint: bonding.targetMint,
        targetMintAuthority: mintAuthority,
        baseStorage: bonding.baseStorage,
        masterUsdc,
        launcherUsdc,
        source,
        destination,
        tokenProgram: TOKEN_PROGRAM_ID,
        clock: SYSVAR_CLOCK_PUBKEY,
      })
      .instruction();
    tx.add(ix);
    return tx;
  }

  async sell(args: {
    tokenBonding: PublicKey;
    targetAmount: BN;
    slippage?: number;
    destination?: PublicKey;
    /** Who pays rent for ATA creation. Defaults to the connected wallet. */
    rentPayer?: PublicKey;
  }): Promise<Transaction> {
    const seller = this.provider.wallet.publicKey;
    const rentPayer = args.rentPayer ?? seller;
    const slippage = args.slippage ?? 0.05;

    const bonding = await this.getTokenBonding(args.tokenBonding);
    if (!bonding) throw new Error("token bonding account not found");

    const [baseStorageAuthority] = baseStorageAuthorityPda(
      this.programId,
      args.tokenBonding,
    );

    const source = getAssociatedTokenAddressSync(bonding.targetMint, seller);
    const destination =
      args.destination ?? getAssociatedTokenAddressSync(bonding.baseMint, seller);

    const masterUsdc = getAssociatedTokenAddressSync(
      bonding.baseMint,
      bonding.masterWallet,
      true,
    );
    const launcherUsdc = getAssociatedTokenAddressSync(
      bonding.baseMint,
      bonding.launcherFeeWallet,
      true,
    );

    const tx = new Transaction();

    for (const [mint, ata, owner] of [
      [bonding.baseMint, destination, seller],
      [bonding.baseMint, masterUsdc, bonding.masterWallet],
      [bonding.baseMint, launcherUsdc, bonding.launcherFeeWallet],
    ] as const) {
      try {
        await getAccount(this.provider.connection, ata);
      } catch {
        tx.add(
          createAssociatedTokenAccountInstruction(rentPayer, ata, owner, mint),
        );
      }
    }

    // Quote
    const quote = await this.quoteSell(bonding, args.targetAmount);
    const slippageMinBase = new BN(Math.floor(quote.baseAmount * (1 - slippage)));

    const ix = await this.program.methods
      .sellV1({
        targetAmount: args.targetAmount,
        slippageMinBase,
      })
      .accountsPartial({
        seller,
        tokenBonding: args.tokenBonding,
        curve: bonding.curve,
        baseMint: bonding.baseMint,
        targetMint: bonding.targetMint,
        baseStorage: bonding.baseStorage,
        baseStorageAuthority,
        masterUsdc,
        launcherUsdc,
        source,
        destination,
        tokenProgram: TOKEN_PROGRAM_ID,
        clock: SYSVAR_CLOCK_PUBKEY,
      })
      .instruction();
    tx.add(ix);
    return tx;
  }

  // ── Quotes (off-chain previews) ────────────────────────────────────────

  /**
   * Quote a buy. Returns both the gross `baseAmount` paid by the user and
   * the fee breakdown so callers can show a preview without re-deriving the
   * fee math themselves.
   *
   * The on-chain logic skims fees BEFORE handing the remainder to the curve,
   * so we mirror that here: when the caller fixes `baseAmount`, we subtract
   * the fees first; when they fix `desiredTargetAmount`, we gross up.
   */
  async quoteBuy(
    bonding: TokenBondingV0,
    args: { desiredTargetAmount?: BN; baseAmount?: BN },
  ): Promise<{
    targetAmount: number;
    baseAmount: number;
    platformFee: number;
    launcherFee: number;
    baseToReserve: number;
  }> {
    const curveDef = await this.getCurveParams(bonding.curve);
    const supply = (await this.getMintSupply(bonding.targetMint)).toNumber();

    const platformBps = bonding.platformFeeBasisPoints;
    const launcherBps = bonding.launcherFeeBasisPoints;
    const totalBps = platformBps + launcherBps;
    const netBps = 10_000 - totalBps;

    let targetAmount: number;
    let baseAmount: number;

    if (args.desiredTargetAmount) {
      targetAmount = args.desiredTargetAmount.toNumber();
      const baseToReserve = offchainBuyTargetAmount(curveDef, supply, targetAmount);
      baseAmount = Math.ceil((baseToReserve * 10_000) / netBps);
    } else if (args.baseAmount) {
      baseAmount = args.baseAmount.toNumber();
      const baseToReserve = Math.floor((baseAmount * netBps) / 10_000);
      targetAmount = offchainBuyBaseAmount(curveDef, supply, baseToReserve);
    } else {
      throw new Error("Pass either desiredTargetAmount or baseAmount");
    }

    const platformFee = Math.floor((baseAmount * platformBps) / 10_000);
    const launcherFee = Math.floor((baseAmount * launcherBps) / 10_000);
    const baseToReserve = baseAmount - platformFee - launcherFee;
    return { targetAmount, baseAmount, platformFee, launcherFee, baseToReserve };
  }

  /**
   * Quote a sell. `baseAmount` is the NET the seller actually receives after
   * the platform and launcher fees are skimmed from the curve gross.
   */
  async quoteSell(
    bonding: TokenBondingV0,
    targetAmount: BN,
  ): Promise<{
    baseAmount: number;
    grossBaseAmount: number;
    platformFee: number;
    launcherFee: number;
  }> {
    const curveDef = await this.getCurveParams(bonding.curve);
    const supply = (await this.getMintSupply(bonding.targetMint)).toNumber();
    const t = targetAmount.toNumber();
    const grossBaseAmount = offchainBuyTargetAmount(curveDef, supply - t, t);
    const platformFee = Math.floor((grossBaseAmount * bonding.platformFeeBasisPoints) / 10_000);
    const launcherFee = Math.floor((grossBaseAmount * bonding.launcherFeeBasisPoints) / 10_000);
    const baseAmount = grossBaseAmount - platformFee - launcherFee;
    return { baseAmount, grossBaseAmount, platformFee, launcherFee };
  }

  // ── Account getters ────────────────────────────────────────────────────

  async getTokenBonding(key: PublicKey): Promise<TokenBondingV0 | null> {
    try {
      return (await this.program.account.tokenBondingV0.fetch(key)) as unknown as TokenBondingV0;
    } catch {
      return null;
    }
  }

  async getCurve(key: PublicKey): Promise<CurveV0 | null> {
    try {
      return (await this.program.account.curveV0.fetch(key)) as unknown as CurveV0;
    } catch {
      return null;
    }
  }

  async getTokenBondingByMint(
    mint: PublicKey,
    index = 0,
  ): Promise<TokenBondingV0 | null> {
    const [pda] = tokenBondingPda(this.programId, mint, index);
    return this.getTokenBonding(pda);
  }

  /**
   * List every `TokenBondingV0` account owned by this program that we can
   * successfully decode with the current IDL. Anchor's `account.all()`
   * throws on the first undecodable row, which breaks the UI whenever an
   * old account layout lingers on the cluster after a program upgrade.
   *
   * We replicate the low-level filter ourselves: `getProgramAccounts` with
   * the 8-byte discriminator for `TokenBondingV0`, then decode each row
   * individually and silently drop the ones that fail. Stale accounts from
   * before the last layout change are thus ignored, not fatal.
   */
  async listTokenBondings(): Promise<
    { publicKey: PublicKey; account: TokenBondingV0 }[]
  > {
    const discriminator =
      // @ts-expect-error — the accounts coder exposes discriminators at
      // runtime even though the public type doesn't include this field.
      this.program.account.tokenBondingV0.coder.accounts.accountDiscriminator(
        "tokenBondingV0",
      ) as Buffer;

    const raw = await this.provider.connection.getProgramAccounts(
      this.programId,
      {
        filters: [
          {
            memcmp: {
              offset: 0,
              bytes: anchorUtils.bytes.bs58.encode(discriminator),
            },
          },
        ],
      },
    );

    const out: { publicKey: PublicKey; account: TokenBondingV0 }[] = [];
    for (const row of raw) {
      try {
        const decoded = this.program.coder.accounts.decode(
          "tokenBondingV0",
          row.account.data,
        );
        out.push({ publicKey: row.pubkey, account: decoded as unknown as TokenBondingV0 });
      } catch {
        // Old layout / corrupted account — skip it rather than break the list.
      }
    }
    return out;
  }

  // ── Internals ──────────────────────────────────────────────────────────

  /**
   * Resolve the *currently active* primitive curve and return human params.
   * Picks the first piece (single-piece curves are the common case for the
   * launch wizard).
   */
  private async getCurveParams(curveKey: PublicKey): Promise<CurveParams> {
    const curve = await this.getCurve(curveKey);
    if (!curve) throw new Error("curve account not found");
    const pieces = curve.definition.timeV0.curves;
    if (pieces.length === 0) throw new Error("empty curve");
    const primitive = pieces[0].curve;
    if ("exponentialCurveV0" in primitive) {
      const e = primitive.exponentialCurveV0;
      return {
        c: bnRawToHuman(e.c),
        b: bnRawToHuman(e.b),
        pow: e.pow,
        frac: e.frac,
      };
    }
    return { c: 0, b: bnRawToHuman(primitive.constantPriceCurveV0.price), pow: 1, frac: 1 };
  }

  private async getMintSupply(mint: PublicKey): Promise<BN> {
    const info = await this.provider.connection.getTokenSupply(mint);
    return new BN(info.value.amount);
  }
}

// ── helpers ─────────────────────────────────────────────────────────────

function bnRawToHuman(raw: BN | bigint | { toString(): string }): number {
  // Convert via string to dodge BN.toNumber() throwing on >53-bit values.
  const s = raw.toString();
  if (s.length <= 12) {
    return Number("0." + s.padStart(12, "0"));
  }
  const intPart = s.slice(0, -12);
  const fracPart = s.slice(-12);
  return Number(intPart + "." + fracPart);
}

export { ASSOCIATED_TOKEN_PROGRAM_ID };
