"use client";
import type { CSSProperties } from "react";
import type { ClassAttendanceRow } from "../insights-types";
import { formatPercent, getAttendanceRiskLevel, riskLabel } from "../insights-utils";

export function ClassAttendanceSummary({
  classes,selectedClassId,primaryColor="var(--primary-color, #2563eb)",
  emptyMessage="No class attendance summaries are available.",onSelect,
}:{
  classes:readonly ClassAttendanceRow[];selectedClassId?:string|null;primaryColor?:string;emptyMessage?:string;
  onSelect?:(item:ClassAttendanceRow)=>void;
}) {
  return <section className="cas-grid" style={{"--cas-primary":primaryColor} as CSSProperties}>
    <style>{css}</style>{classes.length?classes.map(i=>{const risk=getAttendanceRiskLevel(i.attendancePercent);return <button type="button" key={i.id} className={selectedClassId===i.classId?"selected":""} disabled={!onSelect} onClick={onSelect?()=>onSelect(i):undefined}>
      <span><strong>{i.className}</strong><small>{i.totalStudents} students</small></span>
      <span className="cas-score"><strong>{formatPercent(i.attendancePercent)}</strong><small className={risk}>{riskLabel(risk)}</small></span>
      <i><em style={{width:`${Math.max(0,Math.min(100,i.attendancePercent))}%`}}/></i>
      <span className="cas-meta"><b>{i.daysAbsent}</b> absent <b>{i.timesLate}</b> late {i.atRiskStudents!=null?<><b>{i.atRiskStudents}</b> at risk</>:null}</span>
    </button>}):<p>{emptyMessage}</p>}</section>;
}
const css=`
.cas-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(225px,1fr));gap:9px}.cas-grid>button{border:1px solid rgba(148,163,184,.2);background:var(--card-background,#fff);color:var(--text-color,#172033);border-radius:15px;padding:12px;display:grid;grid-template-columns:1fr auto;gap:7px;text-align:left}.cas-grid>button:not(:disabled){cursor:pointer}.cas-grid>button.selected{border-color:var(--cas-primary)}.cas-grid>button span{display:grid}.cas-grid strong{font-size:12px}.cas-grid small{font-size:8px;opacity:.58}.cas-score{text-align:right}.cas-score strong{color:var(--cas-primary)}.cas-score small.low{color:#16803c}.cas-score small.medium{color:#9a5b00}.cas-score small.high,.cas-score small.critical{color:#c0362c}.cas-grid i{grid-column:1/-1;height:6px;border-radius:999px;background:rgba(148,163,184,.14);overflow:hidden}.cas-grid i em{display:block;height:100%;background:var(--cas-primary)}.cas-meta{grid-column:1/-1;display:flex!important;gap:6px;font-size:8px;opacity:.62}.cas-grid>p{font-size:11px;opacity:.6}
`;
export default ClassAttendanceSummary;
