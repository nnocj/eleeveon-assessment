"use client";
import type { CSSProperties } from "react";
import type { StudentAttendanceRow } from "../insights-types";
import { formatPercent, getAttendanceRiskLevel, riskLabel } from "../insights-utils";

export function StudentAttendanceTotals({
  student,primaryColor="var(--primary-color, #2563eb)",compact=false,onOpen,
}:{
  student:StudentAttendanceRow;primaryColor?:string;compact?:boolean;onOpen?:(student:StudentAttendanceRow)=>void;
}) {
  const risk=getAttendanceRiskLevel(student.attendancePercent);
  return <article className={`sat-card ${compact?"compact":""}`} style={{"--sat-primary":primaryColor} as CSSProperties}>
    <style>{css}</style><button type="button" className="sat-id" disabled={!onOpen} onClick={onOpen?()=>onOpen(student):undefined}>
      <span className="sat-avatar">{student.photoUrl?<img src={student.photoUrl} alt=""/>:student.studentName.slice(0,1).toUpperCase()}</span>
      <span><strong>{student.studentName}</strong><small>{student.admissionNumber||"No admission number"}{student.className?` · ${student.className}`:""}</small></span>
    </button><span className="sat-score"><strong>{formatPercent(student.attendancePercent)}</strong><small className={risk}>{riskLabel(risk)}</small></span>
    <dl>{[["Opened",student.daysOpened],["Present",student.daysPresent],["Absent",student.daysAbsent],["Late",student.timesLate]].map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
  </article>;
}
const css=`
.sat-card{border:1px solid rgba(148,163,184,.2);background:var(--card-background,#fff);color:var(--text-color,#172033);border-radius:16px;padding:12px;display:grid;grid-template-columns:1fr auto;gap:9px}.sat-id{border:0;background:transparent;color:inherit;display:flex;gap:8px;align-items:center;text-align:left;min-width:0}.sat-id:not(:disabled){cursor:pointer}.sat-id>span:last-child,.sat-score{display:grid;min-width:0}.sat-id strong{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sat-id small,.sat-score small{font-size:8px;opacity:.58}.sat-avatar{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;overflow:hidden;background:color-mix(in srgb,var(--sat-primary) 14%,transparent);color:var(--sat-primary);font-weight:900}.sat-avatar img{width:100%;height:100%;object-fit:cover}.sat-score{text-align:right}.sat-score strong{font-size:16px;color:var(--sat-primary)}.sat-score small.low{color:#16803c}.sat-score small.medium{color:#9a5b00}.sat-score small.high,.sat-score small.critical{color:#c0362c}.sat-card dl{grid-column:1/-1;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:0}.sat-card dl div{padding:7px;border-radius:9px;background:rgba(148,163,184,.08)}.sat-card dt{font-size:7px;text-transform:uppercase;opacity:.55}.sat-card dd{margin:0;font-size:11px;font-weight:900}.sat-card.compact dl{display:none}
`;
export default StudentAttendanceTotals;
