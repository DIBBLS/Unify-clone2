import { useEffect, useState, type ReactNode } from 'react';
import { ArrowRight, Bell, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, Flag, Lock, RefreshCw, Save, X, ListChecks, Timer, Target, ShieldOff } from 'lucide-react';
import { Screen, TopBar, BottomActions, Sheet } from '../../components/chrome';
import { Button, Card, Display, Label, ListCard, ProgressBar } from '../../components/ui';
import { FadedBoxBoy, BoxBoy, StreakPill } from '../../components/brand';
import { useGo } from '../../components/nav';

/* ===================== Course page (S23–S25) ===================== */

type WeekState = 'done' | 'progress' | 'locked' | 'unpublished';
const WEEKS: { n: number; title: string; state: WeekState; meta: string }[] = [
  { n: 1, title: 'Energy and power basics', state: 'done', meta: '3 of 3 classes · Quiz 8/10' },
  { n: 2, title: 'Wind energy and biogas', state: 'progress', meta: '1 of 3 classes done' },
  { n: 3, title: 'Gas turbines', state: 'locked', meta: 'Pass the Week 2 quiz to open this' },
  { n: 4, title: 'Steam power plants', state: 'unpublished', meta: 'Notes land by Fri 31 Oct' },
];
const OUTLINE = ['Energy and power basics', 'Wind energy and biogas', 'Gas turbines', 'Steam power plants', 'Heat exchangers', 'Insulation and heat loss', 'Energy audits', 'Energy storage'];

function CourseHeader({ tab, setTab }: { tab: string; setTab: (t: 'weeks' | 'outline' | 'practice') => void }) {
  return (
    <div className="stack pad" style={{ gap: 12, paddingTop: 4 }}>
      <Display size={34}>Energy conservation</Display>
      <span className="t-13 w-5 muted" style={{ marginTop: -6 }}>MEE 352 · 3 units · Second semester</span>
      <Card pad={16} gap={10}>
        <div className="row" style={{ gap: 12 }}>
          <span style={{ width: 52, height: 52, borderRadius: 26, background: 'var(--u-green)', display: 'grid', placeItems: 'center', fontWeight: 700 }}>OA</span>
          <div className="grow stack"><span className="t-16 w-7">Dr. O. Adeyemi</span><span className="t-13 muted">Mechanical Engineering</span></div>
          <ChevronRight size={18} />
        </div>
        <span className="t-13 muted">Teaches energy systems with real plant data. Office hours Tuesday 2 to 4 PM, MEE block, room 7.</span>
      </Card>
      <div className="row" style={{ gap: 10 }}>
        <button className="row t-12 w-7" style={{ gap: 6, background: '#0a0a0a', color: '#fff', borderRadius: 18, padding: '9px 12px' }}><Save size={15} />Save for offline</button>
        <span className="grow t-12 w-5 faint">Updated 24 Oct</span>
        <button className="row t-12 w-7 muted" style={{ gap: 4 }}><Flag size={14} />Report</button>
      </div>
      <div className="row" style={{ gap: 12 }}><span className="label">Week 2 of 12</span><div className="grow"><ProgressBar value={2 / 12} track="var(--u-border)" /></div></div>
      <div className="row" style={{ gap: 4, padding: 4, borderRadius: 18, background: 'var(--u-card-2)', border: '1px solid var(--u-border)' }}>
        {(['weeks', 'outline', 'practice'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className="t-13 w-7" style={{ flex: 1, padding: 8, borderRadius: 14, background: tab === t ? '#0a0a0a' : 'transparent', color: tab === t ? '#fff' : '#555', textTransform: 'capitalize' }}>{t}</button>
        ))}
      </div>
    </div>
  );
}

function WeekBadge({ n, state }: { n: number; state: WeekState }) {
  const s = { done: ['var(--u-green)', '#0a0a0a'], progress: ['#0a0a0a', 'var(--u-green)'], locked: ['var(--u-card-2)', '#999'], unpublished: ['var(--u-card-2)', '#999'] }[state];
  return <span className="display" style={{ width: 48, height: 48, borderRadius: 14, background: s[0], color: s[1], display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0 }}>{String(n).padStart(2, '0')}</span>;
}

function ClassRow({ n, title, meta, state, onClick }: { n: number; title: string; meta: string; state: 'done' | 'next' | 'unpublished'; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="row" style={{ gap: 12, padding: '12px 14px', background: 'var(--u-card-2)', borderRadius: 14, textAlign: 'left', width: '100%' }}>
      <span style={{ width: 32, height: 32, borderRadius: 16, display: 'grid', placeItems: 'center', background: state === 'done' ? 'var(--u-green)' : state === 'next' ? '#0a0a0a' : '#fff', border: state === 'unpublished' ? '1px dashed var(--u-border)' : 0, color: state === 'next' ? 'var(--u-green)' : '#999', fontWeight: 700, fontSize: 13 }}>
        {state === 'done' ? <Check size={16} strokeWidth={3} color="#0a0a0a" /> : n}
      </span>
      <span className="grow stack"><span className="t-15 w-6" style={{ color: state === 'unpublished' ? '#999' : undefined }}>{title}</span><span className="t-12 faint">{meta}</span></span>
      {state === 'done' && <ChevronRight size={18} />}
      {state === 'next' && <span style={{ width: 30, height: 30, borderRadius: 15, background: 'var(--u-amber)', display: 'grid', placeItems: 'center' }}><ArrowRight size={16} /></span>}
    </button>
  );
}

