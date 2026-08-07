import type {
  AssessmentReportProjectionSettings,
  AssessmentReportDisplayMode,
} from "./assessmentReportProjection.types";

/**
 * Shape accepted from ReportCardTemplateSetting without coupling the
 * assessment domain to the concrete Dexie model.
 */
export interface AssessmentReportSettingsSource {
  showAssessmentBreakdown?: boolean | null;
  assessmentHierarchyDisplay?: string | null;
  showAssessmentParentItems?: boolean | null;
  showAssessmentChildItems?: boolean | null;
  showCalculatedAssessmentItems?: boolean | null;
  indentAssessmentChildren?: boolean | null;
  showAssessmentGroupHeaders?: boolean | null;
  flattenSingleChildAssessmentGroups?: boolean | null;
  assessmentMaximumVisibleDepth?: number | null;

  showAssessmentMaximumScores?: boolean | null;
  showAssessmentWeights?: boolean | null;
  showAssessmentRawScores?: boolean | null;
  showAssessmentWeightedScores?: boolean | null;
  showAssessmentHierarchyPath?: boolean | null;

  broadsheetAssessmentHierarchyDisplay?: string | null;
  broadsheetShowAssessmentGroupHeaders?: boolean | null;
  broadsheetMaximumAssessmentDepth?: number | null;

  metadata?: Record<string, unknown> | null;
}

export const DEFAULT_ASSESSMENT_REPORT_SETTINGS:
  Readonly<AssessmentReportProjectionSettings> =
  Object.freeze({
    enabled: true,
    displayMode: "item_rules",
    showParentItems: true,
    showChildItems: true,
    showCalculatedItems: true,
    showGroupHeaders: true,
    indentChildren: true,
    flattenSingleChildGroups: false,
    inheritItemVisibility: true,
    includeHiddenCalculationItems: false,
    maximumVisibleDepth: null,

    showMaximumScores: true,
    showWeights: false,
    showRawScores: true,
    showWeightedScores: true,
    showHierarchyPath: false,
  });

export const DEFAULT_BROADSHEET_ASSESSMENT_REPORT_SETTINGS:
  Readonly<AssessmentReportProjectionSettings> =
  Object.freeze({
    ...DEFAULT_ASSESSMENT_REPORT_SETTINGS,
    displayMode: "parents_only",
    showParentItems: true,
    showChildItems: false,
    showGroupHeaders: true,
    indentChildren: false,
    showWeights: true,
  });

function booleanValue(
  value: unknown,
  fallback: boolean,
): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function nullableDepth(
  value: unknown,
  fallback: number | null,
): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.floor(parsed));
}

export function normalizeAssessmentReportDisplayMode(
  value: unknown,
  fallback: AssessmentReportDisplayMode = "item_rules",
): AssessmentReportDisplayMode {
  switch (value) {
    case "item_rules":
    case "parents_only":
    case "children_only":
    case "parents_and_children":
    case "compact":
      return value;
    default:
      return fallback;
  }
}

function metadataBoolean(
  source: AssessmentReportSettingsSource | null | undefined,
  key: string,
): boolean | undefined {
  const value = source?.metadata?.[key];
  return typeof value === "boolean" ? value : undefined;
}

/**
 * Resolves student-report hierarchy controls from a template settings row.
 * New fields may live directly on the row; metadata fallbacks keep older
 * databases compatible until their TypeScript interfaces are expanded.
 */
export function resolveAssessmentReportSettings(
  source?: AssessmentReportSettingsSource | null,
  overrides?: Partial<AssessmentReportProjectionSettings>,
): AssessmentReportProjectionSettings {
  const defaults = DEFAULT_ASSESSMENT_REPORT_SETTINGS;

  const resolved: AssessmentReportProjectionSettings = {
    enabled: booleanValue(
      source?.showAssessmentBreakdown,
      defaults.enabled,
    ),
    displayMode: normalizeAssessmentReportDisplayMode(
      source?.assessmentHierarchyDisplay ??
        source?.metadata?.assessmentDisplayMode,
      defaults.displayMode,
    ),
    showParentItems: booleanValue(
      source?.showAssessmentParentItems,
      defaults.showParentItems,
    ),
    showChildItems: booleanValue(
      source?.showAssessmentChildItems,
      defaults.showChildItems,
    ),
    showCalculatedItems: booleanValue(
      source?.showCalculatedAssessmentItems,
      defaults.showCalculatedItems,
    ),
    showGroupHeaders: booleanValue(
      source?.showAssessmentGroupHeaders,
      defaults.showGroupHeaders,
    ),
    indentChildren: booleanValue(
      source?.indentAssessmentChildren,
      defaults.indentChildren,
    ),
    flattenSingleChildGroups: booleanValue(
      source?.flattenSingleChildAssessmentGroups,
      defaults.flattenSingleChildGroups,
    ),
    inheritItemVisibility: booleanValue(
      metadataBoolean(source, "inheritAssessmentItemVisibility"),
      defaults.inheritItemVisibility,
    ),
    includeHiddenCalculationItems: booleanValue(
      metadataBoolean(source, "includeHiddenAssessmentCalculationItems"),
      defaults.includeHiddenCalculationItems,
    ),
    maximumVisibleDepth: nullableDepth(
      source?.assessmentMaximumVisibleDepth,
      defaults.maximumVisibleDepth,
    ),

    showMaximumScores: booleanValue(
      source?.showAssessmentMaximumScores ??
        metadataBoolean(source, "showAssessmentMaximumScores"),
      defaults.showMaximumScores,
    ),
    showWeights: booleanValue(
      source?.showAssessmentWeights ??
        metadataBoolean(source, "showAssessmentWeights"),
      defaults.showWeights,
    ),
    showRawScores: booleanValue(
      source?.showAssessmentRawScores ??
        metadataBoolean(source, "showAssessmentRawScores"),
      defaults.showRawScores,
    ),
    showWeightedScores: booleanValue(
      source?.showAssessmentWeightedScores ??
        metadataBoolean(source, "showAssessmentWeightedScores"),
      defaults.showWeightedScores,
    ),
    showHierarchyPath: booleanValue(
      source?.showAssessmentHierarchyPath ??
        metadataBoolean(source, "showAssessmentHierarchyPath"),
      defaults.showHierarchyPath,
    ),
  };

  return {
    ...resolved,
    ...overrides,
  };
}

/** Resolves the denser default used by subject broadsheets. */
export function resolveBroadsheetAssessmentReportSettings(
  source?: AssessmentReportSettingsSource | null,
  overrides?: Partial<AssessmentReportProjectionSettings>,
): AssessmentReportProjectionSettings {
  const defaults = DEFAULT_BROADSHEET_ASSESSMENT_REPORT_SETTINGS;

  return resolveAssessmentReportSettings(
    source,
    {
      displayMode: normalizeAssessmentReportDisplayMode(
        source?.broadsheetAssessmentHierarchyDisplay,
        defaults.displayMode,
      ),
      showParentItems: true,
      showChildItems:
        normalizeAssessmentReportDisplayMode(
          source?.broadsheetAssessmentHierarchyDisplay,
          defaults.displayMode,
        ) !== "parents_only",
      showGroupHeaders: booleanValue(
        source?.broadsheetShowAssessmentGroupHeaders,
        defaults.showGroupHeaders,
      ),
      maximumVisibleDepth: nullableDepth(
        source?.broadsheetMaximumAssessmentDepth,
        defaults.maximumVisibleDepth,
      ),
      indentChildren: false,
      ...overrides,
    },
  );
}
