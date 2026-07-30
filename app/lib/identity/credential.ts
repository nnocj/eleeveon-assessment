import {
  db,
  type IdentityCredential,
  type IdentityCredentialStatus,
} from "../db/db";
import type {
  IdentityCredentialType,
  IdentityMutationContext,
  IdentitySubjectType,
} from "./types";
import { appendCredentialEvent } from "./credential-events";
import { newSyncRecord, touchSyncRecord } from "./exports";
import { assertValid, validateCredential } from "./validation";

export interface CreateCredentialInput {
  subjectType: IdentitySubjectType;
  subjectId: string;
  credentialType: IdentityCredentialType;
  label?: string | null;
  credentialReference?: string | null;
  tokenHash?: string | null;
  serialNumber?: string | null;
  provider?: string | null;
  providerCredentialId?: string | null;
  validFrom?: number | null;
  expiresAt?: number | null;
  status?: IdentityCredentialStatus;
  metadata?: Record<string, unknown>;
}

export interface IssueCredentialInput extends CreateCredentialInput {
  /**
   * When false, issuance is rejected if the subject already has a current
   * credential of the same type.
   */
  allowMultiple?: boolean;

  /**
   * When true, current matching credentials are marked as replaced before the
   * new credential is issued.
   */
  replaceExisting?: boolean;
}

export type IdentityQrPayload = {
  version: 1;
  kind: "eleeveon_identity_credential";
  credentialId: string;
  reference: string;
  subjectType: IdentitySubjectType;
  subjectId: string;
  issuedAt: number;
  expiresAt: number | null;
};

const CURRENT_CREDENTIAL_STATUSES: IdentityCredentialStatus[] = [
  "pending",
  "active",
  "suspended",
];

const GENERATED_REFERENCE_PREFIX: Record<IdentityCredentialType, string> = {
  qr_code: "QR",
  nfc_card: "NFC",
  rfid_card: "RFID",
  fingerprint: "BIO",
  face_profile: "FACE",
  student_id: "STU",
  staff_id: "STF",
  parent_pass: "PAR",
  visitor_pass: "VIS",
  mobile_pass: "MOB",
};

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function randomSegment(length = 8): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto?.getRandomValues
  ) {
    const bytes = new Uint8Array(length);
    globalThis.crypto.getRandomValues(bytes);

    return Array.from(
      bytes,
      (byte) => alphabet[byte % alphabet.length],
    ).join("");
  }

  let output = "";
  for (let index = 0; index < length; index += 1) {
    output += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return output;
}

function dateSegment(timestamp: number): string {
  const date = new Date(timestamp);
  const year = String(date.getUTCFullYear()).slice(-2);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

export function generateCredentialReference(
  credentialType: IdentityCredentialType,
  now = Date.now(),
): string {
  const prefix =
    GENERATED_REFERENCE_PREFIX[credentialType] ?? "ID";

  return `${prefix}-${dateSegment(now)}-${randomSegment(8)}`;
}

async function generateUniqueCredentialReference(
  credentialType: IdentityCredentialType,
  now: number,
): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const reference = generateCredentialReference(
      credentialType,
      now + attempt,
    );

    const existing = await findCredentialByReference(reference);
    if (!existing) return reference;
  }

  throw new Error(
    "A unique credential reference could not be generated.",
  );
}

export function buildIdentityQrValue(
  payload: IdentityQrPayload,
): string {
  return JSON.stringify(payload);
}

export function parseIdentityQrValue(
  value: string,
): IdentityQrPayload | null {
  try {
    const parsed = JSON.parse(value) as Partial<IdentityQrPayload>;

    if (
      parsed.version !== 1 ||
      parsed.kind !== "eleeveon_identity_credential" ||
      !normalizeText(parsed.credentialId) ||
      !normalizeText(parsed.reference) ||
      !normalizeText(parsed.subjectType) ||
      !normalizeText(parsed.subjectId) ||
      typeof parsed.issuedAt !== "number"
    ) {
      return null;
    }

    return parsed as IdentityQrPayload;
  } catch {
    return null;
  }
}

function fallbackHash(value: string): string {
  // Fallback for runtimes without SubtleCrypto. This is only a compatibility
  // fallback; supported browsers will use SHA-256 below.
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    first ^= code;
    first = Math.imul(first, 0x01000193);
    second ^= code + index;
    second = Math.imul(second, 0x85ebca6b);
  }

  return [
    (first >>> 0).toString(16).padStart(8, "0"),
    (second >>> 0).toString(16).padStart(8, "0"),
  ].join("");
}

