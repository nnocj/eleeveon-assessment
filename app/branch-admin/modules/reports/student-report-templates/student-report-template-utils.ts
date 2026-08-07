/**
 * reports/student-report-templates/student-report-template-utils.ts
 * --------------------------------------------------------------------------
 * Presentation-only helpers for consuming the shared assessment projection.
 */

import type {
  AssessmentReportProjection,
  AssessmentReportProjectionSettings,
} from "../../../../lib/assessments";

import type {
  ReportAssessmentColumn,
  ReportBreakdownItem,
  StudentSubjectResult,
} from "../engine/report-types";

import type {
  StudentReportTemplateSettings,
} from "../shared/ReportTemplateTypes";

import {
  resolveStudentAssessmentReportSettings,
} from "../shared/ReportTemplateUtils";

export function assessmentProjectionForSubject(
  subject?: StudentSubjectResult | null,
): AssessmentReportProjection | undefined {
  return subject?.assessmentProjection;
}

export function assessmentSettingsForTemplate(
  settings?:
    | Partial<StudentReportTemplateSettings>
    | null,
): AssessmentReportProjectionSettings {
  return resolveStudentAssessmentReportSettings(
    settings,
  );
}

export function subjectHasAssessmentBreakdown(
  subject?: StudentSubjectResult | null,
): boolean {
  return Boolean(
    subject?.assessmentProjection?.rows
      .length ||
      subject?.breakdown?.length,
  );
}

export function visibleAssessmentRows(
  subject?: StudentSubjectResult | null,
) {
  return (
    subject?.assessmentProjection?.rows ??
    []
  );
}

export function visibleAssessmentColumns(
  subject?: StudentSubjectResult | null,
) {
  return (
    subject?.assessmentProjection?.columns ??
    []
  );
}


export function collectAssessmentColumns(
  subjects:
    | readonly StudentSubjectResult[]
    | null
    | undefined,
  settings?:
    | Partial<StudentReportTemplateSettings>
    | null,
): ReportAssessmentColumn[] {
  if (!subjects?.length) return [];

  const resolved =
    assessmentSettingsForTemplate(settings);
  const byId = new Map<
    string,
    ReportAssessmentColumn
  >();

  for (const subject of subjects) {
    const projectionColumns =
      subject.assessmentProjection
        ?.columns;

    if (projectionColumns?.length) {
      for (const column of projectionColumns) {
        if (byId.has(column.itemId)) {
          continue;
        }

        byId.set(column.itemId, {
          assessmentStructureItemId:
            column.itemId,
          parentItemId:
            column.parentItemId,
          name: column.name,
          shortLabel:
            column.shortLabel,
          pathLabels: [
            ...column.pathLabels,
          ],
          depth: column.depth,
          order: column.order,
          itemType: column.itemType,
          aggregationMode:
            column.aggregationMode,
          weight:
            column.effectiveWeight,
          effectiveWeight:
            column.effectiveWeight,
          maxScore: column.maxScore,
          isParent: column.isParent,
          isLeaf: column.isLeaf,
          calculatedFromChildren:
            column.calculatedFromChildren,
          complete: column.complete,
          groupId: column.groupId,
          groupLabel:
            column.groupLabel,
          groupDepth:
            column.groupDepth,
          columnSpan:
            column.columnSpan,
        });
      }

      continue;
    }

    for (const item of subject.breakdown ?? []) {
      if (
        byId.has(
          item.assessmentStructureItemId,
        )
      ) {
        continue;
      }

      byId.set(
        item.assessmentStructureItemId,
        {
          ...item,
          pathLabels:
            item.pathLabels?.length
              ? [...item.pathLabels]
              : [item.name],
          depth: item.depth ?? 0,
          effectiveWeight:
            item.effectiveWeight ??
            item.weight,
          isParent:
            item.isParent ?? false,
          isLeaf:
            item.isLeaf ?? true,
          calculatedFromChildren:
            item.calculatedFromChildren ??
            false,
          complete:
            item.complete ?? false,
        },
      );
    }
  }

  return [...byId.values()]
    .filter((column) => {
      if (
        resolved.maximumVisibleDepth !==
          null &&
        column.depth >
          resolved.maximumVisibleDepth
      ) {
        return false;
      }

      if (
        !resolved.showParentItems &&
        column.isParent
      ) {
        return false;
      }

      if (
        !resolved.showChildItems &&
        column.depth > 0
      ) {
        return false;
      }

      if (
        !resolved.showCalculatedItems &&
        column.calculatedFromChildren
      ) {
        return false;
      }

      return true;
    })
    .sort(
      (a, b) =>
        a.order - b.order ||
        a.depth - b.depth ||
        a.name.localeCompare(b.name),
    );
}

export function assessmentColumnLabel(
  column: ReportAssessmentColumn,
  settings?:
    | Partial<StudentReportTemplateSettings>
    | null,
): string {
  const resolved =
    assessmentSettingsForTemplate(settings);

  if (
    resolved.showHierarchyPath &&
    column.pathLabels?.length
  ) {
    return column.pathLabels.join(" · ");
  }

  const label =
    column.shortLabel ||
    column.name;

  if (
    resolved.indentChildren &&
    column.depth > 0
  ) {
    return `${"› ".repeat(
      Math.min(column.depth, 3),
    )}${label}`;
  }

  return label;
}

export function assessmentCellText(
  item:
    | ReportBreakdownItem
    | undefined,
  settings?:
    | Partial<StudentReportTemplateSettings>
    | null,
  format: (
    value: number,
    decimals?: number,
  ) => string = (
    value,
    decimals = 0,
  ) =>
    Number(value || 0).toFixed(
      decimals,
    ),
): string {
  if (!item) return "-";

  const resolved =
    assessmentSettingsForTemplate(settings);

  if (
    resolved.showRawScores &&
    resolved.showMaximumScores
  ) {
    return `${format(
      item.rawScore ?? item.score,
      0,
    )}/${format(item.maxScore, 0)}`;
  }

  if (resolved.showRawScores) {
    return format(
      item.rawScore ?? item.score,
      0,
    );
  }

  if (resolved.showWeightedScores) {
    return format(
      item.weightedScore,
      1,
    );
  }

  return format(
    item.normalizedPercentage,
    0,
  );
}
