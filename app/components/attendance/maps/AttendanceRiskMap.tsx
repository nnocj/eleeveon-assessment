"use client";

import { useMemo } from "react";

import {
  attendanceSummaryRiskMarkers,
} from "@/app/lib/attendance/maps";

import {
  DomainMap,
  type DomainMapMarker,
} from "../../maps/DomainMap";

type RiskSummaries =
  Parameters<
    typeof attendanceSummaryRiskMarkers
  >[0];

type RiskStudents =
  Parameters<
    typeof attendanceSummaryRiskMarkers
  >[1];

type RiskOptions =
  Parameters<
    typeof attendanceSummaryRiskMarkers
  >[2];

export interface AttendanceRiskMapProps {
  summaries: RiskSummaries;
  students: RiskStudents;
  minimumAttendancePercent?: number;
  options?: RiskOptions;
  selectedMarkerId?: string | null;
  height?: number | string;
  loading?: boolean;
  onRiskSelect?: (
    marker: DomainMapMarker,
  ) => void;
}

export function AttendanceRiskMap({
  summaries,
  students,
  minimumAttendancePercent = 75,
  options,
  selectedMarkerId,
  height = 380,
  loading = false,
  onRiskSelect,
}: AttendanceRiskMapProps) {
  const markers = useMemo(
    () =>
      attendanceSummaryRiskMarkers(
        summaries,
        students,
        {
          ...options,
          minimumAttendancePercent,
        },
      ),
    [
      summaries,
      students,
      options,
      minimumAttendancePercent,
    ],
  );

  return (
    <DomainMap
      markers={markers}
      selectedMarkerId={selectedMarkerId}
      height={height}
      loading={loading}
      emptyTitle="No attendance risks on the map"
      emptyMessage="Only students below the threshold with permitted location data are shown."
      onMarkerClick={onRiskSelect}
    />
  );
}

export default AttendanceRiskMap;
