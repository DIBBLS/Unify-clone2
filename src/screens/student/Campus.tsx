import { useState, type ReactNode } from 'react';
import { Bell, BookOpen, ClipboardList, Camera, ChevronRight, Clock, Eye, LogOut, Megaphone, CalendarDays, Users, WifiOff, Check, Download, ScanLine } from 'lucide-react';
import { Screen, TopBar, TabBar, BottomActions } from '../../components/chrome';
import { Button, Card, Display, Label, ListCard, ListRow, Pill, Segmented, Toggle, Field, Chip, Chips } from '../../components/ui';
import { BoxBoy, Avatar } from '../../components/brand';
import { useGo } from '../../components/nav';
import { week, student } from '../../data/sample';

/* ===================== Timetable (S37–S40) =====================
   One neutral style for every class. Colour is only used for STATUS
   (cancelled = red, not confirmed = amber dashed, moved = black). */

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16];
const ROW = 56;
const fmtHour = (h: number) => `${h > 12 ? h - 12 : h} ${h >= 12 ? 'PM' : 'AM'}`;

function TimetableHeader({ sub, view, setView }: { sub: string; view?: 'Week' | 'Day'; setView?: (v: 'Week' | 'Day') => void }) {
  return (
    <div className="stack pad" style={{ gap: 4, paddingTop: 16 }}>
      <div className="row between">
        <Display size={32}>Timetable</Display>
        {view && setView && <div style={{ width: 130 }}><Segmented options={['Week', 'Day'] as const} value={view} onChange={setView} /></div>}
      </div>
      <span className="t-13 w-5 muted">{sub}</span>
    </div>
  );
}

function slotStyle(s: (typeof week.slots)[number]) {
  if (s.status === 'cancelled') return { background: 'var(--u-bad-tint)', border: '1px solid var(--u-red)', color: 'var(--u-red)', textDecoration: 'line-through' as const };
  if (s.status === 'unconfirmed') return { background: '#fff', border: '1.5px dashed var(--u-amber)', color: '#0a0a0a' };
  if (s.status === 'moved') return { background: '#0a0a0a', border: 0, color: '#fff' };
  return { background: '#fff', border: '1px solid var(--u-border)', color: '#0a0a0a' };
}

