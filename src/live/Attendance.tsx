import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Camera, Check, Download, Keyboard, X } from 'lucide-react';
import QRCode from 'qrcode';
import { Screen, TopBar, BottomActions } from '../components/chrome';
import { Button, Card, Display, Label, ListCard, ListRow, Pill, ProgressBar } from '../components/ui';
import { Note, SelectInput, TextInput, useAction } from '../components/form';
import { useGo } from '../components/nav';
import { supabase, rpc, friendly } from '../lib/supabase';
import { useAuth, classLabel } from '../lib/auth';
import { useMyClaim } from './Claim';
import { useHocClass } from './ClassList';

type OpenSession = { id: string; course_code: string; course_title: string; venue: string | null; opened_at: string };
type Pass = { status: 'ok' | 'closed' | 'claim_first' | 'not_registered'; token?: string; expires_in?: number };

/* S59 · attendance pass: a QR code that changes every 30 seconds */
export function LivePass() {
  const go = useGo();
  const { klass } = useAuth();
  const claim = useMyClaim();
  const [sessions, setSessions] = useState<OpenSession[] | null>(null);
  const [sel, setSel] = useState<string>('');
  const [pass, setPass] = useState<Pass | null>(null);
  const [qr, setQr] = useState('');
  const [left, setLeft] = useState(30);
  const [err, setErr] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    const { data, error } = await supabase.rpc('my_open_sessions');
    if (error) { setErr(friendly(error.message)); return; }
    const list = (data ?? []) as OpenSession[];
    setSessions(list);
    setSel((s) => (list.some((x) => x.id === s) ? s : list[0]?.id ?? ''));
  }, []);
  useEffect(() => { loadSessions(); const t = setInterval(loadSessions, 20000); return () => clearInterval(t); }, [loadSessions]);

  // fetch a fresh token whenever the window rolls over
  useEffect(() => {
    if (!sel || !claim) return;
    let timer: ReturnType<typeof setTimeout>; let alive = true;
    const tick = async () => {
      const { data, error } = await supabase.rpc('pass_token', { p_session: sel });
      if (!alive) return;
      if (error) { setErr(friendly(error.message)); timer = setTimeout(tick, 5000); return; }
      const p = data as Pass; setPass(p); setErr(null);
      if (p.status === 'ok' && p.token) {
        setQr(await QRCode.toDataURL(p.token, { margin: 1, width: 260, errorCorrectionLevel: 'M' }));
        setLeft(p.expires_in ?? 30);
        timer = setTimeout(tick, Math.max(1, p.expires_in ?? 30) * 1000 + 250);
      } else if (p.status === 'closed') loadSessions();
    };
    tick();
    return () => { alive = false; clearTimeout(timer); };
  }, [sel, claim, loadSessions]);
  useEffect(() => { const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000); return () => clearInterval(t); }, []);

  if (claim === null) return <Navigate to="/screens/AT07" replace />;
  const current = sessions?.find((s) => s.id === sel);
  return (
    <Screen bg="#0a0a0a" style={{ color: '#fff' }}>
      <TopBar title="Attendance pass" dark />
      <div className="stack" style={{ alignItems: 'center', gap: 14, padding: '10px 24px 30px' }}>
        {err && <Note>{err}</Note>}
        {sessions === null || claim === undefined ? <span className="t-14" style={{ color: '#aaa' }}>Loading…</span>
          : sessions.length === 0 ? (
            <>
              <Display size={28} color="#fff" style={{ textAlign: 'center', marginTop: 30 }}>NO SCAN OPEN RIGHT NOW</Display>
              <p className="t-14 center" style={{ color: '#aaa', maxWidth: 300 }}>Your pass appears here when your lecturer or HOC opens attendance for a class you take. This page checks every 20 seconds.</p>
            </>
          ) : (
            <>
              {sessions.length > 1 ? (
                <div style={{ width: '100%' }}><SelectInput label="Class" value={sel} onChange={setSel} options={sessions.map((s) => ({ value: s.id, label: `${s.course_code}${s.venue ? ` · ${s.venue}` : ''}` }))} /></div>
              ) : <span className="t-13 w-6" style={{ color: 'var(--u-green)' }}>{current?.course_code}{current?.venue ? ` · ${current.venue}` : ''} · scan is open</span>}
              {pass?.status === 'not_registered' ? (
                <Card pad={18} gap={8} style={{ background: '#1a1a1a', border: 0, color: '#fff', width: '100%' }}>
                  <span className="t-15 w-6">You're not on this class's register</span>
                  <span className="t-13" style={{ color: '#aaa' }}>If you take {current?.course_code} with another level, ask their HOC to add you.</span>
                  <Button small variant="green" onClick={() => go('AT14')}>Ask to be added</Button>
                </Card>
              ) : (
                <>
                  <div style={{ padding: 12, borderRadius: 24, background: 'var(--u-green)' }}>
                    {qr ? <img src={qr} alt="Attendance pass code" width={236} height={236} style={{ display: 'block', borderRadius: 14, background: '#fff' }} /> : <div style={{ width: 236, height: 236 }} />}
                  </div>
                  <Display size={26} color="#fff" style={{ textAlign: 'center' }}>{claim ? `${claim.surname} ${claim.first_name}` : ''}</Display>
                  <span className="t-14" style={{ color: '#aaa', marginTop: -8 }}>{klass ? `${klass.department_name} · ${klass.level}L` : ''}</span>
                  <span className="t-14 w-6">Matric {claim?.matric.slice(0, 4)}••••{claim?.matric.slice(-1)}</span>
                  <div style={{ width: '100%' }}><ProgressBar value={left / 30} track="#2a2a2a" /></div>
                  <span className="t-13 w-6" style={{ color: 'var(--u-green)' }}>New code in 0:{String(left).padStart(2, '0')}</span>
                </>
              )}
            </>
          )}
        {pass?.status === 'ok' && <span className="t-13 center" style={{ color: '#888', maxWidth: 320 }}>Hold this up to your HOC. The code changes every 30 seconds, so a screenshot won't work. You need data for it to refresh.</span>}
      </div>
    </Screen>
  );
}

