"use client";

import type { ReactNode } from "react";
import { SubscriptionProvider } from "../../context/subscription-context";
import type { EffectiveAccessResponse } from "../../lib/subscription/types";

export function SubscriptionBootstrap({
  children,
  accountId,
  authenticated,
  initialAccess,
}: {
  children: ReactNode;
  accountId?: string | null;
  authenticated?: boolean;
  initialAccess?: EffectiveAccessResponse | null;
}) {
  return (
    <SubscriptionProvider
      accountId={accountId}
      authenticated={authenticated}
      initialAccess={initialAccess}
    >
      {children}
    </SubscriptionProvider>
  );
}
