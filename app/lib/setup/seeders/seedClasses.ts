import type { SeedContext, SeedDefinition } from "../types";
import { upsertSeed } from "../seedUtils";
export async function seedClasses(ctx:SeedContext,definitions:SeedDefinition[]){for(const d of definitions)await upsertSeed(ctx,"classes",d,{...d,key:undefined});}
