import type {
  EleeveonIconName,
  IconPathDefinition,
} from "./icon-types";

export const ICON_PATHS:
  Record<
    EleeveonIconName,
    IconPathDefinition
  > = {
  dashboard: {
    rects: [
      { x: 3, y: 3, width: 7, height: 7, rx: 1.5 },
      { x: 14, y: 3, width: 7, height: 4, rx: 1.5 },
      { x: 14, y: 11, width: 7, height: 10, rx: 1.5 },
      { x: 3, y: 14, width: 7, height: 7, rx: 1.5 },
    ],
  },

  student: {
    circles: [
      { cx: 12, cy: 8, r: 3 },
    ],
    paths: [
      "M5.5 20c.5-4 2.8-6 6.5-6s6 2 6.5 6",
      "M3 6l9-4 9 4-9 4-9-4Z",
      "M19 7v5",
    ],
  },

  teacher: {
    circles: [
      { cx: 9, cy: 8, r: 3 },
    ],
    paths: [
      "M3.5 20c.4-4 2.4-6 5.5-6 1.8 0 3.2.7 4.2 2",
      "M15 5h6v10h-6",
      "M15 9h6",
      "M13 14l3 3",
    ],
  },

  parent: {
    circles: [
      { cx: 8, cy: 8, r: 2.5 },
      { cx: 16, cy: 9, r: 2.5 },
    ],
    paths: [
      "M2.5 20c.4-3.6 2.2-5.5 5.5-5.5S13.1 16.4 13.5 20",
      "M11 20c.3-2.9 1.9-4.5 5-4.5 3 0 4.8 1.6 5.2 4.5",
    ],
  },

  attendance: {
    rects: [
      { x: 3, y: 4, width: 18, height: 17, rx: 2 },
    ],
    lines: [
      { x1: 7, y1: 2, x2: 7, y2: 6 },
      { x1: 17, y1: 2, x2: 17, y2: 6 },
      { x1: 3, y1: 9, x2: 21, y2: 9 },
    ],
    paths: [
      "m8 15 2.2 2.2L16 12",
    ],
  },

  assessment: {
    rects: [
      { x: 4, y: 3, width: 16, height: 18, rx: 2 },
    ],
    lines: [
      { x1: 8, y1: 8, x2: 16, y2: 8 },
      { x1: 8, y1: 12, x2: 13, y2: 12 },
      { x1: 8, y1: 16, x2: 11, y2: 16 },
    ],
    paths: [
      "m14 16 1.5 1.5L19 14",
    ],
  },

  reports: {
    paths: [
      "M4 20V10",
      "M10 20V4",
      "M16 20v-7",
      "M22 20V7",
      "M2 20h22",
    ],
  },

  calendar: {
    rects: [
      { x: 3, y: 4, width: 18, height: 17, rx: 2 },
    ],
    lines: [
      { x1: 7, y1: 2, x2: 7, y2: 6 },
      { x1: 17, y1: 2, x2: 17, y2: 6 },
      { x1: 3, y1: 9, x2: 21, y2: 9 },
    ],
    circles: [
      { cx: 8, cy: 13, r: 0.5 },
      { cx: 12, cy: 13, r: 0.5 },
      { cx: 16, cy: 13, r: 0.5 },
      { cx: 8, cy: 17, r: 0.5 },
      { cx: 12, cy: 17, r: 0.5 },
    ],
  },

  timetable: {
    circles: [
      { cx: 12, cy: 12, r: 9 },
    ],
    paths: [
      "M12 7v5l3 2",
      "M7 3.5 5 2",
      "M17 3.5 19 2",
    ],
  },

  finance: {
    circles: [
      { cx: 12, cy: 12, r: 9 },
    ],
    paths: [
      "M15.5 8.5c-.7-1-1.8-1.5-3.5-1.5-2 0-3.5 1-3.5 2.5S10 12 12 12s3.5 1 3.5 2.5S14 17 12 17c-1.7 0-2.9-.5-3.7-1.6",
      "M12 5v14",
    ],
  },

  communication: {
    paths: [
      "M4 4h16v12H8l-4 4V4Z",
      "M8 8h8",
      "M8 12h5",
    ],
  },

  workspace: {
    rects: [
      { x: 3, y: 3, width: 18, height: 18, rx: 2 },
    ],
    lines: [
      { x1: 8, y1: 3, x2: 8, y2: 21 },
      { x1: 8, y1: 9, x2: 21, y2: 9 },
    ],
  },

  notification: {
    paths: [
      "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9",
      "M10 21h4",
    ],
  },

  settings: {
    circles: [
      { cx: 12, cy: 12, r: 3 },
    ],
    paths: [
      "M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9A1.7 1.7 0 0 0 21 10h.1v4H21a1.7 1.7 0 0 0-1.6 1Z",
    ],
  },

  sync: {
    paths: [
      "M20 7h-5V2",
      "M4 17h5v5",
      "M18.4 9A7 7 0 0 0 6.2 5.8L4 8",
      "M5.6 15A7 7 0 0 0 17.8 18.2L20 16",
    ],
  },

  offline: {
    paths: [
      "M2 2l20 20",
      "M8.5 8.5A6 6 0 0 1 18 13",
      "M5 13a4 4 0 0 0 4 4h8",
      "M3.5 8.5A8 8 0 0 1 7 5.5",
    ],
  },

  device: {
    rects: [
      { x: 5, y: 2, width: 14, height: 20, rx: 2 },
    ],
    lines: [
      { x1: 10, y1: 18, x2: 14, y2: 18 },
    ],
  },

  school: {
    paths: [
      "M3 10 12 4l9 6",
      "M5 9v10h14V9",
      "M9 19v-5h6v5",
      "M8 9h8",
    ],
  },

  branch: {
    circles: [
      { cx: 6, cy: 5, r: 2 },
      { cx: 18, cy: 5, r: 2 },
      { cx: 12, cy: 19, r: 2 },
    ],
    paths: [
      "M6 7v3c0 2 1 3 3 3h3",
      "M18 7v3c0 2-1 3-3 3h-3",
      "M12 13v4",
    ],
  },
};
