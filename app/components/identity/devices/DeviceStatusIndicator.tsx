"use client";
import type { IdentityDeviceStatus } from "../infrastructure-types";
const LABELS:Record<IdentityDeviceStatus,string>={online:"Online",offline:"Offline",maintenance:"Maintenance",disabled:"Disabled"};
export function DeviceStatusIndicator({status="offline",showLabel=true}:{status?:IdentityDeviceStatus;showLabel?:boolean}){
 const color=status==="online"?"var(--success,#15803d)":status==="maintenance"?"var(--warning,#b45309)":status==="disabled"?"var(--danger,#dc2626)":"var(--muted-foreground,#64748b)";
 return <span style={{display:"inline-flex",alignItems:"center",gap:6}}><span style={{width:8,height:8,borderRadius:"50%",background:color}}/>{showLabel?<small style={{color}}>{LABELS[status]}</small>:null}</span>;
}
export default DeviceStatusIndicator;
