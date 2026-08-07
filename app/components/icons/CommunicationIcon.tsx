"use client";

import Icon from "./Icon";
import type {
  IconProps,
} from "./icon-types";

export type CommunicationIconProps =
  Omit<IconProps, "name">;

export default function CommunicationIcon(
  props: CommunicationIconProps,
) {
  return (
    <Icon
      name="communication"
      {...props}
    />
  );
}
