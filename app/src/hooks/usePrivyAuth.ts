"use client";

import { createContext, useContext } from "react";

/**
 * Thin abstraction over Privy's `usePrivy()` that never throws — returns
 * `null` when PrivyProvider is not mounted (missing env var, SSR, etc.).
 *
 * This avoids the "You need to wrap your application with <PrivyProvider>"
 * crash in production when the component renders before / outside the provider.
 *
 * PrivyAuthProvider populates this context from inside PrivyProvider;
 * consumers just call `usePrivyAuth()` and get null if unavailable.
 */
export interface PrivyAuthValue {
  authenticated: boolean;
  user: {
    email?: { address: string };
    google?: { email: string };
  } | null;
  login: () => void;
  logout: () => Promise<void>;
}

export const PrivyAuthContext = createContext<PrivyAuthValue | null>(null);

export function usePrivyAuth(): PrivyAuthValue | null {
  return useContext(PrivyAuthContext);
}
