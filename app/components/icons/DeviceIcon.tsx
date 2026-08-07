"use client";

import Icon from "./Icon";
import type {
  IconProps,
} from "./icon-types";

export type DeviceIconProps =
  Omit<IconProps, "name">;

export default function DeviceIcon(
  props: DeviceIconProps,
) {
  return (
    <Icon
      name="device"
      {...props}
    />
  );
}
