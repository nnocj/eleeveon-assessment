"use client";

/**
 * app/teacher/page.tsx
 * ---------------------------------------------------------
 * TEACHER PORTAL
 * ---------------------------------------------------------
 * Separate teacher workspace.
 *
 * Workspace-session aligned:
 * - RolePortalShell opens this portal from the selected workspace session
 *   written by /select-role.
 * - Teacher pages are scoped by selected teacherLocalId, schoolId and branchId.
 * - Teacherdashboard receives NAV_SECTIONS from this page.
 * - Adding/removing/reordering nav items here automatically updates dashboard
 *   cards while preserving RolePortalShell routing.
 */

import React from "react";

import RolePortalShell, {
  type RoleNavSection,
} from "../components/role-portals/RolePortalShell";
import { TEACHER_ROLES } from "../lib/auth/roleRedirect";

import Teacherdashboard from "./modules/Teacherdashboard";
import StudentAssessmentEntry from "./modules/StudentAssessmentEntry";
import StudentAttendance from "./modules/StudentAttendance";
import CourseOutline from "./modules/TeacherCourseOutline";

import Studentprogress from "./modules/Studentprogress";

import TeacherReportRemarks from "./modules/ReportRemarks";
import Broadsheets from "./modules/Broadsheets";

import Announcements from "./modules/Announcements";
import Messages from "./modules/Messages";

/*import Calendar from "./modules/Calendar";
import ClassTimetable from "./modules/ClassTimetable";
import MyTimetable from "./modules/MyTimetable";*/

import Teachersalary from "./modules/Teachersalary";
import Teacherpaymenthistory from "./modules/Teacherpaymenthistory";

import Teacherprofile from "./modules/Teacherprofile";
import Teachersettings from "./modules/Teachersettings";

type RouteProps = {
  navigate: (key: string) => void;
};

// ======================================================
// NAVIGATION
// ======================================================

export const NAV_SECTIONS: RoleNavSection[] = [
  {
    title: "Teaching",
    defaultOpen: true,
    items: [
      { key: "teacherDashboard", label: "Dashboard", icon: "🏠" },
     
      { key: "courseOutline", label: "My Subjects", icon: "📖" },
    ],
  },
  {
    title: "Learners",
    defaultOpen: true,
    items: [
      { key: "studentAttendance", label: "Student Attendance", icon: "📅" },
      //{ key: "studentProgress", label: "Student Progress", icon: "📈" },
    ],
  },
  {
    title: "Records",
    defaultOpen: false,
    items: [
      { key: "studentAssessmentEntry", label: "Assessment Entry", icon: "📝" },
      { key: "teacherReportRemarks", label: "Report Remarks", icon: "📄" },
      { key: "broadsheets", label: "Broadsheets", icon: "📊" },
    ],
  },
  {
    title: "Communication",
    defaultOpen: false,
    items: [
      { key: "announcements", label: "Announcements", icon: "📢" },
      { key: "messages", label: "Messages", icon: "✉️" },
    ],
  },
  {
    title: "Timetable",
    defaultOpen: false,
    items: [
      { key: "calendar", label: "Calendar", icon: "📆" },
      { key: "classTimetable", label: "Class Timetable", icon: "🏫" },
      { key: "teacherTimetable", label: "My Timetable", icon: "🗓️" },
    ],
  },
  {
    title: "Finance",
    defaultOpen: false,
    items: [
      { key: "teacherSalary", label: "My Salary", icon: "💵" },
      { key: "teacherPaymentHistory", label: "Payment History", icon: "🧾" },
    ],
  },
  {
    title: "Account",
    defaultOpen: false,
    items: [
      { key: "teacherProfile", label: "Profile", icon: "👤" },
      { key: "teacherSettings", label: "Settings", icon: "⚙️" },
    ],
  },
];

// ======================================================
// DASHBOARD WRAPPER
// ======================================================

function TeacherDashboardRoute(props: RouteProps) {
  return <Teacherdashboard {...props} navSections={NAV_SECTIONS} />;
}

// ======================================================
// ROUTES
// ======================================================

const ROUTES: Record<string, React.ComponentType<RouteProps>> = {
  teacherDashboard: TeacherDashboardRoute,
  studentAssessmentEntry: StudentAssessmentEntry,
  studentAttendance: StudentAttendance,
  courseOutline: CourseOutline,

  studentProgress: Studentprogress,

  teacherReportRemarks: TeacherReportRemarks,
  broadsheets: Broadsheets,

  announcements: Announcements,
  messages: Messages,

  /*calendar: Calendar,
  classTimetable: ClassTimetable,
  teacherTimetable: MyTimetable,*/

  teacherSalary: Teachersalary,
  teacherPaymentHistory: Teacherpaymenthistory,

  teacherProfile: Teacherprofile,
  teacherSettings: Teachersettings,
};

export default function TeacherPage() {
  return (
    <RolePortalShell
      portalTitle="Teacher Portal"
      portalSubtitle="Teaching, learners, communication and salary workspace"
      homeKey="teacherDashboard"
      allowedRoles={TEACHER_ROLES}
      navSections={NAV_SECTIONS}
      routes={ROUTES}
      lockedContext={true}
      requireSchool={true}
      requireBranch={true}
    />
  );
}
