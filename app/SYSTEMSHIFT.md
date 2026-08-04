Worked for 33s

Yes, I understand the scale of the upgrade.

This should be treated as Eleeveon Platform Schema Version 2, not as several independent feature upgrades. The correct strategy is to define all shared foundations first, perform one coordinated Prisma/Dexie migration, register every new synchronized table once, and then build the features on top.

Your scheduling plan independently reaches the same conclusion: database, migration, and sync must be Phase 1 before participant resolution, constraints, generation, recovery, and publishing.

Unified upgrade objective

The upgrade combines seven connected systems:

Subscription, licensing, entitlements, private offers, and quotas.
Hierarchical assessment items and configurable report presentation.
Advanced timetable generation and scheduling intelligence.
Portal identity, developer notices, feedback, complaints, and suggestions.
Hybrid subscription and offline perpetual licensing.
Full multilingual architecture with no new hardcoded user-facing text.
Modular Dexie schema organization.

These should share one coordinated schema and runtime rather than creating separate implementations.

The essential architectural decision

Eleeveon has one core application and two licence families:

Eleeveon Connected

Your normal subscription product:

Offline-first local operation
Cloud synchronization
Protected backup
Continuous updates
Connected portals
Developer notices
Remote services
Subscription renewal
Eleeveon Offline

A perpetual, capacity-limited licence:

Offline operation
No school-data synchronization
Fixed entitled version
Student and branch limits
Optional paid version upgrades
Lightweight internet connection for licence verification, update notices, and support messages
Later conversion to Connected without rebuilding records

Do not model these merely as feature flags inside SubscriptionPlan. Introduce a proper licence/deployment contract.

type LicenseModel =
  | "subscription"
  | "perpetual"
  | "trial"
  | "complimentary";

type DeploymentMode =
  | "connected"
  | "offline";

type UpdatePolicy =
  | "continuous"
  | "security_only"
  | "version_locked";

type SyncPolicy =
  | "full"
  | "platform_only"
  | "disabled";

platform_only is important: an offline school can receive your announcements, licence status, and available-version notices without uploading school records.

Your current Prisma plan already contains capacity limits, feature flags, offline sync, cloud backup, private offers, pricing overrides, and entitlement relations, so the new work should extend that foundation rather than replace it.

The implementation order
Phase 0 — Freeze and specification

Before editing Prisma or Dexie, create one canonical specification containing:

All new tables
All new enums
Ownership and scope rules
Which tables sync
Which are backend-only
Which arrive through platform cache
Entitlement requirements
Translation-key rules
Migration defaults
Backward-compatibility fields

This prevents adding a table during scheduling, then reopening the same migration for notifications, assessment hierarchy, licensing, or translations.

Create:

docs/platform-v2/
  architecture.md
  schema-map.md
  sync-classification.md
  entitlement-map.md
  migration-contract.md
  localization-contract.md

No feature UI should be rebuilt before this contract is fixed.

Phase 1 — Modularize Dexie before expanding it

Your current db.ts is already extremely large. It should no longer own every interface and table definition directly.

Use this structure:

app/lib/db/
  db.ts
  db-version.ts
  db-migrations.ts
  db-health.ts
  db-backup.ts

  core/
    base.ts
    registry.ts
    indexes.ts

  modules/
    accounts.tables.ts
    academics.tables.ts
    assessments.tables.ts
    attendance.tables.ts
    billing.tables.ts
    communications.tables.ts
    feedback.tables.ts
    identity.tables.ts
    localization.tables.ts
    media.tables.ts
    scheduling.tables.ts
    schools.tables.ts
    websites.tables.ts

  schema/
    schema-v1.ts
    schema-v2.ts
    build-schema.ts

  migrations/
    v1-to-v2.ts
    assessment-hierarchy.ts
    scheduling-foundation.ts
    licence-foundation.ts

Each module file should export:

export interface AssessmentTables {
  assessmentStructures: Table<AssessmentStructure>;
  assessmentStructureItems: Table<AssessmentStructureItem>;
}

export const assessmentStores = {
  assessmentStructures: "...indexes...",
  assessmentStructureItems: "...indexes...",
} as const;

Then db.ts becomes the composition root:

const stores = {
  ...schoolStores,
  ...academicStores,
  ...assessmentStores,
  ...schedulingStores,
  ...communicationStores,
  ...billingStores,
};

Important constraints:

Keep exactly one Dexie instance.
Do not split into separate databases.
Preserve current table names.
Do not move interfaces and change runtime behavior in the same commit.
First perform a structural refactor with zero schema change.
Then introduce database version 2.

The scheduling document explicitly requires preserving the single Dexie instance and existing records while registering all new tables in sync.

Phase 2 — One Prisma and Dexie Platform V2 migration

