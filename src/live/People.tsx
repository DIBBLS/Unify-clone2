import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BookOpen, CalendarCheck, ChevronRight, ClipboardList, Inbox, LogOut, ScanLine, ShieldCheck, Ticket, Trash2, Layers } from 'lucide-react';
import { Screen, TopBar, TabBar, BottomActions } from '../components/chrome';
import { Button, Card, Display, Label, ListCard, ListRow, Pill } from '../components/ui';
import { Avatar, BoxBoy } from '../components/brand';
import { useGo } from '../components/nav';
import { Note, SelectInput, TextInput, useAction } from '../components/form';
import { supabase, rpc, friendly } from '../lib/supabase';
import { useAuth, firstName, classLabel } from '../lib/auth';
import { semesterWeek, streakLength, todayIso } from '../lib/streak';
import { HomeHero, HomeSheet, ContinueCard, neededGpa, bestFinish, difficulty } from '../screens/student/Home';
import { S33WeekComplete, S36RevisionDone } from '../screens/student/Learning';
import { useMyClaim } from './Claim';

type Course = { id: string; code: string; title: string; units: number };
const Arrow = () => <ChevronRight size={18} color="#8a8a8a" />;

function useStreak() {
  const { session } = useAuth();
  const [days, setDays] = useState<string[]>([]);
  useEffect(() => {
    if (!session) return;
    supabase.from('streak_days').select('day').order('day', { ascending: false }).limit(400).then(({ data }) => setDays(((data ?? []) as { day: string }[]).map((d) => d.day)));
  }, [session]);
  return { now: streakLength(days), best: bestRun(days) };
}
function bestRun(days: string[]) {
  // longest run ending on any studied day (weekends never break)
  let best = 0;
  for (const d of days) best = Math.max(best, streakLength(days, new Date(`${d}T12:00:00`)));
  return best;
}

/** Record today as a study day (finishing a week's quiz or the day's revision). */
export async function markStudied(userId: string) {
  await supabase.from('streak_days').upsert({ user_id: userId, day: todayIso() }, { onConflict: 'user_id,day', ignoreDuplicates: true });
}

/* S19 · Home */
function useSemester() {
  const [s, setS] = useState<{ week: number | null; weeks: number }>({ week: null, weeks: 12 });
  useEffect(() => {
    supabase.from('semester').select('starts_on,weeks').maybeSingle().then(({ data }) => {
      if (data) setS({ week: semesterWeek(data.starts_on as string | null, data.weeks as number), weeks: data.weeks as number });
    });
  }, []);
  return s;
}

