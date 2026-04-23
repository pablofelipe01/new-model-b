"use client";

import {
  scaleCurveOnChainToHuman,
  tokenBondingPda,
  type CurveParams,
} from "@new-model-b/sdk";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useMemo, useState } from "react";

import { BondingCurveChart } from "@/components/BondingCurveChart";
import { SwapPanel } from "@/components/SwapPanel";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useSdk } from "@/components/providers/SdkProvider";
import { useBondedPrice } from "@/hooks/useBondedPrice";
import { useTokenBonding } from "@/hooks/useTokenBonding";
import { fetchTokenMetadata } from "@/hooks/useTokenBondings";
import { TOKEN_BONDING_PROGRAM_ID } from "@/lib/constants";
import { formatNumber, shortenAddress } from "@/lib/utils";

export default function TokenPage({ params }: { params: { mint: string } }) {
  const mintPk = useMemo(() => safePk(params.mint), [params.mint]);
  const [bondingPk, setBondingPk] = useState<PublicKey | null>(null);
  const { t, lang } = useLanguage();

  useEffect(() => {
    if (!mintPk) return;
    const [pda] = tokenBondingPda(TOKEN_BONDING_PROGRAM_ID, mintPk, 0);
    setBondingPk(pda);
  }, [mintPk]);

  const { tokenBonding, loading } = useTokenBonding(bondingPk ?? undefined);
  const { price } = useBondedPrice(bondingPk ?? undefined);
  const { sdk } = useSdk();

  const [curveParams, setCurveParams] = useState<CurveParams | null>(null);
  const [supplyRaw, setSupplyRaw] = useState<number>(0);
  const [targetDecimals, setTargetDecimals] = useState<number>(9);
  const [baseDecimals, setBaseDecimals] = useState<number>(9);
  const [tokenName, setTokenName] = useState<string | null>(null);
  const [tokenSymbol, setTokenSymbol] = useState<string | null>(null);
  const [tokenImage, setTokenImage] = useState<string | null>(null);

  useEffect(() => {
    if (!sdk || !tokenBonding) return;
    let cancelled = false;
    (async () => {
      const [curve, supplyInfo, targetMintInfo, baseMintInfo] = await Promise.all([
        sdk.getCurve(tokenBonding.curve),
        sdk.provider.connection.getTokenSupply(tokenBonding.targetMint),
        sdk.provider.connection.getTokenSupply(tokenBonding.targetMint),
        sdk.provider.connection.getTokenSupply(tokenBonding.baseMint),
      ]);
      if (cancelled || !curve) return;
      const piece = curve.definition.timeV0.curves[0]?.curve;
      if (!piece || !("exponentialCurveV0" in piece)) return;
      const e = piece.exponentialCurveV0;
      const onChainCurve: CurveParams = {
        c: rawToHumanNumber(e.c.toString()),
        b: rawToHumanNumber(e.b.toString()),
        pow: e.pow,
        frac: e.frac,
      };
      const tDec = targetMintInfo.value.decimals;
      const bDec = baseMintInfo.value.decimals;
      setCurveParams(scaleCurveOnChainToHuman(onChainCurve, bDec, tDec));
      setSupplyRaw(Number(supplyInfo.value.amount));
      setTargetDecimals(tDec);
      setBaseDecimals(bDec);
    })();
    return () => { cancelled = true; };
  }, [sdk, tokenBonding]);

  // Fetch Metaplex metadata (name, symbol, image)
  useEffect(() => {
    if (!sdk || !tokenBonding) return;
    let cancelled = false;
    (async () => {
      try {
        const meta = await fetchTokenMetadata(
          sdk.provider.connection,
          tokenBonding.targetMint,
        );
        if (cancelled || !meta) return;
        setTokenName(meta.name);
        setTokenSymbol(meta.symbol);
        setTokenImage(meta.image ?? null);
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [sdk, tokenBonding]);

  if (!mintPk) return <Empty text="Invalid mint" />;
  if (loading) return <Empty text={lang === "es" ? "Cargando…" : "Loading…"} />;
  if (!tokenBonding || !bondingPk) {
    return <Empty text={lang === "es" ? "No se encontró este token" : "No bonding found for this mint"} />;
  }

  const displayName = tokenName ?? shortenAddress(params.mint, 6);
  const displaySymbol = (tokenSymbol ?? params.mint.slice(0, 4)).toUpperCase();
  const supplyHuman = supplyRaw / Math.pow(10, targetDecimals);
  const reserveHuman =
    tokenBonding.reserveBalanceFromBonding.toNumber() / Math.pow(10, baseDecimals);

  return (
    <div className="token-screen">
      <Link href="/" className="back-link">
        ← {t.explore}
      </Link>

      {/* Header */}
      <div className="token-header">
        {tokenImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tokenImage} alt={displayName} className="th-portrait" style={{ objectFit: "cover" }} />
        ) : (
          <div className="th-portrait" />
        )}
        <div>
          <div className="label">{displaySymbol}</div>
          <h1 className="th-name">{displayName}</h1>
          <div className="th-handle">{shortenAddress(params.mint)}</div>
        </div>
      </div>

      {/* Price strip */}
      <div className="price-strip">
        <div className="ps-item">
          <div className="label">{t.price}</div>
          <div className="numeric-l">
            ${price !== undefined ? formatNumber(price, 4) : "—"}
          </div>
        </div>
        <div className="ps-item">
          <div className="label">{t.supply}</div>
          <div className="numeric-m">{formatNumber(supplyHuman, 2)}</div>
        </div>
        <div className="ps-item">
          <div className="label">{t.reservePool}</div>
          <div className="numeric-m">${formatNumber(reserveHuman, 2)}</div>
        </div>
      </div>

      {/* Layout: chart + trade panel */}
      <div className="token-layout">
        <div className="token-main">
          {/* Curve chart */}
          <div className="curve-card">
            <div className="curve-head">
              <div>
                <div className="label">{t.curveCaptionShort.split(".")[0]}</div>
              </div>
            </div>
            <div style={{ height: 280 }}>
              {curveParams && (
                <BondingCurveChart
                  curve={curveParams}
                  currentSupply={supplyHuman}
                  baseMintSymbol="USDC"
                />
              )}
            </div>
          </div>

          {/* Trust card */}
          <div className="trust-card">
            <div className="trust-row">
              <div className="trust-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2L12.5 7.5L18 8.5L14 12.5L15 18L10 15.5L5 18L6 12.5L2 8.5L7.5 7.5L10 2Z" fill="var(--state-success)" />
                </svg>
              </div>
              <div className="trust-copy">
                <div className="trust-line">{t.reserveNote}</div>
                <a
                  href={`https://explorer.solana.com/address/${tokenBonding.baseStorage.toBase58()}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link"
                >
                  {t.seeOnChain} →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Trade panel */}
        <div>
          {curveParams && (
            <SwapPanel
              tokenBonding={bondingPk.toBase58()}
              curve={curveParams}
              currentSupply={supplyHuman}
              baseSymbol="USDC"
              targetSymbol={displaySymbol}
              targetDecimals={targetDecimals}
              baseDecimals={baseDecimals}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="token-screen" style={{ textAlign: "center", paddingTop: 120 }}>
      <p className="muted">{text}</p>
    </div>
  );
}

function safePk(s: string): PublicKey | null {
  try {
    return new PublicKey(s);
  } catch {
    return null;
  }
}

function rawToHumanNumber(s: string): number {
  if (s.length <= 12) return Number("0." + s.padStart(12, "0"));
  return Number(s.slice(0, -12) + "." + s.slice(-12));
}
