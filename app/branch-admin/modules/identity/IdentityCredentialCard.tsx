"use client";

import React from "react";
import type {
  IdentityCredential,
  IdentityCredentialDesignSetting,
} from "../../../lib/db/db";
import IdentityQrCode from "./IdentityQrCode";

export type IdentityCredentialCardSubject = {
  fullName: string;
  admissionNumber?: string | null;
  staffNumber?: string | null;
  className?: string | null;
  organizationName?: string | null;
  academicYear?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  phone?: string | null;
  emergencyPhone?: string | null;
  photoUrl?: string | null;
};

export type IdentityCredentialCardBranding = {
  schoolName: string;
  branchName?: string | null;
  motto?: string | null;
  address?: string | null;
  schoolLogoUrl?: string | null;
  branchLogoUrl?: string | null;
  signatureUrl?: string | null;
};

export type IdentityCredentialCardProps = {
  credential?: Partial<IdentityCredential> | null;
  design: Partial<IdentityCredentialDesignSetting>;
  subject: IdentityCredentialCardSubject;
  branding: IdentityCredentialCardBranding;
  side?: "front" | "back";
  scale?: number;
  className?: string;
};

function readableDate(value?: number | string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
}

function qrValue(credential?: Partial<IdentityCredential> | null) {
  const metadata = (credential?.metadata || {}) as Record<string, unknown>;
  return String(
    metadata.qrValue ||
      metadata.qrPayload ||
      credential?.credentialReference ||
      "",
  );
}

