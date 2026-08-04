import {
  readCachedSyncPolicy,
} from "./syncPolicyCache";

export class ReadOnlyWorkspaceError extends Error {
  readonly code = "WORKSPACE_READ_ONLY";

  constructor(
    message =
      "This workspace is read-only under its current access policy.",
  ) {
    super(message);
    this.name = "ReadOnlyWorkspaceError";
  }
}

/**
 * Call from createLocal/updateLocal/softDeleteLocal before changing Dexie.
 *
 * Offline and hybrid accounts may continue writing locally. Only read-only
 * policy blocks mutations.
 */
export function assertLocalMutationAllowed(
  accountId: string,
): void {
  const policy =
    readCachedSyncPolicy(accountId);

  if (
    policy &&
    policy.allowLocalMutations === false
  ) {
    throw new ReadOnlyWorkspaceError(
      policy.reason,
    );
  }
}
