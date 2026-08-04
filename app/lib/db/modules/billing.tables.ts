/**
 * app/lib/db/modules/billing.tables.ts
 * --------------------------------------------------------------------------
 * Dexie store definitions for the billing, subscriptions and licensing module.
 *
 * This file contains store/index declarations only. Domain interfaces remain
 * available from db.ts during the compatibility phase and may be extracted
 * into dedicated type modules later.
 */

import { branchScopedIndexes, platformCacheIndexes } from "../core/indexes";

export const BILLING_TABLE_NAMES = [
  "currencies",
  "schoolCurrencySettings",
  "paymentIntents",
  "paymentTransactions",
  "paymentRefunds",
  "paymentSettlements",
  "withdrawalRequests",
  "schoolPayoutSettings",
  "studentFeeInvoices",
  "studentFeeInvoiceItems",
  "studentFeePayments",
  "staffPayrollProfiles",
  "payrollRuns",
  "payrollItems",
  "staffPaymentRecords",
  "feeStructures",
  "payments",
  "incomes",
  "expenses",
  "commercialPlans",
  "subscriptionPlans",
  "accountSubscriptions",
  "subscriptionPeriods",
  "subscriptionChangeOrders",
  "privateOffers",
  "privateOfferAssignments",
  "pricingOverrides",
  "accountUsageSnapshots",
  "accountEntitlements",
  "perpetualLicenses",
  "licenseActivations",
  "licenseValidationEvents",
  "licenseUpgradeOffers",
  "invoices",
  "appPayments",
  "billingEvents",
] as const;

