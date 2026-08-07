"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
} from "react";

export type AvatarSize =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl";

export interface AvatarProps {
  src?: string | null;
  name: string;
  alt?: string;
  size?: AvatarSize;
  status?:
    | "online"
    | "offline"
    | "busy"
    | "away"
    | null;
  shape?:
    | "circle"
    | "rounded";
  className?: string;
  style?: CSSProperties;
}

function initials(name: string) {
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

export default function Avatar({
  src,
  name,
  alt = "",
  size = "md",
  status = null,
  shape = "circle",
  className,
  style,
}: AvatarProps) {
  const [
    failed,
    setFailed,
  ] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <span
      className={[
        "eds-avatar",
        `eds-avatar-${size}`,
        `eds-avatar-${shape}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      title={name}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          onError={() =>
            setFailed(true)
          }
        />
      ) : (
        <span aria-hidden="true">
          {initials(name) || "E"}
        </span>
      )}

      {status ? (
        <span
          className={`eds-avatar-status eds-avatar-status-${status}`}
          aria-label={status}
        />
      ) : null}
    </span>
  );
}
