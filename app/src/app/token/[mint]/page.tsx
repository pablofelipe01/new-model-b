"use client";

import { tokenBondingPda, type CurveParams } from "@new-model-b/sdk";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useMemo, useState } from "react";

import { BondingCurveChart } from "@/components/BondingCurveChart";
import { SwapPanel } from "@/components/SwapPanel";
import { useSdk } from "@/components/providers/SdkProvider";
import { useBondedPrice } from "@/hooks/useBondedPrice";
import { useTokenBonding } from "@/hooks/useTokenBonding";
import { TOKEN_BONDING_PROGRAM_ID } from "@/lib/constants";
import { formatNumber, shortenAddress } from "@/lib/utils";

/**
 * Token detail page. Resolves the bonding from the mint in the URL,
 * fetches the curve, and renders chart + swap panel side-by-side.
 */
export default function TokenPage({ params }: { params: { mint: string } }) {
  const mintPk = useMemo(() => safePk(params.mint), [params.mint]);
  const [bondingPk, setBondingPk] = useState<PublicKey | null>(null);

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

  useEffect(() => {
    if (!sdk || !tokenBonding) return;
    let cancelled = false;
    (async () => {
      const curve = await sdk.getCurve(tokenBonding.curve);
      if (cancelled || !curve) return;
      const piece = curve.definition.timeV0.curves[0]?.curve;
      if (!piece || !("exponentialCurveV0" in piece)) return;
      const e = piece.exponentialCurveV0;
      setCurveParams({
        c: rawToHumanNumber(e.c.toString()),
        b: rawToHumanNumber(e.b.toString()),
        pow: e.pow,
        frac: e.frac,
      });
      // Pull supply + decimals for both mints in parallel.
      const [supplyInfo, targetMintInfo, baseMintInfo] = await Promise.all([
        sdk.provider.connection.getTokenSupply(tokenBonding.targetMint),
        sdk.provider.connection.getTokenSupply(tokenBonding.targetMint),
        sdk.provider.connection.getTokenSupply(tokenBonding.baseMint),
      ]);
      if (cancelled) return;
      setSupplyRaw(Number(supplyInfo.value.amount));
      setTargetDecimals(targetMintInfo.value.decimals);
      setBaseDecimals(baseMintInfo.value.decimals);
    })();
    return () => {
      cancelled = true;
    };
  }, [sdk, tokenBonding]);

  if (!mintPk) return <Empty title="Invalid mint" />;
  if (loading) return <Empty title="Loading…" />;
  if (!tokenBonding || !bondingPk) {
    return <Empty title="No bonding found for this mint" />;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{shortenAddress(params.mint, 6)}</h1>
        <p className="text-sm text-zinc-500">
          Bonding {shortenAddress(bondingPk.toBase58(), 6)} ·
          {price !== undefined ? ` price ${formatNumber(price, 8)}` : " price —"}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="h-72">
            {curveParams && (
              <BondingCurveChart
                curve={curveParams}
                currentSupply={supplyRaw}
                baseMintSymbol="base"
              />
            )}
          </div>
        </div>

        <div>
          {curveParams && (
            <SwapPanel
              tokenBonding={bondingPk.toBase58()}
              curve={curveParams}
              currentSupply={supplyRaw}
              baseSymbol="base"
              targetSymbol="token"
              targetDecimals={targetDecimals}
              baseDecimals={baseDecimals}
            />
          )}
        </div>
      </div>

      <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat
          label="Price (raw)"
          value={price !== undefined ? formatNumber(price, 0) : "—"}
        />
        <Stat label="Supply (raw)" value={formatNumber(supplyRaw, 0)} />
        <Stat
          label="Reserve (raw)"
          value={formatNumber(
            tokenBonding.reserveBalanceFromBonding.toNumber(),
            0,
          )}
        />
        <Stat label="Index" value={tokenBonding.index.toString()} />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Empty({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center text-zinc-500">
      <p>{title}</p>
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
