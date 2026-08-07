"use client";

import {
  LogoMark,
} from "../../icons";

export interface SidebarLogoProps {
  title: string;
  subtitle: string;
  onHome(): void;
}

export default function SidebarLogo({
  title,
  subtitle,
  onHome,
}: SidebarLogoProps) {
  return (
    <button
      type="button"
      className="shell-sidebar-logo"
      onClick={onHome}
      aria-label={`Open ${title} home`}
    >
      <LogoMark
        size={38}
        variant="gradient"
      />

      <span className="shell-sidebar-logo-copy">
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </span>
    </button>
  );
}
