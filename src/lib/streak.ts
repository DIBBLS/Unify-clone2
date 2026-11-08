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
