"use client";
import type { ReactNode } from "react";
import type { Attendance, StudentAttendanceSummary as Summary } from "../../../lib/attendance";
import { StudentAttendanceHistory } from "./StudentAttendanceHistory";
import { StudentAttendanceSummary } from "./StudentAttendanceSummary";
import type { AttendanceStudentHistoryPerson } from "./types";
export interface StudentAttendanceDetailsProps{student:AttendanceStudentHistoryPerson;records:readonly Attendance[];summary?:Summary|null;actions?:ReactNode}
export function StudentAttendanceDetails({student,records,summary,actions}:StudentAttendanceDetailsProps){return <section style={{display:"grid",gap:14}}><header style={{display:"flex",gap:10,alignItems:"center"}}><div style={{width:44,height:44,borderRadius:999,display:"grid",placeItems:"center",background:"var(--muted,rgba(148,163,184,.14))",fontWeight:850}}>{student.name[0]?.toUpperCase()}</div><div style={{flex:1}}><h2 style={{margin:0,fontSize:17}}>{student.name}</h2><div style={{fontSize:11,color:"var(--muted-foreground,#64748b)"}}>{student.className??student.reference}</div></div>{actions}</header><StudentAttendanceSummary summary={summary}/><StudentAttendanceHistory records={records}/></section>}
export default StudentAttendanceDetails;
