import { useState, type ReactNode, type CSSProperties } from 'react';
import { ArrowRight, Camera, Check, ChevronRight, Clock, FileText, Upload, Video, Plus, Coffee, Send, Bell, BookOpen, MessageCircle, LogOut, CalendarDays, Users, ScanLine } from 'lucide-react';
import { Screen, TopBar, TabBar, BottomActions } from '../../components/chrome';
import { Button, Card, Display, Field, Label, ListCard, ListRow, Pill, Chip, Chips, Segmented, Toggle, ProgressBar, Checkbox } from '../../components/ui';
import { BoxBoy, Wordmark, Avatar, AppIcon, Bubble } from '../../components/brand';
import { useGo } from '../../components/nav';
import { isLive } from '../../lib/supabase';

/* ===================== Lecturer (L00–L20) =====================
   Unify Learn for Lecturers is its own product: a workspace built around the
   courses a lecturer teaches. A file or a post is sent once per course and
   every class (department/level) taking that course gets it. */

/* ---------- Splash + intro (L00, L01a–L01c) ----------
   Tone from the research: ownership and respect, not "we'll lighten your load".
   No fake stats before they've signed up; one simple picture per screen. */
export function L00Splash() {
  const go = useGo();
  return (
    <Screen bg="#0a0a0a" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={() => go('L01a')} className="stack" style={{ alignItems: 'center', gap: 18, cursor: 'pointer' }}>
        <AppIcon size={112} bg="#50ff90" fg="#0a0a0a" />
        <Wordmark size={30} color="#fff" />
        <span className="t-13 w-7" style={{ color: 'var(--u-green)', letterSpacing: '0.24em' }}>FOR LECTURERS</span>
      </div>
      <div className="stack" style={{ position: 'absolute', bottom: 48, alignItems: 'center', gap: 2, color: 'rgba(255,255,255,.6)' }}>
        <span className="t-12 w-5">Powered by</span>
        <Wordmark size={18} color="rgba(255,255,255,.6)" />
      </div>
    </Screen>
  );
}

