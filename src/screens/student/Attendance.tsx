import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, Camera, ChevronRight, Copy, LogIn, ShieldCheck, Video, WifiOff, Wifi, X, Check, Keyboard } from 'lucide-react';
import { Screen, TopBar, TabBar, BottomActions } from '../../components/chrome';
import { Button, Card, Display, Label, ListCard, ListRow, Pill, ProgressBar } from '../../components/ui';
import { BoxBoy, Wordmark, CountdownRing } from '../../components/brand';
import { useGo } from '../../components/nav';
import { HomeHero, HomeSheet, ContinueCard, CoursesList } from './Home';
import { S23CourseWeeks } from './Learning';
import { student } from '../../data/sample';

/* ===================== Attendance (S58–S63) =====================
   Students claim their name once from the HOC's class list before they get a pass:
   see ClassList.tsx (AT07–AT14). S57 (typing your own name) was removed. */

/* S58 · Home while a lecturer has the scan open */
export function S58HomeAttendanceOpen() {
  const go = useGo();
  const banner = (
    <button onClick={() => go('S59')} className="row" style={{ gap: 10, width: '100%', background: '#0a0a0a', color: '#fff', borderRadius: 18, padding: '12px 14px', textAlign: 'left' }}>
      <span style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--u-green)', boxShadow: '0 0 0 4px rgba(80,255,144,.25)' }} />
      <span className="grow stack"><span className="eyebrow" style={{ color: 'var(--u-green)', fontSize: 11 }}>Attendance is open</span><span className="t-13 w-5">MEE 352 · ETF Hall</span></span>
      <span className="t-13 w-7" style={{ background: 'var(--u-green)', color: '#0a0a0a', borderRadius: 14, padding: '7px 12px' }}>Show my pass</span>
    </button>
  );
  return (
    <Screen tabs>
      <HomeHero target={student.target} />
      {/* The live banner sits at the top of the sheet, above Continue, so it never covers Box Boy. */}
      <HomeSheet>{banner}<ContinueCard /><CoursesList /></HomeSheet>
      <TabBar active="home" />
    </Screen>
  );
}

/* S59 · Attendance pass. Rotating code (30s) so screenshots don't work; signed offline for the day. */
function PassCode({ seed }: { seed: number }) {
  // Placeholder pattern. The real pass renders a signed QR from the server key.
  const cells = Array.from({ length: 21 * 21 }, (_, i) => ((i * 7919 + seed * 104729) % 13) < 6);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(21,1fr)', width: 220, height: 220, background: '#fff', padding: 10, borderRadius: 16 }}>
      {cells.map((on, i) => <span key={i} style={{ background: on ? '#0a0a0a' : '#fff' }} />)}
    </div>
  );
}
export function S59AttendancePass() {
  const [left, setLeft] = useState(21);
  const [seed, setSeed] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setLeft((s) => { if (s <= 1) { setSeed((x) => x + 1); return 30; } return s - 1; }), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <Screen bg="#0a0a0a" style={{ color: '#fff' }}>
      <TopBar title="Attendance pass" dark />
      <div className="stack" style={{ alignItems: 'center', gap: 14, padding: '10px 24px 30px' }}>
        <span className="t-13 w-6" style={{ color: 'var(--u-green)' }}>MEE 352 · scan is open at the door</span>
        <div style={{ padding: 12, borderRadius: 24, background: 'var(--u-green)' }}><PassCode seed={seed} /></div>
        <Display size={28} color="#fff" style={{ textAlign: 'center' }}>JOSHUA OLOTUCHE</Display>
        <span className="t-14" style={{ color: '#aaa', marginTop: -8 }}>Electrical & Computer Eng. · 300L</span>
        <span className="t-14 w-6">Matric 2208••••</span>
        <div style={{ width: '100%' }}><ProgressBar value={left / 30} track="#2a2a2a" /></div>
        <span className="t-13 w-6" style={{ color: 'var(--u-green)' }}>New code in 0:{String(left).padStart(2, '0')}</span>
        <span className="row t-12" style={{ gap: 6, color: '#aaa' }}><WifiOff size={14} />Works without data · pass valid today</span>
        <span className="t-13 center" style={{ color: '#888', maxWidth: 320 }}>Hold this up to your HOC as you leave. The code changes every 30 seconds, so a screenshot won't work.</span>
      </div>
    </Screen>
  );
}

