import type { SeedTemplate, SeedDefinition } from "../types";
import { ghanaEarlyChildhoodTemplate } from "./ghanaEarlyChildhood";
import { ghanaPrimaryTemplate } from "./ghanaPrimary";
import { ghanaJhsTemplate } from "./ghanaJhs";
const merge=(a:SeedDefinition[],b:SeedDefinition[])=>[...a,...b.filter(x=>!a.some(y=>y.key===x.key))];
export const ghanaBasicSchoolTemplate:SeedTemplate={
 code:"ghana-basic-school-v1",version:1,name:"Ghana Basic School",
 organizations:[...ghanaEarlyChildhoodTemplate.organizations,...ghanaPrimaryTemplate.organizations,...ghanaJhsTemplate.organizations],
 academicStructures:[...ghanaEarlyChildhoodTemplate.academicStructures,...ghanaPrimaryTemplate.academicStructures,...ghanaJhsTemplate.academicStructures],
 academicPeriods:[...ghanaEarlyChildhoodTemplate.academicPeriods,...ghanaPrimaryTemplate.academicPeriods,...ghanaJhsTemplate.academicPeriods],
 classes:[...ghanaEarlyChildhoodTemplate.classes,...ghanaPrimaryTemplate.classes,...ghanaJhsTemplate.classes],
 subjects:merge(merge(ghanaEarlyChildhoodTemplate.subjects,ghanaPrimaryTemplate.subjects),ghanaJhsTemplate.subjects),
 curriculums:[...ghanaEarlyChildhoodTemplate.curriculums,...ghanaPrimaryTemplate.curriculums,...ghanaJhsTemplate.curriculums],
 curriculumPathways:[...ghanaEarlyChildhoodTemplate.curriculumPathways,...ghanaPrimaryTemplate.curriculumPathways,...ghanaJhsTemplate.curriculumPathways],
 curriculumSubjects:[...ghanaEarlyChildhoodTemplate.curriculumSubjects.map(x=>({...x,key:`ec:${x.key}`})),...ghanaPrimaryTemplate.curriculumSubjects.map(x=>({...x,key:`pri:${x.key}`})),...ghanaJhsTemplate.curriculumSubjects.map(x=>({...x,key:`jhs:${x.key}`}))],
 subjectPrerequisites:[],
 classSubjects:[...ghanaEarlyChildhoodTemplate.classSubjects.map(x=>({...x,curriculumSubjectKey:`ec:${x.curriculumSubjectKey}`})),...ghanaPrimaryTemplate.classSubjects.map(x=>({...x,curriculumSubjectKey:`pri:${x.curriculumSubjectKey}`})),...ghanaJhsTemplate.classSubjects.map(x=>({...x,curriculumSubjectKey:`jhs:${x.curriculumSubjectKey}`}))],
 gradingSystems:ghanaPrimaryTemplate.gradingSystems,gradeRules:ghanaPrimaryTemplate.gradeRules,
 assessmentStructures:[...ghanaEarlyChildhoodTemplate.assessmentStructures.map(x=>({...x,key:"ec-standard"})),...ghanaPrimaryTemplate.assessmentStructures.map(x=>({...x,key:"pri-standard"})),...ghanaJhsTemplate.assessmentStructures.map(x=>({...x,key:"jhs-standard"}))],
 assessmentStructureItems:[...ghanaEarlyChildhoodTemplate.assessmentStructureItems.map(x=>({...x,key:`ec:${x.key}`,assessmentStructureKey:"ec-standard"})),...ghanaPrimaryTemplate.assessmentStructureItems.map(x=>({...x,key:`pri:${x.key}`,assessmentStructureKey:"pri-standard"})),...ghanaJhsTemplate.assessmentStructureItems.map(x=>({...x,key:`jhs:${x.key}`,assessmentStructureKey:"jhs-standard"}))],
 assessmentApplicabilities:[]
};
ghanaBasicSchoolTemplate.assessmentApplicabilities=ghanaBasicSchoolTemplate.classSubjects.map(cs=>({key:cs.key,classSubjectKey:cs.key,assessmentStructureKey:String(cs.academicStructureKey)==="early-childhood"?"ec-standard":String(cs.academicStructureKey)==="primary"?"pri-standard":"jhs-standard",gradingSystemKey:"percentage"}));
