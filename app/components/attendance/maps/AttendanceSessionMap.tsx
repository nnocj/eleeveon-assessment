"use client";

import { useMemo } from "react";

import {
  attendanceMapMarkers,
} from "@/app/lib/attendance/maps";

import {
  DomainMap,
  type DomainMapMarker,
} from "../../maps/DomainMap";

type AttendanceMapInput =
  Parameters<typeof attendanceMapMarkers>[0];

export interface AttendanceSessionMapProps {
  sessions: NonNullable<
    AttendanceMapInput["sessions"]
  >;
  selectedSessionId?: string | null;
  height?: number | string;
  loading?: boolean;
  onSessionSelect?: (
    marker: DomainMapMarker,
  ) => void;
}

export function AttendanceSessionMap({
  sessions,
  selectedSessionId,
  height = 360,
  loading = false,
  onSessionSelect,
}: AttendanceSessionMapProps) {
  const markers = useMemo(
    () => attendanceMapMarkers({ sessions }),
    [sessions],
  );

  return (
    <DomainMap
      markers={markers}
      selectedMarkerId={selectedSessionId}
      height={height}
      loading={loading}
      emptyTitle="No located attendance sessions"
      emptyMessage="Sessions linked to a coordinate or access point will appear here."
      onMarkerClick={onSessionSelect}
    />
  );
}

export default AttendanceSessionMap;
