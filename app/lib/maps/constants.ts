export const EARTH_RADIUS_METERS = 6_371_008.8;
export const METERS_PER_KILOMETER = 1_000;
export const METERS_PER_MILE = 1_609.344;

export const DEFAULT_MAP_CENTER = {
  latitude: 5.6037,
  longitude: -0.1870,
} as const;

export const DEFAULT_MAP_ZOOM = 12;
export const DEFAULT_DETAIL_ZOOM = 17;
export const DEFAULT_CLUSTER_RADIUS_PIXELS = 56;
export const DEFAULT_GEOFENCE_RADIUS_METERS = 75;
export const DEFAULT_LOCATION_STALE_AFTER_MS = 5 * 60_000;
export const DEFAULT_TRACKING_MAX_ACCURACY_METERS = 100;
export const DEFAULT_WALKING_SPEED_METERS_PER_SECOND = 1.4;
export const DEFAULT_DRIVING_SPEED_METERS_PER_SECOND = 8.33;
export const DEFAULT_AREA_APPROXIMATION_METERS = 500;

export const MIN_LATITUDE = -90;
export const MAX_LATITUDE = 90;
export const MIN_LONGITUDE = -180;
export const MAX_LONGITUDE = 180;
export const MIN_MAP_ZOOM = 0;
export const MAX_MAP_ZOOM = 22;

export const MAP_LAYER_IDS = {
  SCHOOLS: "schools",
  BRANCHES: "branches",
  STUDENTS: "students",
  TEACHERS: "teachers",
  PARENTS: "parents",
  ACCESS_POINTS: "identity-access-points",
  DEVICES: "identity-devices",
  IDENTITY_ACTIVITY: "identity-activity",
  ATTENDANCE_CAPTURE: "attendance-capture",
  VEHICLES: "vehicles",
  TRANSPORT_STOPS: "transport-stops",
  JOURNEY_EVENTS: "transport-journey-events",
  EMERGENCY: "emergency",
} as const;
