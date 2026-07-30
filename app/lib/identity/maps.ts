import type {
  Parent,
  Student,
  Teacher,
} from "../db/db";

import {
  DEFAULT_AREA_APPROXIMATION_METERS,
  MAP_LAYER_IDS,
  checkGeofence as checkCoreGeofence,
  coordinateFrom,
  createMapMarker,
  deterministicApproximateCoordinate,
  formatCoordinate,
  genericEntityToMarker,
  haversineDistanceMeters,
  sortMarkersByDistance,
  type Coordinate,
  type MapMarker,
  type PrivacyOptions,
} from "../maps";

import {
  IDENTITY_DEFAULT_GEOFENCE_RADIUS_METERS,
} from "./constants";

import type {
  GeofenceResult,
  IdentityAccessPoint,
  IdentityActivityEvent,
  IdentityDevice,
  MapLocationFields,
  TransportStop,
  VisitorProfile,
} from "./types";

/**
 * Identity → Maps bridge.
 *
 * Generic map mathematics and rendering-neutral contracts belong in `lib/maps`.
 * This file only converts identity and school-domain records into shared
 * `MapMarker` objects, while preserving the former helper exports as thin
 * compatibility wrappers for existing callers.
 */

export interface IdentityMapAdapterOptions {
  imageUrl?: string;
  subtitle?: string;
  description?: string;
  privacy?: PrivacyOptions;
  visible?: boolean;
  metadata?: Record<string, unknown>;
}

export interface VisitorMapContext extends IdentityMapAdapterOptions {
  coordinate?: Coordinate | null;
  activityEvent?: IdentityActivityEvent | null;
  accessPoint?: IdentityAccessPoint | null;
}

function activeRecord(value: {
  active?: boolean;
  isDeleted?: boolean;
}): boolean {
  return !value.isDeleted && value.active !== false;
}

function text(value: unknown): string | undefined {
  const normalized = String(value ?? "").trim();
  return normalized || undefined;
}

function personStatus(
  person: Student | Teacher | Parent,
): string {
  if ("status" in person && person.status) {
    return String(person.status);
  }

  if ("active" in person && person.active === false) {
    return "inactive";
  }

  return "active";
}

function personCoordinate(
  person: Student | Teacher | Parent,
  options?: PrivacyOptions,
): Coordinate | null {
  if (person.mapVisible === false || person.isDeleted) return null;
  if (person.locationRestricted && !options?.allowRestricted) return null;

  if (
    options?.requireConsent !== false &&
    person.locationConsentGiven !== true
  ) {
    return null;
  }

  const exact = coordinateFrom(person);
  if (!exact) return null;

  if (
    person.locationPrecision === "approximate" ||
    person.locationPrecision === "area_only"
  ) {
    return deterministicApproximateCoordinate(
      exact,
      person.id,
      options?.approximateAreaMeters ??
        DEFAULT_AREA_APPROXIMATION_METERS,
    );
  }

  return exact;
}

function personToMarker(
  person: Student | Teacher | Parent,
  entityType: "student" | "teacher" | "parent",
  layerId: string,
  options: IdentityMapAdapterOptions = {},
): MapMarker | null {
  const coordinate = personCoordinate(
    person,
    options.privacy ?? { requireConsent: true },
  );

  if (!coordinate) return null;

  return createMapMarker({
    id: person.id,
    entityType,
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    title: person.fullName,
    subtitle:
      options.subtitle ??
      text(person.locationLabel) ??
      text(person.formattedAddress) ??
      text(person.address),
    description: options.description,
    layerId,
    status: personStatus(person),
    schoolId: person.schoolId,
    branchId: person.branchId,
    imageUrl: options.imageUrl ?? text(person.photo),
    icon: entityType,
    accuracyMeters: person.accuracyMeters,
    restricted: Boolean(person.locationRestricted),
    metadata: {
      locationType: person.locationType ?? null,
      locationPrecision: person.locationPrecision ?? null,
      locationSource: person.locationSource ?? null,
      ...options.metadata,
    },
    source: person,
  });
}

export function studentToMapMarker(
  student: Student,
  options: IdentityMapAdapterOptions = {},
): MapMarker | null {
  return personToMarker(
    student,
    "student",
    MAP_LAYER_IDS.STUDENTS,
    options,
  );
}

export function teacherToMapMarker(
  teacher: Teacher,
  options: IdentityMapAdapterOptions = {},
): MapMarker | null {
  return personToMarker(
    teacher,
    "teacher",
    MAP_LAYER_IDS.TEACHERS,
    options,
  );
}

export function parentToMapMarker(
  parent: Parent,
  options: IdentityMapAdapterOptions = {},
): MapMarker | null {
  return personToMarker(
    parent,
    "parent",
    MAP_LAYER_IDS.PARENTS,
    options,
  );
}

