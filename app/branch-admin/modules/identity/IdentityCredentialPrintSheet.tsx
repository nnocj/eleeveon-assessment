"use client";

import React, { useMemo } from "react";
import type {
  IdentityCredential,
  IdentityCredentialDesignSetting,
} from "../../../lib/db/db";
import IdentityCredentialCard, {
  type IdentityCredentialCardBranding,
  type IdentityCredentialCardSubject,
} from "./IdentityCredentialCard";

export type PrintableCredential = {
  credential: Partial<IdentityCredential>;
  subject: IdentityCredentialCardSubject;
};

export type IdentityCredentialPrintSheetProps = {
  open: boolean;
  onClose: () => void;
  design: Partial<IdentityCredentialDesignSetting>;
  branding: IdentityCredentialCardBranding;
  credentials: PrintableCredential[];
  title?: string;
};

export default function IdentityCredentialPrintSheet({
  open,
  onClose,
  design,
  branding,
  credentials,
  title = "Print Identity Credentials",
}: IdentityCredentialPrintSheetProps) {
  const printable = useMemo(
    () => credentials.filter((item) => item.subject?.fullName),
    [credentials],
  );

  if (!open) return null;

  return (
    <div className="identity-print-modal" role="dialog" aria-modal="true">
      <style>{`
        .identity-print-modal{position:fixed;inset:0;z-index:1200;background:rgba(15,23,42,.62);display:grid;place-items:center;padding:18px}
        .identity-print-shell{width:min(1280px,100%);max-height:94vh;overflow:auto;background:var(--surface,#fff);color:var(--text,#111827);border-radius:18px}
        .identity-print-head{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 16px;background:inherit;border-bottom:1px solid var(--border,rgba(148,163,184,.3))}
        .identity-print-actions{display:flex;gap:8px}.identity-print-actions button{min-height:36px;border-radius:10px;padding:0 14px;border:1px solid var(--border,rgba(148,163,184,.35));background:transparent;color:inherit}
        .identity-print-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:18px;padding:24px;overflow-x:auto}
        .identity-print-item{break-inside:avoid;display:flex;gap:16px;align-items:flex-start;justify-content:center;width:max-content;min-width:100%;min-height:240px}
        @media print{
          body *{visibility:hidden!important}
          .identity-print-shell,.identity-print-shell *{visibility:visible!important}
          .identity-print-modal{position:static;background:#fff;padding:0}
          .identity-print-shell{width:100%;max-height:none;overflow:visible;border-radius:0}
          .identity-print-head{display:none}
          .identity-print-grid{grid-template-columns:1fr;gap:8mm;padding:8mm;overflow:visible}
          .identity-print-item{page-break-inside:avoid;break-inside:avoid;justify-content:center;width:max-content;min-width:100%}
        }
      `}</style>
      <section className="identity-print-shell">
        <header className="identity-print-head">
          <div>
            <strong>{title}</strong>
            <div style={{ fontSize: 12, opacity: 0.65 }}>
              {printable.length} credential{printable.length === 1 ? "" : "s"}
            </div>
          </div>
          <div className="identity-print-actions">
            <button type="button" onClick={onClose}>
              Close
            </button>
            <button type="button" onClick={() => window.print()}>
              Print
            </button>
          </div>
        </header>

        <div className="identity-print-grid">
          {printable.map((item, index) => (
            <div
              className="identity-print-item"
              key={item.credential.id || item.credential.credentialReference || index}
            >
              <IdentityCredentialCard
                design={design}
                credential={item.credential}
                subject={item.subject}
                branding={branding}
              />
              {design.sides === "front_and_back" ? (
                <IdentityCredentialCard
                  side="back"
                  design={design}
                  credential={item.credential}
                  subject={item.subject}
                  branding={branding}
                />
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
