import type {
  AssessmentEntryMode,
  AssessmentStructureItem,
} from "../db/db";
import type {
  AssessmentTreeBuildResult,
  AssessmentTreeNode,
  AssessmentValidationIssue,
} from "./assessment-types";

const ROOT_KEY = "__root__";

function idOf(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : value == null
      ? ""
      : String(value).trim();
}

function isActive(
  item: AssessmentStructureItem,
): boolean {
  return (
    item.isDeleted !== true &&
    item.active !== false
  );
}

function normalizedOrder(
  item: AssessmentStructureItem,
): number {
  const value = Number(item.order);
  return Number.isFinite(value) ? value : 0;
}

function compareItems(
  left: AssessmentStructureItem,
  right: AssessmentStructureItem,
): number {
  const orderDifference =
    normalizedOrder(left) -
    normalizedOrder(right);

  if (orderDifference !== 0) {
    return orderDifference;
  }

  const nameDifference = String(
    left.name ?? "",
  ).localeCompare(String(right.name ?? ""));

  if (nameDifference !== 0) {
    return nameDifference;
  }

  return idOf(left.id).localeCompare(
    idOf(right.id),
  );
}

function rootParentKey(
  parentItemId: unknown,
): string {
  const value = idOf(parentItemId);
  return value || ROOT_KEY;
}

function issue(
  code: string,
  message: string,
  item?: AssessmentStructureItem,
  severity: "error" | "warning" = "error",
  details?: Record<string, unknown>,
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
    details,
  };
}

/**
 * Builds a safe forest from flat assessment items.
 *
 * Invalid parent references and circular nodes are promoted to roots so the
 * caller can still display and repair the structure. All defects are returned
 * through `issues`; this function never silently discards an active item.
 */
