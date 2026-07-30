import {
  DEFAULT_AREA_APPROXIMATION_METERS,
  MAP_LAYER_IDS,
} from "./constants";
import {
  coordinateFrom,
  deterministicApproximateCoordinate,
} from "./coordinates";
import type {
  MapEntityAdapter,
  MapLocationLike,
  MapMarker,
  PersonMapLocationLike,
  PrivacyOptions,
} from "./types";
import { createMapMarker } from "./markers";

type GenericEntity = MapLocationLike & {
  id?: string | number | null;
  accountId?: string | null;
  schoolId?: string | null;
  branchId?: string | null;
  fullName?: string | null;
  name?: string | null;
  title?: string | null;
  status?: string | null;
  active?: boolean;
  isDeleted?: boolean;
  photo?: string | null;
  locationRestricted?: boolean;
  locationConsentGiven?: boolean;
  locationPrecision?: string | null;
  [key: string]: unknown;
};

export function canDisplayMapLocation(
  entity: GenericEntity,
  options: PrivacyOptions = {},
): boolean {
  if (entity.isDeleted || entity.mapVisible === false) return false;
  if (!coordinateFrom(entity)) return false;
  if (entity.locationRestricted && !options.allowRestricted) return false;

  if (
    options.requireConsent &&
    "locationConsentGiven" in entity &&
    entity.locationConsentGiven !== true
  ) {
    return false;
  }

  return true;
}

export function genericEntityToMarker(
  entity: GenericEntity,
  input: {
    entityType: string;
    layerId?: string;
    fallbackTitle?: string;
    subtitle?: string;
    icon?: string;
    imageUrl?: string;
    privacy?: PrivacyOptions;
  },
): MapMarker | null {
  if (!canDisplayMapLocation(entity, input.privacy)) return null;

  let coordinate = coordinateFrom(entity);
  if (!coordinate) return null;

  if (
    entity.locationPrecision === "area_only" ||
    entity.locationPrecision === "approximate"
  ) {
    coordinate = deterministicApproximateCoordinate(
      coordinate,
      String(entity.id ?? `${coordinate.latitude}:${coordinate.longitude}`),
      input.privacy?.approximateAreaMeters ??
        DEFAULT_AREA_APPROXIMATION_METERS,
    );
  }

  return createMapMarker({
    id: String(entity.id ?? `${input.entityType}:${coordinate.latitude}:${coordinate.longitude}`),
    entityType: input.entityType,
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    title:
      String(entity.fullName ?? entity.name ?? input.fallbackTitle ?? "Location"),
    subtitle:
      input.subtitle ??
      String(entity.locationLabel ?? entity.formattedAddress ?? ""),
    layerId: input.layerId,
    status: entity.status ?? (entity.active === false ? "inactive" : "active"),
    schoolId: entity.schoolId ? String(entity.schoolId) : undefined,
    branchId:
      entity.branchId == null ? null : String(entity.branchId),
    imageUrl: input.imageUrl ?? (entity.photo ? String(entity.photo) : undefined),
    icon: input.icon,
    accuracyMeters: entity.accuracyMeters,
    restricted: Boolean(entity.locationRestricted),
    source: entity,
  });
}

export function createEntityAdapter<T>(
  canAdapt: (value: unknown) => value is T,
  adapt: (value: T) => MapMarker | null,
): MapEntityAdapter<T> {
  return { canAdapt, adapt };
}

export function adaptMany<T>(
  values: readonly T[],
  adapter: MapEntityAdapter<T>,
): MapMarker[] {
  return values
    .map((value) => adapter.adapt(value))
    .filter((marker): marker is MapMarker => Boolean(marker));
}

export const defaultSchoolAdapter = createEntityAdapter<GenericEntity>(
  (value): value is GenericEntity =>
    Boolean(value && typeof value === "object" && "latitude" in value),
  (value) =>
    genericEntityToMarker(value, {
      entityType: "school",
      layerId: MAP_LAYER_IDS.SCHOOLS,
      icon: "school",
    }),
);

export function createPersonAdapter(
  entityType: "student" | "teacher" | "parent" | "guardian",
  layerId: string,
  privacy: PrivacyOptions = {
    requireConsent: true,
  },
): MapEntityAdapter<PersonMapLocationLike & GenericEntity> {
  return createEntityAdapter(
    (value): value is PersonMapLocationLike & GenericEntity =>
      Boolean(value && typeof value === "object" && "latitude" in value),
    (value) =>
      genericEntityToMarker(value, {
        entityType,
        layerId,
        icon: entityType,
        privacy,
      }),
  );
}
