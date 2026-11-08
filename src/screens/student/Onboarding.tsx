import { useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Screen, GreenBand, BottomActions } from '../../components/chrome';
import { Button, Checkbox, Chip, Chips, Display, Field, ProgressDots, Segmented } from '../../components/ui';
import { AppIcon, BoxBoy, Bubble, PERSONAS, Wordmark, type Pose } from '../../components/brand';
import { useGo } from '../../components/nav';
import { student } from '../../data/sample';

/* Poster layout: big coloured poster on top, a short sheet with the action at the bottom (S02–S05, S12, S13). */
export function Poster({ bg, sheetBg, poster, sheet }: { bg: string; sheetBg: string; poster: ReactNode; sheet: ReactNode }) {
  return (
    <Screen bg={sheetBg} style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: bg, flex: 1, minHeight: 560, position: 'relative', overflow: 'hidden', padding: '20px 20px 0', borderRadius: '0 0 32px 32px' }}>{poster}</div>
      <div className="stack" style={{ background: sheetBg, padding: '24px 16px calc(20px + env(safe-area-inset-bottom))', gap: 14 }}>{sheet}</div>
    </Screen>
  );
}
export function PosterTop({ step, dark }: { step?: number; dark?: boolean }) {
  return (
    <div className="row between">
      <Wordmark color={dark ? '#fff' : undefined} />
      {step && <ProgressDots step={step} color={dark ? '#50ff90' : '#0a0a0a'} />}
    </div>
  );
}
export const Next = ({ label = 'Next', variant = 'amber' as const, onClick, disabled }: { label?: string; variant?: 'amber' | 'dark'; onClick: () => void; disabled?: boolean }) => (
  <Button variant={variant} onClick={onClick} disabled={disabled}>{label} <ArrowRight size={18} /></Button>
);

/* S01 · Splash */
export function S01Splash() {
  const go = useGo();
  return (
    <Screen bg="var(--u-green)" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
      <div onClick={() => go('S02')} className="stack" style={{ alignItems: 'center', gap: 18, cursor: 'pointer' }}>
        <AppIcon size={120} />
        <Wordmark size={30} />
        <div className="t-14 w-6">Own your academic journey</div>
      </div>
      {/* Sponsor slot: swap "Unify" for a partner's name when a partner pays for students' access. */}
      <div className="stack" style={{ position: 'absolute', bottom: 48, alignItems: 'center', gap: 2 }}>
        <span className="t-12 w-5">Powered by</span>
        <Wordmark size={18} />
      </div>
    </Screen>
  );
}

/* S02 · It stops now */
export function S02ItStopsNow() {
  const go = useGo();
  return (
    <Poster
      bg="var(--u-green)" sheetBg="var(--u-black)"
      poster={<>
        <PosterTop step={1} />
        <div className="t-20 w-7" style={{ marginTop: 28, maxWidth: 300, lineHeight: 1.15 }}>NEW PDFS THE NIGHT BEFORE THE EXAM?</div>
        <Display size={92} style={{ marginTop: 10 }}>{'IT\nSTOPS\nNOW.'}</Display>
        <Bubble style={{ right: 30, top: 150 }}>E don do!</Bubble>
        <BoxBoy pose="wavePhone" width={220} style={{ position: 'absolute', right: -10, bottom: 0 }} />
      </>}
      sheet={<>
        <p className="t-15 w-5" style={{ color: '#fff' }}>Open your course, pick the week, tap the class. That day's note is right there.</p>
        <span className="t-13 w-5" style={{ alignSelf: 'flex-start', color: '#999', border: '1px solid #555', borderRadius: 24, padding: '8px 14px' }}>Ask the note: coming soon</span>
        <Next onClick={() => go('S03')} />
        <button className="link-btn" style={{ color: '#fff' }} onClick={() => go('S05')}>Skip</button>
      </>}
    />
  );
}

/* S03 · We got you */
export function S03WeGotYou() {
  const go = useGo();
  return (
    <Poster
      bg="var(--u-black)" sheetBg="var(--u-green)"
      poster={<>
        <PosterTop step={2} dark />
        <div className="t-20 w-7" style={{ marginTop: 28, color: '#fff', maxWidth: 300, lineHeight: 1.15 }}>MISSED A CLASS AND WORRIED ABOUT THE NOTE?</div>
        <Display size={88} color="var(--u-green)" style={{ marginTop: 10 }}>{'WE GOT\nYOU.'}</Display>
        <BoxBoy pose="thumbsUpPhone" width={250} style={{ position: 'absolute', right: -6, bottom: 0 }} />
      </>}
      sheet={<>
        <p className="t-15 w-5">Get all your notes for each course, broken down into 12 weeks.</p>
        <Next variant="dark" onClick={() => go('S04')} />
        <button className="link-btn" onClick={() => go('S05')}>Skip</button>
      </>}
    />
  );
}

