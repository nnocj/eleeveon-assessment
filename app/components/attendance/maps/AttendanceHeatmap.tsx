"use client";

import { useMemo } from "react";

import {
  attendanceCaptureHeatmap,
} from "@/app/lib/attendance/maps";

import {
  DomainMap,
  type DomainHeatPoint,
} from "../../maps/DomainMap";

type Captures =
  Parameters<
    typeof attendanceCaptureHeatmap
  >[0];

export interface AttendanceHeatmapProps {
  captures: Captures;
  height?: number | string;
  loading?: boolean;
  minimumWeight?: number;
  normalizeWeights?: boolean;
}

export function AttendanceHeatmap({
  captures,
  height = 380,
  loading = false,
  minimumWeight = 0,
  normalizeWeights = false,
}: AttendanceHeatmapProps) {
  const heatmap = useMemo(() => {
    const points = attendanceCaptureHeatmap(
      captures,
    ).filter(
      (point) => point.weight >= minimumWeight,
    );

    if (!normalizeWeights || !points.length) {
      return points;
    }

    const maximum = Math.max(
      ...points.map((point) => point.weight),
      1,
    );

    return points.map((point) => ({
      ...point,
      weight: point.weight / maximum,
    }));
  }, [
    captures,
    minimumWeight,
    normalizeWeights,
  ]);

  return (
    <DomainMap
      heatmap={
        heatmap as readonly DomainHeatPoint[]
      }
      height={height}
      loading={loading}
      emptyTitle="No attendance heat data"
      emptyMessage="Capture density will appear when attendance events include coordinates."
    />
  );
}

export default AttendanceHeatmap;
