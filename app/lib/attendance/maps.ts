import type {
  Attendance,
  AttendanceCaptureEvent,
  AttendanceDevice,
  AttendanceSession,
  Student,
  StudentAttendanceSummary,
  Teacher,
  TeacherAttendance,
} from "../db/db";

import {
  MAP_LAYER_IDS,
  coordinateFrom,
  createMapMarker,
  genericEntityToMarker,
  haversineDistanceMeters,
  sortMarkersByDistance,
  type Coordinate,
  type MapMarker,
  type PrivacyOptions,
} from "../maps";

/**
 * Attendance → Maps bridge.
 *
 * Generic coordinate, distance, viewport, clustering, geofence and marker
 * infrastructure belongs in `lib/maps`. This file only translates attendance
 * records into shared map contracts and derives attendance-specific map layers.
 */

export interface AttendanceMapAdapterOptions {
  title?: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  icon?: string;
  layerId?: string;
  visible?: boolean;
  coordinate?: Coordinate | null;
  metadata?: Record<string, unknown>;
}

export interface AttendancePersonLookup {
  students?: ReadonlyMap<string, Student> | readonly Student[];
  teachers?: ReadonlyMap<string, Teacher> | readonly Teacher[];
}

export interface AttendanceCaptureMarkerContext
  extends AttendanceMapAdapterOptions,
    AttendancePersonLookup {
  device?: AttendanceDevice | null;
}

export interface TeacherAttendanceMarkerContext
  extends AttendanceMapAdapterOptions,
    AttendancePersonLookup {
  coordinate?: Coordinate | null;
  clockEvent?: "clock_in" | "clock_out";
}

export interface AttendanceSessionMarkerContext
  extends AttendanceMapAdapterOptions {
  coordinate?: Coordinate | null;
}

export interface AttendanceHeatPoint {
  id: string;
  coordinate: Coordinate;
  weight: number;
  status?: string;
  sourceIds: string[];
  metadata?: Record<string, unknown>;
}

export interface AttendanceRiskMarkerOptions
  extends AttendanceMapAdapterOptions {
  minimumAttendancePercent?: number;
  privacy?: PrivacyOptions;
}

function text(value: unknown): string | undefined {
  const normalized = String(value ?? "").trim();
  return normalized || undefined;
}

function recordIsActive(value: {
  active?: boolean;
  isDeleted?: boolean;
}): boolean {
  return !value.isDeleted && value.active !== false;
}

function isReadonlyMap<T>(
  source: ReadonlyMap<string, T> | readonly T[],
): source is ReadonlyMap<string, T> {
  return typeof (source as ReadonlyMap<string, T>).get === "function";
}

function lookupById<T extends { id: string }>(
  source: ReadonlyMap<string, T> | readonly T[] | undefined,
  id: string | null | undefined,
): T | undefined {
  if (!source || !id) return undefined;

  if (isReadonlyMap(source)) {
    return source.get(id);
  }

  return source.find((item: T) => item.id === id);
}

function personName(
  person: Student | Teacher | undefined,
  fallback: string,
): string {
  return text(person?.fullName) ?? fallback;
}

