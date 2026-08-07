"use client";

import type {
  AssessmentStructureItem,
} from "../../../lib/db/db";
import {
  validateAggregationConfiguration,
  validateEntryMode,
  validateReportVisibility,
} from "../../../lib/assessments";
import {
  AssessmentAggregationControls,
} from "./AssessmentAggregationControls";
import {
  AssessmentItemVisibilityControls,
} from "./AssessmentItemVisibilityControls";
import type {
  AssessmentItemDraft,
} from "./assessment-editor.types";

export function AssessmentItemEditorSheet({
  open,
  draft,
  items,
  saving,
  onChange,
  onClose,
  onSave,
}: {
  open: boolean;
  draft: AssessmentItemDraft;
  items: AssessmentStructureItem[];
  saving: boolean;
  onChange(
    patch: Partial<AssessmentItemDraft>,
  ): void;
  onClose(): void;
  onSave(): void | Promise<void>;
}) {
  if (!open) return null;

  const hasChildren = items.some(
    (item) =>
      String(
        item.parentItemId ?? "",
      ) === String(draft.id ?? ""),
  );

  const preview =
    draftToItem(draft);

  const issues = [
    ...validateEntryMode(
      preview,
      hasChildren,
    ),
    ...validateAggregationConfiguration(
      preview,
      hasChildren,
    ),
    ...validateReportVisibility(
      preview,
    ),
  ];

  const error = issues.find(
    (issue) =>
      issue.severity === "error",
  );

  const parentOptions = items.filter(
    (item) =>
      String(item.id) !==
        String(draft.id ?? "") &&
      item.isDeleted !== true,
  );

  const directDisabled =
    draft.itemType ===
      "computed_total" ||
    draft.entryMode ===
      "from_children";

  return (
    <div
      className="ae-overlay"
      role="dialog"
      aria-modal="true"
    >
      <section className="ae-sheet">
        <header className="ae-sheet-header">
          <div>
            <small>
              Assessment hierarchy
            </small>
            <h3>
              {draft.id
                ? "Edit item"
                : "Create item"}
            </h3>
          </div>

          <button
            type="button"
            className="ae-icon-button"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="ae-sheet-body">
          <section className="ae-form-section">
            <h4>Identity</h4>

            <label>
              Item name
              <input
                autoFocus
                value={draft.name}
                onChange={(event) =>
                  onChange({
                    name:
                      event.target.value,
                  })
                }
              />
            </label>

            <label>
              Parent item
              <select
                value={
                  draft.parentItemId
                }
                onChange={(event) =>
                  onChange({
                    parentItemId:
                      event.target.value,
                  })
                }
              >
                <option value="">
                  Root item
                </option>
                {parentOptions.map(
                  (item) => (
                    <option
                      key={String(
                        item.id,
                      )}
                      value={String(
                        item.id,
                      )}
                    >
                      {item.name}
                    </option>
                  ),
                )}
              </select>
            </label>

            <div className="ae-grid-two">
              <label>
                Item type
                <select
                  value={draft.itemType}
                  onChange={(event) => {
                    const itemType =
                      event.target
                        .value as AssessmentItemDraft["itemType"];

                    onChange({
                      itemType,
                      entryMode:
                        itemType ===
                        "computed_total"
                          ? "from_children"
                          : draft.entryMode,
                    });
                  }}
                >
                  <option value="scored_item">
                    Scored item
                  </option>
                  <option value="group">
                    Group
                  </option>
                  <option value="computed_total">
                    Computed total
                  </option>
                </select>
              </label>

              <label>
                Entry mode
                <select
                  value={draft.entryMode}
                  disabled={
                    draft.itemType ===
                    "computed_total"
                  }
                  onChange={(event) =>
                    onChange({
                      entryMode:
                        event.target
                          .value as AssessmentItemDraft["entryMode"],
                    })
                  }
                >
                  <option value="direct">
                    Direct entry
                  </option>
                  <option value="from_children">
                    Calculate from children
                  </option>
                  <option value="direct_or_children">
                    Direct or children
                  </option>
                </select>
              </label>
            </div>

            {directDisabled ? (
              <p className="ae-help">
                Direct score entry is
                disabled for this
                configuration.
              </p>
            ) : null}
          </section>

          <AssessmentAggregationControls
            draft={draft}
            onChange={onChange}
          />

          <section className="ae-form-section">
            <h4>Behaviour</h4>

            <label className="ae-check">
              <input
                type="checkbox"
                checked={
                  draft.compulsory
                }
                onChange={(event) =>
                  onChange({
                    compulsory:
                      event.target
                        .checked,
                  })
                }
              />
              Compulsory item
            </label>

            <label className="ae-check">
              <input
                type="checkbox"
                checked={
                  draft.allowChildEntry
                }
                onChange={(event) =>
                  onChange({
                    allowChildEntry:
                      event.target
                        .checked,
                  })
                }
              />
              Permit direct entry when
              this item has children
            </label>

            <label className="ae-check">
              <input
                type="checkbox"
                checked={
                  draft.allowManualOverride
                }
                onChange={(event) =>
                  onChange({
                    allowManualOverride:
                      event.target
                        .checked,
                  })
                }
              />
              Permit manual override
            </label>

            <label className="ae-check">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(event) =>
                  onChange({
                    active:
                      event.target
                        .checked,
                  })
                }
              />
              Active
            </label>
          </section>

          <AssessmentItemVisibilityControls
            draft={draft}
            onChange={onChange}
          />

          {issues.length ? (
            <div className="ae-inline-issues">
              {issues.map(
                (issue) => (
                  <p
                    key={`${issue.code}:${issue.message}`}
                    className={
                      issue.severity
                    }
                  >
                    {issue.message}
                  </p>
                ),
              )}
            </div>
          ) : null}
        </div>

        <footer className="ae-sheet-footer">
          <button
            type="button"
            className="secondary"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="primary"
            disabled={
              saving ||
              !draft.name.trim() ||
              Boolean(error)
            }
            onClick={() =>
              void onSave()
            }
          >
            {saving
              ? "Saving…"
              : "Save item"}
          </button>
        </footer>
      </section>
    </div>
  );
}

