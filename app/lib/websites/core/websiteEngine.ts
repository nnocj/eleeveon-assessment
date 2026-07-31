import { getWebsiteTemplate } from "../templates/registry";
import { resolveWebsiteData } from "../data/websiteDataResolver";
import type { ResolveWebsiteDataArgs, WebsiteSettingsDraft } from "../types";
export async function buildWebsiteRenderModel(args:ResolveWebsiteDataArgs & {draft:WebsiteSettingsDraft}){ const template=getWebsiteTemplate(args.draft.templateKey); if(!template) throw new Error(`Website template not installed: ${args.draft.templateKey}`); const data=await resolveWebsiteData(args); return {template,draft:args.draft,data}; }