export function accessPointToMapMarker(
  accessPoint: IdentityAccessPoint,
  options: IdentityMapAdapterOptions = {},
): MapMarker | null {
  if (!activeRecord(accessPoint)) return null;

  return genericEntityToMarker(
    {
      ...accessPoint,
      formattedAddress: accessPoint.locationLabel,
      mapVisible: true,
    },
    {
      entityType: "identity_access_point",
      layerId: MAP_LAYER_IDS.ACCESS_POINTS,
      icon: "access-point",
      subtitle:
        options.subtitle ??
        text(accessPoint.locationLabel) ??
        text(accessPoint.accessPointType),
      imageUrl: options.imageUrl,
      privacy: options.privacy,
    },
  );
}

export function deviceToMapMarker(
  device: IdentityDevice,
  options: IdentityMapAdapterOptions = {},
): MapMarker | null {
  if (!activeRecord(device)) return null;

  const coordinate = coordinateFrom(device);
  if (!coordinate) return null;

  return createMapMarker({
    id: device.id,
    entityType: "identity_device",
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    title: device.name,
    subtitle:
      options.subtitle ??
      text(device.locationLabel) ??
      text(device.deviceType),
    description: options.description,
    layerId: MAP_LAYER_IDS.DEVICES,
    status: device.status ?? "offline",
    schoolId: device.schoolId,
    branchId: device.branchId ?? null,
    icon: "identity-device",
    occurredAt: device.lastSeenAt ?? null,
    metadata: {
      code: device.code ?? null,
      capabilities: device.capabilities ?? [],
      platform: device.platform ?? null,
      appVersion: device.appVersion ?? null,
      firmwareVersion: device.firmwareVersion ?? null,
      accessPointId: device.accessPointId ?? null,
      ...options.metadata,
    },
    source: device,
  });
}

export function activityEventToMapMarker(
  event: IdentityActivityEvent,
  options: IdentityMapAdapterOptions = {},
): MapMarker | null {
  if (event.isDeleted) return null;

  const coordinate = coordinateFrom(event);
  if (!coordinate) return null;

  return createMapMarker({
    id: event.id,
    entityType: "identity_activity",
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    title:
      options.subtitle ??
      `${event.subjectType.replaceAll("_", " ")} · ${event.purpose.replaceAll("_", " ")}`,
    subtitle:
      text(event.note) ??
      text(event.failureMessage) ??
      text(event.action),
    description: options.description,
    layerId: MAP_LAYER_IDS.IDENTITY_ACTIVITY,
    status: event.outcome,
    schoolId: event.schoolId,
    branchId: event.branchId ?? null,
    icon: "identity-activity",
    accuracyMeters: event.accuracyMeters,
    occurredAt: event.occurredAt,
    metadata: {
      subjectType: event.subjectType,
      subjectId: event.subjectId,
      purpose: event.purpose,
      verificationStatus: event.verificationStatus,
      credentialId: event.credentialId ?? null,
      identityDeviceId: event.identityDeviceId ?? null,
      accessPointId: event.accessPointId ?? null,
      relatedTable: event.relatedTable ?? null,
      relatedRecordId: event.relatedRecordId ?? null,
      failureCode: event.failureCode ?? null,
      ...event.metadata,
      ...options.metadata,
    },
    source: event,
  });
}

/**
 * Visitor profiles do not store a permanent home/location coordinate.
 * Their marker therefore comes from the associated visit activity, access point,
 * or an explicitly supplied temporary coordinate.
 */
export function visitorToMapMarker(
  visitor: VisitorProfile,
  context: VisitorMapContext = {},
): MapMarker | null {
  if (!activeRecord(visitor) || visitor.blocked) return null;

  const coordinate =
    context.coordinate ??
    coordinateFrom(context.activityEvent ?? undefined) ??
    coordinateFrom(context.accessPoint ?? undefined);

  if (!coordinate) return null;

  return createMapMarker({
    id: visitor.id,
    entityType: "visitor",
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    title: visitor.fullName,
    subtitle:
      context.subtitle ??
      text(visitor.organizationName) ??
      text(context.accessPoint?.name),
    description: context.description,
    layerId: MAP_LAYER_IDS.IDENTITY_ACTIVITY,
    status: visitor.blocked ? "blocked" : "active",
    schoolId: visitor.schoolId,
    branchId: visitor.branchId,
    imageUrl: context.imageUrl,
    icon: "visitor",
    occurredAt:
      context.activityEvent?.occurredAt ??
      visitor.lastVisitAt ??
      null,
    metadata: {
      phone: visitor.phone ?? null,
      email: visitor.email ?? null,
      accessPointId: context.accessPoint?.id ?? null,
      activityEventId: context.activityEvent?.id ?? null,
      ...visitor.metadata,
      ...context.metadata,
    },
    source: visitor,
  });
}

