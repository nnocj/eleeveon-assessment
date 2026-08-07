"use client";

import type {
  AssessmentValidationIssue,
} from "../../../lib/assessments";

export function AssessmentValidationPanel({
  issues,
}: {
  issues: AssessmentValidationIssue[];
}) {
  if (!issues.length) {
    return (
      <div className="ae-validation ok">
        ✓ Structure is valid
      </div>
    );
  }

  const errors = issues.filter(
    (issue) =>
      issue.severity === "error",
  );
  const warnings = issues.filter(
    (issue) =>
      issue.severity === "warning",
  );

  return (
    <section className="ae-validation-panel">
      <header>
        <strong>
          {errors.length} errors ·{" "}
          {warnings.length} warnings
        </strong>
      </header>

      <div className="ae-validation-list">
        {issues.map((issue, index) => (
          <div
            key={`${issue.code}:${issue.itemId ?? index}`}
            className={`ae-validation ${issue.severity}`}
          >
            <span>
              {issue.severity === "error"
                ? "!"
                : "△"}
            </span>
            <div>
              <strong>{issue.code}</strong>
              <p>{issue.message}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
