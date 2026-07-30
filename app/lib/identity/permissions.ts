import type {
  IdentityPermissionAction,
  IdentityPermissionContext,
} from "./types";

const ALL_IDENTITY_ACTIONS: readonly IdentityPermissionAction[] = [
  "credential.read",
  "credential.issue",
  "credential.suspend",
  "credential.revoke",
  "device.manage",
  "accessPoint.manage",
  "activity.read",
  "activity.capture",
  "card.issue",
  "card.print",
  "pickup.authorize",
  "pickup.release",
  "visitor.manage",
  "transport.manage",
  "transport.capture",
  "emergency.manage",
  "emergency.confirm",
  "analytics.read",
];

const ROLE_PERMISSIONS: Record<string, ReadonlySet<IdentityPermissionAction>> = {
  developer: new Set(ALL_IDENTITY_ACTIONS),
  platform_team: new Set(ALL_IDENTITY_ACTIONS),
  owner: new Set(ALL_IDENTITY_ACTIONS),
  super_admin: new Set(ALL_IDENTITY_ACTIONS),
  admin: new Set(ALL_IDENTITY_ACTIONS),
  branch_admin: new Set(ALL_IDENTITY_ACTIONS),
  accountant: new Set([
    "credential.read",
    "activity.read",
    "analytics.read",
  ]),
  teacher: new Set([
    "credential.read",
    "activity.read",
    "activity.capture",
    "pickup.release",
    "transport.capture",
    "emergency.confirm",
  ]),
  student: new Set([
    "credential.read",
    "activity.read",
  ]),
  parent: new Set([
    "credential.read",
    "activity.read",
  ]),
};

function normalizeRole(role: string): string {
  const normalized = role.trim().toLowerCase().replace(/-/g, "_");
  if (normalized === "school_admin") return "admin";
  if (normalized === "school_owner") return "owner";
  return normalized;
}

export function canIdentity(
  context: IdentityPermissionContext,
  action: IdentityPermissionAction,
): boolean {
  return Boolean(
    ROLE_PERMISSIONS[normalizeRole(String(context.role || ""))]?.has(action),
  );
}

export function assertIdentityPermission(
  context: IdentityPermissionContext,
  action: IdentityPermissionAction,
): void {
  if (!canIdentity(context, action)) {
    throw new Error(`Role "${context.role}" cannot perform "${action}".`);
  }
}
