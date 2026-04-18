"use client";

import {
  CURVES,
  LAUNCHER_FEE_BPS_MAX,
  PLATFORM_FEE_BPS,
  USDC_DECIMALS,
  USDC_MINT,
  scaleCurveHumanToOnChain,
  type CurveParams,
  type PiecewiseCurve,
} from "@new-model-b/sdk";
import BN from "bn.js";
import { Transaction } from "@solana/web3.js";
import { useMemo, useRef, useState } from "react";

import { useSdk } from "@/components/providers/SdkProvider";
import { FEE_PAYER } from "@/lib/sponsoredSend";

import { BondingCurveChart } from "./BondingCurveChart";

type Step = 1 | 2 | 3;

const PRESETS: {
  label: string;
  key: keyof typeof CURVES;
  description: string;
}[] = [
  {
    label: "Square root",
    key: "sqrt",
    description:
      "Price grows slowly at first, then faster. Most popular for community tokens — early buyers get a better deal.",
  },
  {
    label: "Linear",
    key: "linear",
    description:
      "Price grows at a constant rate. Each new token costs the same amount more than the last one.",
  },
  {
    label: "Quadratic",
    key: "quadratic",
    description:
      "Price grows very fast. Heavily rewards the earliest buyers. Best for scarce, high-demand tokens.",
  },
  {
    label: "Fixed price",
    key: "fixed",
    description:
      "Every token costs the same, regardless of how many exist. No bonding curve — just a fixed rate.",
  },
];

/**
 * Three-step launch flow. The form keeps all state in React (no zod / RHF
 * to avoid dependency churn) and on submit calls
 * `sdk.createCurve` followed by `sdk.initTokenBonding` in two transactions.
 */