function CoursePage({ initial }: { initial: 'weeks' | 'outline' | 'practice' }) {
  const go = useGo();
  const [tab, setTab] = useState(initial);
  const [open, setOpen] = useState(2);
  return (
    <Screen>
      <TopBar title="MEE 352" />
      <CourseHeader tab={tab} setTab={setTab} />
      <div className="stack pad" style={{ gap: 10, paddingTop: 14, paddingBottom: 32 }}>
        {tab === 'weeks' && WEEKS.map((w) => {
          const expanded = open === w.n && w.state === 'progress';
          return (
            <div key={w.n} className="card" style={{ border: expanded ? '1.5px solid #0a0a0a' : undefined, borderRadius: 20, overflow: 'hidden' }}>
              <button className="row" onClick={() => setOpen(open === w.n ? 0 : w.n)} style={{ gap: 12, padding: 14, width: '100%', textAlign: 'left' }}>
                <WeekBadge n={w.n} state={w.state} />
                <span className="grow stack" style={{ gap: 1 }}>
                  <span className="t-16 w-7" style={{ color: w.state === 'locked' || w.state === 'unpublished' ? '#555' : undefined }}>Week {w.n}</span>
                  <span className="t-13 muted">{w.title}</span>
                  <span className="t-12 w-6" style={{ color: w.state === 'done' ? 'var(--u-good-2)' : w.state === 'locked' ? '#999' : '#555' }}>{w.meta}</span>
                </span>
                {w.state === 'done' && <ChevronDown size={20} />}
                {w.state === 'locked' && <Lock size={20} color="#999" />}
                {w.state === 'unpublished' && <span className="row t-12 w-7" style={{ gap: 4, background: '#0a0a0a', color: '#fff', borderRadius: 14, padding: '6px 10px', fontSize: 11 }}><Bell size={13} />Notify me</span>}
              </button>
              {expanded && (
                <div className="stack" style={{ gap: 8, padding: '0 14px 14px' }}>
                  <ClassRow n={1} title="Wind energy: power and forces" meta="Class 1 · Mon 20 Oct · Read" state="done" onClick={() => go('S26')} />
                  <ClassRow n={2} title="Family biogas digester" meta="Class 2 · Wed 22 Oct · 12 min read" state="next" onClick={() => go('S26')} />
                  <ClassRow n={3} title="Village biogas plant" meta="Class 3 · Notes land Fri 31 Oct" state="unpublished" />
                  <button onClick={() => go('S28')} className="row" style={{ gap: 12, padding: 14, borderRadius: 16, background: '#0a0a0a', textAlign: 'left' }}>
                    <span style={{ width: 32, height: 32, borderRadius: 16, background: 'var(--u-green)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 12 }}>10</span>
                    <span className="stack"><span className="t-15 w-6" style={{ color: '#fff' }}>Week 2 quiz</span><span className="t-12" style={{ color: '#999' }}>10 questions · 15 min · pass 6 to open Week 3</span></span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {tab === 'outline' && <>
          <Card tone="dark" pad={18} gap={6}>
            <span className="eyebrow" style={{ color: 'var(--u-green)', fontSize: 11 }}>Before you start</span>
            <span className="t-14 w-5">You'll lean on thermodynamics and basic fluid mechanics. Skim them in Week 1.</span>
          </Card>
          <Card pad={18} gap={4} style={{ borderRadius: 20 }}>
            <span className="t-16 w-7">Course outline</span>
            <span className="t-12 w-5 faint" style={{ marginBottom: 8 }}>From Dr. Adeyemi, shared by your HOC · 21 Oct</span>
            {OUTLINE.map((t, i) => (
              <div key={t} className="row" style={{ gap: 14, padding: '8px 0' }}>
                <span className="t-12 w-7" style={{ width: 52, color: i < 3 ? 'var(--u-good-2)' : '#999' }}>Week {i + 1}</span>
                <span className="t-14 w-5" style={{ color: i === 2 ? '#0a0a0a' : '#555' }}>{t}</span>
              </div>
            ))}
          </Card>
        </>}
        {tab === 'practice' && <>
          {/* Past questions stay locked until the Faculty approves them (copyright). */}
          <Card pad={16} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20 }}>
            <span style={{ width: 40, height: 40, borderRadius: 14, background: 'var(--u-card-2)', display: 'grid', placeItems: 'center' }}><Lock size={18} /></span>
            <span className="stack"><span className="t-15 w-7">Past questions</span><span className="t-13 muted">Coming once the Faculty approves them.</span></span>
          </Card>
          <Label style={{ marginTop: 6 }}>Practice questions · in the style of MEE 352 papers</Label>
          {[['Week 1 practice', '10 questions · 15 min', '8/10'], ['Week 2 practice', '10 questions · 15 min', '7/10'], ['Week 3 practice', '10 questions · 15 min', 'start'], ['Mid-semester mock', '30 questions · 45 min', 'Opens Week 6']].map(([t, s, r]) => (
            <Card key={t} pad={16} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20 }}>
              <span className="grow stack"><span className="t-15 w-7" style={{ color: r.startsWith('Opens') ? '#555' : undefined }}>{t}</span><span className="t-13 faint">{s}</span></span>
              {r === 'start' ? <Button small block={false} onClick={() => go('S28')}>Start</Button> : r.startsWith('Opens') ? <span className="t-12 w-6 faint">{r}</span> : <span className="pill pill--good">{r}</span>}
            </Card>
          ))}
        </>}
      </div>
    </Screen>
  );
}
export const S23CourseWeeks = () => <CoursePage initial="weeks" />;
export const S24CourseOutline = () => <CoursePage initial="outline" />;
export const S25CoursePractice = () => <CoursePage initial="practice" />;

/* ===================== Note blocks (S26) ===================== */

/** Lecturer review marker on notes. No text label on purpose: "Pending review" read as "not ready". */
export function ReviewMark({ reviewed }: { reviewed: boolean }) {
  return (
    <span title={reviewed ? 'Checked by the lecturer' : "The lecturer hasn't checked this yet"} style={{ width: 24, height: 24, borderRadius: 12, display: 'grid', placeItems: 'center', background: reviewed ? 'var(--u-good-tint)' : 'var(--u-warn-tint)' }}>
      {reviewed ? <Check size={14} color="#16a34a" strokeWidth={3} /> : <Clock size={14} color="#d97706" strokeWidth={2.5} />}
    </span>
  );
}

/** Stacked fraction for formula cards, e.g. <Frac n="P" d="RT" />. */
export function Frac({ n, d, size = 26, color = 'inherit' }: { n: ReactNode; d: ReactNode; size?: number; color?: string }) {
  return (
    <span className="math" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle', fontSize: size, lineHeight: 1.1, margin: '0 4px', color }}>
      <span style={{ padding: '0 3px' }}>{n}</span>
      <span style={{ alignSelf: 'stretch', height: 2, background: 'currentColor' }} />
      <span style={{ padding: '0 3px' }}>{d}</span>
    </span>
  );
}
const M = ({ children, size = 18, color }: { children: ReactNode; size?: number; color?: string }) => <span className="math" style={{ fontSize: size, color }}>{children}</span>;

function NoteHero() {
  return (
    <div className="stack" style={{ background: '#0a0a0a', borderRadius: 20, padding: 22, gap: 10 }}>
      <span className="eyebrow" style={{ color: '#4ade80', fontSize: 10 }}>MEE 352 · Week 2 of 8</span>
      <Display size={28} color="#f5f4f0">Wind energy & biogas calculations</Display>
      <span className="t-14 w-5" style={{ color: 'rgba(245,244,240,.6)' }}>Power in wind, digester design and community gas supply</span>
      <div className="t-13" style={{ background: 'rgba(74,222,128,.12)', border: '1px solid #4ade80', borderRadius: 12, padding: 14, color: '#f5f4f0' }}>
        By the end of this week you can calculate air density, find the five wind power quantities for a turbine, and size a family biogas digester from dung input to power output.
      </div>
    </div>
  );
}

function SectionNum({ n, title, intro }: { n: string; title: string; intro?: string }) {
  return (
    <div className="stack" style={{ gap: 6, marginTop: 8 }}>
      <span className="t-12 w-7" style={{ alignSelf: 'flex-start', fontSize: 10, color: 'var(--u-good-2)', background: 'rgba(74,222,128,.12)', border: '1px solid #4ade80', borderRadius: 20, padding: '3px 9px' }}>{n}</span>
      <span className="t-17 w-7">{title}</span>
      {intro && <span className="t-14 muted">{intro}</span>}
    </div>
  );
}

function Quantity({ num, title, eq, desc }: { num: string; title: string; eq: ReactNode; desc: string }) {
  return (
    <Card pad={16} gap={8} style={{ borderRadius: 18 }}>
      <div className="row" style={{ gap: 10 }}>
        <span style={{ width: 30, height: 30, borderRadius: 15, background: '#0a0a0a', color: '#4ade80', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700 }}>{num}</span>
        <span className="t-15 w-7">{title}</span>
      </div>
      <div className="row" style={{ justifyContent: 'center', minHeight: 68, background: 'var(--u-card-2)', borderLeft: '3px solid #4ade80', borderRadius: 8 }}>{eq}</div>
      <span className="t-13 muted">{desc}</span>
    </Card>
  );
}

function QuickCheck() {
  const [pick, setPick] = useState<string | null>(null);
  const right = '×8';
  return (
    <div className="stack" style={{ gap: 10, padding: 16, background: 'var(--u-card-2)', borderLeft: '3px solid #4ade80', borderRadius: 12 }}>
      <div className="row between"><span className="eyebrow" style={{ fontSize: 10, color: 'var(--u-good-2)' }}>Quick check</span><span className="faint w-5" style={{ fontSize: 11 }}>1 question</span></div>
      <span className="t-14 w-6">If wind speed doubles from 10 m/s to 20 m/s, total power density goes up by a factor of:</span>
      <div className="row" style={{ gap: 8 }}>
        {['×2', '×4', '×8', '×16'].map((o) => {
          const state = pick == null ? '' : o === right ? 'right' : o === pick ? 'wrong' : '';
          return <button key={o} onClick={() => setPick(o)} className="t-14 w-6" style={{ flex: 1, padding: 9, borderRadius: 10, background: state === 'right' ? 'var(--u-good-tint)' : state === 'wrong' ? 'var(--u-bad-tint)' : '#fff', border: `1px solid ${state === 'right' ? 'var(--u-good-2)' : state === 'wrong' ? 'var(--u-red)' : 'var(--u-border)'}`, color: '#555' }}>{o}</button>;
        })}
      </div>
      {pick && <span className="t-13" style={{ color: pick === right ? 'var(--u-good)' : 'var(--u-red)' }}>{pick === right ? 'Right. Power goes with V³, so 2³ = 8.' : 'Not quite. Power goes with V³, so doubling V gives 2³ = 8 times the power.'}</span>}
    </div>
  );
}

function WorkedExample() {
  const [shown, setShown] = useState<number[]>([]);
  const steps = [
    { title: 'Total power density P/A', hint: 'Try it first. Use ρ from Step 1 and V = 15 m/s in P/A = ½ρV³.', answer: <>P/A = ½ × 1.226 × 15³ = <b>2,069 W/m²</b></> },
    { title: 'Maximum power density (Betz)', hint: 'Try it first. Same ρ and V, now with 8/27 in place of ½.', answer: <>Pₘₐₓ/A = (8/27) × 1.226 × 15³ = <b>1,226 W/m²</b></> },
  ];
  const all = shown.length === steps.length;
  return (
    <div className="stack" style={{ background: '#0a0a0a', borderRadius: 20, padding: 20, gap: 14, color: '#f5f4f0' }}>
      <span className="eyebrow" style={{ color: '#4ade80', fontSize: 10 }}>Worked example 2.1</span>
      <Display size={19} color="#f5f4f0">Turbine: D = 120 m, V = 15 m/s, 40 rpm</Display>
      <div className="stack" style={{ background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: 12, gap: 4 }}>
        <span className="eyebrow" style={{ fontSize: 10, color: 'rgba(245,244,240,.5)' }}>Given</span>
        <span className="t-13 w-5" style={{ color: 'rgba(245,244,240,.85)' }}>1 atm and 15°C  ·  V = 15 m/s  ·  D = 120 m  ·  N = 40 rpm  ·  η = 35%</span>
      </div>
      <div className="stack" style={{ background: 'rgba(255,255,255,.04)', borderRadius: 14, padding: 14, gap: 8 }}>
        <span className="eyebrow" style={{ color: '#4ade80', fontSize: 10 }}>Step 1</span>
        <span className="t-13 w-6">Air density ρ</span>
        <div className="row" style={{ gap: 8, padding: 10, border: '1px solid #4ade80', borderRadius: 10, background: 'rgba(255,255,255,.06)' }}>
          <M size={17}>ρ =</M><Frac n="101,325" d="287 × 288" size={15} /><M size={17}>= 1.226 kg/m³</M>
        </div>
      </div>
      {steps.map((s, i) => (
        <div key={i} className="stack" style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.4)', borderRadius: 14, padding: 14, gap: 8 }}>
          <span className="eyebrow" style={{ color: '#4ade80', fontSize: 10 }}>Step {i + 2}</span>
          <span className="t-13 w-6">{s.title}</span>
          <span className="t-13" style={{ color: 'rgba(245,244,240,.75)' }}>{s.hint}</span>
          {shown.includes(i) ? (
            <div className="math" style={{ fontSize: 16, padding: 10, border: '1px solid #4ade80', borderRadius: 10 }}>{s.answer}</div>
          ) : (
            <>
              <span style={{ height: 22, borderRadius: 6, background: 'rgba(255,255,255,.08)' }} />
              <button onClick={() => setShown((x) => [...x, i])} className="t-12 w-7" style={{ alignSelf: 'flex-start', color: '#4ade80', border: '1px solid #4ade80', borderRadius: 16, padding: '7px 12px' }}>Reveal step {i + 2}</button>
            </>
          )}
        </div>
      ))}
      <div className="t-12 w-5" style={{ color: '#4ade80', background: 'rgba(74,222,128,.12)', border: '1px solid #4ade80', borderRadius: 12, padding: 10 }}>
        {all ? 'Summary: ρ = 1.226 kg/m³ · P/A = 2,069 W/m² · Betz limit 1,226 W/m².' : 'The summary appears once every step is revealed.'}
      </div>
    </div>
  );
}

function PulseCheck() {
  const [pick, setPick] = useState('A');
  return (
    <div className="stack" style={{ background: '#4ade80', borderRadius: 20, padding: 20, gap: 12 }}>
      <span className="display" style={{ fontSize: 22 }}>Pulse check 1</span>
      <span className="t-12 w-6" style={{ opacity: 0.7, marginTop: -8 }}>3 questions</span>
      <span className="t-13 w-5" style={{ opacity: 0.75 }}>Check yourself before Topic 2.</span>
      <div className="stack" style={{ background: 'rgba(255,255,255,.35)', borderRadius: 16, padding: 14, gap: 8 }}>
        <span className="t-14 w-7">1. Which quantity belongs to the wind alone, not the turbine?</span>
        {[['A', 'Total power density P/A'], ['B', 'Maximum power density'], ['C', 'Reasonably obtainable power'], ['D', 'Axial thrust']].map(([k, t]) => (
          <button key={k} onClick={() => setPick(k)} className="row" style={{ gap: 10, padding: 10, borderRadius: 12, background: '#fff', border: pick === k ? '1.5px solid #0a0a0a' : '1.5px solid transparent', textAlign: 'left' }}>
            <span style={{ width: 22, height: 22, borderRadius: 11, background: pick === k ? '#0a0a0a' : 'var(--u-card-2)', color: pick === k ? '#4ade80' : '#555', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700 }}>{k}</span>
            <span className="t-13 w-5">{t}</span>
          </button>
        ))}
      </div>
      <Button variant="dark" style={{ height: 42, fontSize: 14 }}>Check my answers</Button>
    </div>
  );
}

function ClassNote({ onReport }: { onReport?: () => void }) {
  const go = useGo();
  const [topic, setTopic] = useState(0);
  return (
    <Screen actions>
      <TopBar title="MEE 352 · Week 2" />
      <div style={{ height: 3, background: 'var(--u-border)' }}><div style={{ width: '28%', height: 3, background: '#4ade80' }} /></div>
      <div className="stack no-select" style={{ gap: 14, padding: '16px 20px 24px' }}>
        <NoteHero />
        <div className="row" style={{ gap: 10 }}>
          {/* Review marker, icon only: yellow clock = lecturer hasn't checked it yet; green check = checked. */}
          <ReviewMark reviewed={false} />
          <span className="t-12 w-5 faint">Updated 24 Oct · Saved offline</span>
        </div>
        <div className="row wrap" style={{ gap: 4, padding: 4, borderRadius: 14, background: 'var(--u-card-2)', border: '1px solid var(--u-border)' }}>
          {['Topic 1: Wind Energy', 'Topic 2: Family Biogas', 'Topic 3: Village Biogas', 'Quiz · 10 questions'].map((t, i) => (
            <button key={t} onClick={() => (i === 3 ? go('S28') : setTopic(i))} className="t-12 w-6" style={{ padding: '8px 12px', borderRadius: 10, background: topic === i ? '#0a0a0a' : 'transparent', color: topic === i ? '#f5f4f0' : '#999' }}>{t}</button>
          ))}
        </div>
        <span className="eyebrow" style={{ fontSize: 10, color: 'var(--u-good-2)' }}>Topic 1</span>
        <Display size={24} style={{ marginTop: -8 }}>Wind energy: power, forces & calculations</Display>
        <SectionNum n="1.1" title="Why air density matters first" />
        <Card pad={20} gap={12} style={{ borderRadius: 18 }}>
          <p className="t-15 muted">Wind power is directly proportional to air density. Denser air carries more mass per cubic metre, so more kinetic energy flows through the blades every second.</p>
          <p className="t-15">Air density isn't a constant you memorise. It depends on pressure and temperature at the site, so your lecturer always derives it from the ideal gas law.</p>
          <div className="row" style={{ gap: 12, padding: 14, background: 'var(--u-card-2)', borderLeft: '3px solid #4ade80', borderRadius: 8, alignItems: 'flex-start' }}>
            <M size={22} color="var(--u-good-2)"><b>ρ</b></M>
            <span className="stack" style={{ gap: 2 }}><span className="t-13 w-7">Air density (rho) · kg/m³</span><span className="t-13 muted">Mass of air per cubic metre. About 1.225 kg/m³ at sea level and 15°C. Cold air is denser, high-altitude air is thinner.</span></span>
          </div>
          <div className="stack" style={{ gap: 10, padding: 16, background: 'var(--u-card-2)', borderLeft: '3px solid #4ade80', borderRadius: 8 }}>
            <span className="eyebrow" style={{ fontSize: 10, color: 'var(--u-good-2)' }}>Air density from the ideal gas law</span>
            <div className="row" style={{ justifyContent: 'center' }}><M size={26}>ρ =</M><Frac n="P" d="RT" /></div>
            <div className="stack" style={{ gap: 6, borderTop: '1px solid var(--u-border)', paddingTop: 10 }}>
              {[['P', 'atmospheric pressure, Pa (1 atm = 101,325 Pa)'], ['R', 'gas constant for air, 287 J/kg·K'], ['T', 'absolute temperature, K = °C + 273']].map(([s, d]) => (
                <div key={s} className="row" style={{ gap: 10 }}><M size={16} color="var(--u-good-2)"><b>{s}</b></M><span className="t-13 muted">{d}</span></div>
              ))}
            </div>
          </div>
        </Card>
        <SectionNum n="1.2" title="The five wind power quantities" intro="Your lecturer's turbine question asks for these five, in this order." />
        <Quantity num="i" title="Total power density" eq={<><M>P/A =</M><Frac n="1" d="2" size={18} /><M>ρV³</M></>} desc="All the power in the wind, per m² of rotor. A property of the wind, not the turbine." />
        <Quantity num="ii" title="Maximum power density (Betz)" eq={<><M>Pₘₐₓ/A =</M><Frac n="8" d="27" size={18} /><M>ρV³</M></>} desc="The most any turbine can extract: 16/27, about 59.3%." />
        <Quantity num="iii" title="Reasonably obtainable" eq={<><M>P/A = η ·</M><Frac n="1" d="2" size={18} /><M>ρV³</M></>} desc="What a real turbine gets. Your lecturer uses η = 35%." />
        <Quantity num="iv" title="Total power" eq={<><M>P =</M><Frac n="P" d="A" size={18} /><M>·</M><Frac n="πD²" d="4" size={18} /></>} desc="Power density times the swept area of the rotor." />
        <Quantity num="v" title="Maximum axial thrust" eq={<><M>F =</M><Frac n="π" d="9" size={18} /><M>ρD²V²</M></>} desc="The push that tries to topple the tower. Size the foundation for it." />
        <QuickCheck />
        <WorkedExample />
        <PulseCheck />
        <button className="t-13 w-6 muted" onClick={onReport ?? (() => go('S27'))}>Report a problem</button>
      </div>
      <BottomActions><Button onClick={() => setTopic(1)}>Next: Family Biogas <ArrowRight size={18} /></Button></BottomActions>
    </Screen>
  );
}
export const S26ClassNote = () => <ClassNote />;

/* S27 · Report a problem. Goes straight to the course's contributor. */
export function S27ReportProblem() {
  const go = useGo();
  const [reason, setReason] = useState(1);
  return (
    <>
      <ClassNote onReport={() => undefined} />
      <Sheet>
        <span className="t-20 w-7" style={{ fontSize: 22 }}>What's wrong with this note?</span>
        <span className="t-13 w-5 faint">Topic 1: Wind Energy · MEE 352, Week 2</span>
        {['Something is missing', 'Something looks wrong', "A link or image doesn't work", "It doesn't match what the lecturer taught"].map((r, i) => (
          <button key={r} onClick={() => setReason(i)} className="row" style={{ gap: 12, padding: '14px 16px', borderRadius: 16, background: reason === i ? 'var(--u-card-2)' : '#fff', border: `1px solid ${reason === i ? '#0a0a0a' : 'var(--u-border)'}`, textAlign: 'left' }}>
            <span className="grow t-15" style={{ fontWeight: reason === i ? 700 : 500 }}>{r}</span>
            <span style={{ width: 22, height: 22, borderRadius: 11, background: reason === i ? '#0a0a0a' : '#fff', border: reason === i ? 0 : '1px solid var(--u-border)', display: 'grid', placeItems: 'center' }}>{reason === i && <Check size={13} color="#50ff90" strokeWidth={3} />}</span>
          </button>
        ))}
        <textarea className="input" style={{ height: 84, padding: 14, resize: 'none' }} defaultValue="The worked example uses 288 K, but our lecturer used 15 + 273 = 288 K and rounded ρ to 1.23." />
        <span className="t-12 w-5 faint">This goes to the contributor for MEE 352. We'll tell you when it's fixed.</span>
        <Button onClick={() => go('S26')}>Send report</Button>
      </Sheet>
    </>
  );
}

/* ===================== Quiz (S28–S32) ===================== */

/* S28 · Quiz start */
export function S28QuizStart() {
  const go = useGo();
  const rules: [ReactNode, string, string][] = [
    [<ListChecks size={18} />, '10 questions', 'Answer in any order. Answers show after you submit.'],
    [<Timer size={18} />, '15 minutes', 'One timer for the whole quiz. It starts when you tap Start, and the quiz submits itself at zero.'],
    [<Target size={18} />, 'Pass mark 6 of 10', 'Passing opens Week 3.'],
    [<ShieldOff size={18} />, 'No copying or screenshots', 'Both are turned off until you finish.'],
  ];
  return (
    <Screen actions>
      <TopBar title="Week 2 quiz" />
      <div className="stack pad" style={{ gap: 14, paddingTop: 8 }}>
        <Display size={44}>{'WEEK 2\nQUIZ'}</Display>
        <span className="t-14 w-5 muted" style={{ marginTop: -6 }}>Wind energy and biogas · MEE 352</span>
        <ListCard>
          {rules.map(([icon, t, s]) => (
            <div key={t} className="row" style={{ gap: 12, padding: 16, alignItems: 'flex-start' }}>
              <span style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--u-card-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{icon}</span>
              <span className="stack" style={{ gap: 2 }}><span className="t-15 w-7">{t}</span><span className="t-13 muted">{s}</span></span>
            </div>
          ))}
        </ListCard>
        <span className="t-12 w-5 faint">Time and questions set by Tolu A., your course contributor</span>
      </div>
      <BottomActions><Button onClick={() => go('S29')}>Start quiz</Button></BottomActions>
    </Screen>
  );
}

/** Quiz chrome: back, title, timer, question dots. Copying is disabled while a quiz is open. */
function QuizShell({ current, answered, time, children, bottom, keypad }: { current: number; answered: number; time: string; children: ReactNode; bottom: ReactNode; keypad?: boolean }) {
  const go = useGo();
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    document.addEventListener('copy', block); document.addEventListener('contextmenu', block);
    return () => { document.removeEventListener('copy', block); document.removeEventListener('contextmenu', block); };
  }, []);
  return (
    <Screen actions style={keypad ? { paddingBottom: 380 } : undefined}>
      <div className="row" style={{ gap: 12, padding: '8px 16px' }}>
        <button onClick={() => go('S28')} style={{ width: 40, height: 40, borderRadius: 20, background: '#fff', border: '1px solid var(--u-border)', display: 'grid', placeItems: 'center' }}><ChevronLeft size={20} /></button>
        <span className="grow t-17 w-7">Week 2 quiz</span>
        <span className="row t-14 w-7" style={{ gap: 5, background: '#0a0a0a', color: '#f5f4f0', padding: '7px 12px', borderRadius: 18 }}><Clock size={15} color="#50ff90" />{time}</span>
      </div>
      <div className="row hide-scrollbar" style={{ gap: 6, padding: '6px 16px', overflowX: 'auto' }}>
        {Array.from({ length: 10 }, (_, i) => {
          const n = i + 1; const done = n <= answered && n !== current; const cur = n === current;
          return <span key={n} style={{ minWidth: 32, height: 32, borderRadius: 16, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, background: cur ? 'var(--u-green)' : done ? '#0a0a0a' : '#fff', color: cur ? '#0a0a0a' : done ? 'var(--u-green)' : '#999', border: cur || done ? 0 : '1px solid var(--u-border)' }}>{n}</span>;
        })}
      </div>
      <div className="stack pad no-select" style={{ gap: 12, paddingTop: 12 }}>
        <span className="eyebrow faint" style={{ fontSize: 11 }}>Question {current} of 10 · {answered} answered</span>
        {children}
      </div>
      {bottom}
    </Screen>
  );
}
function QuizNav({ next }: { next: string }) {
  const go = useGo();
  return (
    <BottomActions>
      <div className="row" style={{ gap: 10 }}><Button variant="white">Back</Button><Button onClick={() => go(next)}>Next</Button></div>
    </BottomActions>
  );
}

/* S29 · Multiple choice, one per screen */
export function S29QuizMCQ() {
  const [pick, setPick] = useState('B');
  const opts = [['A', 'Spins the rotor blades'], ['B', 'Pushes the turbine in the direction of wind flow, trying to topple the tower'], ['C', 'Drives the generator to produce electricity'], ['D', 'Lifts the turbine off its foundation']];
  return (
    <QuizShell current={4} answered={3} time="12:48" bottom={<QuizNav next="S30" />}>
      <span className="t-20 w-7" style={{ fontSize: 22, lineHeight: 1.3 }}>Axial thrust on a wind turbine is the force that:</span>
      {opts.map(([k, t]) => (
        <button key={k} onClick={() => setPick(k)} className="row" style={{ gap: 12, padding: '16px 14px', borderRadius: 18, background: '#fff', border: `1.5px solid ${pick === k ? '#0a0a0a' : 'var(--u-border)'}`, textAlign: 'left' }}>
          <span style={{ width: 30, height: 30, borderRadius: 15, flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, background: pick === k ? '#0a0a0a' : '#fff', color: pick === k ? '#f5f4f0' : '#555', border: pick === k ? 0 : '1px solid var(--u-border)' }}>{k}</span>
          <span className="t-15 w-5">{t}</span>
        </button>
      ))}
      <span className="t-12 w-5 faint">Your answer is saved. You can change it until you submit.</span>
    </QuizShell>
  );
}

/* S30 · Number answer with number keypad */
export function S30QuizNumber() {
  const [val, setVal] = useState('4');
  const press = (k: string) => setVal((v) => (k === '⌫' ? v.slice(0, -1) : k === '.' && v.includes('.') ? v : (v + k).slice(0, 8)));
  return (
    <QuizShell keypad current={6} answered={5} time="09:12" bottom={
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 'var(--shell)', zIndex: 20 }}>
        <div className="row" style={{ gap: 10, padding: '0 24px 12px' }}><Button variant="white">Back</Button><Button>Next</Button></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, padding: '8px 6px calc(10px + env(safe-area-inset-bottom))', background: '#d6d6d1' }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((k) => <button key={k} onClick={() => press(k)} style={{ height: 46, borderRadius: 8, background: '#fff', fontSize: 20, fontWeight: 500 }}>{k}</button>)}
        </div>
      </div>
    }>
      <span className="t-20 w-7" style={{ fontSize: 22, lineHeight: 1.3 }}>In Worked Example 9.2 (5 cows, retention time 20 days), the required digester volume is:</span>
      <div className="row" style={{ gap: 10 }}>
        <span className="t-20 w-7" style={{ fontSize: 24, width: 200, height: 65, display: 'flex', alignItems: 'center', padding: '0 18px', background: '#fff', border: '1.5px solid #0a0a0a', borderRadius: 16 }}>{val}<span style={{ width: 2, height: 26, background: '#0a0a0a', marginLeft: 2, animation: 'blink 1s steps(1) infinite' }} /></span>
        <span className="t-20 w-6 muted">m³</span>
      </div>
      <span className="t-13 w-5 faint">Numbers only. Round to 2 decimal places if needed.</span>
      <style>{'@keyframes blink{50%{opacity:0}}'}</style>
    </QuizShell>
  );
}

