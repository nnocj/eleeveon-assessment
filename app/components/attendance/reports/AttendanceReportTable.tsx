"use client";
import type { CSSProperties, ReactNode } from "react";
import type { StudentAttendanceRow } from "../insights-types";
import { formatPercent, getAttendanceRiskLevel, riskLabel } from "../insights-utils";

export function AttendanceReportTable({
  rows,loading=false,emptyMessage="No attendance records match the selected filters.",
  primaryColor="var(--primary-color, #2563eb)",selectedId,actions,onSelect,
}:{
  rows:readonly StudentAttendanceRow[];loading?:boolean;emptyMessage?:string;primaryColor?:string;selectedId?:string|null;
  actions?:(row:StudentAttendanceRow)=>ReactNode;onSelect?:(row:StudentAttendanceRow)=>void;
}) {
 return <div className="arr-wrap" style={{"--arr-primary":primaryColor} as CSSProperties}><style>{css}</style><table><thead><tr>
  <th>Student</th><th>Class</th><th>Opened</th><th>Present</th><th>Absent</th><th>Late</th><th>Attendance</th><th>Risk</th>{actions?<th/>:null}
 </tr></thead><tbody>{loading?Array.from({length:6},(_,i)=><tr key={i} className="loading"><td colSpan={actions?9:8}><span/></td></tr>):
 rows.length?rows.map(row=>{const risk=getAttendanceRiskLevel(row.attendancePercent);return <tr key={row.id} className={selectedId===row.id?"selected":""} onClick={onSelect?()=>onSelect(row):undefined}>
  <td><span className="arr-student"><i>{row.photoUrl?<img src={row.photoUrl} alt=""/>:row.studentName.slice(0,1)}</i><span><strong>{row.studentName}</strong><small>{row.admissionNumber||"No admission number"}</small></span></span></td>
  <td>{row.className||"—"}</td><td>{row.daysOpened}</td><td>{row.daysPresent}</td><td>{row.daysAbsent}</td><td>{row.timesLate}</td>
  <td><strong className="arr-percent">{formatPercent(row.attendancePercent)}</strong></td><td><span className={`arr-risk ${risk}`}>{riskLabel(risk)}</span></td>
  {actions?<td onClick={e=>e.stopPropagation()}>{actions(row)}</td>:null}</tr>}):<tr><td colSpan={actions?9:8} className="empty">{emptyMessage}</td></tr>}</tbody></table></div>;
}
const css=`
.arr-wrap{width:100%;overflow:auto;border:1px solid rgba(148,163,184,.2);border-radius:15px;background:var(--card-background,#fff);color:var(--text-color,#172033)}.arr-wrap table{width:100%;border-collapse:collapse;min-width:780px}.arr-wrap th{position:sticky;top:0;background:var(--card-background,#fff);text-align:left;font-size:8px;text-transform:uppercase;opacity:.58;padding:10px;border-bottom:1px solid rgba(148,163,184,.18)}.arr-wrap td{padding:9px 10px;border-bottom:1px solid rgba(148,163,184,.12);font-size:10px}.arr-wrap tbody tr:hover,.arr-wrap tbody tr.selected{background:color-mix(in srgb,var(--arr-primary) 6%,transparent)}.arr-student{display:flex;gap:7px;align-items:center}.arr-student>i{width:29px;height:29px;border-radius:9px;display:grid;place-items:center;overflow:hidden;background:color-mix(in srgb,var(--arr-primary) 14%,transparent);color:var(--arr-primary);font-style:normal;font-weight:900}.arr-student img{width:100%;height:100%;object-fit:cover}.arr-student>span{display:grid}.arr-student strong{font-size:10px}.arr-student small{font-size:7px;opacity:.55}.arr-percent{color:var(--arr-primary)}.arr-risk{display:inline-flex;padding:4px 6px;border-radius:999px;font-size:7px;font-weight:900}.arr-risk.low{color:#16803c;background:rgba(22,128,60,.1)}.arr-risk.medium{color:#9a5b00;background:rgba(182,101,0,.11)}.arr-risk.high,.arr-risk.critical{color:#b32d24;background:rgba(192,54,44,.11)}.arr-wrap td.empty{text-align:center;padding:28px;opacity:.6}.arr-wrap tr.loading span{display:block;height:18px;border-radius:7px;background:rgba(148,163,184,.15)}
`;
export default AttendanceReportTable;
