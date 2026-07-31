"use client";
import { useEffect, useState } from "react";
import { resolveWebsiteData } from "./websiteDataResolver";
import type { ResolveWebsiteDataArgs, WebsiteResolvedData } from "../types";
export function useWebsiteData(args?: Partial<ResolveWebsiteDataArgs>){
 const [data,setData]=useState<WebsiteResolvedData>(); const [loading,setLoading]=useState(false);
 useEffect(()=>{ let cancelled=false; if(!args?.accountId||!args?.schoolId){setData(undefined);return;} setLoading(true); resolveWebsiteData(args as ResolveWebsiteDataArgs).then(v=>{if(!cancelled)setData(v)}).catch(e=>console.error('[useWebsiteData]',e)).finally(()=>{if(!cancelled)setLoading(false)}); return()=>{cancelled=true}; },[args?.accountId,args?.schoolId,args?.branchId,args?.websiteSettingId,args?.draft?.id,args?.draft?.templateKey]);
 return {data,loading};
}
