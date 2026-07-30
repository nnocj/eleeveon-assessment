"use client";

/**
 * app/branch-admin/modules/Parents.tsx
 * ---------------------------------------------------------
 * Eleeveon Parents V3.
 * Branch-scoped, offline-first, mobile-first, syncUtils powered.
 *
 * Workspace-session aligned:
 * - reads the selected workspace session written by /select-role first
 * - falls back to ActiveMembershipProvider, then ActiveBranchContext/settings
 * - prevents this branch-admin module from accidentally using stale school/branch
 *   context left behind by another role or portal
 * - all create/update/media/query operations now use the resolved workspace
 *   schoolId and branchId
 *
 * Golden-standard upgrade:
 * - UI follows the compact Schools/Students golden pattern: search + add + filter + more.
 * - No large hero/header block and no dedicated summary strip on the main screen.
 * - Filters, views, actions, and parent-student linking stay in focused sheets/modals.
 * - Card/list view now uses the exact compact Students.tsx student-row sizing, spacing, and desktop grid density.
 * - Cards, table, and analytics are preserved under the More menu.
 * - Styling uses ba-* theme variables so dark mode/system theme can continue working.
 *
 * Data behavior intentionally preserved and upgraded:
 * - createLocal(...) for parent creation and parent-student linking.
 * - updateLocal(...) for parent edits and primary-link updates.
 * - softDeleteLocal(...) for parent delete and unlink.
 * - listActiveLocal(...) for active student lookup.
 * - Reads/writes stay scoped by accountId + schoolId + branchId.
 *
 * Media behavior rebuilt to match the working Teachers.tsx pattern:
 * - selected or camera-captured images are compressed and stored once in mediaAssets/mediaBlobs.
 * - parent records save small media IDs instead of full Base64 image strings.
 * - old photo/coverPhoto fields remain backward-compatible fallbacks only.
 * - ownerTempKey isolates unsaved form uploads so one parent image cannot bleed into students/teachers/classes or another parent.
 * - new uploads are attached to the parent after create/update so media can sync separately.
 * - edit saves attach only media uploaded during the current edit session; old inherited media IDs are not reattached.
 * - photo and cover fields support Upload and real Take Photo camera capture through the same saveImageAsset(...) pipeline.
 * - media owner/session keys use shared mediaAssetUtils helpers so this page cannot save under student/teacher ownership.
 *
 * Parent map and location workflow:
 * - adds the shared SchoolMap view used by Students and Teachers.
 * - stores editable address, coordinates, accuracy, source, precision and privacy/consent fields.
 * - supports creating a parent from a selected map location.
 * - supports moving an existing parent marker through the shared floating Save/Cancel workflow.
 * - maps only branch-scoped, searched and filtered parents with visible coordinates.
 * - lets SchoolMap own marker selection, details, clustering and location editing.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useSettings } from "../../context/settings-context";
import {
  db,
  type Parent,
  type Student,
  type StudentParent,
} from "../../lib/db/db";
import {
  createLocal,
  updateLocal,
  softDeleteLocal,
  listActiveLocal,
} from "../../lib/sync/syncUtils";
import {
  softDeleteOwnerFieldAssets,
  attachCameraStreamToVideo,
  commitMediaAssetsToOwner,
  captureImageFileFromVideo,
  createMediaSessionKey,
  getCameraUnavailableMessage,
  resolveOwnerMediaUrl,
  isCameraApiAvailable,
  MediaFieldKeys,
  MediaOwners,
  openCameraStream,
  revokeMediaObjectUrl,
  saveImageAsset,
  stopCameraStream,
  type CameraFacingMode,
} from "../../lib/media/mediaAssetUtils";

import { useBackgroundLoader } from "../../hooks/useBackgroundLoader";
import { useEntityMediaUrls } from "../../hooks/useEntityMediaUrls";
import { useBranchWorkspaceScope } from "../../hooks/useBranchWorkspaceScope";
import { useBranchTableRevision } from "../../hooks/useBranchTableRevision";
import {
  SchoolMap,
  type MapCreateRequest,
  type MapLocationUpdateRequest,
} from "../../components/maps";
import { genericEntityToMarker, type MapMarker } from "../../lib/maps";

type ViewMode = "cards" | "table" | "map" | "summary";
type ToastTone = "success" | "error" | "info";
type Relationship = "father" | "mother" | "guardian";
type StudentParentRelationship = "father" | "mother" | "guardian" | "other";
type CameraField = "photo" | "coverPhoto";
type UploadedMediaIds = Partial<Record<CameraField, string>>;

type ParentCreateDefaults = {
  latitude?: number;
  longitude?: number;
};

type TenantRow = {
  accountId?: string | null;
  schoolId?: string | null;
  branchId?: string | null;
  isDeleted?: boolean;
  active?: boolean;
  status?: string;
};

const OPEN_WORKSPACE_KEY = "eleeveon_open_workspace";

type OpenWorkspaceSession = {
  membership?: Record<string, any> | null;
  membershipId?: string | null;
  role?: string | null;
  schoolId?: string | null;
  branchId?: string | null;
  teacherId?: string | null;
  studentId?: string | null;
  parentId?: string | null;
  memberName?: string | null;
  fullName?: string | null;
  userName?: string | null;
  openedAt?: number;
};

function safeStorageRead(key: string) {
  if (typeof window === "undefined") return null;

  try {
    return (
      window.localStorage.getItem(key) || window.sessionStorage.getItem(key)
    );
  } catch {
    return null;
  }
}

function safeJsonRead<T>(key: string): T | null {
  const raw = safeStorageRead(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readOpenWorkspaceSession() {
  return safeJsonRead<OpenWorkspaceSession>(OPEN_WORKSPACE_KEY);
}

function readStoredActiveMembership() {
  return safeJsonRead<Record<string, any>>("activeMembership");
}

function firstLocalId(...values: unknown[]): string {
  for (const value of values) {
    const parsed = idOf(value);
    if (parsed) return parsed;
  }

  return "";
}

function selectedWorkspaceSchoolId(args: {
  openWorkspace?: OpenWorkspaceSession | null;
  activeMembership?: Record<string, any> | null;
  activeSchoolId?: unknown;
  activeSchool?: Record<string, any> | null;
  settings?: Record<string, any> | null;
}) {
  const storedMembership = readStoredActiveMembership();
  const membership =
    args.openWorkspace?.membership ||
    args.activeMembership ||
    storedMembership ||
    null;

  return firstLocalId(
    args.openWorkspace?.schoolId,
    membership?.schoolId,
    membership?.school?.id,
    args.activeSchoolId,
    args.activeSchool?.id,
    args.settings?.schoolId,
    safeStorageRead("activeSchoolId"),
  );
}

function selectedWorkspaceBranchId(args: {
  openWorkspace?: OpenWorkspaceSession | null;
  activeMembership?: Record<string, any> | null;
  activeBranchId?: unknown;
  activeBranch?: Record<string, any> | null;
  settings?: Record<string, any> | null;
}) {
  const storedMembership = readStoredActiveMembership();
  const membership =
    args.openWorkspace?.membership ||
    args.activeMembership ||
    storedMembership ||
    null;

  return firstLocalId(
    args.openWorkspace?.branchId,
    membership?.branchId,
    membership?.schoolBranchId,
    membership?.branch?.id,
    args.activeBranchId,
    args.activeBranch?.id,
    args.settings?.branchId,
    safeStorageRead("activeBranchId"),
  );
}

type FormState = {
  id?: string;
  fullName: string;
  phone: string;
  photo: string;
  photoMediaId?: string;
  coverPhoto: string;
  coverPhotoMediaId?: string;
  email: string;
  address: string;
  latitude: string;
  longitude: string;
  accuracyMeters: string;
  locationLabel: string;
  formattedAddress: string;
  locationType: "home" | "workplace" | "pickup_point" | "dropoff_point" | "other";
  locationSource: "manual" | "device_gps" | "geocoded" | "imported";
  locationPrecision: "exact" | "approximate" | "area_only";
  locationCapturedAt?: number;
  mapVisible: boolean;
  locationConsentGiven: boolean;
  locationConsentAt?: number;
  locationRestricted: boolean;
  occupation: string;
  emergencyContact: string;
  relationship: Relationship;
};

type LinkFormState = {
  parentId: string;
  studentId: string;
  relationship: StudentParentRelationship;
  isPrimary: boolean;
};

type ParentView = {
  id: string;
  row: Parent;
  photoUrl?: string;
  coverPhotoUrl?: string;
  linkedStudents: Student[];
  relations: StudentParent[];
  linkCount: number;
  primaryChildren: number;
};

const emptyForm: FormState = {
  fullName: "",
  phone: "",
  photo: "",
  photoMediaId: undefined,
  coverPhoto: "",
  coverPhotoMediaId: undefined,
  email: "",
  address: "",
  latitude: "",
  longitude: "",
  accuracyMeters: "",
  locationLabel: "",
  formattedAddress: "",
  locationType: "home",
  locationSource: "manual",
  locationPrecision: "exact",
  locationCapturedAt: undefined,
  mapVisible: true,
  locationConsentGiven: false,
  locationConsentAt: undefined,
  locationRestricted: false,
  occupation: "",
  emergencyContact: "",
  relationship: "guardian",
};

const emptyLinkForm: LinkFormState = {
  parentId: "",
  studentId: "",
  relationship: "guardian",
  isPrimary: false,
};

const PARENT_MEDIA_OWNER_TABLE = MediaOwners.PARENTS;
const PARENT_MEDIA_ENTITY_LABEL = "Parent";

const idOf = (value: any): string => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const cleanId = (value: unknown): string => {
  const normalized = idOf(value);
  return normalized && normalized !== "0" ? normalized : "";
};

/**
 * Resolve the permanent parent ID returned by createLocal/updateLocal.
 * The sync helpers may return a string, number, saved record, or object.
 */
const savedEntityId = (
  result: unknown,
  fallback?: unknown,
): string => {
  if (typeof result === "string" || typeof result === "number") {
    return cleanId(result);
  }

  if (result && typeof result === "object") {
    const record = result as Record<string, unknown>;

    return firstLocalId(
      record.id,
      record.localId,
      record.parentId,
      fallback,
    );
  }

  return cleanId(fallback);
};

const sameId = (a: any, b: any) => String(a ?? "") === String(b ?? "");
const safeLower = (value: any) =>
  String(value || "")
    .toLowerCase()
    .trim();
const tableSafe = (name: string) => (db as any)[name];
const mediaKey = (parentId: string, field: CameraField) =>
  `${PARENT_MEDIA_OWNER_TABLE}:${parentId}:${field}`;

const isActiveStudent = (row: any) =>
  !row?.isDeleted &&
  row?.active !== false &&
  !["withdrawn", "deleted", "archived", "inactive"].includes(
    safeLower(row?.status),
  );

const relationshipLabel = (value?: string) => {
  if (!value) return "Guardian";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const relationshipTone = (
  value?: string,
): "green" | "blue" | "purple" | "orange" => {
  if (value === "father") return "blue";
  if (value === "mother") return "purple";
  if (value === "other") return "orange";
  return "green";
};

const timeText = (value?: string | number | null) => {
  if (!value) return "Not set";
  const time = typeof value === "number" ? value : new Date(value).getTime();
  if (!Number.isFinite(time)) return "Not set";

  try {
    return new Intl.DateTimeFormat("en-GH", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(new Date(time));
  } catch {
    return "Not set";
  }
};

const safeRecordMediaValue = (value?: string) => {
  const media = String(value || "");
  if (!media) return undefined;
  if (media.startsWith("blob:")) return undefined;
  if (media.startsWith("data:image/")) return undefined;
  return media;
};

function Chip({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "green" | "red" | "blue" | "gray" | "orange" | "purple";
}) {
  return <span className={`ba-chip ${tone}`}>{children}</span>;
}

function getReadableTextColor(color: string) {
  const value = String(color || "").trim();

  if (!value.startsWith("#")) {
    return "#fff";
  }

  let hex = value.slice(1);

  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((character) => character + character)
      .join("");
  }

  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    return "#fff";
  }

  const numeric = Number.parseInt(hex, 16);
  const red = (numeric >> 16) & 255;
  const green = (numeric >> 8) & 255;
  const blue = numeric & 255;
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

  return brightness > 155 ? "#111827" : "#ffffff";
}

function Avatar({
  name,
  photo,
  primary,
}: {
  name: string;
  photo?: string;
  primary: string;
}) {
  return (
    <div
      className="ba-avatar"
      style={{
        background: photo ? `url(${photo}) center/cover` : primary,
        color: photo ? "#ffffff" : getReadableTextColor(primary),
        borderColor: photo
          ? "transparent"
          : `color-mix(in srgb, ${primary} 76%, transparent)`,
      }}
    >
      {!photo &&
        String(name || "P")
          .slice(0, 1)
          .toUpperCase()}
    </div>
  );
}

function Empty({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <section className="ba-empty">
      <div className="ba-empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </section>
  );
}

