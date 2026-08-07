import type { EffectiveAccessResponse } from "./types";

const PREFIX = "eleeveon_entitlement_snapshot";

export interface CachedEntitlement {
  accountId: string;
  cachedAt: number;
  expiresAt: number;
  value: EffectiveAccessResponse;
}

const key = (accountId: string) => `${PREFIX}:${accountId}`;

export function readEntitlementCache(accountId: string) {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key(accountId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedEntitlement;
    return parsed.accountId === accountId && parsed.value?.snapshot
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export function writeEntitlementCache(
  accountId: string,
  value: EffectiveAccessResponse,
  ttlMs = 15 * 60 * 1000,
) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      key(accountId),
      JSON.stringify({
        accountId,
        cachedAt: Date.now(),
        expiresAt: Date.now() + ttlMs,
        value,
      } satisfies CachedEntitlement),
    );
  } catch {}
}

export function removeEntitlementCache(accountId: string) {
  if (typeof window !== "undefined") {
    localStorage.removeItem(key(accountId));
  }
}
