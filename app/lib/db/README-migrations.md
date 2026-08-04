# Eleeveon DB V3 migrations

Place the folder at `app/lib/db/migrations/`.

Register migrations explicitly:

```ts
this.version(2)
  .stores({ ...SCHEMA_V2_STORES })
  .upgrade(migrateV1ToV2);

this.version(3)
  .stores({ ...SCHEMA_V3_STORES })
  .upgrade(async (tx) => {
    await migrateAssessmentHierarchy(tx);
    await migrateSchedulingFoundation(tx);
    await migrateLicenceFoundation(tx);
  });
```

The version 3 migrations are idempotent. They preserve valid values and do not create paid subscriptions or perpetual licences.
