"use client";
import type { IdentityDevice } from "../infrastructure-types";
export type DeviceHealth="healthy"|"stale"|"offline"|"maintenance"|"disabled";
export function getDeviceHealth(device:IdentityDevice,now=Date.now(),staleAfterMs=15*60*1000):DeviceHealth{
 if(device.status==="disabled"||device.active===false)return"disabled";
 if(device.status==="maintenance")return"maintenance";
 if(device.status==="offline")return"offline";
 if(!device.lastSeenAt||now-device.lastSeenAt>staleAfterMs)return"stale";
 return"healthy";
}
const LABELS:Record<DeviceHealth,string>={healthy:"Healthy",stale:"Stale",offline:"Offline",maintenance:"Maintenance",disabled:"Disabled"};
export function DeviceHealthBadge({device,now,staleAfterMs}:{device:IdentityDevice;now?:number;staleAfterMs?:number}){
 const h=getDeviceHealth(device,now,staleAfterMs);
 return <span style={{display:"inline-flex",padding:"3px 8px",borderRadius:999,fontSize:12,fontWeight:700,background:h==="healthy"?"var(--success-soft,rgba(22,163,74,.1))":h==="stale"||h==="maintenance"?"var(--warning-soft,rgba(217,119,6,.1))":"var(--danger-soft,rgba(220,38,38,.1))"}}>{LABELS[h]}</span>;
}
export default DeviceHealthBadge;
