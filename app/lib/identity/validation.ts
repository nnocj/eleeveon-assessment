import type {
  IdentityCredential,
  IdentityMutationContext,
  IdentityScanPayload,
} from "./types";

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isValidLatitude(value: unknown): value is number {
  return isFiniteCoordinate(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: unknown): value is number {
  return isFiniteCoordinate(value) && value >= -180 && value <= 180;
}

export function validateMutationContext(
  context: IdentityMutationContext,
): ValidationResult {
  const errors: string[] = [];
  if (!isNonEmptyString(context.accountId)) errors.push("accountId is required.");
  if (!isNonEmptyString(context.schoolId)) errors.push("schoolId is required.");
  if (!isNonEmptyString(context.deviceId)) errors.push("deviceId is required.");
  return { ok: errors.length === 0, errors };
}

export function validateCredential(
  credential: Pick<
    IdentityCredential,
    "subjectType" | "subjectId" | "credentialType" | "status"
  >,
): ValidationResult {
  const errors: string[] = [];
  if (!isNonEmptyString(credential.subjectId)) errors.push("subjectId is required.");
  if (!isNonEmptyString(credential.subjectType)) errors.push("subjectType is required.");
  if (!isNonEmptyString(credential.credentialType)) errors.push("credentialType is required.");
  if (!isNonEmptyString(credential.status)) errors.push("status is required.");
  return { ok: errors.length === 0, errors };
}

export function validateScanPayload(
  payload: IdentityScanPayload,
): ValidationResult {
  const errors: string[] = [];
  if (!isNonEmptyString(payload.rawValue)) errors.push("rawValue is required.");
  if (!isNonEmptyString(payload.purpose)) errors.push("purpose is required.");

  if (
    payload.latitude != null &&
    !isValidLatitude(payload.latitude)
  ) {
    errors.push("latitude must be between -90 and 90.");
  }

  if (
    payload.longitude != null &&
    !isValidLongitude(payload.longitude)
  ) {
    errors.push("longitude must be between -180 and 180.");
  }

  if (
    payload.accuracyMeters != null &&
    (!Number.isFinite(payload.accuracyMeters) ||
      payload.accuracyMeters < 0)
  ) {
    errors.push("accuracyMeters must be zero or greater.");
  }

  return { ok: errors.length === 0, errors };
}

export function assertValid(
  result: ValidationResult,
  message = "Identity validation failed.",
): void {
  if (!result.ok) {
    throw new Error(`${message} ${result.errors.join(" ")}`);
  }
}
