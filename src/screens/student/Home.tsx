import { useMemo, useState, type ReactNode } from 'react';
import { ArrowRight, Check, Flame, Pencil, CalendarClock, FileText, BookOpen, Bell, Sparkles, Target } from 'lucide-react';
import { Screen, TabBar, TopBar, BottomActions, Sheet } from '../../components/chrome';
import { Button, Card, Chips, Display, Label, ListCard, ProgressBar, StepBars, Field } from '../../components/ui';
import { AppIcon, BoxBoy, SemesterWeek, Wordmark } from '../../components/brand';
import { useGo } from '../../components/nav';
import { courses, student } from '../../data/sample';

/* ===== Shared Home pieces ===== */

/** Green hero: wordmark, streak, greeting, department pill, semester tracker, Box Boy holding the target. */
/** Good morning / afternoon / evening, by the phone's clock. */
export function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 12 ? 'GOOD MORNING' : h < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING';
}

export function HomeHero({ target, hidden, week = student.semesterWeek, weeks = 12, banner, name = student.firstName, classText = `${student.department} · ${student.level}`, streak = student.streak }: {
  target: number | null; hidden?: boolean; week?: number | null; weeks?: number; banner?: ReactNode; name?: string; classText?: string; streak?: number;
}) {
  const go = useGo();
  return (
    <div style={{ background: 'var(--u-green)', padding: '12px 16px 72px', position: 'relative' }}>
      <div className="row between">
        <Wordmark />
        <span className="row" style={{ gap: 4, background: 'var(--u-amber)', borderRadius: 28, padding: '5px 10px 5px 5px' }}>
          <span style={{ width: 27, height: 24, borderRadius: 12, background: '#0a0a0a', display: 'grid', placeItems: 'center' }}><Flame size={14} color="#fbbf24" fill="#fbbf24" /></span>
          <span className="display" style={{ fontSize: 15 }}>{streak}D</span>
        </span>
      </div>
      {banner}
      <Display size={34} style={{ marginTop: 14, maxWidth: 'min(300px, calc(100% - 118px))' }}>{`${greeting()},\n${name.toUpperCase()}.`}</Display>
      <div className="stack" style={{ gap: 10, marginTop: 10 }}>
        <span className="eyebrow" style={{ alignSelf: 'flex-start', background: '#101714', color: 'var(--u-green)', borderRadius: 15, padding: '8px 12px', fontSize: 11 }}>
          {classText}
        </span>
        {/* Replaces "Week 1 starts today · first class 8 AM": the hero shows where you are in the semester. */}
        {week != null && <SemesterWeek week={week} total={weeks} />}
      </div>
      {/* Box Boy holds the target sign (the sign is code, so the number is live) */}
      <button className="hero-boxboy" onClick={() => go('S15')} style={{ position: 'absolute', right: 8, top: 54, width: 123 }} aria-label="Edit target">
        <BoxBoy pose="targetSign" width={123} />
        <span className="stack" style={{ position: 'absolute', left: 10, top: 70, width: 100, background: '#101714', borderRadius: 16, padding: '6px 10px', alignItems: 'center' }}>
          <span className="t-12 w-7" style={{ color: '#fbbf24', fontSize: 10 }}>Your target</span>
          <span className="display" style={{ color: '#fbbf24', fontSize: 24 }}>{hidden ? '•.••' : target == null ? 'SET' : target.toFixed(2)}</span>
          <span style={{ position: 'absolute', right: -6, top: -6, width: 18, height: 18, borderRadius: 9, background: '#0a0a0a', display: 'grid', placeItems: 'center' }}><Pencil size={9} color="#50ff90" /></span>
        </span>
      </button>
    </div>
  );
}

