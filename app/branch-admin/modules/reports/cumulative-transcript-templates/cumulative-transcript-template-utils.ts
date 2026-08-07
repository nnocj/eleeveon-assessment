/**
 * cumulative-transcript-templates/cumulative-transcript-template-utils.ts
 * --------------------------------------------------------------------------
 * Extracts frozen assessment projections from historical snapshot rows.
 */

import type {
  AssessmentReportProjectionSettings,
} from "../../../../lib/assessments";

import {
  hydrateHistoricalReport,
} from "../reportSnapshotService";

import type {
  HistoricalAssessmentSubject,
  AssessmentAwareCumulativeTranscript,
  CumulativeTranscriptTemplateDataset,
} from "./cumulative-transcript-template-types";

function subjectKey(subject: any) {
  return String(
    subject?.classSubjectId ||
      subject?.subjectId ||
      subject?.subjectName ||
      subject?.name ||
      "",
  );
}

export function collectHistoricalAssessmentSubjects(
  transcript?: any | null,
): HistoricalAssessmentSubject[] {
  if (!transcript) return [];

  const byKey = new Map<
    string,
    HistoricalAssessmentSubject
  >();

  const periods = Array.isArray(
    transcript.periods,
  )
    ? transcript.periods
    : [];

  for (const period of periods) {
    const source =
      period.rawSnapshot ||
      period.snapshot ||
      period.reportData ||
      period;

    const hydrated =
      hydrateHistoricalReport(source);

    const subjects =
      hydrated.payload?.assessmentSubjects ||
      hydrated.dataset?.report
        ?.subjectResults ||
      period.subjectResults ||
      [];

    for (const subject of subjects) {
      const key = subjectKey(subject);
      if (!key) continue;

      const current = byKey.get(key);

      byKey.set(key, {
        subjectId:
          subject.subjectId ||
          current?.subjectId,
        classSubjectId:
          subject.classSubjectId ||
          current?.classSubjectId,
        subjectName:
          subject.subjectName ||
          subject.name ||
          current?.subjectName ||
          "Subject",
        subjectCode:
          subject.subjectCode ||
          subject.code ||
          current?.subjectCode,
        assessmentProjection:
          subject.assessmentProjection ||
          current?.assessmentProjection,
        assessmentReportSettings:
          subject.assessmentReportSettings ||
          hydrated.payload
            ?.assessmentReportSettings ||
          current?.assessmentReportSettings,
      });
    }
  }

  return [...byKey.values()];
}

export function normalizeCumulativeTranscriptDataset(
  dataset?: CumulativeTranscriptTemplateDataset | null,
): CumulativeTranscriptTemplateDataset | null {
  if (!dataset) return null;

  const transcript =
    dataset.transcript
      ? ({
          ...dataset.transcript,
          historicalAssessmentSubjects:
            collectHistoricalAssessmentSubjects(
              dataset.transcript,
            ),
        } as AssessmentAwareCumulativeTranscript)
      : null;

  const assessmentReportSettings:
    AssessmentReportProjectionSettings | undefined =
      dataset.assessmentReportSettings ||
      transcript
        ?.historicalAssessmentSubjects?.find(
          (subject) =>
            subject.assessmentReportSettings,
        )?.assessmentReportSettings;

  return {
    ...dataset,
    transcript,
    assessmentReportSettings,
  };
}