export function LaunchForm() {
  const { sdk, ready } = useSdk();
  const [step, setStep] = useState<Step>(1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [decimals, setDecimals] = useState(9);

  // Step 2
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [startingPrice, setStartingPrice] = useState(0);
  const [growthRate, setGrowthRate] = useState(1);
  // Launcher fee in PERCENT (UI). The on-chain field is basis points.
  const [launcherFeePct, setLauncherFeePct] = useState(0);

  // Build the curve params from the user-friendly inputs. Exponent always
  // comes from the selected preset — exposing pow/frac directly in the UI
  // lets users shoot themselves in the foot with exotic curves that the
  // presets already cover.
  const curveParams = useMemo<CurveParams>(() => {
    const base = CURVES[selectedPreset.key];
    return {
      c: selectedPreset.key === "fixed" ? 0 : growthRate,
      b: selectedPreset.key === "fixed" ? growthRate : startingPrice,
      pow: base.pow,
      frac: base.frac,
    };
  }, [selectedPreset, growthRate, startingPrice]);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ mint: string; bonding: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewMaxSupply = useMemo(() => 1_000, []);
  // Base mint is hardcoded to USDC by the program — no UI selection.
  const baseSymbol = "USDC";

  async function onLaunch() {
    if (!sdk || !ready) {
      setError("Connect a wallet first");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // 1. Create the curve account. Base is USDC (6 decimals), forced by
      //    the program. The user enters HUMAN coefficients (e.g. linear c=1
      //    means "1 USDC per 1 token at supply=1 token"); we scale to raw
      //    units before serializing.
      const onChainCurve = scaleCurveHumanToOnChain(
        curveParams,
        USDC_DECIMALS,
        decimals,
      );
      const definition: PiecewiseCurve = {
        timeV0: {
          curves: [
            {
              offset: new BN(0),
              curve: {
                exponentialCurveV0: {
                  c: humanToRawBn(onChainCurve.c),
                  b: humanToRawBn(onChainCurve.b),
                  pow: onChainCurve.pow,
                  frac: onChainCurve.frac,
                },
              },
              buyTransitionFees: null,
              sellTransitionFees: null,
            },
          ],
        },
      };
      // The SDK now sends + confirms the transactions itself, so we just
      // await the high-level helpers and read the resulting addresses.
      const { curveKey } = await sdk.createCurve({ definition });

      // Build a metadata URI. Wallets fetch this URI and display the
      // returned `image` field as the token logo.
      //
      // We normally wrap the image URL in our own `/api/m?i=` endpoint
      // which responds with `{image: ...}` — that's the shape Metaplex
      // expects. But wallets run on remote servers and cannot reach
      // `http://localhost`, so when the dev server is on localhost we
      // write the raw image URL on-chain instead. Most wallets accept
      // a bare image URL as a fallback.
      let tokenUri = "";
      if (imageUrl) {
        const isLocalhost =
          typeof window !== "undefined" &&
          /^(localhost|127\.0\.0\.1)(:|$)/.test(window.location.host);
        if (isLocalhost) {
          tokenUri = imageUrl;
        } else {
          const short = `${window.location.origin}/api/m?i=${encodeURIComponent(imageUrl)}`;
          // Metaplex metadata URI field max is ~200 chars. If the
          // wrapped URI fits, use it (wallets get proper JSON).
          // Otherwise fall back to the raw image URL.
          tokenUri = short.length <= 200 ? short : imageUrl;
        }
      }

      // When gas sponsorship is active, route through the relay so the
      // user doesn't need SOL for rent or gas.
      console.log("[LaunchForm] FEE_PAYER:", FEE_PAYER?.toBase58() ?? "null");
      const sendFn = FEE_PAYER
        ? async (serializedTx: Buffer): Promise<string> => {
            const res = await fetch("/api/sponsor-tx", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                transaction: serializedTx.toString("base64"),
              }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Sponsor relay failed");
            return data.signature;
          }
        : undefined;

      const { tokenBondingKey, targetMint } = await sdk.initTokenBonding({
        curve: curveKey,
        decimals,
        goLiveDate: new Date(),
        launcherFeeBasisPoints: Math.round(launcherFeePct * 100),
        tokenName: name,
        tokenSymbol: symbol,
        tokenUri,
        rentPayer: FEE_PAYER ?? undefined,
        sendFn,
      });

      setResult({ mint: targetMint.toBase58(), bonding: tokenBondingKey.toBase58() });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Stepper step={step} />

      {step === 1 && (
        <Card title="1. Token metadata">
          <Field label="Name">
            <input
              title="Token name"
              aria-label="Token name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="My Token"
            />
          </Field>
          <Field label="Symbol">
            <input
              title="Token symbol"
              aria-label="Token symbol"
              value={symbol}
              maxLength={10}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="input"
              placeholder="MYT"
            />
          </Field>
          <Field label="Description">
            <textarea
              title="Token description"
              aria-label="Token description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-[80px]"
              placeholder="What is this token for?"
            />
          </Field>
          <Field label="Token logo">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  title="Upload token logo"
                  aria-label="Upload token logo"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    try {
                      const fd = new FormData();
                      fd.append("file", file);
                      const res = await fetch("/api/upload", {
                        method: "POST",
                        body: fd,
                      });
                      const data = await res.json();
                      if (data.url) setImageUrl(data.url);
                      else setError(data.error ?? "Upload failed");
                    } catch (err) {
                      setError((err as Error).message);
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 p-4 transition hover:border-brand-500 dark:border-zinc-600"
                >
                  {uploading ? (
                    <span className="text-sm text-zinc-500">Uploading...</span>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-brand-500">
                        Click to upload
                      </span>
                      <span className="mt-1 text-xs text-zinc-500">
                        PNG, JPG, SVG or GIF
                      </span>
                    </>
                  )}
                </button>
                <p className="mt-1 text-xs text-zinc-500">
                  Or paste a URL:
                </p>
                <input
                  title="Token logo URL"
                  aria-label="Token logo URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="input mt-1"
                  placeholder="https://example.com/logo.png"
                />
              </div>
              {imageUrl && (
                <div className="flex flex-col items-center gap-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Token logo preview"
                    className="h-16 w-16 rounded-full object-cover border-2 border-brand-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <span className="text-xs text-zinc-500">Preview</span>
                </div>
              )}
            </div>
          </Field>
          <Field label="Decimals">
            <input
              title="Token decimals"
              aria-label="Token decimals"
              type="number"
              min={0}
              max={18}
              value={decimals}
              onChange={(e) => setDecimals(Number(e.target.value))}
              className="input"
              placeholder="9"
            />
          </Field>
          <NavButtons onNext={() => setStep(2)} disableNext={!name || !symbol} />
        </Card>
      )}

      {step === 2 && (
        <Card title="2. Pricing model">
          <p className="text-xs text-zinc-500">
            Buyers pay with USDC. Reserves are held in USDC and locked by the
            program — only sellers can withdraw them by burning their tokens.
          </p>

          <Field label="How should the price change?">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  aria-label={`Use ${p.label} pricing`}
                  onClick={() => setSelectedPreset(p)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                    selectedPreset.key === p.key
                      ? "border-brand-500 bg-brand-500/10 text-brand-400"
                      : "border-zinc-200 hover:border-brand-500 dark:border-zinc-700"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-500">{selectedPreset.description}</p>
          </Field>

          {selectedPreset.key !== "fixed" ? (
            <>
              <Field label={`Starting price (${baseSymbol} per token when supply is 0)`}>
                <input
                  title="Starting price"
                  aria-label="Starting price"
                  type="number"
                  step="0.001"
                  min={0}
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(Number(e.target.value))}
                  className="input"
                  placeholder="0"
                />
              </Field>
              <Field label="Growth rate (how fast the price rises with demand)">
                <input
                  title="Growth rate"
                  aria-label="Growth rate"
                  type="number"
                  step="0.1"
                  min={0}
                  value={growthRate}
                  onChange={(e) => setGrowthRate(Number(e.target.value))}
                  className="input"
                  placeholder="1"
                />
                <p className="mt-1 text-xs text-zinc-500">
                  Higher = price increases faster as people buy. Try 0.1 for gentle, 1 for moderate, 10 for aggressive.
                </p>
              </Field>
            </>
          ) : (
            <Field label={`Fixed price (${baseSymbol} per token)`}>
              <input
                title="Fixed price per token"
                aria-label="Fixed price per token"
                type="number"
                step="0.001"
                min={0}
                value={growthRate}
                onChange={(e) => setGrowthRate(Number(e.target.value))}
                className="input"
                placeholder="1"
              />
            </Field>
          )}

          <Field label="Price preview">
            <div className="h-48 rounded-xl border border-zinc-200 p-2 dark:border-zinc-800">
              <BondingCurveChart
                curve={curveParams}
                currentSupply={0}
                maxSupply={previewMaxSupply}
                baseMintSymbol={baseSymbol}
              />
            </div>
          </Field>

          <Field label={`Your fee % (0 to ${LAUNCHER_FEE_BPS_MAX / 100}, charged on every buy AND sell)`}>
            <input
              title="Launcher fee percentage"
              aria-label="Launcher fee percentage"
              type="number"
              min={0}
              max={LAUNCHER_FEE_BPS_MAX / 100}
              step="0.1"
              value={launcherFeePct}
              onChange={(e) => setLauncherFeePct(Number(e.target.value))}
              className="input"
              placeholder="0"
            />
            <p className="mt-1 text-xs text-zinc-500">
              You earn this on every trade. Platform fee is fixed at{" "}
              {PLATFORM_FEE_BPS / 100}%, so total fee per trade ={" "}
              {(launcherFeePct + PLATFORM_FEE_BPS / 100).toFixed(2)}%.
            </p>
          </Field>

          <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} />
        </Card>
      )}

      {step === 3 && (
        <Card title="3. Confirm and launch">
          <ul className="mb-4 space-y-1 text-sm">
            <li><strong>Name:</strong> {name} ({symbol})</li>
            <li><strong>Decimals:</strong> {decimals}</li>
            <li><strong>Pricing:</strong> {selectedPreset.label}</li>
            <li><strong>Starting price:</strong> {selectedPreset.key === "fixed" ? growthRate : startingPrice} {baseSymbol}</li>
            {selectedPreset.key !== "fixed" && (
              <li><strong>Growth rate:</strong> {growthRate}</li>
            )}
            <li><strong>Buyers pay with:</strong> USDC</li>
            <li>
              <strong>Fee per trade:</strong> {launcherFeePct}% to you +{" "}
              {PLATFORM_FEE_BPS / 100}% platform
            </li>
            <li><strong>Launch fee:</strong> 25 USDC (one-time)</li>
            <li><strong>Go-live:</strong> immediately</li>
          </ul>

          <button
            type="button"
            aria-label="Launch token"
            onClick={onLaunch}
            disabled={submitting || !ready}
            className="w-full rounded-xl bg-brand-500 py-3 font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {submitting ? "Launching…" : ready ? "Launch token" : "Connect wallet first"}
          </button>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          {result && (
            <div className="mt-4 rounded-lg bg-emerald-100 p-3 text-sm dark:bg-emerald-950">
              <p className="font-medium text-emerald-700 dark:text-emerald-300">Launched!</p>
              <p className="mt-1 break-all">Mint: {result.mint}</p>
              <p className="break-all">Bonding: {result.bonding}</p>
            </div>
          )}
          <NavButtons onBack={() => setStep(2)} hideNext />
        </Card>
      )}

      <style jsx>{`
        :global(.input) {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid rgb(228 228 231);
          background: transparent;
          font-size: 0.875rem;
        }
        :global(.dark .input) {
          border-color: rgb(63 63 70);
        }
        :global(.input:focus) {
          outline: none;
          border-color: rgb(139 92 246);
        }
      `}</style>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  return (
    <ol className="mb-6 flex items-center gap-2 text-sm">
      {[1, 2, 3].map((i) => (
        <li
          key={i}
          className={`flex h-7 w-7 items-center justify-center rounded-full font-medium ${
            i <= step ? "bg-brand-500 text-white" : "bg-zinc-200 text-zinc-500"
          }`}
        >
          {i}
        </li>
      ))}
    </ol>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function NavButtons({
  onBack,
  onNext,
  disableNext,
  hideNext,
}: {
  onBack?: () => void;
  onNext?: () => void;
  disableNext?: boolean;
  hideNext?: boolean;
}) {
  return (
    <div className="mt-2 flex justify-between gap-2">
      {onBack ? (
        <button
          type="button"
          aria-label="Go back to previous step"
          onClick={onBack}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
        >
          Back
        </button>
      ) : (
        <span />
      )}
      {!hideNext && onNext && (
        <button
          type="button"
          aria-label="Continue to next step"
          onClick={onNext}
          disabled={disableNext}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          Next
        </button>
      )}
    </div>
  );
}

function humanToRawBn(n: number): BN {
  const fixed = n.toFixed(12);
  const [intPart, fracPart = ""] = fixed.split(".");
  const padded = (fracPart + "000000000000").slice(0, 12);
  return new BN(intPart + padded);
}
