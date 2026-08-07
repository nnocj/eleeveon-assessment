"use client";

import type {
  ReactNode,
} from "react";

import {
  Icon,
  type EleeveonIconName,
} from "../../icons";

export interface NavigationGroupItem {
  key: string;
  label: string;
  icon:
    | EleeveonIconName
    | ReactNode;
}

export interface NavigationGroupProps {
  title: string;
  open: boolean;
  activeKey: string;
  items: NavigationGroupItem[];
  onToggle(): void;
  onNavigate(
    key: string,
  ): void;
}

function iconFor(
  icon:
    | EleeveonIconName
    | ReactNode,
) {
  return typeof icon === "string"
    ? (
      <Icon
        name={icon as EleeveonIconName}
        size="md"
      />
    )
    : icon;
}

export default function NavigationGroup({
  title,
  open,
  activeKey,
  items,
  onToggle,
  onNavigate,
}: NavigationGroupProps) {
  return (
    <section
      className="shell-nav-group"
      data-open={open}
      data-navigation-group={title}
    >
      <button
        type="button"
        className="shell-nav-group-title"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span>{title}</span>
        <b aria-hidden="true">
          {open ? "⌃" : "⌄"}
        </b>
      </button>

      {open ? (
        <div className="shell-nav-items">
          {items.map((item) => {
            const active =
              activeKey ===
              item.key;

            return (
              <button
                key={item.key}
                type="button"
                className={[
                  "shell-nav-item",
                  active &&
                    "active",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() =>
                  onNavigate(
                    item.key,
                  )
                }
                data-active={
                  active
                    ? "true"
                    : "false"
                }
                aria-current={
                  active
                    ? "page"
                    : undefined
                }
              >
                <span className="shell-nav-icon">
                  {iconFor(
                    item.icon,
                  )}
                </span>
                <strong>
                  {item.label}
                </strong>
                <span
                  className="shell-nav-active-marker"
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
