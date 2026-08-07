"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  fetchCurrentAccess,
  rebuildCurrentAccess,
} from "../lib/subscription/subscriptionApi";
import {
  readEntitlementCache,
  removeEntitlementCache,
  writeEntitlementCache,
} from "../lib/subscription/entitlementCache";
import type {
  AccessApi,
  EffectiveAccessResponse,
  FeatureKey,
  ResourceKey,
} from "../lib/subscription/types";

const SubscriptionContext = createContext<AccessApi | null>(null);

export interface SubscriptionProviderProps {
  children: ReactNode;
  accountId?: string | null;
  authenticated?: boolean;
  initialAccess?: EffectiveAccessResponse | null;
  autoRefresh?: boolean;
}

export function SubscriptionProvider({
  children,
  accountId,
  authenticated = true,
  initialAccess = null,
  autoRefresh = true,
}: SubscriptionProviderProps) {
  const [value, setValue] =
    useState<EffectiveAccessResponse | null>(initialAccess);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeRequest = useRef<Promise<void> | null>(null);

  const clear = useCallback(() => {
    if (accountId) removeEntitlementCache(accountId);
    setValue(null);
    setLoading(false);
    setRefreshing(false);
    setInitialized(false);
    setStale(false);
    setError(null);
  }, [accountId]);

  const refresh = useCallback(
    async (options?: { rebuild?: boolean }) => {
      if (!authenticated || !accountId) {
        clear();
        return;
      }

      if (activeRequest.current) return activeRequest.current;

      const operation = (async () => {
        setRefreshing(true);
        setError(null);

        try {
          const next = options?.rebuild
            ? await rebuildCurrentAccess()
            : await fetchCurrentAccess();

          if (next.snapshot.accountId !== accountId) {
            throw new Error(
              "Received entitlement data for a different account.",
            );
          }

          setValue(next);
          setStale(false);
          writeEntitlementCache(accountId, next);
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : String(caught),
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
          setInitialized(true);
        }
      })().finally(() => {
        activeRequest.current = null;
      });

      activeRequest.current = operation;
      return operation;
    },
    [accountId, authenticated, clear],
  );

  useEffect(() => {
    if (!authenticated || !accountId) {
      clear();
      return;
    }

    setLoading(true);

    if (initialAccess?.snapshot.accountId === accountId) {
      setValue(initialAccess);
      setStale(false);
      writeEntitlementCache(accountId, initialAccess);
    } else {
      const cached = readEntitlementCache(accountId);
      setValue(cached?.value ?? null);
      setStale(Boolean(cached && cached.expiresAt <= Date.now()));
    }

    setLoading(false);
    setInitialized(true);

    const online =
      typeof navigator === "undefined" || navigator.onLine;

    if (autoRefresh && online) void refresh();
  }, [
    accountId,
    authenticated,
    autoRefresh,
    clear,
    initialAccess,
    refresh,
  ]);

  useEffect(() => {
    if (typeof window === "undefined" || !autoRefresh) return;

    const update = () => void refresh();
    window.addEventListener("online", update);
    window.addEventListener("focus", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("focus", update);
    };
  }, [autoRefresh, refresh]);

  const api = useMemo<AccessApi>(() => {
    const snapshot = value?.snapshot ?? null;
    const usage = value?.usage ?? null;

    const can = (feature: FeatureKey) =>
      Boolean(
        snapshot &&
          !["expired", "suspended", "cancelled"].includes(snapshot.status) &&
          snapshot.features[feature] === true,
      );

    const limit = (resource: ResourceKey) => {
      const amount = snapshot?.limits[resource];
      return typeof amount === "number" ? amount : null;
    };

    const used = (resource: ResourceKey) => {
      const amount = usage?.[resource];
      return typeof amount === "number" ? amount : 0;
    };

    const remaining = (resource: ResourceKey) => {
      const maximum = limit(resource);
      return maximum === null
        ? null
        : Math.max(0, maximum - used(resource));
    };

    return {
      snapshot,
      usage,
      loading,
      refreshing,
      initialized,
      stale,
      error,
      can,
      cannot: (feature) => !can(feature),
      limit,
      used,
      remaining,
      hasCapacity(resource, increase = 1) {
        const maximum = limit(resource);
        return maximum === null || used(resource) + increase <= maximum;
      },
      refresh,
      clear,
      accountId: snapshot?.accountId ?? null,
      status: snapshot?.status ?? "unknown",
      syncPolicy: snapshot?.syncPolicy ?? "disabled",
      deploymentMode: snapshot?.deploymentMode ?? null,
      isReadOnly:
        !snapshot ||
        ["expired", "suspended", "cancelled"].includes(snapshot.status),
    };
  }, [
    clear,
    error,
    initialized,
    loading,
    refresh,
    refreshing,
    stale,
    value,
  ]);

  return (
    <SubscriptionContext.Provider value={api}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useAccess(): AccessApi {
  const value = useContext(SubscriptionContext);

  if (!value) {
    throw new Error(
      "useAccess must be used inside SubscriptionProvider.",
    );
  }

  return value;
}

export function useOptionalAccess() {
  return useContext(SubscriptionContext);
}
