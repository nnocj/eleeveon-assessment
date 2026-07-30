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

export interface TeacherClockMapProps {
  teacherAttendances: NonNullable<
    AttendanceMapInput["teacherAttendances"]
  >;
  teachers?: AttendanceMapInput["teachers"];
  selectedAttendanceId?: string | null;
  height?: number | string;
  loading?: boolean;
  onClockSelect?: (
    marker: DomainMapMarker,
  ) => void;
}

export function TeacherClockMap({
  teacherAttendances,
  teachers,
  selectedAttendanceId,
  height = 380,
  loading = false,
  onClockSelect,
}: TeacherClockMapProps) {
  const markers = useMemo(
    () =>
      attendanceMapMarkers({
        teacherAttendances,
        teachers,
      }),
    [teacherAttendances, teachers],
  );

  return (
    <DomainMap
      markers={markers}
      selectedMarkerId={selectedAttendanceId}
      height={height}
      loading={loading}
      emptyTitle="No teacher clock locations"
      emptyMessage="Teacher clock-in and clock-out records with coordinates will appear here."
      onMarkerClick={onClockSelect}
    />
  );
}

export default TeacherClockMap;