/* S04 · Those courses have nothing on you */
export function S04NothingOnYou() {
  const go = useGo();
  return (
    <Poster
      bg="var(--u-green)" sheetBg="var(--u-black)"
      poster={<>
        <PosterTop step={3} />
        <div className="t-20 w-7" style={{ marginTop: 28 }}>THOSE COURSES</div>
        <Display size={72} style={{ marginTop: 6 }}>{'HAVE\nNOTHING\nON YOU.'}</Display>
        <BoxBoy pose="armsCrossed" width={260} style={{ position: 'absolute', right: -20, bottom: 0 }} />
      </>}
      sheet={<>
        <p className="t-15 w-5" style={{ color: '#fff' }}>Mini quizzes and streaks keep you ready, so you walk into the exam more confident.</p>
        <Next label="Let's go" onClick={() => go('S05')} />
        <button className="link-btn" style={{ color: '#fff' }} onClick={() => go('S05')}>Skip</button>
      </>}
    />
  );
}

/* S05 · Welcome (sign up / Google) */
export function S05Welcome() {
  const go = useGo();
  return (
    <Poster
      bg="var(--u-green)" sheetBg="var(--u-black)"
      poster={<>
        <PosterTop />
        <Display size={170} style={{ marginTop: 10, lineHeight: 0.9 }}>5.0</Display>
        <Display size={150} style={{ lineHeight: 0.9 }}>Abi?</Display>
        <Bubble style={{ right: 24, top: 260 }}>Oya, sign up!</Bubble>
        <BoxBoy pose="sittingPhone" width={190} style={{ position: 'absolute', right: 16, bottom: 0 }} />
      </>}
      sheet={<>
        <Button onClick={() => go('S06')}>Create an account</Button>
        <Button variant="white" onClick={() => go('S07')}><img src="/boxboy/google.png" width={22} alt="" /> Continue with Google</Button>
        <button className="link-btn" style={{ color: '#fff' }}>Already have an account?</button>
        <div className="t-16 w-5 center" style={{ color: '#fff' }}>Own your academic journey</div>
      </>}
    />
  );
}

/* Form-step layout: green band with headline, then the sheet. */
export function FormStep({ step, title, titleSize = 40, intro, children, actions, pose }: {
  step: number; title: string; titleSize?: number; intro: string; children: ReactNode; actions: ReactNode; pose?: Pose;
}) {
  return (
    <Screen actions>
      <GreenBand>
        <div className="row between"><Wordmark /><ProgressDots step={step} /></div>
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <Display size={titleSize}>{title}</Display>
          {pose && <BoxBoy pose={pose} width={150} style={{ marginBottom: -28 }} />}
        </div>
      </GreenBand>
      <div className="stack pad" style={{ gap: 14, paddingTop: 20 }}>
        <p className="t-15 w-5 muted">{intro}</p>
        {children}
      </div>
      <BottomActions>{actions}</BottomActions>
    </Screen>
  );
}

/* S06 · Sign-up form */
export function S06SignUp() {
  const go = useGo();
  return (
    <FormStep step={1} titleSize={30} title={'WHAT\nSHOULD WE\nCALL YOU?'} pose="peeking"
      intro="We use your first name in your good morning messages."
      actions={<>
        <p className="t-13 center faint" style={{ lineHeight: 1.45 }}>By creating an account you agree to our <a href="/terms" className="w-6" style={{ color: 'var(--u-good)', textDecoration: 'underline' }}>Terms of Use</a> and <a href="/privacy" className="w-6" style={{ color: 'var(--u-good)', textDecoration: 'underline' }}>Privacy Policy</a>.</p>
        <Next label="Create my account" onClick={() => go('S07')} />
        <button className="link-btn">Already have an account?  Log in</button>
      </>}
    >
      <Field label="First name" value={student.firstName} />
      <Field label="Email" value="joshua.olotuche@gmail.com" type="email" hint="Your normal Gmail. Your student email is only needed once, to claim your name for attendance." />
      <Field label="Password" value="password1" type="password" hint="At least 8 characters." />
    </FormStep>
  );
}

