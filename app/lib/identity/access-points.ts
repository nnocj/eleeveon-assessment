import { db, type IdentityAccessPoint } from "../db/db";
import type { IdentityMutationContext } from "./types";
import { checkGeofence } from "./maps";
import { newSyncRecord, touchSyncRecord } from "./exports";

export interface CreateAccessPointInput {
  name: string;
  code?: string | null;
  accessPointType: IdentityAccessPoint["accessPointType"];
  organizationId?: string | null;
  classId?: string | null;
  vehicleId?: string | null;
  locationLabel?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  allowedRadiusMeters?: number | null;
  metadata?: Record<string, unknown>;
}

export async function createAccessPoint(
  context: IdentityMutationContext,
  input: CreateAccessPointInput,
): Promise<IdentityAccessPoint> {
  const record: IdentityAccessPoint = {
    ...newSyncRecord(context),
    schoolId: context.schoolId,
    branchId: context.branchId ?? null,
    name: input.name.trim(),
    code: input.code ?? null,
    accessPointType: input.accessPointType,
    organizationId: input.organizationId ?? null,
    classId: input.classId ?? null,
    vehicleId: input.vehicleId ?? null,
    locationLabel: input.locationLabel ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    allowedRadiusMeters: input.allowedRadiusMeters ?? null,
    active: true,
    metadata: input.metadata,
  };

  await db.identityAccessPoints.add(record);
  return record;
}

export async function updateAccessPoint(
  context: IdentityMutationContext,
  accessPointId: string,
  patch: Partial<Omit<IdentityAccessPoint, "id" | "accountId">>,
): Promise<void> {
  const current = await db.identityAccessPoints.get(accessPointId);
  if (!current) throw new Error("Identity access point was not found.");

  await db.identityAccessPoints.update(accessPointId, {
    ...patch,
    ...touchSyncRecord(current, context),
  });
}

export function isInsideAccessPoint(
  current: { latitude: number; longitude: number },
  accessPoint: IdentityAccessPoint,
) {
  if (accessPoint.latitude == null || accessPoint.longitude == null) {
    return null;
  }

  return checkGeofence(current, {
    latitude: accessPoint.latitude,
    longitude: accessPoint.longitude,
    allowedRadiusMeters: accessPoint.allowedRadiusMeters,
  });
}