This phase introduces the shared schema for every major upgrade.

A. Licensing and entitlement additions

Extend SubscriptionPlan or introduce a broader CommercialPlan abstraction with:

licenseModel
deploymentMode
syncPolicy
updatePolicy
licensedMajorVersion
minimumAppVersion
maximumAppVersion
deviceLimit
activationLimit
requiresPeriodicValidation
validationIntervalDays
offlineGraceDays

Add:

PerpetualLicense
LicenseActivation
LicenseDevice
LicenseVersionEntitlement
LicenseUpgradeOffer
LicenseValidationEvent

Keep:

SubscriptionPeriod
SubscriptionChangeOrder
AccountEntitlement
AccountUsageSnapshot
PrivateOffer
PrivateOfferAssignment
AccountPricingOverride
AccountQuotaEvent

A subscription and a perpetual licence should both resolve into the same effective entitlement snapshot.

type EffectiveAccessSource =
  | "subscription"
  | "perpetual_license"
  | "trial"
  | "private_offer"
  | "developer_override";

That allows the rest of the app to ask:

access.can("reports");
access.limit("students");
access.syncPolicy;

rather than checking subscription records directly.

B. Hierarchical assessment items

Your current AssessmentStructureItem is flat: it has structure ID, name, weight, maximum score, order, and compulsory status, but no parent-child relationship.

Extend it with:

parentItemId?: string | null;
level: number;
path?: string;
itemType:
  | "group"
  | "scored_item"
  | "computed_total";

aggregationMode:
  | "sum"
  | "weighted_sum"
  | "average"
  | "best_n"
  | "custom";

contributionWeight?: number;
reportVisibility:
  | "show"
  | "hide"
  | "inherit";

entryMode:
  | "direct"
  | "from_children"
  | "direct_or_children";

allowChildEntry?: boolean;
showChildrenOnReport?: boolean;
showParentOnReport?: boolean;

Example:

Class Score — 40 marks
├── Class Test — 20 marks
└── Project — 20 marks

Schools could choose:

Enter Class Test and Project, compute Class Score.
Enter only Class Score.
Show all three on reports.
Show only Class Score.
Show children on broadsheets but only the parent on report cards.

Do not rely solely on recursive UI rendering. Add a normalized calculation service:

app/lib/assessments/
  hierarchy.ts
  aggregation.ts
  validation.ts
  reportProjection.ts
  entryProjection.ts

The report template must consume an already-resolved projection rather than independently deciding which nodes to show.

Migration rule:

Existing items receive parentItemId = null.
Existing items receive level = 0.
Existing items use itemType = "scored_item".
Existing report behavior remains unchanged.
C. Scheduling foundation

Add the scheduling tables from the master plan in the same schema upgrade:

schedulePeriodTemplates
schedulePeriodTemplateAssignments
schedulePeriodSlots
scheduleSharedBlocks
scheduleSharedBlockGroups
scheduleSharedBlockTeachers

scheduleGroups
scheduleGroupMembers

scheduleTeacherAvailability
scheduleTeacherWorkloadRules

scheduleSubjectRequirements
scheduleRequirementGroups
scheduleRequirementTeachers
scheduleResourceRequirements
scheduleConstraintRules

scheduleSessionGroups
scheduleSessionTeachers
scheduleSessionResources

scheduleGenerationRuns
scheduleDrafts
scheduleDraftSessions
scheduleDraftSessionGroups
scheduleDraftSessionTeachers
scheduleDraftSessionResources
scheduleGenerationIssues

scheduleGenerationSuggestions
scheduleSuggestionRequirements
scheduleSuggestionGroups
scheduleSuggestionTeachers
scheduleSuggestionResources

schedulePublishEvents
scheduleVersionSnapshots

The scheduling design intentionally uses one authoritative timetable with class, teacher, student, parent, room, and resource projections—not separate unrelated timetables.

That means portal timetable pages must eventually become projections over the same sessions.

D. Developer announcements and feedback

Create two separate domains.

Platform communications from you
PlatformAnnouncement
PlatformAnnouncementAudience
PlatformAnnouncementDelivery
PlatformAnnouncementDismissal
PlatformRelease
PlatformReleaseNote
PlatformUpgradeCampaign

Audience filters could include:

all
deployment mode
licence model
plan
country
language
app version
role
account
school
branch

These should be backend-owned and distributed through platform cache, not normal school-data sync.

Feedback sent to Eleeveon
PlatformFeedback
PlatformFeedbackAttachment
PlatformFeedbackMessage
PlatformFeedbackStatusEvent

Types:

suggestion
complaint
bug
support_request
feature_request
billing_question
general_feedback

Statuses:

submitted
acknowledged
under_review
planned
in_progress
resolved
closed

This data should go directly to your backend and must not be mixed with ordinary school communications.