/* S60 · HOC sees "Take attendance" pinned on the course page */
export function S60HeadOfClassCourse() {
  const go = useGo();
  return (
    <>
      <S23CourseWeeks />
      <div style={{ position: 'fixed', bottom: 0, left: 'calc(50% + var(--nav-w) / 2)', transform: 'translateX(-50%)', width: '100%', maxWidth: 'var(--shell)', padding: '0 16px calc(16px + env(safe-area-inset-bottom))', zIndex: 25 }}>
        <Card tone="dark" pad={16} gap={8}>
          <span className="eyebrow" style={{ color: 'var(--u-green)', fontSize: 11 }}>You're the HOC</span>
          <div className="row" style={{ gap: 10 }}>
            <span className="grow stack"><span className="t-15 w-7">Week 2 · Wed 29 Oct class</span><span className="row t-12" style={{ gap: 6, color: '#aaa' }}><span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--u-green)' }} />Lecturer opened scan</span></span>
            <Button variant="green" small block={false} onClick={() => go('S61')}>Take attendance <ArrowRight size={14} /></Button>
          </div>
          <span className="t-12" style={{ color: '#888' }}>Works whether or not this week's notes are out.</span>
        </Card>
      </div>
    </>
  );
}

/* S61 · Scanner. Several HOCs can scan the same class; offline scans queue and upload later. */
export function S61Scanner() {
  const go = useGo();
  const results = [
    { name: 'Amaka Bello', sub: '300L Mechanical · present', tone: 'good' as const },
    { name: 'Tunde Lawal', sub: 'Already scanned at 11:52', tone: 'warn' as const },
    { name: 'Kemi Ade', sub: 'Not registered for MEE 352', tone: 'bad' as const },
  ];
  return (
    <Screen bg="#0a0a0a" style={{ color: '#fff' }}>
      <TopBar title="Scan attendance" dark right={<span className="row t-12 w-6" style={{ gap: 4, color: 'var(--u-amber)' }}><WifiOff size={14} />41 to upload</span>} />
      <span className="eyebrow pad" style={{ color: '#888', fontSize: 11 }}>MEE 352 · Tue 27 Oct · ETF Hall</span>
      <div className="pad" style={{ paddingTop: 12 }}>
        <div className="stack center" style={{ height: 300, borderRadius: 24, background: '#1a1a1a', alignItems: 'center', justifyContent: 'center', position: 'relative', gap: 10 }}>
          <span style={{ width: 200, height: 200, border: '3px solid var(--u-green)', borderRadius: 24 }} />
          <span className="row t-13" style={{ gap: 6, color: '#aaa' }}><Camera size={16} />Point at a student's pass</span>
        </div>
      </div>
      <div className="stack pad" style={{ gap: 8, paddingTop: 14 }}>
        {results.map((r) => (
          <div key={r.name} className="row" style={{ gap: 10, padding: 12, borderRadius: 14, background: '#161616' }}>
            <span style={{ width: 26, height: 26, borderRadius: 13, display: 'grid', placeItems: 'center', background: r.tone === 'good' ? 'var(--u-green)' : r.tone === 'warn' ? 'var(--u-amber)' : 'var(--u-red)' }}>{r.tone === 'good' ? <Check size={14} strokeWidth={3} color="#0a0a0a" /> : r.tone === 'warn' ? <AlertTriangle size={13} color="#0a0a0a" /> : <X size={14} color="#fff" strokeWidth={3} />}</span>
            <span className="stack"><span className="t-14 w-7">{r.name}</span><span className="t-12" style={{ color: '#999' }}>{r.sub}</span></span>
          </div>
        ))}
        <div className="row" style={{ gap: 12, marginTop: 6 }}>
          <span className="display" style={{ fontSize: 40, color: 'var(--u-green)' }}>312</span>
          <span className="stack"><span className="t-13 w-7">OF 750</span><span className="t-12" style={{ color: '#999' }}>scanned by 6 HOCs</span></span>
        </div>
        <div className="row" style={{ gap: 10, paddingBottom: 24 }}>
          <Button variant="ghost-dark"><Keyboard size={16} /> Type matric no.</Button>
          <Button variant="danger" onClick={() => go('S46')}>Close scan</Button>
        </div>
      </div>
    </Screen>
  );
}

