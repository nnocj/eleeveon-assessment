"use client";
import { useState } from "react";
import type { AttendanceCaptureMethod, AttendancePersonType, AttendanceStatus, AttendanceVerificationStatus } from "../../../lib/attendance";
import { AttendanceStatusPicker } from "../shared";
import type { AttendanceCaptureDraft, AttendanceCapturePerson } from "./types";

export interface ManualAttendanceCaptureProps {
  people: readonly AttendanceCapturePerson[];
  personType?: AttendancePersonType;
  defaultStatus?: AttendanceStatus;
  onCapture: (draft: AttendanceCaptureDraft) => void | Promise<void>;
  disabled?: boolean;
}
export function ManualAttendanceCapture({people,personType="student",defaultStatus="present",onCapture,disabled=false}:ManualAttendanceCaptureProps){
 const [personId,setPersonId]=useState(""); const [status,setStatus]=useState<AttendanceStatus>(defaultStatus); const [note,setNote]=useState(""); const [saving,setSaving]=useState(false);
 const submit=async()=>{if(!personId)return;setSaving(true);try{await onCapture({personId,personType,attendanceStatus:status,captureMethod:"manual" as AttendanceCaptureMethod,verificationStatus:"overridden" as AttendanceVerificationStatus,note:note.trim()||null});setNote("");}finally{setSaving(false)}};
 return <section style={{display:"grid",gap:10}}>
  <label style={{display:"grid",gap:5,fontSize:11,fontWeight:750}}><span>Person</span><select value={personId} onChange={e=>setPersonId(e.target.value)} disabled={disabled||saving} style={{minHeight:38,borderRadius:9,border:"1px solid var(--border,rgba(15,23,42,.12))",background:"var(--background,#fff)",color:"inherit",padding:"0 9px"}}><option value="">Select person</option>{people.filter(p=>p.personType===personType).map(p=><option key={p.id} value={p.id}>{p.name}{p.reference?` · ${p.reference}`:""}</option>)}</select></label>
  <AttendanceStatusPicker value={status} onChange={setStatus} disabled={disabled||saving}/>
  <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional note" disabled={disabled||saving} rows={2} style={{resize:"vertical",borderRadius:9,border:"1px solid var(--border,rgba(15,23,42,.12))",background:"var(--background,#fff)",color:"inherit",padding:9,font:"inherit",fontSize:12}}/>
  <button type="button" onClick={submit} disabled={disabled||saving||!personId} style={{minHeight:38,border:0,borderRadius:9,background:"var(--primary,#2563eb)",color:"#fff",fontWeight:800,cursor:"pointer",opacity:disabled||saving||!personId?0.6:1}}>{saving?"Capturing…":"Capture attendance"}</button>
 </section>
}
export default ManualAttendanceCapture;
