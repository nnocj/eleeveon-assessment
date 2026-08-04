# Eleeveon DB V3 core files

Place these files in:

```text
app/lib/db/core/
  base.ts
  registry.ts
  indexes.ts
```

Recommended immediate integration:

- Import registry table lists from `core/registry.ts` inside `syncRegistry.ts`.
- Use `composeIndexes`, `branchScopedIndexes`, and `platformCacheIndexes`
  when gradually cleaning the schema modules.
- New domain interfaces should extend `SyncRecordBase` from `core/base.ts`.
