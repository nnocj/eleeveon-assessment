import type {
  AssessmentStructure,
  AssessmentStructureItem,
} from "../db/db";
import {
  buildAssessmentTree,
  getDescendants,
} from "./assessmentTree";
import type {
  AssessmentValidationIssue,
} from "./assessment-types";

function idOf(value: unknown): string {
  return value == null
    ? ""
    : String(value).trim();
}

function numberOf(
  value: unknown,
  fallback = 0,
): number {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function active(
  item: AssessmentStructureItem,
) {
  return (
    item.isDeleted !== true &&
    item.active !== false
  );
}

function makeIssue(
  code: string,
  message: string,
  item?: AssessmentStructureItem,
  severity: "error" | "warning" = "error",
): AssessmentValidationIssue {
  return {
    code,
    severity,
    itemId: idOf(item?.id) || undefined,
    parentItemId:
      idOf(item?.parentItemId) || undefined,
    assessmentStructureId:
      idOf(item?.assessmentStructureId) ||
      undefined,
    message,
  };
}

export function validateParentAssignment(
  itemId: string,
  parentItemId: string | null | undefined,
  items: AssessmentStructureItem[],
): AssessmentValidationIssue[] {
  const issues: AssessmentValidationIssue[] = [];
  const item = items.find(
    (row) => idOf(row.id) === itemId,
  );

  if (!item) {
    return [
      {
        code: "ITEM_NOT_FOUND",
        severity: "error",
        itemId,
        message:
          "Assessment item could not be found.",
      },
    ];
  }

  const parentId = idOf(parentItemId);
  if (!parentId) return issues;

  if (itemId === parentId) {
    issues.push(
      makeIssue(
        "SELF_PARENT",
        "Assessment item cannot be its own parent.",
        item,
      ),
    );
    return issues;
  }

  const parent = items.find(
    (row) => idOf(row.id) === parentId,
  );

  if (!parent || parent.isDeleted) {
    issues.push(
      makeIssue(
        "PARENT_NOT_FOUND",
        "Selected parent does not exist or has been deleted.",
        item,
      ),
    );
    return issues;
  }

  if (
    idOf(parent.assessmentStructureId) !==
    idOf(item.assessmentStructureId)
  ) {
    issues.push(
      makeIssue(
        "CROSS_STRUCTURE_PARENT",
        "Selected parent belongs to another assessment structure.",
        item,
      ),
    );
    return issues;
  }

  const tree = buildAssessmentTree(items);
  const descendants = getDescendants(
    itemId,
    tree,
  ).map((node) => idOf(node.item.id));

  if (descendants.includes(parentId)) {
    issues.push(
      makeIssue(
        "CIRCULAR_PARENT_REFERENCE",
        "An assessment item cannot be moved beneath one of its descendants.",
        item,
      ),
    );
  }

  return issues;
}

export function validateEntryMode(
  item: AssessmentStructureItem,
  hasChildren = false,
): AssessmentValidationIssue[] {
  const issues: AssessmentValidationIssue[] = [];
  const mode =
    item.entryMode ??
    (hasChildren
      ? "from_children"
      : "direct");
  const itemType =
    item.itemType ??
    (hasChildren
      ? "group"
      : "scored_item");

  if (
    itemType === "computed_total" &&
    mode === "direct" &&
    item.allowManualOverride !== true
  ) {
    issues.push(
      makeIssue(
        "COMPUTED_ITEM_DIRECT_ENTRY",
        "A computed-total item should receive scores from children unless manual override is enabled.",
        item,
      ),
    );
  }

  if (
    itemType === "group" &&
    mode === "direct" &&
    item.allowChildEntry !== true
  ) {
    issues.push(
      makeIssue(
        "GROUP_DIRECT_ENTRY",
        "A group item should not use direct entry unless direct parent entry is explicitly enabled.",
        item,
        "warning",
      ),
    );
  }

  if (
    !hasChildren &&
    mode === "from_children"
  ) {
    issues.push(
      makeIssue(
        "LEAF_FROM_CHILDREN",
        "A leaf item cannot calculate from children because it has no active children.",
        item,
      ),
    );
  }

  return issues;
}

export function validateAggregationConfiguration(
  item: AssessmentStructureItem,
  hasChildren = false,
): AssessmentValidationIssue[] {
  const issues: AssessmentValidationIssue[] = [];
  const mode =
    item.aggregationMode ?? "sum";

  if (
    mode === "best_n" &&
    (!Number.isInteger(item.bestNCount) ||
      numberOf(item.bestNCount) < 1)
  ) {
    issues.push(
      makeIssue(
        "BEST_N_COUNT_REQUIRED",
        "Best-N aggregation requires bestNCount of at least 1.",
        item,
      ),
    );
  }

  if (
    mode === "best_n" &&
    !hasChildren
  ) {
    issues.push(
      makeIssue(
        "BEST_N_WITHOUT_CHILDREN",
        "Best-N aggregation requires child assessment items.",
        item,
      ),
    );
  }

  if (
    mode === "custom" &&
    !item.metadata
  ) {
    issues.push(
      makeIssue(
        "CUSTOM_AGGREGATION_NOT_CONFIGURED",
        "Custom aggregation has no safe calculation configuration.",
        item,
        "warning",
      ),
    );
  }

  if (
    item.minimumRequiredChildren != null &&
    numberOf(
      item.minimumRequiredChildren,
    ) < 0
  ) {
    issues.push(
      makeIssue(
        "INVALID_MINIMUM_REQUIRED_CHILDREN",
        "Minimum required children cannot be negative.",
        item,
      ),
    );
  }

  return issues;
}

export function validateReportVisibility(
  item: AssessmentStructureItem,
): AssessmentValidationIssue[] {
  const issues: AssessmentValidationIssue[] = [];
  const visibility =
    item.reportVisibility ?? "show";

  if (
    !["show", "hide", "inherit"].includes(
      visibility,
    )
  ) {
    issues.push(
      makeIssue(
        "INVALID_REPORT_VISIBILITY",
        `Unsupported report visibility "${String(
          visibility,
        )}".`,
        item,
      ),
    );
  }

  if (
    visibility === "hide" &&
    item.showParentOnReport === true
  ) {
    issues.push(
      makeIssue(
        "CONFLICTING_REPORT_VISIBILITY",
        "The item is hidden but showParentOnReport is enabled.",
        item,
        "warning",
      ),
    );
  }

  return issues;
}

export function validateSiblingWeights(
  parentId: string | null,
  items: AssessmentStructureItem[],
): AssessmentValidationIssue[] {
  const siblings = items.filter(
    (item) =>
      active(item) &&
      (idOf(item.parentItemId) || null) ===
        (idOf(parentId) || null),
  );

  if (!siblings.length) return [];

  const parent = parentId
    ? items.find(
        (item) =>
          idOf(item.id) === idOf(parentId),
      )
    : undefined;

  const mode =
    parent?.aggregationMode ??
    "weighted_sum";

  if (
    parentId &&
    mode !== "weighted_sum"
  ) {
    return [];
  }

  const total = siblings.reduce(
    (sum, item) =>
      sum +
      numberOf(
        item.contributionWeight ??
          item.weight,
      ),
    0,
  );

  const target = parentId
    ? numberOf(
        parent?.contributionWeight ??
          parent?.weight,
        100,
      )
    : 100;

  const epsilon = 0.0001;

  if (total > target + epsilon) {
    return [
      {
        code: parentId
          ? "CHILD_WEIGHT_TOTAL_EXCEEDED"
          : "ROOT_WEIGHT_TOTAL_EXCEEDED",
        severity: "error",
        parentItemId:
          parentId || undefined,
        assessmentStructureId:
          idOf(
            siblings[0]
              ?.assessmentStructureId,
          ) || undefined,
        message: parentId
          ? `Weighted children total ${total}, exceeding parent contribution ${target}.`
          : `Root assessment weights total ${total}, exceeding 100.`,
      },
    ];
  }

  if (
    Math.abs(total - target) > epsilon
  ) {
    return [
      {
        code: parentId
          ? "CHILD_WEIGHT_TOTAL_INCOMPLETE"
          : "ROOT_WEIGHT_TOTAL_INCOMPLETE",
        severity: "warning",
        parentItemId:
          parentId || undefined,
        assessmentStructureId:
          idOf(
            siblings[0]
              ?.assessmentStructureId,
          ) || undefined,
        message: parentId
          ? `Weighted children total ${total}; expected parent contribution ${target}.`
          : `Root assessment weights total ${total}; the traditional flat structure expects 100.`,
      },
    ];
  }

  return [];
}

export function validateMaximumScores(
  parentId: string | null,
  items: AssessmentStructureItem[],
): AssessmentValidationIssue[] {
  if (!parentId) return [];

  const parent = items.find(
    (item) =>
      idOf(item.id) === idOf(parentId),
  );

  if (!parent) return [];

  const mode =
    parent.aggregationMode ?? "sum";

  if (mode !== "sum") return [];

  const children = items.filter(
    (item) =>
      active(item) &&
      idOf(item.parentItemId) ===
        idOf(parentId),
  );

  const childMaximum = children.reduce(
    (sum, child) =>
      sum +
      numberOf(child.maxScore),
    0,
  );
  const parentMaximum =
    numberOf(parent.maxScore);

  if (
    children.length &&
    Math.abs(
      childMaximum - parentMaximum,
    ) > 0.0001
  ) {
    return [
      makeIssue(
        "SUM_MAXIMUM_MISMATCH",
        `Child maximum scores total ${childMaximum}, while parent maximum is ${parentMaximum}.`,
        parent,
        "warning",
      ),
    ];
  }

  return [];
}

export function validateAssessmentTree(
  items: AssessmentStructureItem[],
  structure?: AssessmentStructure,
): AssessmentValidationIssue[] {
  const tree = buildAssessmentTree(items);
  const issues = [...tree.issues];

  const activeItems = items.filter(active);
  const parentIds = new Set<string | null>([
    null,
  ]);

  for (const item of activeItems) {
    parentIds.add(
      idOf(item.parentItemId) || null,
    );
  }

  for (const parentId of parentIds) {
    issues.push(
      ...validateSiblingWeights(
        parentId,
        activeItems,
      ),
    );
    issues.push(
      ...validateMaximumScores(
        parentId,
        activeItems,
      ),
    );
  }

  for (const node of tree.nodes) {
    issues.push(
      ...validateEntryMode(
        node.item,
        node.children.length > 0,
      ),
      ...validateAggregationConfiguration(
        node.item,
        node.children.length > 0,
      ),
      ...validateReportVisibility(
        node.item,
      ),
    );

    if (
      node.depth > 5
    ) {
      issues.push(
        makeIssue(
          "EXCESSIVE_TREE_DEPTH",
          `Assessment item is at depth ${node.depth}; the recommended UI maximum is 5.`,
          node.item,
          "warning",
        ),
      );
    }

    if (
      numberOf(node.item.maxScore) <= 0
    ) {
      issues.push(
        makeIssue(
          "INVALID_MAX_SCORE",
          "Maximum score must be greater than zero.",
          node.item,
        ),
      );
    }
  }

  if (structure) {
    const rootWeight = tree.roots.reduce(
      (sum, node) =>
        sum +
        numberOf(
          node.item.contributionWeight ??
            node.item.weight,
        ),
      0,
    );
    const target =
      numberOf(structure.totalScore, 100);

    if (
      Math.abs(rootWeight - target) >
      0.0001
    ) {
      issues.push({
        code:
          rootWeight > target
            ? "STRUCTURE_ROOT_WEIGHT_EXCEEDED"
            : "STRUCTURE_ROOT_WEIGHT_INCOMPLETE",
        severity:
          rootWeight > target
            ? "error"
            : "warning",
        assessmentStructureId:
          idOf(structure.id) || undefined,
        message:
          `Root assessment weight is ${rootWeight}; structure total is ${target}.`,
      });
    }
  }

  return deduplicateIssues(issues);
}

function deduplicateIssues(
  issues: AssessmentValidationIssue[],
) {
  const seen = new Set<string>();

  return issues.filter((issue) => {
    const key = [
      issue.code,
      issue.itemId ?? "",
      issue.parentItemId ?? "",
      issue.message,
    ].join("|");

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
