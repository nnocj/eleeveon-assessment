"use client";

import Icon from "./Icon";
import type {
  IconProps,
} from "./icon-types";

export type NotificationIconProps =
  Omit<IconProps, "name">;

export default function NotificationIcon(
  props: NotificationIconProps,
) {
  return (
    <Icon
      name="notification"
      {...props}
    />
  );
}
