import type { Attendance, StudentAttendanceSummary } from "../../../lib/attendance";
export interface AttendanceStudentHistoryPerson{id:string;name:string;reference?:string|null;imageUrl?:string|null;className?:string|null}
export interface StudentAttendanceHistoryRow{record:Attendance;label?:string|null}
export interface StudentAttendanceBundle{student:AttendanceStudentHistoryPerson;records:readonly Attendance[];summary?:StudentAttendanceSummary|null}