/* S07 · Department and level */
export function S07Department() {
  const go = useGo();
  const [level, setLevel] = useState('300L');
  return (
    <FormStep step={2} title={'WHICH\nDEPARTMENT?'} intro="We use this to set up the right courses for you." actions={<Next onClick={() => go('S08')} />}>
      <Field label="School" value={student.school} select hint="More faculties coming soon." />
      <Field label="Faculty" value={student.faculty} select />
      <Field label="Department" value={student.departmentFull} select />
      <div>
        <div className="field-label">Level</div>
        <Chips>{['100L', '200L', '300L', '400L', '500L'].map((l) => <Chip key={l} on={l === level} onClick={() => setLevel(l)}>{l}</Chip>)}</Chips>
      </div>
    </FormStep>
  );
}

/* S08 · Pick your courses. Courses from other levels are allowed and show as PRIORITY. */
const PICK = [
  { code: 'ECE 303', title: 'Electrical Circuit Theory', units: 3, on: true },
  { code: 'ECE 305', title: 'Semiconductor Devices', units: 2, on: true },
  { code: 'ECE 307', title: 'Digital Electronics I', units: 2, on: true },
  { code: 'ECE 311', title: 'Measurement and Instrumentation', units: 3, on: true },
  { code: 'ECE 319', title: 'Algorithms and Data Structure', units: 2, on: false },
  { code: 'MEE 301', title: 'Engineering Mathematics III', units: 3, on: false },
];
export function S08PickCourses() {
  const go = useGo();
  const [sem, setSem] = useState<'1' | '2'>('1');
  const [picked, setPicked] = useState(() => new Set(PICK.filter((c) => c.on).map((c) => c.code)));
  const toggle = (code: string) => setPicked((s) => { const n = new Set(s); if (n.has(code)) n.delete(code); else n.add(code); return n; });
  return (
    <FormStep step={3} title={'PICK YOUR\nCOURSES'} intro="Tick everything you're taking this semester. You can change it later."
      actions={<Button onClick={() => go('S09')}>Done  ·  {picked.size} selected</Button>}>
      <Segmented value={sem} onChange={setSem} options={[{ value: '1', label: 'First semester' }, { value: '2', label: 'Second semester' }]} />
      <div className="t-12 w-6 faint">300 Level · Electronic and Computer Engineering</div>
      <div className="stack" style={{ gap: 8 }}>
        {PICK.map((c) => {
          const on = picked.has(c.code);
          return (
            <button key={c.code} onClick={() => toggle(c.code)} className="row" style={{ gap: 12, padding: '12px 14px', borderRadius: 16, background: on ? '#fff' : 'transparent', border: `1px solid ${on ? 'var(--u-border)' : 'transparent'}`, textAlign: 'left' }}>
              <Checkbox checked={on} />
              <span className="grow stack"><span className="t-14 w-7">{c.code}</span><span className="t-12 muted">{c.title}</span></span>
              <span className="t-12 w-6 faint">{c.units} units</span>
            </button>
          );
        })}
      </div>
    </FormStep>
  );
}

/* S09 · 7b What are you working towards? Sets where we start the student. */
const GOALS = [
  ['Improve my grades', 'See real progress toward my target'],
  ['Build a reading habit', 'Stop leaving everything until exams'],
  ['Understand my courses', 'Explanations that actually make sense'],
  ['Study better with others', 'Talking it through helps me learn'],
  ['Balance school with other things', 'Work, business, projects, leadership'],
];
export function S09Goal({ onChoose }: { onChoose?: (goal: string) => Promise<void> } = {}) {
  const go = useGo();
  const [goal, setGoal] = useState(0);
  return (
    <FormStep step={3} title={'WHAT ARE YOU\nWORKING\nTOWARDS?'} intro="Pick one for this semester. We'll start you in the right place." actions={<Next label="Continue" onClick={async () => { await onChoose?.(GOALS[goal][0]).catch(() => undefined); go('S10'); }} />}>
      <div className="stack" style={{ gap: 10 }}>
        {GOALS.map(([t, s], i) => (
          <button key={t} onClick={() => setGoal(i)} className="row" style={{ gap: 12, padding: '14px 16px', borderRadius: 18, background: '#fff', border: `1.5px solid ${goal === i ? '#0a0a0a' : 'var(--u-border)'}`, textAlign: 'left' }}>
            <span className="grow stack" style={{ gap: 2 }}><span className="t-16 w-7">{t}</span><span className="t-13 w-5 muted">{s}</span></span>
            {goal === i && <span style={{ width: 26, height: 26, borderRadius: 13, background: '#0a0a0a', display: 'grid', placeItems: 'center' }}><Check size={15} color="#50ff90" strokeWidth={3} /></span>}
          </button>
        ))}
      </div>
    </FormStep>
  );
}

