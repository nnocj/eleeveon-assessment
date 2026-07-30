"use client";

/**
 * app/branch-admin/modules/Visitors.tsx
 * --------------------------------------------------------------------------
 * ELEEVEON Visitors — PHASE 10
 *
 * Compact branch-scoped, offline-first module:
 * - selected workspace resolution;
 * - Dexie reads and syncUtils mutations;
 * - search, filters, cards, table and analytics;
 * - compact modal, action, status and More sheets.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useAccount } from "../../context/account-context";
import { useSettings } from "../../context/settings-context";
import { useActiveBranch } from "../../context/active-branch-context";
import { useActiveMembership } from "../../context/active-membership-context";
import { db } from "../../lib/db/db";
import { createLocal, updateLocal, softDeleteLocal } from "../../lib/sync/syncUtils";
import { useDataRevision } from "../../hooks/useDataRevision";
import { useBackgroundLoader } from "../../hooks/useBackgroundLoader";
import { PermissionGate } from "../../components/shared/PermissionGate";

type ViewMode = "cards" | "table" | "analytics";
type TenantRow = {accountId?:string|null;schoolId?:string|null;branchId?:string|null;isDeleted?:boolean;active?:boolean;status?:string|null};
type WorkspaceSession = {membership?:Record<string,unknown>|null;schoolId?:string|null;branchId?:string|null};
type DisplayRow = {id:string;kind:string;tableName:string;raw:any;title:string;subtitle:string;detail:string;status:string;time:number};

const OPEN_WORKSPACE_KEY = "eleeveon_open_workspace";
const PRIMARY_TABLE = "visitorProfiles";
const READ_ONLY = false;
const SOURCE_TABLES = [{"table": "visitorProfiles", "label": "Visitor"}, {"table": "visitorVisits", "label": "Visit"}];
const FIELD_CONFIG = [{"key": "fullName", "label": "Full Name", "type": "text", "options": []}, {"key": "phone", "label": "Phone", "type": "text", "options": []}, {"key": "email", "label": "Email", "type": "email", "options": []}, {"key": "organizationName", "label": "Organization", "type": "text", "options": []}, {"key": "identificationType", "label": "Identification Type", "type": "text", "options": []}, {"key": "identificationLastFour", "label": "ID Last Four", "type": "text", "options": []}, {"key": "blocked", "label": "Blocked", "type": "checkbox", "options": []}, {"key": "blockReason", "label": "Block Reason", "type": "textarea", "options": []}, {"key": "active", "label": "Active", "type": "checkbox", "options": []}];
const STATUS_KEYS = ["active", "denied", "inactive"];

const idOf=(v:unknown)=>v==null?"":String(v).trim();
const sameId=(a:unknown,b:unknown)=>idOf(a)===idOf(b);
const lower=(v:unknown)=>String(v||"").trim().toLowerCase();
const humanize=(v:unknown)=>{const t=String(v||"").trim();return t?t.replace(/[_-]+/g," ").replace(/\b\w/g,l=>l.toUpperCase()):"Not set"};
const tableSafe=(name:string)=>(db as any)[name];

function storageValue(key:string){if(typeof window==="undefined")return null;try{return window.localStorage.getItem(key)||window.sessionStorage.getItem(key)}catch{return null}}
function storedJson<T>(key:string):T|null{const raw=storageValue(key);if(!raw)return null;try{return JSON.parse(raw) as T}catch{return null}}
function firstId(...values:unknown[]){for(const value of values){const id=idOf(value);if(id&&id!=="0")return id}return ""}
function formatDate(value?:number|string|null){if(!value)return"Not recorded";const n=typeof value==="number"?value:new Date(value).getTime();if(!Number.isFinite(n))return"Not recorded";try{return new Intl.DateTimeFormat("en-GH",{month:"short",day:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(n))}catch{return"Not recorded"}}
function inputDate(value?:number|string|null){if(!value)return"";const d=new Date(typeof value==="number"?value:value);if(Number.isNaN(d.getTime()))return"";const pad=(n:number)=>String(n).padStart(2,"0");return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`}
function outputValue(field:any,value:any){if(field.type==="datetime-local")return value?new Date(value).getTime():null;if(field.type==="number")return value===""?null:Number(value);if(field.type==="checkbox")return Boolean(value);return value===""?null:value}
function defaultForm(){const value:Record<string,any>={};FIELD_CONFIG.forEach((field:any)=>{value[field.key]=field.type==="checkbox"?(field.key==="active"):field.type==="datetime-local"&&field.key==="startedAt"?inputDate(Date.now()):field.key==="status"&&field.options?.length?field.options[0]:""});return value}

export default function Module(){
 const router=useRouter(),revision=useDataRevision();
 const {loading,setLoading}=useBackgroundLoader();
 const {accountId,authenticated,loading:accountLoading}=useAccount();
 const {settings,loading:settingsLoading}=useSettings();
 const {activeSchool,activeSchoolId,activeBranch,activeBranchId,loading:contextLoading}=useActiveBranch();
 const {activeMembership}=useActiveMembership();
 const openWorkspace=useMemo(()=>storedJson<WorkspaceSession>(OPEN_WORKSPACE_KEY),[]);
 const storedMembership=useMemo(()=>storedJson<Record<string,unknown>>("activeMembership"),[]);
 const membership=(openWorkspace?.membership||activeMembership||storedMembership||{}) as Record<string,unknown>;
 const schoolId=firstId(openWorkspace?.schoolId,membership.schoolId,(membership.school as any)?.id,activeSchoolId,(activeSchool as any)?.id,(settings as any)?.schoolId,storageValue("activeSchoolId"));
 const branchId=firstId(openWorkspace?.branchId,membership.branchId,membership.schoolBranchId,(membership.branch as any)?.id,activeBranchId,(activeBranch as any)?.id,(settings as any)?.branchId,storageValue("activeBranchId"));
 const primary=settings?.primaryColor||"var(--primary-color,#2563eb)";
 const permissions=useMemo(()=>{const raw=membership.permissions;if(Array.isArray(raw))return raw.map(String);if(raw&&typeof raw==="object")return Object.entries(raw).filter(([,v])=>Boolean(v)).map(([k])=>k);return[]},[membership.permissions]);
 const role=lower(membership.role);
 const roleCanManage=["owner","super_admin","admin","branch_admin"].includes(role);
 const roleCanView=roleCanManage||["teacher","accountant"].includes(role);
 const canView=roleCanView||permissions.some(p=>["visitors.view","visitors.read","visitors.manage","identity.view"].includes(p));
 const canEdit=!READ_ONLY&&(roleCanManage||permissions.some(p=>["visitors.manage","visitors.write"].includes(p)));

 const [sourceRows,setSourceRows]=useState<Record<string,any[]>>({});
 const [viewMode,setViewMode]=useState<ViewMode>("cards");
 const [search,setSearch]=useState(""),[statusFilter,setStatusFilter]=useState("all"),[kindFilter,setKindFilter]=useState("all");
 const [filterOpen,setFilterOpen]=useState(false),[moreOpen,setMoreOpen]=useState(false),[statusOpen,setStatusOpen]=useState(false);
 const [modalOpen,setModalOpen]=useState(false),[actionRow,setActionRow]=useState<DisplayRow|null>(null),[editingId,setEditingId]=useState("");
 const [form,setForm]=useState<Record<string,any>>(defaultForm()),[saving,setSaving]=useState(false);
 const [toast,setToast]=useState<{tone:"success"|"error"|"info";message:string}|null>(null);

 const sameTenant=(row:TenantRow)=>(!row.accountId||row.accountId===accountId)&&(!row.schoolId||sameId(row.schoolId,schoolId))&&(!row.branchId||sameId(row.branchId,branchId))&&!row.isDeleted;
 const notify=(tone:"success"|"error"|"info",message:string)=>{setToast({tone,message});if(typeof window!=="undefined")window.setTimeout(()=>setToast(c=>c?.message===message?null:c),4200)};
 const load=async()=>{if(!authenticated||!accountId||!schoolId||!branchId||!canView){setSourceRows({});setLoading(false);return}try{setLoading(true);const pairs=await Promise.all(SOURCE_TABLES.map(async(source:any)=>[source.table,(await tableSafe(source.table)?.toArray?.())||[]]));const next:Record<string,any[]>={};pairs.forEach(([name,rows]:any)=>{next[name]=(rows||[]).filter((row:any)=>sameTenant(row))});setSourceRows(next)}catch(error){console.error("Failed to load Visitors:",error);notify("error","Failed to load Visitors.")}finally{setLoading(false)}};

 useEffect(()=>{if(accountLoading||contextLoading)return;if(!authenticated||!accountId)router.replace("/login");else if(!schoolId||!branchId)router.replace("/account")},[accountLoading,contextLoading,authenticated,accountId,schoolId,branchId,router]);
 useEffect(()=>{if(accountLoading||settingsLoading||contextLoading)return;void load();// eslint-disable-next-line react-hooks/exhaustive-deps
 },[authenticated,accountId,schoolId,branchId,accountLoading,settingsLoading,contextLoading,revision,canView]);

 const displayRows=useMemo<DisplayRow[]>(()=>{const result:DisplayRow[]=[];SOURCE_TABLES.forEach((source:any)=>{(sourceRows[source.table]||[]).forEach((row:any)=>{const title=row.fullName || 'Unnamed visitor';const subtitle=row.organizationName || row.phone || 'No organization';const detail=row.identificationLastFour ? `${row.identificationType || 'ID'} · ••••${row.identificationLastFour}` : 'No identification';const status=row.blocked ? "denied" : row.active === false ? "inactive" : "active";const time=Number(row.lastVisitAt || row.updatedAt || row.createdAt || 0);result.push({id:idOf(row.id),kind:source.label,tableName:source.table,raw:row,title:String(title||source.label),subtitle:String(subtitle||""),detail:String(detail||""),status,time})})});return result.sort((a,b)=>b.time-a.time||a.title.localeCompare(b.title))},[sourceRows]);

 const filteredRows=useMemo(()=>{const q=search.trim().toLowerCase();return displayRows.filter(row=>{if(kindFilter!=="all"&&row.kind!==kindFilter)return false;if(statusFilter!=="all"&&lower(row.status)!==statusFilter)return false;if(!q)return true;return `${row.title} ${row.subtitle} ${row.detail} ${row.status} ${row.kind}`.toLowerCase().includes(q)})},[displayRows,search,statusFilter,kindFilter]);
 const primaryRows=displayRows.filter(row=>row.tableName===PRIMARY_TABLE);
 const statusCounts=useMemo(()=>Object.fromEntries(STATUS_KEYS.map((key:string)=>[key,displayRows.filter(row=>lower(row.status)===key).length])),[displayRows]);
 const activeFilters=[statusFilter!=="all"?statusFilter:"",kindFilter!=="all"?kindFilter:""].filter(Boolean).length;

 function openCreate(){if(!canEdit)return;setEditingId("");setForm(defaultForm());setModalOpen(true)}
 function openEdit(row:DisplayRow){if(!canEdit||row.tableName!==PRIMARY_TABLE)return;const next=defaultForm();FIELD_CONFIG.forEach((field:any)=>{const value=row.raw[field.key];next[field.key]=field.type==="datetime-local"?inputDate(value):field.type==="checkbox"?Boolean(value):value??""});setEditingId(row.id);setForm(next);setActionRow(null);setModalOpen(true)}
 async function save(){if(!canEdit)return notify("error","You do not have permission to edit this module.");try{setSaving(true);const payload:any={accountId,schoolId,branchId,isDeleted:false};FIELD_CONFIG.forEach((field:any)=>payload[field.key]=outputValue(field,form[field.key]));if(editingId)await updateLocal(PRIMARY_TABLE,editingId,payload);else await createLocal(PRIMARY_TABLE,payload);setModalOpen(false);await load();notify("success",editingId?"Visitor Profile updated successfully.":"Visitor Profile created successfully.")}catch(error){console.error(error);notify("error",error instanceof Error?error.message:"Failed to save Visitor Profile.")}finally{setSaving(false)}}
 async function remove(row:DisplayRow){if(!canEdit||row.tableName!==PRIMARY_TABLE)return;try{await softDeleteLocal(PRIMARY_TABLE,row.id);setActionRow(null);await load();notify("success","Visitor Profile removed.")}catch(error){console.error(error);notify("error","Failed to remove Visitor Profile.")}}

 if(accountLoading||contextLoading||settingsLoading||loading)return <RouteState primary={primary} title="Opening Visitors..." text="Checking the active workspace and local records."/>;
 if(!authenticated||!accountId)return <RouteState primary={primary} title="Redirecting to login..." text="You must sign in before opening this module."/>;
 if(!schoolId||!branchId)return <RouteState primary={primary} title="No branch workspace selected" text="Select the correct branch workspace and reopen this module."/>;

 return <PermissionGate allowed={canView} fallback={<RouteState primary={primary} title="Access restricted" text="Your active membership does not allow you to view Visitors."/>}>
  <main className="ba-page" style={{"--ba-primary":primary} as React.CSSProperties}><style>{css}</style>
   {toast?<div className={`toast ${toast.tone}`}><span>{toast.message}</span><button onClick={()=>setToast(null)}>×</button></div>:null}
   <section className="ba-toolbar">
    <button className={`dot ${displayRows.length?"green":"gray"}`} onClick={()=>setStatusOpen(true)} aria-label="Open status"/>
    <label className="search"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search visitors..."/></label>
    {!READ_ONLY?<button className="add" onClick={openCreate} disabled={!canEdit}>+</button>:<button className="add" onClick={()=>void load()}>Refresh</button>}
    <button className={`icon ${activeFilters?"active":""}`} onClick={()=>setFilterOpen(true)} aria-label="Open filters"><SliderIcon/>{activeFilters?<b>{activeFilters}</b>:null}</button>
    <button className="icon" onClick={()=>setMoreOpen(true)} aria-label="Open more">⋯</button>
   </section>
   {activeFilters?<section className="chips">{kindFilter!=="all"?<span>{kindFilter}</span>:null}{statusFilter!=="all"?<span>{humanize(statusFilter)}</span>:null}</section>:null}

   {viewMode==="analytics"?<section className="analytics"><Metric label="Total Records" value={displayRows.length}/><Metric label="Primary Records" value={primaryRows.length}/>{STATUS_KEYS.map((key:string)=><Metric key={key} label={humanize(key)} value={statusCounts[key]||0}/>)}{SOURCE_TABLES.length>1?SOURCE_TABLES.map((source:any)=><Metric key={source.table} label={source.label} value={(sourceRows[source.table]||[]).length}/>):null}</section>
   :viewMode==="table"?<section className="table-card"><div className="scroll"><table><thead><tr><th>Visitors ({filteredRows.length})</th><th>Type</th><th>Detail</th><th>Status</th><th>Updated</th><th/></tr></thead><tbody>{filteredRows.map(row=><tr key={`${row.tableName}:${row.id}`}><td><strong>{row.title}</strong><br/><small>{row.subtitle}</small></td><td>{row.kind}</td><td>{row.detail}</td><td><span className={`badge ${lower(row.status)}`}>{humanize(row.status)}</span></td><td>{formatDate(row.time)}</td><td>{row.tableName===PRIMARY_TABLE&&canEdit?<button className="table-action" onClick={()=>openEdit(row)}>Edit</button>:null}</td></tr>)}</tbody></table></div></section>
   :<section className="list">{filteredRows.map(row=><article className="row" key={`${row.tableName}:${row.id}`}><span className="avatar">♧</span><span className="main"><strong>{row.title}</strong><small>{row.subtitle}</small><em>{row.detail} · {formatDate(row.time)}</em></span><span className="side"><span className={`badge ${lower(row.status)}`}>{humanize(row.status)}</span>{row.tableName===PRIMARY_TABLE&&canEdit?<button onClick={()=>setActionRow(row)}>⋯</button>:null}</span></article>)}</section>}
   {!filteredRows.length?<section className="empty"><i>♧</i><h3>No records found</h3><p>No visitors match the current search and filters.</p></section>:null}

   {filterOpen?<Sheet title="Filters" text="Narrow the records shown on this page." onClose={()=>setFilterOpen(false)}><div className="form"><Field label="Record Type"><select value={kindFilter} onChange={e=>setKindFilter(e.target.value)}><option value="all">All types</option>{SOURCE_TABLES.map((source:any)=><option key={source.table} value={source.label}>{source.label}</option>)}</select></Field><Field label="Status"><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">All statuses</option>{STATUS_KEYS.map((key:string)=><option key={key} value={key}>{humanize(key)}</option>)}</select></Field></div><div className="footer"><button onClick={()=>{setKindFilter("all");setStatusFilter("all")}}>Clear</button><button className="primary" onClick={()=>setFilterOpen(false)}>Apply</button></div></Sheet>:null}

   {moreOpen?<Sheet title="More" text="Change view or refresh this module." onClose={()=>setMoreOpen(false)}><section className="more-section"><span>View</span><div className="more-grid">{(["cards","table","analytics"] as ViewMode[]).map(mode=><button key={mode} className={viewMode===mode?"active":""} onClick={()=>{setViewMode(mode);setMoreOpen(false)}}><strong>{humanize(mode)}</strong><small>{mode==="cards"?"Compact mobile-first rows":mode==="table"?"Dense desktop view":"Record summary"}</small></button>)}</div></section><section className="more-section"><span>Actions</span><div className="actions">{!READ_ONLY?<button onClick={()=>{setMoreOpen(false);openCreate()}}>Add Visitor Profile</button>:null}<button onClick={async()=>{setMoreOpen(false);await load()}}>Refresh</button></div></section></Sheet>:null}

   {statusOpen?<Sheet title="Visitors Status" text="Current branch record summary." onClose={()=>setStatusOpen(false)}><div className="status-list"><StatusLine label="All records" value={displayRows.length}/>{SOURCE_TABLES.map((source:any)=><StatusLine key={source.table} label={source.label} value={(sourceRows[source.table]||[]).length}/>)}{STATUS_KEYS.map((key:string)=><StatusLine key={key} label={humanize(key)} value={statusCounts[key]||0}/>)}</div></Sheet>:null}

   {modalOpen?<div className="backdrop" onMouseDown={()=>setModalOpen(false)}><section className="modal" onMouseDown={e=>e.stopPropagation()}><div className="sheet-head"><div><h2>{editingId?"Edit":"Add"} Visitor Profile</h2><p>Complete the fields below.</p></div><button onClick={()=>setModalOpen(false)}>×</button></div><div className="form">{FIELD_CONFIG.map((field:any)=><DynamicField key={field.key} field={field} value={form[field.key]} onChange={(value:any)=>setForm(current=>({...current,[field.key]:value}))}/>)}</div><div className="footer"><button onClick={()=>setModalOpen(false)}>Cancel</button><button className="primary" onClick={save} disabled={saving}>{saving?"Saving...":"Save"}</button></div></section></div>:null}

   {actionRow?<Sheet title={actionRow.title} text={actionRow.subtitle} onClose={()=>setActionRow(null)}><div className="status-list"><StatusLine label="Type" value={actionRow.kind}/><StatusLine label="Status" value={humanize(actionRow.status)}/><StatusLine label="Detail" value={actionRow.detail}/><StatusLine label="Updated" value={formatDate(actionRow.time)}/></div>{canEdit&&actionRow.tableName===PRIMARY_TABLE?<div className="footer"><button className="danger" onClick={()=>remove(actionRow)}>Remove</button><button className="primary" onClick={()=>openEdit(actionRow)}>Edit</button></div>:null}</Sheet>:null}
  </main>
 </PermissionGate>
}

function SliderIcon(){return <svg className="slider" viewBox="0 0 24 24"><path d="M4 7h9"/><path d="M17 7h3"/><circle cx="15" cy="7" r="2"/><path d="M4 17h3"/><path d="M11 17h9"/><circle cx="9" cy="17" r="2"/></svg>}
function Metric({label,value}:{label:string;value:React.ReactNode}){return <article className="metric"><span>{label}</span><strong>{value}</strong></article>}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="field"><span>{label}</span>{children}</label>}
function DynamicField({field,value,onChange}:{field:any;value:any;onChange:(value:any)=>void}){if(field.type==="checkbox")return <label className="field"><span>{field.label}</span><select value={value?"yes":"no"} onChange={e=>onChange(e.target.value==="yes")}><option value="yes">Yes</option><option value="no">No</option></select></label>;if(field.type==="select")return <Field label={field.label}><select value={value??""} onChange={e=>onChange(e.target.value)}>{field.options.map((option:string)=><option key={option} value={option}>{humanize(option)}</option>)}</select></Field>;if(field.type==="textarea")return <label className="field full"><span>{field.label}</span><textarea value={value??""} onChange={e=>onChange(e.target.value)}/></label>;return <Field label={field.label}><input type={field.type} value={value??""} onChange={e=>onChange(e.target.value)}/></Field>}
function Sheet({title,text,children,onClose}:{title:string;text:string;children:React.ReactNode;onClose:()=>void}){return <div className="backdrop" onMouseDown={onClose}><section className="sheet" onMouseDown={e=>e.stopPropagation()}><div className="sheet-head"><div><h2>{title}</h2><p>{text}</p></div><button onClick={onClose}>×</button></div>{children}</section></div>}
function StatusLine({label,value}:{label:string;value:React.ReactNode}){return <div><span>{label}</span><strong>{value}</strong></div>}
function RouteState({primary,title,text}:{primary:string;title:string;text:string}){return <main className="ba-page" style={{"--ba-primary":primary} as React.CSSProperties}><style>{css}</style><section className="state"><h2>{title}</h2><p>{text}</p></section></main>}

const css = `
.ba-page{--ba-border:color-mix(in srgb,var(--foreground,#172033) 12%,transparent);--ba-muted:color-mix(in srgb,var(--foreground,#172033) 62%,transparent);--ba-soft:color-mix(in srgb,var(--foreground,#172033) 5%,transparent);color:var(--foreground,#172033);display:grid;gap:9px;padding:clamp(8px,1.8vw,16px);min-width:0}
.ba-toolbar{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto auto;align-items:center;gap:5px}
.dot{width:10px;height:10px;border:0;border-radius:50%;padding:0;background:#94a3b8;box-shadow:0 0 0 3px color-mix(in srgb,currentColor 12%,transparent);cursor:pointer}.dot.green{background:#22c55e}.dot.orange{background:#f59e0b}.dot.red{background:#ef4444}
.search{height:37px;display:flex;align-items:center;gap:7px;padding:0 9px;border:1px solid var(--ba-border);border-radius:11px;background:var(--background,#fff);min-width:0}.search span{font-size:18px;opacity:.55}.search input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:inherit;font:inherit;font-size:11px}
.add,.icon,.save{height:37px;border:1px solid var(--ba-border);border-radius:10px;background:var(--background,#fff);color:inherit;font:inherit;font-weight:850;cursor:pointer}.add,.save{padding:0 11px;color:var(--ba-primary);font-size:10px}.icon{width:37px;font-size:17px;display:grid;place-items:center;position:relative}.icon.active{color:var(--ba-primary);border-color:color-mix(in srgb,var(--ba-primary) 35%,transparent)}.icon b{position:absolute;right:-5px;top:-5px;min-width:16px;height:16px;padding:0 3px;display:grid;place-items:center;border-radius:99px;background:var(--ba-primary);color:#fff;font-size:8px}.slider{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round}
.chips{display:flex;gap:5px;flex-wrap:wrap}.chips span{padding:4px 8px;border:1px solid var(--ba-border);border-radius:99px;background:var(--background,#fff);color:var(--ba-muted);font-size:8px;font-weight:750}
.list{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,315px),1fr));gap:7px}.row{min-width:0;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:8px;padding:9px;border:1px solid var(--ba-border);border-radius:12px;background:var(--background,#fff);color:inherit;text-align:left}.row.clickable{cursor:pointer}.row:hover{border-color:color-mix(in srgb,var(--ba-primary) 28%,transparent)}.avatar{width:35px;height:35px;display:grid;place-items:center;border-radius:10px;background:color-mix(in srgb,var(--ba-primary) 11%,transparent);color:var(--ba-primary);font-size:15px;font-weight:900}.main{min-width:0;display:grid;gap:1px}.main strong,.main small,.main em{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.main strong{font-size:10.5px}.main small{font-size:8.3px;color:var(--ba-muted)}.main em{font-size:7.5px;color:var(--ba-muted);font-style:normal}.side{display:grid;justify-items:end;gap:4px}.badge{display:inline-flex;padding:3px 7px;border-radius:99px;background:var(--ba-soft);color:var(--ba-muted);font-size:7.5px;font-weight:850}.badge.active,.badge.approved,.badge.accepted,.badge.online,.badge.completed,.badge.safe,.badge.issued{background:color-mix(in srgb,#22c55e 10%,transparent);color:#15803d}.badge.pending,.badge.maintenance,.badge.requested,.badge.verified,.badge.boarding,.badge.in_transit,.badge.expected{background:color-mix(in srgb,#f59e0b 10%,transparent);color:#b45309}.badge.denied,.badge.failed,.badge.revoked,.badge.expired,.badge.disabled,.badge.cancelled,.badge.missing,.badge.injured{background:color-mix(in srgb,#ef4444 10%,transparent);color:#b91c1c}.side button{border:0;background:transparent;color:var(--ba-muted);font-size:17px;cursor:pointer}
.table-card{border:1px solid var(--ba-border);border-radius:12px;overflow:hidden;background:var(--background,#fff)}.scroll{overflow:auto}.scroll table{width:100%;min-width:720px;border-collapse:collapse;font-size:8.7px}.scroll th,.scroll td{padding:8px;text-align:left;border-bottom:1px solid var(--ba-border)}.scroll th{color:var(--ba-muted);font-size:7.8px;text-transform:uppercase}.table-action{border:1px solid var(--ba-border);border-radius:7px;background:transparent;color:var(--ba-primary);padding:5px 7px;font-size:7.5px;font-weight:850}
.analytics{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:7px}.metric{padding:10px;border:1px solid var(--ba-border);border-radius:11px;background:var(--background,#fff);display:grid;gap:3px}.metric span{font-size:7.8px;color:var(--ba-muted);font-weight:850;text-transform:uppercase}.metric strong{font-size:17px;color:var(--ba-primary)}
.empty,.state{min-height:210px;display:grid;place-items:center;align-content:center;gap:5px;padding:22px;border:1px dashed var(--ba-border);border-radius:14px;text-align:center}.empty h3,.state h2{font-size:13px;margin:0}.empty p,.state p{font-size:9px;color:var(--ba-muted);margin:0;max-width:430px;line-height:1.55}.empty i{font-size:25px;font-style:normal}
.toast{position:sticky;top:7px;z-index:60;display:flex;justify-content:space-between;gap:8px;padding:9px 10px;border:1px solid var(--ba-border);border-radius:10px;background:var(--background,#fff);font-size:8.7px;font-weight:750}.toast.success{border-color:color-mix(in srgb,#22c55e 38%,transparent)}.toast.error{border-color:color-mix(in srgb,#ef4444 38%,transparent)}.toast button{border:0;background:transparent;color:inherit}
.backdrop{position:fixed;inset:0;z-index:100;display:grid;place-items:end center;padding:8px;background:rgba(15,23,42,.58)}.sheet,.modal{width:min(580px,100%);max-height:92vh;overflow:auto;box-sizing:border-box;padding:12px;border:1px solid var(--ba-border);border-radius:20px 20px 12px 12px;background:var(--background,#fff);color:var(--foreground,#172033)}.modal{width:min(680px,100%)}.sheet-head{display:flex;justify-content:space-between;align-items:flex-start;gap:9px;padding-bottom:9px;border-bottom:1px solid var(--ba-border)}.sheet-head h2{margin:0;font-size:13px}.sheet-head p{margin:2px 0 0;font-size:8.3px;color:var(--ba-muted)}.sheet-head button{width:29px;height:29px;border:1px solid var(--ba-border);border-radius:8px;background:transparent;color:inherit;font-size:16px}
.form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding-top:10px}.field{display:grid;gap:4px;min-width:0}.field>span{font-size:7.8px;color:var(--ba-muted);font-weight:850;text-transform:uppercase}.field input,.field select,.field textarea{width:100%;box-sizing:border-box;padding:9px;border:1px solid var(--ba-border);border-radius:9px;background:var(--background,#fff);color:inherit;font:inherit;font-size:9px}.field textarea{min-height:78px;resize:vertical}.full{grid-column:1/-1}.footer{display:flex;justify-content:flex-end;gap:7px;padding-top:11px}.footer button{padding:8px 12px;border:1px solid var(--ba-border);border-radius:9px;background:transparent;color:inherit;font-size:8.5px;font-weight:850}.footer .primary{border-color:var(--ba-primary);background:var(--ba-primary);color:#fff}
.more-section{display:grid;gap:7px;padding:10px 0}.more-section>span{font-size:7.8px;color:var(--ba-muted);font-weight:900;text-transform:uppercase}.more-grid,.actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.more-grid button,.actions button{display:grid;gap:2px;min-height:37px;padding:8px;border:1px solid var(--ba-border);border-radius:9px;background:transparent;color:inherit;text-align:left;font-size:8.5px;font-weight:750}.more-grid button.active{border-color:color-mix(in srgb,var(--ba-primary) 40%,transparent);background:color-mix(in srgb,var(--ba-primary) 8%,transparent)}.more-grid small{font-size:7.3px;color:var(--ba-muted)}
.status-list{display:grid;padding-top:6px}.status-list div{display:flex;justify-content:space-between;gap:10px;padding:8px 1px;border-bottom:1px solid var(--ba-border);font-size:8.7px}.status-list span{color:var(--ba-muted)}.status-list strong{color:var(--ba-primary)}
.danger{color:#b91c1c!important}
@media(max-width:640px){.ba-page{padding:7px}.ba-toolbar{gap:4px}.search,.add,.icon,.save{height:35px}.icon{width:35px}.row{grid-template-columns:auto minmax(0,1fr)}.side{grid-column:1/-1;display:flex;align-items:center;justify-content:flex-end}.form,.more-grid,.actions{grid-template-columns:1fr}}
`;
