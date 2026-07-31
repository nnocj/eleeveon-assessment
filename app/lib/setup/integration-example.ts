import { db } from "@/app/lib/db"; // adjust path
import { createLocal } from "@/app/lib/db/localCrud"; // adjust path
import type { SeedEntityName, SeedStore } from "./types";

export const eleeveonSeedStore:SeedStore={
 async create(table,value){return createLocal(table,value) as Promise<any>;},
 async findOne(table:SeedEntityName,query){
   const rows=await (db as any)[table].toArray();
   return rows.find((row:any)=>Object.entries(query).every(([key,val])=>row[key]===val));
 }
};

// After createLocal("branches", ...) returns a permanent ID:
// await seedBranchFoundation({store:eleeveonSeedStore,accountId,schoolId,branchId,
//   templateCode:"ghana-basic-school-v1",academicYearName:"2026/2027",
//   academicYearStart:"2026-09-01",academicYearEnd:"2027-07-31"});
