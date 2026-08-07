"use client";

import Icon from "./Icon";
import type {
  IconProps,
} from "./icon-types";

export type FinanceIconProps =
  Omit<IconProps, "name">;

export default function FinanceIcon(
  props: FinanceIconProps,
) {
  return (
    <Icon
      name="finance"
      {...props}
    />
  );
}
