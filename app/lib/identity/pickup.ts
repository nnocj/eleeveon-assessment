import {
  db,
  type PickupAuthorization,
  type StudentPickupEvent,
} from "../db/db";
import type { IdentityMutationContext } from "./types";
import { newSyncRecord, touchSyncRecord } from "./exports";

export interface AuthorizePickupInput {
  studentId: string;
  authorizedPersonType: PickupAuthorization["authorizedPersonType"];
  authorizedPersonId?: string | null;
  fullName?: string | null;
  phone?: string | null;
  relationship?: string | null;
  photoMediaId?: string | null;
  credentialId?: string | null;
  validFrom?: number | null;
  validUntil?: number | null;
  recurring?: boolean;
  allowedDays?: number[];
  note?: string | null;
}

export async function authorizePickup(
  context: IdentityMutationContext,
  input: AuthorizePickupInput,
): Promise<PickupAuthorization> {
  const now = context.now ?? Date.now();
  const authorization: PickupAuthorization = {
    ...newSyncRecord({ ...context, now }),
    schoolId: context.schoolId,
    branchId: context.branchId ?? "",
    studentId: input.studentId,
    authorizedPersonType: input.authorizedPersonType,
    authorizedPersonId: input.authorizedPersonId ?? null,
    fullName: input.fullName ?? null,
    phone: input.phone ?? null,
    relationship: input.relationship ?? null,
    photoMediaId: input.photoMediaId ?? null,
    credentialId: input.credentialId ?? null,
    validFrom: input.validFrom ?? now,
    validUntil: input.validUntil ?? null,
    recurring: input.recurring ?? true,
    allowedDays: input.allowedDays ?? [],
    status: "approved",
    approvedByUserId: context.userId ?? null,
    approvedAt: now,
    note: input.note ?? null,
  };

  await db.pickupAuthorizations.add(authorization);
  return authorization;
}

export function pickupAuthorizationIsValid(
  authorization: PickupAuthorization,
  at = Date.now(),
): boolean {
  if (
    authorization.isDeleted ||
    authorization.status !== "approved"
  ) {
    return false;
  }

  if (authorization.validFrom != null && authorization.validFrom > at) {
    return false;
  }

  if (authorization.validUntil != null && authorization.validUntil < at) {
    return false;
  }

  const day = new Date(at).getDay();
  if (
    authorization.allowedDays?.length &&
    !authorization.allowedDays.includes(day)
  ) {
    return false;
  }

  return true;
}

export async function requestStudentPickup(
  context: IdentityMutationContext,
  input: Pick<
    StudentPickupEvent,
    | "studentId"
    | "authorizationId"
    | "collectorSubjectType"
    | "collectorSubjectId"
    | "credentialId"
    | "identityActivityEventId"
    | "note"
  >,
): Promise<StudentPickupEvent> {
  if (input.authorizationId) {
    const authorization = await db.pickupAuthorizations.get(
      input.authorizationId,
    );

    if (!authorization || !pickupAuthorizationIsValid(authorization)) {
      throw new Error("Pickup authorization is not currently valid.");
    }

    if (authorization.studentId !== input.studentId) {
      throw new Error("Pickup authorization belongs to another student.");
    }
  }

  const record: StudentPickupEvent = {
    ...newSyncRecord(context),
    schoolId: context.schoolId,
    branchId: context.branchId ?? "",
    studentId: input.studentId,
    authorizationId: input.authorizationId ?? null,
    collectorSubjectType: input.collectorSubjectType,
    collectorSubjectId: input.collectorSubjectId ?? null,
    credentialId: input.credentialId ?? null,
    identityActivityEventId: input.identityActivityEventId ?? null,
    requestedAt: context.now ?? Date.now(),
    status: "requested",
    note: input.note ?? null,
  };

  await db.studentPickupEvents.add(record);
  return record;
}

export async function approveStudentPickup(
  context: IdentityMutationContext,
  pickupEventId: string,
): Promise<void> {
  const current = await db.studentPickupEvents.get(pickupEventId);
  if (!current) throw new Error("Pickup event was not found.");

  await db.studentPickupEvents.update(pickupEventId, {
    approvedAt: context.now ?? Date.now(),
    approvedByUserId: context.userId ?? null,
    status: "approved",
    ...touchSyncRecord(current, context),
  });
}

export async function releaseStudent(
  context: IdentityMutationContext,
  pickupEventId: string,
): Promise<void> {
  const current = await db.studentPickupEvents.get(pickupEventId);
  if (!current) throw new Error("Pickup event was not found.");
  if (!["verified", "approved"].includes(current.status)) {
    throw new Error("Student must be verified or approved before release.");
  }

  await db.studentPickupEvents.update(pickupEventId, {
    releasedAt: context.now ?? Date.now(),
    releasedByUserId: context.userId ?? null,
    status: "released",
    ...touchSyncRecord(current, context),
  });
}
