import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Check, MessageCircle, Copy } from 'lucide-react';
import { Screen, TopBar, BottomActions } from '../components/chrome';
import { Button, Card, Chips, Display, Label, ListCard, ListRow, Pill } from '../components/ui';
import { BoxBoy, FadedBoxBoy } from '../components/brand';
import { useGo } from '../components/nav';
import { Note, TextInput, useAction } from '../components/form';
import { supabase, rpc, schoolIdentityClient, friendly } from '../lib/supabase';
import { useAuth, classLabel } from '../lib/auth';
import { isSchoolEmail, matricFromEmail, SCHOOL_DOMAIN } from '../lib/matric';

type ClaimResult = {
  status: 'claimed' | 'list_not_up' | 'not_on_list' | 'clash' | 'already_claimed_other' | 'not_school_email' | 'no_matric_in_email' | 'no_class' | 'expired';
  surname?: string; first_name?: string; middle_name?: string | null; matric?: string;
};
export type MyClaim = { surname: string; first_name: string; middle_name: string | null; matric: string; method: string; student_email: string | null } | null;
let last: ClaimResult | null = null;

export function useMyClaim() {
  const [claim, setClaim] = useState<MyClaim | undefined>(undefined);
  useEffect(() => { supabase.rpc('my_claim').then(({ data }) => setClaim((data as MyClaim) ?? null)); }, []);
  return claim;
}

const ROUTE: Record<ClaimResult['status'], string | null> = {
  claimed: 'AT08', list_not_up: 'AT10', not_on_list: 'AT11', clash: 'AT12',
  already_claimed_other: null, not_school_email: null, no_matric_in_email: null, no_class: 'S07', expired: null,
};
const MESSAGE: Partial<Record<ClaimResult['status'], string>> = {
  already_claimed_other: 'Your account already holds another name on the list. Ask your HOC to fix it.',
  not_school_email: `Use your LASU student email, ending @${SCHOOL_DOMAIN}.`,
  no_matric_in_email: 'That email has no matric number at the end. Use the one shaped firstname.lastnameMATRIC@st.lasu.edu.ng.',
  expired: 'That took too long. Start again.',
};

