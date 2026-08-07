/**
 * reports/engine/report-engine.ts
 * ---------------------------------------------------------
 * ENTERPRISE ACADEMIC REPORT ENGINE
 * ---------------------------------------------------------
 *
 * This is the pure computation layer for the reporting module.
 * It contains no React and no UI rendering.
 *
 * Core rule:
 * ClassSubject is the academic execution source of truth.
 *
 * Next academic period update:
 * - resolves the next active academic period from the selected/current period
 * - exposes it through the report header and each student report dataset
 * - enables report cards to print lines such as
 *   "Next Academic Period Begins: Sep 10, 2026" without manual typing
 *
 * Flow:
 * ClassSubject
 *   -> AssessmentApplicability
 *   -> AssessmentStructure
 *   -> AssessmentStructureItems
 *   -> GradingStructure
 *   -> GradeRules
 *   -> AssessmentEntries
 *   -> Student Reports / Broadsheets / Analytics
 */

import type {
  AcademicPeriod,
  AssessmentApplicability,
  AssessmentEntry,
  AssessmentStructureItem,
  Attendance,
  ClassSubject,
  GradeRule,
  Student,
  StudentEnrollment,
  StudentAttendanceSummary,
} from "../../../../lib/db/db";

import {
  computeStudentSubjectAssessmentForReport,
  DEFAULT_ASSESSMENT_REPORT_SETTINGS,
  type AssessmentReportProjection,
  type AssessmentReportProjectionSettings,
} from "../../../../lib/assessments";

import {
  reportBreakdownFromProjection,
  reportColumnsFromProjection,
} from "./report-utils";


import type {
  AttendanceSummary,
  ClassBroadsheetStudentRow,
  ClassBroadsheetSubjectCell,
  ComputedClassBroadsheet,
  ComputedStudentReport,
  ComputedSubjectBroadsheet,
  GradeResolution,
  ReportAssessmentColumn,
  ReportBreakdownItem,
  ReportEngineDataset,
  ReportEngineOutput,
  ReportFiltersState,
  ReportHeaderData,
  StudentReportCardDataset,
  StudentSubjectResult,
  SubjectBroadsheetStudentRow,
} from "./report-types";

// ======================================================
// BASIC HELPERS
// ======================================================

export function safeNumber(value: unknown): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function round(value: number, decimals = 2): number {
  return Number(value.toFixed(decimals));
}

export function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, item) => sum + item, 0) / values.length;
}

export function isActive<T extends { isDeleted?: boolean; active?: boolean }>(
  row: T,
): boolean {
  return !row.isDeleted && row.active !== false;
}

export function byName<T extends { name?: string }>(a: T, b: T): number {
  return (a.name || "").localeCompare(b.name || "");
}

export function byStudentName(
  a: { studentName: string },
  b: { studentName: string },
): number {
  return a.studentName.localeCompare(b.studentName);
}

export function byAdmissionNumber(
  a: { admissionNumber?: string },
  b: { admissionNumber?: string },
): number {
  return (a.admissionNumber || "").localeCompare(b.admissionNumber || "");
}

// ======================================================
// LOOKUPS
// ======================================================

export function buildLookups(dataset: ReportEngineDataset) {
  return {
    schoolMap: new Map(dataset.schools.map((item) => [item.id, item])),
    branchMap: new Map(dataset.branches.map((item) => [item.id, item])),
    schoolBranchSettingsMap: new Map(
      (dataset.schoolBranchSettings || []).map((item) => [item.branchId, item]),
    ),

    academicStructureMap: new Map(
      dataset.academicStructures.map((item) => [item.id, item]),
    ),
    academicPeriodMap: new Map(
      dataset.academicPeriods.map((item) => [item.id, item]),
    ),

    studentMap: new Map(dataset.students.map((item) => [item.id, item])),
    teacherMap: new Map(dataset.teachers.map((item) => [item.id, item])),
    classMap: new Map(dataset.classes.map((item) => [item.id, item])),
    subjectMap: new Map(dataset.subjects.map((item) => [item.id, item])),
    classSubjectMap: new Map(
      dataset.classSubjects.map((item) => [item.id, item]),
    ),
    gradingStructureMap: new Map(
      dataset.gradingStructures.map((item) => [item.id, item]),
    ),
    assessmentStructureMap: new Map(
      dataset.assessmentStructures.map((item) => [item.id, item]),
    ),
  };
}

// ======================================================
// 2) reports/engine/report-engine.ts
// Inside the function that builds class reports, compute this once.
// Usually this belongs inside buildClassReports(...) before mapping students.
// ======================================================

export function resolveNumberOnRollFromEnrollments(args: {
  studentEnrollments: any[];
  branchId?: string;
  classId?: string;
  academicStructureId?: string;
  academicPeriodId?: string;
}) {
  const sameId = (a: unknown, b: unknown) =>
    String(a ?? "") === String(b ?? "");

  const studentIds = new Set<string>();

  args.studentEnrollments
    .filter((enrollment: any) => {
      if (enrollment?.isDeleted) return false;
      if (enrollment?.active === false) return false;

      const status = String(enrollment?.status || "active").toLowerCase();
      if (["withdrawn", "transferred"].includes(status)) return false;

      if (args.branchId && !sameId(enrollment.branchId, args.branchId))
        return false;
      if (args.classId && !sameId(enrollment.classId, args.classId))
        return false;
      if (
        args.academicStructureId &&
        !sameId(enrollment.academicStructureId, args.academicStructureId)
      )
        return false;
      if (
        args.academicPeriodId &&
        !sameId(enrollment.academicPeriodId, args.academicPeriodId)
      )
        return false;

      return true;
    })
    .forEach((enrollment: any) => {
      const studentId = String(enrollment?.studentId ?? "").trim();
      if (studentId) studentIds.add(studentId);
    });

  return studentIds.size;
}

// ======================================================
// ACADEMIC PERIOD RESOLUTION
// ======================================================

