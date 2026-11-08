import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Check, ScanLine, LogOut } from 'lucide-react';
import { Screen, TabBar, BottomActions } from '../components/chrome';
import { Button, Card, Checkbox, Display, Label, ListCard, ListRow, Pill } from '../components/ui';
import { Wordmark } from '../components/brand';
import { useGo } from '../components/nav';
import { Note, useAction } from '../components/form';
import { supabase, rpc, friendly } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { SignUpForm } from './Auth';
import { Shell, Table, SmallBtn } from '../screens/admin/Admin';

/* ===================== Lecturers ===================== */

/* L02 · lecturer sign-up */
export function LiveLecturerSignUp() {
  const go = useGo();
  return (
    <Screen>
      <div className="pad" style={{ paddingTop: 16 }}><Wordmark /></div>
      <div className="stack pad" style={{ gap: 16, paddingTop: 18, paddingBottom: 32 }}>
        <Display size={34}>WHAT SHOULD WE CALL YOU?</Display>
        <span className="t-15 muted" style={{ marginTop: -6 }}>Your title and name show on your courses and to your students.</span>
        <SignUpForm role="lecturer" onDone={() => go('L04')} />
      </div>
    </Screen>
  );
}

/* L04 · the courses you teach (each class's HOC confirms you) */
type Course = { id: string; code: string; title: string; level: number | null };
export function LiveLecturerCourses() {
  const go = useGo();
  const { session, profile } = useAuth();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [had, setHad] = useState<Set<string>>(new Set());
  const [q, setQ] = useState('');
  const { busy, error, run } = useAction();
  useEffect(() => {
    if (!session) return;
    Promise.all([
      supabase.from('courses').select('id,code,title,level').order('code'),
      supabase.from('course_lecturers').select('course_id').eq('user_id', session.user.id),
    ]).then(([c, m]) => {
      setCourses((c.data ?? []) as Course[]);
      const mine = new Set(((m.data ?? []) as { course_id: string }[]).map((x) => x.course_id));
      setPicked(new Set(mine)); setHad(mine);
    });
  }, [session]);
  if (profile && profile.role !== 'lecturer') return <Navigate to="/" replace />;
  const toggle = (id: string) => setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const save = () => run(async () => {
    const add = [...picked].filter((id) => !had.has(id)).map((course_id) => ({ course_id, user_id: session!.user.id }));
    const remove = [...had].filter((id) => !picked.has(id));
    if (add.length) { const { error: e } = await supabase.from('course_lecturers').insert(add); if (e) throw new Error(friendly(e.message)); }
    if (remove.length) { const { error: e } = await supabase.from('course_lecturers').delete().eq('user_id', session!.user.id).in('course_id', remove); if (e) throw new Error(friendly(e.message)); }
    go('L07');
  });
  const ql = q.trim().toLowerCase();
  const list = (courses ?? []).filter((c) => !ql || `${c.code} ${c.title}`.toLowerCase().includes(ql));
  return (
    <Screen actions>
      <div className="pad" style={{ paddingTop: 16 }}><Wordmark /></div>
      <div className="stack pad" style={{ gap: 14, paddingTop: 18 }}>
        <Display size={34}>WHAT ARE YOU TEACHING?</Display>
        <span className="t-15 muted" style={{ marginTop: -6 }}>Pick every course you teach this semester, from any department or level. Each class's HOC confirms you.</span>
        <input className="input" placeholder="Search a course code or title" value={q} onChange={(e) => setQ(e.target.value)} />
        <ListCard>
          {courses === null && <ListRow title="Loading…" />}
          {list.map((c) => <ListRow key={c.id} leading={<Checkbox checked={picked.has(c.id)} />} title={c.code} sub={c.title} right={c.level ? <Pill>{c.level}L</Pill> : null} onClick={() => toggle(c.id)} />)}
          {courses && list.length === 0 && <ListRow title="No course found" sub="Ask the Unify team to add it." />}
        </ListCard>
        {error && <Note>{error}</Note>}
      </div>
      <BottomActions><Button disabled={busy} onClick={save}>{busy ? 'Saving…' : `Done · ${picked.size} course${picked.size === 1 ? '' : 's'}`}</Button></BottomActions>
    </Screen>
  );
}

