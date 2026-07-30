export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface Coordinate3D extends Coordinate {
  altitudeMeters?: number | null;
}

export interface LocatedCoordinate extends Coordinate3D {
  accuracyMeters?: number | null;
  capturedAt?: number | null;
  headingDegrees?: number | null;
  speedMetersPerSecond?: number | null;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapViewport {
  center: Coordinate;
  zoom: number;
  bounds?: MapBounds;
  bearing?: number;
  pitch?: number;
}

export type MapEntityType =
  | "school"
  | "branch"
  | "student"
  | "teacher"
  | "parent"
  | "guardian"
  | "visitor"
  | "identity_access_point"
  | "identity_device"
  | "identity_activity"
  | "attendance_capture"
  | "vehicle"
  | "transport_stop"
  | "transport_journey_event"
  | "emergency_assembly_point"
  | "custom";

export interface MapMarker {
  id: string;
  entityType: MapEntityType | string;
  coordinate: Coordinate;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  status?: string;
  layerId?: string;
  accountId?: string;
  schoolId?: string;
  branchId?: string | null;
  accuracyMeters?: number | null;
  occurredAt?: number | null;
  visible?: boolean;
  restricted?: boolean;
  metadata?: Record<string, unknown>;
  source?: unknown;
}

export interface MarkerCluster {
  id: string;
  coordinate: Coordinate;
  markerIds: string[];
  markers: MapMarker[];
  count: number;
  bounds: MapBounds;
  layerIds: string[];
}

export interface CircleGeofence {
  id?: string;
  center: Coordinate;
  radiusMeters: number;
  label?: string;
}

export interface PolygonGeofence {
  id?: string;
  points: Coordinate[];
  label?: string;
}

export type Geofence = CircleGeofence | PolygonGeofence;

export interface GeofenceCheckResult {
  inside: boolean;
  distanceToBoundaryMeters: number;
  nearestPoint?: Coordinate;
}

export interface RouteWaypoint extends Coordinate {
  id?: string;
  name?: string;
  stopDurationSeconds?: number;
  metadata?: Record<string, unknown>;
}

export interface RouteSegment {
  from: RouteWaypoint;
  to: RouteWaypoint;
  distanceMeters: number;
  estimatedDurationSeconds: number;
}

export interface RoutePlan {
  waypoints: RouteWaypoint[];
  segments: RouteSegment[];
  totalDistanceMeters: number;
  estimatedDurationSeconds: number;
  bounds: MapBounds | null;
}

export interface TrackingPoint extends LocatedCoordinate {
  id?: string;
  entityId: string;
  entityType?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface TrackingSnapshot {
  entityId: string;
  latest: TrackingPoint;
  previous?: TrackingPoint;
  distanceFromPreviousMeters: number;
  elapsedMilliseconds: number;
  calculatedSpeedMetersPerSecond: number;
  stale: boolean;
}

export interface TrackingTrail {
  entityId: string;
  points: TrackingPoint[];
  totalDistanceMeters: number;
  startedAt?: number;
  endedAt?: number;
  bounds: MapBounds | null;
}

export interface GeocodingAddress {
  addressLine1?: string;
  addressLine2?: string;
  locality?: string;
  city?: string;
  district?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  countryCode?: string;
  formattedAddress?: string;
}

export interface GeocodingResult extends GeocodingAddress {
  coordinate: Coordinate;
  confidence?: number;
  provider?: string;
  providerReference?: string;
  raw?: unknown;
}

export interface GeocodingProvider {
  geocode(query: string, options?: GeocodingOptions): Promise<GeocodingResult[]>;
  reverseGeocode(
    coordinate: Coordinate,
    options?: ReverseGeocodingOptions,
  ): Promise<GeocodingResult[]>;
}

export interface GeocodingOptions {
  countryCode?: string;
  bounds?: MapBounds;
  limit?: number;
  signal?: AbortSignal;
}

export interface ReverseGeocodingOptions {
  language?: string;
  limit?: number;
  signal?: AbortSignal;
}

export interface MapLocationLike {
  latitude?: number | null;
  longitude?: number | null;
  altitudeMeters?: number | null;
  accuracyMeters?: number | null;
  locationLabel?: string | null;
  formattedAddress?: string | null;
  mapVisible?: boolean;
}

export interface PersonMapLocationLike extends MapLocationLike {
  locationConsentGiven?: boolean;
  locationRestricted?: boolean;
  locationPrecision?: "exact" | "approximate" | "area_only" | string | null;
}

export interface MapEntityAdapter<T> {
  canAdapt(value: unknown): value is T;
  adapt(value: T): MapMarker | null;
}

export interface PrivacyOptions {
  allowRestricted?: boolean;
  requireConsent?: boolean;
  approximateAreaMeters?: number;
}

export interface GeometryPoint {
  x: number;
  y: number;
}

export interface LineProjectionResult {
  point: Coordinate;
  distanceMeters: number;
  segmentIndex: number;
  fraction: number;
}
