// Add these optional fields to setup-related interfaces in db.ts:
export interface SeedTrackingFields {
  setupSource?: "manual" | "seeded" | "imported";
  setupTemplateCode?: string;
  setupTemplateVersion?: number;
  setupSeedKey?: string;
}
// Then extend Organization, AcademicStructure, AcademicPeriod, Class, Subject,
// Curriculum, CurriculumPathway, CurriculumSubject, SubjectPrerequisite,
// ClassSubject, GradingSystem, GradeRule, AssessmentStructure,
// AssessmentStructureItem and AssessmentApplicability with SeedTrackingFields.
// Add setupSeedKey/setupTemplateCode to relevant Dexie indexes when convenient;
// correctness does not depend on indexes, but indexed lookup will be faster.
