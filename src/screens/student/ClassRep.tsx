import { useState } from 'react';
import { AlertTriangle, Paperclip, Plus, MessageCircle, Upload, Check } from 'lucide-react';
import { Screen, TopBar, BottomActions } from '../../components/chrome';
import { Button, Card, Field, Label, ListCard, ListRow, Pill, Chip, Chips, Toggle } from '../../components/ui';
import { useGo } from '../../components/nav';

/* ===================== HOC tools (S54–S56) ===================== */

/* S54 · Post to class */
export function S54PostToClass() {
  const go = useGo();
  const [kind, setKind] = useState('Test');
  const [send, setSend] = useState(true);
  return (
    <Screen actions>
      <TopBar title="Post to class" />
      <div className="stack pad" style={{ gap: 16 }}>
        <div className="stack" style={{ gap: 8 }}>
          <span className="field-label">What kind of post</span>
          <Chips>{['Test', 'Exam', 'Assignment', 'General'].map((k) => <Chip key={k} on={k === kind} onClick={() => setKind(k)}>{k}</Chip>)}</Chips>
        </div>
        <Field label="Course" value="ECE 305 · Semiconductor Devices" select />
        <Field label="Title" value="Test moved to Thursday" />
        <div className="stack" style={{ gap: 6 }}>
          <span className="field-label">Details</span>
          <textarea className="input" style={{ height: 90, padding: 14, resize: 'none' }} defaultValue="Was Tuesday 28 Oct. Now Thursday 30 Oct, 10 AM, LT 1. Covers Weeks 1 to 3." />
        </div>
        {(kind === 'Test' || kind === 'Exam' || kind === 'Assignment') && <Field label="New date and time" value="Thu 30 Oct · 10:00 AM" select />}
        <ListCard>
          <ListRow leading={<Paperclip size={18} />} title="Attach slides or the outline" sub="PDF or photo, up to 20 MB" />
          <ListRow title="Also send the files to Unify" sub="So contributors can turn them into notes" right={<Toggle on={send} onChange={setSend} />} />
        </ListCard>
      </div>
      <BottomActions hint="156 classmates will be notified"><Button onClick={() => go('S42')}>Post to 300L ECE</Button></BottomActions>
    </Screen>
  );
}

/* S55 · Edit timetable. Clashes block saving until fixed. */
type Row = { code: string; title: string; time: string; status: 'none' | 'confirmed' | 'cancelled' };
export function S55EditTimetable() {
  const go = useGo();
  const [day, setDay] = useState(2);
  const [rows, setRows] = useState<Row[]>([
    { code: 'ECE 305', title: 'Semiconductor Devices', time: '8 AM to 10 AM · LT 1', status: 'none' },
    { code: 'ECE 303', title: 'Electrical Circuit Theory', time: '10 AM to 12 PM · LT 2', status: 'none' },
    { code: 'MEE 352', title: 'Energy Conservation', time: '10 AM to 12 PM · ETF Hall', status: 'none' },
  ]);
  const set = (i: number, status: Row['status']) => setRows(rows.map((r, k) => (k === i ? { ...r, status } : r)));
  const clash = rows[1].status !== 'cancelled' && rows[2].status !== 'cancelled';
  const days = [['Mon', 20], ['Tue', 21], ['Wed', 22], ['Thu', 23], ['Fri', 24], ['Sat', 25]] as const;
  return (
    <Screen actions>
      <TopBar title="Edit timetable" />
      <div className="row pad" style={{ gap: 6 }}>
        {days.map(([d, n], i) => (
          <button key={d} onClick={() => setDay(i)} className="stack center" style={{ flex: 1, padding: '7px 0', borderRadius: 14, background: i === day ? '#0a0a0a' : '#fff', color: i === day ? '#fff' : '#555', border: i === day ? 0 : '1px solid var(--u-border)' }}>
            <span className="t-12 w-6">{d}</span><span className="t-15 w-7">{n}</span>
          </button>
        ))}
      </div>
      <div className="stack pad" style={{ gap: 10, paddingTop: 14 }}>
        {clash && (
          <Card pad={14} style={{ flexDirection: 'row', gap: 10, background: 'var(--u-warn-tint)', border: 0 }}>
            <AlertTriangle size={18} color="var(--u-warn-ink)" /><span className="t-14 w-6" style={{ color: 'var(--u-warn-ink)' }}>ECE 303 and MEE 352 are both at 10 AM. Change one before you save.</span>
          </Card>
        )}
        {rows.map((r, i) => (
          <Card key={r.code} pad={16} gap={10} style={{ border: clash && i > 0 ? '1.5px solid var(--u-amber)' : undefined }}>
            <div className="row between">
              <span className="stack"><span className="t-16 w-7" style={{ textDecoration: r.status === 'cancelled' ? 'line-through' : undefined }}>{r.code}</span><span className="t-13 muted">{r.title}</span></span>
              <button className="t-13 w-7" style={{ color: 'var(--u-good-2)' }}>Edit</button>
            </div>
            <span className="t-13 faint">{r.time}</span>
            <div className="row" style={{ gap: 8 }}>
              <Button small variant={r.status === 'confirmed' ? 'green' : 'outline'} block={false} onClick={() => set(i, 'confirmed')}>{r.status === 'confirmed' ? <><Check size={14} /> Confirmed</> : 'Confirm'}</Button>
              <span className="grow t-12 faint">{r.status === 'none' ? 'Not confirmed' : ''}</span>
              <Button small variant={r.status === 'cancelled' ? 'danger' : 'outline'} block={false} onClick={() => set(i, 'cancelled')}>{r.status === 'cancelled' ? 'Cancelled' : 'Cancel'}</Button>
            </div>
          </Card>
        ))}
        <button className="row t-14 w-7" style={{ gap: 6, padding: 14, borderRadius: 16, border: '1.5px dashed var(--u-border)', justifyContent: 'center' }}><Plus size={16} />Add a class</button>
      </div>
      <BottomActions hint="Changes notify everyone in 300L ECE"><Button disabled={clash} onClick={() => go('S37')}>Save and notify class</Button></BottomActions>
    </Screen>
  );
}

