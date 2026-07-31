import type { SeedDefinition } from "../types";

export const defaultPeriods: SeedDefinition[] = [
  { key: "term-1", name: "Term 1", type: "Term 1", order: 1 },
  { key: "term-2", name: "Term 2", type: "Term 2", order: 2 },
  { key: "term-3", name: "Term 3", type: "Term 3", order: 3 },
];

export const percentageGrades: SeedDefinition[] = [
  { key: "a", minScore: 80, maxScore: 100, grade: "A", remark: "Excellent", order: 1 },
  { key: "b", minScore: 70, maxScore: 79.99, grade: "B", remark: "Very Good", order: 2 },
  { key: "c", minScore: 60, maxScore: 69.99, grade: "C", remark: "Good", order: 3 },
  { key: "d", minScore: 50, maxScore: 59.99, grade: "D", remark: "Credit", order: 4 },
  { key: "e", minScore: 40, maxScore: 49.99, grade: "E", remark: "Pass", order: 5 },
  { key: "f", minScore: 0, maxScore: 39.99, grade: "F", remark: "Fail", order: 6 },
];

export const assessmentItems: SeedDefinition[] = [
  { key: "continuous-assessment", name: "Continuous Assessment", weight: 30, maxScore: 30, order: 1, compulsory: true },
  { key: "examination", name: "Examination", weight: 70, maxScore: 70, order: 2, compulsory: true },
];
