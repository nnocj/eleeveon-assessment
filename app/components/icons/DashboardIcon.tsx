"use client";

import Icon from "./Icon";
import type {
  IconProps,
} from "./icon-types";

export type DashboardIconProps =
  Omit<IconProps, "name">;

export default function DashboardIcon(
  props: DashboardIconProps,
) {
  return (
    <Icon
      name="dashboard"
      {...props}
    />
  );
}
