"use client";

import { useEffect, useMemo, useState } from "react";
import { ResponsiveDataView } from "../../shared";
import { AttendanceEntryHeader } from "./AttendanceEntryHeader";
import { AttendanceEntryToolbar } from "./AttendanceEntryToolbar";
import type { AttendanceEntryViewMode, AttendanceStudent } from "./types";

export interface TermAttendanceTotalsDraft {
  studentId: string;
  daysOpened: number;
  daysPresent: number;
  daysAbsent: number;
  timesLate: number;
  attendancePercent: number;
  dirty?: boolean;
}

export interface TermAttendanceTotalsChange {
  student: AttendanceStudent;
  draft: TermAttendanceTotalsDraft;
}

export interface TermAttendanceTotalsEntryProps {
  students: readonly AttendanceStudent[];
  values: readonly TermAttendanceTotalsDraft[];
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  initialViewMode?: AttendanceEntryViewMode;
  loading?: boolean;
  saving?: boolean;
  editable?: boolean;
  filterAction?: React.ReactNode;
  moreAction?: React.ReactNode;
  primaryAction?: React.ReactNode;
  onChange?: (changes: readonly TermAttendanceTotalsChange[]) => void;
  onSave?: (changes: readonly TermAttendanceTotalsChange[]) => void | Promise<void>;
}

function clamp(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
}

function normalize(value: Partial<TermAttendanceTotalsDraft> & { studentId: string }): TermAttendanceTotalsDraft {
  const daysOpened = clamp(value.daysOpened);
  const daysPresent = Math.min(daysOpened || Number.MAX_SAFE_INTEGER, clamp(value.daysPresent));
  const daysAbsent = Math.max(0, daysOpened - daysPresent);
  const timesLate = clamp(value.timesLate);
  return {
    studentId: value.studentId,
    daysOpened,
    daysPresent,
    daysAbsent,
    timesLate,
    attendancePercent: daysOpened ? Math.round((daysPresent / daysOpened) * 100) : 0,
    dirty: Boolean(value.dirty),
  };
}

