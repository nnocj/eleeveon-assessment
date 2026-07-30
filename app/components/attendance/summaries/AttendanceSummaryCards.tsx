"use client";
import type { CSSProperties } from "react";
import type { AttendanceSummaryData } from "../insights-types";
import { formatPercent } from "../insights-utils";

export interface AttendanceSummaryCardsProps {
  summary: AttendanceSummaryData;
  loading?: boolean;
  compact?: boolean;
  primaryColor?: string;
  onCardClick?: (key: "attendance" | "present" | "absent" | "late" | "unmarked") => void;
}

export function AttendanceSummaryCards({
  summary, loading = false, compact = false,
  primaryColor = "var(--primary-color, #2563eb)", onCardClick,
}: AttendanceSummaryCardsProps) {
  const unmarked = summary.unmarkedStudents ?? Math.max(
    0, Number(summary.totalStudents ?? 0) - Number(summary.markedStudents ?? summary.totalStudents ?? 0),
  );
  const items = [
    ["attendance","Attendance",formatPercent(summary.attendancePercent),`${summary.daysPresent} of ${summary.daysOpened}`,"◎","primary"],
    ["present","Present",summary.daysPresent,"Recorded present","✓","success"],
    ["absent","Absent",summary.daysAbsent,"Recorded absent","−","danger"],
    ["late","Late",summary.timesLate,"Late arrivals","◷","warning"],
    ["unmarked","Unmarked",unmarked,"Needs attention","?","neutral"],
  ] as const;

  return <section className={`as-grid ${compact ? "compact" : ""}`}
    style={{"--as-primary":primaryColor} as CSSProperties} aria-busy={loading}>
    <style>{css}</style>
    {loading ? Array.from({length:5},(_,i)=><span className="as-skeleton" key={i}/>) :
      items.map(([key,label,value,detail,symbol,tone]) =>
        <button key={key} type="button" className={`as-card ${tone}`}
          disabled={!onCardClick} onClick={onCardClick ? ()=>onCardClick(key) : undefined}>
          <span className="as-symbol">{symbol}</span>
          <span><small>{label}</small><strong>{value}</strong>{!compact?<em>{detail}</em>:null}</span>
        </button>)}
  </section>;
}

const css=`
.as-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px}
.as-card{border:1px solid rgba(148,163,184,.2);background:var(--card-background,#fff);color:var(--text-color,#172033);border-radius:16px;padding:12px;display:flex;gap:10px;align-items:center;text-align:left}
.as-card:not(:disabled){cursor:pointer}.as-card>span:last-child{display:grid;min-width:0}.as-card small{font-size:10px;font-weight:800;opacity:.62}.as-card strong{font-size:18px}.as-card em{font-size:9px;font-style:normal;opacity:.55;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.as-symbol{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:color-mix(in srgb,currentColor 11%,transparent);font-weight:900}
.as-card.primary{color:var(--as-primary)}.as-card.success{color:#16803c}.as-card.danger{color:#c0362c}.as-card.warning{color:#b66500}.as-card.neutral{color:#667085}
.as-grid.compact .as-card{padding:9px}.as-grid.compact .as-card strong{font-size:15px}.as-skeleton{height:70px;border-radius:16px;background:rgba(148,163,184,.15)}
@media(max-width:520px){.as-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.as-grid>*:first-child{grid-column:1/-1}}
`;
export default AttendanceSummaryCards;