export function transportStopToMapMarker(
  stop: TransportStop,
  options: IdentityMapAdapterOptions = {},
): MapMarker | null {
  if (!activeRecord(stop)) return null;

  const coordinate = coordinateFrom(stop);
  if (!coordinate) return null;

  return createMapMarker({
    id: stop.id,
    entityType: "transport_stop",
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    title: stop.name,
    subtitle:
      options.subtitle ??
      `Stop ${Math.max(1, Number(stop.order || 1))}`,
    description: options.description,
    layerId: MAP_LAYER_IDS.TRANSPORT_STOPS,
    status: stop.active === false ? "inactive" : "active",
    schoolId: stop.schoolId,
    branchId: stop.branchId,
    icon: "transport-stop",
    accuracyMeters: stop.accuracyMeters,
    metadata: {
      routeId: stop.routeId,
      order: stop.order,
      expectedArrivalMinute: stop.expectedArrivalMinute ?? null,
      expectedDepartureMinute: stop.expectedDepartureMinute ?? null,
      ...options.metadata,
    },
    source: stop,
  });
}

export function identityEntitiesToMapMarkers(input: {
  students?: readonly Student[];
  teachers?: readonly Teacher[];
  parents?: readonly Parent[];
  accessPoints?: readonly IdentityAccessPoint[];
  devices?: readonly IdentityDevice[];
  activityEvents?: readonly IdentityActivityEvent[];
  transportStops?: readonly TransportStop[];
  personPrivacy?: PrivacyOptions;
}): MapMarker[] {
  return [
    ...(input.students ?? []).map((item) =>
      studentToMapMarker(item, { privacy: input.personPrivacy }),
    ),
    ...(input.teachers ?? []).map((item) =>
      teacherToMapMarker(item, { privacy: input.personPrivacy }),
    ),
    ...(input.parents ?? []).map((item) =>
      parentToMapMarker(item, { privacy: input.personPrivacy }),
    ),
    ...(input.accessPoints ?? []).map((item) =>
      accessPointToMapMarker(item),
    ),
    ...(input.devices ?? []).map((item) =>
      deviceToMapMarker(item),
    ),
    ...(input.activityEvents ?? []).map((item) =>
      activityEventToMapMarker(item),
    ),
    ...(input.transportStops ?? []).map((item) =>
      transportStopToMapMarker(item),
    ),
  ].filter((marker): marker is MapMarker => Boolean(marker));
}

/* -------------------------------------------------------------------------- */
/* Backward-compatible wrappers                                                */
/* -------------------------------------------------------------------------- */

export function hasCoordinates(
  value: Pick<MapLocationFields, "latitude" | "longitude">,
): value is MapLocationFields & Coordinate {
  return coordinateFrom(value) !== null;
}

export function calculateDistanceMeters(
  from: Coordinate,
  to: Coordinate,
): number {
  return haversineDistanceMeters(from, to);
}

export function checkGeofence(
  current: Coordinate,
  target: Coordinate & {
    allowedRadiusMeters?: number | null;
  },
  fallbackRadiusMeters =
    IDENTITY_DEFAULT_GEOFENCE_RADIUS_METERS,
): GeofenceResult {
  const radiusMeters =
    target.allowedRadiusMeters ??
    fallbackRadiusMeters;

  const result = checkCoreGeofence(current, {
    center: target,
    radiusMeters,
  });

  return {
    inside: result.inside,
    distanceMeters: haversineDistanceMeters(current, target),
    radiusMeters,
  };
}

export function nearestLocation<
  T extends {
    latitude?: number | null;
    longitude?: number | null;
  },
>(
  current: Coordinate,
  candidates: readonly T[],
): { item: T; distanceMeters: number } | null {
  const markerItems = candidates
    .map((item, index) => {
      const coordinate = coordinateFrom(item);
      if (!coordinate) return null;

      return {
        item,
        marker: createMapMarker({
          id: `identity-location:${index}`,
          entityType: "custom",
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          title: `Location ${index + 1}`,
        }),
      };
    })
    .filter(
      (
        value,
      ): value is {
        item: T;
        marker: MapMarker;
      } => Boolean(value),
    );

  const sorted = sortMarkersByDistance(
    markerItems.map((value) => value.marker),
    current,
  );

  const nearest = sorted[0];
  if (!nearest) return null;

  const match = markerItems.find(
    (value) => value.marker.id === nearest.id,
  );

  return match
    ? {
        item: match.item,
        distanceMeters: nearest.distanceMeters,
      }
    : null;
}

export function nearestAccessPoint(
  current: Coordinate,
  accessPoints: readonly IdentityAccessPoint[],
) {
  return nearestLocation(
    current,
    accessPoints.filter(activeRecord),
  );
}

export function nearestTransportStop(
  current: Coordinate,
  stops: readonly TransportStop[],
) {
  return nearestLocation(
    current,
    stops.filter(activeRecord),
  );
}

export function formatCoordinates(
  latitude?: number | null,
  longitude?: number | null,
  precision = 6,
): string {
  const coordinate = coordinateFrom({
    latitude,
    longitude,
  });

  return coordinate
    ? formatCoordinate(coordinate, precision)
    : "";
}