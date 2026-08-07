"use client";

import Icon from "./Icon";
import type {
  IconProps,
} from "./icon-types";

export type SyncIconProps =
  Omit<IconProps, "name">;

export default function SyncIcon(
  props: SyncIconProps,
) {
  return (
    <Icon
      name="sync"
      {...props}
    />
  );
}
