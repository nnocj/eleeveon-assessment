"use client";
import type { PickupAuthorizationView } from "../advanced-shared";
import { AdvancedIdentityStyles, EmptyState } from "../advanced-shared";
import { AuthorizedPickupCard } from "./AuthorizedPickupCard";
export function PickupAuthorizationList({items,primaryColor,selectedId,emptyMessage="No pickup authorizations found.",onSelect,onEdit,onRevoke}:{items:readonly PickupAuthorizationView[];primaryColor?:string;selectedId?:string|null;emptyMessage?:string;onSelect?:(v:PickupAuthorizationView)=>void;onEdit?:(v:PickupAuthorizationView)=>void;onRevoke?:(v:PickupAuthorizationView)=>void}) {
 return <section className="ai-grid"><AdvancedIdentityStyles primaryColor={primaryColor}/>{items.length?items.map(item=><AuthorizedPickupCard key={item.id} authorization={item} selected={selectedId===item.id} onSelect={onSelect} onEdit={onEdit} onRevoke={onRevoke}/>):<EmptyState title="No authorizations" message={emptyMessage}/>}</section>
}
export default PickupAuthorizationList;
