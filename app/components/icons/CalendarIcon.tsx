"use client";

import Icon from "./Icon";
import type {
  IconProps,
} from "./icon-types";

export type CalendarIconProps =
  Omit<IconProps, "name">;

export default function CalendarIcon(
  props: CalendarIconProps,
) {
  return (
    <Icon
      name="calendar"
      {...props}
    />
  );
}
