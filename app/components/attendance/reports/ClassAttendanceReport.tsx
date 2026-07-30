"use client";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import type { AttendanceReportFiltersValue, AttendanceReportMeta, StudentAttendanceRow } from "../insights-types";
import { getAttendanceRiskLevel, sumStudentRows } from "../insights-utils";
import { AttendanceSummaryCards } from "../summaries/AttendanceSummaryCards";
import { AttendanceReportPreview } from "./AttendanceReportPreview";
import { AttendanceReportTable } from "./AttendanceReportTable";
import { AttendanceReportToolbar } from "./AttendanceReportToolbar";

export function ClassAttendanceReport({
 rows,meta,filters,loading=false,primaryColor="var(--primary-color, #2563eb)",logoUrl,onRefresh,onExport,onSelectStudent,
}:{rows:readonly StudentAttendanceRow[];meta?:AttendanceReportMeta;filters?:AttendanceReportFiltersValue;loading?:boolean;primaryColor?:string;logoUrl?:string|null;
onRefresh?:()=>void;onExport?:(rows:readonly StudentAttendanceRow[])=>void;onSelectStudent?:(row:StudentAttendanceRow)=>void}) {
 const [query,setQuery]=useState(filters?.query??"");const [view,setView]=useState<"table"|"preview">("table");
 const filtered=useMemo(()=>rows.filter(r=>{const q=query.trim().toLowerCase();if(q&&!`${r.studentName} ${r.admissionNumber??""} ${r.className??""}`.toLowerCase().includes(q))return false;
 if(filters?.risk&&filters.risk!=="all"&&getAttendanceRiskLevel(r.attendancePercent)!==filters.risk)return false;return true;}),[rows,query,filters?.risk]);
 const totals=useMemo(()=>sumStudentRows(filtered),[filtered]);
 return <section className="car-root" style={{"--car-primary":primaryColor} as CSSProperties}><style>{css}</style>
  <AttendanceReportToolbar title={meta?.reportTitle||"Class attendance report"} resultCount={filtered.length} query={query} view={view} busy={loading}
   primaryColor={primaryColor} onQueryChange={setQuery} onViewChange={setView} onRefresh={onRefresh}
   onPrint={()=>window.print()} onExport={onExport?()=>onExport(filtered):undefined}/>
  <AttendanceSummaryCards summary={{...totals,totalStudents:filtered.length}} loading={loading} compact primaryColor={primaryColor}/>
  {view==="preview"?<AttendanceReportPreview rows={filtered} meta={meta} logoUrl={logoUrl} primaryColor={primaryColor}/>:
  <AttendanceReportTable rows={filtered} loading={loading} primaryColor={primaryColor} onSelect={onSelectStudent}/>}
 </section>;
}
const css=`.car-root{display:grid;gap:12px;width:100%;min-width:0;color:var(--text-color,#172033)}`;
export default ClassAttendanceReport;
