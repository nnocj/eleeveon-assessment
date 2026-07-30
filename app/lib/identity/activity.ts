import {
  db,
  type IdentityActivityEvent,
} from "../db/db";
import {
  IDENTITY_DEFAULT_DUPLICATE_WINDOW_MS,
} from "./constants";
import type {
  IdentityMutationContext,
  IdentityScanPayload,
} from "./types";
import { appendCredentialEvent } from "./credential-events";
import { newSyncRecord } from "./exports";
import { verifyCredential } from "./verification";
import { assertValid, validateScanPayload } from "./validation";

export async function findRecentDuplicateActivity(
  credentialId: string,
  purpose: IdentityActivityEvent["purpose"],
  occurredAt: number,
  windowMs = IDENTITY_DEFAULT_DUPLICATE_WINDOW_MS,
): Promise<IdentityActivityEvent | undefined> {
  const recent = await db.identityActivityEvents
    .where("credentialId")
    .equals(credentialId)
    .toArray();

  return recent
    .filter(
      (item) =>
        !item.isDeleted &&
        item.purpose === purpose &&
        Math.abs(item.occurredAt - occurredAt) <= windowMs,
    )
    .sort((a, b) => b.occurredAt - a.occurredAt)[0];
}

export async function captureIdentityActivity(
  context: IdentityMutationContext,
  payload: IdentityScanPayload,
): Promise<IdentityActivityEvent> {
  assertValid(validateScanPayload(payload));

  const occurredAt = payload.occurredAt ?? context.now ?? Date.now();
  const verification = await verifyCredential(
    { ...context, now: occurredAt },
    payload.rawValue,
    {
      identityDeviceId: payload.identityDeviceId,
      now: occurredAt,
    },
  );

  const duplicate =
    verification.credential && verification.ok
      ? await findRecentDuplicateActivity(
          verification.credential.id,
          payload.purpose,
          occurredAt,
        )
      : undefined;

  const event: IdentityActivityEvent = {
    ...newSyncRecord({ ...context, now: occurredAt }),
    schoolId: context.schoolId,
    branchId: context.branchId ?? null,
    subjectType: verification.credential?.subjectType ?? "visitor",
    subjectId: verification.credential?.subjectId ?? "unknown",
    credentialId: verification.credential?.id ?? null,
    identityDeviceId: payload.identityDeviceId ?? null,
    accessPointId: payload.accessPointId ?? null,
    purpose: payload.purpose,
    occurredAt,
    capturedByUserId:
      payload.capturedByUserId ?? context.userId ?? null,
    verificationStatus: duplicate
      ? "verified"
      : verification.status,
    outcome: duplicate
      ? "duplicate"
      : verification.outcome,
    duplicateOfEventId: duplicate?.id ?? null,
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    accuracyMeters: payload.accuracyMeters ?? null,
    failureCode: duplicate
      ? "DUPLICATE_ACTIVITY"
      : verification.failureCode ?? null,
    failureMessage: duplicate
      ? "A matching activity was already captured recently."
      : verification.message ?? null,
    metadata: payload.metadata,
  };

  await db.identityActivityEvents.add(event);

  if (verification.credential) {
    await appendCredentialEvent(context, {
      credentialId: verification.credential.id,
      subjectType: verification.credential.subjectType,
      subjectId: verification.credential.subjectId,
      eventType: verification.ok ? "used" : "verification_failed",
      identityDeviceId: payload.identityDeviceId ?? null,
      purpose: payload.purpose,
      reasonCode: event.failureCode,
      occurredAt,
    });
  }

  return event;
}

export async function linkIdentityActivity(
  eventId: string,
  relatedTable: string,
  relatedRecordId: string,
): Promise<void> {
  await db.identityActivityEvents.update(eventId, {
    relatedTable,
    relatedRecordId,
  });
}
