"use client";

import type {
  CSSProperties,
} from "react";

export interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
) {
  return Math.min(
    maximum,
    Math.max(minimum, value),
  );
}

export default function ProgressRing({
  value,
  max = 100,
  size = 48,
  strokeWidth = 5,
  label,
  showValue = true,
  className,
}: ProgressRingProps) {
  const safeMax =
    max > 0 ? max : 100;
  const percentage =
    clamp(
      value / safeMax,
      0,
      1,
    ) * 100;

  const radius =
    (size - strokeWidth) / 2;
  const circumference =
    2 * Math.PI * radius;
  const offset =
    circumference -
    (percentage / 100) *
      circumference;

  return (
    <span
      className={[
        "eds-progress-ring",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          width: size,
          height: size,
        } as CSSProperties
      }
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={value}
      aria-label={label}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        <circle
          className="eds-progress-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
        />
        <circle
          className="eds-progress-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={
            circumference
          }
          strokeDashoffset={
            offset
          }
        />
      </svg>

      {showValue ? (
        <strong>
          {Math.round(
            percentage,
          )}
        </strong>
      ) : null}
    </span>
  );
}
