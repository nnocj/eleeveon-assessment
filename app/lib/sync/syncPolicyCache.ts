import type {
  EffectiveSyncPolicy,
} from "./syncPolicy";

const POLICY_KEY_PREFIX =
  "eleeveon_effective_sync_policy";

function key(accountId: string) {
  return `${POLICY_KEY_PREFIX}:${accountId}`;
}

export function readCachedSyncPolicy(
  accountId: string,
): EffectiveSyncPolicy | null {
  if (typeof window === "undefined") return null;

  try {
    const raw =
      window.localStorage.getItem(key(accountId));

    if (!raw) return null;

    const policy = JSON.parse(
      raw,
    ) as EffectiveSyncPolicy;

    if (
      policy.accountId !== accountId ||
      !policy.mode
    ) {
      return null;
    }

    if (
      policy.expiresAt &&
      policy.expiresAt <= Date.now()
    ) {
      return null;
    }

    return policy;
  } catch {
    return null;
  }
}

export function cacheSyncPolicy(
  policy: EffectiveSyncPolicy,
): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    key(policy.accountId),
    JSON.stringify(policy),
  );
}

export function clearCachedSyncPolicy(
  accountId?: string,
): void {
  if (typeof window === "undefined") return;

  if (accountId) {
    window.localStorage.removeItem(key(accountId));
    return;
  }

  for (
    let index = window.localStorage.length - 1;
    index >= 0;
    index -= 1
  ) {
    const itemKey =
      window.localStorage.key(index);

    if (
      itemKey?.startsWith(
        `${POLICY_KEY_PREFIX}:`,
      )
    ) {
      window.localStorage.removeItem(itemKey);
    }
  }
}
