"use client";

import Icon from "./Icon";
import type {
  IconProps,
} from "./icon-types";

export type StudentIconProps =
  Omit<IconProps, "name">;

export default function StudentIcon(
  props: StudentIconProps,
) {
  return (
    <Icon
      name="student"
      {...props}
    />
  );
}
