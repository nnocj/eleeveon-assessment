"use client";
import type { CSSProperties, ReactNode } from "react";
import type { AttendanceReportMeta, StudentAttendanceRow } from "../insights-types";
import { formatDateTime, formatPercent } from "../insights-utils";

export function AttendanceReportPreview({
 rows,meta={},logoUrl,primaryColor="#2563eb",footer,
}:{rows:readonly StudentAttendanceRow[];meta?:AttendanceReportMeta;logoUrl?:string|null;primaryColor?:string;footer?:ReactNode}) {
 return <article className="arp-page" style={{"--arp-primary":primaryColor} as CSSProperties}><style>{css}</style>
  <header><span className="arp-brand">{logoUrl?<img src={logoUrl} alt=""/>:<i>ES</i>}<span><strong>{meta.schoolName||"School Name"}</strong><small>{meta.branchName||"Branch"}</small></span></span>
  <span className="arp-title"><h1>{meta.reportTitle||"Attendance Report"}</h1><p>{meta.periodLabel||meta.dateRangeLabel||"Selected period"}</p>{meta.className?<b>{meta.className}</b>:null}</span></header>
  <table><thead><tr><th>#</th><th>Student</th><th>Admission no.</th><th>Opened</th><th>Present</th><th>Absent</th><th>Late</th><th>Attendance</th></tr></thead>
  <tbody>{rows.map((r,i)=><tr key={r.id}><td>{i+1}</td><td>{r.studentName}</td><td>{r.admissionNumber||"—"}</td><td>{r.daysOpened}</td><td>{r.daysPresent}</td><td>{r.daysAbsent}</td><td>{r.timesLate}</td><td><strong>{formatPercent(r.attendancePercent)}</strong></td></tr>)}</tbody></table>
  <footer><span>Generated {formatDateTime(meta.generatedAt??new Date())}{meta.generatedBy?` by ${meta.generatedBy}`:""}</span>{footer}</footer>
 </article>;
}
const css=`
.arp-page{width:100%;background:white;color:#172033;border-radius:4px;padding:28px;box-shadow:0 10px 35px rgba(15,23,42,.09);font-family:Arial,sans-serif}.arp-page>header{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;border-bottom:3px solid var(--arp-primary);padding-bottom:14px;margin-bottom:16px}.arp-brand{display:flex;gap:10px;align-items:center}.arp-brand img,.arp-brand i{width:44px;height:44px;border-radius:10px;object-fit:contain}.arp-brand i{display:grid;place-items:center;background:var(--arp-primary);color:white;font-style:normal;font-weight:900}.arp-brand>span{display:grid}.arp-brand strong{font-size:15px}.arp-brand small{font-size:9px;color:#667085}.arp-title{text-align:right}.arp-title h1{font-size:18px;margin:0}.arp-title p{font-size:9px;color:#667085;margin:4px 0}.arp-title b{font-size:9px;color:var(--arp-primary)}.arp-page table{width:100%;border-collapse:collapse}.arp-page th{background:#f4f6f8;font-size:8px;text-transform:uppercase;text-align:left;padding:9px;border:1px solid #e6eaf0}.arp-page td{font-size:9px;padding:8px;border:1px solid #e6eaf0}.arp-page td strong{color:var(--arp-primary)}.arp-page footer{display:flex;justify-content:space-between;margin-top:15px;padding-top:10px;border-top:1px solid #e6eaf0;font-size:7px;color:#667085}
@media print{.arp-page{box-shadow:none;padding:0}.arp-page *{print-color-adjust:exact;-webkit-print-color-adjust:exact}}@media(max-width:620px){.arp-page{padding:16px;overflow:auto}.arp-page table{min-width:640px}}
`;
export default AttendanceReportPreview;
