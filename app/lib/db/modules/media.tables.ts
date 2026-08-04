/**
 * app/lib/db/modules/media.tables.ts
 * --------------------------------------------------------------------------
 * Dexie store definitions for the media module.
 *
 * This file contains store/index declarations only. Domain interfaces remain
 * available from db.ts during the compatibility phase and may be extracted
 * into dedicated type modules later.
 */

import { branchScopedIndexes, composeIndexes } from "../core/indexes";

export const MEDIA_TABLE_NAMES = [
  "mediaAssets",
  "mediaBlobs",
] as const;

export const MEDIA_STORES: Record<string, string> = {
  mediaAssets: branchScopedIndexes(
    "schoolId,branchId,ownerTable,ownerId,ownerTempKey,fieldKey,ownerIdentityKey,assetKind,mimeType,uploadStatus,active,updatedAt,[accountId+ownerIdentityKey],[accountId+ownerTable+fieldKey]",
  ),
  mediaBlobs: composeIndexes(
    "++id,accountId,assetId,mimeType,sizeBytes,createdAt,updatedAt,[accountId+assetId]",
  ),
};
