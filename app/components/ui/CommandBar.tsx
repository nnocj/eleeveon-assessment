"use client";

import type {
  HTMLAttributes,
  ReactNode,
} from "react";

export interface CommandBarProps
  extends HTMLAttributes<HTMLDivElement> {
  leading?: ReactNode;
  center?: ReactNode;
  trailing?: ReactNode;
  sticky?: boolean;
}

export default function CommandBar({
  leading,
  center,
  trailing,
  sticky = false,
  className,
  ...props
}: CommandBarProps) {
  return (
    <div
      className={[
        "eds-command-bar",
        sticky &&
          "eds-command-bar-sticky",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <div className="eds-command-leading">
        {leading}
      </div>

      <div className="eds-command-center">
        {center}
      </div>

      <div className="eds-command-trailing">
        {trailing}
      </div>
    </div>
  );
}
