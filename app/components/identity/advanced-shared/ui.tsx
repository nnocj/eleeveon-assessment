"use client";

import type { CSSProperties, ReactNode } from "react";

export function formatIdentityDate(value?: number | string | Date | null) {
  if (value == null || value === "") return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function formatIdentityDay(value?: number | string | Date | null) {
  if (value == null || value === "") return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

export function labelize(value?: string | null) {
  return String(value || "unknown").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function initials(name?: string | null) {
  return String(name || "?").trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase() || "?";
}

export function toneOf(status?: string | null): "green" | "red" | "orange" | "blue" | "gray" {
  const value = String(status || "").toLowerCase();
  if (["active","approved","verified","released","checked_in","completed","present","safe"].includes(value)) return "green";
  if (["denied","revoked","blocked","cancelled","missing","injured"].includes(value)) return "red";
  if (["pending","requested","expected","in_progress","unknown","open"].includes(value)) return "orange";
  if (["draft","checked_out"].includes(value)) return "blue";
  return "gray";
}

export function StatusPill({ status }: { status?: string | null }) {
  return <span className={`ai-pill ${toneOf(status)}`}>{labelize(status)}</span>;
}

export function Avatar({ name, photoUrl, size = 42 }: { name?: string | null; photoUrl?: string | null; size?: number }) {
  return (
    <span className="ai-avatar" style={{ width: size, height: size }}>
      {photoUrl ? <img src={photoUrl} alt="" /> : initials(name)}
    </span>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return <div className="ai-empty"><span>◇</span><strong>{title}</strong><small>{message}</small></div>;
}

export function Sheet({
  open, title, subtitle, children, onClose, footer,
}: {
  open: boolean; title: string; subtitle?: string; children: ReactNode; onClose: () => void; footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="ai-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="ai-sheet" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header><span><strong>{title}</strong>{subtitle ? <small>{subtitle}</small> : null}</span><button type="button" onClick={onClose}>×</button></header>
        <div className="ai-sheet-body">{children}</div>
        {footer ? <footer>{footer}</footer> : null}
      </section>
    </div>
  );
}

export function AdvancedIdentityStyles({ primaryColor = "var(--primary-color, #2563eb)" }: { primaryColor?: string }) {
  return <style>{`:root{--ai-primary:${primaryColor}}${css}`}</style>;
}

const css = `
.ai-card{border:1px solid rgba(148,163,184,.2);background:var(--card-background,#fff);color:var(--text-color,#172033);border-radius:17px;padding:13px;box-shadow:0 5px 18px rgba(15,23,42,.04)}
.ai-avatar{display:grid;place-items:center;flex:0 0 auto;border-radius:13px;overflow:hidden;background:color-mix(in srgb,var(--ai-primary) 15%,transparent);color:var(--ai-primary);font-size:12px;font-weight:950}.ai-avatar img{width:100%;height:100%;object-fit:cover}
.ai-pill{display:inline-flex;align-items:center;width:max-content;border-radius:999px;padding:4px 7px;font-size:8px;font-weight:900}.ai-pill.green{color:#16803c;background:rgba(22,128,60,.1)}.ai-pill.red{color:#b62f25;background:rgba(192,54,44,.11)}.ai-pill.orange{color:#9a5b00;background:rgba(182,101,0,.12)}.ai-pill.blue{color:var(--ai-primary);background:color-mix(in srgb,var(--ai-primary) 11%,transparent)}.ai-pill.gray{color:#667085;background:rgba(102,112,133,.1)}
.ai-actions{display:flex;gap:7px;flex-wrap:wrap}.ai-actions button,.ai-button{border:1px solid rgba(148,163,184,.22);background:var(--card-background,#fff);color:inherit;border-radius:10px;padding:8px 11px;font-size:10px;font-weight:850;cursor:pointer}.ai-actions button.primary,.ai-button.primary{border-color:var(--ai-primary);background:var(--ai-primary);color:white}.ai-actions button.danger,.ai-button.danger{color:#b62f25}.ai-actions button:disabled,.ai-button:disabled{opacity:.45;cursor:not-allowed}
.ai-list{display:grid;gap:8px}.ai-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:9px}
.ai-form{display:grid;gap:12px}.ai-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.ai-field{display:grid;gap:4px}.ai-field.full{grid-column:1/-1}.ai-field>span{font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.04em;opacity:.58}.ai-field input,.ai-field select,.ai-field textarea{width:100%;box-sizing:border-box;border:1px solid rgba(148,163,184,.28);background:var(--input-background,transparent);color:inherit;border-radius:10px;padding:9px 10px;font:inherit;font-size:11px;outline:0}.ai-field textarea{min-height:78px;resize:vertical}.ai-field input:focus,.ai-field select:focus,.ai-field textarea:focus{border-color:var(--ai-primary);box-shadow:0 0 0 2px color-mix(in srgb,var(--ai-primary) 12%,transparent)}
.ai-empty{min-height:160px;display:grid;place-content:center;justify-items:center;text-align:center;gap:6px;padding:20px;color:var(--text-color,#172033)}.ai-empty>span{font-size:24px;color:var(--ai-primary)}.ai-empty strong{font-size:13px}.ai-empty small{font-size:10px;opacity:.6;max-width:330px}
.ai-backdrop{position:fixed;inset:0;z-index:100;background:rgba(15,23,42,.55);display:grid;place-items:end center;padding:10px}.ai-sheet{width:min(620px,100%);max-height:92vh;display:grid;grid-template-rows:auto minmax(0,1fr) auto;background:var(--card-background,#fff);color:var(--text-color,#172033);border-radius:22px 22px 14px 14px;overflow:hidden}.ai-sheet>header{display:flex;justify-content:space-between;gap:12px;padding:14px;border-bottom:1px solid rgba(148,163,184,.16)}.ai-sheet>header>span{display:grid}.ai-sheet>header strong{font-size:15px}.ai-sheet>header small{font-size:9px;opacity:.58}.ai-sheet>header button{border:0;background:rgba(148,163,184,.12);color:inherit;width:31px;height:31px;border-radius:10px;font-size:19px;cursor:pointer}.ai-sheet-body{overflow:auto;padding:14px}.ai-sheet>footer{display:flex;justify-content:flex-end;gap:7px;padding:12px 14px;border-top:1px solid rgba(148,163,184,.16)}
@media(min-width:780px){.ai-backdrop{place-items:stretch end;padding:0}.ai-sheet{width:min(520px,45vw);max-height:100vh;height:100%;border-radius:0}}
@media(max-width:600px){.ai-form-grid{grid-template-columns:1fr}.ai-field.full{grid-column:auto}}
`;
