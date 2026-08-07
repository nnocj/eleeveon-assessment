"use client";

import type { ReactNode } from "react";
import SidebarSection from "./SidebarSection";

export interface AccountSectionProps {
  title?: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function AccountSection(props: AccountSectionProps) {
  return (
    <SidebarSection
      {...props}
      className={[
        "account-control-section",
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