export const BILLING_STORES: Record<string, string> = {
  currencies: platformCacheIndexes("code,name,symbol,active,updatedAt"),
  schoolCurrencySettings: branchScopedIndexes(
    "schoolId,branchId,currencyCode,isDefault,active,updatedAt",
  ),
  paymentIntents: branchScopedIndexes(
    "schoolId,branchId,studentId,purpose,status,provider,reference,createdAt,updatedAt",
  ),
  paymentTransactions: branchScopedIndexes(
    "schoolId,branchId,paymentIntentId,studentId,status,provider,providerReference,paidAt,updatedAt",
  ),
  paymentRefunds: branchScopedIndexes(
    "schoolId,branchId,paymentTransactionId,status,provider,providerReference,refundedAt,updatedAt",
  ),
  paymentSettlements: branchScopedIndexes(
    "schoolId,branchId,provider,status,settlementReference,settledAt,updatedAt",
  ),
  withdrawalRequests: branchScopedIndexes(
    "schoolId,branchId,status,requestedAt,processedAt,updatedAt",
  ),
  schoolPayoutSettings: branchScopedIndexes(
    "schoolId,branchId,provider,active,updatedAt",
  ),
  studentFeeInvoices: branchScopedIndexes(
    "schoolId,branchId,studentId,classId,academicStructureId,academicPeriodId,status,dueDate,updatedAt",
  ),
  studentFeeInvoiceItems: branchScopedIndexes(
    "schoolId,branchId,invoiceId,feeStructureId,status,updatedAt",
  ),
  studentFeePayments: branchScopedIndexes(
    "schoolId,branchId,studentId,invoiceId,paymentTransactionId,status,date,receiptNumber,updatedAt",
  ),
  staffPayrollProfiles: branchScopedIndexes(
    "schoolId,branchId,teacherId,staffUserId,payType,active,updatedAt",
  ),
  payrollRuns: branchScopedIndexes(
    "schoolId,branchId,status,periodStart,periodEnd,payDate,updatedAt",
  ),
  payrollItems: branchScopedIndexes(
    "schoolId,branchId,payrollRunId,payrollProfileId,teacherId,staffUserId,status,updatedAt",
  ),
  staffPaymentRecords: branchScopedIndexes(
    "schoolId,branchId,teacherId,staffUserId,payrollRunId,payrollItemId,status,date,receiptNumber,updatedAt",
  ),
  feeStructures: branchScopedIndexes(
    "schoolId,branchId,classId,academicStructureId,academicPeriodId,currencyCode,active,updatedAt",
  ),
  payments: branchScopedIndexes(
    "schoolId,branchId,studentId,method,currencyCode,date,receiptNumber,updatedAt",
  ),
  incomes: branchScopedIndexes(
    "schoolId,branchId,organizationId,title,date,amount,paymentMethod,currencyCode,updatedAt",
  ),
  expenses: branchScopedIndexes(
    "schoolId,branchId,organizationId,title,date,amount,expenseSourceType,paymentMethod,currencyCode,updatedAt",
  ),

  commercialPlans: platformCacheIndexes(
    "code,licenseModel,deploymentMode,syncPolicy,updatePolicy,active,displayOrder,priceMonthly,priceTermly,priceYearly,priceOneTime,updatedAt",
  ),
  subscriptionPlans: platformCacheIndexes(
    "code,active,priceMonthly,priceTermly,priceYearly,updatedAt",
  ),
  accountSubscriptions: platformCacheIndexes(
    "accountId,planId,status,billingCycle,currentPeriodStart,currentPeriodEnd,nextBillingDate,scheduledPlanId,scheduledChangeAt,entitlementVersion,updatedAt",
  ),
  subscriptionPeriods: platformCacheIndexes(
    "accountId,subscriptionId,planId,billingCycle,startsAt,endsAt,status,sourceType,updatedAt",
  ),
  subscriptionChangeOrders: platformCacheIndexes(
    "accountId,subscriptionId,fromPlanId,toPlanId,changeType,status,effectiveAt,quoteExpiresAt,updatedAt",
  ),
  privateOffers: platformCacheIndexes(
    "code,basePlanId,licenseModel,active,validFrom,validUntil,updatedAt",
  ),
  privateOfferAssignments: platformCacheIndexes(
    "accountId,offerId,status,assignedAt,validUntil,updatedAt,[accountId+offerId]",
  ),
  pricingOverrides: platformCacheIndexes(
    "accountId,planId,active,validFrom,validUntil,updatedAt,[accountId+planId]",
  ),
  accountUsageSnapshots: platformCacheIndexes(
    "accountId,students,teachers,branches,users,storageMb,calculatedAt,entitlementVersion,updatedAt",
  ),
  accountEntitlements: platformCacheIndexes(
    "accountId,planId,perpetualLicenseId,source,status,licenseModel,deploymentMode,syncPolicy,updatePolicy,validUntil,graceEndsAt,version,rebuiltAt,updatedAt",
  ),
  perpetualLicenses: platformCacheIndexes(
    "accountId,planId,licenseKey,status,licensedMajorVersion,syncPolicy,updatePolicy,maxDevices,maxActivations,validationRequired,nextValidationAt,createdAt,updatedAt",
  ),
  licenseActivations: platformCacheIndexes(
    "accountId,licenseId,deviceId,status,activatedAt,lastValidatedAt,deactivatedAt,updatedAt,[licenseId+deviceId]",
  ),
  licenseValidationEvents: platformCacheIndexes(
    "accountId,licenseId,activationId,deviceId,status,validatedAt,createdAt",
  ),
  licenseUpgradeOffers: platformCacheIndexes(
    "accountId,licenseId,fromPlanId,toPlanId,upgradeType,status,validFrom,validUntil,updatedAt",
  ),
  invoices: platformCacheIndexes(
    "accountId,subscriptionId,perpetualLicenseId,invoiceNumber,status,issueDate,dueDate,paidAt,updatedAt",
  ),
  appPayments: platformCacheIndexes(
    "accountId,subscriptionId,perpetualLicenseId,invoiceId,status,method,provider,providerReference,receiptNumber,paidAt,updatedAt",
  ),
  billingEvents: platformCacheIndexes(
    "accountId,type,createdAt",
  ),
};
