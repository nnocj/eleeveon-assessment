"use client";
import type { StudentAttendanceRow } from "../insights-types";
import { escapeCsvCell } from "../insights-utils";

export function buildAttendanceCsv(rows:readonly StudentAttendanceRow[]) {
 const header=["Student","Admission Number","Class","Days Opened","Days Present","Days Absent","Times Late","Attendance Percent","Note"];
 const body=rows.map(r=>[r.studentName,r.admissionNumber,r.className,r.daysOpened,r.daysPresent,r.daysAbsent,r.timesLate,r.attendancePercent,r.note].map(escapeCsvCell).join(","));
 return [header.map(escapeCsvCell).join(","),...body].join("\r\n");
}
export function downloadAttendanceCsv(rows:readonly StudentAttendanceRow[],filename="attendance-report.csv") {
 if(typeof window==="undefined")return;const blob=new Blob([`\uFEFF${buildAttendanceCsv(rows)}`],{type:"text/csv;charset=utf-8"});
 const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename.endsWith(".csv")?filename:`${filename}.csv`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
}
export function ExportAttendanceReport({rows,filename="attendance-report.csv",label="Export CSV",disabled=false,className,onExported}:{
 rows:readonly StudentAttendanceRow[];filename?:string;label?:string;disabled?:boolean;className?:string;onExported?:(filename:string)=>void;
}) {
 const run=()=>{downloadAttendanceCsv(rows,filename);onExported?.(filename);};
 return <button type="button" className={className} disabled={disabled||!rows.length} onClick={run}>{label}</button>;
}
export default ExportAttendanceReport;
