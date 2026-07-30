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

export interface AttendanceCaptureMapProps {
  captures: NonNullable<
    AttendanceMapInput["captures"]
  >;
  students?: AttendanceMapInput["students"];
  teachers?: AttendanceMapInput["teachers"];
  selectedCaptureId?: string | null;
  height?: number | string;
  loading?: boolean;
  onCaptureSelect?: (
    marker: DomainMapMarker,
  ) => void;
}

export function AttendanceCaptureMap({
  captures,
  students,
  teachers,
  selectedCaptureId,
  height = 380,
  loading = false,
  onCaptureSelect,
}: AttendanceCaptureMapProps) {
  const markers = useMemo(
    () =>
      attendanceMapMarkers({
        captures,
        students,
        teachers,
      }),
    [captures, students, teachers],
  );

  return (
    <DomainMap
      markers={markers}
      selectedMarkerId={selectedCaptureId}
      height={height}
      loading={loading}
      emptyTitle="No capture locations"
      emptyMessage="Verified attendance captures with coordinates will appear here."
      onMarkerClick={onCaptureSelect}
    />
  );
}

export default AttendanceCaptureMap;