/* S31 · Formula answer with the maths keypad. Answers are checked as expressions,
   so (8/27)ρV³ and 0.296ρV³ both count. */
const MATH_TABS = ['123', 'f(x)', 'αβγ', 'Units'];
const MATH_KEYS = ['7', '8', '9', '÷', '(', ')', '4', '5', '6', '×', 'xʸ', '√x', '1', '2', '3', '−', 'a⁄b', 'π', '0', '.', 'ρ', '+', '×10ⁿ', '⌫'];
export function S31QuizMaths() {
  const [tab, setTab] = useState('f(x)');
  const [expr, setExpr] = useState('P/A = (8⁄27) ρV³');
  const KEYMAP: Record<string, string> = { 'xʸ': '^', 'a⁄b': '⁄', '√x': '√', '×10ⁿ': '×10^' };
  const press = (k: string) => setExpr((e) => (k === '⌫' ? e.slice(0, -1) : e + (KEYMAP[k] ?? k)));
  const op = (k: string) => /[÷×−+()]|xʸ|√x|a⁄b|π|ρ|×10ⁿ/.test(k);
  return (
    <QuizShell keypad current={7} answered={6} time="09:12" bottom={
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 'var(--shell)', zIndex: 20 }}>
        <div className="row" style={{ gap: 10, padding: '0 24px 12px' }}><Button variant="white">Back</Button><Button>Next</Button></div>
        <div className="stack" style={{ gap: 7, padding: '8px 6px calc(10px + env(safe-area-inset-bottom))', background: '#d6d4ce' }}>
          <div className="row" style={{ gap: 6 }}>{MATH_TABS.map((t) => <button key={t} onClick={() => setTab(t)} className="t-15 w-7" style={{ flex: 1, height: 34, borderRadius: 10, background: t === tab ? '#0a0a0a' : '#c4c2bb', color: t === tab ? '#fff' : '#0a0a0a' }}>{t}</button>)}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 6 }}>
            {MATH_KEYS.map((k) => <button key={k} onClick={() => press(k)} className={/[xρπ]|a⁄b|10ⁿ/.test(k) ? 'math' : ''} style={{ height: 46, borderRadius: 9, fontSize: 21, background: k === '⌫' ? '#a8a6a0' : op(k) ? '#ecebe6' : '#fff' }}>{k}</button>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 1fr', gap: 6 }}>
            {['←', '→', 'space', 'Done'].map((k) => <button key={k} onClick={() => k === 'space' && press(' ')} className="t-16 w-6" style={{ height: 46, borderRadius: 9, background: k === 'Done' ? '#0a0a0a' : k === 'space' ? '#fff' : '#a8a6a0', color: k === 'Done' ? '#50ff90' : '#0a0a0a' }}>{k}</button>)}
          </div>
        </div>
      </div>
    }>
      <span className="t-20 w-7" style={{ fontSize: 22, lineHeight: 1.3 }}>Write the most power a wind turbine can take per square metre of rotor (the Betz limit), in terms of ρ and V.</span>
      <div className="row math" style={{ fontSize: 24, height: 66, padding: '0 18px', background: '#fff', border: '1.5px solid #0a0a0a', borderRadius: 16 }}>{expr}<span style={{ width: 2, height: 26, background: '#0a0a0a', marginLeft: 2 }} /></div>
      <span className="t-13 w-5 faint">Use the maths keys. Fractions and powers appear as you type.</span>
    </QuizShell>
  );
}