export default function ParentsPage() {
  const dataRevision = useBranchTableRevision([
    "parents",
    "students",
    "studentParents",
    "mediaAssets",
    "mediaBlobs",
  ]);
  const router = useRouter();
  const { settings, loading: settingsLoading } = useSettings();
  const workspace = useBranchWorkspaceScope();
  const {
    accountId,
    schoolId,
    branchId,
    membership: activeMembership,
    authenticated,
    restoring: accountLoading,
    branchLoading: contextLoading,
    ready: workspaceReady,
    error: workspaceError,
  } = workspace;

  const primary = settings?.primaryColor || "var(--primary-color, #2563eb)";
  const primaryText = getReadableTextColor(primary);

  const { loading, setLoading } = useBackgroundLoader();
  const [saving, setSaving] = useState(false);
  const [linkSaving, setLinkSaving] = useState(false);

  const [rows, setRows] = useState<Parent[]>([]);
  const resolvedMediaById = useEntityMediaUrls({
    accountId,
    ownerTable: "parents",
    rows: rows,
    fields: [
      { fieldKey: "photo", mediaIdKey: "photoMediaId" },
      { fieldKey: "coverPhoto", mediaIdKey: "coverPhotoMediaId" },
    ],
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [studentParents, setStudentParents] = useState<StudentParent[]>([]);
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<
    Record<string, string>
  >({});

  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [search, setSearch] = useState("");
  const [filterRelationship, setFilterRelationship] = useState<
    "all" | Relationship
  >("all");
  const [filterLinked, setFilterLinked] = useState<
    "all" | "linked" | "unlinked" | "primary"
  >("all");

  const [filterOpen, setFilterOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ParentView | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [linkForm, setLinkForm] = useState<LinkFormState>(emptyLinkForm);
  const [toast, setToast] = useState<{
    tone: ToastTone;
    message: string;
  } | null>(null);

  const mediaSessionKeyRef = useRef(
    createMediaSessionKey(PARENT_MEDIA_OWNER_TABLE),
  );
  const uploadedMediaIdsRef = useRef<UploadedMediaIds>({});
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraField, setCameraField] = useState<CameraField>("photo");
  const [cameraFacing, setCameraFacing] =
    useState<CameraFacingMode>("environment");
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraCapturing, setCameraCapturing] = useState(false);

  useEffect(() => {
    if (accountLoading || contextLoading) return;

    if (!authenticated || !accountId) {
      router.replace("/login");
      return;
    }

    if (!schoolId || !branchId) {
      router.replace("/account");
    }
  }, [
    accountLoading,
    contextLoading,
    authenticated,
    accountId,
    schoolId,
    branchId,
    router,
  ]);

  const sameTenant = (row: TenantRow) =>
    (!row.accountId || row.accountId === accountId) &&
    (!row.schoolId || sameId(row.schoolId, schoolId)) &&
    (!row.branchId || sameId(row.branchId, branchId)) &&
    !row.isDeleted;

  const showToast = (tone: ToastTone, message: string) => {
    setToast({ tone, message });
    window.setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 4200);
  };

  const updateForm = (patch: Partial<FormState>) =>
    setForm((current) => ({ ...current, ...patch }));
  const updateLinkForm = (patch: Partial<LinkFormState>) =>
    setLinkForm((current) => ({ ...current, ...patch }));

  const stopCurrentCamera = () => {
    stopCameraStream(cameraStreamRef.current);
    cameraStreamRef.current = null;

    if (cameraVideoRef.current) cameraVideoRef.current.srcObject = null;
  };

  const requireTenant = () => {
    if (!authenticated || !accountId || !schoolId || !branchId) {
      showToast("error", "Sign in and select a school branch first.");
      return false;
    }

    return true;
  };

  const openCameraForField = (field: CameraField) => {
    if (!requireTenant()) return;

    if (!isCameraApiAvailable()) {
      showToast("error", getCameraUnavailableMessage());
      return;
    }

    setCameraField(field);
    setCameraOpen(true);
  };

  const closeCamera = () => {
    stopCurrentCamera();
    setCameraOpen(false);
    setCameraCapturing(false);
    setCameraStarting(false);
  };

  const clearData = () => {
    Object.values(mediaPreviewUrls).forEach(revokeMediaObjectUrl);
    setRows([]);
    setStudents([]);
    setStudentParents([]);
    setMediaPreviewUrls({});
  };

  const resolveParentMediaUrls = async (parentRows: Parent[]) => {
    const next: Record<string, string> = {};

    await Promise.all(
      parentRows.map(async (parent: any) => {
        const parentId = idOf(parent.id);
        if (!parentId) return;

        try {
          const photoUrl = await resolveOwnerMediaUrl({
            accountId: accountId || undefined,
            ownerTable: PARENT_MEDIA_OWNER_TABLE,
            ownerId: parentId,

            fieldKey: MediaFieldKeys.PHOTO,
            fallbackAssetId: parent.photoMediaId,
          });
          if (photoUrl) next[mediaKey(parentId, "photo")] = photoUrl;

          const coverPhotoUrl = await resolveOwnerMediaUrl({
            accountId: accountId || undefined,
            ownerTable: PARENT_MEDIA_OWNER_TABLE,
            ownerId: parentId,

            fieldKey: MediaFieldKeys.COVER_PHOTO,
            fallbackAssetId: parent.coverPhotoMediaId,
          });
          if (coverPhotoUrl)
            next[mediaKey(parentId, "coverPhoto")] = coverPhotoUrl;
        } catch (error) {
          console.error("Failed resolving parent media:", parentId, error);
        }
      }),
    );

    // Match Teachers.tsx: do not revoke list preview URLs during a reload.
    // Replacing the map is enough and avoids browser repaint bleed while
    // parent rows and edit modals are still mounted.
    setMediaPreviewUrls(next);
  };

  const load = async () => {
    if (!authenticated || !accountId || !schoolId || !branchId) {
      clearData();
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [parentRows, studentRows, relationRows] = await Promise.all([
        tableSafe("parents")?.toArray?.() || [],
        listActiveLocal("students", {
          accountId,
          schoolId: schoolId,
          branchId: branchId,
        } as any),
        tableSafe("studentParents")?.toArray?.() || [],
      ]);

      const scopedParents = (parentRows as Parent[])
        .filter((row) => sameTenant(row as TenantRow))
        .sort((a: any, b: any) =>
          String(a.fullName || "").localeCompare(String(b.fullName || "")),
        );

      setRows(scopedParents);
      await resolveParentMediaUrls(scopedParents);

      setStudents(
        (studentRows as Student[])
          .filter((row: any) => isActiveStudent(row))
          .sort((a: any, b: any) =>
            String(a.fullName || "").localeCompare(String(b.fullName || "")),
          ),
      );

      setStudentParents(
        (relationRows as StudentParent[]).filter((row) =>
          sameTenant(row as TenantRow),
        ),
      );
    } catch (error) {
      console.error("Failed to load parents:", error);
      clearData();
      showToast("error", "Failed to load parents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountLoading || settingsLoading || contextLoading) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authenticated,
    accountId,
    schoolId,
    branchId,
    accountLoading,
    settingsLoading,
    contextLoading,
    dataRevision,
  ]);

  useEffect(() => {
    return () => {
      Object.values(mediaPreviewUrls).forEach(revokeMediaObjectUrl);
      stopCurrentCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaPreviewUrls]);

  useEffect(() => {
    if (!cameraOpen) return;

    let cancelled = false;

    const startCamera = async () => {
      try {
        setCameraStarting(true);
        stopCurrentCamera();

        const stream = await openCameraStream({
          facingMode: cameraFacing,
          width: 1280,
          height: 720,
        });

        if (cancelled) {
          stopCameraStream(stream);
          return;
        }

        cameraStreamRef.current = stream;

        if (cameraVideoRef.current) {
          await attachCameraStreamToVideo(cameraVideoRef.current, stream);
        }
      } catch (error: any) {
        console.error("Failed to open parent camera:", error);
        showToast("error", error?.message || getCameraUnavailableMessage());
        setCameraOpen(false);
      } finally {
        if (!cancelled) setCameraStarting(false);
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      stopCurrentCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOpen, cameraFacing]);

  const handleImageUpload = async (field: CameraField, file?: File) => {
    if (!file) return;

    if (!authenticated || !accountId || !schoolId || !branchId) {
      showToast("error", "Sign in and select a school branch first.");
      return;
    }

    try {
      const result = await saveImageAsset(file, {
        accountId,
        schoolId: schoolId,
        branchId: branchId,
        ownerTable: PARENT_MEDIA_OWNER_TABLE,

        /*
         * Always stage under the current form session. This preserves the
         * existing committed parent media until Save, including during edits.
         */
        ownerId: undefined,
        ownerTempKey: mediaSessionKeyRef.current,
        fieldKey:
          field === "photo" ? MediaFieldKeys.PHOTO : MediaFieldKeys.COVER_PHOTO,
        variant: field === "photo" ? "avatar" : "cover",
        replaceExisting: true,
      });

      const uploadedAssetId = cleanId(result.assetId);

      if (!uploadedAssetId) {
        throw new Error(
          "The image was processed but no media asset ID was created.",
        );
      }

      uploadedMediaIdsRef.current = {
        ...uploadedMediaIdsRef.current,
        [field]: uploadedAssetId,
      };

      updateForm({
        [field]: result.previewUrl,
        [`${field}MediaId`]: uploadedAssetId,
      } as Partial<FormState>);

      showToast(
        "success",
        field === "photo"
          ? "Parent photo optimized."
          : "Cover photo optimized.",
      );
    } catch (error: any) {
      console.error("Failed to process parent image:", error);
      showToast("error", error?.message || "Failed to process image.");
    }
  };

  const captureCameraPhoto = async () => {
    if (!cameraVideoRef.current) {
      showToast("error", "Camera preview is not ready yet.");
      return;
    }

    try {
      setCameraCapturing(true);
      const file = await captureImageFileFromVideo(cameraVideoRef.current, {
        fileName: `${cameraField}-${Date.now()}.jpg`,
        mimeType: "image/jpeg",
        quality: 0.88,
        maxWidth: cameraField === "photo" ? 900 : 1440,
        maxHeight: cameraField === "photo" ? 900 : 900,
      });

      await handleImageUpload(cameraField, file);
      closeCamera();
    } catch (error: any) {
      console.error("Failed to capture parent image:", error);
      showToast("error", error?.message || "Failed to capture photo.");
    } finally {
      setCameraCapturing(false);
    }
  };

  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((row: any) => map.set(idOf(row.id), row));
    return map;
  }, [students]);

  const relationByParent = useMemo(() => {
    const map = new Map<string, StudentParent[]>();

    studentParents.forEach((row: any) => {
      const parentId = idOf(row.parentId);
      if (!parentId) return;
      const list = map.get(parentId) || [];
      list.push(row);
      map.set(parentId, list);
    });

    return map;
  }, [studentParents]);

  const relationByStudent = useMemo(() => {
    const map = new Map<string, StudentParent[]>();

    studentParents.forEach((row: any) => {
      const studentId = idOf(row.studentId);
      if (!studentId) return;
      const list = map.get(studentId) || [];
      list.push(row);
      map.set(studentId, list);
    });

    return map;
  }, [studentParents]);

  const viewRows = useMemo<ParentView[]>(() => {
    return rows.map((row: any) => {
      const id = idOf(row.id);
      const relations = relationByParent.get(id) || [];
      const linkedStudents = relations
        .map((relation: any) => studentMap.get(idOf(relation.studentId)))
        .filter(Boolean) as Student[];

      return {
        id,
        row,
        photoUrl:
          resolvedMediaById[id]?.photo ||
          mediaPreviewUrls[mediaKey(id, "photo")] ||
          safeRecordMediaValue(row.photo),
        coverPhotoUrl:
          resolvedMediaById[id]?.coverPhoto ||
          mediaPreviewUrls[mediaKey(id, "coverPhoto")] ||
          safeRecordMediaValue(row.coverPhoto),
        linkedStudents,
        relations,
        linkCount: linkedStudents.length,
        primaryChildren: relations.filter((relation: any) => relation.isPrimary)
          .length,
      };
    });
  }, [
    mediaPreviewUrls,
    relationByParent,
    resolvedMediaById,
    rows,
    studentMap,
  ]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return viewRows
      .filter((item) => {
        const row: any = item.row;

        if (
          filterRelationship !== "all" &&
          row.relationship !== filterRelationship
        )
          return false;
        if (filterLinked === "linked" && item.linkCount === 0) return false;
        if (filterLinked === "unlinked" && item.linkCount > 0) return false;
        if (filterLinked === "primary" && item.primaryChildren === 0)
          return false;

        if (!query) return true;

        return `
          ${row.fullName}
          ${row.phone || ""}
          ${row.email || ""}
          ${row.address || ""}
          ${row.occupation || ""}
          ${row.emergencyContact || ""}
          ${row.relationship || ""}
          ${item.linkedStudents.map((student: any) => student.fullName).join(" ")}
        `
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) =>
        String((a.row as any).fullName || "").localeCompare(
          String((b.row as any).fullName || ""),
        ),
      );
  }, [filterLinked, filterRelationship, search, viewRows]);

  const parentMarkers = useMemo<MapMarker[]>(() => {
    return filteredRows.reduce<MapMarker[]>((markers, item) => {
      const row: any = item.row;

      const marker = genericEntityToMarker(
        {
          ...row,
          id: item.id,
          photo: item.photoUrl || row.photo,
        },
        {
          entityType: "parent",
          layerId: "parents",
          icon: "parent",
          imageUrl: item.photoUrl,
          subtitle: [
            relationshipLabel(row.relationship),
            row.phone || null,
            row.locationLabel || row.formattedAddress || row.address || null,
          ]
            .filter(Boolean)
            .join(" · "),
          privacy: {
            allowRestricted: true,
            requireConsent: false,
          },
        },
      );

      if (!marker) return markers;

      markers.push({
        ...marker,
        description: item.linkCount
          ? `${item.linkCount} linked student${item.linkCount === 1 ? "" : "s"}`
          : row.occupation || "No linked student",
        metadata: {
          ...(marker.metadata || {}),
          parentId: item.id,
          relationship: row.relationship || "guardian",
          phone: row.phone || null,
          linkedStudentCount: item.linkCount,
          primaryChildren: item.primaryChildren,
        },
      });

      return markers;
    }, []);
  }, [filteredRows]);

  const summary = useMemo(
    () => ({
      total: rows.length,
      linked: viewRows.filter((item) => item.linkCount > 0).length,
      unlinked: viewRows.filter((item) => item.linkCount === 0).length,
      studentsWithParents: relationByStudent.size,
      primaryParents: studentParents.filter((row: any) => row.isPrimary).length,
      showing: filteredRows.length,
    }),
    [
      filteredRows.length,
      relationByStudent.size,
      rows.length,
      studentParents,
      viewRows,
    ],
  );

  const activeFilterCount = useMemo(() => {
    return [filterRelationship, filterLinked].filter((value) => value !== "all")
      .length;
  }, [filterLinked, filterRelationship]);

  const countsByRelationship = useMemo(
    () =>
      groupedCounts(viewRows, (item) =>
        relationshipLabel((item.row as any).relationship),
      ),
    [viewRows],
  );

  const countsByLinkStatus = useMemo(
    () => [
      {
        label: "Linked",
        value: viewRows.filter((item) => item.linkCount > 0).length,
      },
      {
        label: "Unlinked",
        value: viewRows.filter((item) => item.linkCount === 0).length,
      },
      {
        label: "Primary Guardian",
        value: viewRows.filter((item) => item.primaryChildren > 0).length,
      },
    ],
    [viewRows],
  );

  const countsByChildren = useMemo(
    () =>
      viewRows
        .map((item) => ({
          label: (item.row as any).fullName || "Parent",
          value: item.linkCount,
        }))
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label)),
    [viewRows],
  );

  const clearFilters = () => {
    setFilterRelationship("all");
    setFilterLinked("all");
  };

  const openCreate = (defaults?: ParentCreateDefaults) => {
    if (!requireTenant()) return;

    mediaSessionKeyRef.current = createMediaSessionKey(
      PARENT_MEDIA_OWNER_TABLE,
    );
    uploadedMediaIdsRef.current = {};
    setSelectedItem(null);

    const hasMapCoordinate =
      Number.isFinite(defaults?.latitude) &&
      Number.isFinite(defaults?.longitude);

    setForm({
      ...emptyForm,
      relationship:
        filterRelationship !== "all" ? filterRelationship : "guardian",
      latitude: hasMapCoordinate ? String(defaults?.latitude) : "",
      longitude: hasMapCoordinate ? String(defaults?.longitude) : "",
      locationSource: "manual",
      locationCapturedAt: hasMapCoordinate ? Date.now() : undefined,
      mapVisible: true,
    });
    setModalOpen(true);
  };

  const handleCreateAtLocation = (request: MapCreateRequest) => {
    if (request.entityType !== "parent") return;

    openCreate({
      latitude: request.coordinate.latitude,
      longitude: request.coordinate.longitude,
    });
  };

  const handleParentLocationUpdate = async (
    request: MapLocationUpdateRequest,
  ) => {
    if (!authenticated || !accountId || !schoolId || !branchId) {
      throw new Error("Sign in and select a school branch first.");
    }

    const parentId = cleanId(
      request.marker.metadata?.parentId ||
        request.marker.id,
    );

    if (!parentId) {
      throw new Error("The selected parent could not be identified.");
    }

    const existingParent = rows.find((row: any) =>
      sameId(row.id, parentId),
    );

    if (!existingParent) {
      throw new Error("The selected parent record was not found.");
    }

    await updateLocal(
      "parents",
      parentId,
      {
        latitude: request.coordinate.latitude,
        longitude: request.coordinate.longitude,
        locationSource: "manual",
        locationCapturedAt: Date.now(),
        mapVisible: true,
        isDeleted: false,
      } as Partial<Parent>,
    );

    showToast("success", "Parent location updated.");
    await load();
  };

  const openEdit = (row: Parent) => {
    const parent: any = row;
    mediaSessionKeyRef.current = createMediaSessionKey(
      PARENT_MEDIA_OWNER_TABLE,
    );
    uploadedMediaIdsRef.current = {};
    setSelectedItem(null);

    setForm({
      id: idOf(parent.id),
      fullName: parent.fullName || "",
      phone: parent.phone || "",
      photo:
        resolvedMediaById[idOf(parent.id)]?.photo ||
        mediaPreviewUrls[mediaKey(idOf(parent.id), "photo")] ||
        "",
      photoMediaId: parent.photoMediaId
        ? String(parent.photoMediaId)
        : undefined,
      coverPhoto:
        resolvedMediaById[idOf(parent.id)]?.coverPhoto ||
        mediaPreviewUrls[mediaKey(idOf(parent.id), "coverPhoto")] ||
        "",
      coverPhotoMediaId: parent.coverPhotoMediaId
        ? String(parent.coverPhotoMediaId)
        : undefined,
      email: parent.email || "",
      address: parent.address || "",
      latitude: parent.latitude == null ? "" : String(parent.latitude),
      longitude: parent.longitude == null ? "" : String(parent.longitude),
      accuracyMeters:
        parent.accuracyMeters == null ? "" : String(parent.accuracyMeters),
      locationLabel: parent.locationLabel || "",
      formattedAddress: parent.formattedAddress || "",
      locationType: parent.locationType || "home",
      locationSource: parent.locationSource || "manual",
      locationPrecision: parent.locationPrecision || "exact",
      locationCapturedAt: parent.locationCapturedAt || undefined,
      mapVisible: parent.mapVisible !== false,
      locationConsentGiven: Boolean(parent.locationConsentGiven),
      locationConsentAt: parent.locationConsentAt || undefined,
      locationRestricted: Boolean(parent.locationRestricted),
      occupation: parent.occupation || "",
      emergencyContact: parent.emergencyContact || "",
      relationship: parent.relationship || "guardian",
    });

    setModalOpen(true);
  };

  const openLinkModal = (parent?: Parent, student?: Student) => {
    if (!requireTenant()) return;
    setSelectedItem(null);

    setLinkForm({
      parentId: parent?.id ? String(parent.id) : "",
      studentId: student?.id ? String(student.id) : "",
      relationship: ((parent as any)?.relationship ||
        "guardian") as StudentParentRelationship,
      isPrimary: false,
    });

    setLinkModalOpen(true);
  };

  const validate = () => {
    if (!authenticated || !accountId) return "Sign in first.";
    if (!schoolId) return "Select a school first.";
    if (!branchId) return "Select a branch first.";
    if (!form.fullName.trim()) return "Enter parent full name.";
    if (!form.phone.trim()) return "Enter parent phone number.";

    const hasLatitude = form.latitude.trim() !== "";
    const hasLongitude = form.longitude.trim() !== "";

    if (hasLatitude !== hasLongitude)
      return "Enter both latitude and longitude, or leave both empty.";

    if (hasLatitude && hasLongitude) {
      const latitude = Number(form.latitude);
      const longitude = Number(form.longitude);

      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)
        return "Latitude must be a number between -90 and 90.";

      if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)
        return "Longitude must be a number between -180 and 180.";
    }

    if (
      form.accuracyMeters.trim() !== "" &&
      (!Number.isFinite(Number(form.accuracyMeters)) ||
        Number(form.accuracyMeters) < 0)
    )
      return "Location accuracy must be zero or greater.";

    const duplicate = rows.find((row: any) => {
      if (form.id && sameId(row.id, form.id)) return false;
      return safeLower(row.phone) === safeLower(form.phone) && !row.isDeleted;
    });

    if (duplicate)
      return "A parent with this phone number already exists in this branch.";
    return "";
  };

  const save = async (event?: React.FormEvent) => {
    event?.preventDefault();

    const error = validate();
    if (error) {
      showToast("error", error);
      return;
    }

    if (!authenticated || !accountId || !schoolId || !branchId) return;

    try {
      setSaving(true);

      const existing = form.id
        ? rows.find((row: any) => sameId(row.id, form.id))
        : undefined;

      const payload: Partial<Parent> = {
        accountId,
        schoolId: schoolId,
        branchId: branchId,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        photo: safeRecordMediaValue(form.photo),
        photoMediaId: form.photoMediaId || undefined,
        coverPhoto: safeRecordMediaValue(form.coverPhoto),
        coverPhotoMediaId: form.coverPhotoMediaId || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        latitude:
          form.latitude.trim() === "" ? undefined : Number(form.latitude),
        longitude:
          form.longitude.trim() === "" ? undefined : Number(form.longitude),
        accuracyMeters:
          form.accuracyMeters.trim() === ""
            ? undefined
            : Number(form.accuracyMeters),
        locationLabel: form.locationLabel.trim() || undefined,
        formattedAddress: form.formattedAddress.trim() || undefined,
        locationType: form.locationType,
        locationSource: form.locationSource,
        locationPrecision: form.locationPrecision,
        locationCapturedAt:
          form.latitude.trim() && form.longitude.trim()
            ? form.locationCapturedAt || Date.now()
            : undefined,
        mapVisible: form.mapVisible,
        locationConsentGiven: form.locationConsentGiven,
        locationConsentAt: form.locationConsentGiven
          ? form.locationConsentAt || Date.now()
          : undefined,
        locationRestricted: form.locationRestricted,
        occupation: form.occupation.trim() || undefined,
        emergencyContact: form.emergencyContact.trim() || undefined,
        relationship: form.relationship || "guardian",
        active: true,
        isDeleted: false,
      } as Partial<Parent>;

      const savedParent =
        form.id && existing
          ? await updateLocal("parents", String(form.id), payload)
          : await createLocal("parents", payload as unknown as Parent);

      const savedParentId = savedEntityId(
        savedParent,
        form.id,
      );

      if (!savedParentId) {
        throw new Error(
          "The parent record was saved, but its permanent ID could not be resolved for media attachment.",
        );
      }

      const stagedPhotoId = cleanId(
        uploadedMediaIdsRef.current.photo,
      );
      const stagedCoverPhotoId = cleanId(
        uploadedMediaIdsRef.current.coverPhoto,
      );

      const committedMedia = await commitMediaAssetsToOwner({
        accountId,
        ownerTable: PARENT_MEDIA_OWNER_TABLE,
        ownerId: savedParentId,
        ownerTempKey: mediaSessionKeyRef.current,
        assets: [
          {
            assetId: stagedPhotoId || undefined,
            fieldKey: MediaFieldKeys.PHOTO,
          },
          {
            assetId: stagedCoverPhotoId || undefined,
            fieldKey: MediaFieldKeys.COVER_PHOTO,
          },
        ],
      });

      const committedPhotoId = committedMedia.find(
        (item) => item.fieldKey === MediaFieldKeys.PHOTO,
      )?.assetId;

      const committedCoverPhotoId = committedMedia.find(
        (item) => item.fieldKey === MediaFieldKeys.COVER_PHOTO,
      )?.assetId;

      /*
       * Persist the exact committed IDs onto the parent record. New media is
       * resolved from mediaAssets/mediaBlobs, never from preview strings.
       */
      if (committedPhotoId || committedCoverPhotoId) {
        await updateLocal(
          "parents",
          savedParentId,
          {
            photoMediaId:
              committedPhotoId ||
              form.photoMediaId ||
              existing?.photoMediaId ||
              undefined,
            coverPhotoMediaId:
              committedCoverPhotoId ||
              form.coverPhotoMediaId ||
              existing?.coverPhotoMediaId ||
              undefined,
            photo: safeRecordMediaValue(existing?.photo),
            coverPhoto: safeRecordMediaValue(existing?.coverPhoto),
          } as Partial<Parent>,
        );
      }

      const wasNew = !form.id;
      const parentToLink = {
        ...(savedParent && typeof savedParent === "object"
          ? (savedParent as Parent)
          : payload),
        id: savedParentId,
      } as Parent;

      mediaSessionKeyRef.current = createMediaSessionKey(
        PARENT_MEDIA_OWNER_TABLE,
      );
      uploadedMediaIdsRef.current = {};
      setModalOpen(false);
      showToast("success", "Parent saved.");
      await load();

      if (wasNew && parentToLink.id) {
        openLinkModal(parentToLink);
      }
    } catch (error: any) {
      console.error("Failed to save parent and media:", error);
      showToast(
        "error",
        error?.message || "Failed to save parent.",
      );
    } finally {
      setSaving(false);
    }
  };

  const saveLink = async (event?: React.FormEvent) => {
    event?.preventDefault();

    if (!authenticated || !accountId || !schoolId || !branchId) {
      showToast("error", "Sign in and select a school branch first.");
      return;
    }

    if (!linkForm.parentId) {
      showToast("error", "Select parent.");
      return;
    }

    if (!linkForm.studentId) {
      showToast("error", "Select student.");
      return;
    }

    const duplicate = studentParents.find((row: any) => {
      return (
        sameId(row.parentId, linkForm.parentId) &&
        sameId(row.studentId, linkForm.studentId) &&
        !row.isDeleted
      );
    });

    if (duplicate) {
      showToast("error", "This parent is already linked to this student.");
      return;
    }

    try {
      setLinkSaving(true);

      if (linkForm.isPrimary) {
        const existingPrimaryLinks = studentParents.filter((row: any) => {
          return (
            sameId(row.studentId, linkForm.studentId) &&
            row.isPrimary &&
            !row.isDeleted
          );
        });

        await Promise.all(
          existingPrimaryLinks.map((row: any) =>
            row.id
              ? updateLocal("studentParents", String(row.id), {
                  isPrimary: false,
                } as Partial<StudentParent>)
              : Promise.resolve(),
          ),
        );
      }

      await createLocal("studentParents", {
        accountId,
        schoolId: schoolId,
        branchId: branchId,
        parentId: cleanId(linkForm.parentId) || undefined,
        studentId: cleanId(linkForm.studentId) || undefined,
        relationship: linkForm.relationship,
        isPrimary: !!linkForm.isPrimary,
        active: true,
        isDeleted: false,
      } as unknown as StudentParent);

      setLinkModalOpen(false);
      showToast("success", "Parent linked to student.");
      await load();
    } catch (error) {
      console.error("Failed to link parent and student:", error);
      showToast("error", "Failed to link parent and student.");
    } finally {
      setLinkSaving(false);
    }
  };

  const unlink = async (relationId?: string) => {
    if (!relationId) return;
    if (!window.confirm("Remove this parent-student link?")) return;

    await softDeleteLocal("studentParents", String(relationId));
    setSelectedItem(null);
    showToast("success", "Parent-student link removed.");
    await load();
  };

  const remove = async (item: ParentView) => {
    const row: any = item.row;
    const id = idOf(row.id);
    if (!id) return;

    const warning = item.linkCount
      ? `"${row.fullName}" is linked to ${item.linkCount} student(s). Delete parent anyway?`
      : `Delete "${row.fullName}"?`;

    if (!window.confirm(warning)) return;

    await Promise.all(
      ["photo", "coverPhoto"].map((fieldKey) =>
        softDeleteOwnerFieldAssets({
          accountId: String(accountId),

          ownerTable: "parents",

          ownerId: id || undefined,

          fieldKey,
        }),
      ),
    );

    await softDeleteLocal("parents", String(id));
    setSelectedItem(null);
    showToast("success", "Parent deleted.");
    await load();
  };

  if (accountLoading || contextLoading || settingsLoading || loading) {
    return (
      <State
        primary={primary}
        title="Opening Parents..."
        text="Checking account, branch, parent records, students, family links, and media."
      />
    );
  }

  if (!authenticated || !accountId) {
    return (
      <State
        primary={primary}
        title="Redirecting to login..."
        text="You must sign in before managing parents."
      />
    );
  }

  if (!schoolId || !branchId) {
    return (
      <main
        className="ba-page students-page"
        style={
          {
            "--ba-primary": primary,
            "--ba-primary-text": primaryText,
          } as React.CSSProperties
        }
      >
        <style>{css}</style>
        <section className="ba-state">
          <h2>No branch workspace selected</h2>
          <p>
            Parents belong to the selected branch-admin workspace. Use Select
            Role again if the wrong branch is active.
          </p>
          <button
            type="button"
            className="ba-state-button"
            onClick={() => router.push("/account")}
          >
            Go to Account Setup
          </button>
        </section>
      </main>
    );
  }

  return (
    <main
      className="ba-page students-page"
      style={
          {
            "--ba-primary": primary,
            "--ba-primary-text": primaryText,
          } as React.CSSProperties
        }
    >
      <style>{css}</style>

      {toast && (
        <section className={`ba-toast ${toast.tone}`}>
          {toast.message}
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Close notification"
          >
            ✕
          </button>
        </section>
      )}

      <section
        className="ba-search-card"
        aria-label="Parent search and actions"
      >
        <label className="ba-search">
          <span>⌕</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search parents..."
            aria-label="Search parents"
          />
        </label>

        <button
          type="button"
          className="ba-add-inline"
          onClick={() => openCreate()}
          aria-label="Add parent"
        >
          +
        </button>

        <button
          type="button"
          className={`ba-filter-button ${activeFilterCount ? "active" : ""}`}
          onClick={() => setFilterOpen(true)}
          aria-label="Open filters"
          title="Filters"
        >
          <SliderIcon />
          {activeFilterCount ? <b>{activeFilterCount}</b> : null}
        </button>

        <button
          type="button"
          className="ba-icon-button"
          onClick={() => setMoreOpen(true)}
          aria-label="More options"
        >
          ⋯
        </button>
      </section>

      {activeFilterCount > 0 && (
        <section className="ba-filter-chips" aria-label="Active filters">
          {filterRelationship !== "all" && (
            <button type="button" onClick={() => setFilterRelationship("all")}>
              Relationship: {relationshipLabel(filterRelationship)} ×
            </button>
          )}
          {filterLinked !== "all" && (
            <button type="button" onClick={() => setFilterLinked("all")}>
              Link: {filterLinked} ×
            </button>
          )}
        </section>
      )}

      {viewMode === "summary" && (
        <section className="ba-analysis-grid">
          <AnalysisCard
            title="Parents by Relationship"
            rows={countsByRelationship}
            total={summary.total}
          />
          <AnalysisCard
            title="Family Link Status"
            rows={countsByLinkStatus}
            total={summary.total}
          />
          <AnalysisCard
            title="Most Linked Guardians"
            rows={countsByChildren}
            total={Math.max(
              1,
              countsByChildren.reduce((s, r) => s + r.value, 0),
            )}
          />
          <article className="ba-analysis ba-current-filter">
            <span>Current Filter</span>
            <strong>{summary.showing}</strong>
            <p>
              Parent record(s) currently match your search and filter
              conditions.
            </p>
          </article>
        </section>
      )}

      {viewMode === "map" && (
        <section className="students-map-view" aria-label="Parents map">
          <div className="students-map-summary">
            <span>Parents on map</span>
            <strong>{parentMarkers.length}</strong>
            <small>
              {filteredRows.length - parentMarkers.length} filtered parent(s)
              have no visible coordinates.
            </small>
          </div>

          <SchoolMap
            markers={parentMarkers}
            height="min(68vh, 720px)"
            searchable={false}
            filterable={false}
            showLegend={false}
            cluster
            fitMarkers
            allowCreateAtLocation
            createEntityTypes={["parent"]}
            onCreateAtLocation={handleCreateAtLocation}
            allowLocationEditing
            onLocationUpdate={handleParentLocationUpdate}
            emptyView={
              <div className="students-map-empty">
                <span aria-hidden="true">⌖</span>
                <strong>No parent locations to display</strong>
                <small>
                  Add latitude and longitude to parent records, or change the
                  current search and filters.
                </small>
              </div>
            }
          />
        </section>
      )}

      {viewMode === "table" && (
        <TableView
          rows={filteredRows}
          openEdit={openEdit}
          openLinkModal={openLinkModal}
          remove={remove}
        />
      )}

      {viewMode === "cards" && (
        <section className="ba-list">
          {filteredRows.map((item) => (
            <ParentListItem
              key={String(item.id)}
              item={item}
              primary={primary}
              onOpen={() => setSelectedItem(item)}
            />
          ))}

          {!filteredRows.length && (
            <Empty
              icon="👨‍👩‍👧"
              title="No parents found"
              text="Add parents or guardians, then link them to student records with relationship and primary-guardian settings."
            />
          )}
        </section>
      )}

      {filterOpen && (
        <FilterSheet
          filterRelationship={filterRelationship}
          filterLinked={filterLinked}
          setFilterRelationship={setFilterRelationship}
          setFilterLinked={setFilterLinked}
          clearFilters={clearFilters}
          onClose={() => setFilterOpen(false)}
        />
      )}

      {moreOpen && (
        <MoreSheet
          viewMode={viewMode}
          summary={summary}
          setViewMode={(mode) => {
            setViewMode(mode);
            setMoreOpen(false);
          }}
          onLink={() => {
            setMoreOpen(false);
            openLinkModal();
          }}
          onRefresh={async () => {
            setMoreOpen(false);
            await load();
          }}
          onClose={() => setMoreOpen(false)}
        />
      )}

      {selectedItem && (
        <ActionSheet
          item={selectedItem}
          openEdit={openEdit}
          openLinkModal={openLinkModal}
          unlink={unlink}
          remove={remove}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {modalOpen && (
        <ParentModal
          form={form}
          saving={saving}
          setModalOpen={setModalOpen}
          updateForm={updateForm}
          handleImageUpload={handleImageUpload}
          openCameraForField={openCameraForField}
          save={save}
        />
      )}

      {linkModalOpen && (
        <LinkModal
          parents={rows}
          students={students}
          linkForm={linkForm}
          linkSaving={linkSaving}
          updateLinkForm={updateLinkForm}
          saveLink={saveLink}
          onClose={() => setLinkModalOpen(false)}
        />
      )}

      {cameraOpen && (
        <CameraCaptureModal
          field={cameraField}
          videoRef={cameraVideoRef}
          starting={cameraStarting}
          capturing={cameraCapturing}
          facing={cameraFacing}
          setFacing={setCameraFacing}
          capture={captureCameraPhoto}
          close={closeCamera}
          entityLabel={PARENT_MEDIA_ENTITY_LABEL}
        />
      )}
    </main>
  );
}

function State({
  primary,
  title,
  text,
}: {
  primary: string;
  title: string;
  text: string;
}) {
  return (
    <main
      className="ba-page students-page"
      style={
          {
            "--ba-primary": primary,
            "--ba-primary-text": getReadableTextColor(primary),
          } as React.CSSProperties
        }
    >
      <style>{css}</style>
      <section className="ba-state">
        <div className="ba-spinner" />
        <h2>{title}</h2>
        <p>{text}</p>
      </section>
    </main>
  );
}

function ParentListItem({
  item,
  primary,
  onOpen,
}: {
  item: ParentView;
  primary: string;
  onOpen: () => void;
}) {
  const row: any = item.row;

  return (
    <button type="button" className="student-row" onClick={onOpen}>
      <Avatar name={row.fullName} photo={item.photoUrl} primary={primary} />

      <span className="student-main">
        <strong>{row.fullName || "Unnamed parent"}</strong>
        <small>
          {relationshipLabel(row.relationship)}
          {row.phone ? ` · ${row.phone}` : ""}
        </small>
        <em>
          {item.linkCount
            ? `${item.linkCount} child link(s)`
            : "No child linked"}
          {row.email ? ` · ${row.email}` : ""}
        </em>
      </span>

      <span className="student-side">
        <span
          className={`status-dot-mini ${item.linkCount ? "green" : "orange"}`}
          title={item.linkCount ? "Linked" : "Unlinked"}
          aria-label={item.linkCount ? "Linked" : "Unlinked"}
        />
        <i>⋯</i>
      </span>
    </button>
  );
}

function SliderIcon() {
  return (
    <svg className="ba-slider-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h9" />
      <path d="M17 7h3" />
      <circle cx="15" cy="7" r="2" />
      <path d="M4 17h3" />
      <path d="M11 17h9" />
      <circle cx="9" cy="17" r="2" />
    </svg>
  );
}

function FilterSheet({
  filterRelationship,
  filterLinked,
  setFilterRelationship,
  setFilterLinked,
  clearFilters,
  onClose,
}: {
  filterRelationship: "all" | Relationship;
  filterLinked: "all" | "linked" | "unlinked" | "primary";
  setFilterRelationship: (value: "all" | Relationship) => void;
  setFilterLinked: (value: "all" | "linked" | "unlinked" | "primary") => void;
  clearFilters: () => void;
  onClose: () => void;
}) {
  return (
    <div className="ba-sheet-backdrop" role="dialog" aria-modal="true">
      <section className="ba-sheet">
        <div className="ba-sheet-head">
          <div>
            <h2>Filters</h2>
            <p>
              Choose only what you need. The parent list updates after applying.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close filters">
            ✕
          </button>
        </div>

        <div className="ba-form compact">
          <label>
            <span>Relationship</span>
            <select
              value={filterRelationship}
              onChange={(event) =>
                setFilterRelationship(
                  event.target.value as "all" | Relationship,
                )
              }
            >
              <option value="all">All relationships</option>
              <option value="father">Father</option>
              <option value="mother">Mother</option>
              <option value="guardian">Guardian</option>
            </select>
          </label>

          <label>
            <span>Link Status</span>
            <select
              value={filterLinked}
              onChange={(event) => setFilterLinked(event.target.value as any)}
            >
              <option value="all">All link status</option>
              <option value="linked">Linked</option>
              <option value="unlinked">Unlinked</option>
              <option value="primary">Primary guardian</option>
            </select>
          </label>
        </div>

        <div className="ba-sheet-actions">
          <button type="button" onClick={clearFilters}>
            Clear
          </button>
          <button type="button" className="primary" onClick={onClose}>
            Apply
          </button>
        </div>
      </section>
    </div>
  );
}

function MoreSheet({
  viewMode,
  summary,
  setViewMode,
  onLink,
  onRefresh,
  onClose,
}: {
  viewMode: ViewMode;
  summary: {
    total: number;
    linked: number;
    unlinked: number;
    studentsWithParents: number;
    primaryParents: number;
    showing: number;
  };
  setViewMode: (mode: ViewMode) => void;
  onLink: () => void;
  onRefresh: () => void | Promise<void>;
  onClose: () => void;
}) {
  return (
    <div className="ba-sheet-backdrop" role="dialog" aria-modal="true">
      <section className="ba-sheet small">
        <div className="ba-sheet-head">
          <div>
            <h2>More</h2>
            <p>
              {summary.showing} of {summary.total} parent record(s) shown.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close menu">
            ✕
          </button>
        </div>

        <div className="ba-menu-list">
          <button
            type="button"
            className={viewMode === "cards" ? "active" : ""}
            onClick={() => setViewMode("cards")}
          >
            <span>☰</span>
            <b>List view</b>
            <small>Simple parent records</small>
          </button>

          <button
            type="button"
            className={viewMode === "table" ? "active" : ""}
            onClick={() => setViewMode("table")}
          >
            <span>☷</span>
            <b>Table view</b>
            <small>Dense records for laptop work</small>
          </button>

          <button
            type="button"
            className={viewMode === "map" ? "active" : ""}
            onClick={() => setViewMode("map")}
          >
            <span>⌖</span>
            <b>Map view</b>
            <small>Parent homes and saved locations</small>
          </button>

          <button
            type="button"
            className={viewMode === "summary" ? "active" : ""}
            onClick={() => setViewMode("summary")}
          >
            <span>◔</span>
            <b>Analytics</b>
            <small>Relationship and link summaries</small>
          </button>

          <button type="button" onClick={onLink}>
            <span>🔗</span>
            <b>Link parent</b>
            <small>Connect parent to student</small>
          </button>

          <button type="button" onClick={onRefresh}>
            <span>↻</span>
            <b>Refresh</b>
            <small>Reload local branch records</small>
          </button>
        </div>
      </section>
    </div>
  );
}

function ActionSheet({
  item,
  openEdit,
  openLinkModal,
  unlink,
  remove,
  onClose,
}: {
  item: ParentView;
  openEdit: (row: Parent) => void;
  openLinkModal: (parent?: Parent, student?: Student) => void;
  unlink: (relationId?: string) => void;
  remove: (item: ParentView) => void;
  onClose: () => void;
}) {
  const row: any = item.row;

  return (
    <div className="ba-sheet-backdrop" role="dialog" aria-modal="true">
      <section className="ba-sheet small">
        <div className="ba-sheet-profile">
          <div>
            <h2>{row.fullName || "Parent"}</h2>
            <p>
              {relationshipLabel(row.relationship)} ·{" "}
              {item.linkCount ? `${item.linkCount} child link(s)` : "Unlinked"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close parent actions"
          >
            ✕
          </button>
        </div>

        <div className="parent-detail-strip">
          <span>
            <b>Phone</b>
            {row.phone || "Not set"}
          </span>
          <span>
            <b>Primary</b>
            {item.primaryChildren}
          </span>
          <span>
            <b>Children</b>
            {item.linkCount}
          </span>
        </div>

        {item.relations.length ? (
          <div className="link-list compact">
            {item.relations.map((relation: any) => {
              const student: any = item.linkedStudents.find((child: any) =>
                sameId(child.id, relation.studentId),
              );
              return (
                <div key={String(relation.id)} className="link-row">
                  <div>
                    <strong>
                      {student?.fullName || `Student #${relation.studentId}`}
                    </strong>
                    <span>
                      {relationshipLabel(relation.relationship)}
                      {relation.isPrimary ? " · Primary" : ""}
                    </span>
                  </div>
                  <button type="button" onClick={() => unlink(relation.id)}>
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="ba-menu-list">
          <button type="button" onClick={() => openLinkModal(item.row)}>
            <span>🔗</span>
            <b>Link student</b>
            <small>Connect this parent to a student</small>
          </button>

          <button type="button" onClick={() => openEdit(item.row)}>
            <span>✎</span>
            <b>Edit parent</b>
            <small>Update contact details, address and photos</small>
          </button>

          <button type="button" className="danger" onClick={() => remove(item)}>
            <span>⌫</span>
            <b>Delete</b>
            <small>Soft delete this parent locally</small>
          </button>
        </div>
      </section>
    </div>
  );
}

function TableView({
  rows,
  openEdit,
  openLinkModal,
  remove,
}: {
  rows: ParentView[];
  openEdit: (row: Parent) => void;
  openLinkModal: (parent?: Parent, student?: Student) => void;
  remove: (item: ParentView) => void;
}) {
  return (
    <section className="ba-table-card">
      <div className="ba-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Parents ({rows.length})</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Relationship</th>
              <th>Occupation</th>
              <th>Emergency</th>
              <th>Children</th>
              <th>Primary</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((item) => {
              const row: any = item.row;

              return (
                <tr key={String(item.id)}>
                  <td>
                    <strong>{row.fullName}</strong>
                    <span>{row.address || "No address"}</span>
                  </td>
                  <td>{row.phone || "—"}</td>
                  <td>{row.email || "—"}</td>
                  <td>
                    <Chip tone={relationshipTone(row.relationship)}>
                      {relationshipLabel(row.relationship)}
                    </Chip>
                  </td>
                  <td>{row.occupation || "—"}</td>
                  <td>{row.emergencyContact || "—"}</td>
                  <td>{item.linkCount}</td>
                  <td>{item.primaryChildren}</td>
                  <td>{timeText(row.updatedAt || row.createdAt)}</td>
                  <td>
                    <div className="ba-table-actions">
                      <button
                        type="button"
                        onClick={() => openLinkModal(item.row)}
                      >
                        Link
                      </button>
                      <button type="button" onClick={() => openEdit(item.row)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="ba-delete"
                        onClick={() => remove(item)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!rows.length && (
          <div className="ba-empty-table">No parent matches your filters.</div>
        )}
      </div>
    </section>
  );
}

function ParentModal({
  form,
  saving,
  setModalOpen,
  updateForm,
  handleImageUpload,
  openCameraForField,
  save,
}: {
  form: FormState;
  saving: boolean;
  setModalOpen: (open: boolean) => void;
  updateForm: (patch: Partial<FormState>) => void;
  handleImageUpload: (field: CameraField, file?: File) => void | Promise<void>;
  openCameraForField: (field: CameraField) => void;
  save: (event?: React.FormEvent) => void;
}) {
  const [locating, setLocating] = useState(false);

  const captureCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      window.alert("Location access is not available on this device or browser.");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const capturedAt = position.timestamp || Date.now();

        updateForm({
          latitude: position.coords.latitude.toFixed(7),
          longitude: position.coords.longitude.toFixed(7),
          accuracyMeters: Number.isFinite(position.coords.accuracy)
            ? String(Math.round(position.coords.accuracy))
            : "",
          locationSource: "device_gps",
          locationCapturedAt: capturedAt,
          mapVisible: true,
        });

        setLocating(false);
      },
      (error) => {
        setLocating(false);

        const message =
          error.code === error.PERMISSION_DENIED
            ? "Location permission was denied. Allow location access or enter the coordinates manually."
            : error.code === error.POSITION_UNAVAILABLE
              ? "Your current location could not be determined."
              : error.code === error.TIMEOUT
                ? "Location capture timed out. Please try again."
                : "Location capture failed.";

        window.alert(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      },
    );
  };

  return (
    <div className="ba-modal-backdrop">
      <form className="ba-modal" onSubmit={save}>
        <div className="ba-modal-head">
          <div>
            <h2>{form.id ? "Edit Parent" : "Add Parent"}</h2>
            <p>Parent or guardian will be saved under the selected branch.</p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            aria-label="Close parent form"
          >
            ✕
          </button>
        </div>

        <section className="ba-form-section">
          <h3>Parent / Guardian</h3>
          <div className="ba-form">
            <label>
              <span>Full Name</span>
              <input
                value={form.fullName}
                onChange={(event) =>
                  updateForm({ fullName: event.target.value })
                }
                placeholder="Parent / guardian full name"
              />
            </label>

            <label>
              <span>Phone</span>
              <input
                value={form.phone}
                onChange={(event) => updateForm({ phone: event.target.value })}
                placeholder="Phone number"
              />
            </label>

            <label>
              <span>Email</span>
              <input
                value={form.email}
                onChange={(event) => updateForm({ email: event.target.value })}
                placeholder="Email address"
              />
            </label>

            <label>
              <span>Relationship</span>
              <select
                value={form.relationship}
                onChange={(event) =>
                  updateForm({
                    relationship: event.target.value as Relationship,
                  })
                }
              >
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="guardian">Guardian</option>
              </select>
            </label>
          </div>
        </section>

        <section className="ba-form-section">
          <h3>Details</h3>
          <div className="ba-form">
            <label>
              <span>Occupation</span>
              <input
                value={form.occupation}
                onChange={(event) =>
                  updateForm({ occupation: event.target.value })
                }
                placeholder="Occupation"
              />
            </label>

            <label>
              <span>Emergency Contact</span>
              <input
                value={form.emergencyContact}
                onChange={(event) =>
                  updateForm({ emergencyContact: event.target.value })
                }
                placeholder="Emergency contact"
              />
            </label>

            <label className="wide">
              <span>Address</span>
              <textarea
                value={form.address}
                onChange={(event) =>
                  updateForm({ address: event.target.value })
                }
                placeholder="Parent address"
              />
            </label>
          </div>
        </section>

        <section className="ba-form-section">
          <div className="ba-section-heading-row">
            <div>
              <h3>Map Location</h3>
              <p>
                Add the parent&apos;s approved home, workplace, pickup, or
                drop-off location.
              </p>
            </div>

            <button
              type="button"
              className="ba-media-button secondary"
              onClick={captureCurrentLocation}
              disabled={locating}
            >
              {locating ? "Getting location..." : "Use Current Location"}
            </button>
          </div>

          <div className="ba-form two">
            <label>
              <span>Latitude</span>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="-90"
                max="90"
                value={form.latitude}
                onChange={(e) =>
                  updateForm({
                    latitude: e.target.value,
                    locationSource: "manual",
                  })
                }
                placeholder="e.g. 5.603717"
              />
            </label>

            <label>
              <span>Longitude</span>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="-180"
                max="180"
                value={form.longitude}
                onChange={(e) =>
                  updateForm({
                    longitude: e.target.value,
                    locationSource: "manual",
                  })
                }
                placeholder="e.g. -0.186964"
              />
            </label>

            <label>
              <span>Location Label</span>
              <input
                value={form.locationLabel}
                onChange={(e) =>
                  updateForm({ locationLabel: e.target.value })
                }
                placeholder="e.g. Parent home or Dansoman pickup point"
              />
            </label>

            <label>
              <span>Location Type</span>
              <select
                value={form.locationType}
                onChange={(e) =>
                  updateForm({
                    locationType: e.target.value as FormState["locationType"],
                  })
                }
              >
                <option value="home">Home</option>
                                <option value="pickup_point">Pickup point</option>
                <option value="dropoff_point">Drop-off point</option>
                <option value="workplace">Workplace</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label>
              <span>Location Precision</span>
              <select
                value={form.locationPrecision}
                onChange={(e) =>
                  updateForm({
                    locationPrecision:
                      e.target.value as FormState["locationPrecision"],
                  })
                }
              >
                <option value="exact">Exact</option>
                <option value="approximate">Approximate</option>
                <option value="area_only">Area only</option>
              </select>
            </label>

            <label>
              <span>Accuracy in Metres</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={form.accuracyMeters}
                onChange={(e) =>
                  updateForm({ accuracyMeters: e.target.value })
                }
                placeholder="Filled automatically when using GPS"
              />
            </label>

            <label className="wide">
              <span>Formatted Location Address</span>
              <textarea
                value={form.formattedAddress}
                onChange={(e) =>
                  updateForm({ formattedAddress: e.target.value })
                }
                placeholder="Readable address or directions for this map point"
              />
            </label>
          </div>

          <div className="ba-location-options">
            <label className="ba-check-row">
              <input
                type="checkbox"
                checked={form.mapVisible}
                onChange={(e) =>
                  updateForm({ mapVisible: e.target.checked })
                }
              />
              <span>
                <strong>Show on student map</strong>
                <small>
                  The point can appear to authorized users within the branch.
                </small>
              </span>
            </label>

            <label className="ba-check-row">
              <input
                type="checkbox"
                checked={form.locationConsentGiven}
                onChange={(e) =>
                  updateForm({
                    locationConsentGiven: e.target.checked,
                    locationConsentAt: e.target.checked
                      ? form.locationConsentAt || Date.now()
                      : undefined,
                  })
                }
              />
              <span>
                <strong>Location consent recorded</strong>
                <small>
                  Confirm that the school is permitted to store this location.
                </small>
              </span>
            </label>

            <label className="ba-check-row">
              <input
                type="checkbox"
                checked={form.locationRestricted}
                onChange={(e) =>
                  updateForm({ locationRestricted: e.target.checked })
                }
              />
              <span>
                <strong>Restricted location</strong>
                <small>
                  Mark this point as sensitive for stricter access controls.
                </small>
              </span>
            </label>
          </div>

          {(form.latitude || form.longitude) && (
            <div className="ba-location-captured">
              <span>Coordinate source: {form.locationSource.replace("_", " ")}</span>
              {form.locationCapturedAt ? (
                <small>
                  Captured {new Date(form.locationCapturedAt).toLocaleString()}
                </small>
              ) : null}
              <button
                type="button"
                onClick={() =>
                  updateForm({
                    latitude: "",
                    longitude: "",
                    accuracyMeters: "",
                    locationCapturedAt: undefined,
                    locationSource: "manual",
                  })
                }
              >
                Clear coordinates
              </button>
            </div>
          )}
        </section>

        <section className="ba-form-section">
          <h3>Photos</h3>
          <div className="ba-form two">
            <label>
              <span>Parent Photo</span>
              <div className="ba-media-actions">
                <label className="ba-media-button">
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      handleImageUpload("photo", event.target.files?.[0])
                    }
                    hidden
                  />
                </label>

                <button
                  type="button"
                  className="ba-media-button secondary"
                  onClick={() => openCameraForField("photo")}
                >
                  Take Photo
                </button>
              </div>
              <small className="ba-media-hint">
                Upload from files or take a quick camera photo. The image is
                optimized and saved as a media asset.
              </small>
              {form.photo && (
                <img
                  src={form.photo}
                  alt="Parent preview"
                  className="ba-preview-photo"
                />
              )}
            </label>

            <label>
              <span>Cover Photo</span>
              <div className="ba-media-actions">
                <label className="ba-media-button">
                  Upload Cover
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      handleImageUpload("coverPhoto", event.target.files?.[0])
                    }
                    hidden
                  />
                </label>

                <button
                  type="button"
                  className="ba-media-button secondary"
                  onClick={() => openCameraForField("coverPhoto")}
                >
                  Take Photo
                </button>
              </div>
              <small className="ba-media-hint">
                Upload from files or use the camera. The cover is compressed
                separately so sync records stay small.
              </small>
              {form.coverPhoto && (
                <img
                  src={form.coverPhoto}
                  alt="Parent cover preview"
                  className="ba-preview-banner"
                />
              )}
            </label>
          </div>
        </section>

        <div className="ba-modal-actions">
          <button type="button" onClick={() => setModalOpen(false)}>
            Cancel
          </button>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : form.id ? "Save Changes" : "Add Parent"}
          </button>
        </div>
      </form>
    </div>
  );
}

function LinkModal({
  parents,
  students,
  linkForm,
  linkSaving,
  updateLinkForm,
  saveLink,
  onClose,
}: {
  parents: Parent[];
  students: Student[];
  linkForm: LinkFormState;
  linkSaving: boolean;
  updateLinkForm: (patch: Partial<LinkFormState>) => void;
  saveLink: (event?: React.FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <div className="ba-modal-backdrop">
      <form className="ba-modal link-modal" onSubmit={saveLink}>
        <div className="ba-modal-head">
          <div>
            <h2>Link Parent to Student</h2>
            <p>
              Connect a parent or guardian to a student record and choose the
              relationship.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close link form">
            ✕
          </button>
        </div>

        <div className="ba-form link-form">
          <label>
            <span>Parent</span>
            <select
              value={linkForm.parentId}
              onChange={(event) =>
                updateLinkForm({ parentId: event.target.value })
              }
            >
              <option value="">Select parent</option>
              {parents.map((parent: any) => (
                <option key={String(parent.id)} value={String(parent.id)}>
                  {parent.fullName} · {parent.phone}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Student</span>
            <select
              value={linkForm.studentId}
              onChange={(event) =>
                updateLinkForm({ studentId: event.target.value })
              }
            >
              <option value="">Select student</option>
              {students.map((student: any) => (
                <option key={String(student.id)} value={String(student.id)}>
                  {student.fullName}
                  {student.admissionNumber
                    ? ` · ${student.admissionNumber}`
                    : ""}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Relationship to Student</span>
            <select
              value={linkForm.relationship}
              onChange={(event) =>
                updateLinkForm({
                  relationship: event.target.value as StudentParentRelationship,
                })
              }
            >
              <option value="father">Father</option>
              <option value="mother">Mother</option>
              <option value="guardian">Guardian</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className="ba-check">
            <input
              type="checkbox"
              checked={linkForm.isPrimary}
              onChange={(event) =>
                updateLinkForm({ isPrimary: event.target.checked })
              }
            />
            <span>Mark as primary parent/guardian for this student</span>
          </label>
        </div>

        <div className="ba-modal-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={linkSaving}>
            {linkSaving ? "Linking..." : "Link Parent to Student"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CameraCaptureModal({
  field,
  videoRef,
  starting,
  capturing,
  facing,
  setFacing,
  capture,
  close,
  entityLabel,
}: {
  field: CameraField;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  starting: boolean;
  capturing: boolean;
  facing: CameraFacingMode;
  setFacing: (value: CameraFacingMode) => void;
  capture: () => void | Promise<void>;
  close: () => void;
  entityLabel: string;
}) {
  const title =
    field === "photo"
      ? `Take ${entityLabel} Photo`
      : `Take ${entityLabel} Cover Photo`;

  return (
    <div
      className="ba-modal-backdrop camera-backdrop"
      role="dialog"
      aria-modal="true"
    >
      <section className="ba-camera-modal">
        <div className="ba-modal-head">
          <div>
            <h2>{title}</h2>
            <p>
              Use the live camera preview, then capture. The image will still be
              compressed and saved as a media asset.
            </p>
          </div>
          <button type="button" onClick={close} aria-label="Close camera">
            ✕
          </button>
        </div>

        <div className="ba-camera-preview">
          <video ref={videoRef} autoPlay muted playsInline />
          {starting && (
            <span className="ba-camera-loading">Opening camera...</span>
          )}
        </div>

        <div className="ba-camera-actions">
          <button
            type="button"
            className="ba-camera-secondary"
            onClick={() =>
              setFacing(facing === "environment" ? "user" : "environment")
            }
            disabled={starting || capturing}
          >
            Switch Camera
          </button>
          <button
            type="button"
            className="ba-camera-secondary"
            onClick={close}
            disabled={capturing}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ba-camera-primary"
            onClick={capture}
            disabled={starting || capturing}
          >
            {capturing ? "Capturing..." : "Capture Photo"}
          </button>
        </div>
      </section>
    </div>
  );
}

function groupedCounts(
  rows: ParentView[],
  keyFn: (item: ParentView) => string,
) {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    const key = keyFn(row) || "Unknown";
    map.set(key, (map.get(key) || 0) + 1);
  });

  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function AnalysisCard({
  title,
  rows,
  total,
}: {
  title: string;
  rows: { label: string; value: number }[];
  total: number;
}) {
  return (
    <article className="ba-analysis">
      <span>{title}</span>
      <strong>{rows.reduce((sum, row) => sum + row.value, 0)}</strong>

      <div className="ba-analysis-list">
        {rows.slice(0, 8).map((row) => {
          const share = total ? Math.round((row.value / total) * 100) : 0;

          return (
            <section key={row.label}>
              <div>
                <b>{row.label}</b>
                <small>
                  {row.value} · {share}%
                </small>
              </div>
              <div className="ba-progress">
                <i style={{ width: `${Math.max(4, share)}%` }} />
              </div>
            </section>
          );
        })}

        {!rows.length && <p>No data available.</p>}
      </div>
    </article>
  );
}

const css = `
@keyframes spin { to { transform: rotate(360deg); } }

.ba-page {
  --ease: cubic-bezier(.2,.8,.2,1);
  min-height: 100dvh;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: calc(8px * var(--local-density-scale, 1));
  padding-bottom: max(40px, env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--ba-primary) 9%, transparent), transparent 30rem),
    var(--bg, #f7f8fb);
  color: var(--text, #111827);
  font-family: var(--font-family, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  font-size: var(--font-size, 14px);
  overflow-x: hidden;
}

.ba-page *,
.ba-page *::before,
.ba-page *::after {
  box-sizing: border-box;
  min-width: 0;
}

.ba-page button,
.ba-page input,
.ba-page select,
.ba-page textarea {
  font: inherit;
  max-width: 100%;
}

.ba-page button {
  -webkit-tap-highlight-color: transparent;
}

.ba-page input,
.ba-page select,
.ba-page textarea {
  width: 100%;
  min-height: 44px;
  border: 1px solid var(--input-border, var(--border, rgba(0,0,0,.10)));
  border-radius: 16px;
  padding: 0 12px;
  background: var(--input-bg, var(--surface, #fff));
  color: var(--input-text, var(--text, #111827));
  outline: none;
  font-weight: 750;
}

.ba-page input:focus,
.ba-page select:focus,
.ba-page textarea:focus {
  border-color: color-mix(in srgb, var(--ba-primary) 52%, var(--border, rgba(0,0,0,.10)));
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--ba-primary) 12%, transparent);
}

.ba-state,
.ba-search-card,
.ba-summary-line,
.ba-card,
.ba-table-card,
.ba-analysis,
.ba-empty,
.ba-sheet,
.ba-modal,
.student-row {
  background: var(--card-bg, var(--surface, #fff));
  border: 1px solid var(--border, rgba(0,0,0,.10));
  box-shadow: 0 12px 28px rgba(15,23,42,.045);
}

.ba-state {
  min-height: min(420px, calc(100dvh - 32px));
  width: min(520px, 100%);
  margin: 0 auto;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
  padding: 22px;
  border-radius: 28px;
  text-align: center;
}

.ba-spinner {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 4px solid color-mix(in srgb, var(--ba-primary) 18%, transparent);
  border-top-color: var(--ba-primary);
  animation: spin .8s linear infinite;
}

.ba-state h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 1000;
  letter-spacing: -.04em;
}

.ba-state p {
  max-width: 34rem;
  margin: 0;
  color: var(--muted, #64748b);
  font-size: 13px;
  line-height: 1.6;
}

.ba-state-button {
  min-height: 42px;
  border: 0;
  border-radius: 999px;
  padding: 0 16px;
  background: var(--ba-primary);
  color: #fff;
  font-weight: 950;
  cursor: pointer;
}

.ba-toast {
  position: sticky;
  top: 8px;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  padding: 12px 14px;
  border-radius: 18px;
  font-size: 13px;
  font-weight: 850;
  box-shadow: 0 18px 40px rgba(15,23,42,.12);
}

.ba-toast.success { background: rgba(34,197,94,.14); color: #166534; }
.ba-toast.error { background: rgba(239,68,68,.12); color: #991b1b; }
.ba-toast.info { background: rgba(59,130,246,.13); color: #1d4ed8; }

.ba-toast button {
  border: 0;
  background: transparent;
  color: currentColor;
  font-weight: 1000;
  cursor: pointer;
}

/* Compact search/action strip. The page intentionally has no duplicate title header. */
.ba-topbar,
.ba-title,
.ba-topbar-actions {
  display: none;
}

.ba-icon-button,
.ba-filter-button,
.ba-add-inline {
  width: 42px;
  height: 42px;
  border: 1px solid var(--border, rgba(0,0,0,.10));
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: var(--card-bg, var(--surface,#fff));
  color: var(--text,#111827);
  font-size: 18px;
  font-weight: 1000;
  cursor: pointer;
  box-shadow: 0 10px 22px rgba(15,23,42,.045);
}


.ba-add-inline {
  flex: 0 0 42px;
  border-color: var(--ba-primary);
  background: var(--ba-primary);
  color: #fff;
  font-size: 25px;
  line-height: 1;
  box-shadow: 0 12px 28px color-mix(in srgb, var(--ba-primary) 22%, transparent);
}

.ba-search-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto auto;
  gap: 8px;
  align-items: center;
  margin-top: 2px;
  padding: 8px;
  border-radius: 24px;
}

.ba-search {
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 11px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--muted,#64748b) 7%, transparent);
}

.ba-search span {
  color: var(--muted,#64748b);
  font-size: 17px;
  font-weight: 1000;
}

.ba-search input {
  min-height: 42px;
  border: 0;
  padding: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  font-size: 14px;
}

.ba-slider-icon {
  width: 21px;
  height: 21px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ba-filter-button {
  position: relative;
  background: color-mix(in srgb, var(--ba-primary) 8%, var(--card-bg,#fff));
  color: var(--ba-primary);
}

.ba-filter-button.active {
  background: var(--ba-primary);
  color: #fff;
  border-color: var(--ba-primary);
}

.ba-filter-button b {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 19px;
  height: 19px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  border: 2px solid var(--card-bg,#fff);
}

.ba-summary-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 20px;
}

.ba-summary-line div {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.ba-summary-line strong {
  font-size: 21px;
  font-weight: 1000;
  letter-spacing: -.05em;
}

.ba-summary-line span,
.ba-summary-line p {
  color: var(--muted,#64748b);
  font-size: 12px;
  font-weight: 850;
}

.ba-summary-line p {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ba-filter-chips {
  display: flex;
  gap: 7px;
  overflow-x: auto;
  padding: 8px 1px 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.ba-filter-chips::-webkit-scrollbar {
  display: none;
}

.ba-filter-chips button {
  flex: 0 0 auto;
  min-height: 31px;
  border: 0;
  border-radius: 999px;
  padding: 0 10px;
  background: color-mix(in srgb, var(--ba-primary) 11%, transparent);
  color: var(--ba-primary);
  font-size: 11px;
  font-weight: 950;
  white-space: nowrap;
  cursor: pointer;
}

.ba-list {
  display: grid;
  gap: 7px;
  margin-top: 10px;
}

.student-row {
  width: 100%;
  display: grid;
  grid-template-columns: auto minmax(0,1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 22px;
  text-align: left;
  cursor: pointer;
  transition: transform .16s var(--ease), box-shadow .16s var(--ease), border-color .16s var(--ease);
}

.student-row:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--ba-primary) 24%, var(--border, rgba(0,0,0,.10)));
  box-shadow: 0 16px 34px rgba(15,23,42,.07);
}

.ba-avatar {
  width: 48px;
  height: 48px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 18px;
  color: #fff;
  font-size: 17px;
  font-weight: 1000;
  box-shadow: 0 12px 24px rgba(15,23,42,.12);
}

.student-main,
.student-main strong,
.student-main small,
.student-main em {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.student-main strong {
  color: var(--text,#111827);
  font-size: 14px;
  font-weight: 1000;
  letter-spacing: -.02em;
}

.student-main small {
  margin-top: 3px;
  color: var(--muted,#64748b);
  font-size: 12px;
  font-weight: 850;
  font-style: normal;
}

.student-main em {
  margin-top: 3px;
  color: color-mix(in srgb, var(--muted,#64748b) 86%, var(--text,#111827));
  font-size: 11px;
  font-weight: 750;
  font-style: normal;
}

.student-side {
  display: grid;
  justify-items: end;
  gap: 6px;
  flex: 0 0 auto;
}

.student-side i {
  color: var(--muted,#64748b);
  font-style: normal;
  font-size: 18px;
  font-weight: 1000;
  line-height: 1;
}

.ba-chip {
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 950;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: capitalize;
}

.ba-chip.green { background: rgba(34,197,94,.12); color: #16a34a; }
.ba-chip.red { background: rgba(239,68,68,.12); color: #dc2626; }
.ba-chip.blue { background: rgba(59,130,246,.12); color: #2563eb; }
.ba-chip.gray { background: color-mix(in srgb,var(--muted,#64748b) 14%,transparent); color: var(--muted,#64748b); }
.ba-chip.orange { background: rgba(245,158,11,.14); color: #b45309; }
.ba-chip.purple { background: rgba(147,51,234,.12); color: #7e22ce; }

.status-dot-mini {
  width: 10px;
  height: 10px;
  display: inline-block;
  border-radius: 999px;
  background: var(--muted,#64748b);
  box-shadow: 0 0 0 4px color-mix(in srgb, currentColor 10%, transparent);
}

.status-dot-mini.green { background: #22c55e; }
.status-dot-mini.red { background: #ef4444; }
.status-dot-mini.blue { background: #3b82f6; }
.status-dot-mini.orange { background: #f59e0b; }
.status-dot-mini.gray { background: var(--muted,#64748b); }

.status-sheet-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0,1fr));
  gap: 8px;
}

.status-sheet-grid span {
  display: grid;
  gap: 5px;
  padding: 11px;
  border: 1px solid var(--border,rgba(0,0,0,.08));
  border-radius: 18px;
  background: color-mix(in srgb, var(--muted,#64748b) 7%, transparent);
}

.status-sheet-grid b {
  color: var(--muted,#64748b);
  font-size: 10px;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: .08em;
}

.status-sheet-grid em {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--text,#111827);
  font-size: 12px;
  font-style: normal;
  font-weight: 900;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}


.ba-sheet-backdrop,
.ba-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: end center;
  padding: 10px;
  background: rgba(15,23,42,.50);
  backdrop-filter: blur(12px);
}

.ba-sheet {
  width: min(760px, 100%);
  max-height: min(88dvh, 760px);
  overflow-y: auto;
  padding: 14px;
  border-radius: 28px 28px 22px 22px;
  box-shadow: 0 30px 90px rgba(15,23,42,.32);
  animation: sheetIn .18s var(--ease);
}

.ba-sheet.small {
  width: min(520px, 100%);
}

@keyframes sheetIn {
  from { transform: translateY(16px); opacity: .7; }
  to { transform: translateY(0); opacity: 1; }
}

.ba-sheet-head,
.ba-sheet-profile {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
}

.ba-sheet-head h2,
.ba-sheet-profile h2,
.ba-modal-head h2 {
  margin: 0;
  color: var(--text,#111827);
  font-size: 21px;
  font-weight: 1000;
  letter-spacing: -.05em;
}

.ba-sheet-head p,
.ba-sheet-profile p,
.ba-modal-head p {
  margin: 5px 0 0;
  color: var(--muted,#64748b);
  font-size: 12px;
  line-height: 1.5;
  font-weight: 750;
}

.ba-sheet-head button,
.ba-sheet-profile button,
.ba-modal-head button {
  width: 38px;
  height: 38px;
  border: 1px solid var(--border,rgba(0,0,0,.10));
  border-radius: 999px;
  background: var(--surface,#fff);
  color: var(--text,#111827);
  font-weight: 1000;
  cursor: pointer;
  flex: 0 0 auto;
}

.ba-sheet-actions,
.ba-modal-actions {
  position: sticky;
  bottom: -14px;
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
  padding: 12px 0 2px;
  background: linear-gradient(to top, var(--card-bg,var(--surface,#fff)) 70%, transparent);
}

.ba-sheet-actions button,
.ba-modal-actions button {
  min-height: 42px;
  border: 1px solid var(--border,rgba(0,0,0,.10));
  border-radius: 999px;
  padding: 0 16px;
  background: color-mix(in srgb,var(--muted,#64748b) 8%,var(--surface,#fff));
  color: var(--text,#111827);
  font-size: 12px;
  font-weight: 950;
  cursor: pointer;
}

.ba-sheet-actions button.primary,
.ba-modal-actions button:last-child {
  border-color: var(--ba-primary);
  background: var(--ba-primary);
  color: #fff;
  box-shadow: 0 14px 32px color-mix(in srgb, var(--ba-primary) 25%, transparent);
}

.ba-modal-actions button:disabled {
  opacity: .65;
  cursor: not-allowed;
}

.ba-menu-list {
  display: grid;
  gap: 8px;
}

.ba-menu-list button {
  width: 100%;
  display: grid;
  grid-template-columns: 42px minmax(0,1fr);
  column-gap: 10px;
  align-items: center;
  min-height: 58px;
  border: 1px solid var(--border,rgba(0,0,0,.10));
  border-radius: 18px;
  padding: 9px;
  background: var(--surface,#fff);
  color: var(--text,#111827);
  text-align: left;
  cursor: pointer;
}

.ba-menu-list button span {
  grid-row: span 2;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: color-mix(in srgb, var(--ba-primary) 10%, transparent);
  color: var(--ba-primary);
  font-weight: 1000;
}

.ba-menu-list button b,
.ba-menu-list button small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ba-menu-list button b {
  font-size: 13px;
  font-weight: 1000;
}

.ba-menu-list button small {
  margin-top: 2px;
  color: var(--muted,#64748b);
  font-size: 11px;
  font-weight: 750;
}

.ba-menu-list button.active {
  border-color: color-mix(in srgb, var(--ba-primary) 34%, var(--border,rgba(0,0,0,.10)));
  background: color-mix(in srgb, var(--ba-primary) 8%, var(--surface,#fff));
}

.ba-menu-list button.danger span {
  background: color-mix(in srgb, #dc2626 10%, transparent);
  color: #dc2626;
}

.ba-menu-list button.danger b {
  color: #991b1b;
}

.student-detail-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  gap: 7px;
  margin-bottom: 10px;
}

.student-detail-strip span {
  display: block;
  padding: 9px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--muted,#64748b) 8%, transparent);
  color: var(--muted,#64748b);
  font-size: 11px;
  font-weight: 850;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.student-detail-strip b {
  display: block;
  margin-bottom: 3px;
  color: var(--text,#111827);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .05em;
}

.ba-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
}

.ba-form.two {
  grid-template-columns: minmax(0,1fr);
}

.ba-form.compact {
  gap: 9px;
}

.ba-form label {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.ba-form span {
  color: var(--muted,#64748b);
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .06em;
}

.ba-media-hint {
  color: var(--muted,#64748b);
  font-size: 11px;
  font-weight: 750;
  line-height: 1.4;
}

.ba-form .wide {
  grid-column: 1 / -1;
}

.ba-form-section {
  padding: 12px 0;
  border-top: 1px solid var(--border,rgba(0,0,0,.08));
}

.ba-form-section:first-of-type {
  border-top: 0;
  padding-top: 0;
}

.ba-form-section h3 {
  margin: 0 0 10px;
  color: var(--text,#111827);
  font-size: 14px;
  font-weight: 1000;
  letter-spacing: -.03em;
}

.ba-page input[type="file"] {
  padding: 10px;
  font-size: 12px;
}

.ba-page textarea {
  min-height: 92px;
  padding: 12px;
  resize: vertical;
  line-height: 1.55;
}


.ba-media-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 2px;
}

.ba-media-button {
  width: auto;
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--ba-primary);
  border-radius: 999px;
  padding: 0 14px;
  background: var(--ba-primary);
  color: #fff !important;
  font-size: 12px;
  font-weight: 950;
  letter-spacing: 0 !important;
  text-transform: none !important;
  cursor: pointer;
  box-shadow: 0 10px 22px color-mix(in srgb, var(--ba-primary) 18%, transparent);
  transition: transform .18s var(--ease), background .18s var(--ease), border-color .18s var(--ease), box-shadow .18s var(--ease), filter .18s var(--ease);
}

.ba-media-button.secondary {
  background: var(--surface, #fff);
  color: var(--ba-primary) !important;
  box-shadow: none;
}

.ba-media-button input {
  display: none;
}

.ba-preview-photo {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: 22px;
  border: 1px solid var(--border,rgba(0,0,0,.10));
}

.ba-preview-banner {
  width: 100%;
  height: 130px;
  object-fit: cover;
  border-radius: 22px;
  border: 1px solid var(--border,rgba(0,0,0,.10));
}

.ba-modal {
  width: min(980px, 100%);
  max-height: min(92dvh, 900px);
  overflow-y: auto;
  padding: 14px;
  border-radius: 28px;
  box-shadow: 0 30px 90px rgba(15,23,42,.35);
}

.ba-modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 2px 14px;
}

.ba-analysis-grid {
  display: grid;
  grid-template-columns: minmax(0,1fr);
  gap: 10px;
  margin-top: 10px;
}

.ba-analysis,
.ba-table-card,
.ba-empty {
  padding: 13px;
  border-radius: 24px;
}

.ba-analysis span {
  color: var(--muted,#64748b);
  font-size: 11px;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: .08em;
}

.ba-analysis strong {
  display: block;
  margin-top: 8px;
  font-size: clamp(22px,7vw,30px);
  line-height: 1;
  font-weight: 1000;
  letter-spacing: -.06em;
  overflow-wrap: anywhere;
}

.ba-analysis p {
  margin: 8px 0 0;
  color: var(--muted,#64748b);
  font-size: 12px;
  line-height: 1.5;
}

.ba-analysis-list {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.ba-analysis-list section {
  display: grid;
  gap: 6px;
  padding: 10px;
  border-radius: 16px;
  background: color-mix(in srgb,var(--muted,#64748b) 8%,transparent);
}

.ba-analysis-list section > div:first-child {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.ba-analysis-list b,
.ba-analysis-list small {
  font-size: 12px;
}

.ba-analysis-list small {
  color: var(--muted,#64748b);
  font-weight: 850;
}

.ba-progress {
  height: 8px;
  border-radius: 999px;
  background: color-mix(in srgb,var(--muted,#64748b) 18%,transparent);
  overflow: hidden;
}

.ba-progress i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--ba-primary);
}

.ba-empty {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  min-height: 220px;
  text-align: center;
  border-style: dashed;
}

.ba-empty-icon {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: 22px;
  background: color-mix(in srgb,var(--ba-primary) 12%,var(--surface,#fff));
  font-size: 28px;
}

.ba-empty h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 1000;
}

.ba-empty p {
  margin: 0;
  color: var(--muted,#64748b);
  font-size: 13px;
  line-height: 1.6;
}

.ba-table-card {
  margin-top: 10px;
}

.ba-table-scroll {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  border-radius: 18px;
  border: 1px solid var(--border,rgba(0,0,0,.08));
}

.ba-table-scroll table {
  width: 100%;
  min-width: 1120px;
  border-collapse: collapse;
  background: var(--card-bg, var(--surface, var(--bg, transparent)));
}

.ba-table-scroll th,
.ba-table-scroll td {
  padding: 10px;
  border-bottom: 1px solid var(--border,rgba(0,0,0,.08));
  vertical-align: top;
  text-align: left;
  font-size: 13px;
}

.ba-table-scroll th {
  background: var(--table-header-bg, color-mix(in srgb, var(--ba-primary) 6%, var(--card-bg, var(--surface, var(--bg, transparent)))));
  color: var(--table-header-text, var(--muted, var(--text)));
  font-size: 11px;
  font-weight: 1000;
  text-transform: uppercase;
  letter-spacing: .07em;
}

.ba-table-scroll td strong,
.ba-table-scroll td span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ba-table-scroll td span {
  margin-top: 3px;
  color: var(--muted,#64748b);
  font-size: 11px;
}

.ba-table-actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 7px;
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.ba-table-actions::-webkit-scrollbar {
  display: none;
}

.ba-table-actions button {
  flex: 0 0 auto;
  min-height: 34px;
  border: 1px solid var(--border,rgba(0,0,0,.10));
  border-radius: 999px;
  padding: 0 10px;
  background: var(--surface,#fff);
  color: var(--text,#111827);
  font-size: 11px;
  font-weight: 950;
  cursor: pointer;
  white-space: nowrap;
}

.ba-table-actions button:first-child {
  background: var(--ba-primary);
  color: #fff;
  border-color: var(--ba-primary);
}

.ba-delete,
.ba-table-actions button.ba-delete {
  color: #991b1b;
  background: color-mix(in srgb,#dc2626 7%,var(--surface,#fff));
  border-color: color-mix(in srgb,#dc2626 24%,var(--border,rgba(0,0,0,.10)));
}

.ba-empty-table {
  padding: 22px;
  text-align: center;
  color: var(--muted,#64748b);
  font-weight: 850;
}

@media (min-width: 680px) {
  .ba-page {
    padding: calc(12px * var(--local-density-scale,1));
    padding-bottom: 44px;
  }

  .ba-search-card {
    grid-template-columns: minmax(0,1fr) 48px 48px 48px;
  }

  .ba-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .student-row {
    border-radius: 24px;
    padding: 12px;
  }

  .ba-analysis-grid {
    grid-template-columns: repeat(2, minmax(0,1fr));
  }

  .ba-form {
    grid-template-columns: repeat(2, minmax(0,1fr));
  }

  .ba-form.two {
    grid-template-columns: repeat(2, minmax(0,1fr));
  }

  .ba-modal-backdrop,
  .ba-sheet-backdrop {
    place-items: center;
    padding: 18px;
  }

  .ba-sheet {
    border-radius: 28px;
    padding: 18px;
  }

  .ba-modal {
    padding: 18px;
  }

}

@media (min-width: 1040px) {
  .ba-page {
    padding: calc(16px * var(--local-density-scale,1));
    padding-bottom: 48px;
  }

  .ba-search-card,
  .ba-summary-line,
  .ba-list,
  .ba-analysis-grid,
  .ba-table-card,
  .ba-filter-chips {
    max-width: 1180px;
    margin-left: auto;
    margin-right: auto;
  }

  .ba-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .ba-analysis-grid {
    grid-template-columns: repeat(4, minmax(0,1fr));
  }

  .ba-current-filter {
    grid-column: span 2;
  }

  .ba-form {
    grid-template-columns: repeat(3, minmax(0,1fr));
  }

  .ba-form.two {
    grid-template-columns: repeat(2, minmax(0,1fr));
  }

}

@media (max-width: 520px) {
  .ba-page {
    padding: calc(7px * var(--local-density-scale,1));
    padding-bottom: max(38px, env(safe-area-inset-bottom));
  }

  .ba-title h1 {
    font-size: 28px;
  }

  .ba-icon-button,
  .ba-filter-button,
  .ba-add-inline {
    width: 40px;
    height: 40px;
  }

  .ba-summary-line {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }

  .student-detail-strip {
    grid-template-columns: minmax(0,1fr);
  }

  .ba-sheet,
  .ba-modal {
    border-radius: 24px 24px 18px 18px;
    padding: 12px;
  }

  .ba-sheet-actions,
  .ba-modal-actions {
    display: grid;
    grid-template-columns: minmax(0,1fr);
  }

  .ba-sheet-actions button,
  .ba-modal-actions button {
    width: 100%;
  }
}


.ba-media-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.ba-media-button {
  min-height: 40px;
  border: 1px solid var(--ba-primary);
  border-radius: 999px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--ba-primary);
  color: #fff;
  font-size: 12px;
  font-weight: 950;
  cursor: pointer;
  text-align: center;
  box-shadow: 0 12px 26px color-mix(in srgb, var(--ba-primary) 18%, transparent);
}

.ba-media-button.secondary {
  background: var(--surface, #fff);
  color: var(--ba-primary);
  box-shadow: none;
}

.ba-media-hint {
  display: block;
  color: var(--muted, #64748b);
  font-size: 11px;
  font-weight: 750;
  line-height: 1.45;
}

.camera-backdrop {
  z-index: 100;
  place-items: center;
}

.ba-camera-modal {
  width: min(720px, 100%);
  max-height: min(92dvh, 880px);
  overflow-y: auto;
  padding: 14px;
  border-radius: 28px;
  background: var(--card-bg, var(--surface, #fff));
  border: 1px solid var(--border, rgba(0,0,0,.10));
  box-shadow: 0 30px 90px rgba(15,23,42,.35);
}

.ba-camera-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 24px;
  background: #020617;
  border: 1px solid var(--border, rgba(0,0,0,.10));
}

.ba-camera-preview video {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  background: #020617;
}

.ba-camera-loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(2,6,23,.72);
  color: #fff;
  font-size: 13px;
  font-weight: 950;
}

.ba-camera-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.ba-camera-actions button {
  min-height: 42px;
  border-radius: 999px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 950;
  cursor: pointer;
}

.ba-camera-secondary {
  border: 1px solid var(--border, rgba(0,0,0,.10));
  background: color-mix(in srgb, var(--muted, #64748b) 8%, var(--surface, #fff));
  color: var(--text, #111827);
}

.ba-camera-primary {
  border: 1px solid var(--ba-primary);
  background: var(--ba-primary);
  color: #fff;
  box-shadow: 0 14px 32px color-mix(in srgb, var(--ba-primary) 25%, transparent);
}

.ba-camera-actions button:disabled {
  opacity: .62;
  cursor: not-allowed;
}

@media (max-width: 520px) {
  .ba-media-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ba-media-button,
  .ba-camera-actions button {
    width: 100%;
  }

  .ba-camera-actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }

  .ba-camera-modal {
    border-radius: 22px;
    padding: 11px;
  }
}

/* ======================================================
   STUDENTS — BRANCH SETTINGS ACTION SYSTEM
   These declarations intentionally mirror Branchsettings.tsx.
   Do not create a second Students-specific color hierarchy here.
   ====================================================== */

/* Same compact Branch Settings search/action strip. */
.students-page .ba-search-card {
  grid-template-columns: minmax(0, 1fr) auto auto auto;
}

/* The + occupies the Branch Settings Save action slot while retaining its icon label. */
.students-page .settings-save-button {
  width: 42px;
  min-width: 42px;
  padding: 0;
  font-size: 25px;
  letter-spacing: 0;
}

/* Branch Settings primary action: Save / + / Upload / Apply / Done / Capture. */
.students-page .ba-add-inline,
.students-page .ba-modal-actions button:last-child,
.students-page .ba-sheet-actions .primary,
.students-page .ba-state-button,
.students-page .ba-camera-primary,
.students-page .ba-media-button:not(.secondary) {
  border-color: var(--ba-primary);
  background: var(--ba-primary);
  color: #fff !important;
  box-shadow: 0 12px 28px color-mix(in srgb, var(--ba-primary) 22%, transparent);
}

/* Branch Settings filter treatment. */
.students-page .ba-filter-button {
  position: relative;
  border-color: var(--border, rgba(0,0,0,.10));
  background: color-mix(in srgb, var(--ba-primary) 8%, var(--card-bg,#fff));
  color: var(--ba-primary) !important;
  box-shadow: 0 10px 22px rgba(15,23,42,.045);
}

.students-page .ba-filter-button.active {
  border-color: var(--ba-primary);
  background: var(--ba-primary);
  color: #fff !important;
}

.students-page .ba-filter-button b {
  border-color: var(--card-bg,#fff);
}

/* Branch Settings More action: neutral card/surface. */
.students-page .ba-icon-button {
  border-color: var(--border, rgba(0,0,0,.10));
  background: var(--card-bg, var(--surface,#fff));
  color: var(--text,#111827) !important;
  box-shadow: 0 10px 22px rgba(15,23,42,.045);
}

/* Branch Settings secondary hierarchy. */
.students-page .ba-media-button.secondary,
.students-page .ba-camera-secondary {
  border-color: var(--ba-primary);
  background: var(--surface,#fff);
  color: var(--ba-primary) !important;
  box-shadow: none;
}

.students-page .ba-cancel-button,
.students-page .ba-modal-actions button:not(:last-child),
.students-page .ba-sheet-actions button:not(.primary) {
  border-color: var(--border, rgba(0,0,0,.10));
  background: color-mix(in srgb, var(--muted,#64748b) 8%, var(--surface,#fff));
  color: var(--text,#111827) !important;
  box-shadow: none;
}

.students-page .ba-add-inline:hover,
.students-page .ba-filter-button.active:hover,
.students-page .ba-modal-actions button:last-child:hover,
.students-page .ba-sheet-actions .primary:hover,
.students-page .ba-state-button:hover,
.students-page .ba-camera-primary:hover,
.students-page .ba-media-button:not(.secondary):hover {
  filter: brightness(.96);
  transform: translateY(-1px);
}

.students-page .ba-filter-button:not(.active):hover {
  background: color-mix(in srgb, var(--ba-primary) 12%, var(--card-bg,#fff));
  transform: translateY(-1px);
}

.students-page .ba-icon-button:hover {
  background: color-mix(in srgb, var(--ba-primary) 4%, var(--card-bg, var(--surface,#fff)));
  transform: translateY(-1px);
}

.students-page .ba-media-button.secondary:hover,
.students-page .ba-camera-secondary:hover {
  background: color-mix(in srgb, var(--ba-primary) 7%, var(--surface,#fff));
  transform: translateY(-1px);
}

.students-page .ba-add-inline:focus-visible,
.students-page .ba-filter-button:focus-visible,
.students-page .ba-icon-button:focus-visible,
.students-page .ba-media-button:focus-visible,
.students-page .ba-camera-primary:focus-visible,
.students-page .ba-camera-secondary:focus-visible,
.students-page .ba-modal-actions button:focus-visible,
.students-page .ba-sheet-actions button:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--ba-primary) 28%, transparent);
  outline-offset: 2px;
}

.students-page button:disabled,
.students-page .ba-media-button[aria-disabled="true"] {
  cursor: not-allowed;
  opacity: .58;
  transform: none !important;
  filter: none !important;
  box-shadow: none !important;
}

.students-page .ba-search:focus-within {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ba-primary) 12%, transparent);
}

/* Subtle branch-color accents for records and data surfaces. */
.students-page .student-row {
  position: relative;
  overflow: hidden;
  border-color: color-mix(in srgb, var(--ba-primary) 15%, var(--border, rgba(0,0,0,.10)));
}

.students-page .student-row::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: var(--ba-primary);
  opacity: .78;
}

.students-page .student-row:hover,
.students-page .student-row:focus-within {
  border-color: color-mix(in srgb, var(--ba-primary) 46%, var(--border, rgba(0,0,0,.10)));
  background: color-mix(in srgb, var(--ba-primary) 5%, var(--card-bg, var(--surface, #fff)));
  box-shadow: 0 14px 30px color-mix(in srgb, var(--ba-primary) 10%, transparent);
}

.students-page .ba-avatar {
  border: 1px solid color-mix(in srgb, var(--ba-primary) 42%, transparent);
  box-shadow: 0 12px 24px color-mix(in srgb, var(--ba-primary) 18%, transparent);
}

.students-page .ba-filter-chips button,
.students-page .ba-chip.blue,
.students-page .ba-chip.purple {
  border-color: color-mix(in srgb, var(--ba-primary) 30%, transparent);
  background: color-mix(in srgb, var(--ba-primary) 10%, var(--card-bg, var(--surface, #fff)));
  color: var(--ba-primary);
}

.students-page .ba-table-scroll th {
  background: color-mix(in srgb, var(--ba-primary) 9%, var(--table-head, var(--card-bg, #fff)));
  color: var(--text, #111827);
}

.students-map-view {
  display: grid;
  gap: 10px;
}

.students-map-summary {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, var(--ba-primary) 16%, var(--border, rgba(0,0,0,.10)));
  border-radius: 14px;
  background: color-mix(in srgb, var(--ba-primary) 4%, var(--card-bg, var(--surface, #fff)));
}

.students-map-summary span {
  font-size: 12px;
  font-weight: 700;
}

.students-map-summary strong {
  color: var(--ba-primary);
  font-size: 17px;
}

.students-map-summary small {
  margin-left: auto;
  font-size: 10px;
  opacity: .64;
}

.students-map-empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 7px;
  padding: 24px;
  text-align: center;
  color: var(--text, #111827);
}

.students-map-empty > span {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  color: var(--ba-primary);
  background: color-mix(in srgb, var(--ba-primary) 10%, transparent);
  font-size: 22px;
}

.students-map-empty strong {
  font-size: 13px;
}

.students-map-empty small {
  max-width: 360px;
  font-size: 10px;
  line-height: 1.5;
  opacity: .62;
}

@media (max-width: 640px) {
  .students-map-summary {
    align-items: center;
    flex-wrap: wrap;
  }

  .students-map-summary small {
    width: 100%;
    margin-left: 0;
  }
}


.ba-section-heading-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.ba-section-heading-row h3 {
  margin: 0;
}

.ba-section-heading-row p {
  margin: 4px 0 0;
  color: var(--ba-muted);
  font-size: 0.78rem;
  line-height: 1.45;
}

.ba-location-options {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.ba-check-row {
  display: flex !important;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--ba-border);
  border-radius: 12px;
  background: var(--ba-card);
  cursor: pointer;
}

.ba-check-row input {
  width: 17px !important;
  height: 17px;
  margin-top: 2px;
  flex: 0 0 auto;
}

.ba-check-row > span {
  display: grid;
  gap: 2px;
}

.ba-check-row strong {
  font-size: 0.82rem;
}

.ba-check-row small {
  color: var(--ba-muted);
  font-size: 0.72rem;
  line-height: 1.35;
}

.ba-location-captured {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-top: 10px;
  padding: 9px 11px;
  border-radius: 11px;
  background: color-mix(in srgb, var(--ba-primary) 8%, var(--ba-card));
  border: 1px solid color-mix(in srgb, var(--ba-primary) 22%, var(--ba-border));
  font-size: 0.75rem;
}

.ba-location-captured small {
  color: var(--ba-muted);
}

.ba-location-captured button {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: var(--ba-primary);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 640px) {
  .ba-section-heading-row {
    align-items: stretch;
    flex-direction: column;
  }

  .ba-section-heading-row .ba-media-button {
    width: 100%;
  }

  .ba-location-captured button {
    margin-left: 0;
  }
}


/* Parent-specific extensions retained on top of the exact Students design system. */
.parent-detail-strip {
  display: grid;
  grid-template-columns: repeat(3,minmax(0,1fr));
  gap: 7px;
  margin-bottom: 10px;
}
.parent-detail-strip span {
  display: grid;
  gap: 4px;
  padding: 10px;
  border-radius: 16px;
  background: color-mix(in srgb,var(--muted,#64748b) 8%,transparent);
  color: var(--muted,#64748b);
  font-size: 11px;
  font-weight: 850;
  overflow: hidden;
}
.parent-detail-strip b {
  color: var(--text,#111827);
  font-size: 12px;
  font-weight: 1000;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.link-modal { width: min(720px, 100%); }
.link-list { display: grid; gap: 7px; margin: 0 0 10px; }
.link-list.compact { margin-bottom: 10px; }
.link-row {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px;
  border-radius: 16px;
  background: color-mix(in srgb,var(--muted,#64748b) 8%,transparent);
  border: 1px solid var(--border,rgba(0,0,0,.10));
}
.link-row div { min-width: 0; }
.link-row strong,
.link-row span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.link-row strong { font-size: 12px; font-weight: 1000; color: var(--text,#111827); }
.link-row span { margin-top: 2px; color: var(--muted,#64748b); font-size: 11px; font-weight: 800; }
.link-row button {
  flex: 0 0 auto;
  min-height: 32px;
  border: 1px solid color-mix(in srgb,#dc2626 20%,var(--border,rgba(0,0,0,.10)));
  border-radius: 999px;
  background: color-mix(in srgb,#dc2626 7%,var(--surface,#fff));
  color: #991b1b;
  font-size: 11px;
  font-weight: 950;
  cursor: pointer;
  padding: 0 10px;
}
.ba-check {
  min-height: 43px;
  display: flex !important;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 15px;
  background: color-mix(in srgb,var(--muted,#64748b) 8%,transparent);
  border: 1px solid var(--border,rgba(0,0,0,.10));
  color: var(--text,#111827);
  font-size: 13px;
  font-weight: 850;
}
.ba-check input { width: 18px; min-height: 18px; }
.ba-check span {
  color: var(--text,#111827);
  font-size: 13px;
  letter-spacing: 0;
  text-transform: none;
}
@media (min-width: 760px) {
  .link-form { grid-template-columns: repeat(2,minmax(0,1fr)); }
}
@media (max-width: 520px) {
  .parent-detail-strip { grid-template-columns: 1fr; }
}
`;
