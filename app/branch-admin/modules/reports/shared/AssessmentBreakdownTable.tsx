"use client";

import type {
  AssessmentReportProjection,
} from "../../../../lib/assessments/assessmentReportProjection.types";
import {
  AssessmentBreakdownHeader,
  type AssessmentBreakdownHeaderProps,
} from "./AssessmentBreakdownHeader";
import {
  AssessmentBreakdownRow,
} from "./AssessmentBreakdownRow";

export interface AssessmentBreakdownTableProps
  extends Omit<AssessmentBreakdownHeaderProps, "settings"> {
  projection: AssessmentReportProjection;
  className?: string;
  emptyMessage?: string;
  caption?: string;
  formatNumber?(value: number): string;
}

export function AssessmentBreakdownTable({
  projection,
  className,
  emptyMessage = "No assessment breakdown is available.",
  caption,
  formatNumber,
  ...headerLabels
}: AssessmentBreakdownTableProps) {
  if (!projection.settings.enabled) return null;

  if (!projection.rows.length) {
    return (
      <div className="assessment-breakdown-empty">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`assessment-breakdown-wrap ${className ?? ""}`.trim()}>
      <style>{assessmentBreakdownCss}</style>
      <table className="assessment-breakdown-table">
        {caption ? <caption>{caption}</caption> : null}
        <AssessmentBreakdownHeader
          settings={projection.settings}
          {...headerLabels}
        />
        <tbody>
          {projection.rows.map((node) => (
            <AssessmentBreakdownRow
              key={node.key}
              node={node}
              settings={projection.settings}
              formatNumber={formatNumber}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

const assessmentBreakdownCss = `
.assessment-breakdown-wrap {
  width: 100%;
  overflow-x: auto;
}

.assessment-breakdown-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
  color: inherit;
  font: inherit;
}

.assessment-breakdown-table caption {
  padding: 0 0 8px;
  text-align: left;
  font-weight: 800;
}

.assessment-breakdown-table th,
.assessment-breakdown-table td {
  border: 1px solid currentColor;
  border-color: color-mix(in srgb, currentColor 18%, transparent);
  padding: 6px 8px;
  text-align: center;
  vertical-align: middle;
}

.assessment-breakdown-table thead th {
  font-size: .9em;
  font-weight: 900;
  white-space: nowrap;
}

.assessment-breakdown-table th:first-child,
.assessment-breakdown-table td:first-child {
  text-align: left;
}

.assessment-breakdown-row.is-parent th {
  font-weight: 900;
}

.assessment-breakdown-row.is-child th {
  font-weight: 650;
}

.assessment-breakdown-row.is-incomplete {
  opacity: .72;
}

.assessment-breakdown-label {
  display: block;
  min-width: 0;
}

.assessment-breakdown-empty {
  padding: 12px;
  border: 1px dashed color-mix(in srgb, currentColor 24%, transparent);
  border-radius: 10px;
  text-align: center;
  opacity: .7;
}

@media print {
  .assessment-breakdown-wrap {
    overflow: visible;
  }

  .assessment-breakdown-table th,
  .assessment-breakdown-table td {
    break-inside: avoid;
  }
}
`;

export default AssessmentBreakdownTable;
