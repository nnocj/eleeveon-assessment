"use client";

import {
  useEffect,
  useState,
} from "react";

import type {
  UserMembership,
} from "../../../lib/auth/roleRedirect";

import type {
  WorkspaceDisplayIdentityMap,
} from "../../../lib/workspaces/useWorkspaceDisplayNames";

import {
  workspaceDetailLabel,
  workspaceScopeLabel,
} from "../../../lib/workspaces/useWorkspaceDisplayNames";

import {
  Button,
} from "../../ui";

import {
  BrandGlow,
  BrandPattern,
  BrandTexture,
} from "../../branding";

import AccountSection from "./AccountSection";
import QuickWorkspaceSwitcher from "./QuickWorkspaceSwitcher";
import WorkspaceStatusBadge from "./WorkspaceStatusBadge";

import {
  SchoolIcon,
  SettingsIcon,
  SyncIcon,
  WorkspaceIcon,
} from "../../icons";

export interface AccountWorkspaceDrawerProps {
  open: boolean;
  memberName: string;
  memberRole: string;
  memberImage?: string | null;
  selectedMembership?: UserMembership | null;
  memberships: UserMembership[];
  identities: WorkspaceDisplayIdentityMap;
  switchingMembershipId?: string | null;
  schoolId?: string | null;
  branchId?: string | null;

  schools?: Array<{
    id: string;
    name: string;
  }>;

  branches?: Array<{
    id: string;
    name: string;
  }>;

  lockedContext?: boolean;
  online: boolean;
  realtimeConnected: boolean;

  membershipKey(
    membership: UserMembership,
  ): string;

  sameMembership(
    left: UserMembership,
    right?: UserMembership | null,
  ): boolean;

  roleLabel(role: string): string;
  roleIcon(role: string): string;

  onClose(): void;

  onSwitchMembership(
    membership: UserMembership,
  ): void;

  onSchoolChange(
    schoolId: string | null,
  ): void;

  onBranchChange(
    branchId: string | null,
  ): void;

  onOpenStatus(): void;
  onSelectRole(): void;
  onLogout(): void;
}


function initials(
  name: string,
) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (part) =>
        part[0] ?? "",
    )
    .join("")
    .toUpperCase();
}

