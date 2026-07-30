"use client";
import type { TeacherAttendance } from "../../../lib/attendance";
import { AttendanceVerificationBadge } from "../shared";
export function TeacherClockHistory({records}:{records:readonly TeacherAttendance[]}){const rows=[...records].sort((a,b)=>b.date.localeCompare(a.date));if(!rows.length)return <div style={{padding:16,textAlign:"center",fontSize:12}}>No clock history.</div>;return <div style={{display:"grid",gap:7}}>{rows.map(r=><article key={r.id} style={{display:"grid",gridTemplateColumns:"90px 1fr auto",gap:8,alignItems:"center",padding:9,borderBottom:"1px solid var(--border,rgba(15,23,42,.08))"}}><strong style={{fontSize:11}}>{r.date}</strong><span style={{fontSize:11}}>{r.clockIn??"—"} → {r.clockOut??"—"}</span>{r.verificationStatus&&<AttendanceVerificationBadge status={r.verificationStatus}/>}</article>)}</div>}
export default TeacherClockHistory;