export function buildAssessmentTree(
  items: AssessmentStructureItem[],
): AssessmentTreeBuildResult {
  const issues: AssessmentValidationIssue[] = [];
  const activeItems = items.filter(isActive);
  const itemById = new Map<
    string,
    AssessmentStructureItem
  >();

  for (const item of activeItems) {
    const id = idOf(item.id);

    if (!id) {
      issues.push(
        issue(
          "MISSING_ITEM_ID",
          "Assessment item is missing a permanent id.",
          item,
        ),
      );
      continue;
    }

    if (itemById.has(id)) {
      issues.push(
        issue(
          "DUPLICATE_ITEM_ID",
          `Assessment item id ${id} appears more than once.`,
          item,
        ),
      );
      continue;
    }

    itemById.set(id, item);
  }

  const parentById = new Map<
    string,
    string | null
  >();

  for (const [id, item] of itemById) {
    const requestedParentId =
      idOf(item.parentItemId) || null;

    if (!requestedParentId) {
      parentById.set(id, null);
      continue;
    }

    if (requestedParentId === id) {
      issues.push(
        issue(
          "SELF_PARENT",
          "Assessment item cannot be its own parent.",
          item,
        ),
      );
      parentById.set(id, null);
      continue;
    }

    const parent = itemById.get(
      requestedParentId,
    );

    if (!parent) {
      const deletedParent = items.find(
        (candidate) =>
          idOf(candidate.id) ===
          requestedParentId,
      );

      issues.push(
        issue(
          deletedParent?.isDeleted
            ? "DELETED_PARENT_WITH_ACTIVE_CHILD"
            : "MISSING_PARENT",
          deletedParent?.isDeleted
            ? `Active item points to deleted parent ${requestedParentId}.`
            : `Assessment item points to missing parent ${requestedParentId}.`,
          item,
          "error",
        ),
      );
      parentById.set(id, null);
      continue;
    }

    if (
      idOf(parent.assessmentStructureId) !==
      idOf(item.assessmentStructureId)
    ) {
      issues.push(
        issue(
          "CROSS_STRUCTURE_PARENT",
          "Assessment item and parent belong to different assessment structures.",
          item,
          "error",
          {
            parentStructureId:
              parent.assessmentStructureId,
          },
        ),
      );
      parentById.set(id, null);
      continue;
    }

    parentById.set(id, requestedParentId);
  }

  const cycleMembers = new Set<string>();

  for (const id of itemById.keys()) {
    const visitOrder: string[] = [];
    const localIndex = new Map<
      string,
      number
    >();
    let cursor: string | null = id;

    while (cursor) {
      if (localIndex.has(cursor)) {
        const start =
          localIndex.get(cursor) ?? 0;
        const members =
          visitOrder.slice(start);

        for (const member of members) {
          cycleMembers.add(member);
        }

        issues.push({
          code: "CIRCULAR_PARENT_REFERENCE",
          severity: "error",
          itemId: id,
          assessmentStructureId:
            idOf(
              itemById.get(id)
                ?.assessmentStructureId,
            ) || undefined,
          message:
            `Circular assessment hierarchy detected: ${[
              ...members,
              cursor,
            ].join(" → ")}.`,
          details: { members },
        });
        break;
      }

      localIndex.set(
        cursor,
        visitOrder.length,
      );
      visitOrder.push(cursor);
      cursor =
        parentById.get(cursor) ?? null;
    }
  }

  for (const id of cycleMembers) {
    parentById.set(id, null);
  }

  const childrenIds = new Map<
    string,
    string[]
  >();

  for (const id of itemById.keys()) {
    const parentKey =
      parentById.get(id) ?? ROOT_KEY;
    const list =
      childrenIds.get(parentKey) ?? [];
    list.push(id);
    childrenIds.set(parentKey, list);
  }

  for (const list of childrenIds.values()) {
    list.sort((leftId, rightId) =>
      compareItems(
        itemById.get(leftId)!,
        itemById.get(rightId)!,
      ),
    );
  }

  const nodeById = new Map<
    string,
    AssessmentTreeNode
  >();
  const allNodes: AssessmentTreeNode[] = [];

  const createNode = (
    id: string,
    parent: AssessmentTreeNode | null,
    path: string[],
  ): AssessmentTreeNode => {
    const item = itemById.get(id)!;
    const nextPath = [...path, id];
    const node: AssessmentTreeNode = {
      item,
      children: [],
      parent,
      depth: parent
        ? parent.depth + 1
        : 0,
      path: nextPath,
    };

    nodeById.set(id, node);
    allNodes.push(node);

    node.children = (
      childrenIds.get(id) ?? []
    ).map((childId) =>
      createNode(childId, node, nextPath),
    );

    return node;
  };

  const roots = (
    childrenIds.get(ROOT_KEY) ?? []
  ).map((id) => createNode(id, null, []));

  const childrenByParentId = new Map<
    string | null,
    AssessmentTreeNode[]
  >();

  childrenByParentId.set(null, roots);

  for (const node of allNodes) {
    childrenByParentId.set(
      idOf(node.item.id),
      node.children,
    );
  }

  const pathOwners = new Map<
    string,
    string
  >();

  for (const node of allNodes) {
    const storedPath = String(
      node.item.path ?? "",
    ).trim();

    if (storedPath) {
      const existing =
        pathOwners.get(storedPath);

      if (
        existing &&
        existing !== idOf(node.item.id)
      ) {
        issues.push(
          issue(
            "DUPLICATE_STORED_PATH",
            `Stored hierarchy path "${storedPath}" is used by multiple assessment items.`,
            node.item,
            "warning",
            { otherItemId: existing },
          ),
        );
      } else {
        pathOwners.set(
          storedPath,
          idOf(node.item.id),
        );
      }
    }

    const storedLevel = Number(
      node.item.level ?? 0,
    );

    if (
      Number.isFinite(storedLevel) &&
      storedLevel !== node.depth
    ) {
      issues.push(
        issue(
          "INVALID_STORED_LEVEL",
          `Stored level ${storedLevel} does not match calculated level ${node.depth}.`,
          node.item,
          "warning",
        ),
      );
    }
  }

  return {
    roots,
    nodes: allNodes,
    nodeById,
    childrenByParentId,
    issues,
  };
}

export function flattenAssessmentTree(
  tree:
    | AssessmentTreeNode[]
    | AssessmentTreeBuildResult,
): AssessmentTreeNode[] {
  const roots = Array.isArray(tree)
    ? tree
    : tree.roots;

  const output: AssessmentTreeNode[] = [];

  const visit = (node: AssessmentTreeNode) => {
    output.push(node);
    node.children.forEach(visit);
  };

  roots.forEach(visit);
  return output;
}

