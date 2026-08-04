# Eleeveon Dexie Platform V2 foundation

Place these files under `app/lib/db/`:

- `db.ts`
- `db-version.ts`
- `schema/index.ts`
- `schema/legacy-stores.ts`
- `schema/assessment-stores.ts`
- `schema/scheduling-stores.ts`
- `schema/platform-v2-stores.ts`

This keeps one `EleeveonDatabase` instance and preserves all existing table
names. The current schema is composed from separate store modules.

## Important next files

The new stores still need to be classified in:

- `app/lib/sync/syncRegistry.ts`
- push/pull/bootstrap registries
- `app/lib/db/db-migrations.ts`

Do not enable advanced scheduling UI until those registrations and migration
rules are added.