/* S32 · Results with answer review */
const REVIEW: { q: string; ok: boolean; why?: string }[] = [
  { q: '1. Air density from ρ = P/RT', ok: true },
  { q: '2. Power goes up with V³', ok: true },
  { q: '3. The Betz limit', ok: false, why: 'You wrote 60. The Betz limit is 16/27, about 59.3%. No turbine can extract more than that.' },
  { q: '4. Axial thrust', ok: true },
  { q: '5. Retention time sets digester volume', ok: true },
  { q: '6. Family digester volume: 4 m³', ok: true },
  { q: '7. Why Fm is in the power formula', ok: true },
  { q: '8. Design for winter', ok: true },
  { q: '9. Daily charge volume', ok: false, why: 'You chose A. Dung and an equal mass of water go in together: (825 + 825) / 1090 = 1.51 m³.' },
  { q: '10. Village digester: H = D = 4 m', ok: true },
];
export function S32QuizResults() {
  const go = useGo();
  return (
    <Screen actions>
      <div className="t-17 w-7 center" style={{ padding: '18px 0 8px' }}>Week 2 quiz</div>
      <div className="stack pad" style={{ gap: 12 }}>
        <Card tone="dark" pad={22} gap={6} style={{ alignItems: 'center' }}>
          <span className="eyebrow" style={{ color: 'var(--u-green)', fontSize: 11 }}>Your score</span>
          <span className="display" style={{ fontSize: 72, color: '#f5f4f0' }}>8/10</span>
          <span className="pill" style={{ background: 'var(--u-green)', color: '#0a0a0a' }}>80% · PASSED</span>
          <span className="row t-13 w-7" style={{ gap: 8, marginTop: 8, width: '100%', justifyContent: 'center', color: 'var(--u-green)', background: 'rgba(80,255,144,.12)', border: '1px solid var(--u-green)', borderRadius: 14, padding: 11 }}><Check size={16} />Week 3 is open: Gas Turbines</span>
        </Card>
        <Label>Review your answers</Label>
        <ListCard>
          {REVIEW.map((r) => (
            <div key={r.q} className="stack" style={{ gap: 6, padding: '12px 16px', background: r.ok ? undefined : 'var(--u-bad-tint)' }}>
              <div className="row" style={{ gap: 10 }}>
                <span style={{ width: 24, height: 24, borderRadius: 12, background: r.ok ? 'var(--u-green)' : 'var(--u-red)', display: 'grid', placeItems: 'center' }}>{r.ok ? <Check size={13} strokeWidth={3} /> : <X size={13} color="#fff" strokeWidth={3} />}</span>
                <span className="t-14 w-6">{r.q}</span>
              </div>
              {r.why && <span className="t-13 muted" style={{ paddingLeft: 34 }}>{r.why}</span>}
            </div>
          ))}
        </ListCard>
        <Card pad={16} gap={8} style={{ borderRadius: 20 }}>
          <Label style={{ fontSize: 11 }}>Worth another look</Label>
          {['Topic 1: The Betz limit', 'Topic 3: Daily charge volume'].map((t) => <button key={t} onClick={() => go('S26')} className="row between t-14 w-7" style={{ color: 'var(--u-good-2)' }}>{t}<ArrowRight size={16} /></button>)}
        </Card>
      </div>
      <BottomActions><Button onClick={() => go('S33')}>Continue</Button></BottomActions>
    </Screen>
  );
}

