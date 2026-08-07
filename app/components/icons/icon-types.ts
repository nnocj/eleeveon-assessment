import type {
  CSSProperties,
  SVGAttributes,
} from "react";

export type EleeveonIconName =
  | "dashboard"
  | "student"
  | "teacher"
  | "parent"
  | "attendance"
  | "assessment"
  | "reports"
  | "calendar"
  | "timetable"
  | "finance"
  | "communication"
  | "workspace"
  | "notification"
  | "settings"
  | "sync"
  | "offline"
  | "device"
  | "school"
  | "branch";

export type EleeveonIconSize =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | number;

export type EleeveonIconTone =
  | "current"
  | "primary"
  | "muted"
  | "success"
  | "warning"
  | "danger"
  | "info";

export interface IconPathDefinition {
  paths?: string[];
  circles?: Array<{
    cx: number;
    cy: number;
    r: number;
  }>;
  rects?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    rx?: number;
  }>;
  polylines?: string[];
  lines?: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }>;
}

export interface IconProps
  extends Omit<
    SVGAttributes<SVGSVGElement>,
    "color"
  > {
  name: EleeveonIconName;
  size?: EleeveonIconSize;
  tone?: EleeveonIconTone;
  label?: string;
  decorative?: boolean;
  strokeWidth?: number;
  title?: string;
  className?: string;
  style?: CSSProperties;
}

export interface IconProviderValue {
  size: EleeveonIconSize;
  tone: EleeveonIconTone;
  strokeWidth: number;
}
