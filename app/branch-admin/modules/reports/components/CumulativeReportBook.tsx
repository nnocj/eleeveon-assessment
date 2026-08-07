"use client";

/**
 * reports/components/CumulativeReportBook.tsx
 * --------------------------------------------------------------------------
 * Historical assessment-aware compatibility wrapper.
 */

import React, {
  useMemo,
} from "react";

import CumulativeReportBookImplementation from "../cumulative-book/CumulativeReportBook";

import {
  hydrateStudentReportCardDataset,
} from "../reportSnapshotService";

import type {
  CumulativeReportBookProps,
} from "../cumulative-book/cumulative-book-types";

export type {
  CumulativeReportBookDataset,
  CumulativeReportBookProps,
  CumulativeReportBookSettings,
  CumulativeBookPeriodDataset,
} from "../cumulative-book/cumulative-book-types";

export default function CumulativeReportBook(
  props: CumulativeReportBookProps,
) {
  const dataset = useMemo(() => {
    if (!props.dataset) return props.dataset;

    return {
      ...props.dataset,
      periods: props.dataset.periods
        .map((period) => {
          const hydrated =
            hydrateStudentReportCardDataset(
              (period as any).snapshot ||
              (period as any).rawSnapshot ||
              (period as any).reportData ||
              period.dataset,
            );

          return hydrated
            ? {
                ...period,
                dataset: hydrated,
              }
            : period;
        })
        .filter(
          (period) =>
            Boolean(period.dataset),
        ),
    };
  }, [props.dataset]);

  return (
    <CumulativeReportBookImplementation
      {...props}
      dataset={dataset}
    />
  );
}
