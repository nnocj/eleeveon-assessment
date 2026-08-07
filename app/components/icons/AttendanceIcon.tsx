"use client";

import Icon from "./Icon";
import type {
  IconProps,
} from "./icon-types";

export type AttendanceIconProps =
  Omit<IconProps, "name">;

export default function AttendanceIcon(
  props: AttendanceIconProps,
) {
  return (
    <Icon
      name="attendance"
      {...props}
    />
  );
}
