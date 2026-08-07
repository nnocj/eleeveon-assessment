import type {
  AssessmentStructure,
  AssessmentStructureItem,
} from "../db/db";

function stableValue(
  value: unknown,
): unknown {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return Object.fromEntries(
      Object.entries(
        value as Record<string, unknown>,
      )
        .sort(([left], [right]) =>
          left.localeCompare(right),
        )
        .map(([key, item]) => [
          key,
          stableValue(item),
        ]),
    );
  }

  return value;
}

function canonicalItem(
  item: AssessmentStructureItem,
) {
  return stableValue({
    id: item.id,
    assessmentStructureId:
      item.assessmentStructureId,
    parentItemId:
      item.parentItemId ?? null,
    level: item.level ?? 0,
    path: item.path ?? null,
    name: item.name,
    itemType:
      item.itemType ?? "scored_item",
    aggregationMode:
      item.aggregationMode ?? "sum",
    entryMode:
      item.entryMode ?? "direct",
    weight: item.weight,
    contributionWeight:
      item.contributionWeight ?? null,
    maxScore: item.maxScore,
    bestNCount:
      item.bestNCount ?? null,
    minimumRequiredChildren:
      item.minimumRequiredChildren ??
      null,
    calculationPrecision:
      item.calculationPrecision ?? 2,
    normalizeChildrenToParentWeight:
      item.normalizeChildrenToParentWeight ??
      true,
    allowManualOverride:
      item.allowManualOverride ?? false,
    compulsory:
      item.compulsory !== false,
    active: item.active !== false,
    isDeleted:
      item.isDeleted === true,
    order: item.order,
  });
}

export function assessmentTreeHash(
  structure: AssessmentStructure,
  items: AssessmentStructureItem[],
): string {
  const canonical = JSON.stringify(
    stableValue({
      structure: {
        id: structure.id,
        totalScore:
          structure.totalScore ?? 100,
        active:
          structure.active !== false,
        locked:
          structure.locked === true,
      },
      items: [...items]
        .sort((left, right) =>
          String(left.id).localeCompare(
            String(right.id),
          ),
        )
        .map(canonicalItem),
    }),
  );

  return fnv1a(canonical);
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;

  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(
      hash,
      0x01000193,
    );
  }

  return (
    hash >>> 0
  )
    .toString(16)
    .padStart(8, "0");
}
