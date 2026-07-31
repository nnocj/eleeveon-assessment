import type { SeedContext, SeedDefinition } from "../types";
import { upsertSeed } from "../seedUtils";
export async function seedSubjects(ctx:SeedContext,definitions:SeedDefinition[]){for(const d of definitions)await upsertSeed(ctx,"subjects",d,{...d,key:undefined});}
