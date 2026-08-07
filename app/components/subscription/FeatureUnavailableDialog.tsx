"use client";

import { featureLabel } from "../../lib/subscription/resourceMap";
import type { FeatureKey } from "../../lib/subscription/types";

export interface FeatureUnavailableDialogProps {
  open: boolean;
  feature: FeatureKey;
  onClose(): void;
  onUpgrade?(): void;
  title?: string;
  description?: string;
  upgradeLabel?: string;
}

export function FeatureUnavailableDialog({
  open,
  feature,
  onClose,
  onUpgrade,
  title,
  description,
  upgradeLabel = "View upgrade options",
}: FeatureUnavailableDialogProps) {
  if (!open) return null;

  const label = featureLabel(feature);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feature-unavailable-title"
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-t-3xl border border-black/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-neutral-950 sm:rounded-3xl">
        <div className="mb-5 flex gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-black/5 text-xl dark:bg-white/10">
            ◇
          </div>

          <div>
            <h2
              id="feature-unavailable-title"
              className="text-lg font-semibold tracking-tight"
            >
              {title ?? `${label} is unavailable`}
            </h2>
            <p className="mt-1 text-sm leading-6 text-black/60 dark:text-white/60">
              {description ??
                "This capability is not included in the account's current access package."}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium dark:border-white/10"
          >
            Close
          </button>

          {onUpgrade ? (
            <button
              type="button"
              onClick={onUpgrade}
              className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-black"
            >
              {upgradeLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
