Eleeveon Schools

Ordered File Update Plan: Class-Subject Report Order + Grading Structure Migration

This checklist covers two connected but separately implemented changes:

Add orderIndex to ClassSubject so report cards and broadsheets follow the class-specific subject order.

Rename the persisted gradingSystems concept to gradingStructures, rename foreign keys to gradingStructureId, and merge the two grading pages into one GradingSystem.tsx workspace.

Important: Complete the class-subject ordering work first and test it before starting the grading rename. The grading rename is a database, sync, report, UI, and backend migration—not only a component rename.

PHASE A — CLASS-SUBJECT REPORT ORDER

1. app/lib/db/db.ts

Uploaded as: db(20260806-142318).ts

Update first because every later file depends on the new contract.

Changes:

Add orderIndex?: number to ClassSubject.

Keep CurriculumSubject.orderIndex unchanged.

Do not make report templates calculate order independently.

Confirm the Dexie table declaration continues to use Table<ClassSubject>.

Purpose:

Makes the class-specific subject assignment the final source of report-card order.

2. app/lib/db/modules/academics.tables.ts

Uploaded as: academics.tables.ts

Changes:

Add orderIndex to the classSubjects Dexie index string.

Target store definition:

classSubjects: branchScopedIndexes(
  "schoolId,branchId,classId,subjectId,curriculumSubjectId,academicStructureId,academicPeriodId,teacherId,orderIndex,active,locked,updatedAt,[classId+subjectId]",
),

Purpose:

Registers the new field in the local database schema.

3. app/lib/db/db-version.ts

Not included in the upload; referenced by db.ts.

Changes:

Increment APP_DB_VERSION.

Purpose:

Forces Dexie to apply the changed classSubjects store definition.

4. app/lib/db/db-migrations.ts

Not included in the upload; referenced by db.ts.

Changes:

Add a migration for existing classSubjects rows.

For rows without orderIndex, copy the linked CurriculumSubject.orderIndex where available.

When no curriculum order exists, assign a stable next order within the same:

schoolId

branchId

classId

academicStructureId

academicPeriodId

Preserve existing IDs and sync metadata.

Record the migration in the local migration journal.

Purpose:

Prevents old class subjects from appearing unordered after the schema update.

5. app/branch-admin/modules/SubjectSetup.tsx

Uploaded as: SubjectSetup.tsx

Update only the internal ClassSubjectsModule; retain the existing curriculum ordering behaviour.

Changes:

Add orderIndex: string to the class-subject form type.

Add it to the empty/default form.

Populate it in openEdit.

Add numeric validation.

Add orderIndex to create/update payloads.

When creating from a curriculum subject, initially inherit its orderIndex.

When no inherited value exists, calculate the next class-specific order.

Sort class-subject rows by:

class;

ClassSubject.orderIndex;

subject name;

subject ID as the final stable fallback.

Add an Order field to the class-subject modal.

Show the order in class-subject list/card/table/details views.

Optionally add move-up/move-down controls after the numeric implementation works.

Purpose:

Gives branch administrators direct control over the report subject sequence.

6. app/branch-admin/modules/reports/engine/report-types.ts

Included in: reports(20260806-142128).zip

Changes:

Ensure the report dataset uses the updated ClassSubject contract from db.ts or includes orderIndex?: number in any local report-layer class-subject shape.

Do not introduce a separate report-only order property unless necessary for immutable snapshots.

Purpose:

Makes orderIndex available to the report engine with correct TypeScript typing.

7. app/branch-admin/modules/reports/engine/report-engine.ts

Included in: reports(20260806-142128).zip

This is the central report-order fix.

Changes:

Replace the current subject-ID sorting in getClassSubjectsForReport().

Resolve order using this fallback sequence:

ClassSubject.orderIndex;

linked CurriculumSubject.orderIndex;

subject name;

subject ID.

Ensure report-card subjects and class-broadsheet columns use the same ordered result.

Purpose:

Centralizes ordering so individual report templates do not need separate fixes.

8. app/branch-admin/modules/reports/reportSnapshotTypes.ts

Included in: reports(20260806-142128).zip

Changes:

Add/preserve orderIndex only if a report snapshot stores class-subject data or subject ordering explicitly.

Keep old snapshots readable by making the field optional.

Purpose:

Preserves the generated subject order when reports are saved as snapshots.

9. app/branch-admin/modules/reports/reportSnapshotService.ts

Included in: reports(20260806-142128).zip

Changes:

Store the resolved class-subject order or ordered subject array when creating a snapshot.

When restoring older snapshots without the field, use the existing stored array order or report-engine fallback.

Purpose:

