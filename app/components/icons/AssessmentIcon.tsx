"use client";

import Icon from "./Icon";
import type {
  IconProps,
} from "./icon-types";

export type AssessmentIconProps =
  Omit<IconProps, "name">;

export default function AssessmentIcon(
  props: AssessmentIconProps,
) {
  return (
    <Icon
      name="assessment"
      {...props}
    />
  );
}