/** Course card with lecturer initials, status chip and week progress. PRIORITY for other-level courses. */
export function CourseCard({ code, title, lecturer, progress, week, priority, onClick }: (typeof courses)[number] & { onClick?: () => void }) {
  const initials = lecturer.replace(/^(Dr\.|Engr\.|Prof\.)\s*/, '').split(/[ .]+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('');
  const started = progress > 0;
  return (
    <Card pad="14px 12px" gap={8} onClick={onClick} style={{ borderRadius: 20 }}>
      <div className="row" style={{ gap: 12 }}>
        <span style={{ width: 44, height: 44, borderRadius: 22, background: 'var(--u-green)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 14 }}>{initials}</span>
        <div className="grow stack">
          <span className="row" style={{ gap: 6 }}><span className="t-16 w-7">{code}</span>{priority && <span className="pill pill--amber" style={{ fontSize: 10 }}>PRIORITY</span>}</span>
          <span className="t-12 w-5 muted">{title}</span>
          <span className="t-12 w-5" style={{ color: '#616161' }}>{lecturer}</span>
        </div>
        <span className={`pill ${started ? 'pill--good' : 'pill--grey'}`}>{started ? 'In progress' : 'Not started'}</span>
      </div>
      <ProgressBar value={progress} height={4} track="var(--u-border)" />
      <span className="t-12 w-6 muted">Week {week} of 12</span>
    </Card>
  );
}

export function ContinueCard() {
  const go = useGo();
  return (
    <Card tone="dark" pad={18} gap={10} onClick={() => go('S26')}>
      <div className="row between"><span className="eyebrow" style={{ color: 'var(--u-green)', fontSize: 11 }}>Continue</span><span className="t-12 w-6" style={{ color: '#999' }}>Week 2 · Topic 2</span></div>
      <div className="row" style={{ gap: 12 }}>
        <div className="grow stack" style={{ gap: 2 }}>
          <span className="t-20 w-7">Family Biogas Digester</span>
          <span className="t-13 w-5" style={{ color: '#999' }}>MEE 352 · Energy Conservation</span>
        </div>
        <span style={{ width: 44, height: 44, borderRadius: 22, background: 'var(--u-amber)', display: 'grid', placeItems: 'center' }}><ArrowRight size={20} color="#0a0a0a" /></span>
      </div>
      <div className="row" style={{ gap: 12 }}>
        <div className="grow"><ProgressBar value={0.25} track="#2b2b2b" /></div>
        <span className="t-12 w-6" style={{ color: '#999' }}>Week 2 of 12</span>
      </div>
    </Card>
  );
}

export function CoursesList() {
  const go = useGo();
  return (
    <>
      <div className="row between" style={{ marginTop: 6 }}>
        <span className="display" style={{ fontSize: 18 }}>My courses</span>
        <button className="t-13 w-7" style={{ color: 'var(--u-good-2)' }} onClick={() => go('S08')}>+ Add course</button>
      </div>
      <div className="auto-grid">{courses.map((c) => <CourseCard key={c.code} {...c} onClick={() => go('S23')} />)}</div>
    </>
  );
}

/** The rounded off-white sheet that sits over the green hero. */
export function HomeSheet({ children }: { children: ReactNode }) {
  return (
    <div className="stack pad" style={{ gap: 12, background: 'var(--u-page)', borderRadius: '32px 32px 0 0', marginTop: -48, paddingTop: 16, position: 'relative' }}>
      <span style={{ fontSize: 8, fontWeight: 500, color: '#647369', letterSpacing: '0.04em' }}>LAGOS STATE UNIVERSITY / FACULTY OF ENGINEERING</span>
      {children}
    </div>
  );
}

/* S14 · Home — first open. "Set my target" is the first call to action. */
export function S14HomeFirstOpen() {
  const go = useGo();
  const [slide, setSlide] = useState(0);
  return (
    <Screen tabs>
      <HomeHero target={null} week={1} />
      <HomeSheet>
        <div className="row hide-scrollbar" style={{ gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', margin: '0 -16px', padding: '0 16px' }} onScroll={(e) => setSlide(Math.round(e.currentTarget.scrollLeft / 300))}>
          <Card tone="dark" pad={20} gap={12} style={{ minWidth: 330, scrollSnapAlign: 'start' }}>
            <span className="eyebrow" style={{ color: 'var(--u-green)', fontSize: 11 }}>Where are you headed?</span>
            <span className="t-19 w-7">Set a CGPA target and see what you need each semester.</span>
            <Button onClick={() => go('S15')}>Set my target</Button>
          </Card>
          <Card tone="dark" pad={20} gap={10} style={{ minWidth: 330, scrollSnapAlign: 'start' }}>
            <div className="row between">
              <div className="stack"><span className="label" style={{ color: '#888' }}>Current</span><span className="display" style={{ fontSize: 40, color: '#fbbf24' }}>{student.cgpa.toFixed(2)}</span><span className="t-13 w-5">after 4 semesters</span></div>
              <div className="stack" style={{ alignItems: 'flex-end' }}><span className="label" style={{ color: 'var(--u-green)' }}>Target</span><span className="display" style={{ fontSize: 40, color: 'var(--u-good-2)' }}>4.50</span><span className="t-13 w-5">out of 5.0</span></div>
            </div>
            <ProgressBar value={student.cgpa / 5} color="#fbbf24" track="#50ff90" height={10} />
            <span className="display" style={{ fontSize: 17, color: '#fbbf24' }}>Plan your semester</span>
            <span className="t-14 w-6" style={{ color: 'var(--u-green)' }}>Score 4.83 each semester to get there.</span>
          </Card>
        </div>
        <div className="row" style={{ gap: 6, justifyContent: 'center' }}>
          {[0, 1].map((i) => <span key={i} style={{ width: i === slide ? 22 : 8, height: 8, borderRadius: 4, background: i === slide ? '#0a0a0a' : 'var(--u-border)' }} />)}
        </div>
        <CoursesList />
      </HomeSheet>
      <TabBar active="home" classBadge={2} />
    </Screen>
  );
}

/* S19 · Home — target set (numbers hidden toggle on the sign) */
export function S19Home() {
  const [hidden, setHidden] = useState(false);
  return (
    <Screen tabs>
      <HomeHero target={student.target} hidden={hidden} />
      <HomeSheet>
        <button className="t-12 w-6 muted" style={{ alignSelf: 'flex-end', marginTop: -6 }} onClick={() => setHidden((h) => !h)}>{hidden ? 'Show numbers' : 'Hide numbers'}</button>
        <ContinueCard />
        <CoursesList />
      </HomeSheet>
      <TabBar active="home" classBadge={2} />
    </Screen>
  );
}

/* ===== CGPA planner =====
   Changed 2 Nov: the student enters their CGPA ONCE. Every compulsory course is pre-ticked "Done";
   they only change exceptions to "Priority" (retaking / earlier level) or "Not yet" (later level / not registered).
   Units done come from the ticks. No per-course grades for past semesters. */

type Status = 'done' | 'prio' | 'later';
const CURRENT_COURSES: { code: string; units: number; status: Status }[] = [
  { code: 'MEE 301', units: 3, status: 'done' },
  { code: 'MEE 311', units: 3, status: 'done' },
  { code: 'MTH 202 (200L)', units: 3, status: 'prio' },
  { code: 'GNS 301', units: 2, status: 'later' },
];
const TOTAL_UNITS = student.unitsDone + student.unitsLeft;

/** Required GPA per remaining semester to finish on `target`. */
export function neededGpa(target: number, cgpa: number, unitsDone: number, total = TOTAL_UNITS) {
  const left = total - unitsDone;
  return left <= 0 ? NaN : (target * total - cgpa * unitsDone) / left;
}
export function bestFinish(cgpa: number, unitsDone: number, total = TOTAL_UNITS) {
  return (cgpa * unitsDone + 5 * (total - unitsDone)) / total;
}
export function difficulty(need: number): { label: string; tone: 'bad' | 'warn' | 'good' | 'grey' } {
  if (need > 5) return { label: 'Out of reach', tone: 'grey' };
  if (need >= 4.6) return { label: 'Very difficult', tone: 'bad' };
  if (need >= 4.3) return { label: 'Stretch', tone: 'warn' };
  if (need >= 3.6) return { label: 'Achievable', tone: 'good' };
  return { label: 'Comfortable', tone: 'grey' };
}

function StatusSeg({ value, onChange }: { value: Status; onChange: (s: Status) => void }) {
  const opts: [Status, string][] = [['done', 'Done'], ['prio', 'Priority'], ['later', 'Not yet']];
  return (
    <span className="row" style={{ gap: 4, padding: 4, borderRadius: 14, background: 'var(--u-chip)' }}>
      {opts.map(([k, l]) => {
        const on = k === value;
        const bg = on ? (k === 'done' ? '#0a0a0a' : k === 'prio' ? '#fbbf24' : '#fff') : 'transparent';
        return (
          <button key={k} onClick={() => onChange(k)} className="t-12 w-7" style={{ padding: '6px 10px', borderRadius: 10, background: bg, color: on ? (k === 'done' ? '#50ff90' : '#0a0a0a') : '#888', border: on && k === 'later' ? '1px solid #cfcdc7' : 0 }}>
            {l}
          </button>
        );
      })}
    </span>
  );
}

/* S15 · CGPA plan 1 — Where you are now */
export function S15WhereYouAre() {
  const go = useGo();
  const [cgpa, setCgpa] = useState(student.cgpa.toFixed(2));
  const [rows, setRows] = useState(CURRENT_COURSES);
  const doneNow = rows.filter((r) => r.status === 'done').reduce((s, r) => s + r.units, 0);
  return (
    <Screen actions>
      <TopBar title="Plan your CGPA" />
      <div className="stack pad" style={{ gap: 14, paddingTop: 8 }}>
        <StepBars step={1} />
        <Display size={40}>{'WHERE ARE\nYOU NOW?'}</Display>
        <p className="t-15" style={{ color: '#333' }}>Your CGPA once, then tick what you've taken. No grades needed.</p>
        <Card tone="dark" pad="16px 20px" style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <div className="grow stack" style={{ gap: 2 }}>
            <span className="label" style={{ color: 'var(--u-green)' }}>Your CGPA right now</span>
            <span className="t-12" style={{ color: '#aaa' }}>From your last result, after 200L</span>
          </div>
          <label className="row" style={{ gap: 4, padding: '8px 14px', borderRadius: 14, background: '#1d1d1d', border: '1px solid var(--u-green)', alignItems: 'baseline' }}>
            <input value={cgpa} onChange={(e) => setCgpa(e.target.value)} inputMode="decimal" aria-label="Your CGPA" className="display" style={{ width: 78, fontSize: 30, color: '#fff', background: 'transparent', border: 0, outline: 'none' }} />
            <span className="t-13 w-5" style={{ color: '#888' }}>/ 5.00</span>
          </label>
        </Card>
        <div className="row between"><Label>Your courses</Label><span className="t-12 w-7" style={{ color: 'var(--u-good)' }}>{student.unitsDone + doneNow} units done</span></div>
        {['100L · both semesters', '200L · both semesters'].map((t) => (
          <Card key={t} pad="14px 16px" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18 }}>
            <span style={{ width: 20, height: 20, borderRadius: 10, background: 'var(--u-green)' }} />
            <span className="grow t-15 w-6">{t}</span>
            <span className="t-13 w-6" style={{ color: 'var(--u-good)' }}>All done ✓  ›</span>
          </Card>
        ))}
        <div className="card" style={{ border: '1px solid #0a0a0a', borderRadius: 20 }}>
          <div className="row between" style={{ padding: '12px 16px' }}><span className="t-15 w-7">300L · Semester 1</span><span className="t-12" style={{ color: '#777' }}>this semester</span></div>
          {rows.map((r, i) => (
            <div key={r.code} className="row" style={{ gap: 8, padding: '10px 16px' }}>
              <div className="grow stack"><span className="t-14 w-6">{r.code}</span><span className="t-12" style={{ color: '#777' }}>{r.units} units</span></div>
              <StatusSeg value={r.status} onChange={(s) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, status: s } : x)))} />
            </div>
          ))}
          <button className="t-13 w-6" style={{ padding: '12px 16px', color: 'var(--u-good)' }} onClick={() => go('S16')}>+ Add a course that isn't listed</button>
        </div>
      </div>
      <BottomActions hint="Compulsory courses are ticked for you. Only change what's different.">
        <Button onClick={() => go('S17')}>Next</Button>
      </BottomActions>
    </Screen>
  );
}

