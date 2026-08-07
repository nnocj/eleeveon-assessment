/**
 * Compatibility export for code that still imports schema/assessment-stores.
 * The canonical definition now lives in modules/assessments.tables.ts.
 */
import { ASSESSMENT_STORES } from "../modules/assessments.tables";

export const ASSESSMENT_V2_STORES: Readonly<Record<string, string>> =
  Object.freeze({ ...ASSESSMENT_STORES });
