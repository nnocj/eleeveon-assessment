/** Index extensions for hierarchical assessment structures. */
export const ASSESSMENT_V2_STORES: Record<string, string> = {
  assessmentStructureItems:
    "id,accountId,schoolId,branchId,assessmentStructureId,parentItemId,level,itemType,order,active,synced,isDeleted,updatedAt,[assessmentStructureId+parentItemId+order]",
};
