"use client";
import React from "react";
import { getWebsiteTemplate } from "../templates/registry";
import { useWebsiteData } from "../data/useWebsiteData";
import type { WebsiteSettingsDraft } from "../types";
export default function WebsitePreview(props:{draft:WebsiteSettingsDraft;accountId?:string|null;schoolId?:string|null;branchId?:string|null;schoolName?:string;branchName?:string;primaryColor?:string}){
 const template=getWebsiteTemplate(props.draft.templateKey); const {data}=useWebsiteData({accountId:props.accountId||undefined,schoolId:props.schoolId||undefined,branchId:props.branchId,websiteSettingId:props.draft.id,draft:props.draft});
 if(!template)return <div className="website-template-empty">No website templates are installed.</div>;
 const C=template.component; return <C {...props} data={data} compact/>;
}