/* OPENSCAN · lecturer or HOC opens attendance for a class */
type Option = { course_id: string; class_id: string; label: string };
export function LiveOpenScan() {
  const navigate = useNavigate();
  const { profile, session } = useAuth();
  const { classId: hocClass, label: hocLabel } = useHocClass();
  const [options, setOptions] = useState<Option[] | null>(null);
  const [pick, setPick] = useState('');
  const [venue, setVenue] = useState('');
  const { busy, error, run } = useAction();
  useEffect(() => {
    (async () => {
      const out: Option[] = [];
      if (hocClass) {
        const { data } = await supabase.from('class_courses').select('course_id,courses(code,title)').eq('class_id', hocClass);
        for (const r of (data ?? []) as unknown as { course_id: string; courses: { code: string; title: string } }[]) out.push({ course_id: r.course_id, class_id: hocClass, label: `${r.courses.code} · ${hocLabel}` });
      }
      if (profile?.role === 'lecturer' && session) {
        const { data: mine } = await supabase.from('course_lecturers').select('course_id,courses(code)').eq('user_id', session.user.id).eq('confirmed', true);
        for (const m of (mine ?? []) as unknown as { course_id: string; courses: { code: string } }[]) {
          const { data: cls } = await supabase.from('class_courses').select('class_id,classes(level,department_code)').eq('course_id', m.course_id);
          for (const c of (cls ?? []) as unknown as { class_id: string; classes: { level: number; department_code: string } }[]) {
            if (!out.some((o) => o.course_id === m.course_id && o.class_id === c.class_id)) out.push({ course_id: m.course_id, class_id: c.class_id, label: `${m.courses.code} · ${c.classes.level}L ${c.classes.department_code}` });
          }
        }
      }
      setOptions(out); setPick(out[0] ? `${out[0].course_id}|${out[0].class_id}` : '');
    })();
  }, [hocClass, hocLabel, profile?.role, session]);
  const open = () => run(async () => {
    const [course, klass] = pick.split('|');
    if (!course) throw new Error('Choose a class.');
    const id = await rpc<string>('open_attendance', { p_course: course, p_class: klass, p_venue: venue.trim() || null });
    navigate(`/screens/S61?session=${id}`);
  });
  return (
    <Screen actions>
      <TopBar title="Take attendance" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={30}>OPEN A SCAN</Display>
        <p className="t-15 muted">Students show their pass at the door. Every HOC of the class can scan at the same time, and the lecturer sees the register live.</p>
        {options === null ? <p className="t-14 muted">Loading…</p> : options.length === 0 ? (
          <Note tone="warn">{profile?.role === 'lecturer' ? "None of your courses are confirmed yet. Each class's HOC confirms you in their inbox." : 'Your class has no courses on Unify yet.'}</Note>
        ) : <>
          <SelectInput label="Class" value={pick} onChange={setPick} options={options.map((o) => ({ value: `${o.course_id}|${o.class_id}`, label: o.label }))} />
          <TextInput label="Venue (optional)" value={venue} onChange={setVenue} placeholder="ETF Hall" />
        </>}
        {error && <Note>{error}</Note>}
      </div>
      <BottomActions><Button disabled={busy || !pick} onClick={open}>{busy ? 'Opening…' : 'Open attendance'}</Button></BottomActions>
    </Screen>
  );
}

