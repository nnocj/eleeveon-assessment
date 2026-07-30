"use client";
import { StudentAttendanceCard } from "./StudentAttendanceCard";
import type { AttendanceStudentHistoryPerson, StudentAttendanceBundle } from "./types";
export interface StudentAttendanceListProps{items:readonly StudentAttendanceBundle[];onView?:(student:AttendanceStudentHistoryPerson)=>void;emptyLabel?:string}
export function StudentAttendanceList({items,onView,emptyLabel="No student attendance records."}:StudentAttendanceListProps){if(!items.length)return <div style={{padding:18,textAlign:"center",fontSize:12}}>{emptyLabel}</div>;return <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:9}}>{items.map(i=><StudentAttendanceCard key={i.student.id} student={i.student} latest={[...i.records].sort((a,b)=>b.date.localeCompare(a.date))[0]} summary={i.summary} onView={onView}/>)}</div>}
export default StudentAttendanceList;