export async function hashIdentityCredential(
  value: string,
): Promise<string> {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto?.subtle
  ) {
    const bytes = new TextEncoder().encode(value);
    const digest = await globalThis.crypto.subtle.digest(
      "SHA-256",
      bytes,
    );

    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  return fallbackHash(value);
}

function mergeMetadata(
  current: Record<string, unknown> | undefined,
  generated: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...(current ?? {}),
    ...generated,
  };
}

async function prepareGeneratedCredentialValues(
  context: IdentityMutationContext,
  input: CreateCredentialInput,
  credentialId: string,
  now: number,
): Promise<{
  credentialReference: string;
  tokenHash: string | null;
  metadata: Record<string, unknown> | undefined;
}> {
  const credentialReference =
    normalizeText(input.credentialReference) ||
    (await generateUniqueCredentialReference(
      input.credentialType,
      now,
    ));

  if (input.credentialType !== "qr_code") {
    return {
      credentialReference,
      tokenHash: input.tokenHash ?? null,
      metadata: input.metadata,
    };
  }

  const qrValue = buildIdentityQrValue({
    version: 1,
    kind: "eleeveon_identity_credential",
    credentialId,
    reference: credentialReference,
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    issuedAt: now,
    expiresAt: input.expiresAt ?? null,
  });

  const tokenHash =
    normalizeText(input.tokenHash) ||
    (await hashIdentityCredential(qrValue));

  return {
    credentialReference,
    tokenHash,
    metadata: mergeMetadata(input.metadata, {
      qrValue,
      qrVersion: 1,
      qrGeneratedAt: now,
      qrHashAlgorithm:
        typeof globalThis !== "undefined" &&
        globalThis.crypto?.subtle
          ? "SHA-256"
          : "fallback",
    }),
  };
}

/**
 * Low-level credential creation.
 *
 * It still generates missing references and QR values automatically so callers
 * cannot accidentally create incomplete generated credentials.
 */
export async function createCredential(
  context: IdentityMutationContext,
  input: CreateCredentialInput,
): Promise<IdentityCredential> {
  const subjectId = normalizeText(input.subjectId);

  if (!subjectId) {
    throw new Error("Credential subjectId is required.");
  }

  const now = context.now ?? Date.now();
  const syncRecord = newSyncRecord({ ...context, now });

  const generated = await prepareGeneratedCredentialValues(
    context,
    input,
    syncRecord.id,
    now,
  );

  const credential: IdentityCredential = {
    ...syncRecord,
    schoolId: context.schoolId,
    branchId: context.branchId ?? null,
    subjectType: input.subjectType,
    subjectId,
    credentialType: input.credentialType,
    status: input.status ?? "pending",
    label: input.label ?? null,
    credentialReference: generated.credentialReference,
    tokenHash: generated.tokenHash,
    serialNumber: input.serialNumber ?? null,
    provider: input.provider ?? null,
    providerCredentialId: input.providerCredentialId ?? null,
    validFrom: input.validFrom ?? now,
    expiresAt: input.expiresAt ?? null,
    generatedAt: now,
    generatedByUserId: context.userId ?? null,
    usageCount: 0,
    metadata: generated.metadata,
  };

  assertValid(validateCredential(credential));
  await db.identityCredentials.add(credential);

  await appendCredentialEvent(context, {
    credentialId: credential.id,
    subjectType: credential.subjectType,
    subjectId: credential.subjectId,
    eventType: "generated",
    occurredAt: now,
  });

  return credential;
}

/**
 * Preferred high-level issuance function for UI modules.
 *
 * It prevents accidental duplicate current credentials and can replace existing
 * credentials before issuing a new one.
 */
export async function issueCredential(
  context: IdentityMutationContext,
  input: IssueCredentialInput,
): Promise<IdentityCredential> {
  const existing = await listSubjectCredentials(
    input.subjectType,
    input.subjectId,
  );

  const currentMatches = existing.filter(
    (credential) =>
      credential.credentialType === input.credentialType &&
      CURRENT_CREDENTIAL_STATUSES.includes(credential.status),
  );

  if (currentMatches.length && input.replaceExisting) {
    for (const credential of currentMatches) {
      await replaceCredential(
        context,
        credential.id,
        "Replaced during new credential issuance",
      );
    }
  } else if (
    currentMatches.length &&
    input.allowMultiple !== true
  ) {
    throw new Error(
      "This subject already has a current credential of this type.",
    );
  }

  return createCredential(context, input);
}

