"use client";

import { CURVES, type CurveParams, type PiecewiseCurve } from "@new-model-b/sdk";
import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import { useMemo, useState } from "react";

import { useSdk } from "@/components/providers/SdkProvider";
import { BASE_TOKENS, CLUSTER } from "@/lib/constants";

import { BondingCurveChart } from "./BondingCurveChart";

type Step = 1 | 2 | 3;

const PRESETS: { label: string; key: keyof typeof CURVES }[] = [
  { label: "Square root", key: "sqrt" },
  { label: "Linear", key: "linear" },
  { label: "Quadratic", key: "quadratic" },
  { label: "Fixed price", key: "fixed" },
];

/**
 * Three-step launch flow. The form keeps all state in React (no zod / RHF
 * to avoid dependency churn) and on submit calls
 * `sdk.createCurve` followed by `sdk.initTokenBonding` in two transactions.
 */
export function LaunchForm() {
  const { sdk, ready } = useSdk();
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [decimals, setDecimals] = useState(9);

  // Step 2
  const [curveParams, setCurveParams] = useState<CurveParams>(CURVES.sqrt);
  const [baseMint, setBaseMint] = useState(BASE_TOKENS[CLUSTER][0].mint);
  const [mintCap, setMintCap] = useState<string>("");
  // `<input type="datetime-local">` reads/writes its value in LOCAL time
  // (no timezone), so we have to format the default with the user's
  // local offset. Using `toISOString().slice(0,16)` gives a UTC string,
  // which the input then re-interprets as local — pushing the go-live
  // time hours into the future and tripping the on-chain `NotLiveYet`
  // error.
  const [goLive, setGoLive] = useState<string>(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
  });
  const [buyRoyalty, setBuyRoyalty] = useState(0);
  const [sellRoyalty, setSellRoyalty] = useState(0);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ mint: string; bonding: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewMaxSupply = useMemo(() => 1_000_000, []);

  async function onLaunch() {
    if (!sdk || !ready) {
      setError("Connect a wallet first");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // 1. Create the curve account.
      const definition: PiecewiseCurve = {
        timeV0: {
          curves: [
            {
              offset: new BN(0),
              curve: {
                exponentialCurveV0: {
                  c: humanToRawBn(curveParams.c),
                  b: humanToRawBn(curveParams.b),
                  pow: curveParams.pow,
                  frac: curveParams.frac,
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

      const { tokenBondingKey, targetMint } = await sdk.initTokenBonding({
        baseMint: new PublicKey(baseMint),
        curve: curveKey,
        decimals,
        mintCap: mintCap ? new BN(mintCap) : undefined,
        goLiveDate: new Date(goLive),
        buyBaseRoyaltyPercentage: Math.round(buyRoyalty * 100),
        sellBaseRoyaltyPercentage: Math.round(sellRoyalty * 100),
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
        <Card title="2. Bonding curve">
          <Field label="Base token">
            <select
              title="Base token"
              aria-label="Base token"
              value={baseMint}
              onChange={(e) => setBaseMint(e.target.value)}
              className="input"
            >
              {BASE_TOKENS[CLUSTER].map((t) => (
                <option key={t.mint} value={t.mint}>
                  {t.symbol}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Curve preset">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  aria-label={`Use ${p.label} preset`}
                  onClick={() => setCurveParams(CURVES[p.key])}
                  className="rounded-lg border border-zinc-200 px-3 py-1 text-sm hover:border-brand-500 dark:border-zinc-700"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="c (slope)">
              <input
                title="Coefficient c (slope)"
                aria-label="Coefficient c (slope)"
                type="number"
                step="0.01"
                value={curveParams.c}
                onChange={(e) => setCurveParams({ ...curveParams, c: Number(e.target.value) })}
                className="input"
                placeholder="1"
              />
            </Field>
            <Field label="b (floor)">
              <input
                title="Coefficient b (floor)"
                aria-label="Coefficient b (floor)"
                type="number"
                step="0.01"
                value={curveParams.b}
                onChange={(e) => setCurveParams({ ...curveParams, b: Number(e.target.value) })}
                className="input"
                placeholder="0"
              />
            </Field>
            <Field label="pow">
              <input
                title="Numerator of the rational exponent"
                aria-label="Numerator of the rational exponent"
                type="number"
                min={0}
                max={10}
                value={curveParams.pow}
                onChange={(e) => setCurveParams({ ...curveParams, pow: Number(e.target.value) })}
                className="input"
                placeholder="1"
              />
            </Field>
            <Field label="frac">
              <input
                title="Denominator of the rational exponent"
                aria-label="Denominator of the rational exponent"
                type="number"
                min={1}
                max={10}
                value={curveParams.frac}
                onChange={(e) => setCurveParams({ ...curveParams, frac: Number(e.target.value) })}
                className="input"
                placeholder="2"
              />
            </Field>
          </div>

          <Field label="Preview">
            <div className="h-48 rounded-xl border border-zinc-200 p-2 dark:border-zinc-800">
              <BondingCurveChart
                curve={curveParams}
                currentSupply={0}
                maxSupply={previewMaxSupply}
              />
            </div>
          </Field>

          <Field label="Mint cap (optional)">
            <input
              title="Optional maximum total supply"
              aria-label="Optional maximum total supply"
              value={mintCap}
              onChange={(e) => setMintCap(e.target.value)}
              className="input"
              placeholder="e.g. 1000000"
            />
          </Field>
          <Field label="Go-live date">
            <input
              title="Date the bonding starts accepting buys"
              aria-label="Go-live date"
              type="datetime-local"
              value={goLive}
              onChange={(e) => setGoLive(e.target.value)}
              className="input"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Buy royalty %">
              <input
                title="Buy royalty percentage"
                aria-label="Buy royalty percentage"
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={buyRoyalty}
                onChange={(e) => setBuyRoyalty(Number(e.target.value))}
                className="input"
                placeholder="0"
              />
            </Field>
            <Field label="Sell royalty %">
              <input
                title="Sell royalty percentage"
                aria-label="Sell royalty percentage"
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={sellRoyalty}
                onChange={(e) => setSellRoyalty(Number(e.target.value))}
                className="input"
                placeholder="0"
              />
            </Field>
          </div>

          <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} />
        </Card>
      )}

      {step === 3 && (
        <Card title="3. Confirm and launch">
          <ul className="mb-4 space-y-1 text-sm">
            <li><strong>Name:</strong> {name} ({symbol})</li>
            <li><strong>Decimals:</strong> {decimals}</li>
            <li><strong>Curve:</strong> {curveParams.c} · S^({curveParams.pow}/{curveParams.frac}) + {curveParams.b}</li>
            <li><strong>Base:</strong> {BASE_TOKENS[CLUSTER].find((t) => t.mint === baseMint)?.symbol}</li>
            <li><strong>Mint cap:</strong> {mintCap || "none"}</li>
            <li><strong>Royalties:</strong> buy {buyRoyalty}% / sell {sellRoyalty}%</li>
            <li><strong>Go-live:</strong> {new Date(goLive).toLocaleString()}</li>
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
