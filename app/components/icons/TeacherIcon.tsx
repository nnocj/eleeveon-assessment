"use client";

import Icon from "./Icon";
import type {
  IconProps,
} from "./icon-types";

export type TeacherIconProps =
  Omit<IconProps, "name">;

export default function TeacherIcon(
  props: TeacherIconProps,
) {
  return (
    <Icon
      name="teacher"
      {...props}
    />
  );
}
