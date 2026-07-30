"use client";
import type { CSSProperties } from "react";
import type { AttendanceRiskItem } from "../insights-types";
import { formatPercent, getAttendanceRiskLevel, riskLabel } from "../insights-utils";

export function AttendanceRiskCard({
  items,title="Attendance risk",limit=5,emptyMessage="No students currently require attendance follow-up.",
  primaryColor="var(--primary-color, #2563eb)",onSelect,onViewAll,
}:{
  items:readonly AttendanceRiskItem[];title?:string;limit?:number;emptyMessage?:string;primaryColor?:string;
  onSelect?:(item:AttendanceRiskItem)=>void;onViewAll?:()=>void;
}) {
  const rows=[...items].map(i=>({...i,riskLevel:i.riskLevel??getAttendanceRiskLevel(i.attendancePercent)}))
    .sort((a,b)=>a.attendancePercent-b.attendancePercent);
  return <article className="ar-card" style={{"--ar-primary":primaryColor} as CSSProperties}>
    <style>{css}</style><header><span><h3>{title}</h3><p>Students needing early intervention</p></span><b>{items.length}</b></header>
    {rows.length?<div className="ar-list">{rows.slice(0,limit).map(i=><button key={i.id} type="button" disabled={!onSelect} onClick={onSelect?()=>onSelect(i):undefined}>
      <span className="ar-avatar">{i.photoUrl?<img src={i.photoUrl} alt=""/>:i.studentName.slice(0,1).toUpperCase()}</span>
      <span className="ar-name"><strong>{i.studentName}</strong><small>{i.admissionNumber||"No admission number"}{i.className?` · ${i.className}`:""}</small></span>
      <span className={`ar-risk ${i.riskLevel}`}>{riskLabel(i.riskLevel!)}</span>
      <span className="ar-value"><strong>{formatPercent(i.attendancePercent)}</strong><small>{i.daysAbsent} absent · {i.timesLate} late</small></span>
    </button>)}</div>:<p className="ar-empty">{emptyMessage}</p>}
    {onViewAll&&items.length>limit?<button type="button" className="ar-more" onClick={onViewAll}>View all at-risk students</button>:null}
  </article>;
}
const css=`
.ar-card{border:1px solid rgba(148,163,184,.2);background:var(--card-background,#fff);color:var(--text-color,#172033);border-radius:18px;padding:14px;display:grid;gap:10px}.ar-card header{display:flex;justify-content:space-between}.ar-card h3{margin:0;font-size:14px}.ar-card header p{margin:3px 0 0;font-size:10px;opacity:.6}.ar-card header b{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:color-mix(in srgb,var(--ar-primary) 12%,transparent);color:var(--ar-primary)}
.ar-list{display:grid;gap:4px}.ar-list>button{border:0;background:transparent;color:inherit;display:grid;grid-template-columns:34px minmax(100px,1fr) auto auto;gap:8px;align-items:center;padding:7px;border-radius:10px;text-align:left}.ar-list>button:not(:disabled){cursor:pointer}.ar-avatar{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;overflow:hidden;background:color-mix(in srgb,var(--ar-primary) 14%,transparent);color:var(--ar-primary);font-weight:900}.ar-avatar img{width:100%;height:100%;object-fit:cover}.ar-name,.ar-value{display:grid;min-width:0}.ar-name strong{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ar-name small,.ar-value small{font-size:8px;opacity:.55}.ar-value{text-align:right}.ar-value strong{font-size:11px}.ar-risk{font-size:8px;font-weight:900;padding:4px 6px;border-radius:999px}.ar-risk.low{color:#16803c;background:rgba(22,128,60,.1)}.ar-risk.medium{color:#9a5b00;background:rgba(182,101,0,.11)}.ar-risk.high,.ar-risk.critical{color:#b32d24;background:rgba(192,54,44,.12)}.ar-more{border:0;background:transparent;color:var(--ar-primary);font-size:10px;font-weight:800;cursor:pointer}.ar-empty{font-size:11px;opacity:.6}
@media(max-width:620px){.ar-list>button{grid-template-columns:34px minmax(0,1fr) auto}.ar-risk{display:none}.ar-value small{display:none}}
`;
export default AttendanceRiskCard;
