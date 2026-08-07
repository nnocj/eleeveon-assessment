"use client";

import Icon from "./Icon";
import type {
  IconProps,
} from "./icon-types";

export type BranchIconProps =
  Omit<IconProps, "name">;

export default function BranchIcon(
  props: BranchIconProps,
) {
  return (
    <Icon
      name="branch"
      {...props}
    />
  );
}
