import type {
  AssessmentAggregationMode,
  AssessmentEntry,
  AssessmentEntryMode,
  AssessmentItemType,
  AssessmentReportVisibility,
  AssessmentStructure,
  AssessmentStructureItem,
  GradeRule,
} from "../db/db";

export type {
  AssessmentAggregationMode,
  AssessmentEntryMode,
  AssessmentItemType,
  AssessmentReportVisibility,
};

export type AssessmentIssueSeverity =
  | "error"
  | "warning";

export interface AssessmentValidationIssue {
  code: string;
  severity: AssessmentIssueSeverity;
  itemId?: string;
  parentItemId?: string;
  assessmentStructureId?: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface AssessmentTreeNode {
  item: AssessmentStructureItem;
  children: AssessmentTreeNode[];
  parent: AssessmentTreeNode | null;
  depth: number;
  path: string[];
}

export interface AssessmentTreeBuildResult {
  roots: AssessmentTreeNode[];
  nodes: AssessmentTreeNode[];
  nodeById: Map<string, AssessmentTreeNode>;
  childrenByParentId: Map<string | null, AssessmentTreeNode[]>;
  issues: AssessmentValidationIssue[];
}

export interface AssessmentEntryColumn {
  itemId: string;
  name: string;
  parentItemId?: string | null;
  pathLabels: string[];
  maxScore: number;
  contributionWeight: number;
  order: number;
  depth: number;
  compulsory: boolean;
}

export interface AssessmentEntryGroup {
  itemId: string;
  name: string;
  depth: number;
  pathLabels: string[];
  columnItemIds: string[];
}

export interface AssessmentEntryProjection {
  structureId: string;
  columns: AssessmentEntryColumn[];
  groups: AssessmentEntryGroup[];
  hiddenCalculatedNodes: string[];
  warnings: AssessmentValidationIssue[];
}

export interface AssessmentComputedNode {
  itemId: string;
  parentItemId?: string | null;
  name: string;

  /**
   * Stable hierarchy metadata copied from the normalized assessment tree.
   * Report projections consume these fields instead of rebuilding hierarchy
   * paths and sibling order from raw Dexie rows.
   */
  depth: number;
  order: number;
  pathItemIds: string[];
  pathLabels: string[];

  itemType: AssessmentItemType;
  aggregationMode: AssessmentAggregationMode;
  entryMode: AssessmentEntryMode;
  reportVisibility: AssessmentReportVisibility;
  showParentOnReport: boolean;
  showChildrenOnReport: boolean;

  rawScore: number;
  maxScore: number;
  normalizedPercentage: number;
  weightedScore: number;
  effectiveWeight: number;

  enteredDirectly: boolean;
  calculatedFromChildren: boolean;
  complete: boolean;
  selectedForBestN?: boolean;
  warnings: string[];

  children: AssessmentComputedNode[];
}

export interface AssessmentComputationResult {
  structureId: string;
  roots: AssessmentComputedNode[];
  nodes: AssessmentComputedNode[];
  nodeByItemId: Map<string, AssessmentComputedNode>;

  rawTotal: number;
  rawMaxTotal: number;
  weightedTotal: number;
  totalWeight: number;
  percentage: number;

  complete: boolean;
  warnings: AssessmentValidationIssue[];
  treeHash: string;
}

export interface StudentSubjectAssessmentResult
  extends AssessmentComputationResult {
  grade?: string;
  remark?: string;
  gpa?: number;
  gradeRule?: GradeRule;
}

export interface AssessmentCalculationOptions {
  precision?: number;
  requireCompulsoryEntries?: boolean;
  includeInactiveItems?: boolean;
  allowDirectParentEntry?: boolean;
}

export interface AssessmentComputationInput {
  structure: AssessmentStructure;
  items: AssessmentStructureItem[];
  entries: AssessmentEntry[];
  options?: AssessmentCalculationOptions;
}