Prevents a historical report from changing order after class setup is edited later.

10. Subject-order verification files — test, but update only if they re-sort subjects

Inspect these after the engine change. They should consume the engine’s ordered result and should not apply a new alphabetical or ID sort:

app/branch-admin/modules/reports/StudentReports.tsx

app/branch-admin/modules/reports/StudentReportGenerator.tsx

app/branch-admin/modules/reports/StudentReportPreview.tsx

app/branch-admin/modules/reports/Broadsheets.tsx

app/branch-admin/modules/reports/ClassBroadsheet.tsx

app/branch-admin/modules/reports/AnnualBroadsheet.tsx

app/branch-admin/modules/reports/components/StudentReportCard.tsx

app/branch-admin/modules/reports/components/ClassBroadSheet.tsx

all files in reports/student-report-templates/

all files in reports/broadsheet-templates/

Expected action:

Usually no code change if they preserve the ordered arrays from report-engine.ts.

Remove or replace any local .sort() that overrides the engine order.

11. Backend class-subject model and DTO files

Not included in the upload. Exact paths must be located in the backend.

Search for:

Prisma ClassSubject model.

class-subject create DTO.

class-subject update DTO.

class-subject service create/update/upsert logic.

sync payload validation or table adapters for classSubjects.

Changes:

Add nullable/defaulted orderIndex to the Prisma model.

Generate and apply a database migration.

Accept and return orderIndex through REST/sync APIs.

Backfill existing cloud records with curriculum order or stable class order.

Purpose:

Keeps local and cloud class-subject ordering consistent.

12. Class-subject sync mapping and registries

Not included in the upload. Exact files must be found project-wide.

Search for:

classSubjects

ClassSubject

push/pull DTO schemas

sync table registries

payload allowlists or field stripping

Changes:

Confirm orderIndex is not stripped during push.

Confirm it is serialized and restored during pull/bootstrap.

Add it to any explicit field schema or validator.

PHASE B — GRADING SYSTEM → GRADING STRUCTURE DATA MIGRATION

13. Decide and freeze the final names before editing

Use these database/domain names consistently:

GradingStructure

GradingStructureType

gradingStructures

gradingStructureId

Keep this user-facing module filename:

GradingSystem.tsx

Do not mix gradingSystemId and gradingStructureId in new writes after migration.

14. app/lib/db/db.ts

Uploaded as: db(20260806-142318).ts

This is the first grading migration file.

Changes:

Rename GradingSystem to GradingStructure.

Rename GradingSystemType to GradingStructureType, if present.

Rename Dexie property:

gradingSystems → gradingStructures.

Update GradeRule:

gradingSystemId → gradingStructureId.

Update AssessmentApplicability:

gradingSystemId → gradingStructureId.

Update every other interface in this file containing gradingSystemId, including computed results, report data, configuration, or snapshot-related contracts.

During one compatibility version, optional legacy fields may remain read-only if required for migration.

Purpose:

Establishes the new canonical frontend contracts.

15. Assessment Dexie store definition file

Not supplied. Locate the file that defines stores for:

gradingSystems

gradeRules

assessmentApplicabilities

Likely location pattern:

app/lib/db/modules/assessment.tables.ts

or another file under app/lib/db/modules/

Changes:

Rename the table name in its table-name array and store record:

gradingSystems → gradingStructures.

Update indexed foreign-key names:

gradingSystemId → gradingStructureId in gradeRules.

gradingSystemId → gradingStructureId in assessmentApplicabilities and any other stores.

Purpose:

Registers the new Dexie stores and indexes.

16. app/lib/db/schema/build-schema.ts

Not included; imported by db.ts.

Changes:

Ensure the renamed assessment store definitions are registered.

Remove old gradingSystems registration only after migration support is in place.

Purpose:

Makes the final assembled Dexie schema expose gradingStructures.

17. app/lib/db/db-version.ts

Changes:

Increment APP_DB_VERSION again for the grading migration.

Do not reuse the class-subject schema version if the two changes are released separately.

Purpose:

Activates the renamed stores and foreign-key indexes.

18. app/lib/db/db-migrations.ts

Changes:

Create gradingStructures records from all existing gradingSystems rows.

Preserve every grading-system ID so relationships remain valid.

Copy GradeRule.gradingSystemId to GradeRule.gradingStructureId.

Copy AssessmentApplicability.gradingSystemId to gradingStructureId.

Migrate every additional record type in db.ts containing gradingSystemId.

Verify row counts before considering the migration complete.

Retain a temporary read fallback for legacy data if interrupted migrations are possible.

Remove the old store only after successful copying and validation.

Purpose:

Prevents local grading configurations and existing report relationships from being lost.

