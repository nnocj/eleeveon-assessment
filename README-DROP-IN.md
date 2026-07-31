# Eleeveon shared website engine — drop-in

Copy the contents of this archive into the frontend project root.

What changes:
- canonical website code moves to `app/lib/websites`;
- the former `app/branch-admin/modules/website` path becomes compatibility wrappers, so `Branchsettings.tsx` does not need changing;
- templates receive a resolved data model sourced from existing School, Branch, Teacher, Programme, Subject, Announcement, Calendar, Portal Highlight and Media Asset tables;
- templates never query Dexie directly;
- `buildPublicWebsiteSnapshot` creates a serialisable payload for the separate public renderer.

Add this package script if it is not already present:
`"website:templates": "node scripts/generate-website-template-registry.mjs"`

Run:
1. `npm run website:templates`
2. `npm run typecheck` or `npx tsc --noEmit`

The resolver deliberately reads tables through `(db as any)` so missing optional modules do not crash previews. Update table aliases in `websiteDataResolver.ts` when your exact table names differ.
