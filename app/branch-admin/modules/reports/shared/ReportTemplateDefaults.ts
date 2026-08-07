/**
 * reports/shared/ReportTemplateDefaults.ts
 * --------------------------------------------------------------------------
 * Central defaults for report template hierarchy controls.
 */

import {
  DEFAULT_ASSESSMENT_REPORT_SETTINGS,
  DEFAULT_BROADSHEET_ASSESSMENT_REPORT_SETTINGS,
} from "../../../../lib/assessments";

import {
  DEFAULT_STUDENT_REPORT_TEMPLATE_SETTINGS,
} from "./ReportTemplateTypes";

export {
  DEFAULT_ASSESSMENT_REPORT_SETTINGS,
  DEFAULT_BROADSHEET_ASSESSMENT_REPORT_SETTINGS,
  DEFAULT_STUDENT_REPORT_TEMPLATE_SETTINGS,
};

export const DEFAULT_REPORT_ASSESSMENT_DISPLAY_CONTROLS = Object.freeze({
  showAssessmentBreakdown: true,
  assessmentHierarchyDisplay: "item_rules" as const,
  showAssessmentParentItems: true,
  showAssessmentChildItems: true,
  showCalculatedAssessmentItems: true,
  indentAssessmentChildren: true,
  showAssessmentGroupHeaders: true,
  flattenSingleChildAssessmentGroups: false,
  assessmentMaximumVisibleDepth: null as number | null,
  showAssessmentMaximumScores: true,
  showAssessmentWeights: false,
  showAssessmentRawScores: true,
  showAssessmentWeightedScores: true,
  showAssessmentHierarchyPath: false,

  broadsheetAssessmentHierarchyDisplay: "parents_only" as const,
  broadsheetShowAssessmentGroupHeaders: true,
  broadsheetMaximumAssessmentDepth: null as number | null,
});
