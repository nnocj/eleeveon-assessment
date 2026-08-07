"use client";

import {
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
} from "react";

export interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  placement?:
    | "top"
    | "bottom"
    | "left"
    | "right";
}

export default function Tooltip({
  content,
  children,
  placement = "top",
}: TooltipProps) {
  const id = useId();

  if (!isValidElement(children)) {
    return children;
  }

  return (
    <span className="eds-tooltip-wrap">
      {cloneElement(children, {
        "aria-describedby": id,
      } as Record<string, unknown>)}

      <span
        id={id}
        role="tooltip"
        className={`eds-tooltip eds-tooltip-${placement}`}
      >
        {content}
      </span>
    </span>
  );
}
