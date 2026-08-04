/**
 * app/lib/db/modules/localization.tables.ts
 * --------------------------------------------------------------------------
 * Dexie store definitions for the localization module.
 *
 * This file contains store/index declarations only. Domain interfaces remain
 * available from db.ts during the compatibility phase and may be extracted
 * into dedicated type modules later.
 */

import { platformCacheIndexes } from "../core/indexes";

export const LOCALIZATION_TABLE_NAMES = [
  "supportedLocales",
  "accountLocaleSettings",
  "userLocalePreferences",
  "membershipLocalePreferences",
] as const;

export const LOCALIZATION_STORES: Record<string, string> = {
  supportedLocales: platformCacheIndexes(
    "code,languageCode,countryCode,name,nativeName,direction,active,isDefault,updatedAt",
  ),
  accountLocaleSettings: platformCacheIndexes(
    "accountId,defaultLocale,fallbackLocale,updatedAt",
  ),
  userLocalePreferences: platformCacheIndexes(
    "accountId,userId,preferredLocale,updatedAt,[accountId+userId]",
  ),
  membershipLocalePreferences: platformCacheIndexes(
    "accountId,membershipId,userId,preferredLocale,updatedAt,[accountId+membershipId]",
  ),
};