E. Localization schema

Do not create a translated copy of every database table.

Use three layers:

System UI translations

Static language resources:

app/lib/i18n/
  config.ts
  locale.ts
  translator.ts
  namespaces/
    common.en.ts
    common.fr.ts
    assessments.en.ts
    assessments.fr.ts
User language preference

Add:

AppUser.preferredLocale
UserMembership.preferredLocale
Account.defaultLocale
School.defaultLocale
Branch.defaultLocale

Resolution order:

membership preference
→ user preference
→ branch default
→ school default
→ account default
→ application fallback
Configurable translated school labels

For school-defined labels that need multiple languages:

LocalizedText
- entityType
- entityId
- fieldKey
- locale
- value

Use this only where schools truly need bilingual output, such as:

Report labels
Assessment item names
Academic period labels
Public website content
Notification templates

Do not automatically translate student names or arbitrary school-entered data.

Phase 3 — Sync classification and enforcement

Every new table must be classified before registration.

Local-first synchronized

Examples:

Assessment hierarchy
Scheduling structures
Scheduling sessions and drafts
School translation overrides
Announcement dismissals
Locally queued feedback submissions
Backend cache

Examples:

Effective entitlement snapshot
Current commercial agreement
Platform announcements
Release notes
Available upgrade offers
Supported locales
Licence state
Backend-only

Examples:

Payment provider events
Private-offer administration
Pricing override audit
Licence activations
Platform feedback administration
Developer announcement authoring
Usage reconciliation
Subscription jobs
Entitlement audit history
Offline licence sync policy

Do not simply stop all internet requests.

switch (entitlement.syncPolicy) {
  case "full":
    // School-data push/pull and platform cache.
    break;

  case "platform_only":
    // Licence, notices, updates, feedback and support only.
    break;

  case "disabled":
    // No network activity unless user explicitly activates or updates.
    break;
}

Add the proposed:

src/sync/subscription-sync-policy.service.ts

but rename it more broadly to:

src/sync/access-sync-policy.service.ts

because the policy must support perpetual licences, not only subscriptions.

Phase 4 — Entitlement runtime before feature UI

Complete the missing backend entitlements module and frontend subscription/access context before rebuilding plan pages.

Backend

Create the entitlement module you listed, but make the resolver commercial-model neutral:

src/entitlements/
  entitlement-resolver.service.ts
  entitlement-policy.service.ts
  usage.service.ts
  entitlement.guard.ts
  resource-limit.guard.ts

Resolution order:

developer override
→ private offer
→ account pricing override
→ active subscription or perpetual licence
→ plan defaults
→ safe fallback
Frontend

I recommend renaming:

subscription-context.tsx

to:

access-context.tsx

or:

commercial-access-context.tsx

A subscription context alone will become misleading once perpetual licences exist.

Expose:

const {
  access,
  commercialAgreement,
  usage,
  can,
  limit,
  remaining,
  deploymentMode,
  syncPolicy,
  updatePolicy,
  refreshAccess,
} = useAccess();

Then all mutations use one guard:

await guardMutation({
  feature: "students",
  resource: "students",
  operation: "create",
});

No page should manually inspect plan fields.

Phase 5 — Assessment hierarchy implementation

Once schema, migration, and sync are stable:

Rebuild Assessment Structures as a tree editor.
Add parent/child creation and drag ordering.
Add validation for maximum score and weight totals.
Rebuild Assessment Entry using leaf-entry projections.
Create aggregation calculation.
Update computed results.
Update broadsheets.
Update report templates through one report projection service.
Add configurable parent/sub-item visibility.
Test old flat assessment structures unchanged.

Do not update each report template separately first. Build:

assessmentReportProjection.ts

and make all templates consume it.

That prevents repeating the hierarchy logic across Modern Clean, Letterhead Premium, Classical Formal, and every future template.

Phase 6 — Scheduling engine implementation

Follow the ten scheduling phases in the uploaded plan, but nest them within the larger platform programme:

Schema and sync foundation.
Domain and participant resolution.
Period templates and shared blocks.
Manual timetable grid.
Teacher availability and workload.
Subject requirements, groups, and resources.
Constraint and readiness engine.
Generation and scoring.
Recovery suggestions.
Publishing and projections.

The plan correctly separates hard conflicts such as teacher, class, room, and resource collisions from soft penalties such as gaps, poor subject distribution, and undesirable periods.

Keep the generator independent of React:

app/lib/scheduling/
  domain/
  constraints/
  generation/
  scoring/
  recovery/
  projections/
  repositories/

This also makes it possible to move generation to a Web Worker later.

Phase 7 — Portal shell and platform communication

The UUID issue is visible in the current implementation: roleScope() prints raw school and branch IDs, while roleDetail() prints raw teacher, student, or parent IDs.

