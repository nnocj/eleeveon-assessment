# Eleeveon DB V3 module store maps

Place the `modules` folder at:

```text
app/lib/db/modules/
```

Then compose the Platform V2 store map in `db.ts` or `schema/index.ts`:

```ts
import { DOMAIN_STORES } from "./modules";
import { LOCAL_SYSTEM_STORES } from "./db-migrations";

const APP_DB_STORES_V3 = {
  ...DOMAIN_STORES,
  ...LOCAL_SYSTEM_STORES,
};
```

The included `index.ts` also exposes `findDuplicateModuleStores()` so duplicate
table ownership can be detected during development.
