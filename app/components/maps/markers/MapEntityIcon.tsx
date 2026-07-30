"use client";

import type { ReactNode } from "react";

export type MapEntityIconType =
  | "student"
  | "teacher"
  | "parent"
  | "branch"
  | "school"
  | "person"
  | "custom";

export interface MapEntityIconProps {
  entityType?: string | null;
  icon?: string | null;
  size?: number;
  strokeWidth?: number;
  fallback?: ReactNode;
}

function normalizeEntityType(
  entityType?: string | null,
  icon?: string | null,
): MapEntityIconType {
  const value = String(icon || entityType || "")
    .trim()
    .toLowerCase();

  if (
    value === "branch" ||
    value === "school" ||
    value === "school_branch" ||
    value === "school-branch" ||
    value === "building"
  ) {
    return "branch";
  }

  if (
    value === "student" ||
    value === "learner" ||
    value === "pupil"
  ) {
    return "student";
  }

  if (
    value === "teacher" ||
    value === "staff" ||
    value === "tutor"
  ) {
    return "teacher";
  }

  if (
    value === "parent" ||
    value === "guardian" ||
    value === "family"
  ) {
    return "parent";
  }

  if (value === "person" || value === "user") {
    return "person";
  }

  return "custom";
}

export function MapEntityIcon({
  entityType,
  icon,
  size = 18,
  strokeWidth = 1.8,
  fallback,
}: MapEntityIconProps) {
  const resolved = normalizeEntityType(entityType, icon);

  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
  };

  if (resolved === "branch") {
    return (
      <svg {...common}>
        <path d="M3.5 21h17" />
        <path d="M5 21V9.5L12 4l7 5.5V21" />
        <path d="M9 21v-5h6v5" />
        <path d="M8 11h1.5" />
        <path d="M14.5 11H16" />
        <path d="M8 14h1.5" />
        <path d="M14.5 14H16" />
        <path d="M10 7.5h4" />
      </svg>
    );
  }

  if (resolved === "teacher") {
    return (
      <svg {...common}>
        <circle cx="8.5" cy="8" r="3" />
        <path d="M3.5 20c.4-4 2.1-6 5-6 2.6 0 4.2 1.5 4.8 4.5" />
        <path d="M14 5h6.5v8H14" />
        <path d="m16 9 1.5 1.5L20 8" />
      </svg>
    );
  }

  if (resolved === "parent") {
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="2.8" />
        <circle cx="16.5" cy="9" r="2.3" />
        <path d="M3.5 20c.3-4 1.9-6 4.8-6 2.8 0 4.4 2 4.7 6" />
        <path d="M13.3 20c.2-3 1.4-4.5 3.5-4.5 2 0 3.2 1.5 3.4 4.5" />
      </svg>
    );
  }

  if (resolved === "student") {
    return (
      <svg {...common}>
        <circle cx="12" cy="9" r="3" />
        <path d="M6.5 20c.4-4 2.2-6 5.5-6s5.1 2 5.5 6" />
        <path d="m4 6 8-3 8 3-8 3-8-3Z" />
        <path d="M18 7.2v4.2" />
      </svg>
    );
  }

  if (resolved === "person") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 20c.5-4.2 2.6-6.4 6.5-6.4s6 2.2 6.5 6.4" />
      </svg>
    );
  }

  if (fallback !== undefined && fallback !== null) {
    return <>{fallback}</>;
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

export default MapEntityIcon;