Replace that with resolved display identity:

Teacher Portal
Mr. Daniel Mensah
Main Campus

not:

Teacher profile 53b53a9e-...
School 7a6... · Branch 991...

Create:

app/lib/portal/portalIdentity.ts

It should return:

{
  portalName: "Teacher Portal",
  personName: "Mr. Daniel Mensah",
  schoolName: "Bethesda Methodist School",
  branchName: "Main Campus",
  scopeLabel: "Main Campus",
}

The shell should use identifiers only internally.

Fixed developer notice section

Add a permanent but non-intrusive side-navigation area:

Updates from Eleeveon
• Version 2.1 available
• New report template
• Scheduled maintenance

Requirements:

Badge for unread notices
Dismiss or mark as read
Priority and expiry
Account/language/version targeting
Never block normal work except critical security or licence notices
Cached locally for offline reading
Feedback entry

Add a compact action:

Help improve Eleeveon

Opening:

Suggestion
Report a problem
Complaint
Ask for support
Billing question

Queue submissions locally when offline and send when internet becomes available, provided the licence allows platform communication.

Phase 8 — Internationalization rollout

“Do not hardcode language” must become an enforced development rule.

Do not attempt to translate all 300 screens manually in one uncontrolled sweep.

Use this sequence:

Install the i18n runtime and locale context.
Internationalize shell, authentication, navigation, dialogs, and shared components.
Internationalize new subscription/licensing pages.
Internationalize assessments.
Internationalize scheduling.
Internationalize report projections and PDF labels.
Convert remaining modules by domain.
Add a CI/static scan for new hardcoded user-facing strings.

Use namespaces:

t("assessment.structure.item.add")
t("subscription.usage.students")
t("scheduling.generation.noValidPlacement")

Avoid vague keys such as:

t("addButton2")

Dates, currencies, plurals, number formatting, and report labels must all use the active locale.

Phase 9 — Subscription and licence UI

Only after the access runtime is stable should you rebuild:

Owner Subscription
Developer Plans
Private Offers
Pricing Overrides
Account Entitlements
Subscription Changes
Usage Audit
Public pricing
Checkout

Your list of backend billing services is largely already represented in the uploaded source. The missing integration work is more important than recreating those files:

Wire services into entitlement resolution.
Add perpetual licence models and services.
Add access-aware sync policy.
Add frontend access bootstrap.
Add mutation enforcement.
Add reconciliation tests.
Add developer interfaces.

Private offers should support both:

subscription discount

and:

perpetual licence offer

For the first pilot school:

Public price: GHS 600/term
Private offer: GHS 300/term
Reason: Pilot partner
Duration: configurable

That should not alter the public plan.

Phase 10 — Cutover and verification

Do not release all features immediately after migration.

Use feature flags:

platformV2Schema
hierarchicalAssessments
advancedScheduling
platformAnnouncements
platformFeedback
perpetualLicensing
multilingualUi

Release sequence:

Schema opens and migration succeeds.
Existing data remains visible.
Sync push/pull/bootstrap works.
Entitlement snapshot resolves.
Existing flat assessments still work.
Existing timetable sessions still work.
Portal titles no longer expose UUIDs.
Platform notices load.
Feedback queues offline.
French can be enabled on selected shared surfaces.
New assessment hierarchy enabled for a test branch.
Scheduling engine enabled for a test branch.
Perpetual licence enabled for a controlled customer.
What should be done together

These belong in one coordinated foundation release:

Prisma additions
Dexie modularization
Dexie version increase
Migration rules
Sync registry additions
Entitlement snapshot format
Deployment/licence model
Localization preferences
Assessment hierarchy fields
Scheduling tables
Platform announcement tables
Feedback tables
What should not be implemented simultaneously

These should follow the foundation in separate vertical slices:

Full assessment-tree UI
Timetable generator
Every report template
Every translated screen
Complete developer dashboards
Perpetual checkout and activation UI

Trying to rewrite all screens at once would make errors very difficult to isolate.

Recommended master workstream
Platform V2 contract
        ↓
Modularize db.ts without schema changes
        ↓
Prisma + Dexie V2 schema
        ↓
Migration + sync registration
        ↓
Unified access/entitlement runtime
        ↓
Portal identity + announcements + feedback
        ↓
Hierarchical assessments
        ↓
Advanced scheduling
        ↓
Localization migration
        ↓
Subscription/perpetual commercial interfaces
        ↓
Controlled rollout

This is the unified upgrade path I recommend. The most important rule is: do not begin by rebuilding the visible pages. Start by defining the complete Platform V2 data contract, then modularize db.ts, then apply one coordinated migration. That foundation will let every later feature reuse the same access, sync, localization, messaging, and migration systems instead of forcing you to rewrite them repeatedly.




