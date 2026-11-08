/* Reading a class list from whatever the HOC has: a spreadsheet, a Word table, a PDF, or pasted text.
   Pure functions only (no DOM, no network), so every rule here is unit-tested. */

export type Student = { surname: string; first_name: string; middle_name: string; matric: string };
export type Target = 'surname' | 'first_name' | 'middle_name' | 'matric' | 'full_name' | 'ignore';
export const TARGET_LABEL: Record<Target, string> = {
  surname: 'Surname', first_name: 'First name', middle_name: 'Middle name', matric: 'Matric number', full_name: 'Full name', ignore: 'Ignore',
};

const MATRIC_RE = /^\d{6,12}$/;
const clean = (v: unknown) => String(v ?? '').replace(/\s+/g, ' ').trim();
const digits = (v: string) => v.replace(/[\s/.-]/g, '');

/** Does this cell look like a matric number? */
export const looksLikeMatric = (v: unknown) => MATRIC_RE.test(digits(clean(v)));

/** Guess what a column holds from its heading (if any) and its values. */
export function guessTarget(heading: string, values: unknown[]): Target {
  const h = heading.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
  if (/\b(matric|reg(istration)?|mat no|student id|id no)\b/.test(h)) return 'matric';
  if (/\b(surname|last name|family name)\b/.test(h)) return 'surname';
  if (/\b(first name|firstname|given name|forename)\b/.test(h)) return 'first_name';
  if (/\b(middle name|other name|other names|middle)\b/.test(h)) return 'middle_name';
  if (/^(s ?n|no|sn|serial|s no|phone|gsm|email|e mail|sex|gender|dept|department|level|signature|remark|remarks)$/.test(h) || /\b(phone|email|signature|gender)\b/.test(h)) return 'ignore';
  if (/\b(name|names|full name|student name|student)\b/.test(h)) return 'full_name';
  // No useful heading: look at the values.
  const sample = values.map(clean).filter(Boolean).slice(0, 30);
  if (sample.length === 0) return 'ignore';
  if (sample.filter(looksLikeMatric).length / sample.length > 0.7) return 'matric';
  if (sample.every((v) => /^\d{1,4}\.?$/.test(v))) return 'ignore'; // serial numbers
  const words = sample.reduce((n, v) => n + v.split(' ').length, 0) / sample.length;
  if (words >= 2) return 'full_name';
  return 'ignore';
}

/** Is the first row of a table a heading row? True when it has no matric-like cell and has letters. */
export function hasHeaderRow(matrix: unknown[][]): boolean {
  const first = matrix[0] ?? [];
  return !first.some(looksLikeMatric) && first.some((c) => /[a-z]/i.test(clean(c)));
}

/** Guess a target for every column. If two columns both look like full names, only the first is used. */
export function guessMapping(matrix: unknown[][]): { header: boolean; mapping: Target[]; headings: string[] } {
  const header = hasHeaderRow(matrix);
  const width = Math.max(0, ...matrix.map((r) => r.length));
  const body = header ? matrix.slice(1) : matrix;
  const headings = Array.from({ length: width }, (_, c) => (header ? clean(matrix[0][c]) : ''));
  const mapping = headings.map((h, c) => guessTarget(h, body.map((r) => r[c])));
  const seen = new Set<Target>();
  const final = mapping.map((t) => {
    if (t === 'ignore') return t;
    if (seen.has(t)) return 'ignore' as Target;
    seen.add(t);
    return t;
  });
  // Separate name columns win over a full-name column.
  if (final.includes('surname') && final.includes('full_name')) final[final.indexOf('full_name')] = 'ignore';
  return { header, mapping: final, headings };
}

/** "SURNAME First Middle", "SURNAME, First Middle" → parts. Nigerian class lists put the surname first. */
export function splitFullName(name: string): Pick<Student, 'surname' | 'first_name' | 'middle_name'> {
  const n = clean(name);
  if (n.includes(',')) {
    const [sur, rest = ''] = n.split(',', 2).map(clean);
    const [first = '', ...mid] = rest.split(' ').filter(Boolean);
    return { surname: sur, first_name: first, middle_name: mid.join(' ') };
  }
  const [sur = '', first = '', ...mid] = n.split(' ').filter(Boolean);
  return { surname: sur, first_name: first, middle_name: mid.join(' ') };
}