/* AT07 · claim your name */
export function LiveClaim() {
  const go = useGo();
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const claim = useMyClaim();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [nonce, setNonce] = useState('');
  const school = useMemo(() => schoolIdentityClient(), []);
  const { busy, error, setError, run } = useAction();
  const loginEmail = session?.user.email ?? '';

  if (!profile?.class_id) return <Navigate to="/screens/S07" replace />;
  if (claim) return <Claimed claim={claim} />;

  const finish = (r: ClaimResult) => {
    last = r;
    const to = ROUTE[r.status];
    if (to) navigate(`/screens/${to}`, { replace: true });
    else { setError(MESSAGE[r.status] ?? 'Something went wrong. Try again.'); setStep('email'); setCode(''); }
  };
  const send = () => run(async () => {
    const e = email.trim().toLowerCase();
    if (!isSchoolEmail(e)) throw new Error(MESSAGE.not_school_email);
    if (!matricFromEmail(e)) throw new Error(MESSAGE.no_matric_in_email);
    setNonce(await rpc<string>('begin_claim'));
    const { error: err } = await school.auth.signInWithOtp({ email: e, options: { shouldCreateUser: true } });
    if (err) throw new Error(/rate|seconds/i.test(err.message) ? 'Please wait a minute before asking for another code.' : friendly(err.message));
    setStep('code');
  });
  const verify = () => run(async () => {
    const e = email.trim().toLowerCase();
    const token = code.replace(/\D/g, '');
    if (token.length < 6) throw new Error('Enter the code from the email.');
    let { error: err } = await school.auth.verifyOtp({ email: e, token, type: 'email' });
    if (err) ({ error: err } = await school.auth.verifyOtp({ email: e, token, type: 'signup' }));
    if (err) throw new Error(/expired|invalid/i.test(err.message) ? "That code didn't match or has expired. Check the email or send a new one." : friendly(err.message));
    try { finish(await rpc<ClaimResult>('complete_claim', { p_nonce: nonce }, school)); }
    finally { await school.auth.signOut({ scope: 'local' }); }
  });
  const useOwn = () => run(async () => finish(await rpc<ClaimResult>('claim_with_own_email')));

  return (
    <Screen actions>
      <TopBar title="Attendance" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={30}>CLAIM YOUR NAME</Display>
        {step === 'email' ? <>
          <p className="t-15 muted">Attendance uses your class list, so your name is written the same way on every register. Prove your student email once and you're set.</p>
          <TextInput label="Your LASU student email" type="email" inputMode="email" value={email} onChange={setEmail} autoComplete="off" placeholder={`firstname.lastnameMATRIC@${SCHOOL_DOMAIN}`}
            hint={matricFromEmail(email) ? `Matric ${matricFromEmail(email)}` : 'We send a code to it. You keep logging in with your normal email.'} />
          {isSchoolEmail(loginEmail) && <button className="link-btn" style={{ alignSelf: 'flex-start' }} onClick={useOwn}>Use the student email you log in with</button>}
        </> : <>
          <p className="t-15 muted">We sent a code to <b>{email.trim()}</b>. Open your student email and type it here.</p>
          <TextInput label="Code" value={code} onChange={(v) => setCode(v.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" autoComplete="one-time-code" autoFocus placeholder="123456" />
          <button className="link-btn" style={{ alignSelf: 'flex-start' }} onClick={() => { setStep('email'); setCode(''); }}>Use a different email</button>
        </>}
        {error && <Note>{error}</Note>}
      </div>
      <BottomActions>
        {step === 'email'
          ? <Button onClick={send} disabled={busy}>{busy ? 'Sending…' : 'Send me a code'}</Button>
          : <Button onClick={verify} disabled={busy}>{busy ? 'Checking…' : 'Confirm'}</Button>}
        <button className="t-14 w-6" style={{ color: 'var(--u-good-2)' }} onClick={() => go('AT13')}>Can't get into your student email?</button>
      </BottomActions>
    </Screen>
  );
}

function Claimed({ claim }: { claim: NonNullable<MyClaim> }) {
  const go = useGo();
  return (
    <Screen actions>
      <TopBar title="Attendance" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={30}>YOU'RE ON THE LIST</Display>
        <NameCard name={`${claim.surname} ${claim.first_name} ${claim.middle_name ?? ''}`} sub={`Matric ${claim.matric}`} />
        <p className="t-13 faint">{claim.method === 'id_check' ? 'Confirmed by your HOC with your ID card.' : `Proved with ${claim.student_email}.`} Only your HOC can change this.</p>
      </div>
      <BottomActions><Button onClick={() => go('S59')}>Show my pass</Button></BottomActions>
    </Screen>
  );
}

const NameCard = ({ name, sub, eyebrow = 'From your class list' }: { name: string; sub: string; eyebrow?: string }) => (
  <Card tone="dark" pad={20} gap={6}>
    <span className="eyebrow" style={{ color: 'var(--u-green)', fontSize: 11 }}>{eyebrow}</span>
    <span className="display" style={{ fontSize: 24, color: '#fff', lineHeight: 1.1 }}>{name.trim().toUpperCase()}</span>
    <span className="t-13" style={{ color: 'rgba(255,255,255,.7)' }}>{sub}</span>
  </Card>
);

/* AT08 · is this you? */
export function LiveIsThisYou() {
  const go = useGo();
  const navigate = useNavigate();
  const { klass } = useAuth();
  const claim = useMyClaim();
  const [released, setReleased] = useState(false);
  const { busy, error, run } = useAction();
  const r = last?.status === 'claimed' ? last : claim ? { ...claim, status: 'claimed' as const } : null;
  if (claim === undefined && !last) return <Screen><TopBar title="Claim your name" /><p className="pad t-14 muted">Loading…</p></Screen>;
  if (!r && !released) return <Navigate to="/screens/AT07" replace />;
  return (
    <Screen actions>
      <TopBar title="Claim your name" />
      <div className="stack pad" style={{ gap: 14 }}>
        {released ? <>
          <Display size={30}>WE'VE TOLD YOUR HOC</Display>
          <p className="t-15 muted">That name is free again. Your HOC will check the list and get back to you.</p>
        </> : r && <>
          <Display size={30}>IS THIS YOU?</Display>
          <NameCard eyebrow={`From the ${classLabel(klass)} class list`} name={`${r.surname} ${r.first_name} ${r.middle_name ?? ''}`} sub={`Matric ${r.matric}`} />
          <p className="t-13 faint">This name and matric number are now locked to your account. Only your HOC can change them.</p>
        </>}
        {error && <Note>{error}</Note>}
      </div>
      <BottomActions>
        {released ? <Button onClick={() => navigate('/', { replace: true })}>Back to Home</Button> : <>
          <Button onClick={() => go('AT09')}>Yes, this is me</Button>
          <Button variant="white" disabled={busy} onClick={() => run(async () => { await rpc('release_claim', { p_message: "Matched a name that isn't mine" }); last = null; setReleased(true); })}>This isn't me</Button>
        </>}
      </BottomActions>
    </Screen>
  );
}

/* AT09 · on the list */
export function LiveOnTheList() {
  const go = useGo();
  return (
    <Screen bg="var(--u-green)" actions>
      <div className="stack" style={{ alignItems: 'flex-end', paddingTop: 50, paddingRight: 10 }}><FadedBoxBoy pose="thumbsUpPhone" width={280} /></div>
      <div className="stack pad" style={{ gap: 12, marginTop: 10 }}>
        <Display size={44}>{"YOU'RE ON\nTHE LIST."}</Display>
        <p className="t-15">Your name and matric number are locked to this account. Your attendance pass is ready for every class you take.</p>
      </div>
      <BottomActions tone="green"><Button variant="dark" onClick={() => go('S59')}>Show my pass</Button></BottomActions>
    </Screen>
  );
}

/* AT10 · list not up yet: we can't push-notify the HOC yet, so the student asks them on WhatsApp in one tap */
export function LiveListNotUp() {
  const { klass } = useAuth();
  const [hocs, setHocs] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => { supabase.rpc('class_list_status').then(({ data }) => setHocs(((data as { hocs?: string[] } | null)?.hocs) ?? [])); }, []);
  const msg = `Hi${hocs?.length ? ` ${hocs[0].split(' ')[0]}` : ''}, please upload our ${classLabel(klass)} class list on Unify Learn so we can claim our names and get our attendance passes: ${window.location.origin}`;
  return (
    <Screen actions>
      <TopBar title="Attendance" />
      <div className="stack pad" style={{ gap: 14 }}>
        <BoxBoy pose="peeking" width={200} style={{ alignSelf: 'center' }} />
        <Display size={30}>YOUR CLASS LIST ISN'T UP YET</Display>
        <p className="t-15 muted">Your HOC uploads the list once. As soon as it's up, come back here and claim your name.</p>
        <ListCard>
          {hocs === null ? <ListRow title="Loading…" /> : hocs.length ? hocs.map((h) => <ListRow key={h} title={h} sub={`HOC, ${classLabel(klass)}`} right={<Pill tone="dark">HOC</Pill>} />)
            : <ListRow title="Your class has no HOC on Unify yet" sub="If you're the HOC, request HOC tools in Me." />}
        </ListCard>
      </div>
      <BottomActions>
        <Button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener')}><MessageCircle size={16} /> Ask on WhatsApp</Button>
        <Button variant="white" onClick={() => navigator.clipboard?.writeText(msg).then(() => setCopied(true))}>{copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy the message</>}</Button>
      </BottomActions>
    </Screen>
  );
}

/* AT11 · not on the list (the request is already in the HOC's inbox) */
export function LiveNotOnList() {
  const go = useGo();
  const navigate = useNavigate();
  const { klass } = useAuth();
  return (
    <Screen actions>
      <TopBar title="Claim your name" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={30}>YOU'RE NOT ON THE LIST YET</Display>
        <p className="t-15 muted">Matric {last?.matric ?? ''} isn't on the {classLabel(klass)} class list. This often happens to direct-entry and transfer students.</p>
        <Note tone="good">We've asked your HOCs to add you. Come back and claim your name once they do.</Note>
        <ListCard>
          <ListRow title="Wrong class?" sub={`You're set as ${classLabel(klass)}. Change it if that's not right.`} onClick={() => go('S07')} />
        </ListCard>
      </div>
      <BottomActions><Button onClick={() => navigate('/', { replace: true })}>Back to Home</Button></BottomActions>
    </Screen>
  );
}

/* AT12 · matric already claimed: message the HOC */
export function LiveAlreadyClaimed() {
  const { profile, klass } = useAuth();
  const matric = last?.matric ?? '';
  const [msg, setMsg] = useState(`Someone claimed my matric number. I'm ${profile?.display_name ?? ''}, ${classLabel(klass)}, ${matric}. I can show my ID card.`);
  const [sent, setSent] = useState(false);
  const { busy, error, run } = useAction();
  return (
    <Screen actions>
      <TopBar title="Claim your name" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={30}>THIS MATRIC NUMBER IS ALREADY CLAIMED</Display>
        <p className="t-15 muted">Another account has {matric || 'this matric number'}. Your HOC sees both accounts and decides.</p>
        <Label>Message to your HOC</Label>
        <textarea className="input" value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={400} style={{ height: 120, padding: 16, resize: 'none', border: '1.5px solid #0a0a0a', lineHeight: 1.45 }} />
        {sent && <Note tone="good">Sent to your HOCs. They'll settle it in their inbox.</Note>}
        {error && <Note>{error}</Note>}
      </div>
      <BottomActions hint="Until your HOC decides, you can't get a pass for this matric number.">
        <Button disabled={busy || sent || !matric} onClick={() => run(async () => { await rpc('message_hoc', { p_kind: 'clash', p_matric: matric, p_message: msg.trim() }); setSent(true); })}>{sent ? 'Sent' : 'Send to my HOC'}</Button>
      </BottomActions>
    </Screen>
  );
}

/* AT13 · no access to the student email: the HOC checks the ID card */
export function LiveShowIdCard() {
  const { profile, klass } = useAuth();
  const [matric, setMatric] = useState('');
  const [sent, setSent] = useState(false);
  const { busy, error, run } = useAction();
  return (
    <Screen actions>
      <TopBar title="Claim your name" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={30}>SHOW YOUR ID CARD TO YOUR HOC</Display>
        <p className="t-15 muted">No access to your student email? Your HOC can confirm you in person.</p>
        {sent ? (
          <Card tone="dark" pad={20} gap={6}>
            <span className="eyebrow" style={{ color: 'var(--u-green)', fontSize: 11 }}>Claim request sent</span>
            <span className="display" style={{ fontSize: 22, color: '#fff' }}>{(profile?.display_name ?? '').toUpperCase()}</span>
            <span className="t-13" style={{ color: 'rgba(255,255,255,.7)' }}>Matric {matric} · {classLabel(klass)}</span>
          </Card>
        ) : (
          <TextInput label="Your matric number" value={matric} onChange={(v) => setMatric(v.replace(/\D/g, '').slice(0, 12))} inputMode="numeric" hint="Exactly as on your ID card." />
        )}
        <Card pad={16} gap={12}>
          {[['Find your HOC in class', 'Take your LASU ID card.'], ['They check your card', 'Name, matric number and photo.'], ['Your pass unlocks', 'Open Attendance again after they confirm.']].map(([t, s], i) => (
            <div key={t} className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
              <span style={{ width: 30, height: 30, borderRadius: 15, display: 'grid', placeItems: 'center', background: 'var(--u-card-2)', color: '#8a8a8a', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{i + 1}</span>
              <span className="stack" style={{ gap: 2 }}><span className="t-15 w-6">{t}</span><span className="t-13 faint">{s}</span></span>
            </div>
          ))}
        </Card>
        {error && <Note>{error}</Note>}
      </div>
      {!sent && <BottomActions><Button disabled={busy} onClick={() => run(async () => {
        if (!/^\d{6,12}$/.test(matric)) throw new Error('Enter your matric number (6 to 12 digits).');
        await rpc('message_hoc', { p_kind: 'id_check', p_matric: matric, p_message: "Can't get into my student email" }); setSent(true);
      })}>Ask my HOC to check my ID</Button></BottomActions>}
    </Screen>
  );
}

/* AT14 · courses from other levels: ask that class's HOC to add you to the register */
type CourseRow = { id: string; code: string; title: string; level: number | null };
type Reg = { course_id: string; status: string };
export function LivePriorityCourses() {
  const go = useGo();
  const { klass } = useAuth();
  const [courses, setCourses] = useState<CourseRow[] | null>(null);
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [regs, setRegs] = useState<Map<string, string>>(new Map());
  const [q, setQ] = useState('');
  const { busy, error, setError, run } = useAction();
  const load = async () => {
    const [c, cc, r] = await Promise.all([
      supabase.from('courses').select('id,code,title,level').order('code'),
      klass ? supabase.from('class_courses').select('course_id').eq('class_id', klass.id) : Promise.resolve({ data: [] as { course_id: string }[] }),
      supabase.from('priority_registrations').select('course_id,status'),
    ]);
    setCourses((c.data ?? []) as CourseRow[]);
    setMine(new Set(((cc.data ?? []) as { course_id: string }[]).map((x) => x.course_id)));
    setRegs(new Map(((r.data ?? []) as Reg[]).map((x) => [x.course_id, x.status])));
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [klass?.id]);
  const ask = (id: string) => run(async () => {
    const res = await rpc<{ status: string }>('request_priority', { p_course: id });
    if (res.status === 'claim_first') { go('AT07'); return; }
    if (res.status === 'no_class_for_course') { setError('No class has this course on Unify yet, so there is no register to join.'); return; }
    await load();
  });
  const ql = q.trim().toLowerCase();
  const list = (courses ?? []).filter((c) => !mine.has(c.id) && (!ql || `${c.code} ${c.title}`.toLowerCase().includes(ql)));
  return (
    <Screen>
      <TopBar title="Priority courses" />
      <div className="stack pad" style={{ gap: 14, paddingBottom: 28 }}>
        <Chips><Pill tone="amber">PRIORITY</Pill></Chips>
        <Display size={30}>COURSES FROM OTHER LEVELS</Display>
        <p className="t-15 muted">Taking a course with another level? Ask that class's HOC to add you to its register so your attendance counts.</p>
        <input className="input" placeholder="Search a course code or title" value={q} onChange={(e) => setQ(e.target.value)} />
        {error && <Note>{error}</Note>}
        <ListCard>
          {courses === null && <ListRow title="Loading…" />}
          {list.map((c) => {
            const st = regs.get(c.id);
            return <ListRow key={c.id} title={c.code} sub={`${c.title}${c.level ? ` · ${c.level}L` : ''}`}
              right={st === 'approved' ? <Pill tone="good">On the register</Pill> : st === 'requested' ? <Pill tone="warn">Asked</Pill>
                : <Button small block={false} variant={st === 'declined' ? 'white' : 'green'} disabled={busy} onClick={() => ask(c.id)}>{st === 'declined' ? 'Ask again' : 'Ask'}</Button>} />;
          })}
          {courses && list.length === 0 && <ListRow title="No other courses found" />}
        </ListCard>
        <p className="t-13 faint">Your name and matric come from your own class list, so the HOC only has to tap Approve.</p>
      </div>
    </Screen>
  );
}
