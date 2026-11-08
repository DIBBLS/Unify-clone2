import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, TopBar, BottomActions } from '../components/chrome';
import { Button, Checkbox, Chip, Chips, Display } from '../components/ui';
import { BoxBoy, Bubble } from '../components/brand';
import { useGo } from '../components/nav';
import { EMAIL_RE, Note, SelectInput, TextInput, useAction } from '../components/form';
import { FormStep, Next, Poster, PosterTop, S09Goal, S11PickBoxBoy } from '../screens/student/Onboarding';
import { supabase, rpc, friendly } from '../lib/supabase';
import { useAuth } from '../lib/auth';

const googleEnabled = import.meta.env.VITE_GOOGLE_SIGN_IN === 'true';
const origin = () => window.location.origin;

/* S05 · Welcome */
export function LiveWelcome() {
  const go = useGo();
  const { error, run } = useAction();
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
        {googleEnabled && (
          <Button variant="white" onClick={() => run(async () => {
            const { error: e } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: origin() } });
            if (e) throw new Error(friendly(e.message));
          })}><img src="/boxboy/google.png" width={22} alt="" /> Continue with Google</Button>
        )}
        {error && <Note>{error}</Note>}
        <button className="link-btn" style={{ color: '#fff' }} onClick={() => go('LOGIN')}>Already have an account? Log in</button>
        <div className="t-16 w-5 center" style={{ color: '#fff' }}>Own your academic journey</div>
      </>}
    />
  );
}

const Terms = () => (
  <p className="t-13 center faint" style={{ lineHeight: 1.45 }}>
    By creating an account you agree to our <a href="/screens/TERMS" className="w-6" style={{ color: 'var(--u-good)', textDecoration: 'underline' }}>Terms of Use</a> and <a href="/screens/PRIVACY" className="w-6" style={{ color: 'var(--u-good)', textDecoration: 'underline' }}>Privacy Policy</a>.
  </p>
);

/* S06 · Sign up (students). Lecturers use L02, which calls the same form with role 'lecturer'. */
export function SignUpForm({ role = 'student', onDone }: { role?: 'student' | 'lecturer'; onDone: () => void }) {
  const go = useGo();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tried, setTried] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const { busy, error, run } = useAction();
  const errs = {
    name: name.trim().length < 2 ? 'Tell us your name.' : null,
    email: !EMAIL_RE.test(email.trim()) ? 'Enter a valid email address.' : null,
    password: password.length < 8 ? 'Use at least 8 characters.' : null,
  };
  const valid = !errs.name && !errs.email && !errs.password;
  const submit = () => {
    setTried(true);
    if (!valid) return;
    run(async () => {
      const { data, error: e } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(), password,
        options: { data: { display_name: name.trim() }, emailRedirectTo: origin() },
      });
      if (e) throw new Error(/registered|exists/i.test(e.message) ? 'There is already an account with this email. Log in instead.' : friendly(e.message));
      if (data.user && data.user.identities && data.user.identities.length === 0) throw new Error('There is already an account with this email. Log in instead.');
      if (!data.session) { setCheckEmail(true); return; }
      if (role === 'lecturer') await supabase.from('profiles').update({ role: 'lecturer' }).eq('id', data.session.user.id);
      onDone();
    });
  };
  if (checkEmail) {
    return (
      <div className="stack" style={{ gap: 12 }}>
        <Note tone="good">We sent a confirmation link to <b>{email.trim()}</b>. Open it on this phone to finish creating your account.</Note>
        <button className="link-btn" onClick={() => go('LOGIN')}>Already confirmed? Log in</button>
      </div>
    );
  }
  return (
    <div className="stack" style={{ gap: 14 }}>
      <TextInput label={role === 'lecturer' ? 'Full name, with your title' : 'First name'} value={name} onChange={setName} autoComplete={role === 'lecturer' ? 'name' : 'given-name'} placeholder={role === 'lecturer' ? 'Dr. Olusegun Adeyemi' : 'Joshua'} error={tried ? errs.name : null} />
      <TextInput label="Email" type="email" inputMode="email" value={email} onChange={setEmail} autoComplete="email" placeholder="you@gmail.com"
        hint={role === 'student' ? 'Your normal Gmail. Your student email is only needed once, to claim your name for attendance.' : undefined} error={tried ? errs.email : null} />
      <TextInput label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" hint="At least 8 characters." error={tried ? errs.password : null} />
      {error && <Note>{error}</Note>}
      <Terms />
      <Next label={busy ? 'Creating your account…' : 'Create my account'} onClick={submit} disabled={busy} />
      <button className="link-btn" onClick={() => go('LOGIN')}>Already have an account? Log in</button>
    </div>
  );
}

