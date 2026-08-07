"use client";

import type {
  AssessmentItemDraft,
} from "./assessment-editor.types";

export function AssessmentAggregationControls({
  draft,
  onChange,
}: {
  draft: AssessmentItemDraft;
  onChange(
    patch: Partial<AssessmentItemDraft>,
  ): void;
}) {
  const hasChildrenMode =
    draft.entryMode !== "direct";

  const needsChildCompletion =
    draft.entryMode === "from_children" ||
    draft.entryMode === "direct_or_children";

  return (
    <section className="ae-form-section">
      <h4>Calculation</h4>

      <label>
        Aggregation method
        <select
          value={draft.aggregationMode}
          disabled={!hasChildrenMode}
          onChange={(event) =>
            onChange({
              aggregationMode:
                event.target.value as AssessmentItemDraft["aggregationMode"],
            })
          }
        >
          <option value="sum">Sum child scores</option>
          <option value="weighted_sum">
            Weighted sum
          </option>
          <option value="average">
            Average child percentages
          </option>
          <option value="best_n">
            Best N child scores
          </option>
          <option value="custom">
            Custom (reserved)
          </option>
        </select>
      </label>

      {draft.aggregationMode ===
      "best_n" ? (
        <label>
          Number of best items
          <input
            type="number"
            min={1}
            step={1}
            value={draft.bestNCount}
            onChange={(event) =>
              onChange({
                bestNCount:
                  event.target.value,
              })
            }
          />
        </label>
      ) : null}

      <div className="ae-grid-two">
        <label>
          Maximum score
          <input
            type="number"
            min={0.01}
            step="0.01"
            value={draft.maxScore}
            onChange={(event) =>
              onChange({
                maxScore:
                  event.target.value,
              })
            }
          />
        </label>

        <label>
          Structure weight
          <input
            type="number"
            min={0}
            step="0.01"
            value={draft.weight}
            onChange={(event) =>
              onChange({
                weight:
                  event.target.value,
              })
            }
          />
        </label>
      </div>

      {draft.aggregationMode ===
      "weighted_sum" ? (
        <label>
          Contribution weight
          <input
            type="number"
            min={0}
            step="0.01"
            value={
              draft.contributionWeight
            }
            onChange={(event) =>
              onChange({
                contributionWeight:
                  event.target.value,
              })
            }
          />
        </label>
      ) : null}

      <div className="ae-grid-two">
        <label>
          Calculation precision
          <input
            type="number"
            min={0}
            max={6}
            step={1}
            value={
              draft.calculationPrecision
            }
            onChange={(event) =>
              onChange({
                calculationPrecision:
                  event.target.value,
              })
            }
          />
          <small className="ae-help">
            Number of decimal places used
            during recursive calculations.
          </small>
        </label>

        <label>
          Minimum completed children
          <input
            type="number"
            min={0}
            step={1}
            disabled={
              !needsChildCompletion
            }
            value={
              draft.minimumRequiredChildren
            }
            placeholder="All available children"
            onChange={(event) =>
              onChange({
                minimumRequiredChildren:
                  event.target.value,
              })
            }
          />
          <small className="ae-help">
            Leave blank to use the default
            completion rule.
          </small>
        </label>
      </div>

      <label className="ae-check">
        <input
          type="checkbox"
          checked={
            draft.normalizeChildrenToParentWeight
          }
          disabled={!hasChildrenMode}
          onChange={(event) =>
            onChange({
              normalizeChildrenToParentWeight:
                event.target.checked,
            })
          }
        />
        Normalize child calculations into
        the parent contribution
      </label>
    </section>
  );
}