export function toISODate(value?: string | number | Date | null): string {
  if (!value) return "";

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const time =
    value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (!Number.isFinite(time)) return "";

  return new Date(time).toISOString().slice(0, 10);
}

export function friendlyReportDate(
  value?: string | number | Date | null,
): string {
  const iso = toISODate(value);
  if (!iso) return "";

  try {
    return new Intl.DateTimeFormat("en-GH", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(new Date(`${iso}T00:00:00`));
  } catch {
    return iso;
  }
}

export function resolveNextAcademicPeriod(
  dataset: ReportEngineDataset,
  filters: ReportFiltersState,
): AcademicPeriod | undefined {
  const selectedPeriod = dataset.academicPeriods.find(
    (item) => item.id === filters.academicPeriodId && !item.isDeleted,
  );

  if (!selectedPeriod) return undefined;

  const selectedStructureId =
    filters.academicStructureId || selectedPeriod.academicStructureId;

  const selectedStructure = dataset.academicStructures.find(
    (item) => item.id === selectedStructureId && !item.isDeleted,
  );

  const selectedOrder = safeNumber(selectedPeriod.order);
  const selectedStartDate = toISODate(selectedPeriod.startDate);
  const selectedEndDate = toISODate(selectedPeriod.endDate);

  const sameTenant = (period: AcademicPeriod) => {
    if (!isActive(period)) return false;
    if (period.id === selectedPeriod.id) return false;
    if (filters.branchId && period.branchId !== filters.branchId) return false;
    if (selectedPeriod.schoolId && period.schoolId !== selectedPeriod.schoolId)
      return false;
    return true;
  };

  const sortPeriods = (a: AcademicPeriod, b: AcademicPeriod) => {
    const orderDiff = safeNumber(a.order) - safeNumber(b.order);
    if (orderDiff !== 0) return orderDiff;

    const startDiff = toISODate(a.startDate).localeCompare(
      toISODate(b.startDate),
    );
    if (startDiff !== 0) return startDiff;

    return String(a.name || "").localeCompare(String(b.name || ""));
  };

  // 1) Normal case: Term 1 -> Term 2 -> Term 3 inside the same academic structure/year.
  const sameStructureCandidates = dataset.academicPeriods
    .filter((item) => {
      if (!sameTenant(item)) return false;
      if (
        selectedStructureId &&
        item.academicStructureId !== selectedStructureId
      )
        return false;

      const itemOrder = safeNumber(item.order);
      const itemStartDate = toISODate(item.startDate);

      if (selectedOrder && itemOrder > selectedOrder) return true;
      if (selectedEndDate && itemStartDate && itemStartDate > selectedEndDate)
        return true;
      if (
        selectedStartDate &&
        itemStartDate &&
        itemStartDate > selectedStartDate
      )
        return true;

      return false;
    })
    .sort(sortPeriods);

  if (sameStructureCandidates[0]) return sameStructureCandidates[0];

  // 2) Year/structure transition case: 2026/2027 Term 3 -> 2028/2029 Term 1.
  // AcademicStructure is treated as the school-year container, so when there is no
  // later period in the current structure, move to the earliest active period in the
  // next active structure for the same school/branch.
  const selectedStructureEndDate = toISODate(selectedStructure?.endDate);
  const selectedStructureStartDate = toISODate(selectedStructure?.startDate);

  const nextStructures = dataset.academicStructures
    .filter((structure) => {
      if (!isActive(structure)) return false;
      if (structure.id === selectedStructureId) return false;
      if (filters.branchId && structure.branchId !== filters.branchId)
        return false;
      if (
        selectedPeriod.schoolId &&
        structure.schoolId !== selectedPeriod.schoolId
      )
        return false;

      const structureStartDate = toISODate(structure.startDate);
      const structureEndDate = toISODate(structure.endDate);

      if (
        selectedStructureEndDate &&
        structureStartDate &&
        structureStartDate > selectedStructureEndDate
      ) {
        return true;
      }

      if (
        selectedStructureStartDate &&
        structureStartDate &&
        structureStartDate > selectedStructureStartDate
      ) {
        return true;
      }

      if (
        selectedEndDate &&
        structureStartDate &&
        structureStartDate > selectedEndDate
      ) {
        return true;
      }

      if (
        selectedStartDate &&
        structureStartDate &&
        structureStartDate > selectedStartDate
      ) {
        return true;
      }

      if (
        selectedStructureEndDate &&
        structureEndDate &&
        structureEndDate > selectedStructureEndDate
      ) {
        return true;
      }

      return false;
    })
    .sort((a, b) => {
      const startDiff = toISODate(a.startDate).localeCompare(
        toISODate(b.startDate),
      );
      if (startDiff !== 0) return startDiff;

      const endDiff = toISODate(a.endDate).localeCompare(toISODate(b.endDate));
      if (endDiff !== 0) return endDiff;

      return String(a.name || "").localeCompare(String(b.name || ""));
    });

  for (const structure of nextStructures) {
    const firstPeriodInNextStructure = dataset.academicPeriods
      .filter(
        (item) => sameTenant(item) && item.academicStructureId === structure.id,
      )
      .sort(sortPeriods)[0];

    if (firstPeriodInNextStructure) return firstPeriodInNextStructure;
  }

  // 3) Last fallback: if structures are not well dated, pick the earliest future
  // period in the same branch/school by startDate. This protects old/migrated data.
  const futureByDateCandidates = dataset.academicPeriods
    .filter((item) => {
      if (!sameTenant(item)) return false;

      const itemStartDate = toISODate(item.startDate);
      if (selectedEndDate && itemStartDate && itemStartDate > selectedEndDate)
        return true;
      if (
        selectedStartDate &&
        itemStartDate &&
        itemStartDate > selectedStartDate
      )
        return true;

      return false;
    })
    .sort((a, b) => {
      const startDiff = toISODate(a.startDate).localeCompare(
        toISODate(b.startDate),
      );
      if (startDiff !== 0) return startDiff;

      const structureA = dataset.academicStructures.find(
        (item) => item.id === a.academicStructureId,
      );
      const structureB = dataset.academicStructures.find(
        (item) => item.id === b.academicStructureId,
      );

      const structureStartDiff = toISODate(structureA?.startDate).localeCompare(
        toISODate(structureB?.startDate),
      );
      if (structureStartDiff !== 0) return structureStartDiff;

      return sortPeriods(a, b);
    });

  return futureByDateCandidates[0];
}

export function buildCurrentAcademicPeriodSummary(
  dataset: ReportEngineDataset,
  filters: ReportFiltersState,
) {
  const currentPeriod = dataset.academicPeriods.find(
    (item) => item.id === filters.academicPeriodId && !item.isDeleted,
  );

  if (!currentPeriod) return undefined;

  const startDate = toISODate(currentPeriod.startDate);
  const endDate = toISODate(currentPeriod.endDate);
  const formattedStartDate = friendlyReportDate(startDate);
  const formattedEndDate = friendlyReportDate(endDate);

  return {
    id: currentPeriod.id != null ? String(currentPeriod.id) : undefined,
    academicStructureId: currentPeriod.academicStructureId,
    name: currentPeriod.name,
    type: currentPeriod.type,
    startDate,
    endDate,
    order: safeNumber(currentPeriod.order),
    formattedStartDate,
    formattedEndDate,
    label: formattedEndDate
      ? `This Academic Period Ends: ${formattedEndDate}`
      : "This Academic Period Ends: Not set",
    period: currentPeriod,
  };
}

export function buildNextAcademicPeriodSummary(
  dataset: ReportEngineDataset,
  filters: ReportFiltersState,
) {
  const nextPeriod = resolveNextAcademicPeriod(dataset, filters);
  if (!nextPeriod) return undefined;

  const startDate = toISODate(nextPeriod.startDate);
  const formattedStartDate = friendlyReportDate(startDate);

  return {
    id: nextPeriod.id != null ? String(nextPeriod.id) : undefined,
    academicStructureId: nextPeriod.academicStructureId,
    name: nextPeriod.name,
    type: nextPeriod.type,
    startDate,
    endDate: toISODate(nextPeriod.endDate),
    order: safeNumber(nextPeriod.order),
    formattedStartDate,
    label: formattedStartDate
      ? `Next Academic Period Begins: ${formattedStartDate}`
      : "Next Academic Period Begins: Not set",
    period: nextPeriod,
  };
}

// ======================================================
// HEADER / BRANDING
// ======================================================

export function buildReportHeader(
  dataset: ReportEngineDataset,
  filters: ReportFiltersState,
): ReportHeaderData {
  const school = dataset.schools.find((item) => !item.isDeleted);

  const branch = dataset.branches.find(
    (item) => item.id === filters.branchId && !item.isDeleted,
  );

  const schoolBranchSetting = (dataset.schoolBranchSettings || []).find(
    (item) => item.branchId === filters.branchId && !item.isDeleted,
  );

  const academicStructure = dataset.academicStructures.find(
    (item) => item.id === filters.academicStructureId && !item.isDeleted,
  );

  const academicPeriod = dataset.academicPeriods.find(
    (item) => item.id === filters.academicPeriodId && !item.isDeleted,
  );

  const classData = dataset.classes.find(
    (item) => item.id === filters.classId && !item.isDeleted,
  );

  const currentAcademicPeriod = buildCurrentAcademicPeriodSummary(
    dataset,
    filters,
  );
  const nextAcademicPeriod = buildNextAcademicPeriodSummary(dataset, filters);

  const branding = {
    schoolName: school?.name || branch?.name || "School Name",
    motto: school?.motto,
    logo: schoolBranchSetting?.logo || branch?.logo || school?.logo,
    address: branch?.address ?? school?.address ?? undefined,
    phone: branch?.phone || school?.phone,
    email: branch?.email || school?.email,
    website: school?.website,
    branchName: branch?.name,
    branchAddress: branch?.address ?? undefined,
    primaryColor: schoolBranchSetting?.primaryColor || "var(--primary-color)",
    fontFamily: schoolBranchSetting?.fontFamily,
    reportCardBackgroundImage: schoolBranchSetting?.reportCardBackgroundImage,
    reportCardWatermark: schoolBranchSetting?.reportCardWatermark,
    reportCardSignatureImage: schoolBranchSetting?.reportCardSignatureImage,
  };

  return {
    school,
    branch,
    academicStructure,
    academicPeriod,
    classData,
    schoolBranchSetting,
    branchId: branch?.id || filters.branchId,
    branchName: branch?.name,
    branchAddress: branch?.address ?? undefined,
    primaryColor: branding.primaryColor,
    currentAcademicPeriod,
    nextAcademicPeriod,
    branding,
  };
}

// ======================================================
// FILTERING
// ======================================================

export function getClassSubjectsForReport(
  dataset: ReportEngineDataset,
  filters: ReportFiltersState,
): ClassSubject[] {
  return dataset.classSubjects
    .filter((item) => {
      if (!isActive(item)) return false;
      if (filters.branchId && item.branchId !== filters.branchId) return false;
      if (filters.classId && item.classId !== filters.classId) return false;
      if (
        filters.academicStructureId &&
        item.academicStructureId !== filters.academicStructureId
      ) {
        return false;
      }
      if (
        filters.academicPeriodId &&
        item.academicPeriodId !== filters.academicPeriodId
      ) {
        return false;
      }
      if (filters.classSubjectId && item.id !== filters.classSubjectId)
        return false;
      return true;
    })
    .sort((a, b) => {
      const orderA = Number(a.orderIndex);
      const orderB = Number(b.orderIndex);
      const hasOrderA = Number.isFinite(orderA);
      const hasOrderB = Number.isFinite(orderB);

      if (hasOrderA && hasOrderB && orderA !== orderB) return orderA - orderB;
      if (hasOrderA !== hasOrderB) return hasOrderA ? -1 : 1;

      const subjectA = dataset.subjects.find(
        (subject) => String(subject.id) === String(a.subjectId),
      );
      const subjectB = dataset.subjects.find(
        (subject) => String(subject.id) === String(b.subjectId),
      );

      const nameDiff = String(
        a.name || subjectA?.name || "",
      ).localeCompare(String(b.name || subjectB?.name || ""));

      return nameDiff || String(a.subjectId).localeCompare(String(b.subjectId));
    });
}

export function getActiveEnrollmentsForReport(
  dataset: ReportEngineDataset,
  filters: ReportFiltersState,
): StudentEnrollment[] {
  return dataset.studentEnrollments.filter((item) => {
    if (item.isDeleted) return false;
    if (item.status !== "active") return false;
    if (filters.branchId && item.branchId !== filters.branchId) return false;
    if (filters.classId && item.classId !== filters.classId) return false;
    if (
      filters.academicStructureId &&
      item.academicStructureId !== filters.academicStructureId
    ) {
      return false;
    }
    if (
      filters.academicPeriodId &&
      item.academicPeriodId !== filters.academicPeriodId
    ) {
      return false;
    }
    return true;
  });
}

export function getStudentsForReport(
  dataset: ReportEngineDataset,
  filters: ReportFiltersState,
): Student[] {
  const enrollments = getActiveEnrollmentsForReport(dataset, filters);
  const enrollmentStudentIds = new Set(
    enrollments.map((item) => item.studentId),
  );

  return dataset.students.filter((student) => {
    if (student.isDeleted) return false;
    if (filters.branchId && student.branchId !== filters.branchId) return false;
    if (filters.studentId && student.id !== filters.studentId) return false;
    return !!student.id && enrollmentStudentIds.has(student.id);
  });
}

// ======================================================
// ASSESSMENT CONFIG RESOLUTION
// ======================================================

export function getApplicabilityForClassSubject(
  dataset: ReportEngineDataset,
  classSubjectId?: string,
): AssessmentApplicability | undefined {
  if (!classSubjectId) return undefined;

  return dataset.assessmentApplicabilities.find(
    (item) => item.classSubjectId === classSubjectId && isActive(item),
  );
}

export function getAssessmentColumns(
  dataset: ReportEngineDataset,
  applicability?: AssessmentApplicability,
): ReportAssessmentColumn[] {
  if (!applicability?.assessmentStructureId) return [];

  const items = dataset.assessmentStructureItems
    .filter(
      (item) =>
        item.assessmentStructureId === applicability.assessmentStructureId &&
        isActive(item),
    )
    .sort(
      (a, b) =>
        safeNumber(a.level) - safeNumber(b.level) ||
        safeNumber(a.order) - safeNumber(b.order),
    );

  const itemById = new Map(
    items.map((item) => [String(item.id ?? ""), item]),
  );

  const pathLabels = (item: AssessmentStructureItem): string[] => {
    const labels: string[] = [item.name];
    const visited = new Set<string>();
    let parentId = item.parentItemId ? String(item.parentItemId) : "";

    while (parentId && !visited.has(parentId)) {
      visited.add(parentId);
      const parent = itemById.get(parentId);
      if (!parent) break;
      labels.unshift(parent.name);
      parentId = parent.parentItemId ? String(parent.parentItemId) : "";
    }

    return labels;
  };

  const childCounts = new Map<string, number>();
  for (const item of items) {
    const parentId = item.parentItemId ? String(item.parentItemId) : "";
    if (parentId) {
      childCounts.set(parentId, (childCounts.get(parentId) ?? 0) + 1);
    }
  }

  return items.map((item) => {
    const itemId = String(item.id ?? "");
    const isParent = (childCounts.get(itemId) ?? 0) > 0;
    const depth = safeNumber(item.level);
    const effectiveWeight = item.parentItemId
      ? safeNumber(item.contributionWeight ?? item.weight)
      : safeNumber(item.weight);

    return {
      assessmentStructureItemId: itemId,
      parentItemId: item.parentItemId ? String(item.parentItemId) : null,
      name: item.name,
      shortLabel: item.name,
      pathLabels: pathLabels(item),
      depth,
      order: safeNumber(item.order),
      itemType: item.itemType,
      aggregationMode: item.aggregationMode,
      maxScore: safeNumber(item.maxScore),
      weight: effectiveWeight,
      effectiveWeight,
      isParent,
      isLeaf: !isParent,
      calculatedFromChildren:
        item.entryMode === "from_children" ||
        item.itemType === "computed_total",
      complete: false,
      groupId: item.parentItemId
        ? `assessment-group:${String(item.parentItemId)}`
        : undefined,
      groupLabel: item.parentItemId
        ? itemById.get(String(item.parentItemId))?.name
        : undefined,
      groupDepth: item.parentItemId
        ? safeNumber(itemById.get(String(item.parentItemId))?.level)
        : undefined,
    };
  });
}

export function getAssessmentEntriesForSubject(
  dataset: ReportEngineDataset,
  studentId: string,
  classSubjectId?: string,
  academicPeriodId?: string,
): AssessmentEntry[] {
  return dataset.assessmentEntries.filter((item) => {
    if (item.isDeleted) return false;
    if (item.studentId !== studentId) return false;
    if (classSubjectId && item.classSubjectId !== classSubjectId) return false;
    if (academicPeriodId && item.academicPeriodId !== academicPeriodId)
      return false;
    return true;
  });
}

function gradingStructureIdOf(
  row?: { gradingStructureId?: string | null; gradingSystemId?: string | null },
): string | undefined {
  const value = row?.gradingStructureId ?? row?.gradingSystemId;
  return value == null || String(value).trim() === ""
    ? undefined
    : String(value);
}

export function computeAssessmentReportProjection(
  dataset: ReportEngineDataset,
  input: {
    studentId: string;
    classSubjectId: string;
    academicPeriodId?: string;
    applicability?: AssessmentApplicability;
    settings?: Partial<AssessmentReportProjectionSettings>;
  },
): AssessmentReportProjection | undefined {
  const applicability =
    input.applicability ??
    getApplicabilityForClassSubject(dataset, input.classSubjectId);

  if (!applicability?.assessmentStructureId) return undefined;

  const structure = dataset.assessmentStructures.find(
    (item) =>
      String(item.id ?? "") ===
        String(applicability.assessmentStructureId) &&
      isActive(item),
  );

  if (!structure) return undefined;

  const items = dataset.assessmentStructureItems.filter(
    (item) =>
      String(item.assessmentStructureId) === String(structure.id) &&
      isActive(item),
  );

  const entries = getAssessmentEntriesForSubject(
    dataset,
    input.studentId,
    input.classSubjectId,
    input.academicPeriodId,
  );

  const gradingStructureId = gradingStructureIdOf(applicability as any);

  const gradeRules = dataset.gradeRules.filter(
    (rule) =>
      (!gradingStructureId ||
        gradingStructureIdOf(rule as any) === gradingStructureId) &&
      isActive(rule),
  );

  return computeStudentSubjectAssessmentForReport({
    structure,
    items,
    entries,
    gradeRules,
    reportSettings: {
      ...DEFAULT_ASSESSMENT_REPORT_SETTINGS,
      ...(input.settings || {}),
    },
  }).reportProjection;
}

// ======================================================
// GRADING
// ======================================================

export function resolveGrade(
  dataset: ReportEngineDataset,
  percentage: number,
  gradingStructureId?: string,
): GradeResolution {
  if (!gradingStructureId) {
    return {
      grade: "N/A",
      remark: "No grading system",
    };
  }

  const rule = dataset.gradeRules
    .filter(
      (item) => gradingStructureIdOf(item as any) === gradingStructureId && isActive(item),
    )
    .sort((a, b) => b.minScore - a.minScore)
    .find((item) => percentage >= item.minScore && percentage <= item.maxScore);

  return {
    grade: rule?.grade || "N/A",
    remark: rule?.remark || "No remark defined",
    gpa: rule?.gpa,
    color: rule?.color,
  };
}


export function getManualStudentAttendanceSummary(
  dataset: ReportEngineDataset,
  studentId: string,
  filters: ReportFiltersState,
): AttendanceSummary | undefined {
  const row = (dataset.studentAttendanceSummaries || []).find((item: any) => {
    if (item.isDeleted) return false;
    if (String(item.studentId) !== String(studentId)) return false;
    if (filters.classId && String(item.classId) !== String(filters.classId)) return false;
    if (filters.academicStructureId && String(item.academicStructureId) !== String(filters.academicStructureId)) return false;
    if (filters.academicPeriodId && String(item.academicPeriodId) !== String(filters.academicPeriodId)) return false;
    return true;
  });
  if (!row) return undefined;
  return {
    totalDays: safeNumber(row.daysOpened),
    presentDays: safeNumber(row.daysPresent),
    absentDays: safeNumber(row.daysAbsent),
    lateDays: safeNumber(row.timesLate),
    attendancePercent: safeNumber(row.attendancePercent),
  };
}

// ======================================================
// ATTENDANCE
// ======================================================

export function computeAttendanceSummary(
  attendanceRows: Attendance[],
): AttendanceSummary {
  const totalDays = attendanceRows.length;
  const presentDays = attendanceRows.filter(
    (item) => item.status === "present",
  ).length;
  const absentDays = attendanceRows.filter(
    (item) => item.status === "absent",
  ).length;
  const lateDays = attendanceRows.filter(
    (item) => item.status === "late",
  ).length;

  return {
    totalDays,
    presentDays,
    absentDays,
    lateDays,
    attendancePercent: totalDays
      ? round((presentDays / totalDays) * 100, 1)
      : 0,
  };
}

export function getStudentAttendance(
  dataset: ReportEngineDataset,
  studentId: string,
  filters: ReportFiltersState,
): AttendanceSummary {
  const manual = getManualStudentAttendanceSummary(dataset, studentId, filters);
  if (manual) return manual;

  const rows = dataset.attendance.filter((item) => {
    if (item.isDeleted) return false;
    if (item.studentId !== studentId) return false;
    if (filters.classId && item.classId !== filters.classId) return false;
    if (filters.academicStructureId && item.academicStructureId !== filters.academicStructureId) return false;
    if (filters.academicPeriodId && item.academicPeriodId !== filters.academicPeriodId) return false;
    return true;
  });

  return computeAttendanceSummary(rows);
}

// ======================================================
// SUBJECT RESULT COMPUTATION
// ======================================================

export function computeStudentSubjectResult(
  dataset: ReportEngineDataset,
  student: Student,
  classSubject: ClassSubject,
  filters: ReportFiltersState,
  reportSettings?: Partial<AssessmentReportProjectionSettings>,
): StudentSubjectResult {
  const lookups = buildLookups(dataset);
  const subject = lookups.subjectMap.get(classSubject.subjectId);
  const teacher = classSubject.teacherId
    ? lookups.teacherMap.get(classSubject.teacherId)
    : undefined;

  const applicability = getApplicabilityForClassSubject(
    dataset,
    classSubject.id != null ? String(classSubject.id) : undefined,
  );

  const classSubjectId = String(classSubject.id ?? "");
  const studentId = String(student.id ?? "");
  const academicPeriodId =
    filters.academicPeriodId || classSubject.academicPeriodId;

  const projection = computeAssessmentReportProjection(dataset, {
    studentId,
    classSubjectId,
    academicPeriodId,
    applicability,
    settings: reportSettings,
  });

  const breakdown = reportBreakdownFromProjection(projection);
  const columns = reportColumnsFromProjection(projection);

  const rawTotal = projection
    ? projection.roots.reduce((sum, node) => sum + safeNumber(node.rawScore), 0)
    : breakdown.reduce((sum, item) => sum + safeNumber(item.rawScore), 0);
  const rawMaxTotal = projection
    ? projection.roots.reduce((sum, node) => sum + safeNumber(node.maxScore), 0)
    : breakdown.reduce((sum, item) => sum + safeNumber(item.maxScore), 0);
  const weightedTotal = projection
    ? projection.roots.reduce(
        (sum, node) => sum + safeNumber(node.weightedScore),
        0,
      )
    : breakdown.reduce(
        (sum, item) => sum + safeNumber(item.weightedScore),
        0,
      );
  const totalWeight = projection
    ? projection.roots.reduce(
        (sum, node) => sum + safeNumber(node.effectiveWeight),
        0,
      )
    : columns.reduce((sum, item) => sum + safeNumber(item.effectiveWeight), 0);
  const percentage =
    totalWeight > 0 ? (weightedTotal / totalWeight) * 100 : 0;

  const grade = resolveGrade(
    dataset,
    percentage,
    gradingStructureIdOf(applicability as any),
  );

  return {
    classSubjectId,
    subjectId: classSubject.subjectId,
    subjectName: classSubject.name || subject?.name || "Unknown Subject",
    subjectCode: classSubject.code || subject?.code,
    shortName: classSubject.code || subject?.code || subject?.name?.slice(0, 4),
    teacherId: teacher?.id,
    teacherName: teacher?.fullName,

    assessmentStructureId: applicability?.assessmentStructureId,
    gradingStructureId: gradingStructureIdOf(applicability as any),

    breakdown,
    assessmentProjection: projection,
    assessmentReportSettings: projection?.settings,

    rawTotal: round(rawTotal, 2),
    rawMaxTotal: round(rawMaxTotal, 2),
    weightedTotal: round(weightedTotal, 2),
    totalWeight: round(totalWeight, 2),
    percentage: round(percentage, 2),

    grade: grade.grade,
    remark: grade.remark,
    gpa: grade.gpa,
    color: grade.color,

    subjectPosition: undefined,
  };
}

// ======================================================
// STUDENT REPORT COMPUTATION
// ======================================================

export function buildStudentReport(
  dataset: ReportEngineDataset,
  student: Student,
  filters: ReportFiltersState,
  classSubjects: ClassSubject[],
  reportSettings?: Partial<AssessmentReportProjectionSettings>,
): ComputedStudentReport {
  const lookups = buildLookups(dataset);

  const subjectResults = classSubjects.map((classSubject) =>
    computeStudentSubjectResult(
      dataset,
      student,
      classSubject,
      filters,
      reportSettings,
    ),
  );

  const percentages = subjectResults.map((item) => item.percentage);
  const gpas = subjectResults
    .map((item) => item.gpa)
    .filter((item): item is number => item != null);

  const classId = String(filters.classId ?? student.currentClassId ?? "");

  const numberOnRoll = resolveNumberOnRollFromEnrollments({
    studentEnrollments: dataset.studentEnrollments || [],
    branchId: filters.branchId,
    classId,
    academicStructureId: filters.academicStructureId,
    academicPeriodId: filters.academicPeriodId,
  });

  return {
    studentId: String(student.id ?? ""),
    studentName: student.fullName,
    admissionNumber: student.admissionNumber,
    gender: student.gender,
    studentPhoto: student.photo,

    classId,
    className: lookups.classMap.get(classId)?.name || "Class",
    academicStructureId: filters.academicStructureId,
    academicPeriodId: filters.academicPeriodId,
    currentAcademicPeriod: buildCurrentAcademicPeriodSummary(dataset, filters),
    nextAcademicPeriod: buildNextAcademicPeriodSummary(dataset, filters),

    numberOnRoll,
    classSize: numberOnRoll,

    subjectResults,

    total: round(
      percentages.reduce((sum, item) => sum + item, 0),
      2,
    ),
    average: round(average(percentages), 2),
    overallGPA: gpas.length ? round(average(gpas), 2) : undefined,
    overallPosition: undefined,

    attendance: getStudentAttendance(dataset, String(student.id ?? ""), filters),

    classTeacherRemark: "",
    headTeacherRemark: "",
    promoted: undefined,
  };
}

// ======================================================
// POSITIONS
// ======================================================

export function applyOverallPositions(reports: ComputedStudentReport[]): void {
  const sorted = [...reports].sort(
    (a, b) =>
      b.total - a.total ||
      b.average - a.average ||
      (b.overallGPA || 0) - (a.overallGPA || 0) ||
      a.studentName.localeCompare(b.studentName),
  );

  let lastKey = "";
  let lastPosition = 0;

  sorted.forEach((report, index) => {
    const key = [report.total, report.average, report.overallGPA || 0].join("|");
    const position = key === lastKey ? lastPosition : index + 1;
    report.overallPosition = position;
    lastKey = key;
    lastPosition = position;
  });
}

export function applySubjectPositions(
  reports: ComputedStudentReport[],
  classSubjects: ClassSubject[],
): void {
  classSubjects.forEach((classSubject) => {
    const classSubjectId = String(classSubject.id ?? "");
    if (!classSubjectId) return;

    const subjectRows = reports
      .map((report) =>
        report.subjectResults.find(
          (item) => String(item.classSubjectId ?? "") === classSubjectId,
        ),
      )
      .filter((item): item is StudentSubjectResult => !!item)
      .sort(
        (a, b) =>
          b.percentage - a.percentage ||
          b.weightedTotal - a.weightedTotal ||
          b.rawTotal - a.rawTotal,
      );

    let lastKey = "";
    let lastPosition = 0;

    subjectRows.forEach((row, index) => {
      const key = [row.percentage, row.weightedTotal, row.rawTotal].join("|");
      const position = key === lastKey ? lastPosition : index + 1;
      row.subjectPosition = position;
      lastKey = key;
      lastPosition = position;
    });
  });
}

export function sortReports(
  reports: ComputedStudentReport[],
  filters: ReportFiltersState,
): ComputedStudentReport[] {
  const sorted = [...reports];

  switch (filters.sortMode) {
    case "alphabetical":
      return sorted.sort(byStudentName);
    case "admission-number":
      return sorted.sort(byAdmissionNumber);
    case "average":
    case "position":
    default:
      return sorted.sort(
        (a, b) => (a.overallPosition || 9999) - (b.overallPosition || 9999),
      );
  }
}

// ======================================================
// CLASS REPORTS
// ======================================================

export function buildClassReports(
  dataset: ReportEngineDataset,
  filters: ReportFiltersState,
  reportSettings?: Partial<AssessmentReportProjectionSettings>,
): ComputedStudentReport[] {
  /**
   * Positions must always be calculated against the complete selected class.
   * A student-report preview may contain filters.studentId, but using that
   * value here reduces the ranking cohort to one student and makes every
   * student and every subject appear 1st. classSubjectId is also cleared so
   * subject positions are calculated across the class's complete subject set.
   */
  const cohortFilters: ReportFiltersState = {
    ...filters,
    studentId: undefined,
    classSubjectId: undefined,
  };

  const students = getStudentsForReport(dataset, cohortFilters);
  const classSubjects = getClassSubjectsForReport(dataset, cohortFilters);

  const reports = students.map((student) =>
    buildStudentReport(
      dataset,
      student,
      cohortFilters,
      classSubjects,
      reportSettings,
    ),
  );

  applyOverallPositions(reports);
  applySubjectPositions(reports, classSubjects);

  return sortReports(reports, filters);
}

// ======================================================
// SUBJECT BROADSHEET
// ======================================================

export function buildSubjectBroadsheet(
  dataset: ReportEngineDataset,
  filters: ReportFiltersState,
  reports: ComputedStudentReport[],
): ComputedSubjectBroadsheet | undefined {
  const lookups = buildLookups(dataset);
  const classSubject = filters.classSubjectId
    ? lookups.classSubjectMap.get(filters.classSubjectId)
    : undefined;

  if (!classSubject) return undefined;

  const subject = lookups.subjectMap.get(classSubject.subjectId);
  const teacher = classSubject.teacherId
    ? lookups.teacherMap.get(classSubject.teacherId)
    : undefined;

  const students: SubjectBroadsheetStudentRow[] = reports
    .reduce<SubjectBroadsheetStudentRow[]>((rows, report) => {
      const result = report.subjectResults.find(
        (item) => item.classSubjectId === classSubject.id,
      );

      if (!result) {
        return rows;
      }

      rows.push({
        studentId: report.studentId,
        studentName: report.studentName,
        admissionNumber: report.admissionNumber,
        breakdown: result.breakdown,
        weightedTotal: result.weightedTotal,
        percentage: result.percentage,
        grade: result.grade,
        remark: result.remark,
        gpa: result.gpa,
        position: result.subjectPosition,
      });

      return rows;
    }, [])
    .sort((a, b) => (a.position || 9999) - (b.position || 9999));

  const percentages = students.map((item) => item.percentage);
  const applicability = getApplicabilityForClassSubject(
    dataset,
    classSubject.id != null ? String(classSubject.id) : undefined,
  );

  return {
    classSubjectId: String(classSubject.id ?? ""),
    classId: classSubject.classId,
    className: lookups.classMap.get(classSubject.classId)?.name || "Class",
    subjectId: classSubject.subjectId,
    subjectName: classSubject.name || subject?.name || "Subject",
    subjectCode: classSubject.code || subject?.code,
    teacherName: teacher?.fullName,
    assessmentColumns: getAssessmentColumns(dataset, applicability),
    students,
    highestScore: round(percentages.length ? Math.max(...percentages) : 0, 2),
    lowestScore: round(percentages.length ? Math.min(...percentages) : 0, 2),
    classAverage: round(average(percentages), 2),
  };
}

// ======================================================
// CLASS BROADSHEET
// ======================================================

export function buildClassBroadsheet(
  dataset: ReportEngineDataset,
  filters: ReportFiltersState,
  reports: ComputedStudentReport[],
): ComputedClassBroadsheet {
  const lookups = buildLookups(dataset);
  const classSubjects = getClassSubjectsForReport(dataset, {
    ...filters,
    classSubjectId: undefined,
  });

  const subjectColumns = classSubjects.map((classSubject) => {
    const subject = lookups.subjectMap.get(classSubject.subjectId);

    return {
      classSubjectId: String(classSubject.id ?? ""),
      subjectId: classSubject.subjectId,
      subjectName: classSubject.name || subject?.name || "Subject",
      subjectCode: classSubject.code || subject?.code,
      shortName:
        classSubject.code || subject?.code || subject?.name?.slice(0, 4),
    };
  });

  const students: ClassBroadsheetStudentRow[] = reports.map((report) => {
    const subjects: ClassBroadsheetSubjectCell[] = report.subjectResults.map(
      (result) => ({
        classSubjectId: result.classSubjectId,
        subjectId: result.subjectId,
        subjectName: result.subjectName,
        subjectCode: result.subjectCode,
        shortName: result.shortName,
        percentage: result.percentage,
        weightedTotal: result.weightedTotal,
        grade: result.grade,
        remark: result.remark,
        position: result.subjectPosition,
      }),
    );

    return {
      studentId: report.studentId,
      studentName: report.studentName,
      admissionNumber: report.admissionNumber,
      subjects,
      total: report.total,
      average: report.average,
      gpa: report.overallGPA,
      position: report.overallPosition,
      attendancePercent: report.attendance.attendancePercent,
    };
  });

  const averages = students.map((item) => item.average);

  return {
    classId: String(filters.classId ?? ""),
    className: filters.classId
      ? lookups.classMap.get(filters.classId)?.name || "Class"
      : "Class",
    subjectColumns,
    students,
    highestAverage: round(averages.length ? Math.max(...averages) : 0, 2),
    lowestAverage: round(averages.length ? Math.min(...averages) : 0, 2),
    classAverage: round(average(averages), 2),
  };
}

// ======================================================
// ANALYTICS
// ======================================================

export function buildAnalytics(
  reports: ComputedStudentReport[],
  classSubjects: ClassSubject[],
) {
  const averages = reports.map((item) => item.average);
  const allBreakdowns = reports.flatMap((report) =>
    report.subjectResults.flatMap((subject) => subject.breakdown),
  );

  return {
    totalStudents: reports.length,
    totalSubjects: classSubjects.length,
    totalAssessmentItems: allBreakdowns.length,
    highestAverage: round(averages.length ? Math.max(...averages) : 0, 2),
    lowestAverage: round(averages.length ? Math.min(...averages) : 0, 2),
    classAverage: round(average(averages), 2),
  };
}

// ======================================================
// MASTER ENGINE
// ======================================================

// Replace ONLY your existing buildReportEngineOutput function with this corrected version.
// It resolves class teacher per report.classId, not only from filters.classId.

export function buildReportEngineOutput(
  dataset: ReportEngineDataset,
  filters: ReportFiltersState,
  reportSettings?: Partial<AssessmentReportProjectionSettings>,
): ReportEngineOutput {
  const header = buildReportHeader(dataset, filters);
  const generatedAt = new Date().toISOString();
  const warnings: string[] = [];

  if (!filters.branchId) warnings.push("No branch selected.");
  if (!filters.academicPeriodId) warnings.push("No academic period selected.");
  if (!filters.classId) warnings.push("No class selected.");

  const classSubjects = getClassSubjectsForReport(dataset, {
    ...filters,
    classSubjectId: undefined,
  });

  if (!classSubjects.length && filters.classId) {
    warnings.push("No class subjects found for the selected class and period.");
  }

  const classReports = buildClassReports(
    dataset,
    filters,
    reportSettings,
  );

  const selectedReport = filters.studentId
    ? classReports.find((item) => item.studentId === filters.studentId)
    : classReports[0];

  // ======================================================
  // SIGNATORY / RELATION HELPERS
  // ======================================================

  const getClassTeacherName = (classId?: string) => {
    if (!classId) return undefined;

    const classTeacherRecord = dataset.classTeachers.find(
      (item) =>
        item.classId === classId &&
        item.branchId === filters.branchId &&
        !item.isDeleted,
    );

    const classTeacher = classTeacherRecord
      ? dataset.teachers.find(
          (teacher) =>
            teacher.id === classTeacherRecord.teacherId &&
            teacher.branchId === filters.branchId &&
            !teacher.isDeleted,
        )
      : undefined;

    return classTeacher?.fullName;
  };

  const getHeadTeacherName = () => {
    const headTeacher = dataset.teachers.find(
      (teacher) =>
        teacher.branchId === filters.branchId &&
        teacher.role === "head_teacher" &&
        !teacher.isDeleted,
    );

    return headTeacher?.fullName;
  };

  const getPrincipalName = () => {
    const principal = dataset.teachers.find(
      (teacher) =>
        teacher.branchId === filters.branchId &&
        teacher.role === "principal" &&
        !teacher.isDeleted,
    );

    return principal?.fullName;
  };

  const getParentName = (studentId?: string) => {
    if (!studentId) return undefined;

    const parentLink = dataset.studentParents.find(
      (item) =>
        item.studentId === studentId &&
        item.branchId === filters.branchId &&
        !item.isDeleted,
    );

    const parent = parentLink
      ? dataset.parents.find(
          (item) =>
            item.id === parentLink.parentId &&
            item.branchId === filters.branchId &&
            !item.isDeleted,
        )
      : undefined;

    return parent?.fullName;
  };

  const headTeacherName = getHeadTeacherName();
  const principalName = getPrincipalName();

  const buildStudentReportDataset = (
    report: ComputedStudentReport,
  ): StudentReportCardDataset => {
    const student = dataset.students.find(
      (item) => item.id === report.studentId,
    );
    const classTeacherName = getClassTeacherName(report.classId);
    const parentName = getParentName(report.studentId);

    const savedReportCard = dataset.reportCards.find(
      (item) =>
        item.branchId === filters.branchId &&
        item.studentId === report.studentId &&
        item.classId === report.classId &&
        item.academicStructureId === report.academicStructureId &&
        item.academicPeriodId === report.academicPeriodId &&
        !item.isDeleted,
    );

    return {
      header,
      student,

      report: {
        ...report,

        classTeacherRemark:
          savedReportCard?.classTeacherRemark || report.classTeacherRemark,

        headTeacherRemark:
          savedReportCard?.headTeacherRemark || report.headTeacherRemark,

        classTeacherName,
        headTeacherName,
        principalName,
        parentName,
        guardianName: parentName,
      },

      generatedAt,

      classTeacherName,
      headTeacherName,
      principalName,
      parentName,
      guardianName: parentName,
      currentAcademicPeriod: header.currentAcademicPeriod,
      nextAcademicPeriod: header.nextAcademicPeriod,
    };
  };

  const studentReport: StudentReportCardDataset | undefined = selectedReport
    ? buildStudentReportDataset(selectedReport)
    : undefined;

  const subjectBroadsheet = filters.classSubjectId
    ? buildSubjectBroadsheet(dataset, filters, classReports)
    : undefined;

  const classBroadsheet = buildClassBroadsheet(dataset, filters, classReports);

  const analytics = buildAnalytics(classReports, classSubjects);

  return {
    header,
    studentReport,
    classReports: classReports.map((report) =>
      buildStudentReportDataset(report),
    ),
    subjectBroadsheet,
    classBroadsheet,
    analytics,
    warnings,
  };
}