function LecIntro({ step, eyebrow, title, body, visual, next, cta = 'Next', typeLed }: { step: number; eyebrow: string; title: ReactNode; body: string; visual?: ReactNode; next: string; cta?: string; typeLed?: boolean }) {
  const go = useGo();
  return (
    <Screen bg="#0a0a0a" style={{ color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div className="row between pad" style={{ paddingTop: 16 }}>
        <Wordmark size={16} color="#fff" />
        <div className="row" style={{ gap: 6 }}>{[0, 1, 2].map((i) => <span key={i} style={{ width: i === step ? 22 : 6, height: 6, borderRadius: 3, background: i === step ? 'var(--u-green)' : 'rgba(255,255,255,.3)' }} />)}</div>
      </div>
      <button onClick={() => go('L01')} className="t-14 w-6" style={{ alignSelf: 'flex-end', margin: '12px 16px 0', color: 'rgba(255,255,255,.6)' }}>Skip</button>
      {typeLed ? (
        <div className="stack pad grow" style={{ justifyContent: 'center', gap: 14 }}>
          <span className="t-12 w-7" style={{ color: 'var(--u-green)', letterSpacing: '0.08em' }}>{eyebrow}</span>
          <div className="display" style={{ fontSize: 54, lineHeight: 1.02 }}>{title}</div>
          <p className="t-16" style={{ color: 'rgba(255,255,255,.7)', lineHeight: 1.45 }}>{body}</p>
        </div>
      ) : (
        <>
          <div className="grow" style={{ display: 'grid', placeItems: 'center', minHeight: 360 }}>{visual}</div>
          <div className="stack" style={{ background: 'var(--u-page)', color: 'var(--u-text)', borderRadius: '32px 32px 0 0', padding: '28px 24px 8px', gap: 10 }}>
            <span className="t-12 w-7" style={{ color: 'var(--u-good)', letterSpacing: '0.08em' }}>{eyebrow}</span>
            <div className="display" style={{ fontSize: 30, lineHeight: 1.05 }}>{title}</div>
            <p className="t-16 muted" style={{ lineHeight: 1.45 }}>{body}</p>
          </div>
        </>
      )}
      <div style={{ padding: '20px 24px calc(28px + env(safe-area-inset-bottom))', background: typeLed ? 'transparent' : 'var(--u-page)' }}>
        <Button onClick={() => go(next)}>{cta} <ArrowRight size={18} /></Button>
      </div>
    </Screen>
  );
}

function CourseTile({ dept, num, level, featured }: { dept: string; num: string; level: string; featured?: boolean }) {
  const s = featured ? 124 : 104;
  return (
    <div className="stack" style={{ alignItems: 'center', gap: 12, marginTop: featured ? 0 : 10 }}>
      <div className="stack" style={{ width: s, height: s, borderRadius: 28, alignItems: 'center', justifyContent: 'center', background: featured ? 'var(--u-green)' : '#1c1c1c', border: featured ? 0 : '1px solid rgba(255,255,255,.12)' }}>
        <span className="w-7" style={{ fontSize: featured ? 14 : 12, color: featured ? 'rgba(10,10,10,.7)' : 'rgba(255,255,255,.6)' }}>{dept}</span>
        <span className="display" style={{ fontSize: featured ? 34 : 28, color: featured ? '#0a0a0a' : 'var(--u-green)' }}>{num}</span>
      </div>
      <span className="t-12 w-6" style={{ color: 'rgba(255,255,255,.55)' }}>{level}</span>
    </div>
  );
}

export const L01aWorkspace = () => (
  <LecIntro step={0} eyebrow="01 · YOUR WORKSPACE" title="EVERY COURSE YOU TEACH. UNDER ONE ROOF." body="Your courses across departments and levels, organised in one place and always within reach." next="L01b"
    visual={<div className="stack" style={{ alignItems: 'center', gap: 22 }}>
      <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}><CourseTile dept="MEE" num="202" level="200L" /><CourseTile dept="MEE" num="301" level="300L" featured /><CourseTile dept="ECE" num="311" level="300L" /></div>
      <span className="t-13 w-5" style={{ color: 'rgba(255,255,255,.45)' }}>Mechanical · Electrical · Chemical</span>
    </div>} />
);

export const L01bAttendance = () => (
  <LecIntro step={1} eyebrow="02 · YOUR CLASSES" title="400 STUDENTS? ATTENDANCE IN MINUTES." body="Open a scan and your HOCs check everyone in at the door. No roll call, no signing for friends." next="L01c"
    visual={<div style={{ position: 'relative', width: 200, height: 390, borderRadius: 34, background: '#1a1a1a', border: '2px solid #3a3a3a', padding: 8 }}>
      <div className="stack" style={{ height: '100%', borderRadius: 28, background: '#0a0a0a', alignItems: 'center', paddingTop: 28, gap: 12 }}>
        <span className="t-12 w-6" style={{ color: 'var(--u-green)', fontSize: 10 }}>MEE 352 · scan open</span>
        <div style={{ position: 'relative', padding: 14 }}>
          {[['top', 'left'], ['top', 'right'], ['bottom', 'left'], ['bottom', 'right']].map(([v, h]) => <span key={v + h} style={{ position: 'absolute', [v]: 0, [h]: 0, width: 26, height: 26, [`border${v === 'top' ? 'Top' : 'Bottom'}`]: '4px solid var(--u-green)', [`border${h === 'left' ? 'Left' : 'Right'}`]: '4px solid var(--u-green)', borderRadius: 4 } as CSSProperties} />)}
          <div style={{ width: 140, height: 140, borderRadius: 18, background: 'var(--u-green)', padding: 12 }}>
            <div style={{ width: '100%', height: '100%', borderRadius: 8, background: '#fff', display: 'grid', gridTemplateColumns: 'repeat(11,1fr)', padding: 6 }}>
              {Array.from({ length: 121 }, (_, k) => { const i = Math.floor(k / 11), j = k % 11; const on = (i * 7 + j * 13 + i * j) % 5 < 2 || (i < 3 && j < 3) || (i < 3 && j > 7) || (i > 7 && j < 3); return <span key={k} style={{ background: on ? '#0a0a0a' : '#fff' }} />; })}
            </div>
          </div>
          <span style={{ position: 'absolute', left: 10, right: 10, top: '55%', height: 2, background: 'var(--u-green)', boxShadow: '0 0 10px var(--u-green)' }} />
        </div>
        <span className="display" style={{ fontSize: 13 }}>JOSHUA OLOTUCHE</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', marginTop: -8 }}>300L ECE · Matric 2208••••</span>
        <span className="row t-12 w-7" style={{ gap: 6, background: 'var(--u-green)', color: '#0a0a0a', padding: '8px 16px', borderRadius: 17 }}><Check size={14} strokeWidth={3} />Checked in</span>
      </div>
    </div>} />
);

export const L01cInsight = () => (
  <LecIntro step={2} typeLed eyebrow="03 · YOUR INSIGHT" title={<>SEE <span style={{ color: 'var(--u-green)' }}>BEYOND</span> YOUR LECTURE HALL.</>} body="Follow how each class is doing, spot the topics students keep missing, and know where your attention is needed." next="L01" cta="Set up my workspace" />
);

/* ---------- Welcome + onboarding L01–L06 ---------- */
export function L01Welcome() {
  const go = useGo();
  const google = !isLive; // the live app signs lecturers up with email; Google shows in the design gallery only
  return (
    <Screen bg="var(--u-green)" actions>
      <div className="stack pad" style={{ gap: 10, paddingTop: 40 }}>
        <Display size={44}>{'A NEW WAY TO MANAGE YOUR TEACHING.'}</Display>
        <div style={{ position: 'relative', alignSelf: 'center', marginTop: 20 }}>
          <BoxBoy pose="readingStanding" width={210} />
          <Bubble style={{ position: 'absolute', top: -6, right: -78 }}>Let's begin!</Bubble>
        </div>
        <span className="t-15 w-5">Your courses, classes and records in one place.</span>
      </div>
      <BottomActions tone="green">
        <Button variant="dark" onClick={() => go('L02')}>Create a lecturer account</Button>
        {google && <Button variant="white" onClick={() => go('L02')}><img src="/boxboy/google.png" alt="" width={18} height={18} /> Continue with Google</Button>}
        <button className="t-13 w-6" onClick={() => go('LOGIN')}>Already have an account? Log in</button>
      </BottomActions>
    </Screen>
  );
}

function LecStep({ title, body, children, next, cta = 'Next' }: { title: string; body: string; children: ReactNode; next: string; cta?: string }) {
  const go = useGo();
  return (
    <Screen actions>
      <div className="pad" style={{ paddingTop: 16 }}><Wordmark /></div>
      <div className="stack pad" style={{ gap: 16, paddingTop: 18 }}>
        <Display size={34}>{title}</Display>
        <span className="t-15 muted" style={{ marginTop: -6 }}>{body}</span>
        {children}
      </div>
      <BottomActions><Button onClick={() => go(next)}>{cta} <ArrowRight size={16} /></Button></BottomActions>
    </Screen>
  );
}

export const L02SignUp = () => (
  <LecStep title="WHAT SHOULD WE CALL YOU?" body="Your title and name show on your courses and announcements." next="L03" cta="Continue">
    <div className="row" style={{ gap: 10 }}><div style={{ width: 100 }}><Field label="Title" value="Dr." select /></div><div className="grow"><Field label="Full name" value="Olusegun Adeyemi" /></div></div>
    <Field label="Phone number" value="0803 123 4567" type="tel" hint="We'll text you a code to confirm it's you." />
  </LecStep>
);

export const L03Department = () => (
  <LecStep title="YOUR DEPARTMENT" body="The department you belong to. Next, you can add courses from any department and any level." next="L04">
    <Field label="Faculty" value="Engineering" select />
    <Field label="Your department" value="Mechanical Engineering" select />
  </LecStep>
);

const LEC_PICKS = [['MEE 202', 'Engineering Drawing II · Mechanical', '200L'], ['MEE 301', 'Engineering Maths III · ECE, MEE, CHE', '300L'], ['ECE 311', 'Measurement & Instrumentation · ECE', '300L'], ['MEE 352', 'Energy Conservation', '300L'], ['MEE 452', 'Renewable Energy Systems', '400L'], ['MEE 412', 'Heat Transfer', '400L']];
export function L04Courses() {
  const [sem, setSem] = useState<'First semester' | 'Second semester'>('First semester');
  const [picked, setPicked] = useState(LEC_PICKS.map((_, i) => i < 5));
  return (
    <LecStep title="WHAT ARE YOU TEACHING?" body="Search for every course you teach this semester, from any department or level." next="L05" cta={`Done · ${picked.filter(Boolean).length} courses`}>
      <Segmented options={['First semester', 'Second semester'] as const} value={sem} onChange={setSem} />
      <input className="input" placeholder="Search a course code or title" />
      <Label>Your picks · any department, any level</Label>
      <ListCard>
        {LEC_PICKS.map(([c, t, l], i) => <ListRow key={c} leading={<Checkbox checked={picked[i]} />} title={c} sub={t} right={<Pill>{l}</Pill>} onClick={() => setPicked(picked.map((p, k) => (k === i ? !p : p)))} />)}
      </ListCard>
    </LecStep>
  );
}

export function L05Profile() {
  const go = useGo();
  return (
    <LecStep title="LET STUDENTS KNOW YOU" body="With hundreds of students, a photo and a short bio help them recognise you and know how to reach you. All optional." next="L06" cta="Save and continue">
      <div className="row" style={{ gap: 14 }}>
        <Avatar persona="curious" size={64} />
        <span className="stack" style={{ gap: 2 }}><button className="row t-14 w-7" style={{ gap: 6 }}><Camera size={16} />Add a profile photo</button><span className="t-12 faint">Or keep your Box Boy</span></span>
      </div>
      <div className="stack" style={{ gap: 6 }}><span className="field-label">Short bio</span><textarea className="input" style={{ height: 84, padding: 14, resize: 'none' }} defaultValue="I teach energy systems with real plant data. Office hours Tue, 2 to 4 PM, MEE block, room 7." /></div>
      <Field label="Email students can use" placeholder="e.g. o.adeyemi@gmail.com" value="" />
      <Field label="Handles (LinkedIn, X, website)" placeholder="e.g. linkedin.com/in/oadeyemi" value="" />
      <button className="t-14 w-6 muted" onClick={() => go('L06')}>Do it later</button>
    </LecStep>
  );
}

export function L06AllSet() {
  const go = useGo();
  return (
    <Screen bg="var(--u-green)" actions>
      <div className="stack pad" style={{ gap: 14, paddingTop: 70 }}>
        <BoxBoy pose="keyHandover" width={220} />
        <Display size={44}>{'YOUR COURSES\nARE SET.'}</Display>
        <span className="t-15">5 courses, 3 levels, 1,969 students, one place. Send a file once and every class taking that course gets it. Announcements work the same way.</span>
      </div>
      <BottomActions tone="green"><Button variant="dark" onClick={() => go('L07')}>Go to Home <ArrowRight size={16} /></Button></BottomActions>
    </Screen>
  );
}

/* ---------- Home L07–L08 ---------- */
const LEC_COURSES: { level: string; items: { dept: string; num: string; title: string; sub: string; waiting?: boolean }[] }[] = [
  { level: '200 LEVEL', items: [{ dept: 'MEE', num: '202', title: 'Engineering Drawing II', sub: '455 students · Week 2 live' }] },
  { level: '300 LEVEL', items: [
    { dept: 'MEE', num: '301', title: 'Engineering Maths III', sub: '610 students · ECE, MEE and CHE' },
    { dept: 'MEE', num: '352', title: 'Energy Conservation', sub: '400 students · Week 2 to review' },
    { dept: 'ECE', num: '311', title: 'Measurement & Instrumentation', sub: 'Waiting for HOC', waiting: true },
  ] },
  { level: '400 LEVEL', items: [{ dept: 'MEE', num: '452', title: 'Renewable Energy Systems', sub: '214 students · Week 1 to review' }] },
];

function LecturerHome({ now }: { now?: boolean }) {
  const go = useGo();
  return (
    <Screen tabs>
      <div className="stack" style={{ background: 'var(--u-green)', padding: '14px 16px 22px', gap: 6 }}>
        <Wordmark />
        <Display size={30} style={{ marginTop: 10 }}>DR. O. ADEYEMI</Display>
        <span className="t-13 w-6">Mechanical Engineering · LASU</span>
      </div>
      <div className="stack pad" style={{ gap: 12, paddingTop: 16, paddingBottom: 24 }}>
        <Card tone="dark" pad={18} gap={8}>
          <div className="row between">
            <span className="eyebrow" style={{ color: 'var(--u-green)', fontSize: 11 }}>{now ? 'Now · 10:00 AM' : 'Today · 10:00 AM · in 1 hr 30 min'}</span>
            <Pill tone={now ? 'good' : 'amber'}>{now ? 'Confirmed' : 'Not confirmed'}</Pill>
          </div>
          <span className="t-17 w-7">MEE 352 · Energy Conservation</span>
          <span className="t-13" style={{ color: '#aaa' }}>ETF Hall · 400 students</span>
          {now ? <>
            <Button variant="green" onClick={() => go('L16')}><ScanLine size={16} /> Open attendance scan</Button>
            <span className="t-12" style={{ color: '#888' }}>Your HOCs get told when you open it</span>
          </> : <>
            <Button variant="green" onClick={() => go('L08')}><Check size={16} /> Confirm class</Button>
            <button className="t-13 w-6" style={{ color: '#aaa' }} onClick={() => go('L18')}>Running late or cancelling?</button>
          </>}
        </Card>
        <ListCard>
          <ListRow leading={<Clock size={18} />} title="2:00 PM · MEE 452" sub="Room 7, MEE block" right={<Pill tone="good">Confirmed</Pill>} />
          <ListRow leading={<FileText size={18} />} title="1 week of notes to check" sub="MEE 301 · Week 2 · by Fri 31 Oct" right={<Button small block={false} onClick={() => go('L13')}>Check</Button>} />
          <ListRow leading={<Camera size={18} />} title="Help students recognise you" sub="Add a photo, a short bio and how to reach you" right={<Button small variant="outline" block={false} onClick={() => go('L05')}>Add</Button>} />
        </ListCard>
        <div className="row between"><Label>Your courses</Label><span className="t-12 faint">3 levels</span></div>
        {LEC_COURSES.map((g) => (
          <div key={g.level} className="stack" style={{ gap: 8 }}>
            <span className="eyebrow faint" style={{ fontSize: 10 }}>{g.level}</span>
            {g.items.map((c) => (
              <button key={c.num} onClick={() => go(c.waiting ? 'S76' : 'L10')} className="row card" style={{ gap: 14, padding: 14, textAlign: 'left', border: c.waiting ? '1.5px dashed var(--u-amber)' : undefined }}>
                <span className="stack center" style={{ width: 52, height: 52, borderRadius: 14, background: c.waiting ? 'var(--u-card-2)' : '#0a0a0a', color: c.waiting ? '#999' : 'var(--u-green)', justifyContent: 'center' }}>
                  <span className="t-12 w-7" style={{ fontSize: 10 }}>{c.dept}</span><span className="display" style={{ fontSize: 18 }}>{c.num}</span>
                </span>
                <span className="grow stack"><span className="t-15 w-7">{c.title}</span><span className="t-12" style={{ color: c.waiting ? 'var(--u-warn-ink)' : '#777' }}>{c.sub}</span></span>
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
        ))}
      </div>
      <TabBar role="lecturer" active="home" />
    </Screen>
  );
}
export const L07HomeBeforeClass = () => <LecturerHome />;
export const L08HomeClassTime = () => <LecturerHome now />;

/* L09 · Timetable: class timetables (set by HOCs) vs my own */
export function L09Timetable() {
  const [view, setView] = useState<'Class timetables' | 'My own'>('Class timetables');
  const [day, setDay] = useState(2);
  const rows = [
    ['10:00 AM', '12:00 PM', 'MEE 352 · Energy Conservation', 'ETF Hall · 400 students', true],
    ['12:00 PM', '2:00 PM', 'MEE 301 · Engineering Maths III', 'LT 2 · 610 students · set by HOC', false],
    ['2:00 PM', '3:00 PM', 'MEE 452 · Renewable Energy', 'Room 7 · 214 students', true],
  ] as const;
  return (
    <Screen tabs>
      <div className="stack pad" style={{ gap: 6, paddingTop: 16 }}>
        <Display size={32}>MY TIMETABLE</Display>
        <span className="t-13 w-5 muted">Week 2 · 27 Oct to 31 Oct</span>
        <Segmented options={['Class timetables', 'My own'] as const} value={view} onChange={setView} />
      </div>
      <div className="row pad" style={{ gap: 6, paddingTop: 12 }}>
        {[['Mon', 27], ['Tue', 28], ['Wed', 29], ['Thu', 30], ['Fri', 31]].map(([d, n], i) => (
          <button key={d} onClick={() => setDay(i)} className="stack center" style={{ flex: 1, padding: '7px 0', borderRadius: 14, background: i === day ? '#0a0a0a' : '#fff', color: i === day ? '#fff' : '#555', border: i === day ? 0 : '1px solid var(--u-border)' }}><span className="t-12 w-6">{d}</span><span className="t-15 w-7">{n}</span></button>
        ))}
      </div>
      <div className="stack pad" style={{ gap: 10, paddingTop: 12, paddingBottom: 24 }}>
        {rows.map(([s, e, t, sub, ok]) => (
          <Card key={t} pad={14} style={{ flexDirection: 'row', gap: 14, border: ok ? undefined : '1.5px dashed var(--u-amber)' }}>
            <span className="stack" style={{ width: 66 }}><span className="t-13 w-7">{s}</span><span className="t-12 faint">{e}</span></span>
            <span className="grow stack" style={{ gap: 3 }}><span className="t-15 w-7">{t}</span><span className="t-12 faint">{sub}</span><Pill tone={ok ? 'good' : 'amber'} style={{ alignSelf: 'flex-start' }}>{ok ? 'Confirmed' : 'Not confirmed'}</Pill></span>
          </Card>
        ))}
        <span className="t-12 faint">Class timetables are set by each class's HOC. Your own timetable is just for you: add it in Me.</span>
      </div>
      <TabBar role="lecturer" active="timetable" />
    </Screen>
  );
}

/* ---------- Course L10–L12 ---------- */
function CourseTop({ tab }: { tab: 'Weeks' | 'Report' | 'Attendance' }) {
  const go = useGo();
  const [dept, setDept] = useState(tab === 'Report' ? 'ECE' : 'All departments');
  return (
    <>
      <TopBar title="MEE 301" />
      <div className="stack pad" style={{ gap: 10 }}>
        <Display size={30}>ENGINEERING MATHS III</Display>
        <span className="t-12 faint" style={{ marginTop: -6 }}>300 LEVEL · MEE 301 · with Engr. T. Balogun</span>
        <div className="row hide-scrollbar" style={{ gap: 8, overflowX: 'auto' }}>
          {[['All departments', 610], ['ECE', 290], ['MEE', 248], ['CHE', 72]].map(([d, n]) => (
            <button key={d} onClick={() => setDept(String(d))} className={`chip chip--sm${d === dept ? ' chip--on' : ''}`} style={{ whiteSpace: 'nowrap' }}>{d} · {n}</button>
          ))}
        </div>
        <Segmented options={['Weeks', 'Report', 'Attendance'] as const} value={tab} onChange={(t) => go(t === 'Weeks' ? 'L10' : t === 'Report' ? 'L11' : 'L12')} />
      </div>
    </>
  );
}

export function L10CourseWeeks() {
  const go = useGo();
  const weeks: [string, string, string, 'done' | 'check' | 'coming' | 'send'][] = [
    ['01', 'Week 1 · Matrices and determinants', 'Notes reviewed · 2 classes · 88% came', 'done'],
    ['02', 'Week 2 · Eigenvalues', 'Notes ready for you to check', 'check'],
    ['03', 'Week 3 · Vector calculus', 'Materials received · notes by Fri 7 Nov', 'coming'],
    ['04', 'Week 4 · Line integrals', 'Waiting for your materials', 'send'],
  ];
  return (
    <Screen>
      <CourseTop tab="Weeks" />
      <div className="stack pad" style={{ gap: 10, paddingTop: 14, paddingBottom: 24 }}>
        {weeks.map(([n, t, s, st]) => (
          <Card key={n} pad={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <span className="display" style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: 16, background: st === 'done' ? 'var(--u-green)' : st === 'check' ? '#0a0a0a' : 'var(--u-card-2)', color: st === 'check' ? 'var(--u-green)' : st === 'done' ? '#0a0a0a' : '#999' }}>{n}</span>
            <span className="grow stack"><span className="t-15 w-7">{t}</span><span className="t-12 faint">{s}</span></span>
            {st === 'check' && <Button small block={false} onClick={() => go('L13')}>Check</Button>}
            {st === 'send' && <Button small variant="outline" block={false} onClick={() => go('L14')}>Send</Button>}
          </Card>
        ))}
        <Card tone="dark" pad={16} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <span className="grow stack"><span className="t-15 w-7">Tell this class something</span><span className="t-12" style={{ color: '#aaa' }}>All departments, or pick ECE, MEE or CHE</span></span>
          <Button small variant="green" block={false} onClick={() => go('L15')}>Post</Button>
        </Card>
      </div>
    </Screen>
  );
}

/* L11 · Report. Counts only: names show only on the attendance list. */
export function L11CourseReport() {
  return (
    <Screen>
      <CourseTop tab="Report" />
      <div className="stack pad" style={{ gap: 12, paddingTop: 14, paddingBottom: 24 }}>
        <Label>Week 2 · 300 level ECE only</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[['262', 'on Unify of 290'], ['214', 'opened Week 2 notes'], ['150', 'finished practice'], ['6.1', 'quiz average / 10']].map(([n, l]) => <Card key={l} pad={14} gap={2}><span className="display" style={{ fontSize: 30 }}>{n}</span><span className="t-12 muted">{l}</span></Card>)}
        </div>
        <Card pad={16} gap={10}>
          <span className="t-14 w-7">Opened Week 2 notes, by department</span>
          {[['ECE', 0.74], ['Mechanical', 0.81], ['Chemical', 0.66]].map(([d, v]) => (
            <div key={d} className="stack" style={{ gap: 4 }}><div className="row between t-13"><span className="w-6">{d}</span><span className="w-7">{Math.round(Number(v) * 100)}%</span></div><ProgressBar value={Number(v)} color="#0a0a0a" /></div>
          ))}
        </Card>
        <Label>Most missed by ECE</Label>
        <ListCard>
          <ListRow title="Q3 · Eigenvalues of a 3×3 matrix" right={<Pill tone="bad">58% wrong</Pill>} />
          <ListRow title="Q7 · Diagonalising a matrix" right={<Pill tone="warn">49% wrong</Pill>} />
        </ListCard>
        <Button variant="outline"><Plus size={16} /> Add practice questions</Button>
        <span className="t-12 faint center">Counts only. Names show only on the attendance list.</span>
      </div>
    </Screen>
  );
}

const ROSTER = [['Kunle Adebayo', '300L ECE', '220801117', 1], ['Zainab Yusuf', '300L CHE', '220806042', 2], ['Amaka Bello', '300L MEE', '220803398', 3]] as const;
export function L12CourseAttendance() {
  const [sort, setSort] = useState('Lowest first');
  return (
    <Screen>
      <CourseTop tab="Attendance" />
      <div className="stack pad" style={{ gap: 12, paddingTop: 14, paddingBottom: 24 }}>
        <Card tone="dark" pad={18} gap={10}>
          <div className="row" style={{ gap: 12 }}><span className="display" style={{ fontSize: 44, color: 'var(--u-green)' }}>84%</span><span className="t-13" style={{ color: '#aaa' }}>average · 4 classes held so far · Mon & Wed</span></div>
          <div className="row" style={{ gap: 4 }}>
            {Array.from({ length: 12 }, (_, i) => <span key={i} className="t-12 w-7" style={{ flex: 1, height: 26, borderRadius: 6, display: 'grid', placeItems: 'center', fontSize: 10, background: i < 4 ? 'var(--u-green)' : '#222', color: i < 4 ? '#0a0a0a' : '#666' }}>{i + 1}</span>)}
          </div>
        </Card>
        <Chips>{['Lowest first', 'Below 75% · 38', 'A–Z'].map((s) => <Chip key={s} small on={s === sort} onClick={() => setSort(s)}>{s}</Chip>)}</Chips>
        <ListCard>
          {ROSTER.map(([n, c, m, came]) => {
            const pct = Math.round((came / 4) * 100);
            return <ListRow key={m} title={n} sub={`${c} · ${m} · Came to ${came} of 4 classes held`} right={<span className="display" style={{ fontSize: 18, color: pct < 75 ? 'var(--u-red)' : undefined }}>{pct}%</span>} />;
          })}
        </ListCard>
        <Button variant="outline"><FileText size={16} /> Save the list (PDF or Excel)</Button>
      </div>
    </Screen>
  );
}

/* L13 · Review a week written by a contributor */
export function L13ReviewWeek() {
  const go = useGo();
  const [tab, setTab] = useState<'1. Definition' | '2. Finding them' | 'Quiz'>('2. Finding them');
  return (
    <Screen actions>
      <TopBar title="Review" />
      <div className="stack pad" style={{ gap: 12 }}>
        <Display size={30}>{'WEEK 2\nEIGENVALUES'}</Display>
        <span className="t-12 faint">MEE 301 · written by Tobi A. · check by Fri 31 Oct</span>
        <Segmented options={['1. Definition', '2. Finding them', 'Quiz'] as const} value={tab} onChange={setTab} />
        <Card pad={18} gap={10}>
          <span className="t-17 w-7">Finding eigenvalues</span>
          <span className="t-14 muted">Solve det(A − λI) = 0. Each root λ is an eigenvalue of A.</span>
          <div className="stack" style={{ gap: 6, padding: 14, background: 'var(--u-card-2)', borderLeft: '3px solid #4ade80', borderRadius: 8 }}>
            <span className="eyebrow" style={{ fontSize: 10, color: 'var(--u-good-2)' }}>Characteristic equation</span>
            <span className="math center" style={{ fontSize: 24 }}>det(A − λI) = 0</span>
          </div>
          <span className="t-14 muted">Example: for A = [[2, 1], [1, 2]], λ² − 4λ + 3 = 0, so λ = 1 or λ = 3.</span>
          {/* Lecturer comment pinned to the block */}
          <div className="row" style={{ gap: 10, padding: 12, borderRadius: 12, background: 'var(--u-warn-tint)' }}>
            <MessageCircle size={16} color="var(--u-warn-ink)" style={{ flexShrink: 0 }} /><span className="t-13 w-6" style={{ color: 'var(--u-warn-ink)' }}>Add a 3×3 example. Most of the exam questions are 3×3.</span>
          </div>
        </Card>
      </div>
      <BottomActions>
        <div className="row" style={{ gap: 10 }}>
          <Button variant="white" onClick={() => go('L10')}>Needs changes</Button>
          <Button variant="green" onClick={() => go('L10')}><Check size={16} /> Mark as reviewed</Button>
        </div>
      </BottomActions>
    </Screen>
  );
}

/* L14 · Send materials once */
export function L14SendMaterials() {
  const go = useGo();
  const [share, setShare] = useState(true);
  return (
    <Screen actions>
      <TopBar />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={36}>SEND IT ONCE</Display>
        <span className="t-14 muted" style={{ marginTop: -8 }}>Every class taking the course gets it</span>
        <div className="row" style={{ gap: 10 }}><div className="grow"><Field label="Course" value="MEE 301" select /></div><div className="grow"><Field label="Week" value="Week 4" select /></div></div>
        <div className="row" style={{ gap: 10 }}>
          <Button variant="outline"><Camera size={16} /> Take a photo</Button>
          <Button variant="outline"><Upload size={16} /> Choose a file</Button>
        </div>
        <ListCard><ListRow leading={<FileText size={18} />} title="Line integrals slides.pdf" sub="2.1 MB · ready" right={<Pill tone="good">Added</Pill>} /></ListCard>
        <span className="t-14">Unify turns it into notes for all 610 students on MEE 301 (300L ECE, MEE, CHE).</span>
        <ListCard><ListRow title="Also share the file with students" sub="They get your PDF next to the Unify notes" right={<Toggle on={share} onChange={setShare} />} /></ListCard>
      </div>
      <BottomActions hint="Notes are published within 7 days. You can still give materials to your HOC instead."><Button onClick={() => go('L10')}><Send size={16} /> Send to Unify</Button></BottomActions>
    </Screen>
  );
}

/* L15 · Post to students: one-way announcement, targeted by department */
export function L15PostToStudents() {
  const go = useGo();
  const [who, setWho] = useState(0);
  const [kind, setKind] = useState('Test');
  const groups = [['All departments taking MEE 301', 610], ['300L ECE students', 290], ['300L MEE students', 248], ['300L CHE students', 72]] as const;
  return (
    <Screen tabs actions>
      <div className="stack pad" style={{ gap: 14, paddingTop: 16 }}>
        <Display size={32}>POST TO STUDENTS</Display>
        <Label>1 · Which course?</Label>
        <Card pad={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <span className="stack center" style={{ width: 48, height: 48, borderRadius: 12, background: '#0a0a0a', color: 'var(--u-green)', justifyContent: 'center' }}><span style={{ fontSize: 9, fontWeight: 700 }}>MEE</span><span className="display" style={{ fontSize: 16 }}>301</span></span>
          <span className="grow stack"><span className="t-15 w-7">Engineering Maths III</span><span className="t-12 faint">300 LEVEL · ECE, MEE, CHE</span></span>
          <button className="t-13 w-7" style={{ color: 'var(--u-good-2)' }}>Change</button>
        </Card>
        <Label>2 · Which students?</Label>
        <ListCard>
          {groups.map(([g, n], i) => <ListRow key={g} title={g} sub={`${n} students`} onClick={() => setWho(i)} right={<span style={{ width: 20, height: 20, borderRadius: 10, border: i === who ? '6px solid #0a0a0a' : '1.5px solid var(--u-border)' }} />} />)}
        </ListCard>
        <Label>3 · What is it?</Label>
        <Chips>{['Test', 'Assignment', 'Exam', 'Notice'].map((k) => <Chip key={k} on={k === kind} onClick={() => setKind(k)}>{k}</Chip>)}</Chips>
        <textarea className="input" style={{ height: 90, padding: 14, resize: 'none' }} defaultValue="Test on Weeks 1 to 3, Thursday 6 Nov, 10 AM, ETF Hall. Bring a calculator." />
        <span className="t-12 faint">Announcement only, like a locked WhatsApp group. Students who register later still see it.</span>
      </div>
      <BottomActions><Button onClick={() => go('L10')}>Post to {groups[who][1]} students <ArrowRight size={16} /></Button></BottomActions>
      <TabBar role="lecturer" active="class" />
    </Screen>
  );
}

/* L16 · Attendance list after a scan, with spot check */
const SCANNED = [
  ['Kemi Ade', 'Flagged · not on MEE 352', '400L CVE · 210704419', 'bad'],
  ['Joshua Olotuche', 'Present · 11:54 · by Tobi A.', '300L ECE · 220801234', 'good'],
  ['Amaka Bello', 'Present · 11:55 · by Femi O.', '300L MEE · 220803398', 'good'],
  ['Ibrahim Musa', 'Typed in by Femi O. · phone dead', '300L MEE · 220803871', 'warn'],
] as const;
export function L16AttendanceList() {
  const [f, setF] = useState('All 625');
  return (
    <Screen>
      <TopBar />
      <div className="stack pad" style={{ gap: 12, paddingBottom: 24 }}>
        <Display size={30}>MEE 352 ATTENDANCE</Display>
        <span className="t-12 faint" style={{ marginTop: -6 }}>Tue 27 Oct · ETF Hall · scan closed 11:58 AM</span>
        <div className="row" style={{ gap: 8 }}>
          {[['612', 'present of 750'], ['9', 'typed in'], ['4', 'flagged']].map(([n, l]) => <Card key={l} pad={12} gap={2} style={{ flex: 1 }}><span className="display" style={{ fontSize: 24 }}>{n}</span><span className="t-12 muted">{l}</span></Card>)}
        </div>
        <Card tone="dark" pad={16} gap={8}>
          <span className="eyebrow" style={{ color: 'var(--u-green)', fontSize: 11 }}>Spot check</span>
          <span className="t-14">Call out 10 random names. Anyone not in the room comes off the list.</span>
          <Button variant="green">Start spot check</Button>
        </Card>
        <Chips>{['All 625', 'Typed in 9', 'Flagged 4'].map((x) => <Chip key={x} small on={x === f} onClick={() => setF(x)}>{x}</Chip>)}</Chips>
        <ListCard>
          {SCANNED.map(([n, s, m, tone]) => <ListRow key={m} title={n} sub={`${s} · ${m}`} right={<span style={{ width: 10, height: 10, borderRadius: 5, background: tone === 'good' ? 'var(--u-good-2)' : tone === 'warn' ? 'var(--u-amber)' : 'var(--u-red)' }} />} />)}
        </ListCard>
      </div>
    </Screen>
  );
}

/* L17 · Me */
export function L17Me() {
  const go = useGo();
  return (
    <Screen tabs>
      <div className="stack" style={{ background: 'var(--u-green)', padding: '24px 20px 22px', gap: 10 }}>
        <Avatar persona="curious" size={72} ring />
        <Display size={30}>DR. O. ADEYEMI</Display>
        <span className="t-14 w-5" style={{ marginTop: -4 }}>Mechanical Engineering · LASU</span>
        <button onClick={() => go('L05')} className="t-13 w-7" style={{ alignSelf: 'flex-start', background: '#0a0a0a', color: '#fff', borderRadius: 18, padding: '8px 14px' }}>Edit profile</button>
      </div>
      <div className="stack pad" style={{ gap: 12, paddingTop: 16, paddingBottom: 24 }}>
        <ListCard>
          <ListRow leading={<BookOpen size={18} />} title="My courses" sub="5 courses · 200L to 400L" right={<ChevronRight size={18} />} onClick={() => go('L07')} />
          <ListRow leading={<Users size={18} />} title="Waiting for HOC" sub="ECE 311 · not confirmed yet" right={<Pill tone="amber">1</Pill>} onClick={() => go('S76')} />
          <ListRow leading={<CalendarDays size={18} />} title="My own timetable" sub="Only you see it · office hours, other duties" right={<ChevronRight size={18} />} />
        </ListCard>
        <ListCard>
          <ListRow title="Sign-in" sub="o.adeyemi@gmail.com · Google" />
          <ListRow leading={<Bell size={18} />} title="Notifications" sub="7 AM class reminder, new notes to check" right={<ChevronRight size={18} />} />
          <ListRow leading={<BookOpen size={18} />} title="Lecturer guides" sub="Sending materials, checking notes, attendance" right={<ChevronRight size={18} />} />
          <ListRow leading={<MessageCircle size={18} />} title="Talk to Unify" sub="We reply within a day" right={<ChevronRight size={18} />} />
        </ListCard>
        <button className="row t-15 w-7" style={{ gap: 8, color: 'var(--u-red)', padding: '6px 4px' }}><LogOut size={18} />Log out</button>
        <button className="t-14 w-6" style={{ color: 'var(--u-red)', padding: '0 4px', alignSelf: 'flex-start' }}>Delete my account</button>
      </div>
      <TabBar role="lecturer" active="me" />
    </Screen>
  );
}

/* ---------- Online class L18–L20 ----------
   Big classes: one link per room, 100 students per room, split by surname/matric/evenly. */
const ROOMS = [['Room 1', 'A to E', 'meet.google.com/xqp-rtvn-kad'], ['Room 2', 'F to L', 'meet.google.com/bwe-ffgh-pmo'], ['Room 3', 'M to R', 'meet.google.com/kty-uuzp-wqa'], ['Room 4', 'S to Z', 'meet.google.com/pnr-hhcv-yte']];
export function L18GoOnline() {
  const go = useGo();
  const [where, setWhere] = useState('Google Meet');
  const [split, setSplit] = useState<'Surname' | 'Matric no.' | 'Evenly'>('Surname');
  return (
    <Screen actions>
      <TopBar title="MEE 352" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={36}>GO ONLINE</Display>
        <span className="t-13 muted" style={{ marginTop: -8 }}>MEE 352 · Wed 5 Nov · 10 AM to 12 PM · 400 students</span>
        <Label>Where?</Label>
        <Chips>{['Google Meet', 'Zoom', 'Telegram', 'WhatsApp', 'Other link'].map((w) => <Chip key={w} small on={w === where} onClick={() => setWhere(w)}>{w}</Chip>)}</Chips>
        <Label>Rooms · 400 students · 100 per room</Label>
        <ListCard>
          {ROOMS.map(([r, range, link]) => <ListRow key={r} leading={<Video size={18} />} title={`${r} · ${range}`} sub={link} />)}
          <ListRow leading={<Plus size={18} />} title="Add another link" titleStyle={{ color: 'var(--u-good-2)' }} />
        </ListCard>
        <div className="stack" style={{ gap: 6 }}><span className="field-label">Split by</span><Segmented options={['Surname', 'Matric no.', 'Evenly'] as const} value={split} onChange={setSplit} /></div>
        <Label>Attendance</Label>
        <ListCard><ListRow title="Check-ins" sub="Join + 2 random “Still here?” checks. 2 of 3 = present." right={<Toggle on />} /></ListCard>
      </div>
      <BottomActions hint="400 students and your HOCs get told. It shows as online on their timetable."><Button onClick={() => go('L19')}>Tell students</Button></BottomActions>
    </Screen>
  );
}

export function L19ClassLive() {
  const go = useGo();
  return (
    <Screen actions>
      <TopBar title="MEE 352 · Online" />
      <div className="stack pad" style={{ gap: 12 }}>
        <Card tone="dark" pad={18} gap={8}>
          <span className="row t-12 w-7" style={{ gap: 6, color: 'var(--u-red)' }}><span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--u-red)' }} />LIVE · 00:41:20</span>
          <span className="t-17 w-7">MEE 352 · Energy Conservation</span>
          <span className="t-13" style={{ color: '#aaa' }}>Google Meet · 4 rooms · 400 students</span>
          <span className="t-12" style={{ color: '#888' }}>Room 1 · 84   Room 2 · 79   Room 3 · 77   Room 4 · 72</span>
          <Button variant="green"><Video size={16} /> Open Room 1 (yours)</Button>
        </Card>
        <div className="row" style={{ gap: 8 }}>
          {[['312', 'joined via Unify'], ['286', 'answered #2'], ['9', 'lost connection']].map(([n, l]) => <Card key={l} pad={12} gap={2} style={{ flex: 1 }}><span className="display" style={{ fontSize: 24 }}>{n}</span><span className="t-12 muted">{l}</span></Card>)}
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Button variant="outline" small><Bell size={14} /> Send a check-in now</Button>
          <Button variant="outline" small><Coffee size={14} /> Start a 10-minute break</Button>
        </div>
        <span className="t-12 faint">Next check-in goes out at a random time before 11:50 AM.</span>
        <Label>Lost connection · 9</Label>
        <ListCard>
          <ListRow title="Tunde Adebayo" sub="Network dropped · 10:44 AM" />
          <ListRow title="Ada Okafor" sub="Light went off · 10:51 AM" />
          <ListRow title="See all 9" titleStyle={{ color: 'var(--u-good-2)' }} right={<ChevronRight size={18} />} />
        </ListCard>
      </div>
      <BottomActions><Button variant="danger" onClick={() => go('L20')}>End class</Button></BottomActions>
    </Screen>
  );
}

export function L20OnlineAttendance() {
  const go = useGo();
  const [count, setCount] = useState(true);
  const rows = [['Present', '2 or 3 check-ins', 298, 'good'], ['Partly there', '1 check-in', 41, 'warn'], ['Lost connection', 'Reported a drop', 9, 'amber'], ["Didn't join", 'No check-ins', 52, 'bad']] as const;
  return (
    <Screen actions>
      <TopBar title="MEE 352 · Online" />
      <div className="stack pad" style={{ gap: 12 }}>
        <Display size={34}>ATTENDANCE</Display>
        <span className="t-12 faint" style={{ marginTop: -6 }}>Wed 5 Nov · online · 4 Google Meet rooms · 400 students</span>
        <ListCard>
          {rows.map(([t, s, n, tone]) => <ListRow key={t} title={t} sub={s} right={<span className="row" style={{ gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: 5, background: tone === 'good' ? 'var(--u-good-2)' : tone === 'bad' ? 'var(--u-red)' : 'var(--u-amber)' }} /><span className="display" style={{ fontSize: 20 }}>{n}</span></span>} />)}
        </ListCard>
        <ListCard>
          <ListRow title="Count reported drops as present" sub="9 students told you they lost connection" right={<Toggle on={count} onChange={setCount} />} />
          <ListRow title="Check against Meet (optional)" sub="Upload each room's participant list and we match names" right={<Button small variant="outline" block={false}>Upload</Button>} />
        </ListCard>
      </div>
      <BottomActions>
        <Button onClick={() => go('L08')}>Save register</Button>
        <Button variant="white" onClick={() => go('L14')}>Add recording to Week 4</Button>
      </BottomActions>
    </Screen>
  );
}