/* S56 · Contributors overview for the HOC */
const CONTRIBUTORS = [
  { i: 'TA', name: 'Tolu Adebayo', courses: 'MEE 301 · ECE 305', last: 'Week 4 notes up · 2 days ago', ok: true },
  { i: 'IS', name: 'Ifeoluwa Sanni', courses: 'ECE 301 · ECE 309', last: 'Week 4 notes up · today', ok: true },
  { i: 'KO', name: 'Kemi Okafor', courses: 'ECE 303 · ECE 307', last: 'Week 3 notes due · 3 days late', ok: false },
  { i: 'SO', name: 'Samuel Ojo', courses: 'MEE 303 · MEE 305', last: 'Week 4 notes up · yesterday', ok: true },
];
export function S56Contributors() {
  return (
    <Screen actions>
      <TopBar title="Contributors" />
      <div className="stack pad" style={{ gap: 12 }}>
        <Card tone="dark" pad={18} style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <span className="display" style={{ fontSize: 48, color: 'var(--u-green)' }}>4</span>
          <span className="stack"><span className="t-15 w-7">contributors</span><span className="t-13" style={{ color: '#aaa' }}>8 courses covered · 3 on track · 1 behind</span></span>
        </Card>
        <ListCard>
          {CONTRIBUTORS.map((c) => (
            <ListRow key={c.i} leading={<span style={{ width: 36, height: 36, borderRadius: 18, background: c.ok ? 'var(--u-green)' : 'var(--u-warn-tint)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12 }}>{c.i}</span>}
              title={c.name} sub={`${c.courses} · ${c.last}`} right={<Pill tone={c.ok ? 'good' : 'warn'}>{c.ok ? 'On track' : 'Behind'}</Pill>} />
          ))}
        </ListCard>
        <Label>Files you sent to Unify</Label>
        <ListCard>
          <ListRow title="ECE 303 slides, Week 4" right={<Pill tone="good">Received</Pill>} />
          <ListRow title="ECE 305 course outline" right={<Pill tone="good">Received</Pill>} />
        </ListCard>
        <Card pad={16} gap={4}><span className="t-15 w-7">Talk to Unify</span><span className="t-13 muted">Questions about notes, contributors or the timetable go straight to the Unify team.</span></Card>
      </div>
      <BottomActions>
        <Button><Upload size={16} /> Upload notes from your lecturer</Button>
        <Button variant="white"><MessageCircle size={16} /> Message Unify</Button>
      </BottomActions>
    </Screen>
  );
}

