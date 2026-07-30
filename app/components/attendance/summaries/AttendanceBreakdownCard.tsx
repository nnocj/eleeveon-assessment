"use client";
import type { CSSProperties } from "react";
import type { AttendanceStatusBreakdown } from "../insights-types";
import { breakdownTotal } from "../insights-utils";

export function AttendanceBreakdownCard({
  breakdown, title="Status breakdown", subtitle="Distribution for the selected scope",
  primaryColor="var(--primary-color, #2563eb)", onStatusClick,
}:{
  breakdown:AttendanceStatusBreakdown; title?:string; subtitle?:string; primaryColor?:string;
  onStatusClick?:(status:"present"|"absent"|"late"|"unmarked")=>void;
}) {
  const total=Math.max(1,breakdownTotal(breakdown));
  const items=[
    {key:"present",label:"Present",value:breakdown.present,color:"#16803c"},
    {key:"absent",label:"Absent",value:breakdown.absent,color:"#c0362c"},
    {key:"late",label:"Late",value:breakdown.late,color:"#b66500"},
    {key:"unmarked",label:"Unmarked",value:breakdown.unmarked??0,color:"#667085"},
  ] as const;
  return <article className="ab-card" style={{"--ab-primary":primaryColor} as CSSProperties}>
    <style>{css}</style><header><span><h3>{title}</h3><p>{subtitle}</p></span><strong>{breakdownTotal(breakdown)}</strong></header>
    <div className="ab-bar">{items.map(i=>i.value>0?<span key={i.key} style={{width:`${i.value/total*100}%`,background:i.color}}/>:null)}</div>
    <div className="ab-list">{items.map(i=><button type="button" key={i.key} disabled={!onStatusClick} onClick={onStatusClick?()=>onStatusClick(i.key):undefined}>
      <i style={{background:i.color}}/><span>{i.label}</span><strong>{i.value}</strong><em>{(i.value/total*100).toFixed(1)}%</em>
    </button>)}</div>
  </article>;
}
const css=`
.ab-card{border:1px solid rgba(148,163,184,.2);background:var(--card-background,#fff);color:var(--text-color,#172033);border-radius:18px;padding:14px;display:grid;gap:12px}.ab-card header{display:flex;justify-content:space-between}.ab-card h3{margin:0;font-size:14px}.ab-card p{margin:3px 0 0;font-size:10px;opacity:.6}.ab-card header>strong{font-size:21px;color:var(--ab-primary)}
.ab-bar{display:flex;height:8px;border-radius:999px;overflow:hidden;background:rgba(148,163,184,.14)}.ab-list{display:grid;gap:4px}.ab-list button{border:0;background:transparent;color:inherit;display:grid;grid-template-columns:8px 1fr auto 45px;gap:8px;align-items:center;padding:6px;text-align:left;border-radius:9px}.ab-list button:not(:disabled){cursor:pointer}.ab-list i{width:8px;height:8px;border-radius:50%}.ab-list span,.ab-list strong{font-size:11px}.ab-list em{font-size:9px;font-style:normal;opacity:.55;text-align:right}
`;
export default AttendanceBreakdownCard;
