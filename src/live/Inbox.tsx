import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { Screen, TopBar, BottomActions } from '../components/chrome';
import { Button, Card, Chip, Chips, Display, Label, ListCard, ListRow, Pill } from '../components/ui';
import { Note, useAction } from '../components/form';
import { supabase, rpc, friendly } from '../lib/supabase';
import { NotHoc, useHocClass } from './ClassList';

type Item = {
  id: string; kind: 'clash' | 'not_on_list' | 'id_check' | 'priority'; created_at: string; message: string | null;
  payload: { matric?: string; email?: string; course?: string; claim?: { surname?: string; first_name?: string; matric?: string } | null };
  from_name: string | null; from_email: string | null;
  entry: { surname: string; first_name: string; middle_name: string | null; matric: string } | null;
  holder: { name: string; email: string | null; claimed_at: string; classes: number } | null;
};
type PendingLecturer = { course_id: string; user_id: string; name: string; course: string; title: string };

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now'; if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h} hr ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};
const TAG: Record<Item['kind'], [string, 'bad' | 'grey' | 'warn' | 'amber']> = {
  clash: ['Clash', 'bad'], not_on_list: ['Not on the list', 'grey'], id_check: ['ID check', 'warn'], priority: ['Priority student', 'amber'],
};

function useInbox(classId: string | null) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [lecturers, setLecturers] = useState<PendingLecturer[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!classId) return;
    const [i, l] = await Promise.all([supabase.rpc('hoc_inbox', { p_class: classId }), supabase.rpc('pending_lecturers', { p_class: classId })]);
    if (i.error) setErr(friendly(i.error.message)); else setItems((i.data ?? []) as Item[]);
    if (!l.error) setLecturers((l.data ?? []) as PendingLecturer[]);
  }, [classId]);
  useEffect(() => { load(); }, [load]);
  return { items, lecturers, err, reload: load };
}

