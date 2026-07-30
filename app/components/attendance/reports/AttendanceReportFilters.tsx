"use client";
import type { CSSProperties } from "react";
import type { AttendanceFilterOption, AttendanceReportFiltersValue } from "../insights-types";

function SelectField({label,value,options,onChange,disabled}:{label:string;value?:string;options:readonly AttendanceFilterOption[];onChange:(value:string)=>void;disabled:boolean}) {
  return <label><span>{label}</span><select value={value??""} onChange={e=>onChange(e.target.value)} disabled={disabled}>
    <option value="">All</option>{options.map(o=><option value={o.value} key={o.value}>{o.label}</option>)}
  </select></label>;
}

export function AttendanceReportFilters({
  value,academicStructures=[],academicPeriods=[],classes=[],students=[],showStudentFilter=true,showDateRange=true,
  disabled=false,primaryColor="var(--primary-color, #2563eb)",onChange,onApply,onReset,
}:{
  value:AttendanceReportFiltersValue;academicStructures?:readonly AttendanceFilterOption[];academicPeriods?:readonly AttendanceFilterOption[];
  classes?:readonly AttendanceFilterOption[];students?:readonly AttendanceFilterOption[];showStudentFilter?:boolean;showDateRange?:boolean;
  disabled?:boolean;primaryColor?:string;onChange:(value:AttendanceReportFiltersValue)=>void;
  onApply?:(value:AttendanceReportFiltersValue)=>void;onReset?:()=>void;
}) {
  const patch=(next:Partial<AttendanceReportFiltersValue>)=>onChange({...value,...next});
  return <section className="arf-card" style={{"--arf-primary":primaryColor} as CSSProperties}><style>{css}</style>
    <div className="arf-grid">
      <SelectField label="Academic structure" value={value.academicStructureId} options={academicStructures} disabled={disabled} onChange={academicStructureId=>patch({academicStructureId,academicPeriodId:"",classId:""})}/>
      <SelectField label="Academic period" value={value.academicPeriodId} options={academicPeriods} disabled={disabled} onChange={academicPeriodId=>patch({academicPeriodId})}/>
      <SelectField label="Class" value={value.classId} options={classes} disabled={disabled} onChange={classId=>patch({classId,studentId:""})}/>
      {showStudentFilter?<SelectField label="Student" value={value.studentId} options={students} disabled={disabled} onChange={studentId=>patch({studentId})}/>:null}
      {showDateRange?<><label><span>From</span><input type="date" value={value.startDate??""} disabled={disabled} onChange={e=>patch({startDate:e.target.value})}/></label>
      <label><span>To</span><input type="date" value={value.endDate??""} disabled={disabled} onChange={e=>patch({endDate:e.target.value})}/></label></>:null}
      <label><span>Status</span><select value={value.status??"all"} disabled={disabled} onChange={e=>patch({status:e.target.value as AttendanceReportFiltersValue["status"]})}>
        <option value="all">All statuses</option><option value="present">Present</option><option value="absent">Absent</option><option value="late">Late</option>
      </select></label>
      <label><span>Risk</span><select value={value.risk??"all"} disabled={disabled} onChange={e=>patch({risk:e.target.value as AttendanceReportFiltersValue["risk"]})}>
        <option value="all">All risk levels</option><option value="low">Healthy</option><option value="medium">Watch</option><option value="high">High risk</option><option value="critical">Critical</option>
      </select></label>
    </div><div className="arf-actions">{onReset?<button type="button" className="secondary" onClick={onReset} disabled={disabled}>Reset</button>:null}
    {onApply?<button type="button" onClick={()=>onApply(value)} disabled={disabled}>Apply filters</button>:null}</div>
  </section>;
}
const css=`
.arf-card{background:var(--card-background,#fff);color:var(--text-color,#172033);border:1px solid rgba(148,163,184,.2);border-radius:17px;padding:13px;display:grid;gap:10px}.arf-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:9px}.arf-card label{display:grid;gap:4px}.arf-card label>span{font-size:8px;font-weight:800;text-transform:uppercase;opacity:.58}.arf-card input,.arf-card select{width:100%;min-width:0;border:1px solid rgba(148,163,184,.28);background:var(--input-background,transparent);color:inherit;border-radius:10px;padding:9px;font:inherit;font-size:10px;outline:none}.arf-card input:focus,.arf-card select:focus{border-color:var(--arf-primary)}.arf-actions{display:flex;justify-content:flex-end;gap:7px}.arf-actions button{border:0;background:var(--arf-primary);color:white;padding:9px 12px;border-radius:10px;font-size:10px;font-weight:800;cursor:pointer}.arf-actions button.secondary{background:rgba(148,163,184,.12);color:inherit}.arf-actions button:disabled{opacity:.5}
`;
export default AttendanceReportFilters;
