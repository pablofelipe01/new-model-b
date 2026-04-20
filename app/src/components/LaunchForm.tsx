"use client";

import {
  CURVES,
  LAUNCHER_FEE_BPS_MAX,
  PLATFORM_FEE_BPS,
  USDC_DECIMALS,
  scaleCurveHumanToOnChain,
  type CurveParams,
  type PiecewiseCurve,
} from "@new-model-b/sdk";
import BN from "bn.js";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { BondingCurveChart } from "@/components/BondingCurveChart";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useSdk } from "@/components/providers/SdkProvider";
import { FEE_PAYER } from "@/lib/sponsoredSend";

type Step = 1 | 2 | 3;

const PRESETS = [
  { key: "sqrt" as const, pow: 1, frac: 2 },
  { key: "linear" as const, pow: 1, frac: 1 },
  { key: "quadratic" as const, pow: 2, frac: 1 },
];

export function LaunchForm() {
  const { sdk, ready } = useSdk();
  const { t, lang } = useLanguage();
  const [step, setStep] = useState<Step>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [decimals] = useState(9);

  // Step 2
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [startingPrice, setStartingPrice] = useState(0);
  const [growthRate, setGrowthRate] = useState(1);
  const [launcherFeePct, setLauncherFeePct] = useState(0);

  const curveParams = useMemo<CurveParams>(() => {
    const base = CURVES[selectedPreset.key];
    return {
      c: selectedPreset.key === "quadratic" ? growthRate : selectedPreset.key === "sqrt" ? growthRate : growthRate,
      b: startingPrice,
      pow: base.pow,
      frac: base.frac,
    };
  }, [selectedPreset, growthRate, startingPrice]);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ mint: string; bonding: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onLaunch() {
    if (!sdk || !ready) {
      setError(lang === "es" ? "Conecta tu billetera primero" : "Connect a wallet first");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const onChainCurve = scaleCurveHumanToOnChain(curveParams, USDC_DECIMALS, decimals);
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

      const sendFn = FEE_PAYER
        ? async (serializedTx: Buffer): Promise<string> => {
            const res = await fetch("/api/sponsor-tx", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ transaction: serializedTx.toString("base64") }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Sponsor relay failed");
            return data.signature;
          }
        : undefined;

      const { curveKey } = await sdk.createCurve({
        definition,
        rentPayer: FEE_PAYER ?? undefined,
        sendFn,
      });

      let tokenUri = "";
      if (imageUrl) {
        const isLocalhost =
          typeof window !== "undefined" &&
          /^(localhost|127\.0\.0\.1)(:|$)/.test(window.location.host);
        if (isLocalhost) {
          tokenUri = imageUrl;
        } else {
          const short = `${window.location.origin}/api/m?i=${encodeURIComponent(imageUrl)}`;
          tokenUri = short.length <= 200 ? short : imageUrl;
        }
      }

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

  // ─── Success screen ───
  if (result) {
    const tokenUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/token/${result.mint}`;
    return (
      <div className="success-screen">
        <div className="success-inner">
          <h1 className="display-l fraunces-italic">{t.shareMoment}</h1>
          <p className="muted" style={{ marginTop: 12 }}>{t.shareCopy}</p>

          <div className="share-actions">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(tokenUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-full"
            >
              {t.shareWA}
            </a>
            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={() => navigator.clipboard.writeText(tokenUrl)}
            >
              {t.copyLink}
            </button>
            <Link href={`/token/${result.mint}`} className="btn btn-ghost btn-full">
              {t.viewToken} →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Wizard ───
  const stepLabels = [t.step1, t.step2, t.step3];
  const stepSubs = [t.step1Sub, t.step2Sub, t.step3Sub];

  return (
    <div className="launch-screen">
      <div className="page-head">
        <div>
          <div className="label">{t.launch}</div>
          <h1 className="page-title fraunces-italic">{t.launchYourToken}</h1>
        </div>
      </div>

      <div className="wizard">
        {/* Rail */}
        <div className="wizard-rail">
          <p className="muted">{stepSubs[step - 1]}</p>
          <div className="steps">
            {stepLabels.map((label, i) => {
              const n = i + 1;
              const cls =
                n === step ? "step active" : n < step ? "step done" : "step";
              return (
                <div key={n} className={cls}>
                  <div className="step-num">{n < step ? "✓" : n}</div>
                  <div className="step-label">{label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="wizard-body">
          {step === 1 && (
            <div className="form">
              <label className="input-label">{t.launchName}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder={lang === "es" ? "Mi Token" : "My Token"}
              />

              <label className="input-label" style={{ marginTop: 12 }}>{t.launchSymbol}</label>
              <input
                value={symbol}
                maxLength={10}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="input"
                placeholder="MYT"
              />

              <label className="input-label" style={{ marginTop: 12 }}>{t.launchBio}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input textarea"
                placeholder={lang === "es" ? "¿De qué se trata?" : "What is this token for?"}
              />

              <label className="input-label" style={{ marginTop: 12 }}>Logo</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  try {
                    const fd = new FormData();
                    fd.append("file", file);
                    const res = await fetch("/api/upload", { method: "POST", body: fd });
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
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="btn btn-secondary"
                  style={{ padding: "10px 16px", fontSize: 14 }}
                >
                  {uploading
                    ? lang === "es" ? "Subiendo…" : "Uploading…"
                    : lang === "es" ? "Subir imagen" : "Upload image"}
                </button>
                {imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt="preview"
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "var(--radius-md)",
                      objectFit: "cover",
                    }}
                  />
                )}
              </div>

              <div className="wizard-actions">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!name || !symbol}
                  className="btn btn-primary"
                >
                  {t.next} →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form">
              <label className="input-label">{lang === "es" ? "Tipo de curva" : "Curve type"}</label>
              <div className="slope-row">
                {PRESETS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setSelectedPreset(p)}
                    className={`slope-opt ${selectedPreset.key === p.key ? "on" : ""}`}
                  >
                    <div className="slope-label" style={{ textTransform: "capitalize" }}>
                      {p.key === "sqrt"
                        ? lang === "es" ? "Raíz cuadrada" : "Square root"
                        : p.key === "linear"
                          ? "Linear"
                          : lang === "es" ? "Cuadrática" : "Quadratic"}
                    </div>
                    <div className="slope-sub">
                      {p.key === "sqrt"
                        ? lang === "es" ? "Crece despacio, luego rápido" : "Grows slowly, then faster"
                        : p.key === "linear"
                          ? lang === "es" ? "Crece a ritmo constante" : "Grows at constant rate"
                          : lang === "es" ? "Crece muy rápido" : "Grows very fast"}
                    </div>
                  </button>
                ))}
              </div>

              <label className="input-label">{t.launchStartPrice} ($)</label>
              <input
                type="number"
                step="0.001"
                min={0}
                value={startingPrice}
                onChange={(e) => setStartingPrice(Number(e.target.value))}
                className="input"
                placeholder="0"
              />

              <label className="input-label" style={{ marginTop: 12 }}>
                {lang === "es" ? "Tasa de crecimiento" : "Growth rate"}
              </label>
              <input
                type="number"
                step="0.1"
                min={0}
                value={growthRate}
                onChange={(e) => setGrowthRate(Number(e.target.value))}
                className="input"
                placeholder="1"
              />
              <p className="help">
                {lang === "es"
                  ? "Mayor = el precio sube más rápido con la demanda."
                  : "Higher = price rises faster with demand."}
              </p>

              <label className="input-label" style={{ marginTop: 12 }}>
                {lang === "es" ? "Tu comisión %" : "Your fee %"} (0–{LAUNCHER_FEE_BPS_MAX / 100})
              </label>
              <input
                type="number"
                min={0}
                max={LAUNCHER_FEE_BPS_MAX / 100}
                step="0.1"
                value={launcherFeePct}
                onChange={(e) => setLauncherFeePct(Number(e.target.value))}
                className="input"
                placeholder="0"
              />
              <p className="help">
                {lang === "es"
                  ? `Plataforma cobra ${PLATFORM_FEE_BPS / 100}% adicional. Total por operación: ${(launcherFeePct + PLATFORM_FEE_BPS / 100).toFixed(2)}%`
                  : `Platform charges ${PLATFORM_FEE_BPS / 100}% additionally. Total per trade: ${(launcherFeePct + PLATFORM_FEE_BPS / 100).toFixed(2)}%`}
              </p>

              <div className="curve-preview">
                <div className="label">{lang === "es" ? "Vista previa" : "Preview"}</div>
                <div style={{ height: 180 }}>
                  <BondingCurveChart
                    curve={curveParams}
                    currentSupply={0}
                    maxSupply={1000}
                    baseMintSymbol="USDC"
                  />
                </div>
              </div>

              <div className="wizard-actions" style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => setStep(1)} className="btn btn-secondary">
                  {t.back}
                </button>
                <button type="button" onClick={() => setStep(3)} className="btn btn-primary">
                  {t.next} →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form">
              <div className="review-card">
                <div className="rc-head">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt={name} className="rc-avatar" style={{ objectFit: "cover" }} />
                  ) : (
                    <div className="rc-avatar" style={{ background: "var(--color-surface-high)" }} />
                  )}
                  <div>
                    <div className="rc-name">{name}</div>
                    <div className="rc-handle">${symbol}</div>
                  </div>
                </div>
                <div className="rc-divider" />
                <div className="rc-grid">
                  <div>
                    <div className="label">{lang === "es" ? "Curva" : "Curve"}</div>
                    <div style={{ fontWeight: 500, textTransform: "capitalize" }}>{selectedPreset.key}</div>
                  </div>
                  <div>
                    <div className="label">{lang === "es" ? "Precio inicial" : "Start price"}</div>
                    <div style={{ fontWeight: 500 }}>${startingPrice}</div>
                  </div>
                  <div>
                    <div className="label">{lang === "es" ? "Tu comisión" : "Your fee"}</div>
                    <div style={{ fontWeight: 500 }}>{launcherFeePct}%</div>
                  </div>
                  <div>
                    <div className="label">{lang === "es" ? "Costo de lanzamiento" : "Launch cost"}</div>
                    <div style={{ fontWeight: 500 }}>$25</div>
                  </div>
                </div>
              </div>

              {error && (
                <p className="muted-small" style={{ color: "var(--state-danger)", marginTop: 12 }}>
                  {error}
                </p>
              )}

              <div className="wizard-actions" style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => setStep(2)} className="btn btn-secondary">
                  {t.back}
                </button>
                <button
                  type="button"
                  onClick={onLaunch}
                  disabled={submitting || !ready}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {submitting
                    ? lang === "es" ? "Lanzando…" : "Launching…"
                    : t.launchMine}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function humanToRawBn(n: number): BN {
  const fixed = n.toFixed(12);
  const [intPart, fracPart = ""] = fixed.split(".");
  const padded = (fracPart + "000000000000").slice(0, 12);
  return new BN(intPart + padded);
}
