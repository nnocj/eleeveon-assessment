import type { BaseSync } from "../db/db";
import type { IdentityMutationContext } from "./types";
import { SyncStatus } from "../constants/syncStatus";

function createPermanentId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `att-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 12)}`;
}

export function newAttendanceSyncRecord(
  context: IdentityMutationContext,
): BaseSync {
  const now = context.now ?? Date.now();

  return {
    id: createPermanentId(),
    accountId: context.accountId,
    createdAt: now,
    updatedAt: now,
    version: 1,
    deviceId: context.deviceId,
    createdByDeviceId: context.deviceId,
    updatedByDeviceId: context.deviceId,
    synced: SyncStatus.PENDING,
    isDeleted: false,
  };
}

export function touchAttendanceSyncRecord(
  current: Pick<BaseSync, "version">,
  context: IdentityMutationContext,
): Pick<
  BaseSync,
  "updatedAt" | "version" | "deviceId" | "updatedByDeviceId" | "synced"
> {
  return {
    updatedAt: context.now ?? Date.now(),
    version: Math.max(1, Number(current.version || 1)) + 1,
    deviceId: context.deviceId,
    updatedByDeviceId: context.deviceId,
    synced: SyncStatus.PENDING,
  };
}

export function attendanceDateKey(
  timestamp = Date.now(),
): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function attendanceTimeKey(
  timestamp = Date.now(),
): string {
  return new Date(timestamp).toISOString().slice(11, 19);
}

export function normalizeAttendanceNote(
  value?: string | null,
): string | undefined {
  const normalized = String(value ?? "").trim().replace(/\s+/g, " ");
  return normalized || undefined;
}

export function minutesSinceMidnight(
  timestamp = Date.now(),
): number {
  const date = new Date(timestamp);
  return date.getHours() * 60 + date.getMinutes();
}
