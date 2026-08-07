import {
  db,
  type AssessmentStructureItem,
} from "../db/db";
import {
  prepareSyncData,
  prepareSoftDelete,
} from "../sync/syncUtils";
import {
  buildAssessmentTree,
  getDescendants,
  recalculateTreePaths,
} from "./assessmentTree";
import {
  validateParentAssignment,
} from "./assessmentValidation";

type Scope = {
  accountId: string;
  schoolId: string;
  branchId: string;
  assessmentStructureId: string;
};

type CreateItemInput = Scope & {
  name: string;
  parentItemId?: string | null;
  itemType?: AssessmentStructureItem["itemType"];
  entryMode?: AssessmentStructureItem["entryMode"];
  aggregationMode?: AssessmentStructureItem["aggregationMode"];
  maxScore?: number;
  weight?: number;
  contributionWeight?: number | null;
  bestNCount?: number | null;
  calculationPrecision?: number;
  normalizeChildrenToParentWeight?: boolean;
  minimumRequiredChildren?: number | null;
  compulsory?: boolean;
  allowChildEntry?: boolean;
  allowManualOverride?: boolean;
  showParentOnReport?: boolean;
  showChildrenOnReport?: boolean;
  reportVisibility?: AssessmentStructureItem["reportVisibility"];
  active?: boolean;
};

function idOf(value: unknown): string {
  return value == null ? "" : String(value).trim();
}

function active(
  item: AssessmentStructureItem,
) {
  return (
    item.isDeleted !== true &&
    item.active !== false
  );
}

async function structureItems(
  assessmentStructureId: string,
) {
  const rows =
    await db.assessmentStructureItems
      .where("assessmentStructureId")
      .equals(assessmentStructureId)
      .toArray();

  return rows.filter(active);
}

function nextSiblingOrder(
  items: AssessmentStructureItem[],
  parentItemId?: string | null,
) {
  const parentId =
    idOf(parentItemId) || null;

  const orders = items
    .filter(
      (item) =>
        (idOf(item.parentItemId) || null) ===
        parentId,
    )
    .map((item) => Number(item.order || 0));

  return orders.length
    ? Math.max(...orders) + 1
    : 1;
}

async function persistNormalizedTree(
  items: AssessmentStructureItem[],
) {
  const tree =
    buildAssessmentTree(items);

  const updates =
    recalculateTreePaths(tree);

  const table =
    db.assessmentStructureItems;

  await db.transaction(
    "rw",
    table,
    async () => {
      for (const update of updates) {
        const existing = items.find(
          (item) =>
            idOf(item.id) ===
            update.itemId,
        );

        if (!existing) continue;

        const normalizedItem:
          AssessmentStructureItem = {
          ...existing,
          parentItemId:
            update.parentItemId,
          level: update.level,
          path: update.path,
          order: update.order,
        };

        await table.put(
          prepareSyncData<AssessmentStructureItem>(
            normalizedItem,
            existing,
          ),
        );
      }
    },
  );

  return updates;
}

export async function createRootItem(
  input: CreateItemInput,
) {
  return createItem({
    ...input,
    parentItemId: null,
  });
}

export async function createChildItem(
  parentItemId: string,
  input: CreateItemInput,
) {
  return createItem({
    ...input,
    parentItemId,
  });
}

async function createItem(
  input: CreateItemInput,
) {
  const items = await structureItems(
    input.assessmentStructureId,
  );

  if (input.parentItemId) {
    const parent = items.find(
      (item) =>
        idOf(item.id) ===
        idOf(input.parentItemId),
    );

    if (!parent) {
      throw new Error(
        "Selected parent assessment item was not found.",
      );
    }
  }

  const row =
    prepareSyncData<AssessmentStructureItem>({
      accountId: input.accountId,
      schoolId: input.schoolId,
      branchId: input.branchId,
      assessmentStructureId:
        input.assessmentStructureId,
      name: input.name.trim(),
      parentItemId:
        idOf(input.parentItemId) ||
        null,
      level: 0,
      path: null,
      itemType:
        input.itemType ??
        (input.parentItemId
          ? "scored_item"
          : "scored_item"),
      entryMode:
        input.entryMode ??
        "direct",
      aggregationMode:
        input.aggregationMode ??
        "sum",
      maxScore:
        input.maxScore ?? 100,
      weight: input.weight ?? 0,
      contributionWeight:
        input.contributionWeight ??
        input.weight ??
        0,
      bestNCount:
        input.bestNCount ?? null,
      calculationPrecision:
        Math.min(
          6,
          Math.max(
            0,
            input.calculationPrecision ?? 2,
          ),
        ),
      normalizeChildrenToParentWeight:
        input.normalizeChildrenToParentWeight !== false,
      minimumRequiredChildren:
        input.minimumRequiredChildren ?? null,
      order: nextSiblingOrder(
        items,
        input.parentItemId,
      ),
      compulsory:
        input.compulsory !== false,
      allowChildEntry:
        input.allowChildEntry === true,
      allowManualOverride:
        input.allowManualOverride === true,
      showParentOnReport:
        input.showParentOnReport !== false,
      showChildrenOnReport:
        input.showChildrenOnReport === true,
      reportVisibility:
        input.reportVisibility ??
        "show",
      active: input.active !== false,
      isDeleted: false,
    } as AssessmentStructureItem);

  await db.assessmentStructureItems.put(
    row,
  );

  await persistNormalizedTree([
    ...items,
    row,
  ]);

  return row;
}