/* L07 · lecturer home */
type Mine = { course_id: string; confirmed: boolean; courses: { code: string; title: string; level: number | null } };
type Sess = { id: string; opened_at: string; closed_at: string | null; venue: string | null; courses: { code: string } };
export function LiveLecturerHome() {
  const go = useGo();
  const navigate = useNavigate();
  const { session, profile, signOut } = useAuth();
  const [mine, setMine] = useState<Mine[] | null>(null);
  const [sessions, setSessions] = useState<Sess[]>([]);
  useEffect(() => {
    if (!session) return;
    supabase.from('course_lecturers').select('course_id,confirmed,courses(code,title,level)').eq('user_id', session.user.id).then(({ data }) => setMine((data ?? []) as unknown as Mine[]));
    supabase.from('attendance_sessions').select('id,opened_at,closed_at,venue,courses(code)').order('opened_at', { ascending: false }).limit(10).then(({ data }) => setSessions((data ?? []) as unknown as Sess[]));
  }, [session]);
  if (profile && profile.role !== 'lecturer') return <Navigate to="/" replace />;
  const confirmed = mine?.filter((m) => m.confirmed) ?? [];
  const waiting = mine?.filter((m) => !m.confirmed) ?? [];
  return (
    <Screen tabs>
      <div className="stack" style={{ background: 'var(--u-green)', padding: '14px 16px 22px', gap: 6 }}>
        <Wordmark />
        <Display size={30} style={{ marginTop: 10 }}>{(profile?.display_name ?? '').toUpperCase()}</Display>
        <span className="t-13 w-6">Unify Learn for Lecturers</span>
      </div>
      <div className="stack pad" style={{ gap: 12, paddingTop: 16, paddingBottom: 24 }}>
        <Card tone="dark" pad={18} gap={10}>
          <span className="eyebrow" style={{ color: 'var(--u-green)', fontSize: 11 }}>Attendance</span>
          <span className="t-15">Open a scan and your HOCs check students in at the door. You see the register live.</span>
          <Button variant="green" disabled={confirmed.length === 0} onClick={() => go('OPENSCAN')}><ScanLine size={16} /> Open attendance scan</Button>
          {confirmed.length === 0 && mine !== null && <span className="t-12" style={{ color: '#aaa' }}>Available once an HOC confirms one of your courses.</span>}
        </Card>
        <div className="row between"><Label>Your courses</Label><button className="t-13 w-7" style={{ color: 'var(--u-good-2)' }} onClick={() => go('L04')}>Edit</button></div>
        <ListCard>
          {mine === null && <ListRow title="Loading…" />}
          {mine?.length === 0 && <ListRow title="No courses yet" sub="Add the courses you teach." onClick={() => go('L04')} />}
          {[...confirmed, ...waiting].map((m) => (
            <ListRow key={m.course_id} title={m.courses.code} sub={`${m.courses.title}${m.courses.level ? ` · ${m.courses.level}L` : ''}`}
              right={m.confirmed ? <Pill tone="good"><Check size={11} /> Confirmed</Pill> : <Pill tone="warn">Waiting for HOC</Pill>} />
          ))}
        </ListCard>
        {sessions.length > 0 && <>
          <Label>Recent registers</Label>
          <ListCard>
            {sessions.map((s) => <ListRow key={s.id} title={`${s.courses.code}${s.venue ? ` · ${s.venue}` : ''}`} sub={`${new Date(s.opened_at).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}${s.closed_at ? '' : ' · open now'}`}
              right={s.closed_at ? null : <Pill tone="good">Live</Pill>} onClick={() => navigate(`/screens/L16?session=${s.id}`)} />)}
          </ListCard>
        </>}
        <button className="row t-15 w-7" style={{ gap: 8, color: 'var(--u-red)', padding: '6px 4px' }} onClick={async () => { await signOut(); navigate('/', { replace: true }); }}><LogOut size={18} />Log out</button>
      </div>
      <TabBar role="lecturer" active="home" />
    </Screen>
  );
}

/* ===================== Unify admin ===================== */