export function LiveHome() {
  const go = useGo();
  const { profile, klass, hocOf } = useAuth();
  const claim = useMyClaim();
  const streak = useStreak();
  const [open, setOpen] = useState<{ course_code: string; venue: string | null }[]>([]);
  const [target, setTarget] = useState<number | null>(null);
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [inbox, setInbox] = useState(0);
  const sem = useSemester();
  useEffect(() => {
    supabase.rpc('my_open_sessions').then(({ data }) => setOpen((data ?? []) as { course_code: string; venue: string | null }[]));
    supabase.from('cgpa_plans').select('target').maybeSingle().then(({ data }) => setTarget(data?.target != null ? Number(data.target) : null));
    if (klass) supabase.from('class_courses').select('courses(id,code,title,units)').eq('class_id', klass.id).then(({ data }) =>
      setCourses(((data ?? []) as unknown as { courses: Course }[]).map((r) => r.courses).filter(Boolean).sort((a, b) => a.code.localeCompare(b.code))));
    if (hocOf[0]) supabase.from('inbox_items').select('id', { count: 'exact', head: true }).eq('class_id', hocOf[0]).eq('status', 'open').then(({ count }) => setInbox(count ?? 0));
  }, [klass, hocOf]);
  const banner = open.length > 0 && (
    <button onClick={() => go(claim ? 'S59' : 'AT07')} className="row" style={{ marginTop: 12, gap: 10, width: '100%', background: '#0a0a0a', color: '#fff', borderRadius: 18, padding: '12px 14px', textAlign: 'left', position: 'relative', zIndex: 2 }}>
      <span style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--u-green)', boxShadow: '0 0 0 4px rgba(80,255,144,.25)' }} />
      <span className="grow stack"><span className="eyebrow" style={{ color: 'var(--u-green)', fontSize: 11 }}>Attendance is open</span><span className="t-13 w-5">{open[0].course_code}{open[0].venue ? ` · ${open[0].venue}` : ''}</span></span>
      <span className="t-13 w-7" style={{ background: 'var(--u-green)', color: '#0a0a0a', borderRadius: 14, padding: '7px 12px' }}>{claim ? 'Show my pass' : 'Get my pass'}</span>
    </button>
  );
  return (
    <Screen tabs>
      <HomeHero target={target} name={firstName(profile, 'there')} week={sem.week} weeks={sem.weeks} classText={klass ? `${klass.department_code} · ${klass.level}L` : 'Choose your department in Me'} streak={streak.now} banner={banner || undefined} />
      <HomeSheet>
        <div className="auto-grid">
        {claim === null && (
          <Card pad={16} gap={6} onClick={() => go('AT07')} style={{ border: '1.5px solid #0a0a0a' }}>
            <div className="row between"><span className="t-15 w-7">Claim your name for attendance</span><Arrow /></div>
            <span className="t-13 muted">One time, with your student email. Then your pass works for every class.</span>
          </Card>
        )}
        {hocOf.length > 0 && (
          <Card tone="dark" pad={16} gap={6} onClick={() => go('AT04')}>
            <div className="row between"><span className="eyebrow" style={{ color: 'var(--u-green)', fontSize: 11 }}>You're an HOC</span>{inbox > 0 && <Pill tone="bad">{inbox} waiting</Pill>}</div>
            <span className="t-15 w-6">Class list, inbox and attendance</span>
          </Card>
        )}
        {target == null && (
          <Card pad={16} gap={6} onClick={() => go('S15')}>
            <div className="row between"><span className="t-15 w-7">Set your CGPA target</span><Arrow /></div>
            <span className="t-13 muted">See exactly what you need each semester to finish where you want.</span>
          </Card>
        )}
        </div>
        <ContinueCard />
        <div className="row between" style={{ marginTop: 6 }}>
          <span className="display" style={{ fontSize: 18 }}>My courses</span>
          <button className="t-13 w-7" style={{ color: 'var(--u-good-2)' }} onClick={() => go('AT14')}>+ Other levels</button>
        </div>
        {courses === null && <p className="t-14 muted">Loading…</p>}
        {courses?.length === 0 && <Note tone="warn">Your class's courses haven't been added yet.</Note>}
        <div className="auto-grid">
        {courses?.map((c) => (
          <Card key={c.id} pad="14px 12px" gap={4} onClick={() => go('S23')} style={{ borderRadius: 20 }}>
            <div className="row" style={{ gap: 12 }}>
              <span className="display" style={{ width: 52, height: 52, borderRadius: 14, background: '#0a0a0a', color: 'var(--u-green)', display: 'grid', placeItems: 'center', fontSize: 14, lineHeight: 1.05, textAlign: 'center' }}>{c.code.replace(' ', '\n')}</span>
              <span className="grow stack"><span className="t-16 w-7">{c.code}</span><span className="t-12 w-5 muted">{c.title} · {c.units} units</span></span>
              <Arrow />
            </div>
          </Card>
        ))}
        </div>
      </HomeSheet>
      <TabBar active="home" />
    </Screen>
  );
}

