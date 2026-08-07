import type {
  AssessmentEntry,
  AssessmentStructure,
  AssessmentStructureItem,
} from "../db/db";
import {
  buildAssessmentTree,
  flattenAssessmentTree,
} from "./assessmentTree";
import {
  assessmentTreeHash,
} from "./assessmentTreeHash";
import {
  validateAssessmentTree,
} from "./assessmentValidation";
import type {
  AssessmentCalculationOptions,
  AssessmentComputationResult,
  AssessmentComputedNode,
  AssessmentValidationIssue,
} from "./assessment-types";

function idOf(value: unknown): string {
  return value == null ? "" : String(value).trim();
}

function numberOf(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function round(value: number, precision: number): number {
  const factor = 10 ** Math.max(0, precision);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function latestEntryByItem(
  entries: AssessmentEntry[],
) {
  const map = new Map<string, AssessmentEntry>();

  for (const entry of entries) {
    if (entry.isDeleted === true) continue;

    const itemId = idOf(
      entry.assessmentStructureItemId,
    );
    if (!itemId) continue;

    const existing = map.get(itemId);
    const currentTime = numberOf(
      entry.updatedAt,
    );
    const existingTime = numberOf(
      existing?.updatedAt,
    );

    if (
      !existing ||
      currentTime >= existingTime
    ) {
      map.set(itemId, entry);
    }
  }

  return map;
}

export function computeAssessmentTree(input: {
  structure: AssessmentStructure;
  items: AssessmentStructureItem[];
  entries: AssessmentEntry[];
  options?: AssessmentCalculationOptions;
}): AssessmentComputationResult {
  const precision =
    input.options?.precision ?? 2;
  const structureId = idOf(input.structure.id);
  const structureItems = input.items.filter(
    (item) =>
      idOf(item.assessmentStructureId) ===
      structureId &&
      (input.options?.includeInactiveItems ||
        (item.active !== false &&
          item.isDeleted !== true)),
  );

  const tree = buildAssessmentTree(
    structureItems,
  );
  const entryByItem =
    latestEntryByItem(input.entries);
  const warnings: AssessmentValidationIssue[] = [
    ...validateAssessmentTree(
      structureItems,
      input.structure,
    ),
  ];

  const nodeByItemId = new Map<
    string,
    AssessmentComputedNode
  >();

  const computeNode = (
    node: ReturnType<
      typeof buildAssessmentTree
    >["nodes"][number],
  ): AssessmentComputedNode => {
    const item = node.item;
    const itemId = idOf(item.id);
    const children =
      node.children.map(computeNode);

    const itemType =
      item.itemType ??
      (children.length
        ? "group"
        : "scored_item");
    const aggregationMode =
      item.aggregationMode ?? "sum";
    const entryMode =
      item.entryMode ??
      (children.length
        ? "from_children"
        : "direct");
    const maxScore = Math.max(
      0,
      numberOf(item.maxScore, 100),
    );
    /**
     * Root items contribute directly to the structure total and therefore use
     * `weight`. Child items may use a distinct contributionWeight inside their
     * parent. This also prevents a stale root contributionWeight=0 from hiding
     * a valid root weight.
     */
    const effectiveWeight = Math.max(
      0,
      node.parent
        ? numberOf(
            item.contributionWeight ??
              item.weight,
          )
        : numberOf(item.weight),
    );

    const directEntry =
      entryByItem.get(itemId);
    const directRaw = directEntry
      ? numberOf(
          directEntry.rawScore ??
            directEntry.score,
        )
      : null;

    const canUseDirect =
      directRaw !== null &&
      (entryMode === "direct" ||
        entryMode === "direct_or_children" ||
        item.allowManualOverride === true);

    let rawScore = 0;
    let normalizedPercentage = 0;
    let calculatedFromChildren = false;
    let enteredDirectly = false;
    let selectedChildren = children;
    const localWarnings: string[] = [];

    const completeChildren =
      children.filter(
        (child) => child.complete,
      );

    if (
      aggregationMode === "best_n" &&
      children.length
    ) {
      const count = Math.max(
        1,
        Math.floor(
          numberOf(item.bestNCount, 1),
        ),
      );

      selectedChildren = [...completeChildren]
        .sort(
          (left, right) =>
            right.normalizedPercentage -
            left.normalizedPercentage,
        )
        .slice(0, count);

      const selectedIds = new Set(
        selectedChildren.map(
          (child) => child.itemId,
        ),
      );

      for (const child of children) {
        child.selectedForBestN =
          selectedIds.has(child.itemId);
      }
    }

    const minimumRequired =
      item.minimumRequiredChildren == null
        ? null
        : Math.max(
            0,
            Math.floor(
              numberOf(
                item.minimumRequiredChildren,
              ),
            ),
          );

    const enoughChildren =
      minimumRequired === null ||
      completeChildren.length >=
        minimumRequired;

    const shouldUseOverride =
      directEntry?.entrySource ===
        "override" &&
      item.allowManualOverride === true &&
      directRaw !== null;

    if (shouldUseOverride) {
      rawScore = directRaw!;
      normalizedPercentage =
        maxScore > 0
          ? (rawScore / maxScore) * 100
          : 0;
      enteredDirectly = true;
    } else if (
      children.length &&
      entryMode !== "direct"
    ) {
      calculatedFromChildren = true;

      switch (aggregationMode) {
        case "sum": {
          rawScore = children.reduce(
            (sum, child) =>
              sum + child.rawScore,
            0,
          );
          normalizedPercentage =
            maxScore > 0
              ? (rawScore / maxScore) *
                100
              : 0;
          break;
        }

        case "weighted_sum": {
          const contributionTarget =
            item.normalizeChildrenToParentWeight ===
            false
              ? children.reduce(
                  (sum, child) =>
                    sum +
                    child.effectiveWeight,
                  0,
                )
              : effectiveWeight || 100;

          const weightedContribution =
            children.reduce(
              (sum, child) =>
                sum +
                (child.normalizedPercentage /
                  100) *
                  child.effectiveWeight,
              0,
            );

          normalizedPercentage =
            contributionTarget > 0
              ? (weightedContribution /
                  contributionTarget) *
                100
              : 0;
          rawScore =
            (normalizedPercentage / 100) *
            maxScore;
          break;
        }

        case "average": {
          const source =
            completeChildren.length
              ? completeChildren
              : children;

          normalizedPercentage =
            source.length
              ? source.reduce(
                  (sum, child) =>
                    sum +
                    child.normalizedPercentage,
                  0,
                ) / source.length
              : 0;
          rawScore =
            (normalizedPercentage / 100) *
            maxScore;
          break;
        }

        case "best_n": {
          normalizedPercentage =
            selectedChildren.length
              ? selectedChildren.reduce(
                  (sum, child) =>
                    sum +
                    child.normalizedPercentage,
                  0,
                ) /
                selectedChildren.length
              : 0;
          rawScore =
            (normalizedPercentage / 100) *
            maxScore;

          if (
            selectedChildren.length <
            Math.max(
              1,
              numberOf(
                item.bestNCount,
                1,
              ),
            )
          ) {
            localWarnings.push(
              "Not enough completed children are available for Best-N aggregation.",
            );
          }
          break;
        }

        case "custom": {
          localWarnings.push(
            "CUSTOM_AGGREGATION_NOT_CONFIGURED",
          );
          rawScore = 0;
          normalizedPercentage = 0;
          break;
        }
      }

      if (
        entryMode ===
          "direct_or_children" &&
        !completeChildren.length &&
        canUseDirect
      ) {
        rawScore = directRaw!;
        normalizedPercentage =
          maxScore > 0
            ? (rawScore / maxScore) * 100
            : 0;
        calculatedFromChildren = false;
        enteredDirectly = true;
      }
    } else if (canUseDirect) {
      rawScore = directRaw!;
      normalizedPercentage =
        maxScore > 0
          ? (rawScore / maxScore) * 100
          : 0;
      enteredDirectly = true;
    }

    const compulsoryComplete =
      item.compulsory === false ||
      enteredDirectly ||
      (children.length
        ? children.every(
            (child) =>
              !child.complete
                ? false
                : true,
          )
        : directRaw !== null);

    const complete =
      enoughChildren &&
      compulsoryComplete &&
      (enteredDirectly ||
        calculatedFromChildren ||
        item.compulsory === false);

    if (!enoughChildren) {
      localWarnings.push(
        `Requires at least ${minimumRequired} completed child items.`,
      );
    }

    if (
      directRaw !== null &&
      directRaw > maxScore
    ) {
      localWarnings.push(
        `Entered score ${directRaw} exceeds maximum score ${maxScore}.`,
      );
    }

    const weightedScore =
      (normalizedPercentage / 100) *
      effectiveWeight;

    const computed: AssessmentComputedNode = {
      itemId,
      parentItemId:
        idOf(item.parentItemId) ||
        null,
      name: item.name,
      depth: node.depth,
      order: numberOf(item.order, 0),
      pathItemIds: [...node.path],
      pathLabels: [
        ...(node.parent
          ? node.parent.path.map(
              (ancestorId) =>
                tree.nodeById.get(
                  ancestorId,
                )?.item.name ??
                ancestorId,
            )
          : []),
        item.name,
      ],
      itemType,
      aggregationMode,
      entryMode,
      reportVisibility:
        item.reportVisibility ?? "show",
      showParentOnReport:
        item.showParentOnReport !== false,
      showChildrenOnReport:
        item.showChildrenOnReport === true,
      rawScore: round(
        rawScore,
        item.calculationPrecision ??
          precision,
      ),
      maxScore: round(maxScore, precision),
      normalizedPercentage: round(
        normalizedPercentage,
        item.calculationPrecision ??
          precision,
      ),
      weightedScore: round(
        weightedScore,
        item.calculationPrecision ??
          precision,
      ),
      effectiveWeight: round(
        effectiveWeight,
        precision,
      ),
      enteredDirectly,
      calculatedFromChildren,
      complete,
      warnings: localWarnings,
      children,
    };

    nodeByItemId.set(itemId, computed);
    return computed;
  };

  const roots = tree.roots.map(
    computeNode,
  );
  const nodes = flattenAssessmentTree(
    tree,
  )
    .map((node) =>
      nodeByItemId.get(idOf(node.item.id)),
    )
    .filter(
      (
        node,
      ): node is AssessmentComputedNode =>
        Boolean(node),
    );

  const rawTotal = roots.reduce(
    (sum, node) => sum + node.rawScore,
    0,
  );
  const rawMaxTotal = roots.reduce(
    (sum, node) => sum + node.maxScore,
    0,
  );
  const weightedTotal = roots.reduce(
    (sum, node) =>
      sum + node.weightedScore,
    0,
  );
  const totalWeight = roots.reduce(
    (sum, node) =>
      sum + node.effectiveWeight,
    0,
  );
  const percentage =
    totalWeight > 0
      ? (weightedTotal / totalWeight) *
        100
      : rawMaxTotal > 0
        ? (rawTotal / rawMaxTotal) * 100
        : 0;

  for (const node of nodes) {
    for (const message of node.warnings) {
      warnings.push({
        code:
          message ===
          "CUSTOM_AGGREGATION_NOT_CONFIGURED"
            ? message
            : "ASSESSMENT_CALCULATION_WARNING",
        severity: "warning",
        itemId: node.itemId,
        assessmentStructureId:
          structureId,
        message,
      });
    }
  }

  return {
    structureId,
    roots,
    nodes,
    nodeByItemId,
    rawTotal: round(rawTotal, precision),
    rawMaxTotal: round(
      rawMaxTotal,
      precision,
    ),
    weightedTotal: round(
      weightedTotal,
      precision,
    ),
    totalWeight: round(
      totalWeight,
      precision,
    ),
    percentage: round(
      percentage,
      precision,
    ),
    complete: roots.every(
      (root) => root.complete,
    ),
    warnings,
    treeHash: assessmentTreeHash(
      input.structure,
      structureItems,
    ),
  };
}
