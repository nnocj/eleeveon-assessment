"use client";

import Icon from "./Icon";
import type {
  IconProps,
} from "./icon-types";

export type ReportsIconProps =
  Omit<IconProps, "name">;

export default function ReportsIcon(
  props: ReportsIconProps,
) {
  return (
    <Icon
      name="reports"
      {...props}
    />
  );
}
