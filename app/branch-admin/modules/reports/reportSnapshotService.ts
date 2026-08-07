/**
 * reports/reportSnapshotService.ts
 * --------------------------------------------------------------------------
 * Creates, persists and hydrates immutable historical student-report payloads.
 */

import type {
  StudentReportSnapshot,
} from "../../../lib/db/db";

import {
  createLocal,
} from "../../../lib/sync/syncUtils";

import type {
  AssessmentReportProjectionSettings,
} from "../../../lib/assessments";

import type {
  StudentReportCardDataset,
  StudentSubjectResult,
} from "./engine/report-types";

import {
  resolveStudentAssessmentReportSettings,
} from "./shared/ReportTemplateUtils";

import {
  REPORT_SNAPSHOT_SCHEMA_VERSION,
  type CreateReportSnapshotInput,
  type FrozenAssessmentSubjectSnapshot,
  type FrozenStudentReportSnapshotPayload,
  type HydratedHistoricalReport,
  type PersistStudentReportSnapshotInput,
} from "./reportSnapshotTypes";

function cloneSerializable<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function freezeSubject(
  subject: StudentSubjectResult,
): FrozenAssessmentSubjectSnapshot {
  return {
    subjectId: subject.subjectId,
    classSubjectId: subject.classSubjectId,
    subjectName: subject.subjectName,
    subjectCode: subject.subjectCode,

    assessmentStructureId:
      subject.assessmentStructureId,
    gradingStructureId:
      subject.gradingStructureId || subject.gradingSystemId,

    assessmentProjection:
      subject.assessmentProjection
        ? cloneSerializable(
            subject.assessmentProjection,
          )
        : undefined,
    assessmentReportSettings:
      subject.assessmentReportSettings
        ? cloneSerializable(
            subject.assessmentReportSettings,
          )
        : undefined,

    rawTotal: Number(subject.rawTotal || 0),
    rawMaxTotal: Number(
      subject.rawMaxTotal || 0,
    ),
    weightedTotal: Number(
      subject.weightedTotal || 0,
    ),
    totalWeight: Number(
      subject.totalWeight || 0,
    ),
    percentage: Number(
      subject.percentage || 0,
    ),

    grade: subject.grade,
    remark: subject.remark,
    gpa: subject.gpa,
    subjectPosition:
      subject.subjectPosition,

    breakdown: cloneSerializable(
      subject.breakdown || [],
    ),
  };
}

export function createFrozenStudentReportPayload(
  input: CreateReportSnapshotInput,
): FrozenStudentReportSnapshotPayload {
  const dataset = cloneSerializable(
    input.dataset,
  );
  const report = dataset.report;

  if (!report) {
    throw new Error(
      "Cannot create a report snapshot without a computed student report.",
    );
  }

  const templateSettings =
    cloneSerializable(
      input.templateSettings || {},
    );

  const assessmentReportSettings:
    AssessmentReportProjectionSettings =
      resolveStudentAssessmentReportSettings(
        templateSettings,
      );

  const assessmentSubjects =
    (report?.subjectResults || []).map(
      freezeSubject,
    );

  return {
    schemaVersion:
      REPORT_SNAPSHOT_SCHEMA_VERSION,
    generatedAt: Date.now(),

    report: cloneSerializable(report),
    dataset,

    template: input.template
      ? cloneSerializable(input.template)
      : null,
    templateSettings,

    assessmentReportSettings,
    assessmentSubjects,

    assessmentStructureHashes:
      input.assessmentStructureHashes
        ? { ...input.assessmentStructureHashes }
        : undefined,
    metadata: input.metadata
      ? cloneSerializable(input.metadata)
      : undefined,
  };
}

