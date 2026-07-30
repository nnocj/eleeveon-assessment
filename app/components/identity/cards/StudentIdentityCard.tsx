"use client";
import type { ReactNode } from "react";
import type { IdentityCardTemplateConfig, IdentityCardView } from "../advanced-shared";
import { AdvancedIdentityStyles, StatusPill } from "../advanced-shared";
import { IdentityCardTemplate } from "./IdentityCardTemplate";
export function StudentIdentityCard({card,config,credentialContent,primaryColor,onPrint,onReplace,onRevoke}:{card:IdentityCardView;config?:IdentityCardTemplateConfig;credentialContent?:ReactNode;primaryColor?:string;onPrint?:(v:IdentityCardView)=>void;onReplace?:(v:IdentityCardView)=>void;onRevoke?:(v:IdentityCardView)=>void}) {return <section className="ai-card" style={{display:"grid",gap:10}}><AdvancedIdentityStyles primaryColor={primaryColor}/><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><strong>{card.studentName}</strong><StatusPill status={card.status}/></div><IdentityCardTemplate card={card} config={config} credentialContent={credentialContent}/><div className="ai-actions">{onPrint?<button className="primary" onClick={()=>onPrint(card)}>Print</button>:null}{onReplace?<button onClick={()=>onReplace(card)}>Replace</button>:null}{onRevoke?<button className="danger" onClick={()=>onRevoke(card)}>Revoke</button>:null}</div></section>}
export default StudentIdentityCard;
