/**
 * reports/student-report-templates/student-report-template-types.ts
 * --------------------------------------------------------------------------
 * Assessment-aware public contracts for visual student report templates.
 */

import type {
  AssessmentReportProjection,
  AssessmentReportProjectionSettings,
} from "../../../../lib/assessments";

import type {
  StudentReportCardDataset,
  StudentSubjectResult,
} from "../engine/report-types";

import type {
  StudentReportTemplateBaseProps,
  StudentReportTemplateCode,
  StudentReportTemplateComponent,
  StudentReportTemplateDefinition,
  StudentReportTemplateLayoutKey,
  StudentReportTemplateSettings,
} from "../shared/ReportTemplateTypes";

export type {
  StudentReportTemplateBaseProps,
  StudentReportTemplateCode,
  StudentReportTemplateComponent,
  StudentReportTemplateDefinition,
  StudentReportTemplateLayoutKey,
  StudentReportTemplateSettings,
};

export interface AssessmentAwareStudentSubjectResult
  extends StudentSubjectResult {
  assessmentProjection?: AssessmentReportProjection;
  assessmentReportSettings?: AssessmentReportProjectionSettings;
}

export interface AssessmentAwareStudentReportDataset
  extends StudentReportCardDataset {
  assessmentReportSettings?: AssessmentReportProjectionSettings;
  report: StudentReportCardDataset["report"] & {
    subjectResults: AssessmentAwareStudentSubjectResult[];
  };
}

export interface AssessmentAwareStudentReportTemplateProps
  extends Omit<
    StudentReportTemplateBaseProps,
    "dataset"
  > {
  dataset: AssessmentAwareStudentReportDataset;
}