function attendanceStatusLabel(status: string | null | undefined): string {
  return String(status ?? "unknown")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function attendanceStatusWeight(status: string | null | undefined): number {
  switch (status) {
    case "absent":
      return 1;
    case "late":
      return 0.75;
    case "medical":
    case "excused":
    case "suspended":
      return 0.55;
    case "remote":
    case "sports":
    case "trip":
      return 0.35;
    case "present":
      return 0.15;
    default:
      return 0.25;
  }
}

function resolveCaptureCoordinate(
  capture: AttendanceCaptureEvent,
  device?: AttendanceDevice | null,
  explicit?: Coordinate | null,
): Coordinate | null {
  return (
    explicit ??
    coordinateFrom(capture) ??
    coordinateFrom(device ?? undefined)
  );
}

export function attendanceCaptureToMapMarker(
  capture: AttendanceCaptureEvent,
  context: AttendanceCaptureMarkerContext = {},
): MapMarker | null {
  if (capture.isDeleted) return null;

  const coordinate = resolveCaptureCoordinate(
    capture,
    context.device,
    context.coordinate,
  );

  if (!coordinate) return null;

  const student =
    capture.personType === "student"
      ? lookupById(context.students, capture.personId)
      : undefined;

  const teacher =
    capture.personType === "teacher" ||
    capture.personType === "staff"
      ? lookupById(context.teachers, capture.personId)
      : undefined;

  const person = student ?? teacher;
  const title =
    context.title ??
    personName(
      person,
      `${attendanceStatusLabel(capture.personType)} attendance`,
    );

  return createMapMarker({
    id: capture.id,
    entityType: "attendance_capture",
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    title,
    subtitle:
      context.subtitle ??
      `${attendanceStatusLabel(capture.attendanceStatus)} · ${attendanceStatusLabel(capture.captureMethod)}`,
    description:
      context.description ??
      text(capture.note) ??
      text(capture.failureCode),
    layerId:
      context.layerId ??
      MAP_LAYER_IDS.ATTENDANCE_CAPTURE,
    status:
      capture.attendanceStatus ??
      capture.verificationStatus,
    schoolId: capture.schoolId,
    branchId: capture.branchId,
    imageUrl:
      context.imageUrl ??
      text(person?.photo),
    icon:
      context.icon ??
      (capture.personType === "student"
        ? "student-attendance"
        : "staff-attendance"),
    accuracyMeters: capture.accuracyMeters,
    occurredAt: capture.capturedAt,
    metadata: {
      personType: capture.personType,
      personId: capture.personId,
      sessionId: capture.sessionId ?? null,
      captureMethod: capture.captureMethod,
      verificationStatus: capture.verificationStatus,
      confidenceScore: capture.confidenceScore ?? null,
      attendanceRecordId: capture.attendanceRecordId ?? null,
      duplicateOfEventId: capture.duplicateOfEventId ?? null,
      attendanceDeviceId: capture.attendanceDeviceId ?? null,
      identityActivityEventId:
        capture.identityActivityEventId ?? null,
      identityCredentialId:
        capture.identityCredentialId ?? null,
      ...context.metadata,
    },
    source: capture,
  });
}

export function studentAttendanceToMapMarker(
  attendance: Attendance,
  student: Student,
  options: AttendanceMapAdapterOptions = {},
): MapMarker | null {
  if (attendance.isDeleted || student.isDeleted) return null;

  const coordinate =
    options.coordinate ??
    coordinateFrom(student);

  if (!coordinate || student.mapVisible === false) return null;

  return createMapMarker({
    id: attendance.id,
    entityType: "attendance_capture",
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    title: options.title ?? student.fullName,
    subtitle:
      options.subtitle ??
      `${attendanceStatusLabel(attendance.status)} · ${attendance.date}`,
    description:
      options.description ??
      text(attendance.note),
    layerId:
      options.layerId ??
      MAP_LAYER_IDS.ATTENDANCE_CAPTURE,
    status: attendance.status,
    schoolId: attendance.schoolId,
    branchId: attendance.branchId,
    imageUrl:
      options.imageUrl ??
      text(student.photo),
    icon:
      options.icon ??
      "student-attendance",
    accuracyMeters: student.accuracyMeters,
    occurredAt:
      attendance.capturedAt ??
      attendance.updatedAt,
    restricted: Boolean(student.locationRestricted),
    metadata: {
      studentId: attendance.studentId,
      classId: attendance.classId,
      academicStructureId: attendance.academicStructureId,
      academicPeriodId: attendance.academicPeriodId,
      sessionId: attendance.sessionId ?? null,
      captureMethod: attendance.captureMethod ?? "manual",
      verificationStatus:
        attendance.verificationStatus ?? null,
      captureEventId: attendance.captureEventId ?? null,
      identityActivityEventId:
        attendance.identityActivityEventId ?? null,
      credentialId: attendance.credentialId ?? null,
      attendanceDeviceId:
        attendance.attendanceDeviceId ?? null,
      ...options.metadata,
    },
    source: attendance,
  });
}

export function teacherAttendanceToMapMarker(
  attendance: TeacherAttendance,
  context: TeacherAttendanceMarkerContext = {},
): MapMarker | null {
  if (attendance.isDeleted) return null;

  const teacher = lookupById(
    context.teachers,
    attendance.teacherId,
  );

  const coordinate =
    context.coordinate ??
    coordinateFrom(teacher ?? undefined);

  if (!coordinate) return null;

  const clockEvent =
    context.clockEvent ??
    (attendance.clockOut ? "clock_out" : "clock_in");

  const occurredAt =
    clockEvent === "clock_out"
      ? attendance.clockOutCaptureEventId
        ? attendance.updatedAt
        : attendance.updatedAt
      : attendance.clockInCaptureEventId
        ? attendance.createdAt
        : attendance.createdAt;

  return createMapMarker({
    id: `${attendance.id}:${clockEvent}`,
    entityType: "attendance_capture",
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    title:
      context.title ??
      personName(teacher, "Teacher attendance"),
    subtitle:
      context.subtitle ??
      `${attendanceStatusLabel(attendance.status)} · ${attendance.date}`,
    description:
      context.description ??
      text(attendance.note),
    layerId:
      context.layerId ??
      MAP_LAYER_IDS.ATTENDANCE_CAPTURE,
    status:
      attendance.status ??
      attendance.verificationStatus ??
      "present",
    schoolId: attendance.schoolId,
    branchId: attendance.branchId,
    imageUrl:
      context.imageUrl ??
      text(teacher?.photo),
    icon:
      context.icon ??
      (clockEvent === "clock_out"
        ? "teacher-clock-out"
        : "teacher-clock-in"),
    occurredAt,
    metadata: {
      teacherId: attendance.teacherId,
      date: attendance.date,
      clockEvent,
      clockIn: attendance.clockIn ?? null,
      clockOut: attendance.clockOut ?? null,
      clockInMethod: attendance.clockInMethod ?? null,
      clockOutMethod: attendance.clockOutMethod ?? null,
      verificationStatus:
        attendance.verificationStatus ?? null,
      sessionId: attendance.sessionId ?? null,
      attendanceDeviceId:
        attendance.attendanceDeviceId ?? null,
      lateMinutes: attendance.lateMinutes ?? 0,
      earlyDepartureMinutes:
        attendance.earlyDepartureMinutes ?? 0,
      workingMinutes: attendance.workingMinutes ?? 0,
      overtimeMinutes: attendance.overtimeMinutes ?? 0,
      ...context.metadata,
    },
    source: attendance,
  });
}

export function attendanceDeviceToMapMarker(
  device: AttendanceDevice,
  options: AttendanceMapAdapterOptions = {},
): MapMarker | null {
  if (!recordIsActive(device)) return null;

  return genericEntityToMarker(
    {
      ...device,
      formattedAddress: device.locationLabel,
      mapVisible: true,
    },
    {
      entityType: "attendance_device",
      layerId:
        options.layerId ??
        MAP_LAYER_IDS.DEVICES,
      icon:
        options.icon ??
        "attendance-device",
      subtitle:
        options.subtitle ??
        text(device.locationLabel) ??
        text(device.deviceType),
      imageUrl: options.imageUrl,
    },
  );
}

export function attendanceSessionToMapMarker(
  session: AttendanceSession,
  context: AttendanceSessionMarkerContext = {},
): MapMarker | null {
  if (!recordIsActive(session)) return null;

  const coordinate =
    context.coordinate ??
    coordinateFrom(
      session as AttendanceSession & {
        latitude?: number | null;
        longitude?: number | null;
      },
    );

  if (!coordinate) return null;

  return createMapMarker({
    id: session.id,
    entityType: "attendance_session",
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    title:
      context.title ??
      text(session.name) ??
      `${attendanceStatusLabel(session.scopeType)} attendance`,
    subtitle:
      context.subtitle ??
      `${attendanceStatusLabel(session.status)} · ${session.date}`,
    description: context.description,
    layerId:
      context.layerId ??
      MAP_LAYER_IDS.ATTENDANCE_CAPTURE,
    status: session.status,
    schoolId: session.schoolId,
    branchId: session.branchId,
    icon:
      context.icon ??
      "attendance-session",
    occurredAt: session.openedAt,
    metadata: {
      scopeType: session.scopeType,
      scopeId: session.scopeId ?? null,
      classId: session.classId ?? null,
      teacherId: session.teacherId ?? null,
      academicStructureId:
        session.academicStructureId ?? null,
      academicPeriodId:
        session.academicPeriodId ?? null,
      openedAt: session.openedAt,
      closedAt: session.closedAt ?? null,
      defaultStatus: session.defaultStatus ?? null,
      lateAfterMinute: session.lateAfterMinute ?? null,
      absentAfterMinute: session.absentAfterMinute ?? null,
      ...context.metadata,
    },
    source: session,
  });
}

export function attendanceCapturesToMapMarkers(
  captures: readonly AttendanceCaptureEvent[],
  context: AttendanceCaptureMarkerContext = {},
): MapMarker[] {
  return captures
    .map((capture) =>
      attendanceCaptureToMapMarker(capture, context),
    )
    .filter((marker): marker is MapMarker => Boolean(marker));
}

export function studentAttendancesToMapMarkers(
  attendances: readonly Attendance[],
  students: ReadonlyMap<string, Student> | readonly Student[],
  options: AttendanceMapAdapterOptions = {},
): MapMarker[] {
  return attendances
    .map((attendance) => {
      const student = lookupById(
        students,
        attendance.studentId,
      );

      return student
        ? studentAttendanceToMapMarker(
            attendance,
            student,
            options,
          )
        : null;
    })
    .filter((marker): marker is MapMarker => Boolean(marker));
}

export function teacherAttendancesToMapMarkers(
  attendances: readonly TeacherAttendance[],
  context: TeacherAttendanceMarkerContext = {},
): MapMarker[] {
  return attendances
    .map((attendance) =>
      teacherAttendanceToMapMarker(attendance, context),
    )
    .filter((marker): marker is MapMarker => Boolean(marker));
}

export function attendanceCaptureHeatmap(
  captures: readonly AttendanceCaptureEvent[],
): AttendanceHeatPoint[] {
  const groups = new Map<
    string,
    {
      coordinate: Coordinate;
      weight: number;
      sourceIds: string[];
      statuses: string[];
    }
  >();

  for (const capture of captures) {
    if (capture.isDeleted) continue;

    const coordinate = coordinateFrom(capture);
    if (!coordinate) continue;

    const latitudeKey = coordinate.latitude.toFixed(4);
    const longitudeKey = coordinate.longitude.toFixed(4);
    const key = `${latitudeKey}:${longitudeKey}`;

    const existing = groups.get(key) ?? {
      coordinate,
      weight: 0,
      sourceIds: [],
      statuses: [],
    };

    existing.weight += attendanceStatusWeight(
      capture.attendanceStatus,
    );
    existing.sourceIds.push(capture.id);
    existing.statuses.push(
      capture.attendanceStatus ?? "unknown",
    );

    groups.set(key, existing);
  }

  return [...groups.entries()].map(([id, group]) => ({
    id: `attendance-heat:${id}`,
    coordinate: group.coordinate,
    weight: group.weight,
    sourceIds: group.sourceIds,
    status: mostFrequent(group.statuses),
    metadata: {
      eventCount: group.sourceIds.length,
      statuses: group.statuses,
    },
  }));
}

export function attendanceSummaryRiskMarkers(
  summaries: readonly StudentAttendanceSummary[],
  students: ReadonlyMap<string, Student> | readonly Student[],
  options: AttendanceRiskMarkerOptions = {},
): MapMarker[] {
  const minimumAttendancePercent =
    options.minimumAttendancePercent ?? 75;

  const markers: MapMarker[] = [];

  for (const summary of summaries) {
    if (
      summary.isDeleted ||
      summary.attendancePercent >= minimumAttendancePercent
    ) {
      continue;
    }

    const student = lookupById(
      students,
      summary.studentId,
    );

    if (
      !student ||
      student.isDeleted ||
      student.mapVisible === false
    ) {
      continue;
    }

    if (
      options.privacy?.requireConsent !== false &&
      student.locationConsentGiven !== true
    ) {
      continue;
    }

    if (
      student.locationRestricted &&
      !options.privacy?.allowRestricted
    ) {
      continue;
    }

    const coordinate = coordinateFrom(student);
    if (!coordinate) continue;

    const status =
      summary.attendancePercent < 50
        ? "critical"
        : summary.attendancePercent < 65
          ? "high_risk"
          : "at_risk";

    markers.push(
      createMapMarker({
        id: `attendance-risk:${summary.id}`,
        entityType: "attendance_risk",
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        title: student.fullName,
        subtitle:
          options.subtitle ??
          `${summary.attendancePercent.toFixed(1)}% attendance`,
        description: options.description,
        layerId:
          options.layerId ??
          MAP_LAYER_IDS.ATTENDANCE_CAPTURE,
        status,
        schoolId: summary.schoolId,
        branchId: summary.branchId,
        imageUrl:
          options.imageUrl ??
          text(student.photo),
        icon:
          options.icon ??
          "attendance-risk",
        accuracyMeters: student.accuracyMeters,
        restricted: Boolean(student.locationRestricted),
        metadata: {
          studentId: summary.studentId,
          classId: summary.classId,
          academicStructureId:
            summary.academicStructureId,
          academicPeriodId:
            summary.academicPeriodId,
          daysPresent: summary.daysPresent,
          daysAbsent: summary.daysAbsent,
          daysOpened: summary.daysOpened,
          timesLate: summary.timesLate ?? 0,
          attendancePercent:
            summary.attendancePercent,
          threshold:
            minimumAttendancePercent,
          ...options.metadata,
        },
        source: summary,
      }),
    );
  }

  return markers;
}

export function nearestAttendanceCapture(
  current: Coordinate,
  captures: readonly AttendanceCaptureEvent[],
): {
  capture: AttendanceCaptureEvent;
  distanceMeters: number;
} | null {
  const markers = captures
    .map((capture) =>
      attendanceCaptureToMapMarker(capture),
    )
    .filter((marker): marker is MapMarker => Boolean(marker));

  const nearest = sortMarkersByDistance(markers, current)[0];
  if (!nearest) return null;

  const capture = captures.find(
    (item) => item.id === nearest.id,
  );

  return capture
    ? {
        capture,
        distanceMeters: nearest.distanceMeters,
      }
    : null;
}

export function capturesWithinRadius(
  center: Coordinate,
  captures: readonly AttendanceCaptureEvent[],
  radiusMeters: number,
): AttendanceCaptureEvent[] {
  return captures.filter((capture) => {
    const coordinate = coordinateFrom(capture);
    return (
      coordinate != null &&
      haversineDistanceMeters(center, coordinate) <=
        radiusMeters
    );
  });
}

export function attendanceMapMarkers(input: {
  captures?: readonly AttendanceCaptureEvent[];
  studentAttendances?: readonly Attendance[];
  teacherAttendances?: readonly TeacherAttendance[];
  devices?: readonly AttendanceDevice[];
  sessions?: readonly AttendanceSession[];
  students?: ReadonlyMap<string, Student> | readonly Student[];
  teachers?: ReadonlyMap<string, Teacher> | readonly Teacher[];
}): MapMarker[] {
  const students = input.students;
  const teachers = input.teachers;

  return [
    ...attendanceCapturesToMapMarkers(
      input.captures ?? [],
      {
        students,
        teachers,
      },
    ),
    ...(students
      ? studentAttendancesToMapMarkers(
          input.studentAttendances ?? [],
          students,
        )
      : []),
    ...teacherAttendancesToMapMarkers(
      input.teacherAttendances ?? [],
      {
        teachers,
      },
    ),
    ...(input.devices ?? [])
      .map((device) =>
        attendanceDeviceToMapMarker(device),
      )
      .filter(
        (marker): marker is MapMarker =>
          Boolean(marker),
      ),
    ...(input.sessions ?? [])
      .map((session) =>
        attendanceSessionToMapMarker(session),
      )
      .filter(
        (marker): marker is MapMarker =>
          Boolean(marker),
      ),
  ];
}

function mostFrequent(values: readonly string[]): string | undefined {
  if (!values.length) return undefined;

  const counts = new Map<string, number>();
  let selected = values[0];
  let selectedCount = 0;

  for (const value of values) {
    const count = (counts.get(value) ?? 0) + 1;
    counts.set(value, count);

    if (count > selectedCount) {
      selected = value;
      selectedCount = count;
    }
  }

  return selected;
}    