export async function moveItemToParent(
  itemId: string,
  parentItemId: string | null,
) {
  const item =
    await db.assessmentStructureItems.get(
      itemId,
    );

  if (!item) {
    throw new Error(
      "Assessment item was not found.",
    );
  }

  const items = await structureItems(
    item.assessmentStructureId,
  );

  const issues =
    validateParentAssignment(
      itemId,
      parentItemId,
      items,
    );

  const error = issues.find(
    (issue) =>
      issue.severity === "error",
  );

  if (error) {
    throw new Error(error.message);
  }

  const targetOrder = nextSiblingOrder(
    items.filter(
      (row) =>
        idOf(row.id) !== itemId,
    ),
    parentItemId,
  );

  const nextItems = items.map((row) =>
    idOf(row.id) === itemId
      ? {
          ...row,
          parentItemId:
            idOf(parentItemId) ||
            null,
          order: targetOrder,
        }
      : row,
  );

  await persistNormalizedTree(nextItems);
}

export async function moveItemBefore(
  itemId: string,
  targetItemId: string,
) {
  return moveRelative(
    itemId,
    targetItemId,
    "before",
  );
}

export async function moveItemAfter(
  itemId: string,
  targetItemId: string,
) {
  return moveRelative(
    itemId,
    targetItemId,
    "after",
  );
}

async function moveRelative(
  itemId: string,
  targetItemId: string,
  position: "before" | "after",
) {
  if (itemId === targetItemId) return;

  const item =
    await db.assessmentStructureItems.get(
      itemId,
    );
  const target =
    await db.assessmentStructureItems.get(
      targetItemId,
    );

  if (!item || !target) {
    throw new Error(
      "Assessment item or movement target was not found.",
    );
  }

  if (
    item.assessmentStructureId !==
    target.assessmentStructureId
  ) {
    throw new Error(
      "Items from different assessment structures cannot be reordered together.",
    );
  }

  const items = await structureItems(
    item.assessmentStructureId,
  );
  const targetParent =
    idOf(target.parentItemId) || null;

  const issues =
    validateParentAssignment(
      itemId,
      targetParent,
      items,
    );
  const error = issues.find(
    (issue) =>
      issue.severity === "error",
  );
  if (error) throw new Error(error.message);

  const siblings = items
    .filter(
      (row) =>
        idOf(row.id) !== itemId &&
        (idOf(row.parentItemId) ||
          null) === targetParent,
    )
    .sort(
      (left, right) =>
        Number(left.order || 0) -
        Number(right.order || 0),
    );

  const targetIndex = siblings.findIndex(
    (row) =>
      idOf(row.id) === targetItemId,
  );

  const insertionIndex =
    position === "before"
      ? targetIndex
      : targetIndex + 1;

  siblings.splice(
    Math.max(0, insertionIndex),
    0,
    {
      ...item,
      parentItemId: targetParent,
    },
  );

  const orderById = new Map(
    siblings.map((row, index) => [
      idOf(row.id),
      index + 1,
    ]),
  );

  const nextItems = items.map((row) => {
    const order =
      orderById.get(idOf(row.id));

    if (order === undefined) {
      return row;
    }

    return {
      ...row,
      parentItemId:
        idOf(row.id) === itemId
          ? targetParent
          : row.parentItemId,
      order,
    };
  });

  await persistNormalizedTree(nextItems);
}

