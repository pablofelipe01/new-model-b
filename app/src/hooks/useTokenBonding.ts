"use client";

import type { TokenBondingV0 } from "@new-model-b/sdk";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";

import { useSdk } from "@/components/providers/SdkProvider";

interface State {
  tokenBonding: TokenBondingV0 | undefined;
  loading: boolean;
  error: Error | undefined;
}

export function useTokenBonding(key?: PublicKey | string): State {
  const { sdk } = useSdk();
  const [state, setState] = useState<State>({
    tokenBonding: undefined,
    loading: false,
    error: undefined,
  });

  useEffect(() => {
    if (!sdk || !key) {
      setState({ tokenBonding: undefined, loading: false, error: undefined });
      return;
    }
    const pk = typeof key === "string" ? new PublicKey(key) : key;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    sdk
      .getTokenBonding(pk)
      .then((tb) => {
        if (cancelled) return;
        setState({ tokenBonding: tb ?? undefined, loading: false, error: undefined });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setState({ tokenBonding: undefined, loading: false, error: err });
      });
    return () => {
      cancelled = true;
    };
  }, [sdk, key?.toString()]);

  return state;
}