/* AT15 · inbox */
export function LiveInbox() {
  const navigate = useNavigate();
  const { classId, label } = useHocClass();
  const { items, lecturers, err, reload } = useInbox(classId);
  const [f, setF] = useState<'all' | 'clash' | 'req'>('all');
  const { busy, error, run } = useAction();
  if (!classId) return <NotHoc />;
  const decide = (id: string, decision: string) => run(async () => { await rpc('resolve_inbox', { p_item: id, p_decision: decision }); await reload(); });
  const lect = (l: PendingLecturer, yes: boolean) => run(async () => { await rpc('confirm_lecturer', { p_course: l.course_id, p_user: l.user_id, p_confirm: yes }); await reload(); });
  const shown = (items ?? []).filter((i) => f === 'all' || (f === 'clash' ? i.kind === 'clash' : i.kind !== 'clash'));
  const clashes = (items ?? []).filter((i) => i.kind === 'clash').length;
  return (
    <Screen>
      <TopBar title={`Inbox · ${label}`} />
      <div className="stack pad" style={{ gap: 12, paddingBottom: 28 }}>
        <Chips>
          <Chip small on={f === 'all'} onClick={() => setF('all')}>All · {items?.length ?? 0}</Chip>
          <Chip small on={f === 'clash'} onClick={() => setF('clash')}>Clashes · {clashes}</Chip>
          <Chip small on={f === 'req'} onClick={() => setF('req')}>Requests · {(items?.length ?? 0) - clashes}</Chip>
        </Chips>
        {(err || error) && <Note>{err || error}</Note>}
        {items === null && !err && <p className="t-14 muted">Loading…</p>}
        {lecturers.length > 0 && f === 'all' && (
          <>
            <Label>Is this your lecturer?</Label>
            {lecturers.map((l) => (
              <Card key={l.course_id + l.user_id} pad={16} gap={8}>
                <span className="t-15 w-6">{l.name}</span>
                <span className="t-13 faint">Added {l.course} · {l.title}. You know who teaches you, so you confirm it.</span>
                <div className="row" style={{ gap: 8 }}>
                  <Button small block={false} variant="green" disabled={busy} onClick={() => lect(l, true)}>Yes, they teach us</Button>
                  <Button small block={false} variant="white" disabled={busy} onClick={() => lect(l, false)}>No</Button>
                </div>
              </Card>
            ))}
          </>
        )}
        {shown.map((i) => {
          const who = i.from_name ?? 'A student';
          const title = i.kind === 'clash' ? `Two accounts claim ${i.payload.matric}`
            : i.kind === 'priority' ? `${i.payload.claim ? `${i.payload.claim.surname} ${i.payload.claim.first_name}` : who} · ${i.payload.course}`
            : `${who}${i.payload.matric ? ` · ${i.payload.matric}` : ''}`;
          const sub = i.kind === 'clash' ? `${who} says this matric number is theirs · ${ago(i.created_at)}`
            : i.kind === 'not_on_list' ? `${i.message ?? 'Their matric number isn\'t on your list'} · ${ago(i.created_at)}`
            : i.kind === 'id_check' ? `Can't get into their student email. Check their ID card in class · ${ago(i.created_at)}`
            : `Wants to be added to the ${i.payload.course} register · ${ago(i.created_at)}`;
          return (
            <Card key={i.id} pad={16} gap={8}>
              <Pill tone={TAG[i.kind][1]} style={{ alignSelf: 'flex-start' }}>{TAG[i.kind][0]}</Pill>
              <span className="t-15 w-6">{title}</span>
              <span className="t-13 faint">{sub}</span>
              <div className="row" style={{ gap: 8 }}>
                {i.kind === 'clash' && <Button small block={false} variant="dark" onClick={() => navigate(`/screens/AT16?item=${i.id}`)}>Settle it</Button>}
                {i.kind === 'id_check' && <Button small block={false} variant="green" onClick={() => navigate(`/screens/AT17?item=${i.id}`)}>Check</Button>}
                {i.kind === 'not_on_list' && <Button small block={false} variant="green" onClick={() => navigate(`/screens/AT05?item=${i.id}&matric=${i.payload.matric ?? ''}`)}>Add</Button>}
                {i.kind === 'priority' && <Button small block={false} variant="green" disabled={busy} onClick={() => decide(i.id, 'approve')}>Approve</Button>}
                {i.kind !== 'clash' && i.kind !== 'id_check' && <Button small block={false} variant="white" disabled={busy} onClick={() => decide(i.id, 'decline')}>Decline</Button>}
              </div>
            </Card>
          );
        })}
        {items && shown.length === 0 && lecturers.length === 0 && <p className="t-15 muted center" style={{ paddingTop: 40 }}>Nothing waiting. Nice.</p>}
      </div>
    </Screen>
  );
}

function useItem() {
  const [params] = useSearchParams();
  const { classId } = useHocClass();
  const { items, err } = useInbox(classId);
  return { classId, item: items?.find((i) => i.id === params.get('item')) ?? null, loading: items === null && !err, err };
}