function draftToItem(
  draft: AssessmentItemDraft,
): AssessmentStructureItem {
  return {
    id: draft.id ?? "draft",
    accountId: "",
    schoolId: "",
    branchId: "",
    assessmentStructureId:
      draft.assessmentStructureId,
    parentItemId:
      draft.parentItemId || null,
    name: draft.name,
    itemType: draft.itemType,
    entryMode: draft.entryMode,
    aggregationMode:
      draft.aggregationMode,
    maxScore:
      Number(draft.maxScore) || 0,
    weight:
      Number(draft.weight) || 0,
    contributionWeight:
      Number(
        draft.contributionWeight,
      ) || 0,
    bestNCount:
      draft.bestNCount
        ? Number(draft.bestNCount)
        : null,
    calculationPrecision:
      Math.min(
        6,
        Math.max(
          0,
          Number(
            draft.calculationPrecision,
          ) || 0,
        ),
      ),
    normalizeChildrenToParentWeight:
      draft.normalizeChildrenToParentWeight,
    minimumRequiredChildren:
      draft.minimumRequiredChildren
        ? Math.max(
            0,
            Number(
              draft.minimumRequiredChildren,
            ) || 0,
          )
        : null,
    order:
      Number(draft.order) || 1,
    compulsory: draft.compulsory,
    allowChildEntry:
      draft.allowChildEntry,
    allowManualOverride:
      draft.allowManualOverride,
    showParentOnReport:
      draft.showParentOnReport,
    showChildrenOnReport:
      draft.showChildrenOnReport,
    reportVisibility:
      draft.reportVisibility,
    active: draft.active,
  } as AssessmentStructureItem;
}