/* S10 · 7c Study rhythm. Sets reminder times and focus length. */
const TIMES = [['Early morning', '5 to 8 AM'], ['Afternoon', '12 to 4 PM'], ['Evening', '5 to 9 PM'], ['Night owl', 'after 10 PM'], ['Any time', '']];
export function S10Rhythm() {
  const go = useGo();
  const [time, setTime] = useState('Night owl');
  const [focus, setFocus] = useState('25 min');
  const box = (on: boolean) => ({ padding: '11px 14px', borderRadius: 16, background: on ? '#0a0a0a' : '#fff', color: on ? '#fff' : '#0a0a0a', border: on ? 0 : '1px solid var(--u-border)', textAlign: 'left' as const });
  return (
    <FormStep step={3} title={'WHEN DO\nYOU READ\nBEST?'} intro="We'll time your reminders and revision to fit your day." actions={<Next label="Continue" onClick={() => go('S11')} />}>
      <div className="row wrap" style={{ gap: 8 }}>
        {TIMES.map(([t, s]) => (
          <button key={t} onClick={() => setTime(t)} className="stack" style={box(time === t)}>
            <span className="t-15 w-7">{t}</span>{s && <span className="t-12 w-5" style={{ color: time === t ? '#bdbdbd' : 'var(--u-text-2)' }}>{s}</span>}
          </button>
        ))}
      </div>
      <div className="t-16 w-7" style={{ marginTop: 6 }}>How long can you focus in one go?</div>
      <div className="row wrap" style={{ gap: 8 }}>
        {['15 min', '25 min', '45 min', 'An hour+'].map((f) => <button key={f} onClick={() => setFocus(f)} className="t-15 w-7" style={box(focus === f)}>{f}</button>)}
      </div>
      <div className="t-14 w-6" style={{ background: '#dcfce7', color: 'var(--u-good)', borderRadius: 16, padding: '12px 14px' }}>
        We'll suggest {focus === 'An hour+' ? '60' : focus.split(' ')[0]} minutes of reading, then a 5-minute break with a few quick questions.
      </div>
    </FormStep>
  );
}

/* S11 · 7d Pick your Box Boy: curved carousel.
   The selected avatar is big in the centre; neighbours shrink and fade along a curve.
   Swipe or tap a neighbour to move. The persona and traits show underneath. */