/* S33 · Week complete. Box Boy's bottom edge fades into the green. */
export function S33WeekComplete({ streak = 5 }: { streak?: number | null } = {}) {
  const go = useGo();
  return (
    <Screen bg="var(--u-green)" actions>
      <div className="stack" style={{ alignItems: 'flex-end', paddingTop: 50, paddingRight: 16 }}><FadedBoxBoy pose="cheer" width={266} /></div>
      <div className="stack pad" style={{ gap: 12, marginTop: 4 }}>
        <Display size={64}>{'WEEK 2\nDONE.'}</Display>
        <span className="t-15 w-6">Wind energy and biogas · MEE 352</span>
        <Card tone="dark" pad={18} style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <span className="stack"><span className="eyebrow" style={{ color: 'var(--u-green)', fontSize: 11 }}>Quiz</span><span className="display" style={{ fontSize: 44 }}>8/10</span></span>
          <span className="stack"><span className="t-16 w-7">Week 3 is open</span><span className="t-13" style={{ color: '#999' }}>Gas turbines · 3 classes</span></span>
        </Card>
        {streak != null && <div><StreakPill days={streak} /></div>}
      </div>
      <BottomActions tone="green">
        <Button onClick={() => go('S23')}>Start Week 3</Button>
        <Button variant="white" onClick={() => go('S23')}>Back to course</Button>
      </BottomActions>
    </Screen>
  );
}

