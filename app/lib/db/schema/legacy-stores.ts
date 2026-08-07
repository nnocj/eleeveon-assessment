export const LEGACY_DB_STORES: Record<string, string> = {
      schools: "id,accountId,name,region,city,geohash,mapVisible,updatedAt,synced",

      branches:
        "id,accountId,schoolId,name,region,city,geohash,mapVisible,updatedAt,synced,[accountId+schoolId]",

      academicStructures:
        "id,accountId, schoolId, branchId,level,updatedAt",

      academicPeriods:
        "id,accountId, schoolId, branchId,academicStructureId,order,updatedAt",

      organizations:
        "id,accountId,schoolId,branchId,parentOrganizationId,type,updatedAt",

      students:
        "id,accountId,schoolId,branchId,currentClassId,admissionNumber,fullName,email,status,geohash,mapVisible,updatedAt,synced,[accountId+branchId]",

      teachers:
        "id,accountId,schoolId,branchId,role,fullName,title,geohash,mapVisible,updatedAt,synced,[accountId+branchId]",

      parents:
        "id,accountId,schoolId,branchId,phone,email,title,fullName,geohash,mapVisible,updatedAt,synced,[accountId+branchId]",

      studentParents:
        "id,accountId,schoolId,branchId,studentId,parentId",

      classes:
        "id,accountId,schoolId,branchId,organizationId,name,updatedAt",

      subjects:
        "id,accountId, schoolId, branchId,organizationId,name,code,category,updatedAt",

      programs:
        "id,accountId,schoolId,branchId,organizationId,code,name,active,updatedAt",

      curriculums:
        "id,accountId,schoolId,branchId,organizationId,programId,academicStructureId,name,active,updatedAt",

      curriculumPathways:
        "id,accountId,schoolId,branchId,curriculumId,active,updatedAt",

      curriculumSubjects: "id,accountId, schoolId, branchId,curriculumId,subjectId,pathwayId,organizationId,active",

      classSubjects: 
        "id,accountId, schoolId, branchId, classId, subjectId, curriculumSubjectId,academicStructureId, academicPeriodId, teacherId, active, locked",
        
        
      subjectPrerequisites:
        "id,accountId, schoolId, branchId,curriculumSubjectId,prerequisiteSubjectId,type,active,updatedAt",

      studentCurriculums:
        "id,accountId,schoolId,branchId,studentId,curriculumId,status,active,updatedAt",

      subjectOfferings:
        "id,accountId,schoolId,branchId,classSubjectId,curriculumSubjectId,subjectId,classId,academicPeriodId,teacherId,active,updatedAt",

      assignments:
        "id,accountId,schoolId,branchId,teacherId,classId,subjectId",

      classTeachers:
        "id,accountId,schoolId,branchId,classId,teacherId",

      studentEnrollments:
        "id,accountId,schoolId,branchId,studentId,classId,academicPeriodId,status,updatedAt",

      gradingStructures:
        "id,accountId,schoolId,branchId,organizationId,name,type,active,updatedAt",

      gradeRules:
       "id,accountId,schoolId,branchId,gradingStructureId,minScore,maxScore,grade,order,updatedAt",

      assessmentStructures:
        "id,accountId, schoolId, branchId,organizationId,academicStructureId,name,active,updatedAt",

      assessmentStructureItems:
        "id,accountId, schoolId, branchId,assessmentStructureId,order,active,updatedAt",

      assessmentApplicabilities:
       "id,accountId,schoolId,branchId,classSubjectId,assessmentStructureId,gradingStructureId,active,locked",

      assessmentComponents:
        "id,accountId, schoolId, branchId,classId,subjectId,academicPeriodId,assessmentStructureId,active",

      assessmentEntries:
        "id,accountId, schoolId, branchId,classSubjectId,studentId,assessmentStructureItemId,published,active",

      computedResults:
        "id,accountId, schoolId, branchId,classSubjectId,studentId,grade,gpa,position,published",

      attendance:
        "id,accountId, schoolId, branchId,studentId,classId,academicPeriodId,date",

      studentAttendanceSummaries:
        "id,accountId,schoolId,branchId,studentId,classId,academicStructureId,academicPeriodId,entryMode,updatedAt,synced,[accountId+schoolId+branchId+studentId+classId+academicStructureId+academicPeriodId]",

      teacherAttendance:
        "id,accountId,schoolId,branchId,teacherId,date,sessionId,verificationStatus,updatedAt,synced,[accountId+branchId+teacherId+date]",

      attendanceSessions:
        "id,accountId,schoolId,branchId,academicStructureId,academicPeriodId,classId,teacherId,scopeType,scopeId,date,status,openedAt,closedAt,updatedAt,synced,[accountId+branchId+date],[classId+date]",

      attendanceDevices:
        "id,accountId,schoolId,branchId,deviceType,provider,providerDeviceId,serialNumber,active,lastSeenAt,lastSyncAt,updatedAt,synced,[accountId+branchId+active]",

      attendanceCredentials:
        "id,accountId,schoolId,branchId,personType,personId,credentialType,status,provider,providerCredentialId,serialNumber,generatedAt,generatedByUserId,enrolledAt,expiresAt,revokedAt,lastUsedAt,updatedAt,synced,[accountId+branchId+personType+personId],[personId+credentialType+status]",

      attendanceCredentialEvents:
        "id,accountId,schoolId,branchId,credentialId,personType,personId,eventType,occurredAt,performedByUserId,attendanceDeviceId,updatedAt,synced,[credentialId+occurredAt],[personId+occurredAt]",

      attendanceCaptureEvents:
        "id,accountId,schoolId,branchId,sessionId,personType,personId,credentialId,attendanceDeviceId,captureMethod,capturedAt,verificationStatus,attendanceStatus,attendanceRecordId,duplicateOfEventId,updatedAt,synced,[sessionId+capturedAt],[personId+capturedAt],[accountId+branchId+capturedAt]",

      attendanceEvidenceAssets:
        "id,accountId,schoolId,branchId,captureEventId,mediaAssetId,evidenceType,retainedUntil,active,updatedAt,synced,[captureEventId+evidenceType]",


      // Shared identity foundation.
      identityCredentials:
        "id,accountId,schoolId,branchId,subjectType,subjectId,credentialType,status,credentialReference,tokenHash,serialNumber,provider,providerCredentialId,expiresAt,lastUsedAt,updatedAt,synced,[accountId+subjectType+subjectId],[subjectId+credentialType+status],[accountId+credentialReference],[accountId+tokenHash]",

      identityCredentialDesignSettings:
        "id,accountId,schoolId,branchId,name,templateKey,subjectType,credentialType,orientation,isDefault,active,updatedAt,synced,[accountId+schoolId+branchId],[branchId+active],[branchId+subjectType+credentialType],[branchId+isDefault]",

      identityCredentialEvents:
        "id,accountId,schoolId,branchId,credentialId,subjectType,subjectId,eventType,occurredAt,identityDeviceId,purpose,updatedAt,synced,[credentialId+occurredAt],[subjectId+occurredAt]",

      identityDevices:
        "id,accountId,schoolId,branchId,deviceType,status,provider,providerDeviceId,serialNumber,accessPointId,active,lastSeenAt,lastSyncAt,updatedAt,synced,[accountId+branchId+active],[accessPointId+active]",

      identityAccessPoints:
        "id,accountId,schoolId,branchId,name,code,accessPointType,organizationId,classId,vehicleId,active,updatedAt,synced,[accountId+branchId+accessPointType],[branchId+active]",

      identityActivityEvents:
        "id,accountId,schoolId,branchId,subjectType,subjectId,credentialId,identityDeviceId,accessPointId,purpose,action,occurredAt,verificationStatus,outcome,relatedTable,relatedRecordId,duplicateOfEventId,updatedAt,synced,[subjectId+occurredAt],[accessPointId+occurredAt],[purpose+occurredAt],[accountId+branchId+occurredAt]",

      identityEvidenceAssets:
        "id,accountId,schoolId,branchId,activityEventId,mediaAssetId,evidenceType,retainedUntil,active,updatedAt,synced,[activityEventId+evidenceType]",

      studentIdentityCards:
        "id,accountId,schoolId,branchId,studentId,credentialId,cardNumber,status,issuedAt,expiresAt,printedAt,replacementOfCardId,active,updatedAt,synced,[studentId+status],[accountId+cardNumber]",

      pickupAuthorizations:
        "id,accountId,schoolId,branchId,studentId,authorizedPersonType,authorizedPersonId,credentialId,status,validFrom,validUntil,approvedAt,revokedAt,updatedAt,synced,[studentId+status],[authorizedPersonId+status]",

      studentPickupEvents:
        "id,accountId,schoolId,branchId,studentId,authorizationId,collectorSubjectType,collectorSubjectId,credentialId,identityActivityEventId,status,requestedAt,approvedAt,releasedAt,updatedAt,synced,[studentId+releasedAt],[branchId+status+requestedAt]",

      visitorProfiles:
        "id,accountId,schoolId,branchId,fullName,phone,email,blocked,lastVisitAt,active,updatedAt,synced,[accountId+branchId+phone]",

      visitorVisits:
        "id,accountId,schoolId,branchId,visitorId,status,expectedAt,checkedInAt,checkedOutAt,credentialId,accessPointId,updatedAt,synced,[visitorId+checkedInAt],[branchId+status+checkedInAt]",

      schoolVehicles:
        "id,accountId,schoolId,branchId,name,registrationNumber,vehicleType,identityDeviceId,active,updatedAt,synced,[accountId+registrationNumber],[branchId+active]",

      transportRoutes:
        "id,accountId,schoolId,branchId,name,code,active,updatedAt,synced,[branchId+active]",

      transportStops:
        "id,accountId,schoolId,branchId,routeId,name,order,active,updatedAt,synced,[routeId+order]",

      studentTransportAssignments:
        "id,accountId,schoolId,branchId,studentId,routeId,vehicleId,pickupStopId,dropoffStopId,status,validFrom,validUntil,active,updatedAt,synced,[studentId+status],[routeId+active]",

      transportJourneys:
        "id,accountId,schoolId,branchId,vehicleId,routeId,date,direction,status,startedAt,arrivedAt,completedAt,updatedAt,synced,[vehicleId+date],[routeId+date],[branchId+status+date]",

      transportJourneyEvents:
        "id,accountId,schoolId,branchId,journeyId,studentId,assignmentId,stopId,credentialId,identityActivityEventId,eventType,occurredAt,updatedAt,synced,[journeyId+studentId+eventType],[studentId+occurredAt]",

      emergencyRollCallSessions:
        "id,accountId,schoolId,branchId,emergencyType,status,startedAt,endedAt,accessPointId,updatedAt,synced,[branchId+status+startedAt]",

      emergencyRollCallEntries:
        "id,accountId,schoolId,branchId,sessionId,subjectType,subjectId,status,confirmedAt,identityActivityEventId,updatedAt,synced,[sessionId+subjectType+subjectId],[sessionId+status]",

      reportCards:
        "id,accountId, schoolId, branchId,studentId,classId,academicPeriodId",

      reportCardItems:
        "id,accountId, schoolId, branchId,reportCardId,subjectId,academicPeriodId",

      reportCardTemplates:
        "id,accountId,schoolId,branchId,code,layoutKey,templateKey,name,reportType,isDefault,active,updatedAt,[accountId+schoolId+branchId+reportType],[branchId+reportType+active]",

      reportCardTemplateSettings:
        "id,accountId,schoolId,branchId,templateId,templateCode,layoutKey,templateKey,name,reportType,active,updatedAt,[accountId+schoolId+branchId+reportType],[branchId+reportType+active],[templateId+reportType]",

      reportCardTemplateAssignments:
        "id,accountId,schoolId,branchId,templateId,templateSettingsId,templateCode,layoutKey,templateKey,reportType,scopeType,scopeId,academicStructureId,academicPeriodId,classId,level,studentId,isDefault,active,updatedAt,[accountId+schoolId+branchId+reportType],[branchId+reportType+active],[reportType+scopeType+scopeId]",

      studentReportSnapshots:
        "id,accountId, schoolId, branchId, studentId, classId, academicStructureId, academicPeriodId, promotedToClassId, snapshotType, synced, isDeleted, updatedAt",

      studentPromotions:
        "id,accountId, schoolId, branchId, studentId, fromClassId, toClassId, fromAcademicStructureId, toAcademicStructureId, fromAcademicPeriodId, toAcademicPeriodId, average, recommendation, finalDecision, snapshotId, note",

      schoolBranchSettings:
        "id,accountId, schoolId, branchId, currentAcademicStructureId, currentAcademicPeriodId, synced, isDeleted, updatedAt",

      currencies:
        "id,accountId,code,countryCode,active,default,updatedAt",

      schoolCurrencySettings:
        "id,accountId,schoolId,branchId,currencyCode,active,updatedAt",

      paymentIntents:
        "id,accountId,schoolId,branchId,purpose,studentId,parentId,teacherId,feeInvoiceId,incomeId,payrollRunId,payrollItemId,status,channel,provider,providerReference,updatedAt",

      paymentTransactions:
        "id,accountId,schoolId,branchId,paymentIntentId,purpose,direction,status,channel,provider,providerReference,receiptNumber,referenceNumber,paidAt,updatedAt",

      paymentProviderEvents:
        "id,accountId,schoolId,branchId,provider,eventType,providerReference,paymentIntentId,paymentTransactionId,processed,createdAt,updatedAt",

      paymentRefunds:
        "id,accountId,schoolId,branchId,paymentTransactionId,status,provider,providerReference,refundedAt,updatedAt",

      paymentSettlements:
        "id,accountId,schoolId,branchId,paymentTransactionId,status,provider,providerReference,referenceNumber,settledAt,updatedAt",

      withdrawalRequests:
        "id,accountId,schoolId,branchId,status,method,referenceNumber,requestedAt,approvedAt,paidAt,updatedAt",

      schoolPayoutSettings:
        "id,accountId,schoolId,branchId,preferredMethod,settlementMode,paystackSubaccountCode,status,active,updatedAt",

      studentFeeInvoices:
        "id,accountId,schoolId,branchId,studentId,classId,academicStructureId,academicPeriodId,invoiceNumber,status,dueDate,paidAt,updatedAt",

      studentFeeInvoiceItems:
        "id,accountId,schoolId,branchId,invoiceId,feeStructureId,name,required,order,updatedAt",

      studentFeePayments:
        "id,accountId,schoolId,branchId,invoiceId,studentId,parentId,status,method,provider,paymentIntentId,paymentTransactionId,receiptNumber,referenceNumber,providerReference,date,paidAt,updatedAt",

      staffPayrollProfiles:
        "id,accountId,schoolId,branchId,teacherId,staffUserId,fullName,payType,preferredPaymentMethod,active,updatedAt",

      payrollRuns:
        "id,accountId,schoolId,branchId,status,periodStart,periodEnd,payDate,approvedAt,processedAt,locked,updatedAt",

      payrollItems:
        "id,accountId,schoolId,branchId,payrollRunId,payrollProfileId,teacherId,staffUserId,status,paymentMethod,provider,paymentIntentId,paymentTransactionId,paidAt,updatedAt",

      staffPaymentRecords:
        "id,accountId,schoolId,branchId,teacherId,staffUserId,payrollRunId,payrollItemId,status,method,provider,referenceNumber,receiptNumber,providerReference,date,paidAt,updatedAt",

      portalHighlights:
        "id,accountId,schoolId,branchId,placement,status,active,mediaType,displayOrder,startAt,endAt,publishedAt,updatedAt,isDeleted,synced,[accountId+schoolId+branchId],[branchId+placement+active+displayOrder],[branchId+status+startAt]",

      websiteSettings:
        "id,accountId,schoolId,branchId,eleeveonSlug,templateKey,status,primaryDomainId,homePageId,publishedAt,isDeleted,updatedAt,synced,&[accountId+eleeveonSlug],[schoolId+status]",

      websiteTemplateSettings:
        "id,accountId,schoolId,branchId,websiteSettingId,templateKey,templateVersion,active,isDeleted,updatedAt,synced,[websiteSettingId+active],[websiteSettingId+templateKey],[schoolId+branchId+active]",

      websiteTemplateAssignments:
        "id,accountId,schoolId,branchId,websiteSettingId,templateSettingId,scopeType,scopeId,isDefault,active,isDeleted,updatedAt,synced,[websiteSettingId+scopeType+scopeId],[websiteSettingId+isDefault+active],[templateSettingId+active]",

      websitePages:
        "id,accountId,schoolId,branchId,websiteSettingId,slug,pageType,status,displayOrder,parentPageId,showInNavigation,publishedAt,isDeleted,updatedAt,synced,&[websiteSettingId+slug],[websiteSettingId+status+displayOrder]",

      websiteSections:
        "id,accountId,schoolId,branchId,websiteSettingId,pageId,sectionKey,sectionType,sourceType,sourceId,status,displayOrder,active,isDeleted,updatedAt,synced,[pageId+status+displayOrder],[websiteSettingId+sectionType]",

      websiteNavigationItems:
        "id,accountId,schoolId,branchId,websiteSettingId,location,parentItemId,targetType,pageId,sectionId,displayOrder,active,isDeleted,updatedAt,synced,[websiteSettingId+location+active+displayOrder]",

      websiteDomains:
        "id,accountId,schoolId,branchId,websiteSettingId,&hostname,domainType,status,sslStatus,isPrimary,redirectToPrimary,verifiedAt,active,isDeleted,updatedAt,synced,[websiteSettingId+isPrimary],[schoolId+status]",

      websiteDomainAliases:
        "id,accountId,schoolId,websiteSettingId,&sourceHostname,targetHostname,active,expiresAt,isDeleted,updatedAt,synced,[websiteSettingId+active]",

      websiteForms:
        "id,accountId,schoolId,branchId,websiteSettingId,pageId,sectionId,formType,active,isDeleted,updatedAt,synced,[websiteSettingId+formType+active]",

      websiteFormSubmissions:
        "id,accountId,schoolId,branchId,websiteSettingId,formId,status,submittedAt,email,phone,assignedToUserId,isDeleted,updatedAt,synced,[formId+status+submittedAt],[schoolId+status+submittedAt]",

      websiteRevisions:
        "id,accountId,schoolId,websiteSettingId,revisionNumber,status,publishedAt,createdAt,isDeleted,updatedAt,synced,&[websiteSettingId+revisionNumber],[websiteSettingId+status]",

      announcements:
        "id,accountId,schoolId,branchId,audience,classId,organizationId,published,publishAt,expiresAt,createdBy,updatedAt",

      announcementRecipients:
        "id,accountId,schoolId,branchId,announcementId,recipientType,recipientId,userId,status,deliveredAt,readAt,updatedAt",

      messageThreads:
        "id,accountId,schoolId,branchId,threadType,classId,organizationId,studentId,teacherId,parentId,createdBy,lastMessageAt,archived,updatedAt",

      messages:
        "id,accountId,schoolId,branchId,threadId,senderUserId,senderRole,channel,status,deliveredAt,readAt,updatedAt",


      calendarEvents:
    "id,accountId, schoolId, branchId, scopeType, scopeId, eventType, status, visibility, startAt, endAt, classId, subjectId, classSubjectId, teacherId, studentId, parentId, academicStructureId, academicPeriodId, announcementId, messageThreadId, createdByUserId, active, isDeleted, updatedAt, synced",

  calendarEventParticipants:
    "id,accountId, schoolId, branchId, eventId, participantType, participantId, userId, role, email, responseStatus, required, active, isDeleted, updatedAt, synced",

  calendarEventReminders:
    "id,accountId, schoolId, branchId, eventId, participantId, channel, minutesBefore, scheduledAt, sentAt, status, active, isDeleted, updatedAt, synced",

  calendarEventResponses:
    "id,accountId, schoolId, branchId, eventId, participantId, userId, participantType, responseStatus, respondedAt, isDeleted, updatedAt, synced",

  scheduleTimetables:
    "id,accountId, schoolId, branchId, name, timetableType, scopeType, scopeId, academicStructureId, academicPeriodId, classId, teacherId, effectiveFrom, effectiveTo, status, active, isDefault, isDeleted, updatedAt, synced",

  scheduleSessions:
    "id,accountId, schoolId, branchId, timetableId, sessionType, dayOfWeek, startMinute, endMinute, classId, subjectId, classSubjectId, teacherId, resourceId, active, isDeleted, updatedAt, synced",

  scheduleResources:
    "id,accountId, schoolId, branchId, name, resourceType, scopeType, scopeId, active, isDeleted, updatedAt, synced",

  scheduleConflicts:
    "id,accountId, schoolId, branchId, conflictType, severity, status, eventIdA, eventIdB, sessionIdA, sessionIdB, resourceId, teacherId, classId, studentId, detectedAt, resolvedAt, isDeleted, updatedAt, synced",
      communicationLogs:
        "id,accountId,schoolId,branchId,channel,purpose,relatedTable,relatedId,recipientType,recipientId,status,provider,providerReference,sentAt,deliveredAt,readAt,updatedAt",

      notificationTemplates:
        "id,accountId,schoolId,branchId,purpose,channel,name,active,updatedAt",

      feeStructures:
        "id,accountId,schoolId,branchId,classId,academicStructureId,academicPeriodId,currencyCode,updatedAt",

      payments:
        "id,accountId,schoolId,branchId,studentId,method,currencyCode,date,receiptNumber,updatedAt",

      incomes:
        "id,accountId,schoolId,branchId,organizationId,title,date,amount,paymentMethod,currencyCode,updatedAt",

      expenses:
        "id,accountId,schoolId,branchId,organizationId,title,date,amount,expenseSourceType,paymentMethod,currencyCode,updatedAt",
      
      mediaAssets:
        "id,accountId,schoolId,branchId,ownerTable,ownerId,ownerTempKey,fieldKey,ownerIdentityKey,assetKind,mimeType,uploadStatus,active,isDeleted,updatedAt,synced,[accountId+ownerIdentityKey],[accountId+ownerTable+fieldKey]",

      mediaBlobs:
        "++id,accountId,assetId,mimeType,sizeBytes,createdAt,updatedAt,[accountId+assetId]",
      
      appUsers:
        "id,accountId,email,role,active,updatedAt",

      userMemberships:
        "id,accountId,userId,role,schoolId,branchId,teacherId,studentId,parentId,active,updatedAt",

      permissionRules:
        "id,accountId,moduleKey,developer,owner,admin,branch,teacher,student,parent,accountant,locked,updatedAt",

      // ======================================================
      // PLATFORM / BACKEND CACHE STORES
      // ======================================================
      accounts:
        "id,email,status,createdAt,updatedAt",

      userSessions:
        "id,accountId,userId,deviceId,expiresAt,revokedAt,updatedAt",

      subscriptionPlans:
        "id,code,active,priceMonthly,priceTermly,priceYearly,updatedAt",

      accountSubscriptions:
        "id,accountId,planId,status,billingCycle,currentPeriodEnd,nextBillingDate,updatedAt",

      invoices:
        "id,accountId,subscriptionId,invoiceNumber,status,dueDate,paidAt,updatedAt",

      appPayments:
        "id,accountId,subscriptionId,invoiceId,status,method,provider,providerReference,receiptNumber,paidAt,updatedAt",

      billingEvents:
        "id,accountId,type,createdAt",

      syncDevices:
        "id,accountId,deviceId,userId,lastSeenAt,active,updatedAt",

      syncConflicts:
        "id,accountId,tableName,localId,deviceId,status,resolvedAt,updatedAt",

      apiClients:
        "id,accountId,clientId,name,active,lastUsedAt,updatedAt",

      apiKeys:
        "id,accountId,apiClientId,keyPrefix,name,active,expiresAt,lastUsedAt,updatedAt",

      webhooks:
        "id,accountId,name,active,lastTriggeredAt,updatedAt",

      webhookLogs:
        "id,accountId,webhookId,eventType,status,statusCode,deliveredAt,createdAt",

      integrationMappings:
        "id,accountId,integrationKey,localTable,localId,externalId,updatedAt",

      auditLogs:
        "id,accountId,userId,action,entityType,entityId,schoolId,branchId,createdAt",

      backgroundJobs:
        "id,accountId,type,status,priority,scheduledAt,startedAt,completedAt,updatedAt",

      storageUsages:
        "id,accountId,lastCalculatedAt,updatedAt",

      accountFeatureFlags:
        "id,accountId,key,enabled,updatedAt",

      accountSystemSettings:
        "id,accountId,key,updatedAt",

      notificationDeliveryLogs:
        "id,accountId,channel,purpose,status,provider,providerReference,sentAt,deliveredAt,readAt,updatedAt",
    };


/** Historical aliases used by the versioned schema layer. */
export const LEGACY_STORES_V1 = LEGACY_DB_STORES;
export const LEGACY_STORES_V2 = LEGACY_DB_STORES;
