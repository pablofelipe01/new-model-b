"use client";

import { useCallback, useEffect, useState } from "react";

import { useSdk } from "@/components/providers/SdkProvider";

import type { ActivityRow } from "@/app/api/activity/route";

export type { ActivityRow } from "@/app/api/activity/route";

/** Fetches the connected wallet's recent on-chain moves from /api/activity. */
export function useActivity(limit = 25) {
  const { sdk, ready } = useSdk();
  const wallet = ready ? sdk?.provider.wallet.publicKey?.toBase58() : undefined;

  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!wallet) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/activity?wallet=${wallet}&limit=${limit}`);
      const data = (await res.json()) as { activity?: ActivityRow[]; error?: string };
      setActivity(data.activity ?? []);
      if (data.error) setError(data.error);
    } catch {
      setError("fetch-failed");
    } finally {
      setLoading(false);
    }
  }, [wallet, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  return { activity, loading, error, refresh: load, wallet };
}
