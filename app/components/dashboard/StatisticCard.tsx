"use client";

import type { ReactNode } from "react";

export interface StatisticCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  note?: ReactNode;
  onClick?(): void;
}

export default function StatisticCard({
  label,
  value,
  icon,
  note,
  onClick,
}: StatisticCardProps) {
  const content = (
    <>
      {icon ? (
        <span className="eds-stat-card-icon">
          {icon}
        </span>
      ) : null}
      <strong>{value}</strong>
      <small>{label}</small>
      {note ? <p>{note}</p> : null}
    </>
  );

  return onClick ? (
    <button
      type="button"
      className="eds-stat-card"
      onClick={onClick}
    >
      {content}
    </button>
  ) : (
    <article className="eds-stat-card">
      {content}
    </article>
  );
}
