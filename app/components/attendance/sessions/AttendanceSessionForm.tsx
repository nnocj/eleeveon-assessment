"use client";

import {
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import {
  DEFAULT_ABSENT_AFTER_MINUTE,
  DEFAULT_LATE_AFTER_MINUTE,
  type AttendanceSession,
  type AttendanceStatus,
} from "../../../lib/attendance";
import {
  AttendanceDatePicker,
  AttendanceStatusPicker,
} from "../shared";

export interface AttendanceSessionFormValue {
  academicStructureId?: string | null;
  academicPeriodId?: string | null;
  classId?: string | null;
  teacherId?: string | null;
  scopeType: AttendanceSession["scopeType"];
  scopeId?: string | null;
  date: string;
  name?: string | null;
  defaultStatus: AttendanceStatus;
  lateAfterMinute: number;
  absentAfterMinute: number;
}

export interface AttendanceSessionFormProps {
  value?: Partial<AttendanceSessionFormValue>;
  onSubmit: (
    value: AttendanceSessionFormValue,
  ) => void | Promise<void>;
  onCancel?: () => void;
  disabled?: boolean;
  submitting?: boolean;
  classOptions?: readonly {
    value: string;
    label: string;
  }[];
  teacherOptions?: readonly {
    value: string;
    label: string;
  }[];
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AttendanceSessionForm({
  value,
  onSubmit,
  onCancel,
  disabled = false,
  submitting = false,
  classOptions = [],
  teacherOptions = [],
}: AttendanceSessionFormProps) {
  const [form, setForm] =
    useState<AttendanceSessionFormValue>({
      academicStructureId:
        value?.academicStructureId ?? null,
      academicPeriodId:
        value?.academicPeriodId ?? null,
      classId: value?.classId ?? null,
      teacherId: value?.teacherId ?? null,
      scopeType: value?.scopeType ?? "class",
      scopeId: value?.scopeId ?? null,
      date: value?.date ?? todayKey(),
      name: value?.name ?? "",
      defaultStatus:
        value?.defaultStatus ?? "present",
      lateAfterMinute:
        value?.lateAfterMinute ??
        DEFAULT_LATE_AFTER_MINUTE,
      absentAfterMinute:
        value?.absentAfterMinute ??
        DEFAULT_ABSENT_AFTER_MINUTE,
    });

  const update = <K extends keyof AttendanceSessionFormValue>(
    key: K,
    next: AttendanceSessionFormValue[K],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: next,
    }));
  };

  const submit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    await onSubmit({
      ...form,
      name: form.name?.trim() || null,
      scopeId:
        form.scopeType === "class"
          ? form.classId
          : form.scopeId,
    });
  };

  return (
    <form
      onSubmit={submit}
      style={{
        display: "grid",
        gap: 13,
      }}
    >
      <label style={{ display: "grid", gap: 5 }}>
        <span style={labelStyle}>Session name</span>
        <input
          type="text"
          value={form.name ?? ""}
          disabled={disabled || submitting}
          onChange={(event) =>
            update("name", event.target.value)
          }
          placeholder="Morning attendance"
          style={inputStyle}
        />
      </label>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
        }}
      >
        <AttendanceDatePicker
          value={form.date}
          onChange={(date) => update("date", date)}
          disabled={disabled || submitting}
        />

        <label style={{ display: "grid", gap: 5 }}>
          <span style={labelStyle}>Scope</span>
          <select
            value={form.scopeType}
            disabled={disabled || submitting}
            onChange={(event) =>
              update(
                "scopeType",
                event.target
                  .value as AttendanceSession["scopeType"],
              )
            }
            style={inputStyle}
          >
            <option value="class">Class</option>
            <option value="school">School</option>
            <option value="branch">Branch</option>
            <option value="custom">Custom</option>
          </select>
        </label>

        {form.scopeType === "class" ? (
          <label style={{ display: "grid", gap: 5 }}>
            <span style={labelStyle}>Class</span>
            <select
              value={form.classId ?? ""}
              required
              disabled={disabled || submitting}
              onChange={(event) =>
                update(
                  "classId",
                  event.target.value || null,
                )
              }
              style={inputStyle}
            >
              <option value="">Select class</option>
              {classOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label style={{ display: "grid", gap: 5 }}>
          <span style={labelStyle}>Teacher</span>
          <select
            value={form.teacherId ?? ""}
            disabled={disabled || submitting}
            onChange={(event) =>
              update(
                "teacherId",
                event.target.value || null,
              )
            }
            style={inputStyle}
          >
            <option value="">Not assigned</option>
            {teacherOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset
        style={{
          margin: 0,
          padding: 0,
          border: 0,
        }}
      >
        <legend style={labelStyle}>
          Default attendance status
        </legend>
        <div style={{ marginTop: 7 }}>
          <AttendanceStatusPicker
            value={form.defaultStatus}
            onChange={(status) =>
              update("defaultStatus", status)
            }
            disabled={disabled || submitting}
            showLabels
          />
        </div>
      </fieldset>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 10,
        }}
      >
        <label style={{ display: "grid", gap: 5 }}>
          <span style={labelStyle}>
            Late after minutes
          </span>
          <input
            type="number"
            min={0}
            max={1440}
            value={form.lateAfterMinute}
            disabled={disabled || submitting}
            onChange={(event) =>
              update(
                "lateAfterMinute",
                Math.max(
                  0,
                  Number(event.target.value) || 0,
                ),
              )
            }
            style={inputStyle}
          />
        </label>

        <label style={{ display: "grid", gap: 5 }}>
          <span style={labelStyle}>
            Absent after minutes
          </span>
          <input
            type="number"
            min={0}
            max={1440}
            value={form.absentAfterMinute}
            disabled={disabled || submitting}
            onChange={(event) =>
              update(
                "absentAfterMinute",
                Math.max(
                  0,
                  Number(event.target.value) || 0,
                ),
              )
            }
            style={inputStyle}
          />
        </label>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {onCancel ? (
          <button
            type="button"
            disabled={submitting}
            onClick={onCancel}
            style={{
              ...actionStyle,
              background: "transparent",
              color: "inherit",
              border:
                "1px solid var(--border, rgba(15,23,42,.12))",
            }}
          >
            Cancel
          </button>
        ) : null}

        <button
          type="submit"
          disabled={disabled || submitting}
          style={{
            ...actionStyle,
            background: "var(--primary, #2563eb)",
            color: "#fff",
            border: 0,
          }}
        >
          {submitting ? "Saving..." : "Save session"}
        </button>
      </div>
    </form>
  );
}

const labelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 750,
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: 39,
  padding: "0 9px",
  borderRadius: 9,
  border:
    "1px solid var(--border, rgba(15,23,42,.12))",
  background: "var(--background, #fff)",
  color: "inherit",
  font: "inherit",
  fontSize: 12,
  boxSizing: "border-box",
};

const actionStyle: CSSProperties = {
  minHeight: 38,
  padding: "0 12px",
  borderRadius: 9,
  font: "inherit",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};

export default AttendanceSessionForm;
