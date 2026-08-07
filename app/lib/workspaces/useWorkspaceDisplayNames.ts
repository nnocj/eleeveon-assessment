"use client";

/**
 * app/lib/workspaces/useWorkspaceDisplayNames.ts
 * --------------------------------------------------------------------------
 * Resolves readable workspace names and browser-ready profile image URLs.
 * Raw media IDs are resolved through mediaAssets/mediaBlobs before reaching
 * <img src>.
 */

import { useEffect, useMemo, useState } from "react";

import { db } from "../db/db";
import type { UserMembership } from "../auth/roleRedirect";

import {
  getMediaObjectUrl,
  getOwnerFieldMediaAsset,
  revokeMediaObjectUrl,
} from "../media/mediaAssetUtils";

import { useDataRevision } from "../../hooks/useDataRevision";

export interface WorkspaceDisplayIdentity {
  schoolName?: string | null;
  branchName?: string | null;
  profileName?: string | null;
  profileImage?: string | null;
}

export type WorkspaceDisplayIdentityMap = Map<
  string,
  WorkspaceDisplayIdentity
>;

type PersonTable = "teachers" | "students" | "parents" | "appUsers";

type PersonSource = {
  row: Record<string, unknown> | null;
  ownerTable: PersonTable;
  ownerId: string;
};