/* S34 · Streak after the first class of the day. Weekends never break it. */
export function S34Streak() {
  const go = useGo();
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <Screen bg="#0a0a0a" actions style={{ color: '#fff' }}>
      <div className="stack" style={{ alignItems: 'center', gap: 6, paddingTop: 80 }}>
        <span className="display" style={{ fontSize: 120, color: '#fbbf24', lineHeight: 1 }}>5</span>
        <span className="display" style={{ fontSize: 28 }}>Day streak</span>
        <div className="row" style={{ gap: 10, marginTop: 28 }}>
          {days.map((d, i) => (
            <span key={i} className="stack" style={{ alignItems: 'center', gap: 6 }}>
              <span style={{ width: 38, height: 38, borderRadius: 19, display: 'grid', placeItems: 'center', background: i < 5 ? '#fbbf24' : 'transparent', border: i < 5 ? 0 : '1.5px dashed #3a3a3a' }}>{i < 5 && <Check size={18} strokeWidth={3} />}</span>
              <span className="t-12 w-7" style={{ color: i < 5 ? '#fff' : '#999' }}>{d}</span>
            </span>
          ))}
        </div>
        <span className="t-12 w-6" style={{ color: '#999', marginTop: 6, alignSelf: 'flex-end', marginRight: 40 }}>Weekends are free</span>
        <p className="t-15 center" style={{ color: '#999', maxWidth: 320, marginTop: 18 }}>You finished a class today. Saturday and Sunday never break your streak.</p>
        <BoxBoy pose="cheer" width={161} style={{ marginTop: 16 }} />
      </div>
      <BottomActions tone="dark"><Button onClick={() => go('S19')}>Continue</Button></BottomActions>
    </Screen>
  );
}

