"use client";

import React from "react";
import { QRCodeCanvas } from "qrcode.react";

export type IdentityQrCodeSize = "small" | "medium" | "large";

const SIZE_PX: Record<IdentityQrCodeSize, number> = {
  small: 64,
  medium: 92,
  large: 124,
};

export type IdentityQrCodeProps = {
  value?: string | null;
  size?: IdentityQrCodeSize | number;
  label?: string;
  foregroundColor?: string;
  backgroundColor?: string;
  includeMargin?: boolean;
  className?: string;
};

export default function IdentityQrCode({
  value,
  size = "medium",
  label = "Credential QR code",
  foregroundColor = "#111827",
  backgroundColor = "#ffffff",
  includeMargin = true,
  className,
}: IdentityQrCodeProps) {
  const normalizedValue = String(value || "").trim();
  const resolvedSize =
    typeof size === "number" ? Math.max(40, size) : SIZE_PX[size];

  if (!normalizedValue) {
    return (
      <div
        className={className}
        aria-label="QR code unavailable"
        style={{
          width: resolvedSize,
          height: resolvedSize,
          display: "grid",
          placeItems: "center",
          border: "1px dashed currentColor",
          borderRadius: 10,
          fontSize: 10,
          opacity: 0.55,
          textAlign: "center",
          padding: 8,
        }}
      >
        No QR data
      </div>
    );
  }

  return (
    <div className={className} role="img" aria-label={label}>
      <QRCodeCanvas
        value={normalizedValue}
        size={resolvedSize}
        fgColor={foregroundColor}
        bgColor={backgroundColor}
        includeMargin={includeMargin}
        level="M"
      />
    </div>
  );
}
