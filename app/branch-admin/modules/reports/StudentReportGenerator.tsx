"use client";

/**
 * reports/StudentReportGenerator.tsx
 * --------------------------------------------------------------------------
 * Small assessment-aware generation boundary used by report pages, previews
 * and future export jobs.
 */

import React, {
  useMemo,
} from "react";

import {
  buildReportEngineOutput,
} from "./engine/report-engine";

import type {
  ReportEngineDataset,
  ReportEngineOutput,
  ReportFiltersState,
} from "./engine/report-types";

import type {
  ReportCardTemplateSettingsLike,
  StudentReportTemplateSettings,
} from "./shared/ReportTemplateTypes";

import {
  resolveStudentAssessmentReportSettings,
} from "./shared/ReportTemplateUtils";

export interface StudentReportGeneratorProps {
  dataset: ReportEngineDataset;
  filters: ReportFiltersState;
  templateSettings?:
    | ReportCardTemplateSettingsLike
    | Partial<StudentReportTemplateSettings>
    | null;
  children(
    output: ReportEngineOutput,
  ): React.ReactNode;
}

export function generateStudentReports(
  dataset: ReportEngineDataset,
  filters: ReportFiltersState,
  templateSettings?:
    | ReportCardTemplateSettingsLike
    | Partial<StudentReportTemplateSettings>
    | null,
): ReportEngineOutput {
  return buildReportEngineOutput(
    dataset,
    filters,
    resolveStudentAssessmentReportSettings(
      templateSettings,
    ),
  );
}

export default function StudentReportGenerator({
  dataset,
  filters,
  templateSettings,
  children,
}: StudentReportGeneratorProps) {
  const output = useMemo(
    () =>
      generateStudentReports(
        dataset,
        filters,
        templateSettings,
      ),
    [
      dataset,
      filters,
      templateSettings,
    ],
  );

  return <>{children(output)}</>;
}
