"use client";
import { AdvancedIdentityStyles, StatusPill } from "../advanced-shared";
export function EmergencySubjectStatus({status,primaryColor,showLabel=true}:{status?:string|null;primaryColor?:string;showLabel?:boolean}) {return <span style={{display:"inline-flex",alignItems:"center",gap:5}}><AdvancedIdentityStyles primaryColor={primaryColor}/><span style={{width:8,height:8,borderRadius:"50%",background:["safe","present"].includes(String(status))?"#16803c":["missing","injured"].includes(String(status))?"#c0362c":"#b66500"}}/>{showLabel?<StatusPill status={status}/>:null}</span>}
export default EmergencySubjectStatus;
