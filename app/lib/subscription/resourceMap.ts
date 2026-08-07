export const FEATURE_LABELS: Record<string, string> = {
  offlineSync: "Offline-first access",
  cloudBackup: "Protected cloud backup",
  reports: "Assessments and reports",
  finance: "Finance",
  attendance: "Attendance",
  identityCards: "Identity cards",
  identitySafety: "Identity and safety",
  transport: "School transport",
  communications: "Communication",
  calendarScheduling: "Calendar and scheduling",
  schoolWebsites: "School websites",
  parentPortal: "Parent portal",
  studentPortal: "Student portal",
  teacherPortal: "Teacher portal",
  advancedAnalytics: "Advanced analytics",
  advancedScheduling: "Advanced scheduling",
  apiAccess: "API access",
  webhooks: "Webhooks",
  prioritySupport: "Priority support",
};

export const RESOURCE_LABELS: Record<string, string> = {
  schools: "schools",
  branches: "branches",
  users: "users",
  students: "students",
  teachers: "teachers",
  storageMb: "storage",
  apiCallsPerMonth: "monthly API calls",
  devices: "licensed devices",
  activations: "licence activations",
};

const humanize = (value: string) =>
  value.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());

export const featureLabel = (key: string) =>
  FEATURE_LABELS[key] ?? humanize(key);

export const resourceLabel = (key: string) =>
  RESOURCE_LABELS[key] ?? humanize(key);
