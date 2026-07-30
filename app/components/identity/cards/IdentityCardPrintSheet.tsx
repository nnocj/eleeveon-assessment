"use client";
import type { ReactNode } from "react";
import type { IdentityCardTemplateConfig, IdentityCardView } from "../advanced-shared";
import { AdvancedIdentityStyles, Sheet } from "../advanced-shared";
import { IdentityCardTemplate } from "./IdentityCardTemplate";
export function IdentityCardPrintSheet({open,cards,config,primaryColor,credentialContent,onClose,onPrinted}:{open:boolean;cards:readonly IdentityCardView[];config?:IdentityCardTemplateConfig;primaryColor?:string;credentialContent?:(card:IdentityCardView)=>ReactNode;onClose:()=>void;onPrinted?:()=>void}) {const print=()=>{window.print();onPrinted?.()};return <><AdvancedIdentityStyles primaryColor={primaryColor}/><style>{css}</style><Sheet open={open} title="Print identity cards" subtitle={`${cards.length} card(s)`} onClose={onClose} footer={<><button className="ai-button" onClick={onClose}>Close</button><button className="ai-button primary" disabled={!cards.length} onClick={print}>Print cards</button></>}><div className="identity-print-grid">{cards.map(card=><IdentityCardTemplate key={card.id} card={card} config={config} credentialContent={credentialContent?.(card)}/>)}</div></Sheet></>}
const css=`.identity-print-grid{display:grid;gap:16px;justify-items:center}@media print{body>*{visibility:hidden}.identity-print-grid,.identity-print-grid *{visibility:visible}.identity-print-grid{position:absolute;inset:0;display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.identity-card-template{break-inside:avoid;transform:scale(.7);transform-origin:top left}}`;
export default IdentityCardPrintSheet;