export function TermAttendanceTotalsEntry({
  students,
  values,
  title = "Term attendance totals",
  subtitle,
  initialViewMode = "cards",
  loading = false,
  saving = false,
  editable = true,
  filterAction,
  moreAction,
  primaryAction,
  onChange,
  onSave,
}: TermAttendanceTotalsEntryProps) {
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<AttendanceEntryViewMode>(initialViewMode);
  const [drafts, setDrafts] = useState<Map<string, TermAttendanceTotalsDraft>>(
    () => new Map(values.map((value) => [value.studentId, normalize(value)])),
  );

  useEffect(() => {
    setDrafts(new Map(values.map((value) => [value.studentId, normalize(value)])));
  }, [values]);

  const filteredStudents = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return students;
    return students.filter((student) =>
      [student.name, student.admissionNumber, student.studentId, student.className]
        .some((value) => String(value ?? "").toLowerCase().includes(needle)),
    );
  }, [query, students]);

  const changes = useMemo<TermAttendanceTotalsChange[]>(
    () => students.flatMap((student) => {
      const draft = drafts.get(student.id);
      return draft?.dirty ? [{ student, draft }] : [];
    }),
    [drafts, students],
  );

  useEffect(() => onChange?.(changes), [changes, onChange]);

  function update(studentId: string, field: "daysOpened" | "daysPresent" | "timesLate", raw: unknown) {
    setDrafts((current) => {
      const next = new Map(current);
      const previous = next.get(studentId) ?? normalize({ studentId });
      next.set(studentId, normalize({ ...previous, [field]: raw, dirty: true }));
      return next;
    });
  }

  const saveAction = onSave && changes.length ? (
    <button type="button" disabled={!editable || saving} onClick={() => void onSave(changes)}
      style={{minHeight:36,padding:"0 11px",border:0,borderRadius:10,background:"var(--primary,#2563eb)",color:"#fff",font:"inherit",fontSize:12,fontWeight:800,cursor:saving?"not-allowed":"pointer",opacity:saving?.6:1}}>
      {saving ? "Saving..." : `Save ${changes.length}`}
    </button>
  ) : primaryAction;

  const cards = (
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(255px,1fr))",gap:9}}>
      {filteredStudents.map((student) => {
        const draft = drafts.get(student.id) ?? normalize({ studentId: student.id });
        return <article key={student.id} style={{display:"grid",gap:10,padding:11,borderRadius:14,border:draft.dirty?"1px solid rgba(217,119,6,.34)":"1px solid rgba(15,23,42,.10)",background:"var(--background,#fff)"}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:9}}><span style={{display:"grid",minWidth:0}}><strong style={{fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{student.name}</strong><small style={{fontSize:9,opacity:.6}}>{student.admissionNumber || student.studentId || "No admission number"}</small></span><b style={{color:"var(--primary,#2563eb)"}}>{draft.attendancePercent}%</b></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:6}}>
            <NumberField label="Opened" value={draft.daysOpened} disabled={!editable||saving} onChange={(v)=>update(student.id,"daysOpened",v)}/>
            <NumberField label="Present" value={draft.daysPresent} disabled={!editable||saving} onChange={(v)=>update(student.id,"daysPresent",v)}/>
            <NumberField label="Absent" value={draft.daysAbsent} disabled readOnly/>
            <NumberField label="Late" value={draft.timesLate} disabled={!editable||saving} onChange={(v)=>update(student.id,"timesLate",v)}/>
          </div>
        </article>;
      })}
    </div>
  );

  const table = (
    <div style={{overflow:"auto",border:"1px solid rgba(148,163,184,.18)",borderRadius:14}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:720}}><thead><tr>{["Student","Opened","Present","Absent","Late","Attendance"].map((label)=><th key={label} style={th}>{label}</th>)}</tr></thead><tbody>{filteredStudents.map((student)=>{const draft=drafts.get(student.id)??normalize({studentId:student.id});return <tr key={student.id}><td style={td}><strong>{student.name}</strong><small style={{display:"block",opacity:.6}}>{student.admissionNumber||student.studentId||"—"}</small></td><td style={td}><NumberField value={draft.daysOpened} disabled={!editable||saving} onChange={(v)=>update(student.id,"daysOpened",v)}/></td><td style={td}><NumberField value={draft.daysPresent} disabled={!editable||saving} onChange={(v)=>update(student.id,"daysPresent",v)}/></td><td style={td}><NumberField value={draft.daysAbsent} disabled readOnly/></td><td style={td}><NumberField value={draft.timesLate} disabled={!editable||saving} onChange={(v)=>update(student.id,"timesLate",v)}/></td><td style={td}><strong>{draft.attendancePercent}%</strong></td></tr>})}</tbody></table></div>
  );

  return <section style={{display:"grid",gap:11}}>
    <AttendanceEntryHeader title={title} subtitle={subtitle} studentCount={students.length} changedCount={changes.length}/>
    <AttendanceEntryToolbar query={query} onQueryChange={setQuery} date="" onDateChange={()=>undefined} viewMode={viewMode} onViewModeChange={setViewMode} resultCount={filteredStudents.length} primaryAction={saveAction} filterAction={filterAction} moreAction={moreAction} disabled={!editable}/>
    <ResponsiveDataView mode={viewMode} loading={loading} empty={!filteredStudents.length} cards={cards} table={table}/>
  </section>;
}

function NumberField({label,value,onChange,disabled,readOnly}:{label?:string;value:number;onChange?:(value:number)=>void;disabled?:boolean;readOnly?:boolean}) {
  return <label style={{display:"grid",gap:3}}>{label?<span style={{fontSize:8,textTransform:"uppercase",opacity:.58}}>{label}</span>:null}<input type="number" min={0} inputMode="numeric" value={value} disabled={disabled} readOnly={readOnly} onChange={(event)=>onChange?.(Number(event.target.value))} style={{width:"100%",boxSizing:"border-box",padding:"7px 6px",borderRadius:8,border:"1px solid rgba(148,163,184,.22)",background:"var(--background,#fff)",color:"inherit",font:"inherit",fontSize:11}}/></label>;
}
const th:React.CSSProperties={padding:"9px 10px",textAlign:"left",fontSize:9,textTransform:"uppercase",opacity:.6,borderBottom:"1px solid rgba(148,163,184,.18)"};
const td:React.CSSProperties={padding:"8px 10px",fontSize:10,borderBottom:"1px solid rgba(148,163,184,.12)"};
export default TermAttendanceTotalsEntry;