/* S16 · Add a course (sheet). Asks "Did you take it?", not a grade. */
export function S16AddCourse() {
  const go = useGo();
  const [units, setUnits] = useState(3);
  const [took, setTook] = useState<Status>('done');
  return (
    <Screen>
      <TopBar title="Plan your CGPA" />
      <Sheet>
        <span className="t-20 w-7" style={{ fontSize: 22 }}>Add a course</span>
        <span className="t-13 muted">For electives, or a course from another level that isn't listed.</span>
        <Field label="COURSE CODE" value="MTH 202" />
        <Field label="WHICH SEMESTER" value="200L · Semester 2" select />
        <div><Label style={{ marginBottom: 8 }}>Units</Label>
          <div className="row" style={{ gap: 8 }}>{[1, 2, 3, 4, 6].map((u) => <button key={u} onClick={() => setUnits(u)} className="t-15 w-7" style={{ width: 52, height: 40, borderRadius: 12, background: u === units ? '#0a0a0a' : 'var(--u-card-2)', color: u === units ? '#50ff90' : '#555' }}>{u}</button>)}</div>
        </div>
        <div><Label style={{ marginBottom: 8 }}>Did you take it?</Label>
          <Chips>{([['done', 'Done'], ['prio', 'Priority (retaking)'], ['later', 'Not yet']] as [Status, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setTook(k)} className="t-14 w-6" style={{ padding: '9px 14px', borderRadius: 14, background: took === k ? '#0a0a0a' : 'var(--u-chip)', color: took === k ? '#50ff90' : '#0a0a0a' }}>{l}</button>
          ))}</Chips>
        </div>
        <Button onClick={() => go('S15')}>Add course</Button>
      </Sheet>
    </Screen>
  );
}