19. Sync table registries and table-name unions

Not included. Locate all project files containing gradingSystems.

Likely areas:

local-first sync table arrays;

push table arrays;

pull/bootstrap table lists;

getSyncTable mappings;

table-name TypeScript unions;

blocked/backend-cache table lists;

conflict and revision subscriptions.

Changes:

Replace gradingSystems with gradingStructures.

Add temporary legacy table mapping only for migration if needed.

Update any revision hooks or subscribed table lists.

Purpose:

Ensures the renamed table continues to synchronize.

20. Sync payload serializers, validators, and field allowlists

Not included. Search project-wide for gradingSystemId.

Changes:

Rename serialized foreign keys to gradingStructureId.

Allow legacy inbound gradingSystemId only during transition.

Write only the new key.

Confirm stripLocalOnlyFields and related helpers do not remove the new field.

PHASE C — MERGE THE GRADING UI

21. Create app/branch-admin/modules/GradingSystem.tsx

Build from both uploaded files:

Gradingsystems(2).tsx / existing GradingSystems.tsx

GradingRules(1).tsx / existing GradeRules.tsx

Changes:

Merge both pages into one component.

Use internal modes/tabs such as:

structures

rules

Keep one workspace/context resolution implementation instead of duplicating it.

Load:

gradingStructures

gradeRules

assessmentApplicabilities

Rename all UI-side IDs and maps to gradingStructureId.

Keep structure CRUD.

Keep rule CRUD, overlap validation, order, seeding, coverage analysis, and usage counts.

Allow opening a structure and managing its rules from the same workspace.

Preserve the golden-standard mobile/card/table/sheet behaviour from both source files.

Purpose:

Provides one coherent grading workspace without a filename/domain naming collision.

22. Remove old module files after the merged page works

Delete or stop importing:

app/branch-admin/modules/GradingSystems.tsx

app/branch-admin/modules/GradeRules.tsx

Do not delete them before routes and imports point to GradingSystem.tsx.

23. Branch-admin route/page file for grading systems

Not included.

Locate the route that imports GradingSystems.tsx.

Changes:

Import the default component from GradingSystem.tsx.

Keep the chosen canonical route, preferably one grading route rather than separate system/rules pages.

24. Branch-admin route/page file for grade rules

Not included.

Changes:

Redirect to the merged grading-system route, or remove the separate page after navigation is updated.

Preserve bookmarked URLs with a redirect if the app is already deployed.

25. Branch-admin navigation/module registry

Not included.

Changes:

Replace separate “Grading Systems” and “Grade Rules” entries with one “Grading System” or “Grading Setup” entry.

Update component registry keys, lazy imports, permissions, search entries, breadcrumbs, and page titles.

Search for:

GradingSystems

GradeRules

grading-systems

grade-rules

PHASE D — UPDATE ALL FRONTEND GRADING REFERENCES

The uploaded report bundle contains grading references in the following files. Update them in this order after the database contracts and merged UI exist.

26. app/branch-admin/modules/reports/engine/report-types.ts

Changes:

GradingSystem → GradingStructure.

gradingSystems → gradingStructures in dataset types.

gradingSystemId → gradingStructureId.

Keep optional legacy read fields only if required for old snapshots.

27. app/branch-admin/modules/reports/engine/report-engine.ts

Changes:

Rename grading lookup maps and dataset references.

Resolve applicability using gradingStructureId.

Resolve grade rules using GradeRule.gradingStructureId.

Add temporary fallback to gradingSystemId only for old records/snapshots.

28. app/branch-admin/modules/reports/StudentReports.tsx

Changes:

Load gradingStructures instead of gradingSystems.

Rename imported types and dataset properties.

Update any table revision/subscription list.

Replace gradingSystemId lookups.

29. app/branch-admin/modules/reports/Broadsheets.tsx

Changes:

Load and pass gradingStructures.

Replace grading-system foreign-key references.

Update revision/subscription lists.

30. app/branch-admin/modules/reports/components/ReportFilters.tsx

Changes:

Rename grading-related props, option types, labels, and IDs where they represent persisted structures.

The visible label may still say “Grading system” if that is clearer to users, while code uses GradingStructure.

31. app/branch-admin/modules/reports/reportSnapshotTypes.ts

Changes:

Rename snapshot grading contracts to GradingStructure and gradingStructureId.

Preserve optional legacy aliases for reading old snapshots.

32. app/branch-admin/modules/reports/reportSnapshotService.ts

Changes:

Write gradingStructures and gradingStructureId into new snapshots.

Read old gradingSystems/gradingSystemId snapshots through a compatibility normalizer.

