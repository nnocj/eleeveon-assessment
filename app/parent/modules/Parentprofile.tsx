"use client";

/**
 * app/parent/modules/Parentprofile.tsx
 * --------------------------------------------------------------------------
 * ELEEVEON PARENT PORTAL — SELF-SERVICE PROFILE
 * --------------------------------------------------------------------------
 *
 * Parent-scoped and offline-first:
 * - resolves the active parent from the selected workspace membership;
 * - preserves string/UUID identifiers;
 * - only updates the current parent's permanent Parent record;
 * - protects accountId, schoolId, branchId, role, status and child links;
 * - uses updateLocal/createLocal for local-first sync-safe persistence.
 *
 * Media handling mirrors Branch Admin Parents.tsx:
 * - photo and cover photo are stored in mediaAssets/mediaBlobs;
 * - uploads are staged under a unique ownerTempKey;
 * - staged media is committed only after a permanent parent ID exists;
 * - supports upload and real camera capture;
 * - old photo fields remain fallback URLs only.
 *
 * UI:
 * - compact Parent/Students golden-standard styling;
 * - profile preview, edit form and privacy section;
 * - no permanent oversized hero;
 * - theme-safe and mobile-first.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useAccount } from "../../context/account-context";
import { useSettings } from "../../context/settings-context";
import { useActiveBranch } from "../../context/active-branch-context";
import { useActiveMembership } from "../../context/active-membership-context";

import { db, type Parent } from "../../lib/db/db";
import { createLocal, updateLocal } from "../../lib/sync/syncUtils";

import {
  attachCameraStreamToVideo,
  captureImageFileFromVideo,
  commitMediaAssetsToOwner,
  createMediaSessionKey,
  getCameraUnavailableMessage,
  isCameraApiAvailable,
  MediaFieldKeys,
  MediaOwners,
  openCameraStream,
  resolveOwnerMediaUrl,
  revokeMediaObjectUrl,
  saveImageAsset,
  stopCameraStream,
  type CameraFacingMode,
} from "../../lib/media/mediaAssetUtils";

import { useBackgroundLoader } from "../../hooks/useBackgroundLoader";
import { useBranchTableRevision } from "../../hooks/useBranchTableRevision";

type ToastTone = "success" | "error" | "info";
type CameraField = "photo" | "coverPhoto";
type UploadedMediaIds = Partial<Record<CameraField, string>>;
type Relationship = "father" | "mother" | "guardian";
type LocationType =
  | "home"
  | "workplace"
  | "pickup_point"
  | "dropoff_point"
  | "other";
type LocationSource = "manual" | "device_gps" | "geocoded" | "imported";
type LocationPrecision = "exact" | "approximate" | "area_only";

type TenantRow = {
  accountId?: string | null;
  schoolId?: string | null;
  branchId?: string | null;
  isDeleted?: boolean;
};

type WorkspaceSession = {
  membership?: Record<string, any> | null;
  membershipId?: string | null;
  role?: string | null;
  schoolId?: string | null;
  branchId?: string | null;
  parentId?: string | null;
  parentLocalId?: string | null;
  memberName?: string | null;
  fullName?: string | null;
  userName?: string | null;
};

type FormState = {
  id?: string;
  fullName: string;
  title: string;
  phone: string;
  email: string;
  occupation: string;
  emergencyContact: string;
  relationship: Relationship;
  address: string;
  addressLine1: string;
  addressLine2: string;
  locality: string;
  city: string;
  district: string;
  region: string;
  postalCode: string;
  country: string;
  locationLabel: string;
  formattedAddress: string;
  latitude: string;
  longitude: string;
  accuracyMeters: string;
  locationType: LocationType;
  locationSource: LocationSource;
  locationPrecision: LocationPrecision;
  locationCapturedAt?: number;
  mapVisible: boolean;
  locationConsentGiven: boolean;
  locationConsentAt?: number;
  locationRestricted: boolean;
  photo: string;
  photoMediaId?: string;
  coverPhoto: string;
  coverPhotoMediaId?: string;
};

const OPEN_WORKSPACE_KEY = "eleeveon_open_workspace";
const PARENT_MEDIA_OWNER_TABLE = MediaOwners.PARENTS;

const emptyForm: FormState = {
  fullName: "",
  title: "",
  phone: "",
  email: "",
  occupation: "",
  emergencyContact: "",
  relationship: "guardian",
  address: "",
  addressLine1: "",
  addressLine2: "",
  locality: "",
  city: "",
  district: "",
  region: "",
  postalCode: "",
  country: "Ghana",
  locationLabel: "",
  formattedAddress: "",
  latitude: "",
  longitude: "",
  accuracyMeters: "",
  locationType: "home",
  locationSource: "manual",
  locationPrecision: "approximate",
  locationCapturedAt: undefined,
  mapVisible: false,
  locationConsentGiven: false,
  locationConsentAt: undefined,
  locationRestricted: true,
  photo: "",
  photoMediaId: undefined,
  coverPhoto: "",
  coverPhotoMediaId: undefined,
};

const idOf = (value: unknown): string =>
  value === undefined || value === null ? "" : String(value).trim();

const cleanId = (value: unknown): string => {
  const valueId = idOf(value);
  return valueId && valueId !== "0" ? valueId : "";
};

const sameId = (a: unknown, b: unknown) => cleanId(a) === cleanId(b);

function firstId(...values: unknown[]) {
  for (const value of values) {
    const id = cleanId(value);
    if (id) return id;
  }
  return "";
}

function storageValue(key: string) {
  if (typeof window === "undefined") return null;
  try {
    return (
      window.localStorage.getItem(key) ||
      window.sessionStorage.getItem(key)
    );
  } catch {
    return null;
  }
}

function storedJson<T>(key: string): T | null {
  const raw = storageValue(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeRecordMediaValue(value?: string | null) {
  const media = String(value || "").trim();
  if (!media) return undefined;
  if (media.startsWith("blob:")) return undefined;
  if (media.startsWith("data:image/")) return undefined;
  return media;
}

function savedEntityId(result: unknown, fallback?: unknown) {
  if (typeof result === "string" || typeof result === "number") {
    return cleanId(result);
  }
  if (result && typeof result === "object") {
    const row = result as Record<string, unknown>;
    return firstId(row.id, row.localId, row.parentId, fallback);
  }
  return cleanId(fallback);
}

function readableTextColor(color: string) {
  const value = String(color || "").trim();
  if (!value.startsWith("#")) return "#ffffff";

  let hex = value.slice(1);
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((character) => character + character)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return "#ffffff";

  const number = Number.parseInt(hex, 16);
  const red = (number >> 16) & 255;
  const green = (number >> 8) & 255;
  const blue = number & 255;
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
  return brightness > 155 ? "#111827" : "#ffffff";
}

function relationshipLabel(value?: string) {
  if (!value) return "Guardian";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function Parentprofile() {
  const router = useRouter();
  const revision = useBranchTableRevision([
    "parents",
    "mediaAssets",
    "mediaBlobs",
  ]);
  const { loading, setLoading } = useBackgroundLoader();

  const {
    accountId,
    authenticated,
    loading: accountLoading,
  } = useAccount();

  const {
    settings,
    loading: settingsLoading,
  } = useSettings();

  const {
    activeSchool,
    activeSchoolId,
    activeBranch,
    activeBranchId,
    loading: contextLoading,
  } = useActiveBranch();

  const membershipContext = useActiveMembership() as any;
  const activeMembership = membershipContext?.activeMembership;

  const openWorkspace = useMemo(
    () => storedJson<WorkspaceSession>(OPEN_WORKSPACE_KEY),
    [],
  );

  const storedMembership = useMemo(
    () => storedJson<Record<string, any>>("activeMembership"),
    [],
  );

  const membership =
    openWorkspace?.membership ||
    activeMembership ||
    storedMembership ||
    {};

  const schoolId = firstId(
    openWorkspace?.schoolId,
    membership.schoolId,
    membership.school?.id,
    activeSchoolId,
    (activeSchool as any)?.id,
    (settings as any)?.schoolId,
    storageValue("activeSchoolId"),
  );

  const branchId = firstId(
    openWorkspace?.branchId,
    membership.branchId,
    membership.schoolBranchId,
    membership.branch?.id,
    activeBranchId,
    (activeBranch as any)?.id,
    (settings as any)?.branchId,
    storageValue("activeBranchId"),
  );

  const selectedParentId = firstId(
    openWorkspace?.parentLocalId,
    openWorkspace?.parentId,
    membership.parentLocalId,
    membership.localParentId,
    membership.parentId,
    membership.parent?.id,
    membershipContext?.activeParentId,
    storageValue("activeParentId"),
  );

  const primary =
    settings?.primaryColor || "var(--primary-color, #2563eb)";
  const primaryText = readableTextColor(primary);

  const [parent, setParent] = useState<Parent | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [photoUrl, setPhotoUrl] = useState<string>();
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string>();

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
  const [cameraField, setCameraField] =
    useState<CameraField>("photo");
  const [cameraFacing, setCameraFacing] =
    useState<CameraFacingMode>("user");
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraCapturing, setCameraCapturing] = useState(false);

  const sameTenant = (row: TenantRow) =>
    (!row.accountId || row.accountId === accountId) &&
    (!row.schoolId || sameId(row.schoolId, schoolId)) &&
    (!row.branchId || sameId(row.branchId, branchId)) &&
    !row.isDeleted;

  const notify = (tone: ToastTone, message: string) => {
    setToast({ tone, message });
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        setToast((current) =>
          current?.message === message ? null : current,
        );
      }, 4200);
    }
  };

  const updateForm = (patch: Partial<FormState>) =>
    setForm((current) => ({ ...current, ...patch }));

  const stopCurrentCamera = () => {
    stopCameraStream(cameraStreamRef.current);
    cameraStreamRef.current = null;
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
  };

  const resolveMedia = async (row: Parent | null) => {
    if (!row || !accountId) {
      setPhotoUrl(undefined);
      setCoverPhotoUrl(undefined);
      return;
    }

    const ownerId = cleanId(row.id);
    if (!ownerId) return;

    const [resolvedPhoto, resolvedCover] = await Promise.all([
      resolveOwnerMediaUrl({
        accountId,
        ownerTable: PARENT_MEDIA_OWNER_TABLE,
        ownerId,
        fieldKey: MediaFieldKeys.PHOTO,
        fallbackAssetId: row.photoMediaId,
      }),
      resolveOwnerMediaUrl({
        accountId,
        ownerTable: PARENT_MEDIA_OWNER_TABLE,
        ownerId,
        fieldKey: MediaFieldKeys.COVER_PHOTO,
        fallbackAssetId: row.coverPhotoMediaId,
      }),
    ]);

    setPhotoUrl(resolvedPhoto || safeRecordMediaValue(row.photo));
    setCoverPhotoUrl(
      resolvedCover || safeRecordMediaValue(row.coverPhoto),
    );
  };

  const populateForm = (row: Parent | null) => {
    if (!row) {
      setForm({
        ...emptyForm,
        fullName:
          String(
            membership.fullName ||
              openWorkspace?.memberName ||
              openWorkspace?.fullName ||
              openWorkspace?.userName ||
              "",
          ).trim(),
        email: String(
          membership.email || membership.parentEmail || "",
        ).trim(),
        phone: String(
          membership.phone || membership.parentPhone || "",
        ).trim(),
      });
      return;
    }

    const value = row as any;

    setForm({
      id: cleanId(value.id),
      fullName: String(value.fullName || ""),
      title: String(value.title || ""),
      phone: String(value.phone || ""),
      email: String(value.email || ""),
      occupation: String(value.occupation || ""),
      emergencyContact: String(value.emergencyContact || ""),
      relationship: value.relationship || "guardian",
      address: String(value.address || ""),
      addressLine1: String(value.addressLine1 || ""),
      addressLine2: String(value.addressLine2 || ""),
      locality: String(value.locality || ""),
      city: String(value.city || ""),
      district: String(value.district || ""),
      region: String(value.region || ""),
      postalCode: String(value.postalCode || ""),
      country: String(value.country || "Ghana"),
      locationLabel: String(value.locationLabel || ""),
      formattedAddress: String(value.formattedAddress || ""),
      latitude:
        value.latitude === undefined || value.latitude === null
          ? ""
          : String(value.latitude),
      longitude:
        value.longitude === undefined || value.longitude === null
          ? ""
          : String(value.longitude),
      accuracyMeters:
        value.accuracyMeters === undefined ||
        value.accuracyMeters === null
          ? ""
          : String(value.accuracyMeters),
      locationType: value.locationType || "home",
      locationSource: value.locationSource || "manual",
      locationPrecision:
        value.locationPrecision || "approximate",
      locationCapturedAt: value.locationCapturedAt,
      mapVisible: Boolean(value.mapVisible),
      locationConsentGiven: Boolean(value.locationConsentGiven),
      locationConsentAt: value.locationConsentAt,
      locationRestricted:
        value.locationRestricted === undefined
          ? true
          : Boolean(value.locationRestricted),
      photo: photoUrl || String(value.photo || ""),
      photoMediaId: value.photoMediaId,
      coverPhoto: coverPhotoUrl || String(value.coverPhoto || ""),
      coverPhotoMediaId: value.coverPhotoMediaId,
    });
  };

  const load = async () => {
    if (!authenticated || !accountId || !schoolId || !branchId) {
      setParent(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const rows = (await db.parents.toArray()).filter((row) =>
        sameTenant(row as TenantRow),
      );

      const membershipEmail = String(
        membership.email || membership.parentEmail || "",
      )
        .trim()
        .toLowerCase();

      const resolved =
        rows.find((row) =>
          selectedParentId
            ? sameId(row.id, selectedParentId)
            : false,
        ) ||
        rows.find(
          (row) =>
            membershipEmail &&
            String(row.email || "")
              .trim()
              .toLowerCase() === membershipEmail,
        ) ||
        null;

      setParent(resolved);
      await resolveMedia(resolved);
    } catch (error) {
      console.error("Failed to load parent profile:", error);
      setParent(null);
      notify("error", "Failed to load your parent profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountLoading || contextLoading) return;
    if (!authenticated || !accountId) {
      router.replace("/login");
    } else if (!schoolId || !branchId) {
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

  useEffect(() => {
    if (accountLoading || contextLoading || settingsLoading) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authenticated,
    accountId,
    schoolId,
    branchId,
    selectedParentId,
    accountLoading,
    contextLoading,
    settingsLoading,
    revision,
  ]);

  useEffect(() => {
    if (!editing) return;
    populateForm(parent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, parent, photoUrl, coverPhotoUrl]);

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
          await attachCameraStreamToVideo(
            cameraVideoRef.current,
            stream,
          );
        }
      } catch (error: any) {
        console.error("Failed to open parent camera:", error);
        notify(
          "error",
          error?.message || getCameraUnavailableMessage(),
        );
        setCameraOpen(false);
      } finally {
        if (!cancelled) setCameraStarting(false);
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      stopCurrentCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOpen, cameraFacing]);

  useEffect(() => {
    return () => {
      stopCurrentCamera();
      if (form.photo.startsWith("blob:")) {
        revokeMediaObjectUrl(form.photo);
      }
      if (form.coverPhoto.startsWith("blob:")) {
        revokeMediaObjectUrl(form.coverPhoto);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCameraForField = (field: CameraField) => {
    if (!isCameraApiAvailable()) {
      notify("error", getCameraUnavailableMessage());
      return;
    }

    setCameraField(field);
    setCameraFacing(field === "photo" ? "user" : "environment");
    setCameraOpen(true);
  };

  const closeCamera = () => {
    stopCurrentCamera();
    setCameraOpen(false);
    setCameraStarting(false);
    setCameraCapturing(false);
  };

  const handleImageUpload = async (
    field: CameraField,
    file?: File,
  ) => {
    if (!file || !accountId || !schoolId || !branchId) return;

    try {
      const result = await saveImageAsset(file, {
        accountId,
        schoolId,
        branchId,
        ownerTable: PARENT_MEDIA_OWNER_TABLE,
        ownerId: undefined,
        ownerTempKey: mediaSessionKeyRef.current,
        fieldKey:
          field === "photo"
            ? MediaFieldKeys.PHOTO
            : MediaFieldKeys.COVER_PHOTO,
        variant: field === "photo" ? "avatar" : "cover",
        replaceExisting: true,
      });

      const assetId = cleanId(result.assetId);
      if (!assetId) {
        throw new Error("No media asset ID was created.");
      }

      uploadedMediaIdsRef.current = {
        ...uploadedMediaIdsRef.current,
        [field]: assetId,
      };

      updateForm({
        [field]: result.previewUrl,
        [`${field}MediaId`]: assetId,
      } as Partial<FormState>);

      notify(
        "success",
        field === "photo"
          ? "Profile photo optimized."
          : "Cover photo optimized.",
      );
    } catch (error: any) {
      console.error("Failed to process parent image:", error);
      notify(
        "error",
        error?.message || "Failed to process image.",
      );
    }
  };

  const captureCameraPhoto = async () => {
    if (!cameraVideoRef.current) {
      notify("error", "Camera preview is not ready.");
      return;
    }

    try {
      setCameraCapturing(true);

      const file = await captureImageFileFromVideo(
        cameraVideoRef.current,
        {
          fileName: `${cameraField}-${Date.now()}.jpg`,
          mimeType: "image/jpeg",
          quality: 0.88,
          maxWidth: cameraField === "photo" ? 900 : 1440,
          maxHeight: 900,
        },
      );

      await handleImageUpload(cameraField, file);
      closeCamera();
    } catch (error: any) {
      console.error("Failed to capture parent image:", error);
      notify(
        "error",
        error?.message || "Failed to capture photo.",
      );
    } finally {
      setCameraCapturing(false);
    }
  };

  const useCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      notify("error", "Location is unavailable on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateForm({
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
          accuracyMeters: String(
            Math.round(position.coords.accuracy),
          ),
          locationSource: "device_gps",
          locationCapturedAt: Date.now(),
          locationConsentGiven: true,
          locationConsentAt: Date.now(),
        });
        notify("success", "Current location added.");
      },
      (error) => {
        notify(
          "error",
          error.message || "Unable to get your location.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
      },
    );
  };

  const validate = () => {
    if (!form.fullName.trim()) return "Enter your full name.";
    if (!form.phone.trim() && !form.email.trim()) {
      return "Enter at least a phone number or email address.";
    }

    if (
      form.latitude.trim() &&
      !Number.isFinite(Number(form.latitude))
    ) {
      return "Latitude must be a valid number.";
    }

    if (
      form.longitude.trim() &&
      !Number.isFinite(Number(form.longitude))
    ) {
      return "Longitude must be a valid number.";
    }

    return "";
  };

  const save = async (event?: React.FormEvent) => {
    event?.preventDefault();

    const validationError = validate();
    if (validationError) {
      notify("error", validationError);
      return;
    }

    if (!authenticated || !accountId || !schoolId || !branchId) {
      notify("error", "Your parent workspace is not ready.");
      return;
    }

    try {
      setSaving(true);

      const existing = parent as any;

      const payload: Partial<Parent> = {
        accountId,
        schoolId,
        branchId,
        fullName: form.fullName.trim(),
        title: form.title.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        occupation: form.occupation.trim() || undefined,
        emergencyContact:
          form.emergencyContact.trim() || undefined,
        relationship: form.relationship,
        address: form.address.trim() || undefined,
        addressLine1: form.addressLine1.trim() || undefined,
        addressLine2: form.addressLine2.trim() || undefined,
        locality: form.locality.trim() || undefined,
        city: form.city.trim() || undefined,
        district: form.district.trim() || undefined,
        region: form.region.trim() || undefined,
        postalCode: form.postalCode.trim() || undefined,
        country: form.country.trim() || undefined,
        locationLabel: form.locationLabel.trim() || undefined,
        formattedAddress:
          form.formattedAddress.trim() || undefined,
        latitude:
          form.latitude.trim() === ""
            ? undefined
            : Number(form.latitude),
        longitude:
          form.longitude.trim() === ""
            ? undefined
            : Number(form.longitude),
        accuracyMeters:
          form.accuracyMeters.trim() === ""
            ? undefined
            : Number(form.accuracyMeters),
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
        photo: safeRecordMediaValue(existing?.photo),
        photoMediaId:
          form.photoMediaId ||
          existing?.photoMediaId ||
          undefined,
        coverPhoto: safeRecordMediaValue(existing?.coverPhoto),
        coverPhotoMediaId:
          form.coverPhotoMediaId ||
          existing?.coverPhotoMediaId ||
          undefined,
        active: existing?.active ?? true,
        isDeleted: false,
      } as Partial<Parent>;

      const saved =
        existing?.id
          ? await updateLocal(
              "parents",
              cleanId(existing.id),
              payload,
            )
          : await createLocal(
              "parents",
              payload as Parent,
            );

      const savedParentId = savedEntityId(
        saved,
        existing?.id || selectedParentId,
      );

      if (!savedParentId) {
        throw new Error(
          "Profile saved, but its permanent parent ID was not resolved.",
        );
      }

      const committed = await commitMediaAssetsToOwner({
        accountId,
        ownerTable: PARENT_MEDIA_OWNER_TABLE,
        ownerId: savedParentId,
        ownerTempKey: mediaSessionKeyRef.current,
        assets: [
          {
            assetId:
              cleanId(uploadedMediaIdsRef.current.photo) ||
              undefined,
            fieldKey: MediaFieldKeys.PHOTO,
          },
          {
            assetId:
              cleanId(uploadedMediaIdsRef.current.coverPhoto) ||
              undefined,
            fieldKey: MediaFieldKeys.COVER_PHOTO,
          },
        ],
      });

      const committedPhotoId = committed.find(
        (item) => item.fieldKey === MediaFieldKeys.PHOTO,
      )?.assetId;

      const committedCoverId = committed.find(
        (item) =>
          item.fieldKey === MediaFieldKeys.COVER_PHOTO,
      )?.assetId;

      if (committedPhotoId || committedCoverId) {
        await updateLocal("parents", savedParentId, {
          photoMediaId:
            committedPhotoId ||
            form.photoMediaId ||
            existing?.photoMediaId ||
            undefined,
          coverPhotoMediaId:
            committedCoverId ||
            form.coverPhotoMediaId ||
            existing?.coverPhotoMediaId ||
            undefined,
          photo: safeRecordMediaValue(existing?.photo),
          coverPhoto: safeRecordMediaValue(existing?.coverPhoto),
        } as Partial<Parent>);
      }

      mediaSessionKeyRef.current =
        createMediaSessionKey(PARENT_MEDIA_OWNER_TABLE);
      uploadedMediaIdsRef.current = {};

      setEditing(false);
      notify("success", "Your profile was updated.");
      await load();
    } catch (error: any) {
      console.error("Failed to save parent profile:", error);
      notify(
        "error",
        error?.message || "Failed to update your profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    populateForm(parent);
    uploadedMediaIdsRef.current = {};
    mediaSessionKeyRef.current =
      createMediaSessionKey(PARENT_MEDIA_OWNER_TABLE);
    setEditing(false);
  };

  if (
    accountLoading ||
    contextLoading ||
    settingsLoading ||
    loading
  ) {
    return (
      <RouteState
        primary={primary}
        title="Opening Parent Profile..."
        text="Loading your parent record and media."
      />
    );
  }

  if (!authenticated || !accountId) {
    return (
      <RouteState
        primary={primary}
        title="Redirecting to login..."
        text="You must sign in before viewing your profile."
      />
    );
  }

  if (!schoolId || !branchId) {
    return (
      <RouteState
        primary={primary}
        title="No parent workspace selected"
        text="Open your parent membership again and return to Profile."
      />
    );
  }

  const displayName =
    parent?.fullName ||
    form.fullName ||
    openWorkspace?.memberName ||
    openWorkspace?.fullName ||
    "Parent";

  const displayPhoto =
    editing && form.photo ? form.photo : photoUrl;
  const displayCover =
    editing && form.coverPhoto
      ? form.coverPhoto
      : coverPhotoUrl;

  return (
    <main
      className="pp-page"
      style={
        {
          "--pp-primary": primary,
          "--pp-primary-text": primaryText,
        } as React.CSSProperties
      }
    >
      <style>{css}</style>

      {toast ? (
        <section className={`pp-toast ${toast.tone}`}>
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Close notification"
          >
            ×
          </button>
        </section>
      ) : null}

      <section className="pp-toolbar">
        <span
          className={`pp-status-dot ${
            parent ? "green" : "orange"
          }`}
          title={parent ? "Profile connected" : "Profile not yet created"}
        />

        <div className="pp-toolbar-copy">
          <strong>Parent Profile</strong>
          <small>
            {parent
              ? "Your personal information"
              : "Complete your parent profile"}
          </small>
        </div>

        {!editing ? (
          <button
            type="button"
            className="pp-primary-button"
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
        ) : (
          <button
            type="button"
            className="pp-icon-button"
            onClick={cancelEdit}
            aria-label="Cancel editing"
          >
            ×
          </button>
        )}
      </section>

      <section className="pp-profile-card">
        <div
          className="pp-cover"
          style={{
            background: displayCover
              ? `url("${displayCover}") center/cover`
              : `linear-gradient(135deg, ${primary}, color-mix(in srgb, ${primary} 42%, #111827))`,
          }}
        >
          {editing ? (
            <div className="pp-cover-actions">
              <label>
                Upload cover
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    void handleImageUpload(
                      "coverPhoto",
                      event.target.files?.[0],
                    )
                  }
                />
              </label>
              <button
                type="button"
                onClick={() => openCameraForField("coverPhoto")}
              >
                Take photo
              </button>
            </div>
          ) : null}
        </div>

        <div className="pp-profile-main">
          <div className="pp-photo-wrap">
            <Avatar
              name={displayName}
              photo={displayPhoto}
              primary={primary}
            />

            {editing ? (
              <div className="pp-photo-actions">
                <label title="Upload profile photo">
                  +
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      void handleImageUpload(
                        "photo",
                        event.target.files?.[0],
                      )
                    }
                  />
                </label>
                <button
                  type="button"
                  onClick={() => openCameraForField("photo")}
                  title="Take profile photo"
                >
                  ◉
                </button>
              </div>
            ) : null}
          </div>

          <div className="pp-profile-copy">
            <h1>{displayName}</h1>
            <p>
              {parent?.email || form.email || "No email"}
              {(parent?.phone || form.phone)
                ? ` · ${parent?.phone || form.phone}`
                : ""}
            </p>
            <div className="pp-chips">
              <Chip tone="blue">
                {relationshipLabel(
                  parent?.relationship || form.relationship,
                )}
              </Chip>
              <Chip tone={parent ? "green" : "orange"}>
                {parent ? "Connected profile" : "Profile setup"}
              </Chip>
            </div>
          </div>
        </div>
      </section>

      {!editing ? (
        <section className="pp-details-grid">
          <Detail
            label="Full Name"
            value={parent?.fullName || "Not set"}
          />
          <Detail
            label="Title"
            value={parent?.title || "Not set"}
          />
          <Detail
            label="Phone"
            value={parent?.phone || "Not set"}
          />
          <Detail
            label="Email"
            value={parent?.email || "Not set"}
          />
          <Detail
            label="Occupation"
            value={parent?.occupation || "Not set"}
          />
          <Detail
            label="Emergency Contact"
            value={parent?.emergencyContact || "Not set"}
          />
          <Detail
            label="Address"
            value={
              parent?.formattedAddress ||
              parent?.address ||
              "Not set"
            }
            wide
          />
          <Detail
            label="Location Privacy"
            value={
              (parent as any)?.locationRestricted
                ? "Restricted"
                : (parent as any)?.mapVisible
                  ? "Visible to authorized school staff"
                  : "Hidden"
            }
          />
        </section>
      ) : (
        <form className="pp-form" onSubmit={save}>
          <section className="pp-form-section">
            <div className="pp-section-head">
              <div>
                <strong>Personal Information</strong>
                <small>Information used by the school to contact you.</small>
              </div>
            </div>

            <div className="pp-form-grid">
              <Field label="Full Name" required>
                <input
                  value={form.fullName}
                  onChange={(event) =>
                    updateForm({ fullName: event.target.value })
                  }
                  placeholder="Your full name"
                />
              </Field>

              <Field label="Title">
                <select
                  value={form.title}
                  onChange={(event) =>
                    updateForm({ title: event.target.value })
                  }
                >
                  <option value="">No title</option>
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Ms">Ms</option>
                  <option value="Dr">Dr</option>
                  <option value="Prof">Prof</option>
                  <option value="Rev">Rev</option>
                </select>
              </Field>

              <Field label="Phone">
                <input
                  value={form.phone}
                  onChange={(event) =>
                    updateForm({ phone: event.target.value })
                  }
                  placeholder="+233..."
                  inputMode="tel"
                />
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateForm({ email: event.target.value })
                  }
                  placeholder="name@example.com"
                />
              </Field>

              <Field label="Occupation">
                <input
                  value={form.occupation}
                  onChange={(event) =>
                    updateForm({ occupation: event.target.value })
                  }
                  placeholder="Occupation"
                />
              </Field>

              <Field label="Emergency Contact">
                <input
                  value={form.emergencyContact}
                  onChange={(event) =>
                    updateForm({
                      emergencyContact: event.target.value,
                    })
                  }
                  placeholder="Emergency phone or contact"
                />
              </Field>

              <Field label="Relationship">
                <select
                  value={form.relationship}
                  onChange={(event) =>
                    updateForm({
                      relationship: event.target
                        .value as Relationship,
                    })
                  }
                >
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="guardian">Guardian</option>
                </select>
              </Field>
            </div>
          </section>

          <section className="pp-form-section">
            <div className="pp-section-head">
              <div>
                <strong>Address</strong>
                <small>Your residential or contact address.</small>
              </div>
            </div>

            <div className="pp-form-grid">
              <Field label="Address" wide>
                <input
                  value={form.address}
                  onChange={(event) =>
                    updateForm({ address: event.target.value })
                  }
                  placeholder="Main address"
                />
              </Field>

              <Field label="Address Line 1">
                <input
                  value={form.addressLine1}
                  onChange={(event) =>
                    updateForm({ addressLine1: event.target.value })
                  }
                />
              </Field>

              <Field label="Address Line 2">
                <input
                  value={form.addressLine2}
                  onChange={(event) =>
                    updateForm({ addressLine2: event.target.value })
                  }
                />
              </Field>

              <Field label="Locality">
                <input
                  value={form.locality}
                  onChange={(event) =>
                    updateForm({ locality: event.target.value })
                  }
                />
              </Field>

              <Field label="City">
                <input
                  value={form.city}
                  onChange={(event) =>
                    updateForm({ city: event.target.value })
                  }
                />
              </Field>

              <Field label="District">
                <input
                  value={form.district}
                  onChange={(event) =>
                    updateForm({ district: event.target.value })
                  }
                />
              </Field>

              <Field label="Region">
                <input
                  value={form.region}
                  onChange={(event) =>
                    updateForm({ region: event.target.value })
                  }
                />
              </Field>

              <Field label="Postal Code">
                <input
                  value={form.postalCode}
                  onChange={(event) =>
                    updateForm({ postalCode: event.target.value })
                  }
                />
              </Field>

              <Field label="Country">
                <input
                  value={form.country}
                  onChange={(event) =>
                    updateForm({ country: event.target.value })
                  }
                />
              </Field>
            </div>
          </section>

          <section className="pp-form-section">
            <div className="pp-section-head">
              <div>
                <strong>Location & Privacy</strong>
                <small>
                  Optional location information for authorized school use.
                </small>
              </div>

              <button
                type="button"
                className="pp-secondary-button"
                onClick={useCurrentLocation}
              >
                Use current location
              </button>
            </div>

            <div className="pp-form-grid">
              <Field label="Location Label">
                <input
                  value={form.locationLabel}
                  onChange={(event) =>
                    updateForm({
                      locationLabel: event.target.value,
                    })
                  }
                  placeholder="Home, workplace, pickup point"
                />
              </Field>

              <Field label="Formatted Address">
                <input
                  value={form.formattedAddress}
                  onChange={(event) =>
                    updateForm({
                      formattedAddress: event.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Latitude">
                <input
                  value={form.latitude}
                  onChange={(event) =>
                    updateForm({ latitude: event.target.value })
                  }
                  inputMode="decimal"
                />
              </Field>

              <Field label="Longitude">
                <input
                  value={form.longitude}
                  onChange={(event) =>
                    updateForm({ longitude: event.target.value })
                  }
                  inputMode="decimal"
                />
              </Field>

              <Field label="Location Type">
                <select
                  value={form.locationType}
                  onChange={(event) =>
                    updateForm({
                      locationType: event.target
                        .value as LocationType,
                    })
                  }
                >
                  <option value="home">Home</option>
                  <option value="workplace">Workplace</option>
                  <option value="pickup_point">Pickup Point</option>
                  <option value="dropoff_point">Drop-off Point</option>
                  <option value="other">Other</option>
                </select>
              </Field>

              <Field label="Precision">
                <select
                  value={form.locationPrecision}
                  onChange={(event) =>
                    updateForm({
                      locationPrecision: event.target
                        .value as LocationPrecision,
                    })
                  }
                >
                  <option value="exact">Exact</option>
                  <option value="approximate">Approximate</option>
                  <option value="area_only">Area Only</option>
                </select>
              </Field>
            </div>

            <div className="pp-toggle-list">
              <Toggle
                label="I consent to storing this location"
                text="The location will only be available to authorized school users."
                checked={form.locationConsentGiven}
                onChange={(checked) =>
                  updateForm({
                    locationConsentGiven: checked,
                    locationConsentAt: checked
                      ? form.locationConsentAt || Date.now()
                      : undefined,
                  })
                }
              />

              <Toggle
                label="Allow location on authorized school maps"
                text="Turn this off to keep the location hidden from map views."
                checked={form.mapVisible}
                onChange={(checked) =>
                  updateForm({ mapVisible: checked })
                }
              />

              <Toggle
                label="Restrict location access"
                text="Recommended for personal residential addresses."
                checked={form.locationRestricted}
                onChange={(checked) =>
                  updateForm({ locationRestricted: checked })
                }
              />
            </div>
          </section>

          <section className="pp-protected-note">
            <span>🔒</span>
            <div>
              <strong>School-controlled information is protected</strong>
              <p>
                Your role, school, branch, account membership and linked
                children cannot be changed from this page.
              </p>
            </div>
          </section>

          <div className="pp-form-actions">
            <button
              type="button"
              className="pp-secondary-button"
              onClick={cancelEdit}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="pp-primary-button"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      )}

      {cameraOpen ? (
        <div className="pp-camera-layer">
          <section className="pp-camera">
            <div className="pp-camera-head">
              <div>
                <strong>
                  {cameraField === "photo"
                    ? "Take Profile Photo"
                    : "Take Cover Photo"}
                </strong>
                <small>
                  Use a clear, well-lit image.
                </small>
              </div>
              <button type="button" onClick={closeCamera}>
                ×
              </button>
            </div>

            <div className="pp-camera-preview">
              <video
                ref={cameraVideoRef}
                autoPlay
                muted
                playsInline
              />
              {cameraStarting ? (
                <div className="pp-camera-loading">
                  Starting camera...
                </div>
              ) : null}
            </div>

            <div className="pp-camera-actions">
              <button
                type="button"
                className="pp-secondary-button"
                onClick={() =>
                  setCameraFacing((current) =>
                    current === "user"
                      ? "environment"
                      : "user",
                  )
                }
                disabled={cameraStarting || cameraCapturing}
              >
                Flip Camera
              </button>
              <button
                type="button"
                className="pp-primary-button"
                onClick={() => void captureCameraPhoto()}
                disabled={cameraStarting || cameraCapturing}
              >
                {cameraCapturing ? "Capturing..." : "Capture"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
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
      className="pp-avatar"
      style={{
        background: photo
          ? `url("${photo}") center/cover`
          : primary,
        color: photo
          ? "#ffffff"
          : readableTextColor(primary),
      }}
    >
      {!photo
        ? String(name || "P")
            .slice(0, 1)
            .toUpperCase()
        : null}
    </div>
  );
}

function Chip({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "green" | "blue" | "orange" | "gray";
}) {
  return <span className={`pp-chip ${tone}`}>{children}</span>;
}

function Detail({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <article className={`pp-detail ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Field({
  label,
  children,
  required = false,
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "wide" : ""}>
      <span>
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  text,
  checked,
  onChange,
}: {
  label: string;
  text: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="pp-toggle">
      <span>
        <strong>{label}</strong>
        <small>{text}</small>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <i />
    </label>
  );
}

function RouteState({
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
      className="pp-page"
      style={
        {
          "--pp-primary": primary,
          "--pp-primary-text": readableTextColor(primary),
        } as React.CSSProperties
      }
    >
      <style>{css}</style>
      <section className="pp-state">
        <div className="pp-spinner" />
        <h2>{title}</h2>
        <p>{text}</p>
      </section>
    </main>
  );
}

const css = `
@keyframes ppSpin{to{transform:rotate(360deg)}}
.pp-page{
  min-height:100dvh;
  width:100%;
  min-width:0;
  display:grid;
  align-content:start;
  gap:8px;
  padding:8px;
  padding-bottom:max(40px,env(safe-area-inset-bottom));
  background:var(--bg,#f7f8fb);
  color:var(--text,#111827);
  font-family:var(--font-family,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);
  font-size:var(--font-size,14px);
}
.pp-page *,.pp-page *::before,.pp-page *::after{box-sizing:border-box;min-width:0}
.pp-page button,.pp-page input,.pp-page select{font:inherit;max-width:100%}
.pp-toolbar,.pp-profile-card,.pp-detail,.pp-form-section,.pp-protected-note,.pp-state{
  background:var(--card-bg,var(--surface,#fff));
  border:1px solid var(--border,rgba(0,0,0,.10));
}
.pp-toolbar{
  display:grid;
  grid-template-columns:auto minmax(0,1fr) auto;
  align-items:center;
  gap:8px;
  padding:8px;
  border-radius:15px;
}
.pp-status-dot{
  width:9px;height:9px;border-radius:999px;
  box-shadow:0 0 0 3px color-mix(in srgb,currentColor 11%,transparent);
}
.pp-status-dot.green{background:#22c55e}
.pp-status-dot.orange{background:#f59e0b}
.pp-toolbar-copy{display:grid;gap:1px}
.pp-toolbar-copy strong{font-size:11px;font-weight:1000}
.pp-toolbar-copy small{color:var(--muted,#64748b);font-size:8.5px}
.pp-primary-button,.pp-secondary-button,.pp-icon-button{
  min-height:36px;
  border-radius:10px;
  padding:0 12px;
  font-size:9px;
  font-weight:950;
  cursor:pointer;
}
.pp-primary-button{
  border:1px solid var(--pp-primary);
  background:var(--pp-primary);
  color:var(--pp-primary-text);
}
.pp-secondary-button{
  border:1px solid var(--border,rgba(0,0,0,.10));
  background:var(--surface,#fff);
  color:var(--text,#111827);
}
.pp-icon-button{
  width:36px;padding:0;
  border:1px solid var(--border,rgba(0,0,0,.10));
  background:var(--surface,#fff);
  color:var(--text,#111827);
  font-size:17px;
}
.pp-profile-card{
  overflow:hidden;
  border-radius:17px;
}
.pp-cover{
  position:relative;
  min-height:130px;
}
.pp-cover-actions{
  position:absolute;
  right:8px;
  bottom:8px;
  display:flex;
  gap:5px;
}
.pp-cover-actions label,.pp-cover-actions button{
  min-height:31px;
  display:inline-flex;
  align-items:center;
  border:1px solid rgba(255,255,255,.34);
  border-radius:9px;
  padding:0 9px;
  background:rgba(15,23,42,.64);
  color:#fff;
  font-size:8px;
  font-weight:900;
  cursor:pointer;
  backdrop-filter:blur(8px);
}
.pp-cover-actions input,.pp-photo-actions input{display:none}
.pp-profile-main{
  display:flex;
  align-items:flex-end;
  gap:10px;
  padding:0 10px 11px;
}
.pp-photo-wrap{
  position:relative;
  flex:0 0 auto;
  margin-top:-31px;
}
.pp-avatar{
  width:68px;height:68px;
  display:grid;place-items:center;
  border:4px solid var(--card-bg,var(--surface,#fff));
  border-radius:20px;
  font-size:23px;font-weight:1000;
  overflow:hidden;
  box-shadow:0 10px 24px rgba(15,23,42,.15);
}
.pp-photo-actions{
  position:absolute;
  right:-5px;
  bottom:-5px;
  display:flex;
  gap:3px;
}
.pp-photo-actions label,.pp-photo-actions button{
  width:26px;height:26px;
  display:grid;place-items:center;
  border:2px solid var(--card-bg,var(--surface,#fff));
  border-radius:999px;
  background:var(--pp-primary);
  color:var(--pp-primary-text);
  font-size:11px;
  font-weight:1000;
  cursor:pointer;
}
.pp-profile-copy{padding-top:8px}
.pp-profile-copy h1{
  margin:0;
  font-size:17px;
  font-weight:1000;
  letter-spacing:-.04em;
}
.pp-profile-copy p{
  margin:3px 0 0;
  color:var(--muted,#64748b);
  font-size:9px;
}
.pp-chips{
  display:flex;
  flex-wrap:wrap;
  gap:5px;
  margin-top:6px;
}
.pp-chip{
  min-height:23px;
  display:inline-flex;
  align-items:center;
  padding:3px 7px;
  border-radius:999px;
  font-size:8px;
  font-weight:950;
}
.pp-chip.green{background:rgba(34,197,94,.12);color:#15803d}
.pp-chip.blue{background:rgba(59,130,246,.12);color:#1d4ed8}
.pp-chip.orange{background:rgba(245,158,11,.14);color:#b45309}
.pp-chip.gray{background:color-mix(in srgb,var(--muted,#64748b) 12%,transparent);color:var(--muted,#64748b)}
.pp-details-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:7px;
}
.pp-detail{
  display:grid;
  gap:4px;
  min-height:65px;
  align-content:center;
  padding:9px;
  border-radius:12px;
}
.pp-detail.wide{grid-column:1/-1}
.pp-detail span{
  color:var(--muted,#64748b);
  font-size:8px;
  font-weight:900;
  text-transform:uppercase;
  letter-spacing:.04em;
}
.pp-detail strong{
  overflow-wrap:anywhere;
  font-size:10px;
  line-height:1.45;
}
.pp-form{display:grid;gap:8px}
.pp-form-section{
  padding:10px;
  border-radius:14px;
}
.pp-section-head{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:8px;
  padding-bottom:9px;
  border-bottom:1px solid var(--border,rgba(0,0,0,.08));
}
.pp-section-head strong,.pp-section-head small{display:block}
.pp-section-head strong{font-size:11px;font-weight:1000}
.pp-section-head small{
  margin-top:2px;
  color:var(--muted,#64748b);
  font-size:8px;
  line-height:1.45;
}
.pp-form-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:8px;
  padding-top:9px;
}
.pp-form-grid label{
  display:grid;
  gap:4px;
}
.pp-form-grid label.wide{grid-column:1/-1}
.pp-form-grid label>span{
  color:var(--muted,#64748b);
  font-size:8px;
  font-weight:900;
  text-transform:uppercase;
  letter-spacing:.04em;
}
.pp-form-grid input,.pp-form-grid select{
  width:100%;
  min-height:39px;
  border:1px solid var(--input-border,var(--border,rgba(0,0,0,.10)));
  border-radius:10px;
  padding:0 10px;
  background:var(--input-bg,var(--surface,#fff));
  color:var(--input-text,var(--text,#111827));
  outline:none;
  font-size:9px;
  font-weight:760;
}
.pp-form-grid input:focus,.pp-form-grid select:focus{
  border-color:var(--pp-primary);
  box-shadow:0 0 0 3px color-mix(in srgb,var(--pp-primary) 10%,transparent);
}
.pp-toggle-list{
  display:grid;
  gap:6px;
  padding-top:9px;
}
.pp-toggle{
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  align-items:center;
  gap:8px;
  padding:8px;
  border:1px solid var(--border,rgba(0,0,0,.08));
  border-radius:11px;
}
.pp-toggle strong,.pp-toggle small{display:block}
.pp-toggle strong{font-size:9px}
.pp-toggle small{
  margin-top:2px;
  color:var(--muted,#64748b);
  font-size:7.5px;
  line-height:1.4;
}
.pp-toggle input{position:absolute;opacity:0;pointer-events:none}
.pp-toggle i{
  position:relative;
  width:34px;height:20px;
  border-radius:999px;
  background:color-mix(in srgb,var(--muted,#64748b) 22%,transparent);
  transition:.18s ease;
}
.pp-toggle i::after{
  content:"";
  position:absolute;
  top:3px;left:3px;
  width:14px;height:14px;
  border-radius:999px;
  background:#fff;
  box-shadow:0 2px 5px rgba(15,23,42,.2);
  transition:.18s ease;
}
.pp-toggle input:checked+i{background:var(--pp-primary)}
.pp-toggle input:checked+i::after{transform:translateX(14px)}
.pp-protected-note{
  display:flex;
  align-items:flex-start;
  gap:8px;
  padding:9px;
  border-radius:12px;
  background:color-mix(in srgb,var(--pp-primary) 5%,var(--surface,#fff));
}
.pp-protected-note strong,.pp-protected-note p{display:block;margin:0}
.pp-protected-note strong{font-size:9px}
.pp-protected-note p{
  margin-top:2px;
  color:var(--muted,#64748b);
  font-size:7.5px;
  line-height:1.5;
}
.pp-form-actions{
  position:sticky;
  bottom:6px;
  display:flex;
  justify-content:flex-end;
  gap:6px;
  padding:8px;
  border:1px solid var(--border,rgba(0,0,0,.10));
  border-radius:12px;
  background:color-mix(in srgb,var(--card-bg,var(--surface,#fff)) 94%,transparent);
  backdrop-filter:blur(12px);
}
.pp-toast{
  position:sticky;
  top:8px;
  z-index:60;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
  padding:8px 10px;
  border:1px solid var(--border,rgba(0,0,0,.10));
  border-radius:11px;
  background:var(--surface,#fff);
  font-size:9px;
  font-weight:850;
}
.pp-toast.success{border-color:rgba(34,197,94,.35)}
.pp-toast.error{border-color:rgba(239,68,68,.35)}
.pp-toast.info{border-color:rgba(59,130,246,.35)}
.pp-toast button{
  border:0;background:transparent;color:inherit;font-size:16px;cursor:pointer;
}
.pp-camera-layer{
  position:fixed;
  inset:0;
  z-index:100;
  display:grid;
  place-items:center;
  padding:10px;
  background:rgba(15,23,42,.62);
  backdrop-filter:blur(8px);
}
.pp-camera{
  width:min(580px,100%);
  overflow:hidden;
  border-radius:16px;
  background:var(--surface,#fff);
  color:var(--text,#111827);
}
.pp-camera-head{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:8px;
  padding:10px;
}
.pp-camera-head strong,.pp-camera-head small{display:block}
.pp-camera-head strong{font-size:11px}
.pp-camera-head small{margin-top:2px;color:var(--muted,#64748b);font-size:8px}
.pp-camera-head button{
  width:31px;height:31px;
  border:1px solid var(--border,rgba(0,0,0,.10));
  border-radius:9px;
  background:transparent;
  color:inherit;
  font-size:18px;
}
.pp-camera-preview{
  position:relative;
  min-height:300px;
  background:#020617;
}
.pp-camera-preview video{
  display:block;
  width:100%;
  min-height:300px;
  object-fit:cover;
}
.pp-camera-loading{
  position:absolute;
  inset:0;
  display:grid;
  place-items:center;
  color:#fff;
  font-size:10px;
}
.pp-camera-actions{
  display:flex;
  justify-content:flex-end;
  gap:7px;
  padding:10px;
}
.pp-state{
  min-height:min(420px,calc(100dvh - 32px));
  width:min(520px,100%);
  margin:0 auto;
  display:grid;
  place-items:center;
  align-content:center;
  gap:8px;
  padding:22px;
  border-radius:18px;
  text-align:center;
}
.pp-spinner{
  width:34px;height:34px;
  border:4px solid color-mix(in srgb,var(--pp-primary) 18%,transparent);
  border-top-color:var(--pp-primary);
  border-radius:999px;
  animation:ppSpin .8s linear infinite;
}
.pp-state h2,.pp-state p{margin:0}
.pp-state h2{font-size:17px}
.pp-state p{color:var(--muted,#64748b);font-size:9px;line-height:1.55}
@media(min-width:720px){
  .pp-page{padding:12px;gap:10px}
  .pp-toolbar,.pp-profile-card,.pp-details-grid,.pp-form{width:min(920px,100%);margin-left:auto;margin-right:auto}
  .pp-cover{min-height:180px}
  .pp-avatar{width:78px;height:78px;border-radius:23px}
  .pp-details-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
  .pp-detail.wide{grid-column:span 2}
}
@media(max-width:560px){
  .pp-page{padding:7px}
  .pp-cover{min-height:110px}
  .pp-profile-main{align-items:center}
  .pp-avatar{width:62px;height:62px}
  .pp-profile-copy h1{font-size:15px}
  .pp-details-grid,.pp-form-grid{grid-template-columns:1fr}
  .pp-detail.wide,.pp-form-grid label.wide{grid-column:auto}
  .pp-section-head{display:grid}
  .pp-section-head .pp-secondary-button{justify-self:start}
  .pp-form-actions{display:grid;grid-template-columns:1fr 1fr}
}
`;