/* S62 · HOC confirms a lecturer who added a course */
export function S62ConfirmLecturer() {
  const go = useGo();
  return (
    <Screen actions>
      <div className="pad" style={{ paddingTop: 16 }}><Wordmark /></div>
      <div className="stack pad" style={{ gap: 14, paddingTop: 20 }}>
        <Display size={36}>IS THIS YOUR LECTURER?</Display>
        <span className="t-15 muted" style={{ marginTop: -6 }}>A lecturer added a course your class takes. You know who teaches you, so you confirm it.</span>
        <Card pad={18} gap={12}>
          <div className="row" style={{ gap: 12 }}>
            <span style={{ width: 52, height: 52, borderRadius: 26, background: 'var(--u-green)', display: 'grid', placeItems: 'center', fontWeight: 800 }}>OA</span>
            <span className="stack"><span className="t-17 w-7">Dr. O. Adeyemi</span><span className="t-13 muted">Mechanical Engineering</span></span>
          </div>
          <div className="divider" />
          <span className="eyebrow faint" style={{ fontSize: 11 }}>Added this course</span>
          <span className="t-16 w-7">ECE 311 · Measurement & Instrumentation</span>
          <span className="t-13 muted">to 300L Electrical & Computer · First semester</span>
        </Card>
        <span className="t-13 faint">Two lecturers share the course? Confirm both. Until you answer, the course shows "Waiting for HOC" on their side.</span>
      </div>
      <BottomActions>
        <Button variant="green" onClick={() => go('S46')}><ShieldCheck size={16} /> Yes, Dr. Adeyemi teaches us</Button>
        <Button variant="white" onClick={() => go('S46')}>No, not our lecturer</Button>
      </BottomActions>
    </Screen>
  );
}

/* S63 · My attendance. Threshold note says "check yours": the 75% rule varies by department. */
const ATT = [
  ['MEE 352', 'Energy Conservation', 4, 4],
  ['ECE 303', 'Electrical Circuit Theory', 3, 4],
  ['ECE 311', 'Measurement & Instrumentation', 3, 4],
  ['ECE 305', 'Semiconductor Devices', 2, 4],
] as const;
export function S63MyAttendance() {
  return (
    <Screen>
      <TopBar />
      <div className="stack pad" style={{ gap: 12, paddingBottom: 28 }}>
        <Display size={34}>MY ATTENDANCE</Display>
        <span className="t-14 w-5 muted" style={{ marginTop: -6 }}>First semester · Week 2</span>
        <Card pad={14} style={{ flexDirection: 'row', gap: 10, background: 'var(--u-warn-tint)', border: 0 }}>
          <AlertTriangle size={18} color="var(--u-warn-ink)" style={{ flexShrink: 0 }} /><span className="t-14 w-6" style={{ color: 'var(--u-warn-ink)' }}>ECE 305 is below 75%. Many departments need 75% to sit the exam, so check yours.</span>
        </Card>
        <ListCard>
          {ATT.map(([code, title, came, of]) => {
            const pct = Math.round((came / of) * 100);
            return (
              <div key={code} className="stack" style={{ gap: 8, padding: '14px 16px' }}>
                <div className="row between"><span className="stack"><span className="t-15 w-7">{code}</span><span className="t-12 faint">{title} · came to {came} of {of}</span></span><span className="display" style={{ fontSize: 22, color: pct < 75 ? 'var(--u-red)' : undefined }}>{pct}%</span></div>
                <ProgressBar value={came / of} color={pct < 75 ? 'var(--u-red)' : 'var(--u-green)'} />
              </div>
            );
          })}
        </ListCard>
      </div>
    </Screen>
  );
}