/* S17 · CGPA plan 2 — Where do you want to finish? Honest labels from the maths. */
const CLASSES: [number, string][] = [[5.0, 'Perfect First Class'], [4.5, 'First Class'], [4.0, 'Second Class Upper'], [3.5, 'Second Class Upper']];
export function S17WhereToFinish() {
  const go = useGo();
  const [pick, setPick] = useState(4.0);
  const [why, setWhy] = useState('A strong career start');
  const best = bestFinish(student.cgpa, student.unitsDone);
  return (
    <Screen actions>
      <TopBar title="Plan your CGPA" />
      <div className="stack pad" style={{ gap: 12, paddingTop: 8 }}>
        <StepBars step={2} />
        <Display size={34}>{'WHERE DO YOU\nWANT TO FINISH?'}</Display>
        <p className="t-14 muted">You're on {student.cgpa.toFixed(2)} with {student.unitsLeft} units still to go. The highest you can still finish on is {best.toFixed(2)}.</p>
        {CLASSES.map(([t, name]) => {
          const need = neededGpa(t, student.cgpa, student.unitsDone);
          const d = difficulty(need);
          const out = need > 5;
          const on = pick === t && !out;
          return (
            <button key={t} disabled={out} onClick={() => setPick(t)} className="row" style={{ gap: 14, padding: '16px', borderRadius: 20, textAlign: 'left', background: on ? '#0a0a0a' : '#fff', border: on ? 0 : '1px solid var(--u-border)', opacity: out ? 0.6 : 1 }}>
              <span className="display" style={{ fontSize: 28, color: out ? '#999' : on ? 'var(--u-green)' : '#0a0a0a', width: 76 }}>{t.toFixed(2)}</span>
              <span className="grow stack" style={{ gap: 3 }}>
                <span className="row" style={{ gap: 8 }}><span className="t-15 w-7" style={{ color: on ? '#f5f4f0' : undefined }}>{name}</span><span className={`pill pill--${d.tone}`} style={{ fontSize: 10 }}>{d.label}</span></span>
                <span className="t-13" style={{ color: on ? '#999' : 'var(--u-text-2)' }}>{out ? `Out of reach from ${student.cgpa.toFixed(2)}. Only a 5.0 from 100L gets here.` : `You'd need ${need.toFixed(2)} every semester.`}</span>
              </span>
            </button>
          );
        })}
        <div className="row card" style={{ padding: '14px 16px', borderRadius: 20, justifyContent: 'space-between' }}><span className="t-15 w-7">Your own number</span><span className="t-14 w-5 faint">e.g. 4.20</span></div>
        <Label>What's driving this? (optional)</Label>
        <Chips>{['A strong career start', 'Scholarship or postgrad', 'Proving it to myself', 'Family expectations'].map((w) => (
          <button key={w} onClick={() => setWhy(w)} className={`chip chip--sm${why === w ? ' chip--on' : ''}`}>{w}</button>
        ))}</Chips>
      </div>
      <BottomActions><Button onClick={() => go('S18')}>See my plan</Button></BottomActions>
    </Screen>
  );
}

