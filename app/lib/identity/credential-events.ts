import { db, type IdentityCredentialEvent } from "../db/db";
import type {
  IdentityCredentialEventType,
  IdentityMutationContext,
  IdentityPurpose,
  IdentitySubjectType,
} from "./types";
import { newSyncRecord } from "./exports";

export interface AppendCredentialEventInput {
  credentialId: string;
  subjectType: IdentitySubjectType;
  subjectId: string;
  eventType: IdentityCredentialEventType;
  identityDeviceId?: string | null;
  purpose?: IdentityPurpose | null;
  reasonCode?: string | null;
  note?: string | null;
  metadata?: Record<string, unknown>;
  occurredAt?: number;
}

export async function appendCredentialEvent(
  context: IdentityMutationContext,
  input: AppendCredentialEventInput,
): Promise<IdentityCredentialEvent> {
  const event: IdentityCredentialEvent = {
    ...newSyncRecord(context),
    schoolId: context.schoolId,
    branchId: context.branchId ?? null,
    credentialId: input.credentialId,
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    eventType: input.eventType,
    occurredAt: input.occurredAt ?? context.now ?? Date.now(),
    performedByUserId: context.userId ?? null,
    identityDeviceId: input.identityDeviceId ?? null,
    purpose: input.purpose ?? null,
    reasonCode: input.reasonCode ?? null,
    note: input.note ?? null,
    metadata: input.metadata,
  };

  await db.identityCredentialEvents.add(event);
  return event;
}

export async function credentialHistory(
  credentialId: string,
): Promise<IdentityCredentialEvent[]> {
  return db.identityCredentialEvents
    .where("credentialId")
    .equals(credentialId)
    .sortBy("occurredAt");
}