const tidy = (s: Student): Student => ({
  surname: clean(s.surname).toUpperCase(),
  first_name: titleCase(s.first_name),
  middle_name: titleCase(s.middle_name),
  matric: digits(clean(s.matric)),
});
export function titleCase(v: string) {
  return clean(v).toLowerCase().replace(/(^|[\s-'])([a-z])/g, (_, p, c) => p + c.toUpperCase());
}

/** Apply a column mapping to a table. Rows with no name and no matric are dropped (blank lines, totals). */
export function rowsFromMatrix(matrix: unknown[][], mapping: Target[], header: boolean): Student[] {
  const body = header ? matrix.slice(1) : matrix;
  const out: Student[] = [];
  for (const r of body) {
    const s: Student = { surname: '', first_name: '', middle_name: '', matric: '' };
    mapping.forEach((t, c) => {
      const v = clean(r[c]);
      if (!v || t === 'ignore') return;
      if (t === 'full_name') Object.assign(s, { ...splitFullName(v), ...(s.surname ? { surname: s.surname } : {}) });
      else s[t] = s[t] ? `${s[t]} ${v}` : v;
    });
    if (!s.surname && !s.first_name && !s.matric) continue;
    out.push(tidy(s));
  }
  return out;
}

/** Pasted text: one student per line, in any order. The matric is the 6–12 digit number; serial numbers are skipped. */
export function parsePasted(text: string): Student[] {
  const out: Student[] = [];
  for (const raw of text.split(/\r?\n/)) {
    let line = raw.replace(/\t/g, ' ').trim();
    if (!line) continue;
    line = line.replace(/^\d{1,4}[.)]\s*/, '').replace(/^\d{1,4}\s+(?=\D)/, ''); // "12. ...", "12) ...", "12 ADEBAYO ..."
    const m = line.match(/\b\d[\d\s/-]{4,14}\d\b/);
    const matric = m && looksLikeMatric(m[0]) ? digits(m[0]) : '';
    const rest = clean(matric && m ? line.replace(m[0], ' ') : line).replace(/^[-–:|,]+|[-–:|,]+$/g, '').trim();
    if (!rest && !matric) continue;
    if (!matric && /^(s\/?n|name|names|surname|matric)\b/i.test(rest)) continue; // heading line
    out.push(tidy({ ...splitFullName(rest), matric }));
  }
  return out;
}

export type Issue = 'duplicate' | 'matric_length' | 'no_matric' | 'no_surname' | 'no_first_name';
export const ISSUE_TEXT: Record<Issue, string> = {
  duplicate: 'same matric as another row',
  matric_length: 'matric looks the wrong length',
  no_matric: 'matric number missing',
  no_surname: 'surname missing',
  no_first_name: 'first name missing',
};
export type Checked = { index: number; student: Student; issues: Issue[] };

/** Flag rows the HOC should look at. Matric length is compared with the most common length in this list. */
export function checkRows(rows: Student[]): Checked[] {
  const lengths = new Map<number, number>();
  rows.forEach((r) => r.matric && lengths.set(r.matric.length, (lengths.get(r.matric.length) ?? 0) + 1));
  const usual = [...lengths.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const seen = new Map<string, number>();
  return rows.map((student, index) => {
    const issues: Issue[] = [];
    if (!student.matric) issues.push('no_matric');
    else {
      if (!MATRIC_RE.test(student.matric) || (usual && student.matric.length !== usual)) issues.push('matric_length');
      if (seen.has(student.matric)) issues.push('duplicate');
      else seen.set(student.matric, index);
    }
    if (!student.surname) issues.push('no_surname');
    if (!student.first_name) issues.push('no_first_name');
    return { index, student, issues };
  });
}

/** Rows that can be saved: valid matric and both names, first occurrence of each matric. */
export function saveable(checked: Checked[]): Student[] {
  return checked.filter((c) => !c.issues.some((i) => i !== 'matric_length' || !MATRIC_RE.test(c.student.matric))).map((c) => c.student)
    .filter((s) => s.surname && s.first_name && MATRIC_RE.test(s.matric));
}

/** Group PDF text items into lines by their y position. */
export function linesFromPdfItems(items: { str: string; x: number; y: number }[]): string[] {
  const rows: { y: number; parts: { x: number; s: string }[] }[] = [];
  for (const it of items) {
    if (!it.str.trim()) continue;
    const row = rows.find((r) => Math.abs(r.y - it.y) < 3);
    if (row) row.parts.push({ x: it.x, s: it.str });
    else rows.push({ y: it.y, parts: [{ x: it.x, s: it.str }] });
  }
  return rows.sort((a, b) => b.y - a.y).map((r) => r.parts.sort((a, b) => a.x - b.x).map((p) => p.s).join(' '));
}