/* S18 · CGPA plan 3 — Your plan, with a what-if for this semester */
const GRADE_POINTS: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };
export function S18YourPlan() {
  const go = useGo();
  const target = 4.0;
  const need = neededGpa(target, student.cgpa, student.unitsDone);
  const [tab, setTab] = useState<'now' | 'impact'>('now');
  const [grades, setGrades] = useState<Record<string, string>>({ 'ECE 301': 'A', 'ECE 303': 'A', 'ECE 305': 'B', 'ECE 307': 'A', 'MEE 301': 'B' });
  const projected = useMemo(() => {
    const u = 3 * Object.keys(grades).length;
    const pts = Object.values(grades).reduce((s, g) => s + 3 * GRADE_POINTS[g], 0);
    return (student.cgpa * student.unitsDone + pts) / (student.unitsDone + u);
  }, [grades]);
  const allA = (student.cgpa * student.unitsDone + 5 * 27) / (student.unitsDone + 27);
  const road: [string, string, 'done' | 'now' | 'later'][] = [
    ['100L to 200L', `4 semesters done · ${student.unitsDone} units`, 'done'],
    ['300L · Semester 1', `Now · aim for ${need.toFixed(2)} · 27 units`, 'now'],
    ['300L · Semester 2', `Aim for ${need.toFixed(2)} · 25 units`, 'later'],
    ['400L and 500L', `4 semesters · aim for ${need.toFixed(2)} · 92 units (estimated)`, 'later'],
  ];
  return (
    <Screen actions>
      <TopBar title="Plan your CGPA" />
      <div className="stack pad" style={{ gap: 12, paddingTop: 8 }}>
        <StepBars step={3} />
        <Card tone="dark" pad={18} gap={4}>
          <span className="eyebrow" style={{ color: 'var(--u-green)', fontSize: 11 }}>To finish on {target.toFixed(2)}, score at least</span>
          <span className="display" style={{ fontSize: 56, color: '#f5f4f0' }}>{need.toFixed(2)}</span>
          <span className="t-13" style={{ color: '#999' }}>every semester. Keep doing what got you here.</span>
        </Card>
        <Label>Semester roadmap</Label>
        <ListCard>
          {road.map(([t, s, st]) => (
            <div key={t} className="row" style={{ gap: 12, padding: '14px 16px', background: st === 'now' ? 'rgba(80,255,144,.18)' : undefined }}>
              <span style={{ width: 24, height: 24, borderRadius: 12, display: 'grid', placeItems: 'center', background: st === 'done' ? '#0a0a0a' : st === 'now' ? 'var(--u-green)' : 'var(--u-card-2)' }}>{st === 'done' && <Check size={12} color="#50ff90" strokeWidth={3} />}</span>
              <span className="stack"><span className="t-14 w-7" style={{ color: st === 'later' && t.startsWith('400') ? '#555' : undefined }}>{t}</span><span className="t-12 muted">{s}</span></span>
            </div>
          ))}
        </ListCard>
        <div className="row" style={{ gap: 4, padding: 4, borderRadius: 16, background: 'var(--u-card-2)', border: '1px solid var(--u-border)' }}>
          {([['now', 'This semester'], ['impact', 'Biggest impact']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className="t-13 w-7" style={{ flex: 1, padding: 8, borderRadius: 12, background: tab === k ? '#0a0a0a' : 'transparent', color: tab === k ? '#f5f4f0' : '#555' }}>{l}</button>
          ))}
        </div>
        <Card pad={16} gap={10} style={{ borderRadius: 20 }}>
          <div className="row between">
            <div className="stack"><span className="label" style={{ fontSize: 10 }}>Projected CGPA</span><span className="display" style={{ fontSize: 24 }}>{projected.toFixed(2)}</span></div>
            <div className="stack" style={{ alignItems: 'flex-end' }}><span className="label" style={{ fontSize: 10 }}>If you get all A's</span><span className="display" style={{ fontSize: 24, color: 'var(--u-good-2)' }}>{allA.toFixed(2)}</span></div>
          </div>
          {Object.entries(grades).map(([code, g]) => (
            <div key={code} className="row" style={{ gap: 8 }}>
              <div className="grow stack"><span className="t-14 w-7">{code}</span><span className="faint" style={{ fontSize: 11 }}>3 units</span></div>
              {Object.keys(GRADE_POINTS).map((x) => (
                <button key={x} onClick={() => setGrades((gs) => ({ ...gs, [code]: x }))} className="t-12 w-7" style={{ width: 26, height: 28, borderRadius: 8, background: x === g ? '#0a0a0a' : 'var(--u-card-2)', color: x === g ? '#50ff90' : '#555' }}>{x}</button>
              ))}
            </div>
          ))}
          <span className="t-13 w-6 muted">+ 4 more courses this semester</span>
        </Card>
      </div>
      <BottomActions hint="You can change your target any time from Home"><Button onClick={() => go('S19')}>Save my plan</Button></BottomActions>
    </Screen>
  );
}

