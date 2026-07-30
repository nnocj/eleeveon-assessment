import type { AttendanceCaptureMethod, AttendanceStatus, AttendanceVerificationStatus, TeacherAttendance } from "../../../lib/attendance";
export type TeacherAttendanceStatus = NonNullable<TeacherAttendance["status"]>;
export interface AttendanceTeacher { id:string; name:string; reference?:string|null; imageUrl?:string|null; role?:string|null; }
export interface TeacherClockAction { teacherId:string; action:"clock_in"|"clock_out"; time:string; date:string; method:AttendanceCaptureMethod; verificationStatus:AttendanceVerificationStatus; status?:TeacherAttendanceStatus; note?:string|null; }
export interface TeacherAttendanceRow { teacher:AttendanceTeacher; attendance?:TeacherAttendance|null; }