33. Project-wide frontend files containing gradingSystems, gradingSystemId, or GradingSystem

Only part of the frontend was uploaded, so this search is mandatory.

Likely affected areas include:

assessment setup;

assessment applicability;

assessment entry;

computed results;

report-card generation;

report settings;

cumulative reports;

promotion/result processing;

school/branch seed data;

dashboard counts;

import/export utilities;

test fixtures.

Run searches for all of:

gradingSystems
gradingSystemId
GradingSystem
GradingSystemType

Every persisted/domain reference should move to:

gradingStructures
gradingStructureId
GradingStructure
GradingStructureType

User-facing copy can still say “grading system” where appropriate.

PHASE E — BACKEND GRADING MIGRATION

34. Backend Prisma schema

Not supplied.

Changes:

Rename Prisma model GradingSystem to GradingStructure.

Rename relation fields and foreign keys to gradingStructureId.

Update related models including grade rules, assessment applicability, computed results, report records, or any model found by search.

Prefer an explicit SQL table/column rename migration to preserve data rather than dropping and recreating tables.

35. Backend Prisma migration SQL

Changes:

Rename the physical table and columns safely.

Rename indexes and foreign-key constraints.

Preserve IDs, timestamps, tenant fields, sync versions, and relations.

Add a data verification query in the migration notes.

36. Backend grading module files

Exact paths must be located.

Update:

grading structure entity/model types;

create DTO;

update DTO;

response DTO;

controller;

service;

module;

repository, if present;

Swagger/OpenAPI decorators;

tests.

37. Backend grade-rule module files

Changes:

Rename gradingSystemId to gradingStructureId in DTOs, validation, queries, relation includes, and responses.

Update overlap validation and seeding logic.

38. Backend assessment applicability/result/report files

Changes:

Update every relation and query using gradingSystemId.

Ensure report generation and result computation select the renamed relation.

39. Backend sync service and table mapping

Changes:

Rename synced table mapping to gradingStructures.

Translate legacy inbound table/key names during a controlled compatibility period.

Return only canonical new names after migration.

PHASE F — TEST AND CLEANUP

40. TypeScript and build verification

Run:

frontend typecheck;

frontend production build;

backend typecheck/build;

Prisma validation and generation.

Search again for remaining legacy names:

gradingSystems
gradingSystemId
GradingSystem
GradingSystemType

Any remaining usage must be intentionally marked as migration compatibility code or user-facing wording.

41. Class-subject order tests

Test:

Create Mathematics, Science, English, and Computing class subjects.

Assign orders such as 2, 3, 1, 4.

Confirm report card shows English, Mathematics, Science, Computing.

Confirm class broadsheet uses the same sequence.

Edit order and regenerate.

Test rows without orderIndex use curriculum order.

Test duplicate order numbers remain deterministic.

Test offline creation, sync, reload, and another device.

42. Grading migration tests

Test:

Existing grading structures remain visible after upgrade.

Existing grade rules remain attached to the correct structure.

Assessment applicability still resolves the correct structure.

Existing reports calculate the same grades.

New structures and rules sync correctly.

Old report snapshots still open.

The old grade-rules URL redirects correctly.

No duplicate or empty structures are created during repeated migration runs.

43. Final removal of compatibility code

Only after local, cloud, sync, and old snapshots are verified:

remove legacy gradingSystems store access;

remove legacy gradingSystemId read fallbacks where no longer needed;

remove old routes/components;

remove temporary migration adapters;

retain snapshot compatibility indefinitely if old saved reports can still be opened.

Condensed Implementation Order

db.ts — add ClassSubject.orderIndex.

academics.tables.ts — index classSubjects.orderIndex.

db-version.ts — version bump.

db-migrations.ts — backfill class-subject order.

SubjectSetup.tsx — manage class-subject order.

report-types.ts — expose order.

report-engine.ts — central ordered subject selection.

snapshot types/service — preserve historical order.

backend class-subject schema/DTO/sync changes.

Test report cards and broadsheets.

db.ts — rename grading domain contracts.

assessment store definitions — rename table/indexes.

build-schema.ts — register renamed stores.

db-version.ts — second version bump.

db-migrations.ts — copy grading data and foreign keys.

sync registries/serializers — rename table and IDs.

create merged GradingSystem.tsx.

update routes/navigation and retire old components.

update report types and engine grading references.

update StudentReports.tsx, Broadsheets.tsx, ReportFilters.tsx, and snapshot files.

project-wide frontend legacy-name search.

backend Prisma model/migration.

backend grading, rules, applicability, result, report, and sync modules.

full migration, sync, report, snapshot, and build testing.

remove temporary compatibility code.