"use client";

import Icon from "./Icon";
import type {
  IconProps,
} from "./icon-types";

export type SchoolIconProps =
  Omit<IconProps, "name">;

export default function SchoolIcon(
  props: SchoolIconProps,
) {
  return (
    <Icon
      name="school"
      {...props}
    />
  );
}
