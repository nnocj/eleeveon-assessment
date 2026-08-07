"use client";

import type {
  AssessmentReportProjectionSettings,
} from "../../../../lib/assessments/assessmentReportProjection.types";

export interface AssessmentBreakdownHeaderProps {
  settings: AssessmentReportProjectionSettings;
  itemLabel?: string;
  scoreLabel?: string;
  maximumLabel?: string;
  weightLabel?: string;
  weightedLabel?: string;
}

export function AssessmentBreakdownHeader({
  settings,
  itemLabel = "Assessment",
  scoreLabel = "Score",
  maximumLabel = "Max",
  weightLabel = "Weight",
  weightedLabel = "Weighted",
}: AssessmentBreakdownHeaderProps) {
  return (
    <thead>
      <tr>
        <th scope="col">{itemLabel}</th>
        {settings.showRawScores ? (
          <th scope="col">{scoreLabel}</th>
        ) : null}
        {settings.showMaximumScores ? (
          <th scope="col">{maximumLabel}</th>
        ) : null}
        {settings.showWeights ? (
          <th scope="col">{weightLabel}</th>
        ) : null}
        {settings.showWeightedScores ? (
          <th scope="col">{weightedLabel}</th>
        ) : null}
      </tr>
    </thead>
  );
}
