"use client";

/**
 * reports/StudentReportPreview.tsx
 * --------------------------------------------------------------------------
 * Shared preview wrapper. It deliberately delegates all assessment visibility
 * and hierarchy decisions to StudentReportCard and the report projection.
 */

import React from "react";

import type {
  StudentReportCardDataset,
} from "./engine/report-types";

import type {
  ReportCardTemplateAssignmentLike,
  ReportCardTemplateLike,
  ReportCardTemplateSettingsLike,
  StudentReportTemplateSettings,
} from "./shared/ReportTemplateTypes";

import StudentReportCard from "./components/StudentReportCard";

export interface StudentReportPreviewProps {
  dataset?: StudentReportCardDataset;
  template?: ReportCardTemplateLike | null;
  templateSettings?:
    | ReportCardTemplateSettingsLike
    | Partial<StudentReportTemplateSettings>
    | null;
  templateAssignment?: ReportCardTemplateAssignmentLike | null;
  compact?: boolean;
  mobilePreview?: boolean;
}

export default function StudentReportPreview({
  dataset,
  template,
  templateSettings,
  templateAssignment,
  compact = false,
  mobilePreview = true,
}: StudentReportPreviewProps) {
  return (
    <StudentReportCard
      dataset={dataset}
      template={template}
      templateSettings={templateSettings}
      templateAssignment={templateAssignment}
      compact={compact}
      mobilePreview={mobilePreview}
      pageBreakAfter={false}
    />
  );
}
