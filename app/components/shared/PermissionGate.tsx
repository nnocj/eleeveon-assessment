import type { ReactNode } from "react";

export type PermissionRequirement =
  | string
  | readonly string[]
  | ((permissions: ReadonlySet<string>) => boolean);

export interface PermissionGateProps {
  permissions?: Iterable<string> | null;
  require?: PermissionRequirement;
  mode?: "all" | "any";
  allowed?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

function toPermissionSet(
  permissions?: Iterable<string> | null,
): ReadonlySet<string> {
  return new Set(permissions ?? []);
}

export function hasRequiredPermissions(
  permissions: Iterable<string> | null | undefined,
  requirement: PermissionRequirement | undefined,
  mode: "all" | "any" = "all",
): boolean {
  if (!requirement) return true;

  const permissionSet = toPermissionSet(permissions);

  if (typeof requirement === "function") {
    return requirement(permissionSet);
  }

  const required =
    typeof requirement === "string"
      ? [requirement]
      : [...requirement];

  if (required.length === 0) return true;

  return mode === "any"
    ? required.some((permission) => permissionSet.has(permission))
    : required.every((permission) => permissionSet.has(permission));
}

export function PermissionGate({
  permissions,
  require,
  mode = "all",
  allowed,
  fallback = null,
  children,
}: PermissionGateProps) {
  const canAccess =
    allowed ??
    hasRequiredPermissions(permissions, require, mode);

  return <>{canAccess ? children : fallback}</>;
}

export default PermissionGate;
