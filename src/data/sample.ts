/* Sample data only. It shows the shape and format of real data; the API replaces all of it.
   Keep every screen reading from here (or from props) so the swap to real data is one place. */

export const student = {
  firstName: 'Joshua',
  displayName: 'Joshua',
  department: 'Electrical & Computer Eng.',
  departmentFull: 'Electronic and Computer Engineering',
  faculty: 'Engineering',
  school: 'Lagos State University (LASU)',
  level: '300L',
  persona: 'go-getter' as const,
  streak: 5,
  semesterWeek: 2,
  target: 4.0,
  cgpa: 4.0,
  unitsDone: 96,
  unitsLeft: 144,
};

export type Course = { code: string; title: string; lecturer: string; units: number; progress: number; week: number; priority?: boolean };
export const courses: Course[] = [
  { code: 'MEE 352', title: 'Energy Conservation', lecturer: 'Dr. O. Adeyemi', units: 3, progress: 0.25, week: 2 },
  { code: 'ECE 305', title: 'Semiconductor Devices', lecturer: 'Engr. T. Balogun', units: 2, progress: 0.18, week: 2 },
  { code: 'ECE 303', title: 'Electrical Circuit Theory', lecturer: 'Engr. T. Balogun', units: 3, progress: 0.16, week: 2 },
  { code: 'ECE 307', title: 'Digital Electronics I', lecturer: 'Dr. A. Bakare', units: 2, progress: 0.1, week: 1 },
  { code: 'ECE 311', title: 'Measurement and Instrumentation', lecturer: 'Engr. K. Musa', units: 3, progress: 0.08, week: 1 },
  { code: 'MEE 203', title: 'Engineering Drawing II', lecturer: 'Engr. F. Lawal', units: 2, progress: 0.05, week: 1, priority: true },
];

/** Week view timetable, Mon–Fri. Times are 24h decimals. Status drives the styling (never per-course colours). */
export type Slot = { code: string; room: string; day: 0 | 1 | 2 | 3 | 4; start: number; end: number; status?: 'cancelled' | 'moved' | 'unconfirmed' | 'online'; note?: string; level?: string };
export const week = {
  label: 'Week 3 · 20 to 24 Oct',
  days: [
    { short: 'Mon', date: 20 },
    { short: 'Tue', date: 21 },
    { short: 'Wed', date: 22, today: true },
    { short: 'Thu', date: 23 },
    { short: 'Fri', date: 24 },
  ],
  now: 9.75, // Wed 9:45 AM
  slots: [
    { code: 'ECE 305', room: 'LT 1', day: 0, start: 8, end: 10 },
    { code: 'MEE 352', room: 'ETF Hall', day: 0, start: 12, end: 14 },
    { code: 'ECE 311', room: 'LT 3', day: 0, start: 15, end: 17 },
    { code: 'ECE 303', room: 'LT 2', day: 1, start: 8, end: 10 },
    { code: 'ECE 307', room: 'Lab 2', day: 1, start: 10, end: 12 },
    { code: 'MEE 203', room: 'Studio', day: 1, start: 14, end: 16, level: '200L' },
    { code: 'ECE 305', room: 'LT 1', day: 2, start: 8, end: 10 },
    { code: 'ECE 303', room: 'LT 2', day: 2, start: 10, end: 12, status: 'cancelled', note: 'Cancelled' },
    { code: 'MEE 352', room: 'ETF Hall', day: 2, start: 12, end: 14, status: 'unconfirmed', note: 'Not confirmed' },
    { code: 'MEE 203', room: 'Studio', day: 2, start: 15, end: 17, level: '200L' },
    { code: 'ECE 311', room: 'LT 3', day: 3, start: 8, end: 10 },
    { code: 'ECE 305', room: 'Test · moved', day: 3, start: 10, end: 11, status: 'moved', note: 'Test · moved' },
    { code: 'ECE 307', room: 'Lab 2', day: 3, start: 13, end: 15 },
    { code: 'MEE 352', room: 'ETF Hall', day: 4, start: 9, end: 11 },
    { code: 'ECE 303', room: 'LT 2', day: 4, start: 11, end: 13 },
  ] as Slot[],
  changes: [
    { day: 'Wed', text: 'ECE 303 cancelled by Engr. Balogun', tone: 'bad' as const },
    { day: 'Wed', text: 'MEE 352 not confirmed yet', tone: 'muted' as const },
    { day: 'Thu', text: 'ECE 305 test moved to 10 AM, LT 1', tone: 'normal' as const },
  ],
  setBy: 'Tolu A., HOC',
};

export const classmates = [
  { name: 'Tolu Adebayo', persona: 'comeback' as const, dept: '300L MEE' },
  { name: 'Ada Okafor', persona: 'team-player' as const, dept: '300L ECE' },
  { name: 'Kunle Bello', persona: 'go-getter' as const, dept: '300L MEE' },
  { name: 'Zainab Musa', persona: 'curious' as const, dept: '300L CHE' },
];

export const lecturer = {
  name: 'Dr. O. Adeyemi',
  nameCaps: 'DR. O.\nADEYEMI',
  department: 'Mechanical Engineering',
  school: 'LASU',
};
