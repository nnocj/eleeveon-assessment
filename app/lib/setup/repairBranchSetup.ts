import type { SeedBranchOptions } from "./types";import { seedBranchFoundation } from "./seedBranchFoundation";
export async function repairBranchSetup(options:SeedBranchOptions){return seedBranchFoundation(options);}
