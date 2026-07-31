import type { SeedTemplate } from "../types";
import { assessmentItems, defaultPeriods, percentageGrades } from "./common";

const classes = [1,2,3].map(i=>({key:`jhs-${i}`,name:`JHS ${i}`,code:`JHS${i}`,level:"junior_high"}));
const subjects = [
 ["english","English Language","ENG"],["mathematics","Mathematics","MATH"],["science","Integrated Science","SCI"],
 ["social-studies","Social Studies","SOC"],["computing","Computing","COMP"],["career-technology","Career Technology","CT"],
 ["creative-arts","Creative Arts and Design","CAD"],["rme","Religious and Moral Education","RME"],["ghanaian-language","Ghanaian Language","GHL"],
 ["physical-education","Physical Education","PE"]
].map(([key,name,code])=>({key,name,code,category:"core"}));
const curriculumSubjects=subjects.map((s,i)=>({key:s.key,subjectKey:s.key,curriculumKey:"jhs",type:"core",orderIndex:i+1}));
const classSubjects=classes.flatMap(c=>curriculumSubjects.map(cs=>({key:`${c.key}:${cs.key}`,classKey:c.key,subjectKey:cs.subjectKey,curriculumSubjectKey:cs.key,academicStructureKey:"jhs"})));
export const ghanaJhsTemplate:SeedTemplate={
 code:"ghana-jhs-v1",version:1,name:"Ghana Junior High School",
 organizations:[{key:"jhs-department",name:"Junior High Department",type:"department"}],
 academicStructures:[{key:"jhs",name:"Junior High School",level:"junior_high"}],
 academicPeriods:defaultPeriods.map(p=>({...p,academicStructureKey:"jhs"})),classes,subjects,
 curriculums:[{key:"jhs",name:"Ghana JHS Curriculum",code:"GH-JHS",academicStructureKey:"jhs",curriculumVersion:"v1"}],
 curriculumPathways:[{key:"general",name:"General",code:"GEN",curriculumKey:"jhs"}],curriculumSubjects,subjectPrerequisites:[],classSubjects,
 gradingSystems:[{key:"percentage",name:"Percentage Grading",type:"percentage",default:true}],
 gradeRules:percentageGrades.map(g=>({...g,gradingSystemKey:"percentage"})),
 assessmentStructures:[{key:"standard",name:"Standard Assessment",totalScore:100,academicStructureKey:"jhs"}],
 assessmentStructureItems:assessmentItems.map(i=>({...i,assessmentStructureKey:"standard"})),
 assessmentApplicabilities:classSubjects.map(cs=>({key:cs.key,classSubjectKey:cs.key,assessmentStructureKey:"standard",gradingSystemKey:"percentage"}))
};
