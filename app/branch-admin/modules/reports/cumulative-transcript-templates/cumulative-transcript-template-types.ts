/**
 * cumulative-transcript-templates/cumulative-transcript-template-types.ts
 * --------------------------------------------------------------------------
 * Shared cumulative-transcript contracts with frozen assessment history.
 */

import type {
  AssessmentReportProjection,
  AssessmentReportProjectionSettings,
} from "../../../../lib/assessments";

import type {
  ReportCardTemplateSetting,
} from "../../../../lib/db/db";

import type {
  ReportHeaderData,
} from "../engine/report-types";

import type {
  StudentCumulativeTranscript,
} from "../engine/cumulative-report-types";

export type CumulativeTranscriptTemplateCode =
  | "cumulative_transcript_classic"
  | "cumulative_transcript_official"
  | "cumulative_transcript_modern"
  | "cumulative_transcript_compact"
  | string;

export type CumulativeTranscriptSettings =
  Partial<ReportCardTemplateSetting> & {
    templateCode?: string;
    templateName?: string;
    layoutKey?: string;
    templateKey?: string;
    density?: string;
  };

export interface HistoricalAssessmentSubject {
  subjectId?: string;
  classSubjectId?: string;
  subjectName: string;
  subjectCode?: string;
  assessmentProjection?: AssessmentReportProjection;
  assessmentReportSettings?: AssessmentReportProjectionSettings;
}

export interface AssessmentAwareCumulativeTranscript
  extends StudentCumulativeTranscript {
  historicalAssessmentSubjects?: HistoricalAssessmentSubject[];
}

export interface CumulativeTranscriptTemplateDataset {
  header?: ReportHeaderData;
  transcript?: AssessmentAwareCumulativeTranscript | null;
  generatedAt?: string | number | Date | null;
  assessmentReportSettings?: AssessmentReportProjectionSettings;
}

export interface CumulativeTranscriptTemplateProps {
  dataset?: CumulativeTranscriptTemplateDataset | null;
  header?: ReportHeaderData;
  transcript?: AssessmentAwareCumulativeTranscript | null;
  settings?: CumulativeTranscriptSettings | null;
  compact?: boolean;
  showWatermark?: boolean;
  pageBreakAfter?: boolean;
}
