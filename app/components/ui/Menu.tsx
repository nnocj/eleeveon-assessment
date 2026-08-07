"use client";

import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

export interface MenuItemProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  label: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  danger?: boolean;
}

export function MenuItem({
  icon,
  label,
  description,
  trailing,
  danger = false,
  className,
  ...props
}: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      className={[
        "eds-menu-item",
        danger &&
          "eds-menu-item-danger",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {icon ? (
        <span className="eds-menu-icon">
          {icon}
        </span>
      ) : null}

      <span className="eds-menu-copy">
        <strong>{label}</strong>
        {description ? (
          <small>
            {description}
          </small>
        ) : null}
      </span>

      {trailing ? (
        <span className="eds-menu-trailing">
          {trailing}
        </span>
      ) : null}
    </button>
  );
}

export interface MenuProps {
  children: ReactNode;
  className?: string;
}

export default function Menu({
  children,
  className,
}: MenuProps) {
  return (
    <div
      role="menu"
      className={[
        "eds-menu",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