function AdminOnly({ children }: { children: JSX.Element }) {
  const { profile } = useAuth();
  if (!profile) return null;
  if (profile.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

type Overview = { classes: number; lists_uploaded: number; students_on_lists: number; claimed: number; hoc_requests: number; open_clashes: number;
  by_class: { class_id: string; class: string; hocs: string[]; students: number; claimed: number; clashes: number }[] };

function useOverview() {
  const [o, setO] = useState<Overview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { supabase.rpc('admin_overview').then(({ data, error }) => { if (error) setErr(friendly(error.message)); else setO(data as Overview); }); }, []);
  return { o, err };
}

export function LiveAdminOverview() {
  const go = useGo();
  const { o, err } = useOverview();
  const pct = o && o.students_on_lists ? Math.round((o.claimed / o.students_on_lists) * 100) : 0;
  return (
    <AdminOnly>
      <Shell active="Overview" title="UNIFY ADMIN" sub={new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}>
        {err && <Note>{err}</Note>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
          {([[o?.classes ?? '–', 'Classes this session', ''], [o ? `${o.lists_uploaded} / ${o.classes}` : '–', 'Class lists uploaded', o ? `${o.classes - o.lists_uploaded} still waiting` : ''],
            [o?.claimed ?? '–', 'Students claimed their name', o ? `${pct}% of ${o.students_on_lists} on the lists` : ''], [o?.hoc_requests ?? '–', 'HOC requests waiting', o?.open_clashes ? `${o.open_clashes} open clashes` : '']] as const).map(([v, l, s]) => (
            <div key={l} className="card stack" style={{ padding: 20, gap: 6 }}><span className="display" style={{ fontSize: 32 }}>{v}</span><span className="t-14 w-6">{l}</span><span className="t-12 faint">{s}</span></div>
          ))}
        </div>
        <div className="row" style={{ gap: 8 }}><SmallBtn dark onClick={() => go('AD02')}>Review HOC requests</SmallBtn><SmallBtn onClick={() => go('AD03')}>Class lists</SmallBtn></div>
      </Shell>
    </AdminOnly>
  );
}

type Req = { id: string; name: string; email: string; class: string; phone: string; confirmer: string; created_at: string; current_hocs: number; claimed: boolean };
export function LiveAdminHocRequests() {
  const [reqs, setReqs] = useState<Req[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const { busy, error, run } = useAction();
  const load = () => supabase.rpc('admin_hoc_requests').then(({ data }) => { const r = (data ?? []) as Req[]; setReqs(r); setSel((s) => (r.some((x) => x.id === s) ? s : r[0]?.id ?? null)); });
  useEffect(() => { load(); }, []);
  const r = reqs?.find((x) => x.id === sel);
  const decide = (approve: boolean) => r && run(async () => { await rpc('decide_hoc_request', { p_request: r.id, p_approve: approve }); await load(); });
  const ago = (iso: string) => { const h = Math.round((Date.now() - new Date(iso).getTime()) / 3600000); return h < 24 ? `${h} hr` : `${Math.round(h / 24)} days`; };
  return (
    <AdminOnly>
      <Shell active="HOC requests" title="HOC REQUESTS" sub="One HOC per class, up to 3 for big classes. Call the confirmer before approving.">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 380px', gap: 16, alignItems: 'start' }}>
          {reqs && reqs.length === 0 ? <p className="t-15 muted">No requests waiting.</p> : (
            <Table cols={['Student', 'Class', 'Confirms', 'Sent', 'Status']} highlight={reqs?.findIndex((x) => x.id === sel)}
              rows={(reqs ?? []).map((x) => [<button onClick={() => setSel(x.id)} className="w-6" style={{ textAlign: 'left' }}>{x.name}</button>, x.class, x.confirmer, ago(x.created_at), x.current_hocs >= 3 ? <Pill tone="bad">Full (3)</Pill> : x.current_hocs ? <Pill tone="warn">Has {x.current_hocs} HOC{x.current_hocs > 1 ? 's' : ''}</Pill> : <Pill>New</Pill>])} />
          )}
          {r && (
            <div className="card stack" style={{ padding: 24, gap: 12 }}>
              <span className="display" style={{ fontSize: 22 }}>{r.name.toUpperCase()}</span>
              <span className="t-13 muted">{r.class} · {r.email} · <a href={`tel:${r.phone}`}>{r.phone}</a> · {r.claimed ? 'claimed name ✓' : 'name not claimed yet'}</span>
              <span className="t-13">Confirmer: <b>{r.confirmer}</b></span>
              {r.current_hocs > 0 && <Note tone="warn">{r.class} already has {r.current_hocs} HOC{r.current_hocs > 1 ? 's' : ''}. {r.current_hocs >= 3 ? 'It is full.' : 'Tell them before approving.'}</Note>}
              {error && <Note>{error}</Note>}
              <div className="row" style={{ gap: 10 }}><SmallBtn green onClick={() => !busy && r.current_hocs < 3 && decide(true)}>Approve</SmallBtn><SmallBtn onClick={() => !busy && decide(false)}>Decline</SmallBtn></div>
            </div>
          )}
        </div>
      </Shell>
    </AdminOnly>
  );
}

export function LiveAdminClassLists() {
  const { o, err } = useOverview();
  const [f, setF] = useState<'all' | 'none' | 'clash'>('all');
  const rows = (o?.by_class ?? []).filter((c) => f === 'all' || (f === 'none' ? c.students === 0 : c.clashes > 0));
  return (
    <AdminOnly>
      <Shell active="Class lists" title="CLASS LISTS" sub="Every class, whether its list is up, and how many students have claimed their name.">
        {err && <Note>{err}</Note>}
        <div className="row" style={{ gap: 8 }}>
          <SmallBtn dark={f === 'all'} onClick={() => setF('all')}>All {o?.by_class.length ?? ''}</SmallBtn>
          <SmallBtn dark={f === 'none'} onClick={() => setF('none')}>No list · {o?.by_class.filter((c) => c.students === 0).length ?? ''}</SmallBtn>
          <SmallBtn dark={f === 'clash'} onClick={() => setF('clash')}>Open clashes · {o?.by_class.filter((c) => c.clashes > 0).length ?? ''}</SmallBtn>
        </div>
        <Table cols={['Class', 'HOCs', 'List', 'Students', 'Claimed', 'Clashes']} rows={rows.map((c) => [
          c.class, c.hocs.length ? c.hocs.join(', ') : 'No HOC yet', c.students ? <Pill tone="good">Uploaded</Pill> : <Pill tone="warn">No list</Pill>,
          c.students ? String(c.students) : '—', c.students ? `${c.claimed} · ${Math.round((c.claimed / c.students) * 100)}%` : '—', c.clashes ? <Pill tone="bad">{c.clashes}</Pill> : '0',
        ])} />
        <span className="t-13 faint">Unify staff see counts and status only. Names and matric numbers stay with each class's HOCs and lecturers.</span>
      </Shell>
    </AdminOnly>
  );
}