/* S20 · Welcome back — replaces Home after 5+ days away */
export function S20WelcomeBack() {
  const go = useGo();
  const items: [ReactNode, string, string][] = [
    [<CalendarClock size={18} />, 'ECE 305 test moved', 'Now Thursday 30 Oct, 10 AM, LT 1'],
    [<FileText size={18} />, 'Assignment 2 is out', 'ECE 303 · due Friday 31 Oct'],
    [<BookOpen size={18} />, '2 weeks of new notes', 'ECE 305 Week 4, MEE 352 Week 3'],
  ];
  return (
    <Screen bg="var(--u-green)" actions>
      <div className="stack pad" style={{ gap: 14, paddingTop: 56 }}>
        <Display size={38}>{`WELCOME BACK,\n${student.firstName.toUpperCase()}.`}</Display>
        <p className="t-15 w-5">Here's what moved while you were away. Start with the top one. There's no rush.</p>
        <ListCard style={{ border: 0 }}>
          {items.map(([icon, t, s]) => (
            <div key={t} className="row" style={{ gap: 12, padding: '14px 16px' }}>
              <span style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--u-card-2)', display: 'grid', placeItems: 'center' }}>{icon}</span>
              <span className="stack"><span className="t-15 w-7">{t}</span><span className="t-12 muted">{s}</span></span>
            </div>
          ))}
        </ListCard>
        <BoxBoy pose="chairSmall" width={260} style={{ alignSelf: 'center' }} />
      </div>
      <BottomActions tone="green">
        <Button onClick={() => go('S41')}>Open the first one</Button>
        <Button variant="white" onClick={() => go('S19')}>Go to Home</Button>
      </BottomActions>
    </Screen>
  );
}

