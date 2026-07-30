"use client";
import type { VisitorProfileView, VisitorVisitView } from "../advanced-shared";
import { AdvancedIdentityStyles, EmptyState } from "../advanced-shared";
import { VisitorCard } from "./VisitorCard";
export function VisitorList({visitors,visits=[],primaryColor,onOpen,onCheckIn,onCheckOut}:{visitors:readonly VisitorProfileView[];visits?:readonly VisitorVisitView[];primaryColor?:string;onOpen?:(v:VisitorProfileView)=>void;onCheckIn?:(v:VisitorProfileView)=>void;onCheckOut?:(v:VisitorProfileView)=>void}) {
 const active=new Map(visits.filter(v=>v.checkedInAt&&!v.checkedOutAt).map(v=>[v.visitorId,v])); return <section className="ai-grid"><AdvancedIdentityStyles primaryColor={primaryColor}/>{visitors.length?visitors.map(v=><VisitorCard key={v.id} visitor={v} visit={active.get(v.id)} onOpen={onOpen} onCheckIn={onCheckIn} onCheckOut={onCheckOut}/>):<EmptyState title="No visitors" message="Visitor profiles will appear here."/ >}</section>
}
export default VisitorList;