export function LiveSignUp() {
  const go = useGo();
  return (
    <FormStep step={1} titleSize={30} title={'WHAT\nSHOULD WE\nCALL YOU?'} pose="peeking" intro="We use your first name in your good morning messages." actions={null}>
      <SignUpForm onDone={() => go('S07')} />
    </FormStep>
  );
}

/* LOGIN · Log in, with forgotten password */
export function LiveLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sent, setSent] = useState(false);
  const { busy, error, setError, run } = useAction();
  const login = () => run(async () => {
    if (!EMAIL_RE.test(email.trim()) || !password) throw new Error('Enter your email and password.');
    const { error: e } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (e) throw new Error(/invalid login/i.test(e.message) ? 'That email and password don\'t match.' : /not confirmed/i.test(e.message) ? 'Confirm your email first: open the link we sent you.' : friendly(e.message));
    navigate('/', { replace: true });
  });
  const forgot = () => run(async () => {
    if (!EMAIL_RE.test(email.trim())) { setError('Type your email above first.'); return; }
    const { error: e } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${origin()}/screens/RESET` });
    if (e) throw new Error(friendly(e.message));
    setSent(true);
  });
  return (
    <Screen actions>
      <TopBar title="Log in" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={34}>WELCOME BACK</Display>
        <TextInput label="Email" type="email" inputMode="email" value={email} onChange={setEmail} autoComplete="email" autoFocus />
        <TextInput label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
        <button className="link-btn" style={{ alignSelf: 'flex-start' }} onClick={forgot}>Forgot your password?</button>
        {sent && <Note tone="good">If there's an account for {email.trim()}, a reset link is on its way.</Note>}
        {error && <Note>{error}</Note>}
      </div>
      <BottomActions><Button onClick={login} disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</Button></BottomActions>
    </Screen>
  );
}

/* RESET · set a new password after opening the email link */
export function LiveReset() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const { busy, error, run } = useAction();
  const save = () => run(async () => {
    if (password.length < 8) throw new Error('Use at least 8 characters.');
    const { error: e } = await supabase.auth.updateUser({ password });
    if (e) throw new Error(friendly(e.message));
    window.location.assign('/');
  });
  return (
    <Screen actions>
      <TopBar title="New password" onBack={() => navigate('/')} />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={34}>SET A NEW PASSWORD</Display>
        <TextInput label="New password" type="password" value={password} onChange={setPassword} autoComplete="new-password" hint="At least 8 characters." autoFocus />
        {error && <Note>{error}</Note>}
      </div>
      <BottomActions><Button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save password'}</Button></BottomActions>
    </Screen>
  );
}

/* S07 · Department and level → joins the class for this session */
type Dept = { code: string; name: string; faculty: string };
export function LiveDepartment() {
  const go = useGo();
  const { profile, klass, refresh } = useAuth();
  const [depts, setDepts] = useState<Dept[]>([]);
  const [dept, setDept] = useState<string>(klass?.department_code ?? '');
  const [level, setLevel] = useState<number>(klass?.level ?? 0);
  const { busy, error, setError, run } = useAction();
  useEffect(() => {
    supabase.from('departments').select('code,name,faculty').order('name').then(({ data, error: e }) => {
      if (e) setError(friendly(e.message)); else setDepts((data ?? []) as Dept[]);
    });
  }, [setError]);
  const save = () => run(async () => {
    if (!dept || !level) throw new Error('Choose your department and level.');
    await rpc('join_class', { p_department: dept, p_level: level });
    await refresh();
    go(profile?.class_id ? 'S45' : 'S08');
  });
  return (
    <FormStep step={2} title={'WHICH\nDEPARTMENT?'} intro="We use this to set up the right courses and class for you."
      actions={<Next label={busy ? 'Saving…' : 'Next'} onClick={save} disabled={busy} />}>
      <SelectInput label="School" value="LASU" onChange={() => undefined} options={[{ value: 'LASU', label: 'Lagos State University (LASU)' }]} />
      <SelectInput label="Department" value={dept} onChange={setDept} placeholder="Choose your department"
        options={depts.map((d) => ({ value: d.code, label: `${d.name} (${d.faculty})` }))} />
      <div>
        <div className="field-label">Level</div>
        <Chips>{[100, 200, 300, 400, 500].map((l) => <Chip key={l} on={l === level} onClick={() => setLevel(l)}>{l}L</Chip>)}</Chips>
      </div>
      {error && <Note>{error}</Note>}
    </FormStep>
  );
}

/* S08 · The courses your class takes this semester */
type Course = { id: string; code: string; title: string; units: number };
export function LiveCourses() {
  const go = useGo();
  const { klass } = useAuth();
  const [courses, setCourses] = useState<Course[] | null>(null);
  useEffect(() => {
    if (!klass) return;
    supabase.from('class_courses').select('courses(id,code,title,units)').eq('class_id', klass.id).then(({ data }) => {
      setCourses(((data ?? []) as unknown as { courses: Course }[]).map((r) => r.courses).filter(Boolean).sort((a, b) => a.code.localeCompare(b.code)));
    });
  }, [klass]);
  return (
    <FormStep step={3} title={'YOUR\nCOURSES'} intro="These are the courses your class takes this semester. Courses from other levels can be added any time in Me."
      actions={<Next label="Continue" onClick={() => go('S09')} />}>
      <div className="t-12 w-6 faint">{klass ? `${klass.level} Level · ${klass.department_name}` : ''}</div>
      {courses === null ? <p className="t-14 muted">Loading…</p> : courses.length === 0 ? (
        <Note tone="warn">Your class's courses haven't been added yet. Your HOC or the Unify team will add them soon.</Note>
      ) : (
        <div className="stack" style={{ gap: 8 }}>
          {courses.map((c) => (
            <div key={c.id} className="row" style={{ gap: 12, padding: '12px 14px', borderRadius: 16, background: '#fff', border: '1px solid var(--u-border)' }}>
              <Checkbox checked />
              <span className="grow stack"><span className="t-14 w-7">{c.code}</span><span className="t-12 muted">{c.title}</span></span>
              <span className="t-12 w-6 faint">{c.units} units</span>
            </div>
          ))}
        </div>
      )}
    </FormStep>
  );
}

export function LiveGoal() {
  const { updateProfile } = useAuth();
  return <S09Goal onChoose={(goal) => updateProfile({ goal })} />;
}
export function LivePersona() {
  const { updateProfile } = useAuth();
  return <S11PickBoxBoy onChoose={(persona) => updateProfile({ persona })} />;
}

/* Terms and privacy: plain-language first versions. Have a lawyer review before wide launch. */
function Legal({ title, sections }: { title: string; sections: [string, string][] }) {
  return (
    <Screen>
      <TopBar title={title} />
      <div className="stack pad" style={{ gap: 14, paddingBottom: 40 }}>
        <Display size={30}>{title.toUpperCase()}</Display>
        <p className="t-12 faint">Last updated 8 November 2026</p>
        {sections.map(([h, b]) => <div key={h} className="stack" style={{ gap: 4 }}><span className="t-16 w-7">{h}</span><p className="t-14 muted" style={{ lineHeight: 1.55 }}>{b}</p></div>)}
      </div>
    </Screen>
  );
}
export const LivePrivacy = () => (
  <Legal title="Privacy Policy" sections={[
    ['What we collect', 'Your name and email when you sign up; your department, level and the choices you make in the app; your quiz results, streak and CGPA plan. If you claim your name for attendance, we keep your matric number and student email, and the attendance records your HOCs or lecturers scan.'],
    ['Why we collect it', 'To run the app for you: your courses, your progress, reminders, and accurate attendance registers for your classes.'],
    ['Who can see it', 'Your class list entry and attendance are visible only to the HOCs of your class and the lecturers who teach it. The Unify team sees totals, not names. We never sell your data and never show you ads while you study.'],
    ['How long we keep it', 'For as long as you have an account. Delete your account in Settings and your profile, progress and claims are removed. Attendance a lecturer already exported may stay in their records.'],
    ['Your rights', 'Under the Nigeria Data Protection Act you can ask to see, correct or delete your data. Email privacy@unify.ng.'],
  ]} />
);
export const LiveTerms = () => (
  <Legal title="Terms of Use" sections={[
    ['Using Unify Learn', 'Use your real name and your own matric number. Claiming someone else\'s name, sharing your attendance pass or marking someone present who isn\'t there breaks these terms and your school\'s rules.'],
    ['Notes and quizzes', 'Notes are written by student contributors from your lecturers\' materials. They are a study aid; your lecturer\'s teaching and the official syllabus come first.'],
    ['Your account', 'Keep your password private. You can delete your account at any time in Settings.'],
    ['Changes', 'We may update these terms. We\'ll tell you in the app when we do.'],
  ]} />
);
