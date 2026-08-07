"use client";

import Icon from "./Icon";
import type {
  IconProps,
} from "./icon-types";

export type SettingsIconProps =
  Omit<IconProps, "name">;

export default function SettingsIcon(
  props: SettingsIconProps,
) {
  return (
    <Icon
      name="settings"
      {...props}
    />
  );
}
