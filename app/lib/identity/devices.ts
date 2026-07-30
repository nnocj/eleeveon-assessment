import { db, type IdentityDevice } from "../db/db";
import {
  CAPABILITY_BY_CREDENTIAL_TYPE,
  IDENTITY_DEVICE_OFFLINE_AFTER_MS,
} from "./constants";
import type {
  IdentityCredentialType,
  IdentityDeviceCapability,
  IdentityMutationContext,
} from "./types";
import { newSyncRecord, touchSyncRecord } from "./exports";

export interface RegisterIdentityDeviceInput {
  name: string;
  deviceType: IdentityDevice["deviceType"];
  code?: string | null;
  provider?: string | null;
  providerDeviceId?: string | null;
  serialNumber?: string | null;
  platform?: string | null;
  appVersion?: string | null;
  firmwareVersion?: string | null;
  accessPointId?: string | null;
  locationLabel?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  capabilities?: IdentityDeviceCapability[];
  metadata?: Record<string, unknown>;
}

export async function registerIdentityDevice(
  context: IdentityMutationContext,
  input: RegisterIdentityDeviceInput,
): Promise<IdentityDevice> {
  const now = context.now ?? Date.now();
  const record: IdentityDevice = {
    ...newSyncRecord({ ...context, now }),
    schoolId: context.schoolId,
    branchId: context.branchId ?? null,
    name: input.name.trim(),
    code: input.code ?? null,
    deviceType: input.deviceType,
    provider: input.provider ?? null,
    providerDeviceId: input.providerDeviceId ?? null,
    serialNumber: input.serialNumber ?? null,
    platform: input.platform ?? null,
    appVersion: input.appVersion ?? null,
    firmwareVersion: input.firmwareVersion ?? null,
    accessPointId: input.accessPointId ?? null,
    locationLabel: input.locationLabel ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    capabilities: input.capabilities ?? [],
    lastSeenAt: now,
    lastSyncAt: now,
    status: "online",
    active: true,
    metadata: input.metadata,
  };

  await db.identityDevices.add(record);
  return record;
}

export async function heartbeatIdentityDevice(
  context: IdentityMutationContext,
  deviceId: string,
  patch?: Pick<
    Partial<IdentityDevice>,
    "appVersion" | "firmwareVersion" | "latitude" | "longitude" | "locationLabel"
  >,
): Promise<void> {
  const current = await db.identityDevices.get(deviceId);
  if (!current) throw new Error("Identity device was not found.");

  const now = context.now ?? Date.now();
  await db.identityDevices.update(deviceId, {
    ...patch,
    lastSeenAt: now,
    lastSyncAt: now,
    status: "online",
    ...touchSyncRecord(current, { ...context, now }),
  });
}

export function identityDeviceIsOnline(
  device: IdentityDevice,
  now = Date.now(),
): boolean {
  if (device.active === false || device.status === "disabled") return false;
  if (device.status === "maintenance") return false;
  return (
    device.lastSeenAt != null &&
    now - device.lastSeenAt <= IDENTITY_DEVICE_OFFLINE_AFTER_MS
  );
}

export function deviceSupportsCredential(
  device: IdentityDevice,
  credentialType: IdentityCredentialType,
): boolean {
  const capability = CAPABILITY_BY_CREDENTIAL_TYPE[credentialType];
  return !capability || Boolean(device.capabilities?.includes(capability));
}
