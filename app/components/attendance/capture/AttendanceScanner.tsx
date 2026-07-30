"use client";

import type { ComponentProps } from "react";
import { IdentityScanner } from "../../identity/scanning";
import type { AttendanceIdentityResult } from "./types";

export interface AttendanceScannerProps
  extends Omit<ComponentProps<typeof IdentityScanner>, "purpose" | "onResult"> {
  purpose?: "student_attendance" | "staff_clock_in" | "staff_clock_out";
  onIdentityResult: (result: AttendanceIdentityResult) => void | Promise<void>;
}

export function AttendanceScanner({
  purpose = "student_attendance",
  onIdentityResult,
  ...identityScannerProps
}: AttendanceScannerProps) {
  return (
    <IdentityScanner
      {...identityScannerProps}
      purpose={purpose}
      onResult={(result: unknown) =>
        onIdentityResult(result as AttendanceIdentityResult)
      }
    />
  );
}

export default AttendanceScanner;