export function getRootNodes(
  tree: AssessmentTreeBuildResult,
): AssessmentTreeNode[] {
  return [...tree.roots];
}

export function getLeafNodes(
  tree:
    | AssessmentTreeNode[]
    | AssessmentTreeBuildResult,
): AssessmentTreeNode[] {
  return flattenAssessmentTree(
    tree,
  ).filter(
    (node) => node.children.length === 0,
  );
}

export function getAncestors(
  itemId: string,
  tree: AssessmentTreeBuildResult,
): AssessmentTreeNode[] {
  const output: AssessmentTreeNode[] = [];
  let current =
    tree.nodeById.get(itemId)?.parent ??
    null;

  while (current) {
    output.unshift(current);
    current = current.parent;
  }

  return output;
}

export function getDescendants(
  itemId: string,
  tree: AssessmentTreeBuildResult,
): AssessmentTreeNode[] {
  const root = tree.nodeById.get(itemId);
  if (!root) return [];

  const output: AssessmentTreeNode[] = [];

  const visit = (node: AssessmentTreeNode) => {
    for (const child of node.children) {
      output.push(child);
      visit(child);
    }
  };

  visit(root);
  return output;
}

export function sortTreeByOrder(
  roots: AssessmentTreeNode[],
): AssessmentTreeNode[] {
  const sortNodes = (
    nodes: AssessmentTreeNode[],
  ): AssessmentTreeNode[] =>
    [...nodes]
      .sort((left, right) =>
        compareItems(
          left.item,
          right.item,
        ),
      )
      .map((node) => ({
        ...node,
        children: sortNodes(node.children),
      }));

  return sortNodes(roots);
}

export function recalculateTreePaths(
  tree:
    | AssessmentTreeNode[]
    | AssessmentTreeBuildResult,
): Array<{
  itemId: string;
  parentItemId: string | null;
  level: number;
  path: string;
  order: number;
}> {
  const roots = Array.isArray(tree)
    ? tree
    : tree.roots;
  const updates: Array<{
    itemId: string;
    parentItemId: string | null;
    level: number;
    path: string;
    order: number;
  }> = [];

  const visit = (
    node: AssessmentTreeNode,
    parentItemId: string | null,
    path: string[],
    order: number,
  ) => {
    const itemId = idOf(node.item.id);
    const nextPath = [...path, itemId];

    updates.push({
      itemId,
      parentItemId,
      level: path.length,
      path: nextPath.join("/"),
      order,
    });

    node.children.forEach(
      (child, index) =>
        visit(
          child,
          itemId,
          nextPath,
          index + 1,
        ),
    );
  };

  roots.forEach((root, index) =>
    visit(root, null, [], index + 1),
  );

  return updates;
}

export function isEntryEligible(
  item: AssessmentStructureItem,
  hasChildren = false,
): boolean {
  if (!isActive(item)) return false;

  const mode: AssessmentEntryMode =
    item.entryMode ??
    (hasChildren
      ? "from_children"
      : "direct");

  if (mode === "from_children") {
    return false;
  }

  if (!hasChildren) {
    return true;
  }

  return (
    mode === "direct_or_children" ||
    item.allowChildEntry === true
  );
}


/**
 * Returns stable item-id and display-label paths for a tree node. Report,
 * entry and editor projections should use this helper rather than deriving
 * paths independently.
 */
export function getAssessmentNodePath(
  node: AssessmentTreeNode,
): {
  itemIds: string[];
  labels: string[];
} {
  const ancestors: AssessmentTreeNode[] = [];
  let current: AssessmentTreeNode | null =
    node;

  while (current) {
    ancestors.unshift(current);
    current = current.parent;
  }

  return {
    itemIds: ancestors.map(
      (entry) => idOf(entry.item.id),
    ),
    labels: ancestors.map(
      (entry) => entry.item.name,
    ),
  };
}

/**
 * Resolves a node's contribution weight using the same hierarchy rule as the
 * computation and reporting engines.
 */
export function assessmentNodeEffectiveWeight(
  node: AssessmentTreeNode,
): number {
  const value = node.parent
    ? node.item.contributionWeight ??
      node.item.weight
    : node.item.weight;

  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? Math.max(0, parsed)
    : 0;
}
