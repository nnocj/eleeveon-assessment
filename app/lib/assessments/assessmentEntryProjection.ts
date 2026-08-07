import type {
  AssessmentEntry,
  AssessmentStructureItem,
} from "../db/db";
import {
  buildAssessmentTree,
  flattenAssessmentTree,
  isEntryEligible,
} from "./assessmentTree";
import type {
  AssessmentEntryColumn,
  AssessmentEntryGroup,
  AssessmentEntryProjection,
} from "./assessment-types";

function idOf(value: unknown): string {
  return value == null
    ? ""
    : String(value).trim();
}

function numberOf(
  value: unknown,
  fallback = 0,
) {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

export function projectAssessmentEntryColumns(input: {
  items: AssessmentStructureItem[];
  structureId: string;
  existingEntries?: AssessmentEntry[];
}): AssessmentEntryProjection {
  const structureItems = input.items.filter(
    (item) =>
      idOf(item.assessmentStructureId) ===
      idOf(input.structureId),
  );
  const tree =
    buildAssessmentTree(structureItems);
  const flat =
    flattenAssessmentTree(tree);

  const columns: AssessmentEntryColumn[] = [];
  const hiddenCalculatedNodes: string[] = [];

  for (const node of flat) {
    const itemId = idOf(node.item.id);
    const hasChildren =
      node.children.length > 0;

    if (
      !isEntryEligible(
        node.item,
        hasChildren,
      )
    ) {
      hiddenCalculatedNodes.push(itemId);
      continue;
    }

    columns.push({
      itemId,
      name: node.item.name,
      parentItemId:
        idOf(node.item.parentItemId) ||
        null,
      pathLabels: [
        ...node.path.slice(0, -1).map(
          (ancestorId) =>
            tree.nodeById.get(ancestorId)
              ?.item.name ??
            ancestorId,
        ),
        node.item.name,
      ],
      maxScore: numberOf(
        node.item.maxScore,
        100,
      ),
      contributionWeight: numberOf(
        node.item.contributionWeight ??
          node.item.weight,
      ),
      order: numberOf(node.item.order),
      depth: node.depth,
      compulsory:
        node.item.compulsory !== false,
    });
  }

  const groups = createGroups(
    columns,
    tree,
  );

  return {
    structureId: input.structureId,
    columns,
    groups,
    hiddenCalculatedNodes,
    warnings: tree.issues,
  };
}

function createGroups(
  columns: AssessmentEntryColumn[],
  tree: ReturnType<
    typeof buildAssessmentTree
  >,
): AssessmentEntryGroup[] {
  const groups = new Map<
    string,
    AssessmentEntryGroup
  >();

  for (const column of columns) {
    const parentId =
      column.parentItemId;

    if (!parentId) continue;

    const parent =
      tree.nodeById.get(parentId);

    if (!parent) continue;

    const existing = groups.get(parentId);

    if (existing) {
      existing.columnItemIds.push(
        column.itemId,
      );
      continue;
    }

    groups.set(parentId, {
      itemId: parentId,
      name: parent.item.name,
      depth: parent.depth,
      pathLabels: parent.path.map(
        (id) =>
          tree.nodeById.get(id)?.item
            .name ?? id,
      ),
      columnItemIds: [column.itemId],
    });
  }

  return [...groups.values()].sort(
    (left, right) =>
      left.depth - right.depth ||
      left.name.localeCompare(
        right.name,
      ),
  );
}