export async function findCredentialByReference(
  reference: string,
): Promise<IdentityCredential | undefined> {
  const normalized = normalizeText(reference);
  if (!normalized) return undefined;

  return db.identityCredentials
    .filter(
      (credential) =>
        !credential.isDeleted &&
        normalizeText(credential.credentialReference) === normalized,
    )
    .first();
}

export async function listSubjectCredentials(
  subjectType: IdentitySubjectType,
  subjectId: string,
): Promise<IdentityCredential[]> {
  const credentials = await db.identityCredentials
    .where("subjectId")
    .equals(subjectId)
    .toArray();

  return credentials.filter(
    (item) =>
      item.subjectType === subjectType &&
      !item.isDeleted,
  );
}

async function transitionCredential(
  context: IdentityMutationContext,
  credentialId: string,
  status: IdentityCredentialStatus,
  eventType:
    | "activated"
    | "suspended"
    | "reactivated"
    | "revoked"
    | "expired"
    | "replaced",
  reason?: string | null,
): Promise<IdentityCredential> {
  const current = await db.identityCredentials.get(credentialId);

  if (!current || current.isDeleted) {
    throw new Error("Identity credential was not found.");
  }

  const now = context.now ?? Date.now();
  const patch: Partial<IdentityCredential> = {
    status,
    ...touchSyncRecord(current, { ...context, now }),
  };

  if (status === "active") {
    patch.activatedAt = now;
    patch.activatedByUserId = context.userId ?? null;
    patch.suspendedAt = null;
    patch.suspendedByUserId = null;
    patch.suspensionReason = null;
  } else if (status === "suspended") {
    patch.suspendedAt = now;
    patch.suspendedByUserId = context.userId ?? null;
    patch.suspensionReason = reason ?? null;
  } else if (status === "revoked") {
    patch.revokedAt = now;
    patch.revokedByUserId = context.userId ?? null;
    patch.revocationReason = reason ?? null;
  } else if (status === "expired") {
    patch.expiresAt = current.expiresAt ?? now;
  } else if (status === "replaced") {
    patch.replacedAt = now;
  }

  await db.identityCredentials.update(credentialId, patch);

  await appendCredentialEvent(context, {
    credentialId,
    subjectType: current.subjectType,
    subjectId: current.subjectId,
    eventType,
    reasonCode: reason ?? null,
    occurredAt: now,
  });

  return {
    ...current,
    ...patch,
  } as IdentityCredential;
}

export const activateCredential = (
  context: IdentityMutationContext,
  credentialId: string,
) =>
  transitionCredential(
    context,
    credentialId,
    "active",
    "activated",
  );

export const suspendCredential = (
  context: IdentityMutationContext,
  credentialId: string,
  reason?: string | null,
) =>
  transitionCredential(
    context,
    credentialId,
    "suspended",
    "suspended",
    reason,
  );

export const reactivateCredential = (
  context: IdentityMutationContext,
  credentialId: string,
) =>
  transitionCredential(
    context,
    credentialId,
    "active",
    "reactivated",
  );

export const revokeCredential = (
  context: IdentityMutationContext,
  credentialId: string,
  reason?: string | null,
) =>
  transitionCredential(
    context,
    credentialId,
    "revoked",
    "revoked",
    reason,
  );

export const expireCredential = (
  context: IdentityMutationContext,
  credentialId: string,
) =>
  transitionCredential(
    context,
    credentialId,
    "expired",
    "expired",
  );

export const replaceCredential = (
  context: IdentityMutationContext,
  credentialId: string,
  reason?: string | null,
) =>
  transitionCredential(
    context,
    credentialId,
    "replaced",
    "replaced",
    reason,
  );

export async function markCredentialUsed(
  context: IdentityMutationContext,
  credentialId: string,
): Promise<void> {
  const current = await db.identityCredentials.get(credentialId);

  if (!current || current.isDeleted) return;

  const now = context.now ?? Date.now();

  await db.identityCredentials.update(credentialId, {
    lastUsedAt: now,
    usageCount: (current.usageCount ?? 0) + 1,
    ...touchSyncRecord(current, { ...context, now }),
  });
}
