"use client";

import { resourceLabel } from "../../lib/subscription/resourceMap";
import type { ResourceKey } from "../../lib/subscription/types";

export interface QuotaReachedDialogProps {
  open: boolean;
  resource: ResourceKey;
  used: number;
  limit: number | null;
  requestedIncrease?: number;
  onClose(): void;
  onUpgrade?(): void;
  title?: string;
  description?: string;
  upgradeLabel?: string;
}

export function QuotaReachedDialog({
  open,
  resource,
  used,
  limit,
  requestedIncrease = 1,
  onClose,
  onUpgrade,
  title,
  description,
  upgradeLabel = "Increase capacity",
}: QuotaReachedDialogProps) {
  if (!open) return null;

  const label = resourceLabel(resource);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quota-reached-title"
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-t-3xl border border-black/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-neutral-950 sm:rounded-3xl">
        <div className="mb-5">
          <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-black/5 text-xl dark:bg-white/10">
            ◫
          </div>
          <h2
            id="quota-reached-title"
            className="text-lg font-semibold tracking-tight"
          >
            {title ?? `${label} capacity reached`}
          </h2>
          <p className="mt-2 text-sm leading-6 text-black/60 dark:text-white/60">
            {description ??
              `The account cannot add ${requestedIncrease} more ${label} under its current capacity.`}
          </p>
        </div>

        <div className="mb-6 rounded-2xl bg-black/[0.035] p-4 dark:bg-white/[0.06]">
          <div className="flex justify-between text-sm">
            <span className="text-black/60 dark:text-white/60">Current usage</span>
            <strong>{used}</strong>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-black/60 dark:text-white/60">Current limit</span>
            <strong>{limit === null ? "Not enabled" : limit}</strong>
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