/* ===================== Online class (S64–S70) =====================
   Big classes are split into rooms (100 per room). Students always join
   through Unify so the room is assigned and check-in 1 is recorded.
   Present = 2 of 3 check-ins (join + 2 random "Still here?"). */

function CheckSteps({ done }: { done: number }) {
  const items = [['1', 'Joined'], ['2', done >= 2 ? 'Done' : 'Soon'], ['3', 'Later']];
  return (
    <div className="row" style={{ gap: 8 }}>
      {items.map(([n, l], i) => (
        <span key={n} className="stack center" style={{ flex: 1, padding: '10px 0', borderRadius: 14, background: i < done ? 'var(--u-green)' : '#fff', border: i < done ? 0 : '1px solid var(--u-border)', gap: 2 }}>
          <span className="display" style={{ fontSize: 18 }}>{n}{i < done ? ' ✓' : ''}</span><span className="t-12 w-6" style={{ color: i < done ? '#0a0a0a' : '#999' }}>{l}</span>
        </span>
      ))}
    </div>
  );
}

/* S64 · Class is online today */
export function S64OnlineClass() {
  const go = useGo();
  return (
    <Screen actions>
      <TopBar title="Class" />
      <div className="stack pad" style={{ gap: 14 }}>
        <div className="stack" style={{ gap: 4 }}><Display size={34}>ECE 305</Display><span className="t-15 w-6 muted">Signals and Systems</span></div>
        <Card pad={16} gap={6}>
          <span className="t-14 w-6">Wed 5 Nov · 10 AM to 12 PM</span>
          <span className="row t-14" style={{ gap: 6 }}><Video size={16} />Online · Google Meet · your room: <b>Room 3</b></span>
          <span className="t-13 muted">Dr. A. Bakare</span>
        </Card>
        <Card pad={16} gap={6} style={{ background: 'var(--u-good-tint)', border: 0 }}>
          <Pill tone="good" style={{ alignSelf: 'flex-start' }}>Online today</Pill>
          <span className="t-14">Dr. Bakare moved this class online. Join through Unify, not the group link, so your attendance counts.</span>
        </Card>
        <Label>How attendance works</Label>
        <ListCard>
          <ListRow title="You join" sub="Counts as check-in 1" />
          <ListRow title="During class" sub="2 random “Still here?” checks" />
          <ListRow title="Present" sub="Answer 2 of the 3 checks" />
        </ListCard>
        <Label>Notes for this class</Label>
        <ListCard><ListRow leading={<span className="display" style={{ fontSize: 18 }}>4</span>} title="Fourier series" sub="Week 4 · Class 1 · skim it before class" right={<ChevronRight size={18} />} onClick={() => go('S26')} /></ListCard>
      </div>
      <BottomActions hint="Opens at 9:55 AM, five minutes before class"><Button onClick={() => go('S65')}><LogIn size={16} /> Join class</Button></BottomActions>
    </Screen>
  );
}

