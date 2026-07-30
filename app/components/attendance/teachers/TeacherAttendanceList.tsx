"use client";
import { TeacherClockCard } from "./TeacherClockCard";
import type { AttendanceTeacher, TeacherAttendanceRow } from "./types";
export interface TeacherAttendanceListProps{rows:readonly TeacherAttendanceRow[];onClockIn?:(teacher:AttendanceTeacher)=>void;onClockOut?:(teacher:AttendanceTeacher)=>void;onView?:(teacher:AttendanceTeacher)=>void;emptyLabel?:string}
export function TeacherAttendanceList({rows,onClockIn,onClockOut,onView,emptyLabel="No teachers found."}:TeacherAttendanceListProps){if(!rows.length)return <div style={{padding:18,textAlign:"center",fontSize:12}}>{emptyLabel}</div>;return <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:9}}>{rows.map(r=><TeacherClockCard key={r.teacher.id} teacher={r.teacher} attendance={r.attendance} onClockIn={onClockIn} onClockOut={onClockOut} onView={onView}/>)}</div>}
export default TeacherAttendanceList;