/* S45/S46 · Me (HOC tools appear for HOCs) */
export function LiveMe() {
  const go = useGo();
  const navigate = useNavigate();
  const { profile, klass, hocOf, signOut } = useAuth();
  const claim = useMyClaim();
  const streak = useStreak();
  const isHoc = hocOf.length > 0;
  return (
    <Screen tabs>
      <div className="stack" style={{ background: 'var(--u-green)', padding: '24px 20px 22px', gap: 12 }}>
        <Avatar persona={(profile?.persona as 'go-getter') ?? 'go-getter'} size={72} ring />
        <Display size={30}>{(profile?.display_name ?? '').toUpperCase()}</Display>
        <span className="t-14 w-5" style={{ marginTop: -6 }}>{klass ? `${klass.department_name} · ${klass.level}L · LASU` : 'No department yet'}</span>
        <button onClick={() => go('S07')} className="t-13 w-7" style={{ alignSelf: 'flex-start', background: '#0a0a0a', color: '#fff', borderRadius: 18, padding: '8px 14px' }}>Change department or level</button>
      </div>
      <div className="stack pad" style={{ gap: 14, paddingTop: 16, paddingBottom: 24 }}>
        <div className="row" style={{ gap: 10 }}>
          {[['Current streak', `${streak.now} day${streak.now === 1 ? '' : 's'}`], ['Best streak', `${streak.best} day${streak.best === 1 ? '' : 's'}`]].map(([l, v]) => (
            <Card key={l} pad={14} gap={4} style={{ flex: 1 }}><Label style={{ fontSize: 10 }}>{l}</Label><span className="display" style={{ fontSize: 24 }}>{v}</span></Card>
          ))}
        </div>
        {isHoc && (
          <Card tone="dark" pad={0} gap={0}>
            <div className="stack" style={{ padding: '16px 16px 8px', gap: 2 }}>
              <span className="eyebrow" style={{ color: 'var(--u-green)', fontSize: 11 }}>HOC · {classLabel(klass)}</span>
              <span className="t-17 w-7">Your HOC tools</span>
            </div>
            {([[ClipboardList, 'Class list', 'Upload, check and edit', 'AT04'], [Inbox, 'Inbox', 'Clashes, requests and lecturers to confirm', 'AT15'], [ScanLine, 'Take attendance', 'Open a scan and scan passes', 'OPENSCAN'], [CalendarCheck, 'Registers', 'Past attendance lists', 'L16']] as const).map(([I, t, s, to]) => (
              <button key={t} onClick={() => go(to)} className="row" style={{ gap: 12, padding: '12px 16px', color: '#fff', textAlign: 'left', borderTop: '1px solid #222' }}>
                <span style={{ color: 'var(--u-green)' }}><I size={18} /></span>
                <span className="grow stack"><span className="t-15 w-6">{t}</span><span className="t-12" style={{ color: '#999' }}>{s}</span></span>
                <ChevronRight size={18} color="#666" />
              </button>
            ))}
          </Card>
        )}
        <ListCard>
          <ListRow leading={<Ticket size={18} />} title="Attendance pass" sub={claim ? `${claim.surname} ${claim.first_name} · ${claim.matric}` : 'Claim your name first'} right={<Arrow />} onClick={() => go(claim ? 'S59' : 'AT07')} />
          <ListRow leading={<CalendarCheck size={18} />} title="My attendance" sub="Per course, this semester" right={<Arrow />} onClick={() => go('S63')} />
          <ListRow leading={<Layers size={18} />} title="Courses from other levels" sub="Get added to another class's register" right={<Arrow />} onClick={() => go('AT14')} />
          <ListRow leading={<BookOpen size={18} />} title="CGPA plan" sub="Your target and what it takes" right={<Arrow />} onClick={() => go('S15')} />
          {!isHoc && <ListRow leading={<ShieldCheck size={18} />} title="Are you your class's HOC?" sub="Request HOC tools" right={<Arrow />} onClick={() => go('S50')} />}
          <ListRow leading={<Bell size={18} />} title="Settings" sub="Account, privacy, delete account" right={<Arrow />} onClick={() => go('S48')} />
        </ListCard>
        {profile?.role === 'admin' && <Button variant="dark" onClick={() => go('AD01')}>Open Unify admin</Button>}
        <button className="row t-15 w-7" style={{ gap: 8, color: 'var(--u-red)', padding: '6px 4px' }} onClick={async () => { await signOut(); navigate('/', { replace: true }); }}><LogOut size={18} />Log out</button>
      </div>
      <TabBar active="me" />
    </Screen>
  );
}

