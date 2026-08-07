"use client";

import Icon from "./Icon";
import type {
  IconProps,
} from "./icon-types";

export type OfflineIconProps =
  Omit<IconProps, "name">;

export default function OfflineIcon(
  props: OfflineIconProps,
) {
  return (
    <Icon
      name="offline"
      {...props}
    />
  );
}
