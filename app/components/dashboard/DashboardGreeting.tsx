"use client";

import type { ReactNode } from "react";

export interface DashboardGreetingProps {
  greeting: string;
  name: string;
  description?: ReactNode;
}

export default function DashboardGreeting({
  greeting,
  name,
  description,
}: DashboardGreetingProps) {
  return (
    <div className="eds-dashboard-greeting">
      <span>{greeting}</span>
      <h1>{name}</h1>
      {description ? <p>{description}</p> : null}
    </div>
  );
}
