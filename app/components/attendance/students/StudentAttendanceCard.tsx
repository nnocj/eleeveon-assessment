"use client";
import type { Attendance, StudentAttendanceSummary as Summary } from "../../../lib/attendance";
import { AttendanceStatusBadge } from "../shared";
import { StudentAttendanceSummary } from "./StudentAttendanceSummary";
import type { AttendanceStudentHistoryPerson } from "./types";
export interface StudentAttendanceCardProps{student:AttendanceStudentHistoryPerson;latest?:Attendance|null;summary?:Summary|null;onView?:(student:AttendanceStudentHistoryPerson)=>void}
export function StudentAttendanceCard({student,latest,summary,onView}:StudentAttendanceCardProps){return <article style={{display:"grid",gap:10,padding:11,borderRadius:13,border:"1px solid var(--border,rgba(15,23,42,.1))",background:"var(--background,#fff)"}}><div style={{display:"flex",gap:9,alignItems:"center"}}><div style={{width:38,height:38,borderRadius:999,display:"grid",placeItems:"center",background:"var(--muted,rgba(148,163,184,.14))",fontWeight:850}}>{student.name[0]?.toUpperCase()}</div><div style={{flex:1,minWidth:0}}><strong style={{fontSize:13}}>{student.name}</strong><div style={{fontSize:10,color:"var(--muted-foreground,#64748b)"}}>{student.className??student.reference}</div></div>{latest&&<AttendanceStatusBadge status={latest.status}/>}</div><StudentAttendanceSummary summary={summary}/>{onView&&<button type="button" onClick={()=>onView(student)}>View history</button>}</article>}
export default StudentAttendanceCard;