/* S65 · Checked in, before opening Meet */
export function S65CheckedIn() {
  const go = useGo();
  return (
    <Screen actions>
      <TopBar title="ECE 305 · Online" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={40}>{"YOU'RE\nCHECKED IN."}</Display>
        <span className="t-15 muted" style={{ marginTop: -6 }}>You joined Room 3 at 10:02 AM. That counts as check-in 1 of 3.</span>
        <Label>Check-ins</Label>
        <CheckSteps done={1} />
        <span className="t-13 muted">We'll ask “Still here?” twice during class. Tap within 2 minutes. Answer 2 of the 3 and you're marked present.</span>
        <Label>Before you go in</Label>
        <ListCard>
          <ListRow title="Camera off" sub="Saves your data. Your lecturer can still see you joined." />
          <ListRow title="Keep Unify notifications on" sub="Check-ins arrive as a notification. One tap answers it." />
          <ListRow title="Dropped out?" sub="Come back here and tap “I lost connection”. Your lecturer sees why." />
          <ListRow title="Room full?" sub="Unify moves you to the next room with space. No need to beg for another link." />
        </ListCard>
      </div>
      <BottomActions>
        <Button onClick={() => go('S66')}><Video size={16} /> Open Room 3</Button>
        <Button variant="white"><Copy size={16} /> Copy meeting link</Button>
      </BottomActions>
    </Screen>
  );
}

/* S66 · In class (Unify in the background) */
export function S66InClass() {
  const go = useGo();
  return (
    <Screen actions>
      <TopBar title="ECE 305 · Online" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Card tone="dark" pad={18} gap={6}>
          <span className="row t-12 w-7" style={{ gap: 6, color: 'var(--u-red)' }}><span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--u-red)' }} />LIVE · 00:38:12</span>
          <span className="t-17 w-7">ECE 305 · Signals and Systems</span>
          <span className="t-13" style={{ color: '#aaa' }}>Google Meet · Room 3 · Dr. A. Bakare</span>
          <Button variant="green" style={{ marginTop: 8 }}>Back to Room 3</Button>
        </Card>
        <Card pad={16} gap={4} style={{ background: 'var(--u-good-tint)', border: 0 }}>
          <span className="t-16 w-7" style={{ color: 'var(--u-good)' }}>You're marked present</span>
          <span className="t-13 muted">2 of 3 check-ins done. The last one is a bonus.</span>
        </Card>
        <Label>Check-ins</Label>
        <ListCard>
          <ListRow title="1 · You joined" right={<span className="t-13 w-6" style={{ color: 'var(--u-good)' }}>10:02 AM ✓</span>} />
          <ListRow title="2 · Still here?" right={<span className="t-13 w-6" style={{ color: 'var(--u-good)' }}>10:31 AM ✓</span>} />
          <ListRow title="3 · Still here?" right={<span className="t-13 faint">Before 12 PM</span>} />
        </ListCard>
        <Label>If something goes wrong</Label>
        <ListCard><ListRow leading={<WifiOff size={18} />} title="I lost connection" sub="Network, light or data gone? Tell Dr. Bakare in one tap. Check-ins carry on when you're back." right={<ChevronRight size={18} />} onClick={() => go('S69')} /></ListCard>
      </div>
    </Screen>
  );
}

/* S67 · “Still here?” check-in (2-minute window) */
export function S67StillHere() {
  const go = useGo();
  const [left, setLeft] = useState(102);
  useEffect(() => { const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000); return () => clearInterval(t); }, []);
  return (
    <Screen bg="var(--u-green)" actions>
      <div className="t-14 w-6 center" style={{ padding: '18px 0' }}>ECE 305 · Online class</div>
      <div className="stack" style={{ alignItems: 'center', gap: 14, padding: '10px 24px' }}>
        <CountdownRing fraction={left / 120} value={`${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`} label="left to answer" size={190} track="rgba(0,0,0,.12)" color="#0a0a0a" textColor="#0a0a0a" />
        <span className="eyebrow" style={{ fontSize: 12 }}>Check-in 2 of 3</span>
        <Display size={48}>STILL HERE?</Display>
        <span className="t-15 center" style={{ maxWidth: 300 }}>Tap below so Dr. Bakare's register shows you're in class.</span>
      </div>
      <BottomActions tone="green" hint="Missed it? You're still present if you answer the other two."><Button variant="dark" onClick={() => go('S66')}>I'm here</Button></BottomActions>
    </Screen>
  );
}

