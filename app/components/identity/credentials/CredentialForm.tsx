"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import type {
  IdentityCredentialDraft,
  IdentityCredentialType,
  IdentitySubjectOption,
} from "../types";
import { IdentitySubjectPicker } from "../shared";

const CREDENTIAL_TYPES: readonly IdentityCredentialType[] = [
  "qr_code",
  "nfc_card",
  "rfid_card",
  "fingerprint",
  "face_profile",
  "student_id",
  "staff_id",
  "parent_pass",
  "visitor_pass",
  "mobile_pass",
];

const SERIAL_NUMBER_TYPES = new Set<IdentityCredentialType>([
  "nfc_card",
  "rfid_card",
]);

const GENERATED_TYPES = new Set<IdentityCredentialType>([
  "qr_code",
  "student_id",
  "staff_id",
  "parent_pass",
  "visitor_pass",
  "mobile_pass",
]);

function formatCredentialType(
  value: IdentityCredentialType,
): string {
  return value
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ");
}

export interface CredentialFormProps {
  subjects: readonly IdentitySubjectOption[];
  initialValue?: Partial<IdentityCredentialDraft>;
  onSubmit: (
    draft: IdentityCredentialDraft,
  ) => void | Promise<void>;
  submitLabel?: string;
  disabled?: boolean;
}

export function CredentialForm({
  subjects,
  initialValue,
  onSubmit,
  submitLabel = "Save credential",
  disabled = false,
}: CredentialFormProps) {
  const [subject, setSubject] =
    useState<IdentitySubjectOption | null>(() =>
      subjects.find(
        (item) =>
          item.id === initialValue?.subjectId &&
          item.subjectType === initialValue?.subjectType,
      ) ?? null,
    );

  const [credentialType, setCredentialType] =
    useState<IdentityCredentialType>(
      initialValue?.credentialType ?? "qr_code",
    );

  const [label, setLabel] = useState(
    initialValue?.label ?? "",
  );

  const [serialNumber, setSerialNumber] = useState(
    initialValue?.serialNumber ?? "",
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!subject && initialValue?.subjectId) {
      const resolved =
        subjects.find(
          (item) =>
            item.id === initialValue.subjectId &&
            item.subjectType === initialValue.subjectType,
        ) ?? null;

      if (resolved) setSubject(resolved);
    }
  }, [
    initialValue?.subjectId,
    initialValue?.subjectType,
    subject,
    subjects,
  ]);

  useEffect(() => {
    if (!SERIAL_NUMBER_TYPES.has(credentialType)) {
      setSerialNumber("");
    }
  }, [credentialType]);

  const showSerialNumber =
    SERIAL_NUMBER_TYPES.has(credentialType);

  const helperText = useMemo(() => {
    if (credentialType === "qr_code") {
      return "The credential reference and QR code will be generated automatically.";
    }

    if (showSerialNumber) {
      return "Enter or scan the serial number printed on the physical card.";
    }

    if (
      credentialType === "fingerprint" ||
      credentialType === "face_profile"
    ) {
      return "The biometric identifier should be supplied by the enrollment device.";
    }

    if (GENERATED_TYPES.has(credentialType)) {
      return "The credential reference will be generated automatically.";
    }

    return null;
  }, [credentialType, showSerialNumber]);

  const submit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!subject || disabled || isSubmitting) return;

    if (showSerialNumber && !serialNumber.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        subjectId: subject.id,
        subjectType: subject.subjectType,
        credentialType,
        label: label.trim() || null,
        credentialReference: null,
        serialNumber: showSerialNumber
          ? serialNumber.trim()
          : null,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldStyle = {
    display: "grid",
    gap: 6,
  } as const;

  const inputStyle = {
    width: "100%",
    minHeight: 40,
    borderRadius: 10,
    border: "1px solid var(--border, #d9dde7)",
    background: "var(--background, #ffffff)",
    color: "inherit",
    padding: "8px 10px",
    font: "inherit",
  } as const;

  return (
    <form
      onSubmit={submit}
      style={{
        display: "grid",
        gap: 12,
      }}
    >
      <IdentitySubjectPicker
        subjects={subjects}
        value={subject?.id}
        onChange={setSubject}
        disabled={disabled || isSubmitting}
      />

      <label style={fieldStyle}>
        <span>Credential type</span>

        <select
          value={credentialType}
          onChange={(event) =>
            setCredentialType(
              event.target.value as IdentityCredentialType,
            )
          }
          disabled={disabled || isSubmitting}
          style={inputStyle}
        >
          {CREDENTIAL_TYPES.map((value) => (
            <option key={value} value={value}>
              {formatCredentialType(value)}
            </option>
          ))}
        </select>
      </label>

      <label style={fieldStyle}>
        <span>Label</span>

        <input
          value={label}
          onChange={(event) =>
            setLabel(event.target.value)
          }
          placeholder="Optional, for example Main student card"
          disabled={disabled || isSubmitting}
          style={inputStyle}
        />
      </label>

      {showSerialNumber ? (
        <label style={fieldStyle}>
          <span>Serial number</span>

          <input
            value={serialNumber}
            onChange={(event) =>
              setSerialNumber(event.target.value)
            }
            placeholder="Enter or scan card serial number"
            required
            disabled={disabled || isSubmitting}
            style={inputStyle}
          />
        </label>
      ) : null}

      {helperText ? (
        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.45,
            opacity: 0.72,
          }}
        >
          {helperText}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={
          disabled ||
          isSubmitting ||
          !subject ||
          (showSerialNumber && !serialNumber.trim())
        }
        style={{
          minHeight: 42,
          border: 0,
          borderRadius: 10,
          padding: "9px 14px",
          cursor:
            disabled || isSubmitting || !subject
              ? "not-allowed"
              : "pointer",
          font: "inherit",
          fontWeight: 700,
          background: "var(--primary, #2f6fed)",
          color: "var(--primary-foreground, #ffffff)",
          opacity:
            disabled ||
            isSubmitting ||
            !subject ||
            (showSerialNumber &&
              !serialNumber.trim())
              ? 0.6
              : 1,
        }}
      >
        {isSubmitting ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

export default CredentialForm;