"use client";
import type { RouteView, StopView } from "../advanced-shared";
import { TransportJourneyMap, type TransportJourneyPath } from "../maps/TransportJourneyMap";
export function RouteMap({route,stops,height=380,selectedStopId,onStopSelect}:{route:RouteView;stops:readonly StopView[];height?:number|string;selectedStopId?:string|null;onStopSelect?:(stop:StopView)=>void}) {const valid=[...stops].filter(s=>s.routeId===route.id&&typeof s.latitude==="number"&&typeof s.longitude==="number").sort((a,b)=>a.order-b.order);const path:TransportJourneyPath={id:`route-${route.id}`,label:route.name,coordinates:valid.map(s=>({latitude:s.latitude!,longitude:s.longitude!}))};return <TransportJourneyMap transportStops={valid as never} journeyPaths={valid.length>1?[path]:[]} selectedMarkerId={selectedStopId} height={height} onMarkerSelect={m=>{const stop=valid.find(s=>String(s.id)===String(m.id));if(stop)onStopSelect?.(stop)}}/>}
export default RouteMap;