/* S68 · Lecturer started a break: no check-ins until it ends */
export function S68Break() {
  const go = useGo();
  return (
    <Screen bg="#0a0a0a" actions style={{ color: '#fff' }}>
      <div className="stack" style={{ alignItems: 'center', gap: 14, padding: '70px 24px 20px' }}>
        <Display size={48} color="#fff">BREAK TIME.</Display>
        <span className="t-15 center" style={{ color: '#aaa', maxWidth: 320 }}>Dr. Bakare paused the class for 10 minutes. No check-ins until the break is over.</span>
        <CountdownRing fraction={521 / 600} value="08:41" label="Class resumes 11:05 AM" size={200} />
        <span className="t-14 center" style={{ color: '#888', maxWidth: 300 }}>Stand up, drink water, rest your eyes. We'll ping you a minute before it starts.</span>
        <BoxBoy pose="chairSmall" width={140} />
      </div>
      <BottomActions tone="dark"><Button variant="ghost-dark" onClick={() => go('S66')}>Back to Room 3</Button></BottomActions>
    </Screen>
  );
}

/* S69 · Lost connection */
export function S69LostConnection() {
  const go = useGo();
  const [what, setWhat] = useState('Light went off');
  const [when, setWhen] = useState(0);
  return (
    <Screen actions>
      <TopBar title="ECE 305 · Online" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={36}>LOST CONNECTION?</Display>
        <span className="t-15 muted" style={{ marginTop: -6 }}>Tell Dr. Bakare what happened. It shows on the register next to your name.</span>
        <Label>What happened?</Label>
        <div className="row wrap" style={{ gap: 8 }}>
          {['Network dropped', 'Light went off', 'Data finished', 'Phone died', 'Something else'].map((o) => <button key={o} onClick={() => setWhat(o)} className={`chip${o === what ? ' chip--on' : ''}`}>{o}</button>)}
        </div>
        <Label>When?</Label>
        <ListCard>
          {['Just now · 10:44 AM', 'Earlier in class'].map((o, i) => <ListRow key={o} title={o} onClick={() => setWhen(i)} right={<span style={{ width: 20, height: 20, borderRadius: 10, border: i === when ? '6px solid #0a0a0a' : '1.5px solid var(--u-border)' }} />} />)}
        </ListCard>
        <Card pad={16} gap={4}><span className="t-15 w-7">What happens next</span><span className="t-13 muted">Get back in and rejoin from Unify: your check-ins carry on. If you can't, Dr. Bakare sees why and can excuse it.</span></Card>
      </div>
      <BottomActions>
        <Button onClick={() => go('S66')}>Tell Dr. Bakare</Button>
        <Button variant="white" onClick={() => go('S65')}><Wifi size={16} /> I'm back — rejoin</Button>
      </BottomActions>
    </Screen>
  );
}

/* S70 · Class done */
export function S70ClassDone() {
  const go = useGo();
  return (
    <Screen actions>
      <TopBar title="ECE 305 · Online" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={44}>CLASS DONE.</Display>
        <Card pad={18} gap={6} style={{ background: 'var(--u-good-tint)', border: 0 }}>
          <Label style={{ fontSize: 11 }}>Attendance</Label>
          <span className="t-20 w-7" style={{ color: 'var(--u-good)' }}>Present ✓</span>
          <span className="t-13 muted">3 of 3 check-ins · in class 10:02 AM to 11:58 AM</span>
        </Card>
        <Label>Catch up</Label>
        <ListCard>
          <ListRow title="Week 4 · Fourier series" sub="Notes for today's class" right={<ChevronRight size={18} />} onClick={() => go('S26')} />
          <ListRow title="Class recording" sub="Dr. Bakare will add it to Week 4" />
          <ListRow title="Week 4 quiz" sub="Opens Friday · 10 questions" right={<ChevronRight size={18} />} />
        </ListCard>
      </div>
      <BottomActions>
        <Button onClick={() => go('S26')}>Open Week 4 notes</Button>
        <Button variant="white" onClick={() => go('S19')}>Back to Home</Button>
      </BottomActions>
    </Screen>
  );
}