function DrawerProfileImage({
  src,
  name,
  active = false,
  className = "",
}: {
  src?: string | null;
  name: string;
  active?: boolean;
  className?: string;
}) {
  const [
    failed,
    setFailed,
  ] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImage =
    Boolean(src) &&
    !failed;

  return (
    <span
      className={[
        "drawer-profile-image",
        active && "active",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={`${name} profile image`}
    >
      {showImage ? (
        <img
          src={src || ""}
          alt=""
          onError={() =>
            setFailed(true)
          }
        />
      ) : (
        <span
          className="drawer-profile-fallback"
          aria-hidden="true"
        >
          {initials(name)}
        </span>
      )}

      {active ? (
        <span
          className="drawer-profile-status"
          aria-label="Current workspace"
        />
      ) : null}
    </span>
  );
}

export default function AccountWorkspaceDrawer({
  open,
  memberName,
  memberRole,
  memberImage,
  selectedMembership,
  memberships,
  identities,
  switchingMembershipId,
  schoolId,
  branchId,
  schools = [],
  branches = [],
  lockedContext = false,
  online,
  realtimeConnected,
  membershipKey,
  sameMembership,
  roleLabel,
  roleIcon,
  onClose,
  onSwitchMembership,
  onSchoolChange,
  onBranchChange,
  onOpenStatus,
  onSelectRole,
  onLogout,
}: AccountWorkspaceDrawerProps) {
  const currentScope =
    selectedMembership
      ? workspaceScopeLabel(
          selectedMembership,
          identities,
        )
      : "Account workspace";

  const currentDetail =
    selectedMembership
      ? workspaceDetailLabel(
          selectedMembership,
          identities,
        )
      : "Workspace access";

  return (
    <aside
      className={[
        "context-drawer",
        "account-drawer",
        "shell-account-drawer",
        "compact-account-drawer",
        "eds-drawer-surface",
        "eds-account-drawer-surface",
        open && "open",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden={!open}
    >
      <BrandGlow
        placement="top-right"
        size="16rem"
        opacity={0.07}
      />

      <BrandPattern
        variant="network"
        opacity={0.018}
      />

      <BrandTexture
        texture="grain"
        intensity={0.4}
        decorative
        className="shell-drawer-texture"
      />

      <div className="shell-drawer-inner compact-drawer-inner">
        <header className="account-drawer-head compact-drawer-head">
          <div className="account-drawer-identity compact-drawer-identity">
            <DrawerProfileImage
              src={memberImage}
              name={memberName}
              className="drawer-account-photo"
            />

            <span>
              <strong>
                {memberName}
              </strong>
              <small>
                {memberRole}
              </small>
            </span>
          </div>

          <button
            className="icon-btn compact-drawer-close"
            onClick={onClose}
            type="button"
            aria-label="Close account menu"
          >
            ✕
          </button>
        </header>

        <section className="compact-current-access">
          <DrawerProfileImage
            src={memberImage}
            name={memberName}
            active
            className="compact-current-access-photo"
          />

          <span className="compact-current-access-copy">
            <small>
              Current access
            </small>
            <strong title={currentScope}>
              {currentScope}
            </strong>
            <em title={currentDetail}>
              {currentDetail}
            </em>
          </span>

          <WorkspaceStatusBadge
            online={online}
            realtimeConnected={
              realtimeConnected
            }
          />
        </section>

        {memberships.length > 1 ? (
          <AccountSection
            title="Workspaces"
            meta={`${memberships.length}`}
            className="compact-workspaces-section"
          >
            <QuickWorkspaceSwitcher
              memberships={memberships}
              selectedMembership={
                selectedMembership
              }
              identities={identities}
              switchingMembershipId={
                switchingMembershipId
              }
              membershipKey={
                membershipKey
              }
              sameMembership={
                sameMembership
              }
              roleLabel={roleLabel}
              roleIcon={roleIcon}
              onSwitchMembership={
                onSwitchMembership
              }
            />
          </AccountSection>
        ) : null}

        {!lockedContext ? (
          <AccountSection
            title="School context"
            className="compact-context-section"
          >
            <div className="compact-context-grid">
              <label className="account-context-field">
                <span>
                  <SchoolIcon size="sm" />
                  School
                </span>

                <select
                  value={schoolId ?? ""}
                  onChange={(event) =>
                    onSchoolChange(
                      event.target.value ||
                        null,
                    )
                  }
                  disabled={!schools.length}
                >
                  <option value="">
                    {schools.length
                      ? "Select school"
                      : "No school found"}
                  </option>

                  {schools.map(
                    (school) => (
                      <option
                        key={school.id}
                        value={school.id}
                      >
                        {school.name}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="account-context-field">
                <span>
                  <WorkspaceIcon size="sm" />
                  Branch
                </span>

                <select
                  value={branchId ?? ""}
                  onChange={(event) =>
                    onBranchChange(
                      event.target.value ||
                        null,
                    )
                  }
                  disabled={
                    !schoolId ||
                    !branches.length
                  }
                >
                  <option value="">
                    {!schoolId
                      ? "Select school first"
                      : branches.length
                        ? "Select branch"
                        : "No branch found"}
                  </option>

                  {branches.map(
                    (branch) => (
                      <option
                        key={branch.id}
                        value={branch.id}
                      >
                        {branch.name}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>
          </AccountSection>
        ) : null}

        <AccountSection
          title="System and access"
          className="compact-actions-section"
        >
          <section className="compact-account-actions">
            <button
              type="button"
              onClick={onOpenStatus}
            >
              <span className="compact-action-icon">
                <SyncIcon size="sm" />
              </span>

              <span>
                <strong>
                  System status
                </strong>
                <small>
                  Connection and sync
                </small>
              </span>

              <b aria-hidden="true">
                ›
              </b>
            </button>

            <button
              type="button"
              onClick={onSelectRole}
            >
              <span className="compact-action-icon">
                <SettingsIcon size="sm" />
              </span>

              <span>
                <strong>
                  Select role
                </strong>
                <small>
                  All access points
                </small>
              </span>

              <b aria-hidden="true">
                ›
              </b>
            </button>
          </section>
        </AccountSection>

        <Button
          variant="danger"
          fullWidth
          onClick={onLogout}
          className="account-logout compact-account-logout"
        >
          Logout
        </Button>
      </div>
    </aside>
  );
}
