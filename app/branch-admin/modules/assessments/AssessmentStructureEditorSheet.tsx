"use client";

import type {
  AcademicStructure,
  Organization,
} from "../../../lib/db/db";
import type {
  AssessmentStructureDraft,
} from "./assessment-editor.types";

export function AssessmentStructureEditorSheet({
  open,
  draft,
  academicStructures,
  organizations,
  saving,
  onChange,
  onClose,
  onSave,
}: {
  open: boolean;
  draft: AssessmentStructureDraft;
  academicStructures: AcademicStructure[];
  organizations: Organization[];
  saving: boolean;
  onChange(
    patch: Partial<AssessmentStructureDraft>,
  ): void;
  onClose(): void;
  onSave(): void | Promise<void>;
}) {
  if (!open) return null;

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
              Assessment setup
            </small>
            <h3>
              {draft.id
                ? "Edit structure"
                : "New structure"}
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
            <label>
              Structure name
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
              Academic structure
              <select
                value={
                  draft.academicStructureId
                }
                onChange={(event) =>
                  onChange({
                    academicStructureId:
                      event.target.value,
                  })
                }
              >
                <option value="">
                  Select
                </option>
                {academicStructures.map(
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

            <label>
              Organization
              <select
                value={
                  draft.organizationId
                }
                onChange={(event) =>
                  onChange({
                    organizationId:
                      event.target.value,
                  })
                }
              >
                <option value="">
                  None
                </option>
                {organizations.map(
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

            <label>
              Description
              <textarea
                rows={3}
                value={
                  draft.description
                }
                onChange={(event) =>
                  onChange({
                    description:
                      event.target.value,
                  })
                }
              />
            </label>

            <label>
              Total score / weight
              <input
                type="number"
                min={1}
                value={
                  draft.totalScore
                }
                onChange={(event) =>
                  onChange({
                    totalScore:
                      event.target.value,
                  })
                }
              />
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

            <label className="ae-check">
              <input
                type="checkbox"
                checked={draft.locked}
                onChange={(event) =>
                  onChange({
                    locked:
                      event.target
                        .checked,
                  })
                }
              />
              Lock structure
            </label>
          </section>
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
              !draft.academicStructureId
            }
            onClick={() =>
              void onSave()
            }
          >
            {saving
              ? "Saving…"
              : "Save structure"}
          </button>
        </footer>
      </section>
    </div>
  );
}
