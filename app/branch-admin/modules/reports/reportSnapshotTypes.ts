/**
 * reports/reportSnapshotTypes.ts
 * --------------------------------------------------------------------------
 * Versioned historical report snapshot contracts.
 *
 * Issued reports must not change when assessment structures, report visibility
 * rules, template settings or grading configurations are edited later.
 */

import type {
  AssessmentReportProjection,
  AssessmentReportProjectionSettings,
} from "../../../lib/assessments";

import type {
  ComputedStudentReport,
  StudentReportCardDataset,
  StudentSubjectResult,
} from "./engine/report-types";

import type {
  ReportCardTemplateLike,
  StudentReportTemplateSettings,
} from "./shared/ReportTemplateTypes";

export const REPORT_SNAPSHOT_SCHEMA_VERSION = 2 as const;

export type ReportSnapshotSchemaVersion =
  typeof REPORT_SNAPSHOT_SCHEMA_VERSION;

export interface FrozenAssessmentSubjectSnapshot {
  subjectId?: string;
  classSubjectId?: string;
  subjectName: string;
  subjectCode?: string;

  assessmentStructureId?: string;
  gradingStructureId?: string;
  /** @deprecated Preserved when hydrating schema-v2 snapshots. */
  gradingSystemId?: string;

  assessmentProjection?: AssessmentReportProjection;
  assessmentReportSettings?: AssessmentReportProjectionSettings;

  rawTotal: number;
  rawMaxTotal: number;
  weightedTotal: number;
  totalWeight: number;
  percentage: number;

  grade?: string;
  remark?: string;
  gpa?: number;
  subjectPosition?: number;

  breakdown: StudentSubjectResult["breakdown"];
}

export interface FrozenStudentReportSnapshotPayload {
  schemaVersion: ReportSnapshotSchemaVersion;
  generatedAt: number;

  report: ComputedStudentReport;
  dataset: StudentReportCardDataset;

  template?: ReportCardTemplateLike | null;
  templateSettings: Partial<StudentReportTemplateSettings>;

  assessmentReportSettings?: AssessmentReportProjectionSettings;
  assessmentSubjects: FrozenAssessmentSubjectSnapshot[];

  assessmentStructureHashes?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface CreateReportSnapshotInput {
  dataset: StudentReportCardDataset;
  template?: ReportCardTemplateLike | null;
  templateSettings?: Partial<StudentReportTemplateSettings> | null;
  assessmentStructureHashes?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface PersistStudentReportSnapshotInput
  extends CreateReportSnapshotInput {
  accountId: string;
  schoolId: string;
  branchId: string;
  studentId: string;
  classId: string;
  academicStructureId: string;
  academicPeriodId: string;
  reportCardId?: string | null;
  snapshotType?: "terminal" | "promotion" | "manual" | string;
  academicYear?: string | null;
  term?: string | null;
  total?: number | null;
  average?: number | null;
  position?: number | null;
  recommendation?: string | null;
  promotedToClassId?: string | null;
}

export interface HydratedHistoricalReport {
  payload: FrozenStudentReportSnapshotPayload | null;
  dataset: StudentReportCardDataset | null;
  migratedFromLegacy: boolean;
}