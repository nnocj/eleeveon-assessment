"use client";

import type {
  AssessmentReportNode,
  AssessmentReportProjectionSettings,
} from "../../../../lib/assessments/assessmentReportProjection.types";

export interface AssessmentBreakdownRowProps {
  node: AssessmentReportNode;
  settings: AssessmentReportProjectionSettings;
  formatNumber?(value: number): string;
}

function defaultFormat(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

export function AssessmentBreakdownRow({
  node,
  settings,
  formatNumber = defaultFormat,
}: AssessmentBreakdownRowProps) {
  const label = settings.showHierarchyPath
    ? node.pathLabels.join(" · ")
    : node.name;

  return (
    <tr
      data-assessment-item-id={node.itemId}
      data-assessment-depth={node.depth}
      data-assessment-parent={node.isParent ? "true" : "false"}
      className={[
        "assessment-breakdown-row",
        node.isParent ? "is-parent" : "is-child",
        node.calculatedFromChildren ? "is-calculated" : "",
        node.complete ? "is-complete" : "is-incomplete",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <th scope="row">
        <span
          className="assessment-breakdown-label"
          style={{
            paddingInlineStart:
              node.indent ? `${Math.min(node.depth, 6) * 14}px` : undefined,
          }}
        >
          {label}
        </span>
      </th>

      {settings.showRawScores ? (
        <td>{formatNumber(node.rawScore)}</td>
      ) : null}

      {settings.showMaximumScores ? (
        <td>{formatNumber(node.maxScore)}</td>
      ) : null}

      {settings.showWeights ? (
        <td>{formatNumber(node.effectiveWeight)}%</td>
      ) : null}

      {settings.showWeightedScores ? (
        <td>{formatNumber(node.weightedScore)}</td>
      ) : null}
    </tr>
  );
}
