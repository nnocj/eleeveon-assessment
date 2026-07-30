"use client";
import { useState } from "react";
import type { VisitorVisitView } from "../advanced-shared";
import { AdvancedIdentityStyles, Sheet } from "../advanced-shared";
export function VisitorCheckOutDialog({open,visit,busy=false,primaryColor,onClose,onConfirm}:{open:boolean;visit?:VisitorVisitView|null;busy?:boolean;primaryColor?:string;onClose:()=>void;onConfirm:(note:string)=>void}) {const [note,setNote]=useState("");return <><AdvancedIdentityStyles primaryColor={primaryColor}/><Sheet open={open} title="Check out visitor" subtitle={visit?.visitor?.fullName||visit?.visitorId} onClose={onClose} footer={<><button className="ai-button" onClick={onClose}>Cancel</button><button className="ai-button primary" disabled={!visit||busy} onClick={()=>onConfirm(note)}>{busy?"Checking out…":"Confirm check-out"}</button></>}><label className="ai-field"><span>Check-out note</span><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional exit details"/></label></Sheet></>}
export default VisitorCheckOutDialog;
