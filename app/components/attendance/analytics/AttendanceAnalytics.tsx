"use client";
import type { CSSProperties } from "react";
import { useMemo } from "react";
import type { AttendanceStatusBreakdown, AttendanceTrendPoint, ClassAttendanceRow, StudentAttendanceRow } from "../insights-types";
import { getAttendanceRiskLevel, sumStudentRows } from "../insights-utils";
import { AttendanceRiskCard } from "../summaries/AttendanceRiskCard";
import { AttendanceSummaryCards } from "../summaries/AttendanceSummaryCards";
import { AttendanceStatusChart } from "./AttendanceStatusChart";
import { AttendanceTrendChart } from "./AttendanceTrendChart";
import { AttendanceTrendSummary } from "./AttendanceTrendSummary";
import { ClassAttendanceComparison } from "./ClassAttendanceComparison";

export function AttendanceAnalytics({
 students,classes,trend,breakdown,loading=false,primaryColor="var(--primary-color, #2563eb)",
 onSelectStudent,onSelectClass,onSelectTrendPoint,
}:{students:readonly StudentAttendanceRow[];classes:readonly ClassAttendanceRow[];trend:readonly AttendanceTrendPoint[];
breakdown:AttendanceStatusBreakdown;loading?:boolean;primaryColor?:string;onSelectStudent?:(student:StudentAttendanceRow)=>void;
onSelectClass?:(item:ClassAttendanceRow)=>void;onSelectTrendPoint?:(point:AttendanceTrendPoint)=>void}) {
 const totals=useMemo(()=>sumStudentRows(students),[students]);
 const risks=useMemo(()=>students.filter(s=>getAttendanceRiskLevel(s.attendancePercent)!=="low").map(s=>({
  id:s.id,studentId:s.studentId,studentName:s.studentName,admissionNumber:s.admissionNumber,className:s.className,
  attendancePercent:s.attendancePercent,daysAbsent:s.daysAbsent,timesLate:s.timesLate,photoUrl:s.photoUrl,riskLevel:getAttendanceRiskLevel(s.attendancePercent),
 })),[students]);
 return <section className="aa-root" style={{"--aa-primary":primaryColor} as CSSProperties}><style>{css}</style>
  <AttendanceSummaryCards summary={{...totals,totalStudents:students.length,markedStudents:breakdown.present+breakdown.absent+breakdown.late,unmarkedStudents:breakdown.unmarked??0}} loading={loading} primaryColor={primaryColor}/>
  <AttendanceTrendSummary points={trend} primaryColor={primaryColor}/>
  <div className="aa-grid wide"><AttendanceTrendChart points={trend} primaryColor={primaryColor} onPointSelect={onSelectTrendPoint}/><AttendanceStatusChart breakdown={breakdown} primaryColor={primaryColor}/></div>
  <div className="aa-grid"><ClassAttendanceComparison classes={classes} primaryColor={primaryColor} onSelect={onSelectClass}/>
   <AttendanceRiskCard items={risks} primaryColor={primaryColor} onSelect={onSelectStudent?(risk)=>{const row=students.find(s=>s.id===risk.id);if(row)onSelectStudent(row)}:undefined}/>
  </div>
 </section>;
}
const css=`.aa-root{display:grid;gap:12px;width:100%;min-width:0}.aa-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:start}.aa-grid.wide{grid-template-columns:minmax(0,1.6fr) minmax(260px,.7fr)}@media(max-width:900px){.aa-grid,.aa-grid.wide{grid-template-columns:1fr}}`;
export default AttendanceAnalytics;
