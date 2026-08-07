"use client";

import type {
  ReactNode,
} from "react";

import {
  EleeveonBackground,
  EleeveonNoise,
} from "../../design";

export interface PortalContentProps {
  children: ReactNode;
  className?: string;
}

export default function PortalContent({
  children,
  className,
}: PortalContentProps) {
  return (
    <section
      className={[
        "app-content",
        "shell-portal-content",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <EleeveonBackground
        pattern="dots"
        glow
        className="shell-content-background"
      >
        <EleeveonNoise
          opacity={0.018}
        />

        <div className="app-content-inner">
          {children}
        </div>
      </EleeveonBackground>
    </section>
  );
}
