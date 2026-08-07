"use client";

import Icon from "./Icon";
import type {
  IconProps,
} from "./icon-types";

export type ParentIconProps =
  Omit<IconProps, "name">;

export default function ParentIcon(
  props: ParentIconProps,
) {
  return (
    <Icon
      name="parent"
      {...props}
    />
  );
}
