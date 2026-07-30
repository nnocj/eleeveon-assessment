"use client";
import type { CSSProperties } from "react";
import type { AttendanceTrendPoint } from "../insights-types";

export function AttendanceTrendChart({
 points,title="Attendance trend",height=220,primaryColor="var(--primary-color, #2563eb)",showAverage=true,onPointSelect,
}:{points:readonly AttendanceTrendPoint[];title?:string;height?:number;primaryColor?:string;showAverage?:boolean;onPointSelect?:(point:AttendanceTrendPoint)=>void}) {
 const width=720,padX=36,padY=24,innerW=width-padX*2,innerH=height-padY*2;
 const average=points.length?points.reduce((s,p)=>s+p.attendancePercent,0)/points.length:0;
 const coords=points.map((point,index)=>({point,x:points.length<=1?width/2:padX+index/(points.length-1)*innerW,y:padY+(100-Math.max(0,Math.min(100,point.attendancePercent)))/100*innerH}));
 const path=coords.map((c,i)=>`${i?"L":"M"} ${c.x} ${c.y}`).join(" ");
 return <article className="atc-card" style={{"--atc-primary":primaryColor} as CSSProperties}><style>{css}</style><header><span><h3>{title}</h3><p>{points.length} point(s)</p></span>{showAverage?<strong>{average.toFixed(1)}% avg.</strong>:null}</header>
  <div className="atc-svg"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
   {[0,25,50,75,100].map(v=>{const y=padY+(100-v)/100*innerH;return <g key={v}><line x1={padX} x2={width-padX} y1={y} y2={y} stroke="currentColor" opacity=".09"/><text x="2" y={y+3} fontSize="8" fill="currentColor" opacity=".5">{v}%</text></g>})}
   {path?<><path d={path} fill="none" stroke="var(--atc-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>{coords.map(({point,x,y},i)=><g key={point.id??`${point.label}-${i}`} onClick={onPointSelect?()=>onPointSelect(point):undefined}><circle cx={x} cy={y} r="8" fill="transparent" className={onPointSelect?"clickable":""}/><circle cx={x} cy={y} r="3.5" fill="var(--atc-primary)"/><title>{point.label}: {point.attendancePercent.toFixed(1)}%</title></g>)}</>:null}
  </svg></div><div className="atc-labels">{points.map((p,i)=><span key={p.id??`${p.label}-${i}`}>{p.label}</span>)}</div>
 </article>;
}
const css=`
.atc-card{border:1px solid rgba(148,163,184,.2);background:var(--card-background,#fff);color:var(--text-color,#172033);border-radius:18px;padding:14px;min-width:0}.atc-card header{display:flex;justify-content:space-between}.atc-card h3{margin:0;font-size:14px}.atc-card header p{font-size:8px;opacity:.55;margin:3px 0}.atc-card header>strong{font-size:11px;color:var(--atc-primary)}.atc-svg{width:100%;overflow:hidden}.atc-svg svg{display:block;width:100%;height:auto}.atc-svg .clickable{cursor:pointer}.atc-labels{display:flex;justify-content:space-between;gap:5px;padding:0 5%;font-size:7px;opacity:.55}.atc-labels span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
`;
export default AttendanceTrendChart;
