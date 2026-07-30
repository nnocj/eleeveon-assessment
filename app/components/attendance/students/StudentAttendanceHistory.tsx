"use client";
import type { Attendance } from "../../../lib/attendance";
import { AttendanceStatusBadge, AttendanceVerificationBadge, CaptureMethodBadge } from "../shared";
export function StudentAttendanceHistory({records}:{records:readonly Attendance[]}){const rows=[...records].sort((a,b)=>b.date.localeCompare(a.date));if(!rows.length)return <div style={{padding:16,textAlign:"center",fontSize:12}}>No attendance history.</div>;return <div style={{display:"grid",gap:6}}>{rows.map(r=><article key={r.id} style={{display:"grid",gridTemplateColumns:"90px 1fr",gap:8,padding:9,borderBottom:"1px solid var(--border,rgba(15,23,42,.08))"}}><strong style={{fontSize:11}}>{r.date}</strong><div style={{display:"flex",gap:5,flexWrap:"wrap"}}><AttendanceStatusBadge status={r.status}/>{r.captureMethod&&<CaptureMethodBadge method={r.captureMethod}/>} {r.verificationStatus&&<AttendanceVerificationBadge status={r.verificationStatus}/>}</div></article>)}</div>}
export default StudentAttendanceHistory;
