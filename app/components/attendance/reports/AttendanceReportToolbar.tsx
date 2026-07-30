"use client";
import type { CSSProperties, ReactNode } from "react";
export function AttendanceReportToolbar({
  title="Attendance report",resultCount,query="",view="table",busy=false,primaryColor="var(--primary-color, #2563eb)",
  extraActions,onQueryChange,onViewChange,onRefresh,onPrint,onExport,
}:{
  title?:string;resultCount?:number;query?:string;view?:"table"|"preview";busy?:boolean;primaryColor?:string;extraActions?:ReactNode;
  onQueryChange?:(value:string)=>void;onViewChange?:(view:"table"|"preview")=>void;onRefresh?:()=>void;onPrint?:()=>void;onExport?:()=>void;
}) {
 return <header className="art-bar" style={{"--art-primary":primaryColor} as CSSProperties}><style>{css}</style>
  <span className="art-title"><strong>{title}</strong>{resultCount!=null?<small>{resultCount} result(s)</small>:null}</span>
  {onQueryChange?<label className="art-search"><span>⌕</span><input value={query} onChange={e=>onQueryChange(e.target.value)} placeholder="Search students..."/></label>:null}
  <nav>{onViewChange?<span className="art-toggle"><button type="button" className={view==="table"?"active":""} onClick={()=>onViewChange("table")}>Table</button><button type="button" className={view==="preview"?"active":""} onClick={()=>onViewChange("preview")}>Preview</button></span>:null}
  {onRefresh?<button type="button" onClick={onRefresh} disabled={busy}>↻</button>:null}{onPrint?<button type="button" onClick={onPrint} disabled={busy}>Print</button>:null}{onExport?<button type="button" className="primary" onClick={onExport} disabled={busy}>Export</button>:null}{extraActions}</nav>
 </header>;
}
const css=`
.art-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;color:var(--text-color,#172033)}.art-title{display:grid;margin-right:auto}.art-title strong{font-size:14px}.art-title small{font-size:8px;opacity:.55}.art-search{min-width:180px;flex:0 1 280px;display:flex;align-items:center;gap:6px;border:1px solid rgba(148,163,184,.25);background:var(--card-background,#fff);border-radius:11px;padding:0 9px}.art-search input{border:0;outline:0;background:transparent;color:inherit;width:100%;padding:9px 0;font:inherit;font-size:10px}.art-bar nav{display:flex;gap:5px;align-items:center}.art-bar nav>button,.art-toggle button{border:1px solid rgba(148,163,184,.22);background:var(--card-background,#fff);color:inherit;border-radius:9px;padding:8px 9px;font-size:9px;font-weight:800;cursor:pointer}.art-bar nav>button.primary{background:var(--art-primary);border-color:var(--art-primary);color:white}.art-toggle{display:flex;padding:2px;border-radius:10px;background:rgba(148,163,184,.11)}.art-toggle button{border:0;background:transparent}.art-toggle button.active{background:var(--card-background,#fff);color:var(--art-primary)}.art-bar button:disabled{opacity:.5}
@media(max-width:680px){.art-search{order:3;flex-basis:100%}.art-bar nav{margin-left:auto}}
`;
export default AttendanceReportToolbar;
