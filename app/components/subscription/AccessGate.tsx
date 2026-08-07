"use client";

import type { ReactNode } from "react";
import { useAccess } from "../../context/subscription-context";
import type { FeatureKey, ResourceKey } from "../../lib/subscription/types";

export function AccessGate({
  children,
  feature,
  resource,
  increase = 1,
  fallback = null,
  loadingFallback = null,
}: {
  children: ReactNode;
  feature?: FeatureKey;
  resource?: ResourceKey;
  increase?: number;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}) {
  const access = useAccess();

  if (access.loading || !access.initialized) {
    return <>{loadingFallback}</>;
  }

  if (feature && !access.can(feature)) return <>{fallback}</>;

  if (
    resource &&
    !access.hasCapacity(resource, increase)
  ) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