function WeekGrid() {
  const go = useGo();
  return (
    <div className="pad" style={{ paddingTop: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(5,1fr)', gap: 4 }}>
        <span />
        {week.days.map((d) => (
          <span key={d.date} className="stack center" style={{ padding: '6px 0', borderRadius: 12, background: d.today ? '#0a0a0a' : 'transparent', color: d.today ? '#fff' : '#555' }}>
            <span className="t-12 w-6">{d.short}</span><span className="t-15 w-7">{d.date}</span>
          </span>
        ))}
      </div>
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '40px repeat(5,1fr)', gap: 4, marginTop: 6 }}>
        <div>{HOURS.map((h) => <div key={h} className="t-12 faint" style={{ height: ROW, fontSize: 10 }}>{fmtHour(h)}</div>)}</div>
        {week.days.map((d, di) => (
          <div key={d.date} style={{ position: 'relative', height: ROW * HOURS.length, borderLeft: '1px solid var(--u-hairline, #eee)' }}>
            {week.slots.filter((s) => s.day === di).map((s, i) => (
              <button key={i} onClick={() => go(s.status === 'cancelled' ? 'S41' : 'S38')} className="stack" style={{ position: 'absolute', left: 2, right: 2, top: (s.start - 8) * ROW + 2, height: (s.end - s.start) * ROW - 4, borderRadius: 10, padding: 5, gap: 1, textAlign: 'left', overflow: 'hidden', ...slotStyle(s) }}>
                <span style={{ fontSize: 10, fontWeight: 800 }}>{s.code}</span>
                <span style={{ fontSize: 9, opacity: 0.75 }}>{s.note ?? s.room}</span>
                {s.level && <span style={{ fontSize: 8, fontWeight: 800, color: 'var(--u-warn-ink)' }}>{s.level}</span>}
              </button>
            ))}
            {d.today && <span style={{ position: 'absolute', left: -3, right: 0, top: (week.now - 8) * ROW, height: 2, background: 'var(--u-red)' }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChangesCard() {
  return (
    <div className="pad" style={{ paddingTop: 16, paddingBottom: 24 }}>
      <Card pad={16} gap={10}>
        <div className="row between"><Label>Changes this week</Label><span className="t-12 faint">by {week.setBy}</span></div>
        {week.changes.map((c, i) => (
          <div key={i} className="row" style={{ gap: 10 }}>
            <span className="t-12 w-7 faint" style={{ width: 32 }}>{c.day}</span>
            <span className="t-14 w-5" style={{ color: c.tone === 'bad' ? 'var(--u-red)' : c.tone === 'muted' ? '#777' : undefined }}>{c.text}</span>
          </div>
        ))}
        <span className="t-12 faint">Everything else follows the faculty timetable.</span>
      </Card>
    </div>
  );
}

const DAY_CLASSES: { h: string; ap: string; code: string; title: string; where: string; status: 'confirmed' | 'cancelled' | 'unconfirmed'; by: string; priority?: boolean }[] = [
  { h: '8', ap: 'AM', code: 'ECE 305', title: 'Semiconductor Devices', where: 'LT 1 · Engr. T. Balogun', status: 'confirmed', by: 'by HOC' },
  { h: '10', ap: 'AM', code: 'ECE 303', title: 'Electrical Circuit Theory', where: 'LT 2 · Engr. Balogun', status: 'cancelled', by: 'by Engr. Balogun' },
  { h: '12', ap: 'PM', code: 'MEE 352', title: 'Energy Conservation', where: 'ETF Hall · Dr. O. Adeyemi', status: 'unconfirmed', by: 'Waiting on HOC' },
  { h: '3', ap: 'PM', code: 'MEE 203', title: 'Engineering Graphics II', where: 'Drawing Studio · Engr. Lawal', status: 'confirmed', by: 'by HOC', priority: true },
];

function DayStrip({ active = 2 }: { active?: number }) {
  const days = [...week.days, { short: 'Sat', date: 25 }];
  return (
    <div className="row pad" style={{ gap: 6, paddingTop: 12 }}>
      {days.map((d, i) => (
        <span key={d.date} className="stack center" style={{ flex: 1, padding: '7px 0', borderRadius: 14, background: i === active ? '#0a0a0a' : '#fff', color: i === active ? '#fff' : '#555', border: i === active ? 0 : '1px solid var(--u-border)' }}>
          <span className="t-12 w-6">{d.short}</span><span className="t-15 w-7">{d.date}</span>
        </span>
      ))}
    </div>
  );
}

function DayList() {
  const go = useGo();
  return (
    <div className="stack pad" style={{ gap: 10, paddingTop: 10, paddingBottom: 24 }}>
      <Label>Wednesday 22 Oct · 4 classes</Label>
      {DAY_CLASSES.map((c) => (
        <div key={c.code + c.h} className="stack" style={{ gap: 6 }}>
          {c.priority && <span className="row t-12 w-6" style={{ gap: 6, color: 'var(--u-warn-ink)' }}><Pill tone="amber">PRIORITY</Pill>MEE 203 is a 200L course on your list</span>}
          <button onClick={() => go(c.status === 'cancelled' ? 'S41' : 'S23')} className="row card" style={{ gap: 14, padding: 14, textAlign: 'left', border: c.status === 'unconfirmed' ? '1.5px dashed var(--u-amber)' : undefined }}>
            <span className="stack center" style={{ width: 40 }}><span className="display" style={{ fontSize: 22 }}>{c.h}</span><span className="t-12 w-6 faint">{c.ap}</span></span>
            <span className="grow stack" style={{ gap: 2 }}>
              <span className="t-15 w-7" style={{ textDecoration: c.status === 'cancelled' ? 'line-through' : undefined }}>{c.code}</span>
              <span className="t-13 muted">{c.title}</span>
              <span className="t-12 faint">{c.where}</span>
            </span>
            <span className="stack" style={{ alignItems: 'flex-end', gap: 4 }}>
              <Pill tone={c.status === 'confirmed' ? 'good' : c.status === 'cancelled' ? 'bad' : 'amber'}>{c.status === 'confirmed' ? 'Confirmed' : c.status === 'cancelled' ? 'Cancelled' : 'Not confirmed'}</Pill>
              <span className="t-12 faint" style={{ fontSize: 10 }}>{c.by}</span>
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}

function Timetable({ initial, checkIn }: { initial: 'Week' | 'Day'; checkIn?: boolean }) {
  const [view, setView] = useState<'Week' | 'Day'>(initial);
  const [answer, setAnswer] = useState<null | 'here' | 'no'>(null);
  return (
    <Screen tabs>
      <TimetableHeader sub={view === 'Week' ? `300L ECE · ${week.label}` : '300L ECE · Week 3'} view={view} setView={setView} />
      {view === 'Week' ? <><WeekGrid /><ChangesCard /></> : <>
        <DayStrip />
        <span className="t-12 faint pad" style={{ paddingTop: 8 }}>Set by Tolu A., your HOC · updated 8:12 AM</span>
        {checkIn && (
          /* Lecturer check-in: 3 classmates confirming tells the whole class. */
          <div className="pad" style={{ paddingTop: 12 }}>
            <Card tone="dark" pad={18} gap={10}>
              <span className="eyebrow" style={{ color: 'var(--u-green)', fontSize: 11 }}>Happening now · 8:00 AM</span>
              <span className="t-13" style={{ color: '#aaa' }}>ECE 305 · LT 1</span>
              <span className="t-20 w-7">Is Engr. Balogun in class?</span>
              <div className="row" style={{ gap: 8 }}>
                <Button variant="green" onClick={() => setAnswer('here')}>{answer === 'here' ? <><Check size={16} /> Thanks</> : 'Lecturer is here'}</Button>
                <Button variant="ghost-dark" onClick={() => setAnswer('no')}>Not yet</Button>
              </div>
              <span className="t-12" style={{ color: '#aaa' }}>{answer === 'here' ? 3 : 2} of 3 classmates confirmed. The class hears at 3.</span>
            </Card>
          </div>
        )}
        <DayList />
      </>}
      <TabBar active="timetable" />
    </Screen>
  );
}
export const S37TimetableWeek = () => <Timetable initial="Week" />;
export const S38TimetableDay = () => <Timetable initial="Day" />;
export const S39TimetableCheckIn = () => <Timetable initial="Day" checkIn />;

export function S40NoClasses() {
  return (
    <Screen tabs>
      <TimetableHeader sub="300L ECE · Week 3" />
      <DayStrip active={5} />
      <div className="stack center" style={{ gap: 10, paddingTop: 40, alignItems: 'center' }}>
        <BoxBoy pose="chairRelax" width={220} />
        <Display size={36}>{'NO CLASSES\nTODAY.'}</Display>
        <span className="t-15 muted center" style={{ maxWidth: 300 }}>Saturday is yours. Monday starts with ECE 305 at 8 AM.</span>
      </div>
      <TabBar active="timetable" />
    </Screen>
  );
}

/* S41 · Class detail (cancelled) */
export function S41ClassDetail() {
  const go = useGo();
  return (
    <Screen>
      <TopBar title="Class" />
      <div className="stack pad" style={{ gap: 14, paddingBottom: 24 }}>
        <div className="stack" style={{ gap: 4 }}>
          <Display size={34}>ECE 303</Display>
          <span className="t-15 w-6 muted">Electrical Circuit Theory</span>
        </div>
        <Card pad={16} gap={8}>
          {[[<Clock size={16} />, 'Wed 22 Oct · 10 AM to 12 PM'], [<CalendarDays size={16} />, 'LT 2, Faculty of Engineering'], [<Users size={16} />, 'Engr. T. Balogun']].map(([i, t], k) => <div key={k} className="row t-14 w-5" style={{ gap: 10 }}>{i}{t}</div>)}
        </Card>
        <Card pad={16} gap={6} style={{ background: 'var(--u-bad-tint)', border: '1px solid var(--u-red)' }}>
          <Pill tone="bad" style={{ alignSelf: 'flex-start' }}>Cancelled</Pill>
          <span className="t-14">Cancelled by Engr. Balogun at 7:40 AM. Your HOC confirmed it, and everyone in the class was notified.</span>
        </Card>
        <Label>History</Label>
        <ListCard>
          <ListRow title="Cancelled by Engr. Balogun" sub="7:40 AM today" />
          <ListRow title="Confirmed by Tolu A., HOC" sub="Mon 20 Oct" />
          <ListRow title="Added to the timetable by Tolu A." sub="Sun 19 Oct" />
        </ListCard>
        <Label>Notes for this class</Label>
        <ListCard><ListRow leading={<span className="display" style={{ fontSize: 18 }}>3</span>} title="Nodal analysis" sub="Week 3 · Class 2 · read it before the new date" right={<ChevronRight size={18} />} onClick={() => go('S26')} /></ListCard>
      </div>
    </Screen>
  );
}

/* ===================== Class tab (S42–S43) ===================== */
const POSTS = [
  { tag: 'Test', code: 'ECE 305', when: 'Today, 9:05 AM', title: 'Test moved to Thursday', body: 'Was Tuesday 28 Oct. Now Thursday 30 Oct, 10 AM, LT 1. Covers Weeks 1 to 3.' },
  { tag: 'Assignment', code: 'ECE 303', when: 'Yesterday', title: 'Assignment 2: Nodal analysis', body: 'Questions 1 to 6 on page 84. Submit in class, Friday 31 Oct.' },
  { tag: 'Assignment', code: 'MEE 203', when: 'Thu 23 Oct', title: 'Drawing plate 4 due Monday', body: 'Submit at the drawing studio by 12 PM, Monday 27 Oct.', priority: true },
  { tag: 'Exam', code: 'All courses', when: 'Wed 22 Oct', title: 'Exam timetable is out', body: 'First paper is MEE 301 on Monday 12 Jan. Tap to see the full timetable.' },
];
const FILTERS = ['All', 'Tests', 'Exams', 'Assignments', 'General'];

function ClassTab({ empty }: { empty?: boolean }) {
  const [f, setF] = useState('All');
  const shown = POSTS.filter((p) => f === 'All' || f.startsWith(p.tag));
  return (
    <Screen tabs>
      <div className="stack pad" style={{ gap: 4, paddingTop: 16 }}>
        <Display size={32}>Class</Display>
        <span className="t-13 w-5 muted">300L ECE · posted by your HOC</span>
      </div>
      <div className="row hide-scrollbar pad" style={{ gap: 8, paddingTop: 12, overflowX: 'auto' }}>
        {FILTERS.map((x) => <Chip key={x} on={x === f} small onClick={() => setF(x)}>{x}</Chip>)}
      </div>
      {empty ? (
        <div className="stack" style={{ alignItems: 'center', gap: 10, paddingTop: 60 }}>
          <BoxBoy pose="peeking" width={180} />
          <Display size={36}>NOTHING NEW.</Display>
          <span className="t-15 muted center" style={{ maxWidth: 300 }}>Your HOC hasn't posted this week. Moved tests, exams and cancelled classes show up here first.</span>
        </div>
      ) : (
        <div className="stack pad" style={{ gap: 10, paddingTop: 14, paddingBottom: 24 }}>
          <Label>What changed · this week</Label>
          {shown.map((p) => (
            <div key={p.title} className="stack" style={{ gap: 6 }}>
              {p.priority && <span className="row t-12 w-6" style={{ gap: 6, color: 'var(--u-warn-ink)' }}><Pill tone="amber">PRIORITY</Pill>MEE 203 (200L) updates reach you here too</span>}
              <Card pad={16} gap={6}>
                <div className="row" style={{ gap: 8 }}><Pill tone={p.tag === 'Exam' ? 'dark' : p.tag === 'Test' ? 'bad' : 'grey'}>{p.tag}</Pill><span className="t-13 w-7">{p.code}</span><span className="grow" /><span className="t-12 faint">{p.when}</span></div>
                <span className="t-16 w-7">{p.title}</span>
                <span className="t-14 muted">{p.body}</span>
                <span className="t-12 faint">From your HOC</span>
              </Card>
            </div>
          ))}
        </div>
      )}
      <TabBar active="class" />
    </Screen>
  );
}
export const S42ClassFeed = () => <ClassTab />;
export const S43ClassEmpty = () => <ClassTab empty />;

/* S44 · Guide (sample steps; each department checks its own) */
export function S44Guide() {
  const steps = [
    ['Pay your school fees', "Keep the receipt. The portal won't open course registration without it.", 'Online · LASU portal'],
    ['Pick your courses on the portal', "Add every carryover first, then this semester's courses.", 'Online · LASU portal'],
    ['Print the course form', 'Two copies. One is yours to keep.', 'Anywhere with a printer'],
    ['Get it signed', 'Your level adviser signs first, then the Head of Department.', 'ECE office, first floor'],
    ['Submit it', 'Hand one copy to the faculty officer and ask for the stamp.', 'Faculty office'],
  ];
  return (
    <Screen>
      <TopBar title="Guide" />
      <div className="stack pad" style={{ gap: 14, paddingBottom: 28 }}>
        <Display size={32}>How to register your courses</Display>
        <span className="row t-12 w-6" style={{ gap: 6, color: 'var(--u-good)' }}><Check size={14} />Checked with ECE department · 24 Oct</span>
        <Card pad={14} style={{ background: 'var(--u-warn-tint)', border: 0 }}><span className="t-14 w-6" style={{ color: 'var(--u-warn-ink)' }}>Registration closes Friday 7 November. Late registration costs extra.</span></Card>
        {steps.map(([t, s, where], i) => (
          <div key={t} className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
            <span className="display" style={{ width: 36, height: 36, borderRadius: 18, background: '#0a0a0a', color: 'var(--u-green)', display: 'grid', placeItems: 'center', fontSize: 15, flexShrink: 0 }}>{i + 1}</span>
            <span className="stack" style={{ gap: 3 }}><span className="t-16 w-7">{t}</span><span className="t-14 muted">{s}</span><span className="t-12 w-6 faint">{where}</span></span>
          </div>
        ))}
        <button className="t-14 w-7" style={{ color: 'var(--u-good-2)' }}>Something different in your department? Tell us</button>
      </div>
    </Screen>
  );
}

/* ===================== Me (S45–S53) ===================== */
function MeHeader() {
  const go = useGo();
  return (
    <div className="stack" style={{ background: 'var(--u-green)', padding: '24px 20px 22px', gap: 12 }}>
      <Avatar persona={student.persona} size={72} ring />
      <Display size={30}>JOSHUA OLOTUCHE</Display>
      <span className="t-14 w-5" style={{ marginTop: -6 }}>{student.department} · {student.level} · LASU</span>
      <button onClick={() => go('S47')} className="t-13 w-7" style={{ alignSelf: 'flex-start', background: '#0a0a0a', color: '#fff', borderRadius: 18, padding: '8px 14px' }}>Edit profile</button>
    </div>
  );
}
function Streaks() {
  return (
    <div className="row" style={{ gap: 10 }}>
      {[['Current streak', '5 days'], ['Best streak', '12 days']].map(([l, v]) => (
        <Card key={l} pad={14} gap={4} style={{ flex: 1 }}><Label style={{ fontSize: 10 }}>{l}</Label><span className="display" style={{ fontSize: 24 }}>{v}</span></Card>
      ))}
    </div>
  );
}
function MeList() {
  const go = useGo();
  return (
    <>
      <ListCard>
        <ListRow leading={<Bell size={18} />} title="Notifications" sub="New notes, reminders and fixed reports" right={<Pill tone="bad">3 new</Pill>} onClick={() => go('S21')} />
        <ListRow leading={<BookOpen size={18} />} title="Guides" sub="Registering courses, result review and more" right={<ChevronRight size={18} />} onClick={() => go('S44')} />
        <ListRow leading={<Download size={18} />} title="Saved for offline · 2 courses" right={<ChevronRight size={18} />} onClick={() => go('S48')} />
        <ListRow leading={<Clock size={18} />} title="Class reminders" right={<ChevronRight size={18} />} onClick={() => go('S49')} />
      </ListCard>
      <button className="row t-15 w-7" style={{ gap: 8, color: 'var(--u-red)', padding: '6px 4px' }}><LogOut size={18} />Log out</button>
    </>
  );
}

export function S45Me() {
  return (
    <Screen tabs>
      <MeHeader />
      <div className="stack pad" style={{ gap: 14, paddingTop: 16, paddingBottom: 24 }}><Streaks /><MeList /></div>
      <TabBar active="me" />
    </Screen>
  );
}

/* S46 · Me for an HOC: extra tools block */
export function S46MeClassRep() {
  const go = useGo();
  return (
    <Screen tabs>
      <MeHeader />
      <div className="stack pad" style={{ gap: 14, paddingTop: 16, paddingBottom: 24 }}>
        <Streaks />
        <Card tone="dark" pad={0} gap={0}>
          <div className="stack" style={{ padding: '16px 16px 8px', gap: 2 }}>
            <span className="eyebrow" style={{ color: 'var(--u-green)', fontSize: 11 }}>HOC · 300L ECE</span>
            <span className="t-17 w-7">Your HOC tools</span>
          </div>
          {([[<ClipboardList size={18} />, 'Class list', '312 students · 4 waiting in your inbox', 'AT04'], [<ScanLine size={18} />, 'Scan attendance', 'Opens when your lecturer starts a scan', 'S60'], [<Megaphone size={18} />, 'Post to class', 'Tests, exams, assignments, general', 'S54'], [<CalendarDays size={18} />, 'Edit timetable', '2 classes not confirmed', 'S55'], [<Users size={18} />, 'Contributors', '1 is behind', 'S56']] as [ReactNode, string, string, string][]).map(([i, t, s, to]) => (
            <button key={t} onClick={() => go(to)} className="row" style={{ gap: 12, padding: '12px 16px', color: '#fff', textAlign: 'left', borderTop: '1px solid #222' }}>
              <span style={{ color: 'var(--u-green)' }}>{i}</span>
              <span className="grow stack"><span className="t-15 w-6">{t}</span><span className="t-12" style={{ color: '#999' }}>{s}</span></span>
              <ChevronRight size={18} color="#666" />
            </button>
          ))}
        </Card>
        <MeList />
      </div>
      <TabBar active="me" />
    </Screen>
  );
}

/* S47 · Edit profile with unsaved changes */
export function S47EditProfile() {
  const go = useGo();
  const [level, setLevel] = useState('300L');
  const [aim, setAim] = useState('First class in ECE 305 and every weekly quiz done before Friday.');
  return (
    <Screen actions>
      <TopBar title="Edit profile" />
      <div className="stack pad" style={{ gap: 16 }}>
        <div className="row" style={{ gap: 14 }}>
          <span style={{ width: 72, height: 72, borderRadius: 36, background: 'var(--u-green)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 22 }}>JO</span>
          <button className="row t-14 w-7" style={{ gap: 6 }}><Camera size={16} />Change photo</button>
        </div>
        <Field label="First name" value="Joshua" />
        <div className="stack" style={{ gap: 6 }}>
          <span className="field-label">What are you aiming for this semester?</span>
          <textarea className="input" value={aim} maxLength={150} onChange={(e) => setAim(e.target.value)} style={{ height: 90, padding: 14, resize: 'none' }} />
          <span className="t-12 faint" style={{ alignSelf: 'flex-end' }}>{aim.length} / 150</span>
        </div>
        <Field label="Department" value="Electrical and Computer Engineering" select />
        <div className="stack" style={{ gap: 8 }}>
          <span className="field-label">Level</span>
          <Chips>{['100L', '200L', '300L', '400L', '500L'].map((l) => <Chip key={l} on={l === level} onClick={() => setLevel(l)}>{l}</Chip>)}</Chips>
          <span className="t-12 faint">Changing your department or level changes your courses.</span>
        </div>
        <ListCard><ListRow title="Courses this semester" right={<span className="row t-13 muted" style={{ gap: 4 }}>5 courses<ChevronRight size={16} /></span>} onClick={() => go('S08')} /></ListCard>
      </div>
      <BottomActions><Button onClick={() => go('S45')}>Save changes</Button></BottomActions>
    </Screen>
  );
}

/* S48 · Settings */
export function S48Settings() {
  const go = useGo();
  const [hide, setHide] = useState(false);
  const [wifi, setWifi] = useState(true);
  return (
    <Screen>
      <TopBar title="Settings" />
      <div className="stack pad" style={{ gap: 12, paddingBottom: 28 }}>
        <Label>Notifications</Label>
        <ListCard><ListRow leading={<Bell size={18} />} title="Notifications" sub="Morning brief 7:00 AM · revision at your study time" right={<ChevronRight size={18} />} onClick={() => go('S49')} /></ListCard>
        <Label>Privacy</Label>
        <ListCard><ListRow leading={<Eye size={18} />} title="Hide my CGPA on Home" sub="Tap the eye to show it when you want" right={<Toggle on={hide} onChange={setHide} />} /></ListCard>
        <Label>Offline</Label>
        <ListCard>
          <ListRow title="ECE 305" sub="Weeks 1 to 3 · 24 MB" right={<button className="t-13 w-7" style={{ color: 'var(--u-red)' }}>Remove</button>} />
          <ListRow title="MEE 352" sub="Weeks 1 to 2 · 18 MB" right={<button className="t-13 w-7" style={{ color: 'var(--u-red)' }}>Remove</button>} />
          <ListRow title="Save on Wi-Fi only" right={<Toggle on={wifi} onChange={setWifi} />} />
        </ListCard>
        <Label>Account</Label>
        <ListCard>
          <ListRow title="Email" sub="joshua.olotuche@gmail.com · you log in with this" />
          <ListRow title="Student email" sub="joshua.olotuche220801234@st.lasu.edu.ng · name claimed for attendance" />
          <ListRow title="Change password" right={<ChevronRight size={18} />} />
          <ListRow title="Log out" titleStyle={{ color: 'var(--u-red)' }} />
          <ListRow title="Delete my account" sub="Removes your profile, progress and claims for good" titleStyle={{ color: 'var(--u-red)' }} />
        </ListCard>
        <Label>About HOCs</Label>
        <ListCard>
          <ListRow title="How HOCs are chosen" sub="One per class, checked by Unify" right={<ChevronRight size={18} />} />
          <ListRow title="Are you your class's HOC?" sub="Request HOC tools" right={<ChevronRight size={18} />} onClick={() => go('S50')} />
        </ListCard>
      </div>
    </Screen>
  );
}

/* S49 · Notification settings. Hard cap: 3 a day; class changes always come through. */
export function S49NotificationSettings() {
  const [on, setOn] = useState({ revision: true, changes: true, lecturer: true, notes: true, streak: true });
  const t = (k: keyof typeof on) => (v: boolean) => setOn({ ...on, [k]: v });
  return (
    <Screen>
      <TopBar title="Notifications" />
      <div className="stack pad" style={{ gap: 12, paddingBottom: 28 }}>
        <Label>When</Label>
        <ListCard>
          <ListRow title="Morning brief" right={<span className="t-14 w-6">7:00 AM</span>} />
          <ListRow title="My study time" sub="Learned from your week" right={<span className="t-14 w-6">Evenings</span>} />
          <ListRow title="Quiet hours" right={<span className="t-14 w-6">11 PM to 6 AM</span>} />
        </ListCard>
        <Label>What</Label>
        <ListCard>
          <ListRow title="Today's revision" sub="At your study time" right={<Toggle on={on.revision} onChange={t('revision')} />} />
          <ListRow title="Class changes" sub="Cancelled or moved classes and tests" right={<Toggle on={on.changes} onChange={t('changes')} />} />
          <ListRow title="Lecturer is here" sub="When 3 classmates confirm" right={<Toggle on={on.lecturer} onChange={t('lecturer')} />} />
          <ListRow title="New notes" sub="When a week you're taking lands" right={<Toggle on={on.notes} onChange={t('notes')} />} />
          <ListRow title="Streak" sub="One reminder, never a guilt trip" right={<Toggle on={on.streak} onChange={t('streak')} />} />
        </ListCard>
        <span className="t-13 faint center">At most 3 a day. Class changes always come through.</span>
      </div>
    </Screen>
  );
}

/* S50 · Request HOC tools */
export function S50ClassRepRequest() {
  const go = useGo();
  return (
    <Screen actions>
      <TopBar title="HOC tools" />
      <div className="stack pad" style={{ gap: 16 }}>
        <Display size={32}>Are you your class's HOC?</Display>
        <span className="t-15 muted">HOCs set the timetable, post updates and send lecturer materials to Unify. There is one per class, and Unify checks every request.</span>
        <Field label="Your class" value="Electrical and Computer Eng. · 300L" />
        <Field label="Phone number" value="0813 000 0000" type="tel" />
        <Field label="Who can confirm you're the rep?" value="My level adviser" select />
        <span className="t-13 faint">If your class already has a rep on Unify, we'll let you know before anything changes.</span>
      </div>
      <BottomActions><Button onClick={() => go('S51')}>Send request</Button></BottomActions>
    </Screen>
  );
}

/* S51 · Waiting for Unify */
export function S51ClassRepWaiting() {
  const go = useGo();
  const steps = [['Request sent', 'Today, 1:20 AM', 'done'], ['Checking with your department', 'Usually within 2 days', 'now'], ['Tools switched on', "You'll get a notification", 'later']];
  return (
    <Screen actions>
      <div className="stack pad" style={{ gap: 14, paddingTop: 60 }}>
        <BoxBoy pose="thumbsUpPhone" width={180} />
        <Display size={44}>REQUEST SENT.</Display>
        <span className="t-15 muted">We'll check with your level adviser and reply within two days. The app works as normal until then.</span>
        <Card pad={16} gap={14}>
          {steps.map(([t, s, st]) => (
            <div key={t} className="row" style={{ gap: 12 }}>
              <span style={{ width: 26, height: 26, borderRadius: 13, display: 'grid', placeItems: 'center', background: st === 'done' ? 'var(--u-green)' : st === 'now' ? 'var(--u-amber)' : '#fff', border: st === 'later' ? '1px solid var(--u-border)' : 0 }}>{st === 'done' && <Check size={14} strokeWidth={3} />}</span>
              <span className="stack"><span className="t-15 w-6" style={{ color: st === 'later' ? '#999' : undefined }}>{t}</span><span className="t-12 faint">{s}</span></span>
            </div>
          ))}
        </Card>
      </div>
      <BottomActions><Button variant="white" onClick={() => go('S45')}>Back to Me</Button></BottomActions>
    </Screen>
  );
}

/* S52 · Offline */
export function S52Offline() {
  return (
    <Screen tabs>
      <div className="row between" style={{ background: '#0a0a0a', color: '#fff', padding: '10px 20px' }}>
        <span className="row t-13 w-6" style={{ gap: 8 }}><WifiOff size={16} />You're offline</span>
        <button className="t-13 w-7" style={{ color: 'var(--u-green)' }}>Retry</button>
      </div>
      <div className="stack pad" style={{ gap: 12, paddingTop: 24, paddingBottom: 24 }}>
        <BoxBoy pose="peeking" width={170} />
        <Display size={40}>YOU'RE OFFLINE.</Display>
        <span className="t-15 muted">No signal or no data. Courses you saved still work, and your progress saves on the phone.</span>
        <Label>Ready offline</Label>
        <ListCard>
          <ListRow title="ECE 305 · Semiconductor Devices" sub="Weeks 1 to 3 saved" right={<ChevronRight size={18} />} />
          <ListRow title="MEE 352 · Energy Conservation" sub="Weeks 1 to 2 saved" right={<ChevronRight size={18} />} />
        </ListCard>
        <span className="t-13 faint">Not saved yet: ECE 303, ECE 307, ECE 311. They'll open when you're back online.</span>
      </div>
      <TabBar active="home" />
    </Screen>
  );
}

/* S53 · Lecturer profile */
export function S53LecturerProfile() {
  const go = useGo();
  return (
    <Screen>
      <TopBar title="Lecturer" />
      <div className="stack pad" style={{ gap: 14, paddingBottom: 28 }}>
        <span style={{ width: 80, height: 80, borderRadius: 40, background: 'var(--u-green)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 26 }}>OA</span>
        <Display size={34}>{'DR. O.\nADEYEMI'}</Display>
        <span className="t-14 w-5 muted" style={{ marginTop: -6 }}>Senior Lecturer · Mechanical Engineering</span>
        <Label>About</Label>
        <span className="t-15">Teaches energy systems with real plant data. Research in renewable energy. Prefers questions in class or during office hours.</span>
        <Card pad={14} gap={2}><span className="t-15 w-7">Office hours</span><span className="t-13 muted">Tuesday 2 to 4 PM · MEE block, room 7</span></Card>
        <Label>Teaches you</Label>
        <ListCard><ListRow title="MEE 352" sub="Energy Conservation · Week 2 of 12" right={<ChevronRight size={18} />} onClick={() => go('S23')} /></ListCard>
        <Label>Also teaches</Label>
        <ListCard>
          <ListRow title="MEE 202" sub="Thermodynamics I · 200L" />
          <ListRow title="MEE 452" sub="Renewable Energy Systems · 400L" />
        </ListCard>
      </div>
    </Screen>
  );
}
