/**
 * reports/engine/report-utils.ts
 * --------------------------------------------------------------------------
 * Compatibility helpers between the shared assessment report projection and
 * the existing report/broadsheet contracts.
 */

import type {
  AssessmentReportProjection,
  AssessmentReportProjectionSettings,
} from "../../../../lib/assessments";

import type {
  ReportAssessmentColumn,
  ReportBreakdownItem,
} from "./report-types";

export function reportColumnsFromProjection(
  projection?: AssessmentReportProjection | null,
): ReportAssessmentColumn[] {
  if (!projection) return [];

  return projection.columns.map((column) => ({
    assessmentStructureItemId: column.itemId,
    parentItemId: column.parentItemId,
    name: column.name,
    shortLabel: column.shortLabel,
    pathLabels: [...column.pathLabels],
    depth: column.depth,
    order: column.order,
    itemType: column.itemType,
    aggregationMode: column.aggregationMode,
    weight: column.effectiveWeight,
    effectiveWeight: column.effectiveWeight,
    maxScore: column.maxScore,
    isParent: column.isParent,
    isLeaf: column.isLeaf,
    calculatedFromChildren: column.calculatedFromChildren,
    complete: column.complete,
    groupId: column.groupId,
    groupLabel: column.groupLabel,
    groupDepth: column.groupDepth,
    columnSpan: column.columnSpan,
  }));
}

export function reportBreakdownFromProjection(
  projection?: AssessmentReportProjection | null,
): ReportBreakdownItem[] {
  if (!projection) return [];

  return projection.rows.map((node) => ({
    assessmentStructureItemId: node.itemId,
    parentItemId: node.parentItemId,
    name: node.name,
    shortLabel: node.shortLabel,
    pathLabels: [...node.pathLabels],
    depth: node.depth,
    order: node.order,
    itemType: node.itemType,
    aggregationMode: node.aggregationMode,
    weight: node.effectiveWeight,
    effectiveWeight: node.effectiveWeight,
    maxScore: node.maxScore,
    isParent: node.isParent,
    isLeaf: node.isLeaf,
    calculatedFromChildren: node.calculatedFromChildren,
    complete: node.complete,
    score: node.rawScore,
    rawScore: node.rawScore,
    weightedScore: node.weightedScore,
    normalizedPercentage: node.normalizedPercentage,
    enteredDirectly: node.enteredDirectly,
  }));
}

export function projectionSettingsOrUndefined(
  projection?: AssessmentReportProjection | null,
): AssessmentReportProjectionSettings | undefined {
  return projection?.settings;
}
