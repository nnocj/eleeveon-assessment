import { db, type IdentityCredential } from "../db/db";
import type {
  CredentialVerificationResult,
  IdentityMutationContext,
} from "./types";
import { TERMINAL_CREDENTIAL_STATUSES } from "./constants";
import { deviceSupportsCredential } from "./devices";
import {
  findCredentialByReference,
  markCredentialUsed,
} from "./credential";

export async function resolveCredentialFromRawValue(
  rawValue: string,
): Promise<IdentityCredential | undefined> {
  const normalized = rawValue.trim();

  const direct = await db.identityCredentials.get(normalized);
  if (direct) return direct;

  return findCredentialByReference(normalized);
}

export async function verifyCredential(
  context: IdentityMutationContext,
  rawValue: string,
  options?: {
    identityDeviceId?: string | null;
    now?: number;
  },
): Promise<CredentialVerificationResult> {
  const credential = await resolveCredentialFromRawValue(rawValue);
  const now = options?.now ?? context.now ?? Date.now();

  if (!credential || credential.isDeleted) {
    return {
      ok: false,
      status: "rejected",
      outcome: "denied",
      failureCode: "CREDENTIAL_NOT_FOUND",
      message: "Credential was not found.",
    };
  }

  if (
    credential.accountId !== context.accountId ||
    credential.schoolId !== context.schoolId ||
    (
      context.branchId &&
      credential.branchId &&
      credential.branchId !== context.branchId
    )
  ) {
    return {
      ok: false,
      status: "rejected",
      outcome: "denied",
      credential,
      failureCode: "CREDENTIAL_OUTSIDE_SCOPE",
      message: "Credential belongs to another workspace.",
    };
  }

  if (TERMINAL_CREDENTIAL_STATUSES.has(credential.status)) {
    return {
      ok: false,
      status: "rejected",
      outcome: "denied",
      credential,
      failureCode: `CREDENTIAL_${credential.status.toUpperCase()}`,
      message: `Credential is ${credential.status}.`,
    };
  }

  if (credential.status !== "active") {
    return {
      ok: false,
      status: "pending",
      outcome: "pending",
      credential,
      failureCode: "CREDENTIAL_NOT_ACTIVE",
      message: "Credential is not active.",
    };
  }

  if (credential.validFrom != null && credential.validFrom > now) {
    return {
      ok: false,
      status: "rejected",
      outcome: "denied",
      credential,
      failureCode: "CREDENTIAL_NOT_YET_VALID",
      message: "Credential is not valid yet.",
    };
  }

  if (credential.expiresAt != null && credential.expiresAt <= now) {
    return {
      ok: false,
      status: "rejected",
      outcome: "denied",
      credential,
      failureCode: "CREDENTIAL_EXPIRED",
      message: "Credential has expired.",
    };
  }

  if (options?.identityDeviceId) {
    const device = await db.identityDevices.get(options.identityDeviceId);
    if (!device || device.active === false) {
      return {
        ok: false,
        status: "rejected",
        outcome: "denied",
        credential,
        failureCode: "DEVICE_NOT_AVAILABLE",
        message: "Identity device is unavailable.",
      };
    }

    if (!deviceSupportsCredential(device, credential.credentialType)) {
      return {
        ok: false,
        status: "rejected",
        outcome: "failed",
        credential,
        failureCode: "DEVICE_CAPABILITY_MISMATCH",
        message: "This device cannot verify the credential type.",
      };
    }
  }

  await markCredentialUsed({ ...context, now }, credential.id);

  return {
    ok: true,
    status: "verified",
    outcome: "accepted",
    credential,
  };
}
