import type { SeedTemplate, SetupTemplateCode } from "../types";
import { ghanaEarlyChildhoodTemplate } from "./ghanaEarlyChildhood";
import { ghanaPrimaryTemplate } from "./ghanaPrimary";
import { ghanaJhsTemplate } from "./ghanaJhs";
import { ghanaBasicSchoolTemplate } from "./ghanaBasicSchool";
import { ghanaShsTemplate } from "./ghanaShs";
import { ghanaFullSchoolTemplate } from "./ghanaFullSchool";
export const setupTemplates:Record<SetupTemplateCode,SeedTemplate>={
 "ghana-early-childhood-v1":ghanaEarlyChildhoodTemplate,"ghana-primary-v1":ghanaPrimaryTemplate,"ghana-jhs-v1":ghanaJhsTemplate,
 "ghana-basic-school-v1":ghanaBasicSchoolTemplate,"ghana-shs-v1":ghanaShsTemplate,"ghana-full-school-v1":ghanaFullSchoolTemplate
};
export const getSetupTemplate=(code:SetupTemplateCode):SeedTemplate=>{const template=setupTemplates[code];if(!template)throw new Error(`Unknown setup template: ${code}`);return template;};