export function S11PickBoxBoy({ onChoose }: { onChoose?: (persona: string) => Promise<void> } = {}) {
  const go = useGo();
  const [idx, setIdx] = useState(0);
  const [story, setStory] = useState(false);
  const startX = useRef<number | null>(null);
  const n = PERSONAS.length;
  const move = (d: number) => { setIdx((i) => (i + d + n) % n); setStory(false); };
  const p = PERSONAS[idx];
  return (
    <FormStep step={3} title={'PICK YOUR\nBOX BOY'} intro="Swipe to meet them. He's your profile picture, and you can change him any time in Me."
      actions={<Next label="This is me" onClick={async () => { await onChoose?.(p.key).catch(() => undefined); go('S12'); }} />}>
      <div
        className="no-select"
        style={{ position: 'relative', height: 266, margin: '0 -16px', overflow: 'hidden', touchAction: 'pan-y' }}
        onPointerDown={(e) => { startX.current = e.clientX; }}
        onPointerUp={(e) => { if (startX.current == null) return; const dx = e.clientX - startX.current; if (Math.abs(dx) > 40) move(dx < 0 ? 1 : -1); startX.current = null; }}
      >
        {/* the circular track */}
        <span style={{ position: 'absolute', left: 'calc(50% - 190px)', top: 104, width: 380, height: 380, borderRadius: '50%', border: '1.5px dashed rgba(10,10,10,.18)' }} />
        {PERSONAS.map((q, i) => {
          let off = i - idx; if (off > n / 2) off -= n; if (off < -n / 2) off += n;
          const a = Math.abs(off);
          // Every avatar centre rides one circle (a wheel). Pairs either side share a size,
          // so they sit symmetrically on the same curved track. Matches Figma S11.
          const R = 190, CY = 294;
          const deg = off * 34 + (a === 2 ? Math.sign(off) * -4 : 0); // 0, ±34°, ±64°
          const size = a === 0 ? 168 : a === 1 ? 104 : 72;
          const t = (deg * Math.PI) / 180;
          const x = 215 + R * Math.sin(t) - size / 2;
          const y = CY - R * Math.cos(t) - size / 2;
          return (
            <button
              key={q.key}
              onClick={() => (off === 0 ? setStory((s) => !s) : move(off))}
              style={{ position: 'absolute', left: `calc(50% - 215px + ${x}px)`, top: y, width: size, height: size, borderRadius: '50%', opacity: a === 0 ? 1 : a === 1 ? 0.65 : 0.35, transition: 'all .35s cubic-bezier(.2,.8,.2,1)', boxShadow: a === 0 ? '0 0 0 7px var(--u-page), 0 0 0 12px #0a0a0a' : undefined, zIndex: 10 - a, overflow: 'hidden', background: 'var(--u-green)' }}
              aria-label={q.name}
            >
              <img src={q.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
            </button>
          );
        })}
        <div className="row" style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', gap: 6 }}>
          {PERSONAS.map((q, i) => <span key={q.key} style={{ width: i === idx ? 18 : 6, height: 6, borderRadius: 3, background: i === idx ? '#0a0a0a' : '#cfcdc7', transition: 'width .2s' }} />)}
        </div>
      </div>
      <div className="stack" style={{ alignItems: 'center', gap: 10, textAlign: 'center' }}>
        <span className="eyebrow" style={{ color: 'var(--u-good)', letterSpacing: '0.08em' }}>Box Boy {idx + 1} of {n}</span>
        <Display size={30}>{p.name.toUpperCase()}</Display>
        <p className="t-15" style={{ color: '#333', maxWidth: 360 }}>{p.blurb}</p>
        <Chips>{p.traits.map((t) => <span key={t} className="chip chip--sm">{t}</span>)}</Chips>
        {story && <p className="t-14 muted" style={{ maxWidth: 360 }}>{p.name} is one of five Box Boys from our student interviews. Pick the one that sounds like you this semester.</p>}
        <div className="row" style={{ gap: 18 }}>
          <button className="t-14 w-6" style={{ color: 'var(--u-good)' }} onClick={() => setStory((s) => !s)}>Tap him for his story ›</button>
          <button className="t-14 w-6 muted" onClick={() => { setIdx(Math.floor(Math.random() * n)); setStory(false); }}>Surprise me</button>
        </div>
      </div>
    </FormStep>
  );
}

/* S12 · Want a little push? (push permission with a reason) */
export function S12Push() {
  const go = useGo();
  return (
    <Poster
      bg="var(--u-green)" sheetBg="var(--u-black)"
      poster={<>
        <PosterTop />
        <Display size={80} style={{ marginTop: 16 }}>{'WANT A\nLITTLE\nPUSH?'}</Display>
        <BoxBoy pose="phoneOut" width={230} style={{ position: 'absolute', left: -10, bottom: 0 }} />
        <div className="stack" style={{ position: 'absolute', right: 16, bottom: 140, width: 230, background: '#fff', borderRadius: 18, padding: 12, gap: 6, boxShadow: '0 8px 24px rgba(0,0,0,.12)' }}>
          <div className="row" style={{ gap: 8 }}><AppIcon size={22} /><span className="t-12 w-6 muted grow">Unify Learn</span><span className="t-12 faint">7:02</span></div>
          <div className="t-13 w-5">Good morning, {student.firstName}. Week 3, Class 2 is waiting. Five minutes is enough.</div>
        </div>
      </>}
      sheet={<>
        <p className="t-15 w-5" style={{ color: '#fff' }}>Good morning messages, streak reminders, and a nudge when you start falling behind. Written like a person.</p>
        <Button onClick={() => go('S13')}>Yes, remind me</Button>
        <button className="link-btn" style={{ color: '#fff' }} onClick={() => go('S13')}>Not now</button>
      </>}
    />
  );
}

/* S13 · Bag that first class */
export function S13FirstClass() {
  const go = useGo();
  return (
    <Poster
      bg="var(--u-green)" sheetBg="var(--u-black)"
      poster={<>
        <PosterTop />
        <Display size={62} style={{ marginTop: 16 }}>{'BAG THAT\nFIRST\nCLASS.'}</Display>
        <Bubble style={{ left: 24, bottom: 220 }}>You don enter!</Bubble>
        <BoxBoy pose="keyHandover" width={290} style={{ position: 'absolute', right: -20, bottom: 0 }} />
      </>}
      sheet={<>
        <p className="t-15 w-5" style={{ color: '#fff' }}>Welcome, {student.firstName}. Your courses are set. Pick one and open this week's note.</p>
        <Next label="Open my courses" onClick={() => go('S14')} />
      </>}
    />
  );
}
