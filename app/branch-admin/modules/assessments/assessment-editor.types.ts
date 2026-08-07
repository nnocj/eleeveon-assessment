import type {
  AssessmentAggregationMode,
  AssessmentEntryMode,
  AssessmentItemType,
  AssessmentReportVisibility,
  AssessmentStructure,
  AssessmentStructureItem,
} from "../../../lib/db/db";
import type {
  AssessmentTreeBuildResult,
  AssessmentValidationIssue,
} from "../../../lib/assessments";

export type ToastTone =
  | "success"
  | "error"
  | "info";

export interface AssessmentEditorScope {
  accountId: string;
  schoolId: string;
  branchId: string;
}

export interface AssessmentItemDraft {
  id?: string;
  assessmentStructureId: string;
  parentItemId: string;
  name: string;
  itemType: AssessmentItemType;
  entryMode: AssessmentEntryMode;
  aggregationMode: AssessmentAggregationMode;
  maxScore: string;
  weight: string;
  contributionWeight: string;
  bestNCount: string;
  calculationPrecision: string;
  normalizeChildrenToParentWeight: boolean;
  minimumRequiredChildren: string;
  order: string;
  compulsory: boolean;
  allowChildEntry: boolean;
  allowManualOverride: boolean;
  showParentOnReport: boolean;
  showChildrenOnReport: boolean;
  reportVisibility: AssessmentReportVisibility;
  active: boolean;
}

export interface AssessmentStructureDraft {
  id?: string;
  organizationId: string;
  academicStructureId: string;
  name: string;
  description: string;
  totalScore: string;
  active: boolean;
  locked: boolean;
}

export interface AssessmentTreeEditorModel {
  structure: AssessmentStructure;
  items: AssessmentStructureItem[];
  tree: AssessmentTreeBuildResult;
  issues: AssessmentValidationIssue[];
  entryCount: number;
}