export default function IdentityCredentialCard({
  credential,
  design,
  subject,
  branding,
  side = "front",
  scale = 1,
  className,
}: IdentityCredentialCardProps) {
  const landscape = design.orientation !== "portrait";
  const width = landscape ? 380 : 240;
  const height = landscape ? 240 : 380;
  const visible = design.visibleFields || {};
  const labels = design.customLabels || {};
  const primary = design.primaryColor || "#2f6fed";
  const secondary = design.secondaryColor || "#172554";
  const background = design.backgroundColor || "#ffffff";
  const text = design.textColor || "#111827";
  const muted = design.mutedTextColor || "#64748b";
  const border = design.borderColor || primary;
  const qrPosition = design.qrPosition || "front_right";
  const qrSize = design.qrSize || "medium";
  const logo =
    (design.showBranchLogo !== false && branding.branchLogoUrl) ||
    (design.showSchoolLogo !== false && branding.schoolLogoUrl) ||
    "";

  const fieldRows = [
    visible.admissionNumber !== false && subject.admissionNumber
      ? [labels.admissionNumber || "Student ID", subject.admissionNumber]
      : null,
    visible.staffNumber && subject.staffNumber
      ? [labels.staffNumber || "Staff ID", subject.staffNumber]
      : null,
    visible.className !== false && subject.className
      ? [labels.className || "Class", subject.className]
      : null,
    visible.organizationName && subject.organizationName
      ? [labels.organizationName || "Organization", subject.organizationName]
      : null,
    visible.academicYear && subject.academicYear
      ? [labels.academicYear || "Academic Year", subject.academicYear]
      : null,
    visible.gender && subject.gender
      ? [labels.gender || "Gender", subject.gender]
      : null,
    visible.phone && subject.phone
      ? [labels.phone || "Phone", subject.phone]
      : null,
  ].filter(Boolean) as string[][];

  const cardStyle: React.CSSProperties = {
    width,
    height,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
    position: "relative",
    overflow: "hidden",
    border:
      design.borderStyle === "none"
        ? "none"
        : `${design.borderStyle === "double" ? 3 : 1}px solid ${border}`,
    borderRadius: Math.max(0, Number(design.borderRadiusPx ?? 16)),
    background,
    color: text,
    fontFamily: "inherit",
    boxSizing: "border-box",
    boxShadow:
      design.borderStyle === "accent"
        ? `inset 6px 0 0 ${primary}, 0 10px 28px rgba(15,23,42,.12)`
        : "0 10px 28px rgba(15,23,42,.12)",
  };

  if (side === "back") {
    return (
      <article className={className} style={cardStyle}>
        <div
          style={{
            height: 8,
            background: `linear-gradient(90deg, ${primary}, ${secondary})`,
          }}
        />
        <div
          style={{
            padding: 18,
            height: "calc(100% - 8px)",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {logo ? (
            <img
              src={logo}
              alt=""
              style={{ width: 42, height: 42, objectFit: "contain" }}
            />
          ) : null}
          <strong style={{ fontSize: 15 }}>{branding.schoolName}</strong>
          {branding.address && design.showAddress !== false ? (
            <span style={{ fontSize: 10, color: muted }}>{branding.address}</span>
          ) : null}
          {design.showQrCode !== false ? (
            <IdentityQrCode value={qrValue(credential)} size={qrSize} />
          ) : null}
          {design.showCredentialReference !== false &&
          credential?.credentialReference ? (
            <code style={{ fontSize: 9, wordBreak: "break-all" }}>
              {credential.credentialReference}
            </code>
          ) : null}
          <p style={{ margin: "auto 0 0", fontSize: 9, color: muted }}>
            {design.footerText ||
              "This credential remains the property of the issuing school."}
          </p>
        </div>
      </article>
    );
  }

  const qrAbsolute: React.CSSProperties =
    qrPosition === "front_left"
      ? { bottom: 14, left: 14 }
      : qrPosition === "front_center"
        ? {
            bottom: 14,
            left: "50%",
            transform: "translateX(-50%)",
          }
        : qrPosition === "back_left"
          ? { top: 56, left: 14 }
          : qrPosition === "back_center"
            ? {
                top: 56,
                left: "50%",
                transform: "translateX(-50%)",
              }
            : qrPosition === "back_right"
              ? { top: 56, right: 14 }
              : { bottom: 14, right: 14 };

  return (
    <article className={className} style={cardStyle}>
      <header
        style={{
          minHeight: 44,
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "#fff",
          background: `linear-gradient(120deg, ${primary}, ${secondary})`,
        }}
      >
        {logo ? (
          <img
            src={logo}
            alt=""
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              objectFit: "contain",
              background: "#fff",
              padding: 2,
            }}
          />
        ) : null}
        <div style={{ minWidth: 0 }}>
          {design.showSchoolName !== false ? (
            <strong
              style={{
                display: "block",
                fontSize: 12,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {branding.schoolName}
            </strong>
          ) : null}
          {design.showBranchName !== false && branding.branchName ? (
            <span style={{ display: "block", fontSize: 8, opacity: 0.9 }}>
              {branding.branchName}
            </span>
          ) : null}
        </div>
      </header>

      {design.watermarkText ? (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            fontWeight: 800,
            fontSize: landscape ? 38 : 28,
            opacity: Number(design.watermarkOpacity ?? 0.06),
            transform: "rotate(-28deg)",
            pointerEvents: "none",
          }}
        >
          {design.watermarkText}
        </div>
      ) : null}

      <div
        style={{
          padding: 14,
          display: "grid",
          gridTemplateColumns: landscape ? "82px 1fr" : "1fr",
          gap: 12,
        }}
      >
        {design.showPhoto !== false ? (
          subject.photoUrl ? (
            <img
              src={subject.photoUrl}
              alt={subject.fullName}
              style={{
                width: landscape ? 76 : 88,
                height: landscape ? 86 : 102,
                justifySelf: landscape ? "start" : "center",
                objectFit: "cover",
                borderRadius:
                  design.photoShape === "circle"
                    ? "50%"
                    : design.photoShape === "square"
                      ? 4
                      : 12,
                border: `2px solid ${primary}`,
              }}
            />
          ) : (
            <div
              style={{
                width: landscape ? 76 : 88,
                height: landscape ? 86 : 102,
                justifySelf: landscape ? "start" : "center",
                display: "grid",
                placeItems: "center",
                borderRadius:
                  design.photoShape === "circle"
                    ? "50%"
                    : design.photoShape === "square"
                      ? 4
                      : 12,
                background: `${primary}18`,
                color: primary,
                fontWeight: 800,
                fontSize: 28,
              }}
            >
              {subject.fullName
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase()}
            </div>
          )
        ) : null}

        <div style={{ minWidth: 0 }}>
          {visible.fullName !== false ? (
            <h3
              style={{
                margin: "0 0 7px",
                fontSize: landscape ? 16 : 15,
                lineHeight: 1.15,
              }}
            >
              {subject.fullName}
            </h3>
          ) : null}

          {fieldRows.map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "grid",
                gridTemplateColumns: "72px 1fr",
                gap: 4,
                fontSize: 9,
                marginBottom: 4,
              }}
            >
              <span style={{ color: muted }}>{label}</span>
              <b style={{ overflowWrap: "anywhere" }}>{value}</b>
            </div>
          ))}

          {design.showIssueDate && credential?.generatedAt ? (
            <small style={{ display: "block", color: muted, fontSize: 8 }}>
              Issued: {readableDate(credential.generatedAt)}
            </small>
          ) : null}
          {design.showExpiryDate && credential?.expiresAt ? (
            <small style={{ display: "block", color: muted, fontSize: 8 }}>
              Expires: {readableDate(credential.expiresAt)}
            </small>
          ) : null}
        </div>
      </div>

      {design.showQrCode !== false ? (
        <div style={{ position: "absolute", ...qrAbsolute }}>
          <IdentityQrCode value={qrValue(credential)} size={qrSize} />
        </div>
      ) : null}

      <footer
        style={{
          position: "absolute",
          left: 12,
          right: 12,
          bottom: 8,
          maxWidth: design.showQrCode !== false ? "56%" : "100%",
          fontSize: 7.5,
          color: muted,
        }}
      >
        {design.footerText || branding.motto || "Official school credential"}
      </footer>
    </article>
  );
}