/* S61 · camera scanner */
type ScanResult = { status: string; name?: string; matric?: string; level?: string; at?: string };
type Summary = { session: { id: string; venue: string | null; opened_at: string; closed_at: string | null; course: string }; present: number; on_list: number; typed: number;
  records: { name: string | null; matric: string | null; method: string; at: string; by: string | null }[];
  absent: { name: string; matric: string; carryover: boolean }[] };
const RESULT: Record<string, [string, 'good' | 'warn' | 'bad']> = {
  present: ['present', 'good'], already: ['already scanned', 'warn'], not_registered: ['not on this register', 'bad'],
  expired: ['old code: ask them to refresh', 'warn'], invalid: ["not a Unify pass", 'bad'], closed: ['scan is closed', 'bad'], not_allowed: ["you can't scan this class", 'bad'],
};
export function LiveScanner() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get('session') ?? '';
  const video = useRef<HTMLVideoElement>(null);
  const lastSeen = useRef<Map<string, number>>(new Map());
  const settled = useRef<Set<string>>(new Set()); // students this phone has already shown as present or already scanned
  const [results, setResults] = useState<(ScanResult & { key: number })[]>([]);
  const [sum, setSum] = useState<Summary | null>(null);
  const [camErr, setCamErr] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [matric, setMatric] = useState('');
  const { busy, error, run } = useAction();

  const refresh = useCallback(async () => {
    const { data } = await supabase.rpc('session_attendance', { p_session: sessionId });
    if (data) setSum(data as Summary);
  }, [sessionId]);
  useEffect(() => { refresh(); const t = setInterval(refresh, 6000); return () => clearInterval(t); }, [refresh]);

  const push = (r: ScanResult) => {
    setResults((x) => [{ ...r, key: Date.now() + Math.random() }, ...x].slice(0, 6));
    if (r.status === 'present') { navigator.vibrate?.(60); refresh(); }
    else navigator.vibrate?.([40, 60, 40]);
  };

  useEffect(() => {
    if (!sessionId) return;
    let stop: (() => void) | undefined; let cancelled = false;
    (async () => {
      try {
        const { BrowserQRCodeReader } = await import('@zxing/browser');
        const reader = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 150 });
        const controls = await reader.decodeFromConstraints({ video: { facingMode: 'environment' } }, video.current!, async (res) => {
          if (!res) return;
          const token = res.getText();
          const who = token.split('.')[1] ?? token;
          const now = Date.now();
          if (settled.current.has(who)) return; // already green or amber in the feed: a pass held up for a few seconds
          if ((lastSeen.current.get(who) ?? 0) > now - 4000) return; // a failed read retried too fast
          lastSeen.current.set(who, now);
          try {
            const r = await rpc<ScanResult>('record_scan', { p_token: token });
            if (r.status === 'present' || r.status === 'already') settled.current.add(who);
            push(r);
          }
          catch (e) { push({ status: 'error', name: e instanceof Error ? e.message : 'Network problem' }); }
        });
        if (cancelled) controls.stop(); else stop = () => controls.stop();
      } catch (e) {
        const m = e instanceof Error ? e.message : '';
        setCamErr(/Permission|NotAllowed/i.test(m) ? 'Allow camera access in your browser to scan passes.' : /NotFound|Requested device/i.test(m) ? 'No camera found on this device.' : 'The camera could not start. You can still type matric numbers.');
      }
    })();
    return () => { cancelled = true; stop?.(); };
  }, [sessionId]);

  if (!sessionId) return <Navigate to="/screens/OPENSCAN" replace />;
  const closed = Boolean(sum?.session.closed_at);
  return (
    <Screen bg="#0a0a0a" style={{ color: '#fff' }}>
      <TopBar title="Scan attendance" dark />
      <span className="eyebrow pad" style={{ color: '#888', fontSize: 11 }}>{sum ? `${sum.session.course}${sum.session.venue ? ` · ${sum.session.venue}` : ''}` : ''}{closed ? ' · CLOSED' : ''}</span>
      <div className="pad" style={{ paddingTop: 12 }}>
        <div style={{ position: 'relative', height: 300, borderRadius: 24, background: '#1a1a1a', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
          <video ref={video} muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <span style={{ position: 'relative', width: 200, height: 200, border: '3px solid var(--u-green)', borderRadius: 24 }} />
          {camErr && <span className="row t-13" style={{ position: 'absolute', bottom: 14, left: 14, right: 14, gap: 6, color: '#ddd' }}><Camera size={16} />{camErr}</span>}
        </div>
      </div>
      <div className="stack pad" style={{ gap: 8, paddingTop: 14, paddingBottom: 28 }}>
        {results.map((r) => {
          const [text, tone] = RESULT[r.status] ?? [r.name ?? 'error', 'bad'];
          return (
            <div key={r.key} className="row" style={{ gap: 10, padding: 12, borderRadius: 14, background: '#161616' }}>
              <span style={{ width: 26, height: 26, borderRadius: 13, display: 'grid', placeItems: 'center', flexShrink: 0, background: tone === 'good' ? 'var(--u-green)' : tone === 'warn' ? 'var(--u-amber)' : 'var(--u-red)' }}>
                {tone === 'good' ? <Check size={14} strokeWidth={3} color="#0a0a0a" /> : tone === 'warn' ? <AlertTriangle size={13} color="#0a0a0a" /> : <X size={14} color="#fff" strokeWidth={3} />}
              </span>
              <span className="stack"><span className="t-14 w-7">{r.status === 'error' ? 'Not recorded' : r.name ?? (r.matric ? `Matric ${r.matric}` : 'Unknown pass')}</span><span className="t-12" style={{ color: '#999' }}>{r.status === 'error' ? r.name : `${r.matric && r.name ? `${r.matric} · ` : ''}${r.level ? `${r.level} · ` : ''}${text}`}</span></span>
            </div>
          );
        })}
        <div className="row" style={{ gap: 12, marginTop: 6 }}>
          <span className="display" style={{ fontSize: 40, color: 'var(--u-green)' }}>{sum?.present ?? 0}</span>
          <span className="stack"><span className="t-13 w-7">OF {sum?.on_list ?? '–'} ON THE LIST</span><span className="t-12" style={{ color: '#999' }}>{sum?.typed ? `${sum.typed} typed in · ` : ''}updates every few seconds</span></span>
        </div>
        {typing && (
          <div className="stack" style={{ gap: 8, background: '#161616', padding: 14, borderRadius: 16 }}>
            <TextInput label="Matric number" value={matric} onChange={(v) => setMatric(v.replace(/\D/g, '').slice(0, 12))} inputMode="numeric" autoFocus />
            <Button small variant="green" disabled={busy || matric.length < 6} onClick={() => run(async () => { push(await rpc<ScanResult>('record_typed', { p_session: sessionId, p_matric: matric })); setMatric(''); })}>Mark present</Button>
          </div>
        )}
        {error && <Note>{error}</Note>}
        <div className="row" style={{ gap: 10 }}>
          <Button variant="ghost-dark" onClick={() => setTyping((t) => !t)}><Keyboard size={16} /> Type matric no.</Button>
          {!closed && <Button variant="danger" disabled={busy} onClick={() => run(async () => { await rpc('close_attendance', { p_session: sessionId }); navigate(`/screens/L16?session=${sessionId}`, { replace: true }); })}>Close scan</Button>}
        </div>
      </div>
    </Screen>
  );
}

/* L16 · the register for one session (lecturers and HOCs) */
export function LiveRegister() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState(params.get('session') ?? '');
  const [sum, setSum] = useState<Summary | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (sessionId) return;
    supabase.from('attendance_sessions').select('id').order('opened_at', { ascending: false }).limit(1).then(({ data }) => {
      if (data?.[0]) setSessionId(data[0].id); else setErr('No attendance has been taken yet.');
    });
  }, [sessionId]);
  useEffect(() => {
    if (!sessionId) return;
    supabase.rpc('session_attendance', { p_session: sessionId }).then(({ data, error }) => { if (error) setErr(friendly(error.message)); else setSum(data as Summary); });
  }, [sessionId]);
  const csv = () => {
    if (!sum) return;
    // Everyone on the register, A to Z, present or absent: the shape lecturers already keep in Excel.
    const all = [
      ...sum.records.map((r) => ({ name: r.name ?? '', matric: r.matric ?? '', status: 'Present', how: r.method === 'typed' ? 'Typed by HOC' : 'Scanned', time: new Date(r.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), by: r.by ?? '' })),
      ...sum.absent.map((a) => ({ name: a.name, matric: a.matric, status: 'Absent', how: a.carryover ? 'Carryover' : '', time: '', by: '' })),
    ].sort((a, b) => a.name.localeCompare(b.name));
    const head = [[`${sum.session.course} attendance`, new Date(sum.session.opened_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), sum.session.venue ?? '', `${sum.present} of ${sum.on_list} present`], []];
    const rows = [...head, ['Name', 'Matric', 'Status', 'How', 'Time', 'By'], ...all.map((r) => [r.name, r.matric, r.status, r.how, r.time, r.by])];
    const blob = new Blob([rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `${sum.session.course} attendance ${new Date(sum.session.opened_at).toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(a.href);
  };
  const t = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });
  return (
    <Screen>
      <TopBar title="Register" />
      <div className="stack pad" style={{ gap: 12, paddingBottom: 28 }}>
        {err && <Note tone="warn">{err}</Note>}
        {sum && <>
          <Display size={30}>{sum.session.course} ATTENDANCE</Display>
          <span className="t-12 faint" style={{ marginTop: -6 }}>{new Date(sum.session.opened_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}{sum.session.venue ? ` · ${sum.session.venue}` : ''} · {sum.session.closed_at ? `scan closed ${t(sum.session.closed_at)}` : 'scan open'}</span>
          <div className="row" style={{ gap: 8 }}>
            {[[sum.present, `present of ${sum.on_list}`], [sum.typed, 'typed in']].map(([n, l]) => <Card key={l as string} pad={12} gap={2} style={{ flex: 1 }}><span className="display" style={{ fontSize: 24 }}>{n}</span><span className="t-12 muted">{l}</span></Card>)}
          </div>
          {!sum.session.closed_at && <Button variant="dark" onClick={() => navigate(`/screens/S61?session=${sum.session.id}`)}>Back to scanning</Button>}
          <Label>Present · {sum.present}</Label>
          <ListCard>
            {sum.records.length === 0 && <ListRow title="Nobody scanned yet" />}
            {sum.records.map((r, i) => <ListRow key={i} title={r.name ?? 'Unknown'} sub={`${r.matric ?? ''} · ${t(r.at)}${r.by ? ` · by ${r.by}` : ''}`} right={r.method === 'typed' ? <Pill tone="warn">Typed</Pill> : null} />)}
          </ListCard>
          {sum.absent.length > 0 && <>
            <Label>{sum.session.closed_at ? 'Absent' : 'Not in yet'} · {sum.absent.length}</Label>
            <ListCard>
              {sum.absent.map((a) => <ListRow key={a.matric} title={a.name} sub={a.matric} right={a.carryover ? <Pill tone="grey">Carryover</Pill> : null} />)}
            </ListCard>
          </>}
          <Button variant="white" onClick={csv}><Download size={16} /> Save the list (CSV for Excel)</Button>
        </>}
      </div>
    </Screen>
  );
}

/* S63 · my attendance, per course */
export function LiveMyAttendance() {
  const { session, klass } = useAuth();
  const [rows, setRows] = useState<{ code: string; title: string; came: number; held: number }[] | null>(null);
  useEffect(() => {
    if (!session) return;
    (async () => {
      const [{ data: s }, { data: r }] = await Promise.all([
        supabase.from('attendance_sessions').select('id,courses(code,title)'),
        supabase.rpc('my_claim').then(async ({ data: c }) => (c ? supabase.from('attendance_records').select('session_id').eq('entry_id', (c as { entry_id: string }).entry_id) : { data: [] })),
      ]);
      const mine = new Set(((r ?? []) as { session_id: string }[]).map((x) => x.session_id));
      const by = new Map<string, { code: string; title: string; came: number; held: number }>();
      for (const x of (s ?? []) as unknown as { id: string; courses: { code: string; title: string } }[]) {
        const k = x.courses.code; const v = by.get(k) ?? { code: k, title: x.courses.title, came: 0, held: 0 };
        v.held++; if (mine.has(x.id)) v.came++; by.set(k, v);
      }
      setRows([...by.values()].sort((a, b) => a.came / a.held - b.came / b.held));
    })();
  }, [session]);
  const low = rows?.filter((x) => x.held > 0 && x.came / x.held < 0.75) ?? [];
  return (
    <Screen>
      <TopBar />
      <div className="stack pad" style={{ gap: 12, paddingBottom: 28 }}>
        <Display size={34}>MY ATTENDANCE</Display>
        <span className="t-14 w-5 muted" style={{ marginTop: -6 }}>{classLabel(klass)} · this semester</span>
        {low.length > 0 && <Note tone="warn">{low.map((x) => x.code).join(', ')} {low.length === 1 ? 'is' : 'are'} below 75%. Many departments need 75% to sit the exam, so check yours.</Note>}
        <ListCard>
          {rows === null && <ListRow title="Loading…" />}
          {rows?.length === 0 && <ListRow title="No attendance taken yet" sub="It shows here after your first scanned class." />}
          {rows?.map((x) => {
            const pct = Math.round((x.came / x.held) * 100);
            return (
              <div key={x.code} className="stack" style={{ gap: 8, padding: '14px 16px' }}>
                <div className="row between"><span className="stack"><span className="t-15 w-7">{x.code}</span><span className="t-12 faint">{x.title} · came to {x.came} of {x.held}</span></span><span className="display" style={{ fontSize: 22, color: pct < 75 ? 'var(--u-red)' : undefined }}>{pct}%</span></div>
                <ProgressBar value={x.came / x.held} color={pct < 75 ? 'var(--u-red)' : 'var(--u-green)'} />
              </div>
            );
          })}
        </ListCard>
      </div>
    </Screen>
  );
}
