import type {
  AssessmentAggregationMode,
  AssessmentItemType,
  AssessmentStructureItem,
} from "../db/db";
import type {
  AssessmentComputationResult,
  AssessmentComputedNode,
  AssessmentValidationIssue,
} from "./assessment-types";

export type AssessmentReportDisplayMode =
  | "item_rules"
  | "parents_only"
  | "children_only"
  | "parents_and_children"
  | "compact";

export type AssessmentReportVisibilitySource =
  | "item"
  | "parent"
  | "template"
  | "default";

export interface AssessmentReportProjectionSettings {
  enabled: boolean;
  displayMode: AssessmentReportDisplayMode;

  showParentItems: boolean;
  showChildItems: boolean;
  showCalculatedItems: boolean;
  showGroupHeaders: boolean;
  indentChildren: boolean;
  flattenSingleChildGroups: boolean;
  inheritItemVisibility: boolean;
  includeHiddenCalculationItems: boolean;
  maximumVisibleDepth: number | null;

  showMaximumScores: boolean;
  showWeights: boolean;
  showRawScores: boolean;
  showWeightedScores: boolean;
  showHierarchyPath: boolean;
}

export interface AssessmentReportNode {
  key: string;
  itemId: string;
  parentItemId?: string | null;

  name: string;
  shortLabel: string;
  pathLabels: string[];
  depth: number;
  order: number;

  itemType: AssessmentItemType;
  aggregationMode: AssessmentAggregationMode;

  rawScore: number;
  maxScore: number;
  normalizedPercentage: number;
  weightedScore: number;
  effectiveWeight: number;

  enteredDirectly: boolean;
  calculatedFromChildren: boolean;
  complete: boolean;

  isParent: boolean;
  isLeaf: boolean;
  indent: boolean;
  visible: boolean;
  visibilitySource: AssessmentReportVisibilitySource;

  children: AssessmentReportNode[];
}

export interface AssessmentReportColumn
  extends Omit<AssessmentReportNode, "children"> {
  groupId?: string;
  groupLabel?: string;
  groupDepth?: number;
  columnSpan?: number;
}

export interface AssessmentReportGroup {
  id: string;
  itemId: string;
  parentItemId?: string | null;
  label: string;
  pathLabels: string[];
  depth: number;
  order: number;
  columnItemIds: string[];
  columnSpan: number;
}

export interface AssessmentReportProjection {
  structureId: string;
  settings: AssessmentReportProjectionSettings;

  roots: AssessmentReportNode[];
  rows: AssessmentReportNode[];
  columns: AssessmentReportColumn[];
  groups: AssessmentReportGroup[];

  nodeByItemId: Map<string, AssessmentReportNode>;
  visibleItemIds: string[];
  hiddenItemIds: string[];
  warnings: AssessmentValidationIssue[];
}

export interface AssessmentReportProjectionInput {
  computation: AssessmentComputationResult;
  items: AssessmentStructureItem[];
  settings?: Partial<AssessmentReportProjectionSettings>;
}

export type AssessmentComputedReportNode = AssessmentComputedNode;
