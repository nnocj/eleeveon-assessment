import {
  db,
  type VisitorProfile,
  type VisitorVisit,
} from "../db/db";
import type { IdentityMutationContext } from "./types";
import { newSyncRecord, touchSyncRecord } from "./exports";

export async function registerVisitor(
  context: IdentityMutationContext,
  input: Pick<
    VisitorProfile,
    | "fullName"
    | "phone"
    | "email"
    | "organizationName"
    | "identificationType"
    | "identificationLastFour"
    | "photoMediaId"
    | "metadata"
  >,
): Promise<VisitorProfile> {
  const visitor: VisitorProfile = {
    ...newSyncRecord(context),
    schoolId: context.schoolId,
    branchId: context.branchId ?? "",
    fullName: input.fullName.trim(),
    phone: input.phone ?? null,
    email: input.email ?? null,
    organizationName: input.organizationName ?? null,
    identificationType: input.identificationType ?? null,
    identificationLastFour: input.identificationLastFour ?? null,
    photoMediaId: input.photoMediaId ?? null,
    blocked: false,
    active: true,
    metadata: input.metadata,
  };

  await db.visitorProfiles.add(visitor);
  return visitor;
}

export async function createVisitorVisit(
  context: IdentityMutationContext,
  input: Pick<
    VisitorVisit,
    | "visitorId"
    | "purpose"
    | "hostType"
    | "hostId"
    | "accessPointId"
    | "credentialId"
    | "expectedAt"
    | "note"
  >,
): Promise<VisitorVisit> {
  const visitor = await db.visitorProfiles.get(input.visitorId);
  if (!visitor || visitor.isDeleted) throw new Error("Visitor was not found.");
  if (visitor.blocked) throw new Error(visitor.blockReason || "Visitor is blocked.");

  const visit: VisitorVisit = {
    ...newSyncRecord(context),
    schoolId: context.schoolId,
    branchId: context.branchId ?? "",
    visitorId: input.visitorId,
    purpose: input.purpose.trim(),
    hostType: input.hostType ?? null,
    hostId: input.hostId ?? null,
    accessPointId: input.accessPointId ?? null,
    credentialId: input.credentialId ?? null,
    expectedAt: input.expectedAt ?? null,
    status: input.expectedAt ? "expected" : "pending",
    note: input.note ?? null,
  };

  await db.visitorVisits.add(visit);
  return visit;
}

export async function checkInVisitor(
  context: IdentityMutationContext,
  visitId: string,
  identityActivityEventId?: string | null,
): Promise<void> {
  const visit = await db.visitorVisits.get(visitId);
  if (!visit) throw new Error("Visitor visit was not found.");

  const now = context.now ?? Date.now();
  await db.transaction(
    "rw",
    db.visitorVisits,
    db.visitorProfiles,
    async () => {
      await db.visitorVisits.update(visitId, {
        checkedInAt: now,
        entryIdentityActivityEventId: identityActivityEventId ?? null,
        approvedByUserId: context.userId ?? visit.approvedByUserId ?? null,
        status: "checked_in",
        ...touchSyncRecord(visit, { ...context, now }),
      });

      const visitor = await db.visitorProfiles.get(visit.visitorId);
      if (visitor) {
        await db.visitorProfiles.update(visitor.id, {
          lastVisitAt: now,
          ...touchSyncRecord(visitor, { ...context, now }),
        });
      }
    },
  );
}

export async function checkOutVisitor(
  context: IdentityMutationContext,
  visitId: string,
  identityActivityEventId?: string | null,
): Promise<void> {
  const visit = await db.visitorVisits.get(visitId);
  if (!visit) throw new Error("Visitor visit was not found.");

  await db.visitorVisits.update(visitId, {
    checkedOutAt: context.now ?? Date.now(),
    exitIdentityActivityEventId: identityActivityEventId ?? null,
    status: "checked_out",
    ...touchSyncRecord(visit, context),
  });
}
