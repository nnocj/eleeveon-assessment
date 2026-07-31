import type { SeedContext, SeedDefinition, SeedEntityName } from "./types";

export const seedMeta = (ctx: SeedContext, table: SeedEntityName, key: string) => ({
  setupSource: "seeded",
  setupTemplateCode: ctx.templateCode,
  setupTemplateVersion: ctx.templateVersion,
  setupSeedKey: `${table}:${key}`,
});

export async function upsertSeed(
  ctx: SeedContext,
  table: SeedEntityName,
  definition: SeedDefinition,
  payload: Record<string, unknown>,
): Promise<string> {
  const setupSeedKey = `${table}:${definition.key}`;
  const existing = await ctx.store.findOne(table, {
    accountId: ctx.accountId,
    schoolId: ctx.schoolId,
    branchId: ctx.branchId,
    setupTemplateCode: ctx.templateCode,
    setupSeedKey,
    isDeleted: false,
  });
  if (existing) {
    ctx.ids[table][definition.key] = existing.id;
    ctx.counts[table].reused += 1;
    return existing.id;
  }
  const created = await ctx.store.create(table, {
    accountId: ctx.accountId,
    schoolId: ctx.schoolId,
    branchId: ctx.branchId,
    ...payload,
    ...seedMeta(ctx, table, definition.key),
    active: payload.active ?? true,
  });
  ctx.ids[table][definition.key] = created.id;
  ctx.counts[table].created += 1;
  return created.id;
}

export function mustId(ctx: SeedContext, table: SeedEntityName, key: unknown): string {
  if (typeof key !== "string") throw new Error(`Missing reference key for ${table}`);
  const id = ctx.ids[table][key];
  if (!id) throw new Error(`Unresolved ${table} seed key: ${key}`);
  return id;
}