/* S48 · Settings: account and deletion */
export function LiveSettings() {
  const go = useGo();
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const claim = useMyClaim();
  const [confirm, setConfirm] = useState(false);
  const { busy, error, run } = useAction();
  return (
    <Screen>
      <TopBar title="Settings" />
      <div className="stack pad" style={{ gap: 12, paddingBottom: 28 }}>
        <Label>Account</Label>
        <ListCard>
          <ListRow title="Email" sub={`${session?.user.email ?? ''} · you log in with this`} />
          <ListRow title="Student email" sub={claim?.student_email ? `${claim.student_email} · name claimed for attendance` : claim ? 'Name confirmed by your HOC' : 'Not claimed yet'} right={claim ? null : <Arrow />} onClick={claim ? undefined : () => go('AT07')} />
          <ListRow title="Department and level" right={<Arrow />} onClick={() => go('S07')} />
          <ListRow title="Log out" titleStyle={{ color: 'var(--u-red)' }} onClick={async () => { await signOut(); navigate('/', { replace: true }); }} />
        </ListCard>
        <Label>About</Label>
        <ListCard>
          <ListRow title="Privacy Policy" right={<Arrow />} onClick={() => go('PRIVACY')} />
          <ListRow title="Terms of Use" right={<Arrow />} onClick={() => go('TERMS')} />
        </ListCard>
        <Label>Danger zone</Label>
        <Card pad={16} gap={10} style={{ borderColor: confirm ? 'var(--u-red)' : undefined }}>
          <span className="t-15 w-7" style={{ color: 'var(--u-red)' }}>Delete my account</span>
          <span className="t-13 muted">Removes your profile, progress and claimed name for good. Attendance already taken stays on your class's register. This can't be undone.</span>
          {confirm ? (
            <div className="row" style={{ gap: 8 }}>
              <Button small block={false} variant="danger" disabled={busy} onClick={() => run(async () => { await rpc('delete_my_account'); await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined); await signOut().catch(() => undefined); navigate('/', { replace: true }); })}><Trash2 size={14} /> {busy ? 'Deleting…' : 'Yes, delete everything'}</Button>
              <Button small block={false} variant="white" onClick={() => setConfirm(false)}>Cancel</Button>
            </div>
          ) : <Button small block={false} variant="white" onClick={() => setConfirm(true)}>Delete my account</Button>}
          {error && <Note>{error}</Note>}
        </Card>
      </div>
    </Screen>
  );
}

/* S50 · request HOC tools */
export function LiveRequestHoc() {
  const go = useGo();
  const { klass } = useAuth();
  const [phone, setPhone] = useState('');
  const [who, setWho] = useState('Level adviser');
  const [tried, setTried] = useState(false);
  const { busy, error, run } = useAction();
  const digits = phone.replace(/\D/g, '');
  const phoneErr = /^(0\d{10}|234\d{10})$/.test(digits) ? null : 'Enter a Nigerian number, e.g. 0813 000 0000';
  return (
    <Screen actions>
      <TopBar title="HOC tools" />
      <div className="stack pad" style={{ gap: 16 }}>
        <Display size={32}>ARE YOU YOUR CLASS'S HOC?</Display>
        <p className="t-15 muted">HOCs upload the class list, settle claims and take attendance. A class can have up to 3, and Unify checks every request with your department.</p>
        {!klass ? <Note tone="warn">Choose your department and level first.</Note> : <>
          <TextInput label="Your class" value={`${klass.department_name} · ${klass.level}L`} onChange={() => undefined} />
          <TextInput label="Phone number" type="tel" inputMode="tel" value={phone} onChange={setPhone} placeholder="0813 000 0000" error={tried ? phoneErr : null} hint="So the Unify team can reach you." />
          <SelectInput label="Who can confirm you're an HOC?" value={who} onChange={setWho} options={['Level adviser', 'Course adviser', 'HOD', 'Faculty officer'].map((v) => ({ value: v, label: v }))} />
        </>}
        {error && <Note>{error}</Note>}
      </div>
      <BottomActions><Button disabled={busy || !klass} onClick={() => { setTried(true); if (phoneErr) return; run(async () => { await rpc('request_hoc', { p_phone: digits, p_confirmer: who }); go('S51'); }); }}>{busy ? 'Sending…' : 'Send request'}</Button></BottomActions>
    </Screen>
  );
}