function idOf(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function isImageUrl(value?: string | null) {
  if (!value) return false;

  return (
    value.startsWith("blob:") ||
    value.startsWith("data:image/") ||
    value.startsWith("https://") ||
    value.startsWith("http://") ||
    value.startsWith("/")
  );
}

export function workspaceIdentityKey(
  membership?: UserMembership | null,
) {
  if (!membership) return "";

  const anyMembership = membership as any;

  return String(
    membership.id ??
      [
        membership.role,
        membership.schoolId ?? membership.school?.id ?? "account",
        membership.branchId ??
          membership.schoolBranchId ??
          membership.branch?.id ??
          "root",
        membership.teacherId ??
          membership.studentId ??
          membership.parentId ??
          anyMembership.userId ??
          anyMembership.appUserId ??
          "portal",
      ].join(":"),
  );
}

function personName(row?: Record<string, unknown> | null) {
  if (!row) return null;

  const direct = firstText(
    row.fullName,
    row.displayName,
    row.memberName,
    row.userName,
    row.name,
  );

  if (direct) return direct;

  const joined = [
    row.firstName,
    row.middleName,
    row.lastName,
    row.surname,
  ]
    .filter((value) => typeof value === "string" && value.trim())
    .join(" ")
    .trim();

  return joined || null;
}

function directPersonImage(row?: Record<string, unknown> | null) {
  if (!row) return null;

  return firstText(
    row.resolvedProfileImageUrl,
    row.resolvedPhotoUrl,
    row.photoUrl,
    row.profilePhotoUrl,
    row.avatarUrl,
    row.imageUrl,
    row.pictureUrl,
    row.photo,
    row.profilePhoto,
    row.avatar,
    row.image,
    row.picture,
  );
}

function personMediaId(row?: Record<string, unknown> | null) {
  if (!row) return "";

  return idOf(
    row.photoMediaId ??
      row.profilePhotoMediaId ??
      row.avatarMediaId ??
      row.imageMediaId ??
      row.pictureMediaId,
  );
}

async function resolvePersonImage(
  source: PersonSource,
  generatedUrls: string[],
) {
  const { row, ownerTable, ownerId } = source;
  if (!row || !ownerId) return null;

  const direct = directPersonImage(row);
  if (direct && isImageUrl(direct)) return direct;

  try {
    const asset = await getOwnerFieldMediaAsset({
      accountId: idOf(row.accountId) || undefined,
      ownerTable,
      ownerId,
      fieldKey: "photo",
    });

    if (
      asset?.id &&
      (asset as any).isDeleted !== true &&
      (asset as any).active !== false
    ) {
      const url = await getMediaObjectUrl(String(asset.id));
      if (url) {
        if (url.startsWith("blob:")) generatedUrls.push(url);
        return url;
      }
    }
  } catch (error) {
    console.warn("[workspace identity] owner photo resolution failed", error);
  }

  const mediaId =
    personMediaId(row) ||
    (direct && !isImageUrl(direct) ? direct : "");

  if (!mediaId) return null;

  try {
    const url = await getMediaObjectUrl(mediaId);
    if (url?.startsWith("blob:")) generatedUrls.push(url);
    return url || null;
  } catch (error) {
    console.warn("[workspace identity] media-id photo resolution failed", error);
    return null;
  }
}

export function useWorkspaceDisplayNames(
  memberships: UserMembership[],
  fallbackUser?: Record<string, unknown> | null,
): WorkspaceDisplayIdentityMap {
  const dataRevision = useDataRevision();

  const signature = useMemo(
    () =>
      [
        ...memberships
          .map((membership) => {
            const anyMembership = membership as any;

            return [
              workspaceIdentityKey(membership),
              membership.schoolId ?? membership.school?.id ?? "",
              membership.branchId ??
                membership.schoolBranchId ??
                membership.branch?.id ??
                "",
              membership.teacherId ?? "",
              membership.studentId ?? "",
              membership.parentId ?? "",
              anyMembership.userId ?? anyMembership.appUserId ?? "",
            ].join("|");
          })
          .sort(),
        [
          idOf(fallbackUser?.id),
          idOf(fallbackUser?.updatedAt),
          personMediaId(fallbackUser),
          directPersonImage(fallbackUser) ?? "",
          String(dataRevision),
        ].join("|"),
      ].join("::"),
    [memberships, fallbackUser, dataRevision],
  );

  const [resolved, setResolved] =
    useState<WorkspaceDisplayIdentityMap>(new Map());

  useEffect(() => {
    let cancelled = false;
    const generatedUrls: string[] = [];

    const load = async () => {
      const schoolIds = new Set<string>();
      const branchIds = new Set<string>();
      const teacherIds = new Set<string>();
      const studentIds = new Set<string>();
      const parentIds = new Set<string>();
      const appUserIds = new Set<string>();

      for (const membership of memberships) {
        const anyMembership = membership as any;
        const schoolId = idOf(
          membership.schoolId ?? membership.school?.id,
        );
        const branchId = idOf(
          membership.branchId ??
            membership.schoolBranchId ??
            membership.branch?.id,
        );
        const teacherId = idOf(membership.teacherId);
        const studentId = idOf(membership.studentId);
        const parentId = idOf(membership.parentId);
        const appUserId = idOf(
          anyMembership.userId ??
            anyMembership.appUserId ??
            anyMembership.user?.id ??
            anyMembership.appUser?.id,
        );

        if (schoolId) schoolIds.add(schoolId);
        if (branchId) branchIds.add(branchId);
        if (teacherId) teacherIds.add(teacherId);
        if (studentId) studentIds.add(studentId);
        if (parentId) parentIds.add(parentId);
        if (appUserId) appUserIds.add(appUserId);
      }

      const fallbackUserId = idOf(fallbackUser?.id);
      if (fallbackUserId) appUserIds.add(fallbackUserId);

      const [schools, branches, teachers, students, parents, appUsers] =
        await Promise.all([
          db.schools.bulkGet([...schoolIds]),
          db.branches.bulkGet([...branchIds]),
          db.teachers.bulkGet([...teacherIds]),
          db.students.bulkGet([...studentIds]),
          db.parents.bulkGet([...parentIds]),
          (db as any).appUsers?.bulkGet?.([...appUserIds]) ?? [],
        ]);

      const byId = (rows: any[]) =>
        new Map(
          rows
            .filter(Boolean)
            .map((row) => [idOf(row.id), row]),
        );

      const schoolById = byId(schools);
      const branchById = byId(branches);
      const teacherById = byId(teachers);
      const studentById = byId(students);
      const parentById = byId(parents);
      const appUserById = byId(appUsers);

      const next = new Map<string, WorkspaceDisplayIdentity>();

      for (const membership of memberships) {
        const anyMembership = membership as any;
        const schoolId = idOf(
          membership.schoolId ?? membership.school?.id,
        );
        const branchId = idOf(
          membership.branchId ??
            membership.schoolBranchId ??
            membership.branch?.id,
        );
        const teacherId = idOf(membership.teacherId);
        const studentId = idOf(membership.studentId);
        const parentId = idOf(membership.parentId);
        const appUserId = idOf(
          anyMembership.userId ??
            anyMembership.appUserId ??
            anyMembership.user?.id ??
            anyMembership.appUser?.id ??
            fallbackUser?.id,
        );

        let profile: PersonSource;

        if (teacherId) {
          profile = {
            row: teacherById.get(teacherId) ?? anyMembership.teacher ?? null,
            ownerTable: "teachers",
            ownerId: teacherId,
          };
        } else if (studentId) {
          profile = {
            row: studentById.get(studentId) ?? anyMembership.student ?? null,
            ownerTable: "students",
            ownerId: studentId,
          };
        } else if (parentId) {
          profile = {
            row: parentById.get(parentId) ?? anyMembership.parent ?? null,
            ownerTable: "parents",
            ownerId: parentId,
          };
        } else {
          const appUser =
            appUserById.get(appUserId) ??
            anyMembership.user ??
            anyMembership.appUser ??
            fallbackUser ??
            null;

          profile = {
            row: appUser,
            ownerTable: "appUsers",
            ownerId: appUserId || idOf((appUser as any)?.id),
          };
        }

        const profileImage = await resolvePersonImage(
          profile,
          generatedUrls,
        );

        if (cancelled) return;

        next.set(workspaceIdentityKey(membership), {
          schoolName: firstText(
            (membership as any).school?.name,
            schoolById.get(schoolId)?.name,
          ),
          branchName: firstText(
            (membership as any).branch?.name,
            branchById.get(branchId)?.name,
          ),
          profileName: personName(profile.row),
          profileImage,
        });
      }

      if (!cancelled) setResolved(next);
    };

    void load();

    return () => {
      cancelled = true;
      for (const url of generatedUrls) revokeMediaObjectUrl(url);
    };
  }, [signature, memberships, fallbackUser]);

  return resolved;
}

export function workspaceScopeLabel(
  membership: UserMembership,
  identities: WorkspaceDisplayIdentityMap,
) {
  const identity = identities.get(workspaceIdentityKey(membership));

  if (!membership.schoolId && !membership.branchId) return "Account level";

  if (identity?.schoolName && identity?.branchName) {
    return `${identity.schoolName} · ${identity.branchName}`;
  }

  if (identity?.branchName) return identity.branchName;
  if (identity?.schoolName) return identity.schoolName;

  if (membership.schoolId && membership.branchId) {
    return "School branch workspace";
  }

  return membership.schoolId ? "School workspace" : "Branch workspace";
}

export function workspaceDetailLabel(
  membership: UserMembership,
  identities: WorkspaceDisplayIdentityMap,
) {
  const identity = identities.get(workspaceIdentityKey(membership));

  if (identity?.profileName) {
    if (membership.teacherId) return `Teacher · ${identity.profileName}`;
    if (membership.studentId) return `Student · ${identity.profileName}`;
    if (membership.parentId) return `Parent · ${identity.profileName}`;
  }

  if (membership.teacherId) return "Teacher workspace";
  if (membership.studentId) return "Student workspace";
  if (membership.parentId) return "Parent workspace";

  return "Workspace access";
}

export function workspaceProfileImage(
  membership: UserMembership | null | undefined,
  identities: WorkspaceDisplayIdentityMap,
) {
  if (!membership) return null;
  return identities.get(workspaceIdentityKey(membership))?.profileImage ?? null;
}