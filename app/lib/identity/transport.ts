import {
  db,
  type SchoolVehicle,
  type StudentTransportAssignment,
  type TransportJourney,
  type TransportJourneyEvent,
  type TransportRoute,
  type TransportStop,
} from "../db/db";
import type {
  IdentityMutationContext,
  TransportJourneyEventType,
} from "./types";
import { newSyncRecord, touchSyncRecord } from "./exports";

export async function createSchoolVehicle(
  context: IdentityMutationContext,
  input: Omit<
    SchoolVehicle,
    | "id"
    | "accountId"
    | "schoolId"
    | "branchId"
    | "createdAt"
    | "updatedAt"
    | "version"
    | "deviceId"
    | "createdByDeviceId"
    | "updatedByDeviceId"
    | "synced"
    | "isDeleted"
  >,
): Promise<SchoolVehicle> {
  const record: SchoolVehicle = {
    ...newSyncRecord(context),
    schoolId: context.schoolId,
    branchId: context.branchId ?? "",
    ...input,
    active: input.active ?? true,
  };
  await db.schoolVehicles.add(record);
  return record;
}

export async function createTransportRoute(
  context: IdentityMutationContext,
  input: Pick<TransportRoute, "name" | "code" | "description">,
): Promise<TransportRoute> {
  const route: TransportRoute = {
    ...newSyncRecord(context),
    schoolId: context.schoolId,
    branchId: context.branchId ?? "",
    name: input.name.trim(),
    code: input.code ?? null,
    description: input.description ?? null,
    active: true,
  };
  await db.transportRoutes.add(route);
  return route;
}

export async function createTransportStop(
  context: IdentityMutationContext,
  input: Pick<
    TransportStop,
    | "routeId"
    | "name"
    | "order"
    | "latitude"
    | "longitude"
    | "accuracyMeters"
    | "expectedArrivalMinute"
    | "expectedDepartureMinute"
  >,
): Promise<TransportStop> {
  const stop: TransportStop = {
    ...newSyncRecord(context),
    schoolId: context.schoolId,
    branchId: context.branchId ?? "",
    routeId: input.routeId,
    name: input.name.trim(),
    order: input.order,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    accuracyMeters: input.accuracyMeters ?? null,
    expectedArrivalMinute: input.expectedArrivalMinute ?? null,
    expectedDepartureMinute: input.expectedDepartureMinute ?? null,
    active: true,
  };
  await db.transportStops.add(stop);
  return stop;
}

export async function assignStudentTransport(
  context: IdentityMutationContext,
  input: Pick<
    StudentTransportAssignment,
    | "studentId"
    | "routeId"
    | "vehicleId"
    | "pickupStopId"
    | "dropoffStopId"
    | "validFrom"
    | "validUntil"
  >,
): Promise<StudentTransportAssignment> {
  const assignment: StudentTransportAssignment = {
    ...newSyncRecord(context),
    schoolId: context.schoolId,
    branchId: context.branchId ?? "",
    studentId: input.studentId,
    routeId: input.routeId,
    vehicleId: input.vehicleId ?? null,
    pickupStopId: input.pickupStopId ?? null,
    dropoffStopId: input.dropoffStopId ?? null,
    validFrom: input.validFrom ?? context.now ?? Date.now(),
    validUntil: input.validUntil ?? null,
    status: "active",
    active: true,
  };
  await db.studentTransportAssignments.add(assignment);
  return assignment;
}

export async function startTransportJourney(
  context: IdentityMutationContext,
  input: Pick<
    TransportJourney,
    "vehicleId" | "routeId" | "date" | "direction" | "note"
  >,
): Promise<TransportJourney> {
  const now = context.now ?? Date.now();
  const journey: TransportJourney = {
    ...newSyncRecord({ ...context, now }),
    schoolId: context.schoolId,
    branchId: context.branchId ?? "",
    vehicleId: input.vehicleId,
    routeId: input.routeId ?? null,
    date: input.date,
    direction: input.direction,
    startedAt: now,
    startedByUserId: context.userId ?? null,
    status: "in_transit",
    note: input.note ?? null,
  };
  await db.transportJourneys.add(journey);
  return journey;
}

export async function recordTransportJourneyEvent(
  context: IdentityMutationContext,
  input: Pick<
    TransportJourneyEvent,
    | "journeyId"
    | "studentId"
    | "assignmentId"
    | "stopId"
    | "credentialId"
    | "identityActivityEventId"
    | "latitude"
    | "longitude"
    | "accuracyMeters"
    | "note"
  > & { eventType: TransportJourneyEventType },
): Promise<TransportJourneyEvent> {
  const occurredAt = context.now ?? Date.now();

  const existing = await db.transportJourneyEvents
    .where("journeyId")
    .equals(input.journeyId)
    .toArray();

  const duplicate = existing.find(
    (event) =>
      !event.isDeleted &&
      event.studentId === input.studentId &&
      event.eventType === input.eventType,
  );

  if (duplicate) {
    throw new Error(
      `Student already has a "${input.eventType}" event for this journey.`,
    );
  }

  const event: TransportJourneyEvent = {
    ...newSyncRecord({ ...context, now: occurredAt }),
    schoolId: context.schoolId,
    branchId: context.branchId ?? "",
    journeyId: input.journeyId,
    studentId: input.studentId,
    assignmentId: input.assignmentId ?? null,
    stopId: input.stopId ?? null,
    credentialId: input.credentialId ?? null,
    identityActivityEventId: input.identityActivityEventId ?? null,
    eventType: input.eventType,
    occurredAt,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    accuracyMeters: input.accuracyMeters ?? null,
    capturedByUserId: context.userId ?? null,
    note: input.note ?? null,
  };

  await db.transportJourneyEvents.add(event);
  return event;
}

export async function completeTransportJourney(
  context: IdentityMutationContext,
  journeyId: string,
): Promise<void> {
  const journey = await db.transportJourneys.get(journeyId);
  if (!journey) throw new Error("Transport journey was not found.");

  const now = context.now ?? Date.now();
  await db.transportJourneys.update(journeyId, {
    arrivedAt: journey.arrivedAt ?? now,
    completedAt: now,
    status: "completed",
    ...touchSyncRecord(journey, { ...context, now }),
  });
}