export async function persistStudentReportSnapshot(
  input: PersistStudentReportSnapshotInput,
): Promise<StudentReportSnapshot> {
  const payload =
    createFrozenStudentReportPayload(input);

  const report = payload.report;

  return createLocal(
    "studentReportSnapshots",
    {
      accountId: input.accountId,
      schoolId: input.schoolId,
      branchId: input.branchId,
      studentId: input.studentId,
      classId: input.classId,
      academicStructureId:
        input.academicStructureId,
      academicPeriodId:
        input.academicPeriodId,
      reportCardId:
        input.reportCardId || undefined,

      snapshotType:
        input.snapshotType || "terminal",
      academicYear:
        input.academicYear || undefined,
      term: input.term || undefined,

      total:
        input.total ??
        report.total ??
        0,
      average:
        input.average ??
        report.average ??
        0,
      position:
        input.position ??
        report.overallPosition ??
        undefined,
      recommendation:
        input.recommendation || undefined,
      promotedToClassId:
        input.promotedToClassId ||
        undefined,

      reportData: payload,
      published: true,
      active: true,
      isDeleted: false,
    } as unknown as StudentReportSnapshot,
  ) as Promise<StudentReportSnapshot>;
}

function isVersionedPayload(
  value: unknown,
): value is FrozenStudentReportSnapshotPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as any;

  return (
    Number(candidate.schemaVersion) >= 2 &&
    candidate.dataset &&
    candidate.report
  );
}

function legacyDatasetFrom(
  value: any,
): StudentReportCardDataset | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (value.dataset?.report) {
    return value.dataset;
  }

  if (value.report && value.header) {
    return value as StudentReportCardDataset;
  }

  if (
    value.studentReport?.subjectResults ||
    value.computedReport?.subjectResults ||
    value.computedStudentReport?.subjectResults ||
    value.subjectResults
  ) {
    const report =
      value.studentReport ||
      value.computedReport ||
      value.computedStudentReport ||
      value;

    return {
      ...value,
      report,
      header: value.header || {},
    } as StudentReportCardDataset;
  }

  return null;
}

export function hydrateHistoricalReport(
  source:
    | StudentReportSnapshot
    | FrozenStudentReportSnapshotPayload
    | Record<string, unknown>
    | null
    | undefined,
): HydratedHistoricalReport {
  if (!source) {
    return {
      payload: null,
      dataset: null,
      migratedFromLegacy: false,
    };
  }

  const raw =
    (source as any).reportData ??
    source;

  if (isVersionedPayload(raw)) {
    const dataset = cloneSerializable(
      raw.dataset,
    );

    const frozenBySubject = new Map(
      raw.assessmentSubjects.map(
        (subject) => [
          subject.classSubjectId ||
            subject.subjectId ||
            subject.subjectName,
          subject,
        ],
      ),
    );

    const report = dataset.report || cloneSerializable(raw.report);

    if (!report) {
      return {
        payload: raw,
        dataset: null,
        migratedFromLegacy: false,
      };
    }

    report.subjectResults =
      report.subjectResults.map(
        (subject) => {
          const frozen =
            frozenBySubject.get(
              subject.classSubjectId ||
                subject.subjectId ||
                subject.subjectName,
            );

          return frozen
            ? {
                ...subject,
                gradingStructureId:
                  frozen.gradingStructureId ||
                  frozen.gradingSystemId ||
                  subject.gradingStructureId ||
                  (subject as any).gradingSystemId,
                assessmentProjection:
                  frozen.assessmentProjection,
                assessmentReportSettings:
                  frozen.assessmentReportSettings ||
                  raw.assessmentReportSettings,
                breakdown:
                  frozen.breakdown ||
                  subject.breakdown,
              }
            : subject;
        },
      );

    dataset.report = report;
    dataset.assessmentReportSettings =
      raw.assessmentReportSettings;

    return {
      payload: raw,
      dataset,
      migratedFromLegacy: false,
    };
  }

  return {
    payload: null,
    dataset: legacyDatasetFrom(raw),
    migratedFromLegacy: true,
  };
}

export function hydrateStudentReportCardDataset(
  source:
    | StudentReportSnapshot
    | FrozenStudentReportSnapshotPayload
    | StudentReportCardDataset
    | Record<string, unknown>
    | null
    | undefined,
): StudentReportCardDataset | null {
  return hydrateHistoricalReport(
    source as any,
  ).dataset;
}