"use client";

import Icon from "./Icon";
import type {
  IconProps,
} from "./icon-types";

export type TimetableIconProps =
  Omit<IconProps, "name">;

export default function TimetableIcon(
  props: TimetableIconProps,
) {
  return (
    <Icon
      name="timetable"
      {...props}
    />
  );
}
