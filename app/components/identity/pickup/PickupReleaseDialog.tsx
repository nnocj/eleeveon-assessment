"use client";
import { useState } from "react";
import type { PickupRequestView } from "../advanced-shared";
import { AdvancedIdentityStyles, Sheet } from "../advanced-shared";
export function PickupReleaseDialog({open,request,busy=false,primaryColor,onClose,onRelease}:{open:boolean;request?:PickupRequestView|null;busy?:boolean;primaryColor?:string;onClose:()=>void;onRelease:(note:string)=>void}) {
 const [note,setNote]=useState(""); return <><AdvancedIdentityStyles primaryColor={primaryColor}/><Sheet open={open} title="Release student" subtitle={request?.studentName||"Confirm handover"} onClose={onClose} footer={<><button className="ai-button" onClick={onClose}>Cancel</button><button className="ai-button primary" disabled={busy||!request} onClick={()=>onRelease(note)}>{busy?"Releasing…":"Confirm release"}</button></>}><p style={{fontSize:11,lineHeight:1.6}}>Confirm that the collector has been verified and the student has been physically handed over.</p><label className="ai-field"><span>Release note</span><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional handover details"/></label></Sheet></>
}
export default PickupReleaseDialog;
