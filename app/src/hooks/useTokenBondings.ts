"use client";

import {
  currentPrice,
  scaleCurveOnChainToHuman,
  type CurveParams,
  type TokenBondingV0,
} from "@new-model-b/sdk";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";

import { useSdk } from "@/components/providers/SdkProvider";

/** Metaplex Token Metadata program ID. */
const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);

/**
 * Single row in the explore grid: a bonding plus enough fetched data to
 * render a card without each card having to issue its own RPC calls.
 */
export interface BondingRow {
  publicKey: PublicKey;
  account: TokenBondingV0;
  /** Spot price computed off-chain from the live curve and supply (human units). */
  price: number | undefined;
  /** Raw on-chain supply (smallest units of the target mint). */
  supplyRaw: number;
  targetDecimals: number;
  baseDecimals: number;
  /** On-chain Metaplex metadata (if present). */
  tokenName: string | undefined;
  tokenSymbol: string | undefined;
  tokenImage: string | undefined;
}

interface State {
  rows: BondingRow[];
  loading: boolean;
  error: Error | undefined;
}

/**
 * Fetches every TokenBondingV0 the program owns and enriches each one
 * with its spot price + supply. Re-runs on demand via the returned
 * `refresh` function. Designed for the explore page; for a single
 * detail view use `useTokenBonding(key)` instead.
 */
export function useTokenBondings(): State & { refresh: () => void } {
  const { sdk } = useSdk();
  const [state, setState] = useState<State>({
    rows: [],
    loading: false,
    error: undefined,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!sdk) return;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: undefined }));

    (async () => {
      try {
        const bondings = await sdk.listTokenBondings();
        // Cache curve fetches by curve pubkey to avoid hitting the same
        // CurveV0 account once per bonding when several share a curve.
        const curveCache = new Map<string, CurveParams | null>();

        const enriched = await Promise.all(
          bondings.map(async ({ publicKey, account }) => {
            // Pull supply (raw) and the decimals of both mints in
            // parallel so we can convert the on-chain curve back into
            // human units before computing a price.
            const [supplyInfo, targetMintInfo, baseMintInfo] = await Promise.all([
              sdk.provider.connection.getTokenSupply(account.targetMint).catch(() => null),
              sdk.provider.connection.getTokenSupply(account.targetMint).catch(() => null),
              sdk.provider.connection.getTokenSupply(account.baseMint).catch(() => null),
            ]);
            const targetDecimals = targetMintInfo?.value.decimals ?? 9;
            const baseDecimals = baseMintInfo?.value.decimals ?? 9;
            const supplyRaw = supplyInfo
              ? Number(supplyInfo.value.amount)
              : account.supplyFromBonding.toNumber();

            // Cache key includes decimals because the same curve account
            // can be referenced by bondings with different mint decimals,
            // and the human-scaled params differ accordingly.
            const cacheKey = `${account.curve.toBase58()}|${baseDecimals}|${targetDecimals}`;
            let curveParams = curveCache.get(cacheKey) ?? null;
            if (!curveCache.has(cacheKey)) {
              const onChain = await fetchCurveParams(sdk, account.curve);
              curveParams = onChain
                ? scaleCurveOnChainToHuman(onChain, baseDecimals, targetDecimals)
                : null;
              curveCache.set(cacheKey, curveParams);
            }

            const supplyHuman = supplyRaw / Math.pow(10, targetDecimals);
            const price = curveParams
              ? currentPrice(curveParams, supplyHuman)
              : undefined;

            // Read Metaplex metadata for the target mint (name + symbol + image).
            const meta = await fetchTokenMetadata(
              sdk.provider.connection,
              account.targetMint,
            );

            return {
              publicKey,
              account,
              price,
              supplyRaw,
              targetDecimals,
              baseDecimals,
              tokenName: meta?.name,
              tokenSymbol: meta?.symbol,
              tokenImage: meta?.image,
            } satisfies BondingRow;
          }),
        );

        if (cancelled) return;
        setState({ rows: enriched, loading: false, error: undefined });
      } catch (err) {
        if (cancelled) return;
        setState({ rows: [], loading: false, error: err as Error });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sdk, tick]);

  return { ...state, refresh: () => setTick((t) => t + 1) };
}

