"use client";

import { useState } from "react";

import type {
  AttendanceCaptureEvent,
} from "../../../lib/attendance";

import { AttendanceScanner } from "./AttendanceScanner";
import { AttendanceDeviceSelector } from "./AttendanceDeviceSelector";
import { ManualAttendanceCapture } from "./ManualAttendanceCapture";
import { AttendanceCaptureResult } from "./AttendanceCaptureResult";

import type {
  AttendanceCaptureDisplayResult,
  AttendanceCaptureDraft,
  AttendanceCapturePerson,
  AttendanceDevice,
  AttendanceIdentityPurpose,
  AttendanceIdentityResult,
} from "./types";

export interface AttendanceCapturePanelProps {
  purpose?: AttendanceIdentityPurpose;

  devices?: readonly AttendanceDevice[];
  people?: readonly AttendanceCapturePerson[];

  selectedDeviceId?: string | null;

  onDeviceChange?: (
    id: string | null,
  ) => void;

  onIdentityResult: (
    result: AttendanceIdentityResult,
    deviceId: string | null,
  ) => void | Promise<void>;

  onManualCapture?: (
    draft: AttendanceCaptureDraft,
  ) => void | Promise<void>;

  result?: AttendanceCaptureDisplayResult | null;
  recentEvents?: readonly AttendanceCaptureEvent[];

  disabled?: boolean;
}

export function AttendanceCapturePanel({
  purpose = "student_attendance",
  devices = [],
  people = [],
  selectedDeviceId,
  onDeviceChange,
  onIdentityResult,
  onManualCapture,
  result,
  disabled = false,
}: AttendanceCapturePanelProps) {
  const [mode, setMode] =
    useState<"scan" | "manual">("scan");

  const [localDevice, setLocalDevice] =
    useState<string | null>(
      selectedDeviceId ?? null,
    );

  const deviceId =
    selectedDeviceId === undefined
      ? localDevice
      : selectedDeviceId;

  function handleDeviceChange(
    id: string | null,
  ) {
    setLocalDevice(id);
    onDeviceChange?.(id);
  }

  const manualPersonType =
    purpose === "student_attendance"
      ? "student"
      : "teacher";

  return (
    <section
      style={{
        display: "grid",
        gap: 12,
        padding: 12,
        border:
          "1px solid var(--border, rgba(15,23,42,.1))",
        borderRadius: 14,
        background:
          "var(--background, #fff)",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => setMode("scan")}
          aria-pressed={mode === "scan"}
          disabled={disabled}
        >
          Scan
        </button>

        <button
          type="button"
          onClick={() => setMode("manual")}
          aria-pressed={mode === "manual"}
          disabled={disabled}
        >
          Manual
        </button>

        <div
          style={{
            marginLeft: "auto",
            minWidth: 180,
          }}
        >
          <AttendanceDeviceSelector
            devices={devices}
            value={deviceId}
            onChange={handleDeviceChange}
            disabled={disabled}
          />
        </div>
      </div>

      {mode === "scan" ? (
        <AttendanceScanner
          purpose={purpose}
          disabled={disabled}
          onIdentityResult={(identityResult) =>
            onIdentityResult(
              identityResult,
              deviceId,
            )
          }
        />
      ) : onManualCapture ? (
        <ManualAttendanceCapture
          people={people}
          personType={manualPersonType}
          disabled={disabled}
          onCapture={(draft) =>
            onManualCapture({
              ...draft,
              attendanceDeviceId:
                deviceId,
            })
          }
        />
      ) : null}

      {result ? (
        <AttendanceCaptureResult
          {...result}
        />
      ) : null}
    </section>
  );
}

export default AttendanceCapturePanel;