/* S51 · request status */
export function LiveRequestStatus() {
  const go = useGo();
  const { refresh, hocOf } = useAuth();
  const [req, setReq] = useState<{ status: string; created_at: string } | null | undefined>(undefined);
  useEffect(() => {
    supabase.from('hoc_requests').select('status,created_at').order('created_at', { ascending: false }).limit(1).maybeSingle().then(({ data }) => setReq(data ?? null));
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const approved = req?.status === 'approved' || hocOf.length > 0;
  const steps: [string, string, 'done' | 'now' | 'later'][] = [
    ['Request sent', req ? new Date(req.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '', 'done'],
    ['Checking with your department', 'Usually within 2 days', approved ? 'done' : req?.status === 'declined' ? 'later' : 'now'],
    ['HOC tools switched on', approved ? 'Ready in Me' : "They'll appear in Me", approved ? 'done' : 'later'],
  ];
  return (
    <Screen actions>
      <div className="stack pad" style={{ gap: 14, paddingTop: 60 }}>
        <BoxBoy pose="thumbsUpPhone" width={180} />
        <Display size={40}>{approved ? "YOU'RE AN HOC." : req?.status === 'declined' ? 'NOT APPROVED' : 'REQUEST SENT.'}</Display>
        <span className="t-15 muted">{approved ? 'Your HOC tools are on. Start by uploading your class list.' : req?.status === 'declined' ? "The Unify team couldn't confirm you as an HOC. Reach out to them if you think this is wrong." : "We'll check with your department. The app works as normal until then."}</span>
        {req !== undefined && <Card pad={16} gap={14}>
          {steps.map(([t, s, st]) => (
            <div key={t} className="row" style={{ gap: 12 }}>
              <span style={{ width: 26, height: 26, borderRadius: 13, background: st === 'done' ? 'var(--u-green)' : st === 'now' ? 'var(--u-amber)' : '#fff', border: st === 'later' ? '1px solid var(--u-border)' : 0 }} />
              <span className="stack"><span className="t-15 w-6" style={{ color: st === 'later' ? '#999' : undefined }}>{t}</span><span className="t-12 faint">{s}</span></span>
            </div>
          ))}
        </Card>}
      </div>
      <BottomActions>{approved ? <Button onClick={() => go('AT01')}>Upload the class list</Button> : <Button variant="white" onClick={() => go('S45')}>Back to Me</Button>}</BottomActions>
    </Screen>
  );
}

/* S15 · CGPA plan, saved. Units done are estimated from the level (48 units a year, 5-year degree) and editable. */
const TARGETS: [number, string][] = [[4.5, 'First Class'], [4.0, 'Second Class Upper'], [3.5, 'Second Class Upper'], [2.4, 'Second Class Lower']];
export function LiveCgpa() {
  const navigate = useNavigate();
  const { session, klass } = useAuth();
  const [cgpa, setCgpa] = useState('');
  const [done, setDone] = useState(String(Math.max(0, ((klass?.level ?? 100) / 100 - 1) * 48)));
  const [total, setTotal] = useState('240');
  const [target, setTarget] = useState<number | null>(null);
  const [own, setOwn] = useState('');
  const { busy, error, run } = useAction();
  useEffect(() => {
    supabase.from('cgpa_plans').select('cgpa,units_done,units_left,target').maybeSingle().then(({ data }) => {
      if (!data) return;
      setCgpa(Number(data.cgpa).toFixed(2)); setDone(String(data.units_done)); setTotal(String(data.units_done + data.units_left));
      if (data.target != null) setTarget(Number(data.target));
    });
  }, []);
  const c = Number(cgpa), d = Number(done), t = Number(total);
  const valid = (d === 0 || (cgpa !== '' && c >= 0 && c <= 5)) && Number.isInteger(d) && d >= 0 && Number.isInteger(t) && t > d;
  const first = d === 0;
  const best = valid ? bestFinish(first ? 0 : c, d, t) : 5;
  const chosen = own ? Number(own) : target;
  const save = () => run(async () => {
    if (!valid) throw new Error('Check your CGPA (0 to 5) and units.');
    if (chosen == null || !(chosen > 0 && chosen <= 5)) throw new Error('Pick a target, or type your own between 0 and 5.');
    const { error: e } = await supabase.from('cgpa_plans').upsert({ user_id: session!.user.id, cgpa: first ? 0 : c, units_done: d, units_left: t - d, target: chosen, updated_at: new Date().toISOString() });
    if (e) throw new Error(friendly(e.message));
    navigate('/screens/S19', { replace: true });
  });
  return (
    <Screen actions>
      <TopBar title="Plan your CGPA" />
      <div className="stack pad" style={{ gap: 14, paddingTop: 8 }}>
        <Display size={36}>{'WHERE ARE YOU,\nWHERE TO?'}</Display>
        <div className="row" style={{ gap: 10 }}>
          {!first && <TextInput label="CGPA now" value={cgpa} onChange={(v) => setCgpa(v.replace(/[^\d.]/g, '').slice(0, 4))} placeholder="4.00" style={{ flex: 1 }} />}
          <TextInput label="Units done" value={done} onChange={(v) => setDone(v.replace(/\D/g, ''))} inputMode="numeric" style={{ flex: 1 }} />
          <TextInput label="Total units" value={total} onChange={(v) => setTotal(v.replace(/\D/g, ''))} inputMode="numeric" style={{ flex: 1 }} />
        </div>
        <span className="t-12 faint" style={{ marginTop: -6 }}>Units are a guess from your level. Change them if your department's numbers are different.</span>
        {valid && !first && <p className="t-14 muted">You're on {c.toFixed(2)} with {t - d} units to go. The highest you can still finish on is {best.toFixed(2)}.</p>}
        <Label>Where do you want to finish?</Label>
        {TARGETS.map(([v, name]) => {
          const need = valid ? neededGpa(v, first ? 0 : c, d, t) : NaN;
          const dif = Number.isNaN(need) ? null : difficulty(need);
          const out = need > 5;
          const on = target === v && !own && !out;
          return (
            <button key={v} disabled={out} onClick={() => { setTarget(v); setOwn(''); }} className="row" style={{ gap: 14, padding: 16, borderRadius: 20, textAlign: 'left', background: on ? '#0a0a0a' : '#fff', border: on ? 0 : '1px solid var(--u-border)', opacity: out ? 0.6 : 1 }}>
              <span className="display" style={{ fontSize: 26, color: out ? '#999' : on ? 'var(--u-green)' : '#0a0a0a', width: 70 }}>{v.toFixed(2)}</span>
              <span className="grow stack" style={{ gap: 3 }}>
                <span className="row" style={{ gap: 8 }}><span className="t-15 w-7" style={{ color: on ? '#f5f4f0' : undefined }}>{name}</span>{dif && <span className={`pill pill--${dif.tone}`} style={{ fontSize: 10 }}>{dif.label}</span>}</span>
                {!Number.isNaN(need) && <span className="t-13" style={{ color: on ? '#999' : 'var(--u-text-2)' }}>{out ? 'Out of reach from where you are.' : `You'd need ${need.toFixed(2)} every semester.`}</span>}
              </span>
            </button>
          );
        })}
        <TextInput label="Or your own number" value={own} onChange={(v) => setOwn(v.replace(/[^\d.]/g, '').slice(0, 4))} placeholder="4.20" inputMode="text" />
        {error && <Note>{error}</Note>}
      </div>
      <BottomActions><Button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save my plan'}</Button></BottomActions>
    </Screen>
  );
}

/* S33 / S36 · finishing a week or the day's revision counts toward the streak */
/** Marks today as studied, then returns the streak including today. */
function useMarkStudied() {
  const { session } = useAuth();
  const [streak, setStreak] = useState<number | null>(null);
  useEffect(() => {
    if (!session) return;
    (async () => {
      await markStudied(session.user.id).catch(() => undefined);
      const { data } = await supabase.from('streak_days').select('day').order('day', { ascending: false }).limit(400);
      setStreak(streakLength(((data ?? []) as { day: string }[]).map((d) => d.day)));
    })();
  }, [session]);
  return streak;
}
export function LiveWeekComplete() { const streak = useMarkStudied(); return <S33WeekComplete streak={streak} />; }
export function LiveRevisionDone() { useMarkStudied(); return <S36RevisionDone />; }

