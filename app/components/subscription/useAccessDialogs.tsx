"use client";

import { useCallback, useState } from "react";
import { useAccess } from "../../context/subscription-context";
import type { FeatureKey, ResourceKey } from "../../lib/subscription/types";
import { FeatureUnavailableDialog } from "./FeatureUnavailableDialog";
import { QuotaReachedDialog } from "./QuotaReachedDialog";

type State =
  | { type: "feature"; feature: FeatureKey }
  | { type: "quota"; resource: ResourceKey; increase: number }
  | null;

export function useAccessDialogs(options?: { onUpgrade?(): void }) {
  const access = useAccess();
  const [state, setState] = useState<State>(null);

  const requireFeature = useCallback(
    (feature: FeatureKey, action?: () => void) => {
      if (!access.can(feature)) {
        setState({ type: "feature", feature });
        return false;
      }
      action?.();
      return true;
    },
    [access],
  );

  const requireCapacity = useCallback(
    (
      resource: ResourceKey,
      increase = 1,
      action?: () => void,
    ) => {
      if (!access.hasCapacity(resource, increase)) {
        setState({ type: "quota", resource, increase });
        return false;
      }
      action?.();
      return true;
    },
    [access],
  );

  return {
    requireFeature,
    requireCapacity,
    closeAccessDialog: () => setState(null),
    dialogs: (
      <>
        <FeatureUnavailableDialog
          open={state?.type === "feature"}
          feature={state?.type === "feature" ? state.feature : ""}
          onClose={() => setState(null)}
          onUpgrade={options?.onUpgrade}
        />

        <QuotaReachedDialog
          open={state?.type === "quota"}
          resource={state?.type === "quota" ? state.resource : ""}
          requestedIncrease={state?.type === "quota" ? state.increase : 1}
          used={state?.type === "quota" ? access.used(state.resource) : 0}
          limit={state?.type === "quota" ? access.limit(state.resource) : null}
          onClose={() => setState(null)}
          onUpgrade={options?.onUpgrade}
        />
      </>
    ),
  };
}
