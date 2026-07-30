"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMemo, useState } from "react";

export type EntityAvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface EntityAvatarProps {
  name?: string | null;
  imageUrl?: string | null;
  fallback?: ReactNode;
  size?: EntityAvatarSize;
  shape?: "circle" | "rounded" | "square";
  status?: "online" | "offline" | "busy" | "away" | null;
  alt?: string;
  title?: string;
  className?: string;
  style?: CSSProperties;
  imageStyle?: CSSProperties;
  decorative?: boolean;
  onClick?: () => void;
}

const SIZE_MAP: Record<EntityAvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 52,
  xl: 72,
};

function initialsFromName(name?: string | null): string {
  const normalized = String(name ?? "").trim();
  if (!normalized) return "?";

  const parts = normalized
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

function borderRadiusForShape(
  shape: EntityAvatarProps["shape"],
  size: number,
): number {
  if (shape === "square") return 4;
  if (shape === "rounded") return Math.max(8, Math.round(size * 0.24));
  return size / 2;
}

export function EntityAvatar({
  name,
  imageUrl,
  fallback,
  size = "md",
  shape = "circle",
  status = null,
  alt,
  title,
  className,
  style,
  imageStyle,
  decorative = false,
  onClick,
}: EntityAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const dimension = SIZE_MAP[size];

  const fallbackContent = useMemo(
    () => fallback ?? initialsFromName(name),
    [fallback, name],
  );

  const statusTone =
    status === "online"
      ? "var(--success, #16a34a)"
      : status === "busy"
        ? "var(--danger, #dc2626)"
        : status === "away"
          ? "var(--warning, #d97706)"
          : "var(--muted-foreground, #94a3b8)";

  const content = imageUrl && !imageFailed ? (
    <img
      src={imageUrl}
      alt={decorative ? "" : alt ?? name ?? "Avatar"}
      aria-hidden={decorative || undefined}
      onError={() => setImageFailed(true)}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        objectFit: "cover",
        ...imageStyle,
      }}
    />
  ) : (
    <span
      aria-hidden={decorative || undefined}
      style={{
        fontSize: Math.max(10, Math.round(dimension * 0.34)),
        fontWeight: 700,
        lineHeight: 1,
        userSelect: "none",
      }}
    >
      {fallbackContent}
    </span>
  );

  const avatar = (
    <span
      className={className}
      title={title}
      style={{
        position: "relative",
        width: dimension,
        height: dimension,
        minWidth: dimension,
        minHeight: dimension,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        borderRadius: borderRadiusForShape(shape, dimension),
        background: "var(--muted, #e2e8f0)",
        color: "var(--muted-foreground, #475569)",
        border: "1px solid var(--border, rgba(15, 23, 42, 0.12))",
        ...style,
      }}
    >
      {content}

      {status ? (
        <span
          aria-label={status}
          title={status}
          style={{
            position: "absolute",
            right: Math.max(1, Math.round(dimension * 0.03)),
            bottom: Math.max(1, Math.round(dimension * 0.03)),
            width: Math.max(7, Math.round(dimension * 0.22)),
            height: Math.max(7, Math.round(dimension * 0.22)),
            borderRadius: "50%",
            background: statusTone,
            border: "2px solid var(--background, #fff)",
          }}
        />
      ) : null}
    </span>
  );

  if (!onClick) return avatar;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={title ?? `Open ${name ?? "entity"}`}
      style={{
        display: "inline-flex",
        padding: 0,
        border: 0,
        background: "transparent",
        cursor: "pointer",
      }}
    >
      {avatar}
    </button>
  );
}

export default EntityAvatar;
