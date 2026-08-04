import { syncHttp } from "./syncHttp";
import {
  cacheSyncPolicy,
  readCachedSyncPolicy,
} from "./syncPolicyCache";
import {
  FALLBACK_READ_ONLY_POLICY,
  type EffectiveSyncPolicy,
} from "./syncPolicy";

const POLICY_ENDPOINT = "/sync/policy";

export async function resolveSyncPolicy(
  accountId: string,
  options?: {
    forceRefresh?: boolean;
    online?: boolean;
  },
): Promise<EffectiveSyncPolicy> {
  const cached =
    readCachedSyncPolicy(accountId);

  if (
    cached &&
    options?.forceRefresh !== true
  ) {
    return cached;
  }

  const online =
    options?.online ??
    (typeof navigator === "undefined"
      ? true
      : navigator.onLine);

  if (!online) {
    return (
      cached ??
      FALLBACK_READ_ONLY_POLICY(
        accountId,
        "No cached sync policy is available while offline.",
      )
    );
  }

  try {
    const policy =
      await syncHttp<EffectiveSyncPolicy>(
        POLICY_ENDPOINT,
        {
          method: "POST",
          body: { accountId },
        },
      );

    cacheSyncPolicy(policy);
    return policy;
  } catch (error) {
    /**
     * A previously verified policy is safer than changing behavior because of
     * a temporary network failure. Without one, fail closed as read-only.
     */
    return (
      cached ??
      FALLBACK_READ_ONLY_POLICY(
        accountId,
        error instanceof Error
          ? error.message
          : "Failed to resolve synchronization policy.",
      )
    );
  }
}
