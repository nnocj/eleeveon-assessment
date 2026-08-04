import { LEGACY_DB_STORES } from "./legacy-stores";
import { ASSESSMENT_V2_STORES } from "./assessment-stores";
import { ADVANCED_SCHEDULING_STORES } from "./scheduling-stores";
import { PLATFORM_V2_STORES } from "./platform-v2-stores";

/**
 * Complete current store inventory. Later spreads intentionally override an
 * older store definition when Platform V2 adds indexes to an existing table.
 */
export const APP_DB_STORES_V1: Record<string, string> = {
  ...LEGACY_DB_STORES,
  ...ASSESSMENT_V2_STORES,
  ...ADVANCED_SCHEDULING_STORES,
  ...PLATFORM_V2_STORES,
};

export {
  LEGACY_DB_STORES,
  ASSESSMENT_V2_STORES,
  ADVANCED_SCHEDULING_STORES,
  PLATFORM_V2_STORES,
};
