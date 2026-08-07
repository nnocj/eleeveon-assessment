"use client";

import Icon from "./Icon";
import type {
  IconProps,
} from "./icon-types";

export type WorkspaceIconProps =
  Omit<IconProps, "name">;

export default function WorkspaceIcon(
  props: WorkspaceIconProps,
) {
  return (
    <Icon
      name="workspace"
      {...props}
    />
  );
}
