My recommendation for the next implementation order

Now that the database is stable, I would avoid jumping straight into the UI. Instead, build the runtime foundation in this order:

Phase 1 — Entitlement Engine ⭐⭐⭐⭐⭐
src/entitlements/

EntitlementResolver
EntitlementService
PolicyService
ResourceLimitGuard
FeatureGuard
UsageService

This becomes the single source of truth for permissions and limits.

Phase 2 — Subscription Engine
Billing

Subscription calculator
Renewals
Proration
Private offers
Pricing overrides
Phase 3 — Offline Licence Engine
Perpetual licences

Activation
Device validation
Offline grace
Version locking
Upgrade offers
Phase 4 — Sync Policy
Full Sync

Hybrid Sync

Offline

Developer

Read-only

This is where runSync() begins respecting the entitlement instead of assuming every account syncs the same way.

Phase 5 — Frontend Context
SubscriptionContext

useAccess()

FeatureUnavailableDialog

QuotaReachedDialog

Every screen simply asks:

const access = useAccess();

if (!access.can("attendance")) {
    ...
}

instead of checking plans or subscription state.

After that, I would move to the assessment hierarchy and then the intelligent scheduling engine, because those are the two largest functional upgrades remaining. They can then be built on top of the stable commercial and entitlement foundation you've just completed.