/* S35 · Revision question (answered). Spaced: 1, 3, 7, 14, 30 days. Max 10 a day. */
export function S35Revision() {
  const go = useGo();
  const [pick, setPick] = useState<string | null>('B');
  const opts = [['A', 'The standard value, 1.225 kg/m³'], ['B', "ρ = P/RT, using the site's pressure and temperature"], ['C', 'The wind speed at hub height'], ['D', "The turbine's swept area"]];
  return (
    <Screen actions>
      <TopBar title="Today's revision" />
      <div className="stack pad" style={{ gap: 12, paddingTop: 6 }}>
        <div className="row" style={{ gap: 12 }}><span className="t-12 w-7 faint">4 OF 10</span><div className="grow"><ProgressBar value={0.33} track="var(--u-border)" /></div></div>
        <span className="eyebrow" style={{ alignSelf: 'flex-start', fontSize: 10, background: '#0a0a0a', color: 'var(--u-green)', borderRadius: 12, padding: '4px 10px' }}>MEE 352 · Week 1 · last seen 7 days ago</span>
        <span className="t-20 w-7" style={{ fontSize: 22, lineHeight: 1.3 }}>Air density at a site is best found from:</span>
        {opts.map(([k, t]) => {
          const right = k === 'B'; const show = pick != null;
          const state = show && right ? 'right' : show && pick === k ? 'wrong' : '';
          return (
            <button key={k} onClick={() => setPick(k)} className="row" style={{ gap: 12, padding: '16px 14px', borderRadius: 18, textAlign: 'left', background: state === 'right' ? 'rgba(80,255,144,.25)' : state === 'wrong' ? 'var(--u-bad-tint)' : '#fff', border: `1.5px solid ${state === 'right' ? 'var(--u-good-2)' : state === 'wrong' ? 'var(--u-red)' : 'var(--u-border)'}` }}>
              <span style={{ width: 30, height: 30, borderRadius: 15, flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, background: state === 'right' ? 'var(--u-good-2)' : '#fff', color: state === 'right' ? '#fff' : '#555', border: state === 'right' ? 0 : '1px solid var(--u-border)' }}>{k}</span>
              <span className="grow t-15 w-5">{t}</span>
              {state === 'right' && <Check size={20} color="var(--u-good-2)" strokeWidth={3} />}
            </button>
          );
        })}
        {pick && (
          <div className="stack" style={{ gap: 6, padding: 16, borderRadius: 16, background: 'rgba(80,255,144,.18)' }}>
            <span className="t-15 w-7" style={{ color: 'var(--u-good-2)' }}>{pick === 'B' ? 'Right.' : 'Not quite.'}</span>
            <span className="t-13 muted">Density changes with pressure and temperature, so it's derived for each site, never assumed.</span>
          </div>
        )}
        <span className="row t-12 w-6 faint" style={{ gap: 6 }}><Clock size={14} />Comes back in 14 days</span>
      </div>
      <BottomActions><Button onClick={() => go('S36')}>Next</Button></BottomActions>
    </Screen>
  );
}