/* AT16 · settle a clash */
export function LiveSettleClash() {
  const navigate = useNavigate();
  const { classId, item, loading, err } = useItem();
  const [pick, setPick] = useState<1 | 2>(1);
  const { busy, error, run } = useAction();
  if (!classId) return <NotHoc />;
  if (loading) return <Screen><TopBar title="Settle a clash" /><p className="pad t-14 muted">Loading…</p></Screen>;
  if (!item) return <Screen><TopBar title="Settle a clash" /><div className="pad"><Note tone="warn">{err ?? 'This clash is already settled.'}</Note></div></Screen>;
  const Acc = ({ n, title, tag, s1, s2 }: { n: 1 | 2; title: string; tag: string; s1: string; s2: string }) => (
    <button onClick={() => setPick(n)} className="card stack" style={{ gap: 6, padding: 16, textAlign: 'left', border: `1.5px solid ${pick === n ? '#0a0a0a' : 'var(--u-border)'}` }}>
      <div className="row between"><span className="t-16 w-6">{title}</span><Pill tone={n === 1 ? 'good' : 'grey'}>{tag}</Pill></div>
      <span className="t-13 muted">{s1}</span><span className="t-12 faint">{s2}</span>
    </button>
  );
  return (
    <Screen actions>
      <TopBar title="Settle a clash" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={30}>WHO OWNS {item.payload.matric}?</Display>
        {item.entry && <p className="t-15 muted">From the class list: {item.entry.surname} {item.entry.first_name} {item.entry.middle_name ?? ''}. Two accounts want it.</p>}
        <Acc n={1} title={`Account 1 · ${item.holder?.name ?? 'current holder'}`} tag="Has it now"
          s1={item.holder?.email ? `Claimed with ${item.holder.email}` : 'Claimed by ID card'}
          s2={item.holder ? `${new Date(item.holder.claimed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ${item.holder.classes} class${item.holder.classes === 1 ? '' : 'es'} attended` : ''} />
        <Acc n={2} title={`Account 2 · ${item.from_name ?? 'student'}`} tag="Says it's theirs" s1={item.message ? `"${item.message}"` : (item.payload.email ? `Signed in with ${item.payload.email}` : '')} s2={ago(item.created_at)} />
        <Card pad={16} style={{ background: 'var(--u-card-2)', border: 0 }}><span className="t-13 muted">Not sure? Ask both to show their ID cards in class first.</span></Card>
        {error && <Note>{error}</Note>}
      </div>
      <BottomActions hint="Both students see the result the next time they open their pass.">
        <Button disabled={busy} onClick={() => run(async () => { await rpc('resolve_inbox', { p_item: item.id, p_decision: pick === 1 ? 'keep' : 'move' }); navigate('/screens/AT15', { replace: true }); })}>
          {pick === 1 ? 'Keep it on account 1' : 'Move it to account 2'}
        </Button>
      </BottomActions>
    </Screen>
  );
}

/* AT17 · check an ID card */
export function LiveIdCheck() {
  const navigate = useNavigate();
  const { classId, item, loading, err } = useItem();
  const [ok, setOk] = useState([false, false, false]);
  const { busy, error, run } = useAction();
  if (!classId) return <NotHoc />;
  if (loading) return <Screen><TopBar title="ID check" /><p className="pad t-14 muted">Loading…</p></Screen>;
  if (!item) return <Screen><TopBar title="ID check" /><div className="pad"><Note tone="warn">{err ?? 'This request is already settled.'}</Note></div></Screen>;
  const done = (d: 'confirm' | 'decline') => run(async () => { await rpc('resolve_inbox', { p_item: item.id, p_decision: d }); navigate('/screens/AT15', { replace: true }); });
  return (
    <Screen actions>
      <TopBar title="ID check" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={30}>CHECK THEIR ID CARD</Display>
        {item.entry ? (
          <Card tone="dark" pad={20} gap={6}>
            <span className="eyebrow" style={{ color: 'var(--u-green)', fontSize: 11 }}>On your class list</span>
            <span className="display" style={{ fontSize: 24, color: '#fff' }}>{item.entry.surname} {item.entry.first_name}</span>
            <span className="t-13" style={{ color: 'rgba(255,255,255,.7)' }}>Matric {item.entry.matric}</span>
          </Card>
        ) : <Note tone="warn">Matric {item.payload.matric} isn't on your class list. Add the student first, then confirm.</Note>}
        <span className="t-13 faint">Asked by {item.from_name ?? 'a student'}{item.message ? `: "${item.message}"` : ''}</span>
        <Label>On the card, check</Label>
        <ListCard>
          {['Name matches', 'Matric number matches', 'Photo is the person in front of you'].map((t, i) => (
            <ListRow key={t} title={t} onClick={() => setOk(ok.map((v, k) => (k === i ? !v : v)))}
              right={<span style={{ width: 24, height: 24, borderRadius: 7, display: 'grid', placeItems: 'center', background: ok[i] ? '#0a0a0a' : '#fff', border: ok[i] ? 0 : '1px solid var(--u-border)' }}>{ok[i] && <Check size={14} color="#50ff90" strokeWidth={3} />}</span>} />
          ))}
        </ListCard>
        {error && <Note>{error}</Note>}
      </div>
      <BottomActions hint="Your name is saved with this confirmation.">
        <Button disabled={busy || !ok.every(Boolean) || !item.entry} onClick={() => done('confirm')}>Confirm, it's them</Button>
        <Button variant="white" disabled={busy} onClick={() => done('decline')}><X size={16} /> Not a match</Button>
      </BottomActions>
    </Screen>
  );
}
