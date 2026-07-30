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

export interface AttendanceOverviewMapProps
  extends AttendanceMapInput {
  selectedMarkerId?: string | null;
  height?: number | string;
  loading?: boolean;
  onMarkerSelect?: (
    marker: DomainMapMarker,
  ) => void;
}

export function AttendanceOverviewMap({
  captures,
  studentAttendances,
  teacherAttendances,
  devices,
  sessions,
  students,
  teachers,
  selectedMarkerId,
  height = 400,
  loading = false,
  onMarkerSelect,
}: AttendanceOverviewMapProps) {
  const markers = useMemo(
    () =>
      attendanceMapMarkers({
        captures,
        studentAttendances,
        teacherAttendances,
        devices,
        sessions,
        students,
        teachers,
      }),
    [
      captures,
      studentAttendances,
      teacherAttendances,
      devices,
      sessions,
      students,
      teachers,
    ],
  );

  return (
    <DomainMap
      markers={markers}
      selectedMarkerId={selectedMarkerId}
      height={height}
      loading={loading}
      emptyTitle="No attendance locations"
      emptyMessage="Attendance captures, devices, sessions and located people will appear here."
      onMarkerClick={onMarkerSelect}
    />
  );
}

export default AttendanceOverviewMap;
