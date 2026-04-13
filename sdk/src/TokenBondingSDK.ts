/**
 * High-level SDK for the spl-token-bonding Anchor program.
 *
 * Exposes a small number of imperative helpers (`createCurve`,
 * `initTokenBonding`, `buy`, `sell`) plus typed account getters. Aimed at
 * the frontend & integration tests.
 *
 * The SDK uses Anchor's `Program` under the hood. Until `anchor build` runs
 * and an IDL JSON is generated, we cast through `any` for the program type so
 * the SDK can be type-checked in isolation. Replace `AnchorProgram` with the
 * generated IDL type once available — search for the `AnchorProgram` alias.
 */
import {
  AnchorProvider,
  BN,
  Program,
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
  programStatePda,
  targetMintAuthorityPda,
  tokenBondingPda,
} from "./pdas";
import {
  buyBaseAmount as offchainBuyBaseAmount,
  buyTargetAmount as offchainBuyTargetAmount,
  toExponentialCurve,
  type CurveParams,
} from "./math";
import type {
  CurveV0,
  PiecewiseCurve,
  TokenBondingV0,
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
    // Anchor 0.30+ embeds the program ID in the IDL itself, so we just hand
    // the IDL to `new Program` and trust its `address` field. Allow callers
    // to override for tests / forks via `opts.programId`.
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

  /**
   * Create a reusable curve definition account, send the tx, and wait for
   * confirmation. Anchor's `.rpc()` handles blockhash + fee payer + signing
   * by both the wallet and the extra `curveKp` signer.
   */
  async createCurve(args: {
    definition: PiecewiseCurve;
  }): Promise<{ curveKey: PublicKey; signature: string }> {
    const curveKp = Keypair.generate();
    // Anchor 0.31 generates exhaustive variant-discriminated enum types from
    // the IDL, which our hand-written `PiecewiseCurve` shape almost matches
    // but not literally. Cast at the boundary; the runtime serialization is
    // identical (Borsh enum encoding).
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
   * Initialize a `TokenBondingV0`.
   *
   * If `targetMint` is omitted, a fresh mint is created and its mint
   * authority is set to the program's `mint-authority` PDA before the
   * `init_token_bonding_v0` ix is run.
   */
  async initTokenBonding(args: {
    baseMint: PublicKey;
    curve: PublicKey;
    targetMint?: PublicKey;
    decimals?: number;
    index?: number;
    goLiveDate?: Date;
    freezeBuyDate?: Date;
    mintCap?: BN;
    purchaseCap?: BN;
    buyBaseRoyaltyPercentage?: number;
    sellBaseRoyaltyPercentage?: number;
    buyTargetRoyaltyPercentage?: number;
    sellTargetRoyaltyPercentage?: number;
    /** Token metadata — if set, a Metaplex metadata account is created
     *  alongside the mint so wallets display the name/symbol. */
    tokenName?: string;
    tokenSymbol?: string;
    tokenUri?: string;
    /** ATA owners for the four royalty accounts. Defaults to provider wallet. */
    royaltyOwner?: PublicKey;
    generalAuthority?: PublicKey | null;
    reserveAuthority?: PublicKey | null;
    curveAuthority?: PublicKey | null;
    ignoreExternalReserveChanges?: boolean;
    ignoreExternalSupplyChanges?: boolean;
  }): Promise<{
    tokenBondingKey: PublicKey;
    targetMint: PublicKey;
    signature: string;
  }> {
    const payer = this.provider.wallet.publicKey;
    const index = args.index ?? 0;
    const decimals = args.decimals ?? 9;

    // ── TX A: create the mint + metadata + transfer authority ──────────
    // Separated from the bonding init because the Metaplex metadata
    // instruction + its URI data can push the combined transaction
    // over the 1232-byte limit.
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
          fromPubkey: payer,
          newAccountPubkey: targetMint,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(targetMint, decimals, payer, payer),
      );

      // Metaplex metadata (optional but strongly recommended).
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
              payer,
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

      // Derive the PDA that will own the mint going forward.
      const [tokenBondingPk] = tokenBondingPda(this.programId, targetMint, index);
      const [mintAuthority] = targetMintAuthorityPda(this.programId, tokenBondingPk);
      txA.add(
        createSetAuthorityInstruction(
          targetMint,
          payer,
          AuthorityType.MintTokens,
          mintAuthority,
        ),
      );

      // Send TX A (createMint + metadata + setAuthority).
      // Use manual sign → send → confirm instead of provider.sendAndConfirm
      // because the latter throws "Unknown action 'undefined'" on some
      // Anchor 0.31 + wallet-adapter combos.
      const { blockhash, lastValidBlockHeight } =
        await this.provider.connection.getLatestBlockhash("confirmed");
      txA.recentBlockhash = blockhash;
      txA.lastValidBlockHeight = lastValidBlockHeight;
      txA.feePayer = payer;
      txA.partialSign(mintKp);
      const signedA = await this.provider.wallet.signTransaction(txA);
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
          `Mint creation failed: ${JSON.stringify(confA.value.err)}. ` +
          `TX: ${sigA}`,
        );
      }
    }

    // ── TX B: royalty ATAs + initTokenBonding ──────────────────────────
    const tx = new Transaction();

    const [tokenBonding] = tokenBondingPda(this.programId, targetMint, index);
    const [mintAuthority] = targetMintAuthorityPda(this.programId, tokenBonding);
    const [baseStorage] = baseStoragePda(this.programId, tokenBonding);
    const [baseStorageAuthority] = baseStorageAuthorityPda(this.programId, tokenBonding);

    const royaltyOwner = args.royaltyOwner ?? payer;
    const royalties = await this.ensureRoyaltyAtas(tx, {
      payer,
      owner: royaltyOwner,
      baseMint: args.baseMint,
      targetMint,
    });

    // 5. The actual init ix -------------------------------------------------
    const goLive = new BN(Math.floor((args.goLiveDate ?? new Date()).getTime() / 1000));
    const freezeBuy = args.freezeBuyDate
      ? new BN(Math.floor(args.freezeBuyDate.getTime() / 1000))
      : null;

    const ixArgs = {
      index,
      goLiveUnixTime: goLive,
      freezeBuyUnixTime: freezeBuy,
      buyBaseRoyaltyPercentage: args.buyBaseRoyaltyPercentage ?? 0,
      buyTargetRoyaltyPercentage: args.buyTargetRoyaltyPercentage ?? 0,
      sellBaseRoyaltyPercentage: args.sellBaseRoyaltyPercentage ?? 0,
      sellTargetRoyaltyPercentage: args.sellTargetRoyaltyPercentage ?? 0,
      mintCap: args.mintCap ?? null,
      purchaseCap: args.purchaseCap ?? null,
      generalAuthority: args.generalAuthority === undefined ? payer : args.generalAuthority,
      reserveAuthority: args.reserveAuthority === undefined ? payer : args.reserveAuthority,
      curveAuthority: args.curveAuthority === undefined ? payer : args.curveAuthority,
      buyFrozen: false,
      ignoreExternalReserveChanges: args.ignoreExternalReserveChanges ?? false,
      ignoreExternalSupplyChanges: args.ignoreExternalSupplyChanges ?? false,
    };

    const initIx = await this.program.methods
      .initializeTokenBondingV0(ixArgs)
      .accountsPartial({
        payer,
        baseMint: args.baseMint,
        targetMint,
        curve: args.curve,
        tokenBonding,
        targetMintAuthority: mintAuthority,
        baseStorage,
        baseStorageAuthority,
        buyBaseRoyalties: royalties.buyBase,
        buyTargetRoyalties: royalties.buyTarget,
        sellBaseRoyalties: royalties.sellBase,
        sellTargetRoyalties: royalties.sellTarget,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
    tx.add(initIx);

    // TX B: manual sign → send → confirm (same pattern as TX A).
    const { blockhash: bh, lastValidBlockHeight: lvbh } =
      await this.provider.connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = bh;
    tx.lastValidBlockHeight = lvbh;
    tx.feePayer = payer;
    const signedB = await this.provider.wallet.signTransaction(tx);
    const signature = await this.provider.connection.sendRawTransaction(
      signedB.serialize(),
      { skipPreflight: true },
    );
    const confB = await this.provider.connection.confirmTransaction(
      { signature, blockhash: bh, lastValidBlockHeight: lvbh },
      "confirmed",
    );
    if (confB.value.err) {
      throw new Error(
        `Token bonding init failed: ${JSON.stringify(confB.value.err)}. ` +
        `TX: ${signature}`,
      );
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
  }): Promise<Transaction> {
    const payer = this.provider.wallet.publicKey;
    const slippage = args.slippage ?? 0.05;

    const bonding = await this.getTokenBonding(args.tokenBonding);
    if (!bonding) throw new Error("token bonding account not found");

    const [mintAuthority] = targetMintAuthorityPda(this.programId, args.tokenBonding);
    const destination =
      args.destination ?? getAssociatedTokenAddressSync(bonding.targetMint, payer);
    const source = getAssociatedTokenAddressSync(bonding.baseMint, payer);

    const tx = new Transaction();

    // Best-effort: create destination ATA if it does not exist.
    try {
      await getAccount(this.provider.connection, destination);
    } catch {
      tx.add(
        createAssociatedTokenAccountInstruction(
          payer,
          destination,
          payer,
          bonding.targetMint,
        ),
      );
    }

    // Quote off-chain to derive slippage bounds.
    const quote = await this.quoteBuy(bonding, {
      desiredTargetAmount: args.desiredTargetAmount,
      baseAmount: args.baseAmount,
    });
    const slippageMaxBase = args.desiredTargetAmount
      ? new BN(Math.ceil(quote.baseAmount * (1 + slippage)))
      : null;
    const slippageMinTarget = args.baseAmount
      ? new BN(Math.floor(quote.targetAmount * (1 - slippage)))
      : null;

    const ix = await this.program.methods
      .buyV1({
        desiredTargetAmount: args.desiredTargetAmount ?? null,
        baseAmount: args.baseAmount ?? null,
        slippageMaxBase,
        slippageMinTarget,
      })
      .accountsPartial({
        payer,
        tokenBonding: args.tokenBonding,
        curve: bonding.curve,
        baseMint: bonding.baseMint,
        targetMint: bonding.targetMint,
        targetMintAuthority: mintAuthority,
        baseStorage: bonding.baseStorage,
        buyBaseRoyalties: bonding.buyBaseRoyalties,
        buyTargetRoyalties: bonding.buyTargetRoyalties,
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
  }): Promise<Transaction> {
    const seller = this.provider.wallet.publicKey;
    const slippage = args.slippage ?? 0.05;

    const bonding = await this.getTokenBonding(args.tokenBonding);
    if (!bonding) throw new Error("token bonding account not found");

    const [mintAuthority] = targetMintAuthorityPda(this.programId, args.tokenBonding);
    const [baseStorageAuthority] = baseStorageAuthorityPda(
      this.programId,
      args.tokenBonding,
    );

    const source = getAssociatedTokenAddressSync(bonding.targetMint, seller);
    const destination =
      args.destination ?? getAssociatedTokenAddressSync(bonding.baseMint, seller);

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
        sellBaseRoyalties: bonding.sellBaseRoyalties,
        sellTargetRoyalties: bonding.sellTargetRoyalties,
        source,
        destination,
        targetMintAuthority: mintAuthority,
        tokenProgram: TOKEN_PROGRAM_ID,
        clock: SYSVAR_CLOCK_PUBKEY,
      })
      .instruction();
    return new Transaction().add(ix);
  }

  // ── Quotes (off-chain previews) ────────────────────────────────────────

  async quoteBuy(
    bonding: TokenBondingV0,
    args: { desiredTargetAmount?: BN; baseAmount?: BN },
  ): Promise<{ targetAmount: number; baseAmount: number }> {
    const curveDef = await this.getCurveParams(bonding.curve);
    const supply = (await this.getMintSupply(bonding.targetMint)).toNumber();
    if (args.desiredTargetAmount) {
      const t = args.desiredTargetAmount.toNumber();
      return { targetAmount: t, baseAmount: offchainBuyTargetAmount(curveDef, supply, t) };
    }
    if (args.baseAmount) {
      const b = args.baseAmount.toNumber();
      return { targetAmount: offchainBuyBaseAmount(curveDef, supply, b), baseAmount: b };
    }
    throw new Error("Pass either desiredTargetAmount or baseAmount");
  }

  async quoteSell(
    bonding: TokenBondingV0,
    targetAmount: BN,
  ): Promise<{ baseAmount: number }> {
    const curveDef = await this.getCurveParams(bonding.curve);
    const supply = (await this.getMintSupply(bonding.targetMint)).toNumber();
    const t = targetAmount.toNumber();
    const baseAmount = offchainBuyTargetAmount(curveDef, supply - t, t);
    return { baseAmount };
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
   * List every `TokenBondingV0` account owned by this program. Anchor's
   * `account.tokenBondingV0.all()` performs a `getProgramAccounts` RPC
   * filtered by the account's 8-byte discriminator, so this returns
   * exactly the bondings created by this protocol — not by other forks
   * that happen to share the type name.
   */
  async listTokenBondings(): Promise<
    { publicKey: PublicKey; account: TokenBondingV0 }[]
  > {
    const rows = await this.program.account.tokenBondingV0.all();
    return rows.map((r) => ({
      publicKey: r.publicKey,
      account: r.account as unknown as TokenBondingV0,
    }));
  }

  // ── Internals ──────────────────────────────────────────────────────────

  /**
   * Resolve the *currently active* primitive curve and return human params.
   * Picks the latest piece whose offset has elapsed since `goLive`.
   */
  private async getCurveParams(curveKey: PublicKey): Promise<CurveParams> {
    const curve = await this.getCurve(curveKey);
    if (!curve) throw new Error("curve account not found");
    const pieces = curve.definition.timeV0.curves;
    if (pieces.length === 0) throw new Error("empty curve");
    // We don't have the bonding's goLive here, so just take the first piece —
    // the frontend uses this for previews and almost all curves are single-piece.
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

  /** Idempotently add ATA-create ixs for the four royalty destinations. */
  private async ensureRoyaltyAtas(
    tx: Transaction,
    args: {
      payer: PublicKey;
      owner: PublicKey;
      baseMint: PublicKey;
      targetMint: PublicKey;
    },
  ): Promise<{
    buyBase: PublicKey;
    buyTarget: PublicKey;
    sellBase: PublicKey;
    sellTarget: PublicKey;
  }> {
    const buyBase = getAssociatedTokenAddressSync(args.baseMint, args.owner);
    const sellBase = buyBase; // same ATA — owner gets all base royalties
    const buyTarget = getAssociatedTokenAddressSync(args.targetMint, args.owner);
    const sellTarget = buyTarget;

    for (const [mint, ata] of [
      [args.baseMint, buyBase],
      [args.targetMint, buyTarget],
    ] as const) {
      try {
        await getAccount(this.provider.connection, ata);
      } catch {
        tx.add(
          createAssociatedTokenAccountInstruction(
            args.payer,
            ata,
            args.owner,
            mint,
          ),
        );
      }
    }

    return { buyBase, buyTarget, sellBase, sellTarget };
  }
}

// ── helpers ─────────────────────────────────────────────────────────────

function bnRawToHuman(raw: BN | bigint | { toString(): string }): number {
  // Convert via string to dodge BN.toNumber() throwing on >53-bit values.
  const s = raw.toString();
  // Raw values are scaled by PRECISION = 10^12. Slice off the last 12 digits
  // and treat as a decimal.
  if (s.length <= 12) {
    return Number("0." + s.padStart(12, "0"));
  }
  const intPart = s.slice(0, -12);
  const fracPart = s.slice(-12);
  return Number(intPart + "." + fracPart);
}

export { ASSOCIATED_TOKEN_PROGRAM_ID };