/* S21 · Notifications (from Me) */
export function S21Notifications() {
  const items: { icon: ReactNode; bg: string; title: string; time: string; body: string; unread?: boolean }[] = [
    { icon: <BookOpen size={18} />, bg: 'var(--u-green)', title: 'Class 3 notes are up', time: '8:02 AM', body: 'Village biogas plant, MEE 352 Week 2. 10 min read, saved offline.', unread: true },
    { icon: <Sparkles size={18} color="#50ff90" />, bg: '#0a0a0a', title: `Good morning, ${student.firstName}`, time: '6:30 AM', body: 'Two classes today. ECE 305 at 8 AM is first.', unread: true },
    { icon: <Check size={18} />, bg: 'var(--u-green)', title: 'Your report was fixed', time: 'Yesterday', body: "The worked example in MEE 352 now matches your lecturer's." },
    { icon: <Bell size={18} />, bg: 'var(--u-card-2)', title: 'ECE 311 notes land Friday', time: 'Sun', body: "Week 1 notes arrive by Fri 31 Oct. We'll tell you the moment they're up." },
    { icon: <Target size={18} />, bg: 'var(--u-card-2)', title: 'Your target is set', time: 'Sun', body: `Finish on 4.00. That means ${neededGpa(4, student.cgpa, student.unitsDone).toFixed(2)} or better each semester.` },
  ];
  return (
    <Screen>
      <TopBar title="Notifications" />
      <div className="stack pad" style={{ gap: 10, paddingTop: 8, paddingBottom: 32 }}>
        {items.map((n, i) => (
          <div key={n.title} className="stack" style={{ gap: 10 }}>
            {i === 0 && <Label>Today</Label>}
            {i === 2 && <Label style={{ marginTop: 6 }}>Earlier</Label>}
            <Card pad={14} style={{ flexDirection: 'row', gap: 12, borderRadius: 20 }}>
              <span style={{ width: 40, height: 40, borderRadius: 14, background: n.bg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{n.icon}</span>
              <div className="grow stack" style={{ gap: 3 }}>
                <div className="row" style={{ gap: 8 }}><span className="grow t-15 w-7">{n.title}</span><span className="faint w-5" style={{ fontSize: 11 }}>{n.time}</span>{n.unread && <span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--u-good-2)' }} />}</div>
                <span className="t-13 muted">{n.body}</span>
              </div>
            </Card>
          </div>
        ))}
        <p className="t-12 w-5 faint center" style={{ marginTop: 8 }}>Posts from your HOC live in the Class tab.</p>
      </div>
    </Screen>
  );
}

/* S22 · Loading a note */
export function S22Loading() {
  return (
    <Screen style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ animation: 'pulse 1.2s ease-in-out infinite' }}><AppIcon size={92} /></div>
      <span className="t-14 w-6 faint">Opening your note…</span>
      <style>{'@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}'}</style>
    </Screen>
  );
}
