import type {
  AssessmentStructureItem,
} from "../db/db";
import type {
  AssessmentComputedNode,
} from "./assessment-types";
import {
  DEFAULT_ASSESSMENT_REPORT_SETTINGS,
} from "./assessmentReportSettings";
import type {
  AssessmentReportColumn,
  AssessmentReportGroup,
  AssessmentReportNode,
  AssessmentReportProjection,
  AssessmentReportProjectionInput,
  AssessmentReportProjectionSettings,
  AssessmentReportVisibilitySource,
} from "./assessmentReportProjection.types";

function idOf(value: unknown): string {
  return value == null ? "" : String(value).trim();
}

function numberOf(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function shortLabel(label: string, maximum = 18): string {
  return label.length <= maximum
    ? label
    : `${label.slice(0, Math.max(1, maximum - 1))}…`;
}

function activeItem(item: AssessmentStructureItem): boolean {
  return item.isDeleted !== true && item.active !== false;
}

function resolvedSettings(
  input?: Partial<AssessmentReportProjectionSettings>,
): AssessmentReportProjectionSettings {
  return {
    ...DEFAULT_ASSESSMENT_REPORT_SETTINGS,
    ...input,
  };
}

function itemOrder(item: AssessmentStructureItem | undefined): number {
  return numberOf(item?.order, 0);
}

function shouldDisplayByMode(input: {
  mode: AssessmentReportProjectionSettings["displayMode"];
  depth: number;
  isParent: boolean;
  isLeaf: boolean;
}): boolean {
  switch (input.mode) {
    case "parents_only":
      // Top-level leaves such as Exams remain visible; nested leaves do not.
      return input.depth === 0;
    case "children_only":
      return input.isLeaf;
    case "parents_and_children":
      return true;
    case "compact":
      return input.depth === 0 || input.isLeaf;
    case "item_rules":
    default:
      return true;
  }
}

function itemRuleVisibility(input: {
  item: AssessmentStructureItem;
  depth: number;
  isParent: boolean;
  parentAllowsChildren: boolean;
  settings: AssessmentReportProjectionSettings;
}): {
  visible: boolean;
  source: AssessmentReportVisibilitySource;
} {
  const rule = input.item.reportVisibility ?? "show";

  if (
    rule === "hide" &&
    !input.settings.includeHiddenCalculationItems
  ) {
    return { visible: false, source: "item" };
  }

  if (
    input.depth > 0 &&
    !input.parentAllowsChildren &&
    input.settings.displayMode === "item_rules"
  ) {
    return { visible: false, source: "parent" };
  }

  if (
    input.isParent &&
    input.item.showParentOnReport === false
  ) {
    return { visible: false, source: "item" };
  }

  if (
    input.depth > 0 &&
    !input.isParent &&
    input.item.reportVisibility === "inherit" &&
    !input.settings.inheritItemVisibility
  ) {
    return { visible: false, source: "item" };
  }

  return {
    visible: true,
    source:
      rule === "inherit" ? "parent" : rule === "show" ? "item" : "default",
  };
}

function flattenVisibleRows(
  roots: AssessmentReportNode[],
): AssessmentReportNode[] {
  const rows: AssessmentReportNode[] = [];

  const visit = (node: AssessmentReportNode) => {
    if (node.visible) rows.push(node);
    for (const child of node.children) visit(child);
  };

  for (const root of roots) visit(root);
  return rows;
}

function flattenSingleChildGroups(
  columns: AssessmentReportColumn[],
): AssessmentReportColumn[] {
  const childCount = new Map<string, number>();

  for (const column of columns) {
    const parentId = idOf(column.parentItemId);
    if (!parentId) continue;
    childCount.set(parentId, (childCount.get(parentId) ?? 0) + 1);
  }

  return columns.map((column) => {
    const parentId = idOf(column.parentItemId);
    if (!parentId || childCount.get(parentId) !== 1) return column;

    return {
      ...column,
      groupId: undefined,
      groupLabel: undefined,
      groupDepth: undefined,
    };
  });
}

function buildGroups(
  rows: AssessmentReportNode[],
  columns: AssessmentReportColumn[],
  settings: AssessmentReportProjectionSettings,
): AssessmentReportGroup[] {
  if (!settings.showGroupHeaders) return [];

  const columnsByParent = new Map<string, AssessmentReportColumn[]>();

  for (const column of columns) {
    const parentId = idOf(column.parentItemId);
    if (!parentId) continue;
    const list = columnsByParent.get(parentId) ?? [];
    list.push(column);
    columnsByParent.set(parentId, list);
  }

  return rows
    .filter((row) => row.isParent)
    .map((row) => {
      const descendants = columns.filter((column) =>
        column.pathLabels.slice(0, -1).includes(row.name),
      );
      const directChildren = columnsByParent.get(row.itemId) ?? [];
      const groupedColumns = descendants.length ? descendants : directChildren;

      return {
        id: `assessment-group:${row.itemId}`,
        itemId: row.itemId,
        parentItemId: row.parentItemId,
        label: row.name,
        pathLabels: row.pathLabels,
        depth: row.depth,
        order: row.order,
        columnItemIds: groupedColumns.map((column) => column.itemId),
        columnSpan: groupedColumns.length,
      };
    })
    .filter((group) => group.columnSpan > 0)
    .sort((left, right) => left.order - right.order);
}

/**
 * Converts one recursively computed assessment result into a stable,
 * presentation-ready hierarchy. Templates must consume this projection rather
 * than reinterpreting AssessmentStructureItem rows independently.
 */
export function projectAssessmentForReport(
  input: AssessmentReportProjectionInput,
): AssessmentReportProjection {
  const settings = resolvedSettings(input.settings);
  const structureId = input.computation.structureId;
  const items = input.items.filter(
    (item) =>
      activeItem(item) &&
      idOf(item.assessmentStructureId) === structureId,
  );
  const itemById = new Map(items.map((item) => [idOf(item.id), item]));
  const nodeByItemId = new Map<string, AssessmentReportNode>();
  const visibleItemIds: string[] = [];
  const hiddenItemIds: string[] = [];

  const projectNode = (
    computed: AssessmentComputedNode,
    pathLabels: string[],
    depth: number,
    parentAllowsChildren: boolean,
  ): AssessmentReportNode | null => {
    const item = itemById.get(computed.itemId);
    if (!item) return null;

    const isParent = computed.children.length > 0;
    const isLeaf = !isParent;
    const nextPath = [...pathLabels, computed.name];

    const itemVisibility = itemRuleVisibility({
      item,
      depth,
      isParent,
      parentAllowsChildren,
      settings,
    });

    let visible = settings.enabled && itemVisibility.visible;
    let visibilitySource = itemVisibility.source;

    if (
      !shouldDisplayByMode({
        mode: settings.displayMode,
        depth,
        isParent,
        isLeaf,
      })
    ) {
      visible = false;
      visibilitySource = "template";
    }

    if (isParent && !settings.showParentItems) {
      visible = false;
      visibilitySource = "template";
    }

    if (depth > 0 && isLeaf && !settings.showChildItems) {
      visible = false;
      visibilitySource = "template";
    }

    if (
      computed.calculatedFromChildren &&
      !settings.showCalculatedItems
    ) {
      visible = false;
      visibilitySource = "template";
    }

    if (
      settings.maximumVisibleDepth !== null &&
      depth > settings.maximumVisibleDepth
    ) {
      visible = false;
      visibilitySource = "template";
    }

    const childrenAllowed =
      settings.displayMode !== "item_rules" ||
      item.showChildrenOnReport === true ||
      (item.showChildrenOnReport == null && parentAllowsChildren);

    const children = computed.children
      .map((child) =>
        projectNode(child, nextPath, depth + 1, childrenAllowed),
      )
      .filter((child): child is AssessmentReportNode => Boolean(child))
      .sort((left, right) => left.order - right.order);

    const projected: AssessmentReportNode = {
      key: `${computed.itemId}:${depth}`,
      itemId: computed.itemId,
      parentItemId: computed.parentItemId,
      name: computed.name,
      shortLabel: shortLabel(computed.name),
      pathLabels: nextPath,
      depth,
      order: itemOrder(item),
      itemType: computed.itemType,
      aggregationMode: computed.aggregationMode,
      rawScore: numberOf(computed.rawScore),
      maxScore: numberOf(computed.maxScore),
      normalizedPercentage: numberOf(computed.normalizedPercentage),
      weightedScore: numberOf(computed.weightedScore),
      effectiveWeight: numberOf(computed.effectiveWeight),
      enteredDirectly: computed.enteredDirectly,
      calculatedFromChildren: computed.calculatedFromChildren,
      complete: computed.complete,
      isParent,
      isLeaf,
      indent: settings.indentChildren && depth > 0,
      visible,
      visibilitySource,
      children,
    };

    nodeByItemId.set(projected.itemId, projected);
    (visible ? visibleItemIds : hiddenItemIds).push(projected.itemId);
    return projected;
  };

  const roots = input.computation.roots
    .map((root) => projectNode(root, [], 0, true))
    .filter((root): root is AssessmentReportNode => Boolean(root))
    .sort((left, right) => left.order - right.order);

  const rows = flattenVisibleRows(roots);
  let columns: AssessmentReportColumn[] = rows.map(({ children: _children, ...row }) => ({
    ...row,
    groupId: row.parentItemId
      ? `assessment-group:${row.parentItemId}`
      : undefined,
    groupLabel: row.parentItemId
      ? nodeByItemId.get(row.parentItemId)?.name
      : undefined,
    groupDepth: row.parentItemId
      ? nodeByItemId.get(row.parentItemId)?.depth
      : undefined,
  }));

  if (settings.flattenSingleChildGroups) {
    columns = flattenSingleChildGroups(columns);
  }

  const groups = buildGroups(rows, columns, settings);

  return {
    structureId,
    settings,
    roots,
    rows,
    columns,
    groups,
    nodeByItemId,
    visibleItemIds,
    hiddenItemIds,
    warnings: input.computation.warnings,
  };
}

export const projectAssessmentForStudentReport = projectAssessmentForReport;

export function projectAssessmentForSubjectBroadsheet(
  input: AssessmentReportProjectionInput,
): AssessmentReportProjection {
  return projectAssessmentForReport(input);
}
