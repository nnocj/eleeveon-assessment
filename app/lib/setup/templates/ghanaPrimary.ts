import type { SeedTemplate } from "../types";
import { assessmentItems, defaultPeriods, percentageGrades } from "./common";

const classes = Array.from({ length: 6 }, (_, i) => ({ key: `basic-${i+1}`, name: `Basic ${i+1}`, code: `B${i+1}`, level: "primary" }));
const subjects = [
  ["english", "English Language", "ENG"], ["mathematics", "Mathematics", "MATH"],
  ["science", "Science", "SCI"], ["computing", "Computing", "COMP"],
  ["creative-arts", "Creative Arts and Design", "CAD"], ["religious-moral", "Religious and Moral Education", "RME"],
  ["social-studies", "Social Studies", "SOC"], ["ghanaian-language", "Ghanaian Language", "GHL"],
  ["physical-education", "Physical Education", "PE"],
].map(([key,name,code]) => ({ key,name,code,category:"core" }));
const curriculumSubjects = subjects.map((s, i) => ({ key: s.key, subjectKey: s.key, curriculumKey: "primary", type: "core", orderIndex: i+1 }));
const classSubjects = classes.flatMap(c => curriculumSubjects.map(cs => ({ key: `${c.key}:${cs.key}`, classKey:c.key, subjectKey:cs.subjectKey, curriculumSubjectKey:cs.key, academicStructureKey:"primary" })));

export const ghanaPrimaryTemplate: SeedTemplate = {
  code:"ghana-primary-v1", version:1, name:"Ghana Primary",
  organizations:[{ key:"primary-department", name:"Primary Department", type:"department" }],
  academicStructures:[{ key:"primary", name:"Primary", level:"primary" }],
  academicPeriods:defaultPeriods.map(p=>({...p, academicStructureKey:"primary"})), classes, subjects,
  curriculums:[{ key:"primary", name:"Ghana Primary Curriculum", code:"GH-PRI", academicStructureKey:"primary", curriculumVersion:"v1" }],
  curriculumPathways:[{ key:"general", name:"General", code:"GEN", curriculumKey:"primary" }],
  curriculumSubjects, subjectPrerequisites:[], classSubjects,
  gradingSystems:[{ key:"percentage", name:"Percentage Grading", type:"percentage", default:true }],
  gradeRules:percentageGrades.map(g=>({...g, gradingSystemKey:"percentage"})),
  assessmentStructures:[{ key:"standard", name:"Standard Assessment", totalScore:100, academicStructureKey:"primary" }],
  assessmentStructureItems:assessmentItems.map(i=>({...i, assessmentStructureKey:"standard"})),
  assessmentApplicabilities:classSubjects.map(cs=>({ key:cs.key, classSubjectKey:cs.key, assessmentStructureKey:"standard", gradingSystemKey:"percentage" })),
};
