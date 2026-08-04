/** Backend-owned cache and local support stores introduced by Platform V2. */
export const PLATFORM_V2_STORES: Record<string, string> = {
  commercialPlans: "id,code,commercialModel,deploymentMode,active,updatedAt",
  perpetualLicenses: "id,accountId,planId,status,licensedMajorVersion,nextValidationAt,updatedAt",
  licenseActivations: "id,accountId,licenseId,deviceId,status,lastSeenAt,updatedAt,[licenseId+deviceId]",
  licenseValidationEvents: "id,accountId,licenseId,activationId,deviceId,result,validatedAt,nextValidationAt",
  licenseUpgradeOffers: "id,accountId,fromPlanId,toPlanId,upgradeType,status,validUntil,updatedAt",
  accountEntitlements: "id,accountId,planId,subscriptionId,perpetualLicenseId,source,status,deploymentMode,syncPolicy,updatePolicy,validUntil,version,updatedAt",
  supportedLocales: "id,&code,active,displayOrder,updatedAt",
  platformReleases: "id,&version,majorVersion,channel,status,publishedAt,updatedAt",
  platformReleaseNotes: "id,releaseId,locale,displayOrder,updatedAt,[releaseId+locale]",
  platformAnnouncements: "id,&key,type,priority,status,locale,publishAt,expiresAt,updatedAt",
  platformAnnouncementReceipts: "id,announcementId,accountId,userId,membershipId,deviceId,readAt,acknowledgedAt,dismissedAt,updatedAt,[announcementId+accountId+userId]",
  platformFeedback: "id,accountId,schoolId,branchId,userId,membershipId,type,status,priority,submittedAt,serverTicketId,synced,isDeleted,updatedAt",
  platformFeedbackAttachments: "id,accountId,feedbackId,mediaAssetId,order,synced,isDeleted,updatedAt",
  platformFeedbackMessages: "id,feedbackId,accountId,senderType,senderUserId,createdAt,readAt",
};