/* S36 · Revision done */
export function S36RevisionDone() {
  const go = useGo();
  return (
    <Screen bg="var(--u-green)" actions>
      <div className="stack" style={{ alignItems: 'flex-end', paddingTop: 50, paddingRight: 16 }}><FadedBoxBoy pose="cheer" width={266} /></div>
      <div className="stack pad" style={{ gap: 14, marginTop: 4 }}>
        <Display size={56}>{'REVISION\nDONE.'}</Display>
        <Card pad={18} gap={10} style={{ border: 0, borderRadius: 20 }}>
          <div className="row between"><span className="t-16 w-7">8 of 10 right</span><span className="t-12 w-6 faint">5 min</span></div>
          {[['MEE 352', '4 of 4'], ['ECE 305', '2 of 3'], ['ECE 303', '2 of 3']].map(([c, s]) => <div key={c} className="row between"><span className="t-14 w-6">{c}</span><span className="t-13 w-5 muted">{s}</span></div>)}
          <span className="row t-12 w-6 muted" style={{ gap: 6 }}><RefreshCw size={14} />The 2 you missed come back tomorrow</span>
        </Card>
      </div>
      <BottomActions tone="green"><Button variant="dark" onClick={() => go('S19')}>Back to Home</Button></BottomActions>
    </Screen>
  );
}

