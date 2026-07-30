"use client";
import type { CSSProperties } from "react";
import type { ClassAttendanceRow } from "../insights-types";
import { formatPercent } from "../insights-utils";

export function ClassAttendanceComparison({
 classes,title="Class comparison",primaryColor="var(--primary-color, #2563eb)",limit=10,onSelect,
}:{classes:readonly ClassAttendanceRow[];title?:string;primaryColor?:string;limit?:number;onSelect?:(item:ClassAttendanceRow)=>void}) {
 const rows=[...classes].sort((a,b)=>b.attendancePercent-a.attendancePercent).slice(0,limit);
 return <article className="cac-card" style={{"--cac-primary":primaryColor} as CSSProperties}><style>{css}</style><header><h3>{title}</h3><small>Highest attendance first</small></header>
  <div>{rows.map((i,index)=><button type="button" key={i.id} disabled={!onSelect} onClick={onSelect?()=>onSelect(i):undefined}><b>{index+1}</b><span><strong>{i.className}</strong><i><em style={{width:`${Math.max(0,Math.min(100,i.attendancePercent))}%`}}/></i><small>{i.totalStudents} students · {i.daysAbsent} absent</small></span><strong>{formatPercent(i.attendancePercent)}</strong></button>)}</div>
 </article>;
}
const css=`
.cac-card{border:1px solid rgba(148,163,184,.2);background:var(--card-background,#fff);color:var(--text-color,#172033);border-radius:18px;padding:14px}.cac-card header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px}.cac-card h3{margin:0;font-size:14px}.cac-card header small{font-size:7px;opacity:.55}.cac-card>div{display:grid;gap:4px}.cac-card button{border:0;background:transparent;color:inherit;display:grid;grid-template-columns:24px 1fr auto;gap:8px;align-items:center;padding:7px;border-radius:10px;text-align:left}.cac-card button:not(:disabled){cursor:pointer}.cac-card button>b{width:23px;height:23px;border-radius:8px;display:grid;place-items:center;background:color-mix(in srgb,var(--cac-primary) 11%,transparent);color:var(--cac-primary);font-size:8px}.cac-card button>span{display:grid;gap:3px}.cac-card button>span strong,.cac-card button>strong{font-size:10px}.cac-card button>strong{color:var(--cac-primary)}.cac-card button>span small{font-size:7px;opacity:.55}.cac-card i{height:5px;border-radius:999px;background:rgba(148,163,184,.14);overflow:hidden}.cac-card i em{display:block;height:100%;background:var(--cac-primary)}
`;
export default ClassAttendanceComparison;
