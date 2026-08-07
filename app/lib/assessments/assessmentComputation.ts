import type {
  GradeRule,
} from "../db/db";
import {
  computeAssessmentTree,
} from "./assessmentAggregation";
import type {
  AssessmentComputationInput,
  StudentSubjectAssessmentResult,
} from "./assessment-types";
import {
  projectAssessmentForReport,
} from "./assessmentReportProjection";
import type {
  AssessmentReportProjection,
  AssessmentReportProjectionSettings,
} from "./assessmentReportProjection.types";

function activeRule(
  rule: GradeRule,
) {
  return (
    rule.isDeleted !== true &&
    rule.active !== false
  );
}

export function resolveGradeRule(
  percentage: number,
  rules: GradeRule[],
): GradeRule | undefined {
  return [...rules]
    .filter(activeRule)
    .sort(
      (left, right) =>
        Number(left.order ?? 0) -
        Number(right.order ?? 0),
    )
    .find(
      (rule) =>
        percentage >=
          Number(rule.minScore) &&
        percentage <=
          Number(rule.maxScore),
    );
}

export function computeStudentSubjectAssessment(
  input: AssessmentComputationInput & {
    gradeRules?: GradeRule[];
  },
): StudentSubjectAssessmentResult {
  const computation =
    computeAssessmentTree(input);
  const gradeRule = resolveGradeRule(
    computation.percentage,
    input.gradeRules ?? [],
  );

  return {
    ...computation,
    grade: gradeRule?.grade,
    remark: gradeRule?.remark,
    gpa: gradeRule?.gpa,
    gradeRule,
  };
}


export interface StudentSubjectAssessmentReportResult
  extends StudentSubjectAssessmentResult {
  reportProjection: AssessmentReportProjection;
}

/**
 * Computes one student/subject result and immediately produces the shared
 * presentation projection consumed by report cards and broadsheets.
 */
export function computeStudentSubjectAssessmentForReport(
  input: AssessmentComputationInput & {
    gradeRules?: GradeRule[];
    reportSettings?: Partial<AssessmentReportProjectionSettings>;
  },
): StudentSubjectAssessmentReportResult {
  const computed =
    computeStudentSubjectAssessment(input);

  return {
    ...computed,
    reportProjection:
      projectAssessmentForReport({
        computation: computed,
        items: input.items,
        settings:
          input.reportSettings,
      }),
  };
}
