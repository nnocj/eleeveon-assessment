"use client";
import type { CSSProperties } from "react";
import type { AttendanceTrendPoint } from "../insights-types";
import { formatPercent } from "../insights-utils";

export function AttendanceTrendSummary({points,primaryColor="var(--primary-color, #2563eb)",targetPercent=90}:{
 points:readonly AttendanceTrendPoint[];primaryColor?:string;targetPercent?:number;
}) {
 const first=points.at(0)?.attendancePercent??0,latest=points.at(-1)?.attendancePercent??0;
 const average=points.length?points.reduce((s,p)=>s+p.attendancePercent,0)/points.length:0,change=latest-first;
 const best=points.length?points.reduce((a,b)=>b.attendancePercent>a.attendancePercent?b:a):null;
 const items=[
  ["Current",formatPercent(latest),latest>=targetPercent?"On target":`${(targetPercent-latest).toFixed(1)} pts below target`,latest>=targetPercent?"positive":""],
  ["Average",formatPercent(average),`${points.length} period(s)`,""],
  ["Change",`${change>0?"+":""}${change.toFixed(1)} pts`,"First to latest",change<0?"negative":"positive"],
  ["Best period",best?formatPercent(best.attendancePercent):"—",best?.label||"No data",""],
 ] as const;
 return <section className="ats-grid" style={{"--ats-primary":primaryColor} as CSSProperties}><style>{css}</style>{items.map(([label,value,detail,tone])=><article key={label}><small>{label}</small><strong className={tone}>{value}</strong><em>{detail}</em></article>)}</section>;
}
const css=`
.ats-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.ats-grid article{border:1px solid rgba(148,163,184,.18);background:var(--card-background,#fff);color:var(--text-color,#172033);border-radius:14px;padding:11px;display:grid}.ats-grid small{font-size:8px;text-transform:uppercase;opacity:.55}.ats-grid strong{font-size:15px;color:var(--ats-primary)}.ats-grid strong.negative{color:#c0362c}.ats-grid strong.positive{color:#16803c}.ats-grid em{font-size:7px;font-style:normal;opacity:.55;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@media(max-width:620px){.ats-grid{grid-template-columns:repeat(2,1fr)}}
`;
export default AttendanceTrendSummary;