export async function reorderSiblings(
  assessmentStructureId: string,
  parentItemId: string | null,
  orderedItemIds: string[],
) {
  const items = await structureItems(
    assessmentStructureId,
  );
  const siblings = items.filter(
    (item) =>
      (idOf(item.parentItemId) ||
        null) ===
      (idOf(parentItemId) || null),
  );

  const siblingIds = new Set(
    siblings.map((item) =>
      idOf(item.id),
    ),
  );

  if (
    orderedItemIds.length !==
      siblings.length ||
    orderedItemIds.some(
      (id) => !siblingIds.has(id),
    )
  ) {
    throw new Error(
      "Sibling reorder payload does not match the current assessment tree.",
    );
  }

  const orderById = new Map(
    orderedItemIds.map((id, index) => [
      id,
      index + 1,
    ]),
  );

  await persistNormalizedTree(
    items.map((item) => ({
      ...item,
      order:
        orderById.get(idOf(item.id)) ??
        item.order,
    })),
  );
}

export async function indentItem(
  itemId: string,
) {
  const item =
    await db.assessmentStructureItems.get(
      itemId,
    );
  if (!item) {
    throw new Error(
      "Assessment item was not found.",
    );
  }

  const items = await structureItems(
    item.assessmentStructureId,
  );
  const siblings = items
    .filter(
      (row) =>
        (idOf(row.parentItemId) ||
          null) ===
        (idOf(item.parentItemId) ||
          null),
    )
    .sort(
      (left, right) =>
        Number(left.order || 0) -
        Number(right.order || 0),
    );

  const index = siblings.findIndex(
    (row) => idOf(row.id) === itemId,
  );

  if (index <= 0) {
    throw new Error(
      "The first sibling cannot be indented.",
    );
  }

  await moveItemToParent(
    itemId,
    idOf(siblings[index - 1].id),
  );
}

export async function outdentItem(
  itemId: string,
) {
  const item =
    await db.assessmentStructureItems.get(
      itemId,
    );
  if (!item) {
    throw new Error(
      "Assessment item was not found.",
    );
  }

  const parentId =
    idOf(item.parentItemId);

  if (!parentId) {
    throw new Error(
      "Root assessment items cannot be outdented.",
    );
  }

  const parent =
    await db.assessmentStructureItems.get(
      parentId,
    );

  if (!parent) {
    throw new Error(
      "Parent assessment item was not found.",
    );
  }

  await moveItemAfter(
    itemId,
    parentId,
  );
}

export async function deleteItemSubtree(
  itemId: string,
) {
  const item =
    await db.assessmentStructureItems.get(
      itemId,
    );

  if (!item) return;

  const items = await structureItems(
    item.assessmentStructureId,
  );
  const tree = buildAssessmentTree(items);
  const descendants = getDescendants(
    itemId,
    tree,
  ).map((node) => node.item);

  const affected = [
    item,
    ...descendants,
  ];

  await db.transaction(
    "rw",
    db.assessmentStructureItems,
    async () => {
      for (const row of affected) {
        await db.assessmentStructureItems.put(
          prepareSoftDelete(row),
        );
      }
    },
  );

  const remaining = items.filter(
    (row) =>
      !affected.some(
        (deleted) =>
          idOf(deleted.id) ===
          idOf(row.id),
      ),
  );

  if (remaining.length) {
    await persistNormalizedTree(
      remaining,
    );
  }
}

export async function deleteAssessmentStructureTree(
  assessmentStructureId: string,
) {
  const structure =
    await db.assessmentStructures.get(
      assessmentStructureId,
    );

  if (!structure) {
    throw new Error(
      "Assessment structure was not found.",
    );
  }

  const [items, entryCount] =
    await Promise.all([
      db.assessmentStructureItems
        .where("assessmentStructureId")
        .equals(
          assessmentStructureId,
        )
        .toArray(),
      db.assessmentEntries
        .where("assessmentStructureId")
        .equals(
          assessmentStructureId,
        )
        .count(),
    ]);

  if (entryCount > 0) {
    throw new Error(
      "This assessment system has score entries and cannot be deleted.",
    );
  }

  await db.transaction(
    "rw",
    db.assessmentStructures,
    db.assessmentStructureItems,
    async () => {
      for (const item of items) {
        await db.assessmentStructureItems.put(
          prepareSoftDelete(item),
        );
      }

      await db.assessmentStructures.put(
        prepareSoftDelete(structure),
      );
    },
  );
}
