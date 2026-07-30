"use client";
import type { ReactNode } from "react";
import type { IdentityCardTemplateConfig, IdentityCardView } from "../advanced-shared";
import { IdentityCardTemplate } from "./IdentityCardTemplate";
export function IdentityCardPreview({card,config,credentialContent,scale=1}:{card:IdentityCardView;config?:IdentityCardTemplateConfig;credentialContent?:ReactNode;scale?:number}) {return <div style={{overflow:"auto",padding:12}}><div style={{width:"max-content",transform:`scale(${scale})`,transformOrigin:"top left"}}><IdentityCardTemplate card={card} config={config} credentialContent={credentialContent}/></div></div>}
export default IdentityCardPreview;
