"use client";
import type { IdentityAccessPointOption, IdentityDevice } from "../infrastructure-types";
import { DeviceHealthBadge } from "./DeviceHealthBadge";
import { DeviceStatusIndicator } from "./DeviceStatusIndicator";
const label=(v:string)=>v.replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
export function DeviceCard({device,accessPoint,onOpen}:{device:IdentityDevice;accessPoint?:IdentityAccessPointOption|null;onOpen?:(d:IdentityDevice)=>void}){
 return <button type="button" onClick={()=>onOpen?.(device)} style={{width:"100%",textAlign:"left",display:"grid",gap:9,padding:12,border:"1px solid var(--border,rgba(15,23,42,.1))",borderRadius:14,background:"var(--background,#fff)",color:"inherit"}}>
  <div style={{display:"flex",justifyContent:"space-between",gap:10}}><div><strong>{device.name}</strong><small style={{display:"block"}}>{label(device.deviceType)}{device.code?` · ${device.code}`:""}</small></div><DeviceStatusIndicator status={device.status??"offline"}/></div>
  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}><DeviceHealthBadge device={device}/>{(device.capabilities??[]).slice(0,3).map(c=><small key={c}>{label(c)}</small>)}</div>
  <small>{accessPoint?.name||device.locationLabel||"No access point assigned"}</small>
 </button>;
}
export default DeviceCard;
