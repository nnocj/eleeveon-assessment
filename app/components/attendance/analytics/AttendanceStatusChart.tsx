"use client";
import type { CSSProperties } from "react";
import type { AttendanceStatusBreakdown } from "../insights-types";
import { breakdownTotal } from "../insights-utils";

export function AttendanceStatusChart({
 breakdown,title="Attendance status",size=190,primaryColor="var(--primary-color, #2563eb)",showLegend=true,
}:{breakdown:AttendanceStatusBreakdown;title?:string;size?:number;primaryColor?:string;showLegend?:boolean}) {
 const total=breakdownTotal(breakdown);
 const values=[{label:"Present",value:breakdown.present,color:"#16803c"},{label:"Absent",value:breakdown.absent,color:"#c0362c"},{label:"Late",value:breakdown.late,color:"#b66500"},{label:"Unmarked",value:breakdown.unmarked??0,color:"#98a2b3"}];
 let offset=25;const segments=values.map(item=>{const length=total?item.value/total*100:0;const row={...item,length,offset};offset-=length;return row;});
 return <article className="asc-card" style={{"--asc-primary":primaryColor} as CSSProperties}><style>{css}</style><h3>{title}</h3>
  <div className="asc-content"><div className="asc-donut" style={{width:size,height:size}}><svg viewBox="0 0 42 42" role="img" aria-label={title}>
   <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="rgba(148,163,184,.12)" strokeWidth="5"/>
   {segments.map(s=>s.length?<circle key={s.label} cx="21" cy="21" r="15.9155" fill="transparent" stroke={s.color} strokeWidth="5" strokeDasharray={`${s.length} ${100-s.length}`} strokeDashoffset={s.offset}/>:null)}
  </svg><span><strong>{total}</strong><small>records</small></span></div>
  {showLegend?<div className="asc-legend">{values.map(i=><span key={i.label}><i style={{background:i.color}}/><b>{i.label}</b><strong>{i.value}</strong></span>)}</div>:null}</div>
 </article>;
}
const css=`
.asc-card{border:1px solid rgba(148,163,184,.2);background:var(--card-background,#fff);color:var(--text-color,#172033);border-radius:18px;padding:14px}.asc-card h3{margin:0 0 12px;font-size:14px}.asc-content{display:flex;gap:18px;align-items:center;justify-content:center;flex-wrap:wrap}.asc-donut{position:relative;max-width:100%}.asc-donut svg{width:100%;height:100%;transform:rotate(-90deg)}.asc-donut>span{position:absolute;inset:0;display:grid;place-content:center;text-align:center}.asc-donut strong{font-size:20px}.asc-donut small{font-size:8px;opacity:.55}.asc-legend{display:grid;gap:7px;min-width:115px}.asc-legend span{display:grid;grid-template-columns:8px 1fr auto;gap:7px;align-items:center}.asc-legend i{width:8px;height:8px;border-radius:50%}.asc-legend b,.asc-legend strong{font-size:9px}
`;
export default AttendanceStatusChart;