/**
 * Pull a CurveV0 from chain and convert its first piece into the
 * human-units `CurveParams` shape used by the off-chain math. Returns
 * `null` if the curve is empty or uses an unsupported variant.
 */
async function fetchCurveParams(
  sdk: NonNullable<ReturnType<typeof useSdk>["sdk"]>,
  key: PublicKey,
): Promise<CurveParams | null> {
  const curve = await sdk.getCurve(key);
  if (!curve) return null;
  const piece = curve.definition.timeV0.curves[0]?.curve;
  if (!piece || !("exponentialCurveV0" in piece)) return null;
  const e = piece.exponentialCurveV0;
  return {
    c: rawToHumanNumber(e.c.toString()),
    b: rawToHumanNumber(e.b.toString()),
    pow: e.pow,
    frac: e.frac,
  };
}

function rawToHumanNumber(s: string): number {
  if (s.length <= 12) return Number("0." + s.padStart(12, "0"));
  return Number(s.slice(0, -12) + "." + s.slice(-12));
}

/**
 * Read the Metaplex Token Metadata account for a given mint. Returns
 * `{ name, symbol }` or null if the account doesn't exist (pre-metadata
 * tokens). Metadata is stored in a PDA at
 * `["metadata", TOKEN_METADATA_PROGRAM_ID, mint]` and serialised with a
 * simple Borsh layout. We parse manually to avoid pulling in the full
 * `@metaplex-foundation/mpl-token-metadata` client in the frontend bundle.
 */
async function fetchTokenMetadata(
  connection: import("@solana/web3.js").Connection,
  mint: PublicKey,
): Promise<{ name: string; symbol: string; image: string | undefined } | null> {
  try {
    const [pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    );
    const info = await connection.getAccountInfo(pda);
    if (!info || !info.data || info.data.length < 100) return null;
    // The metadata account layout (v1):
    //   0     : 1 byte  — key (enum discriminator)
    //   1     : 32 bytes — update authority
    //   33    : 32 bytes — mint
    //   65    : 4 bytes  — name string length (little-endian u32)
    //   69    : N bytes  — name (padded with \0 to 32 bytes)
    //   69+N  : 4 bytes  — symbol length
    //   69+N+4: M bytes  — symbol
    //   ...   : 4 bytes  — uri length
    //   ...   : K bytes  — uri
    const data = info.data;
    const nameLen = data.readUInt32LE(65);
    const name = data.subarray(69, 69 + nameLen).toString("utf8").replace(/\0+$/, "");
    const symOffset = 69 + nameLen;
    const symLen = data.readUInt32LE(symOffset);
    const symbol = data
      .subarray(symOffset + 4, symOffset + 4 + symLen)
      .toString("utf8")
      .replace(/\0+$/, "");
    const uriOffset = symOffset + 4 + symLen;
    const uriLen = data.readUInt32LE(uriOffset);
    const uri = data
      .subarray(uriOffset + 4, uriOffset + 4 + uriLen)
      .toString("utf8")
      .replace(/\0+$/, "");

    // Extract the image URL from the metadata URI. We support:
    // 1. Our short route: /api/m?i=<encoded_url>
    // 2. Our old route: /api/metadata?image=<encoded_url>
    // 3. Standard Metaplex JSON URI (fetch + parse)
    // 4. Raw image URL (used as fallback when URI was too long)
    let image: string | undefined;
    if (uri) {
      try {
        const url = new URL(uri);
        // Our routes encode the image in query params
        image =
          url.searchParams.get("i") ??
          url.searchParams.get("image") ??
          undefined;
      } catch {
        // Not a parseable URL — might be a raw image path
      }
      // If no query-param image found, try fetching JSON
      if (!image && uri.startsWith("http")) {
        try {
          const resp = await fetch(uri);
          const contentType = resp.headers.get("content-type") ?? "";
          if (contentType.includes("json")) {
            const json = await resp.json();
            image = json.image ?? undefined;
          } else if (contentType.includes("image")) {
            // The URI itself is a direct image
            image = uri;
          }
        } catch {
          // ignore
        }
      }
    }

    return { name, symbol, image };
  } catch {
    return null;
  }
}
