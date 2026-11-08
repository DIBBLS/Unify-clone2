/* Streak: consecutive weekdays with a finished class or the day's revision.
   Saturdays and Sundays never break it (they count if you study, and are skipped if you don't).
   Today not done yet doesn't break it either: the streak runs up to yesterday until today is done. */
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function streakLength(days: Iterable<string>, today = new Date()): number {
  const set = new Set(days);
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!set.has(iso(d))) d.setDate(d.getDate() - 1); // today still open
  let n = 0;
  for (let guard = 0; guard < 400; guard++) {
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    if (set.has(iso(d))) n++;
    else if (!weekend) break;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export const todayIso = () => iso(new Date());

/** Which week of the semester today is, from the date the admin set. null until set or before it starts. */
export function semesterWeek(startsOn: string | null, weeks: number, today = new Date()): number | null {
  if (!startsOn) return null;
  const start = new Date(`${startsOn}T00:00:00`);
  const days = Math.floor((today.getTime() - start.getTime()) / 86400000);
  if (days < 0) return null;
  return Math.min(weeks, Math.floor(days / 7) + 1);
}
