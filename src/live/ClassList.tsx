import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ChevronRight, ClipboardPaste, Pencil, Sheet as SheetIcon, Trash2, Upload } from 'lucide-react';
import { Screen, TopBar, BottomActions } from '../components/chrome';
import { Button, Card, Chip, Chips, Display, Label, ListCard, ListRow, Pill } from '../components/ui';
import { Note, TextInput, useAction } from '../components/form';
import { useGo } from '../components/nav';
import { useAuth, classLabel } from '../lib/auth';
import { supabase, rpc, friendly } from '../lib/supabase';
import { checkRows, guessMapping, ISSUE_TEXT, parsePasted, rowsFromMatrix, saveable, TARGET_LABEL, type Checked, type Student, type Target } from '../lib/classList';
import { ACCEPT, downloadTemplate, readClassListFile } from '../lib/files';

/* ---------- shared bits ---------- */

/** The class this HOC manages (their own class if they're its HOC, else the first class they're HOC of). */
export function useHocClass() {
  const { hocOf, klass } = useAuth();
  const id = klass && hocOf.includes(klass.id) ? klass.id : hocOf[0] ?? null;
  const [label, setLabel] = useState(klass && id === klass.id ? classLabel(klass) : '');
  useEffect(() => {
    if (!id || (klass && id === klass.id)) return;
    supabase.from('classes').select('level,department_code').eq('id', id).maybeSingle().then(({ data }) => data && setLabel(`${data.level}L ${data.department_code}`));
  }, [id, klass]);
  return { classId: id, label };
}

export function NotHoc() {
  const go = useGo();
  return (
    <Screen actions>
      <TopBar title="HOC tools" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={30}>FOR HOCS ONLY</Display>
        <p className="t-15 muted">Only your class's HOCs can manage the class list and its requests. If you're an HOC, ask for HOC tools and the Unify team will check with your department.</p>
      </div>
      <BottomActions><Button onClick={() => go('S50')}>Request HOC tools</Button></BottomActions>
    </Screen>
  );
}

const Arrow = () => <ChevronRight size={18} color="#8a8a8a" />;
const Ico = ({ children, dark }: { children: ReactNode; dark?: boolean }) => (
  <span style={{ width: 36, height: 36, borderRadius: 18, display: 'grid', placeItems: 'center', background: dark ? '#0a0a0a' : 'var(--u-card-2)', color: dark ? 'var(--u-green)' : '#0a0a0a', flexShrink: 0 }}>{children}</span>
);

/* The list being prepared between screens (upload/paste → check). Kept in memory only. */
type Draft = { rows: Student[]; source: string; note?: string };
let draft: Draft | null = null;
const setDraft = (d: Draft) => { draft = d; };

/* ---------- AT01 · set up ---------- */
export function LiveSetUpList() {
  const go = useGo();
  const { classId, label } = useHocClass();
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    if (!classId) return;
    supabase.from('class_list_entries').select('id', { count: 'exact', head: true }).eq('class_id', classId).then(({ count: c }) => setCount(c ?? 0));
  }, [classId]);
  if (!classId) return <NotHoc />;
  return (
    <Screen>
      <TopBar title={`Class list · ${label}`} />
      <div className="stack pad" style={{ gap: 14, paddingBottom: 28 }}>
        <Display size={30}>{count ? 'UPDATE YOUR CLASS LIST' : 'UPLOAD YOUR CLASS LIST'}</Display>
        {count ? (
          <Card pad={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, background: 'var(--u-good-tint)', border: 0 }}>
            <Check size={18} color="var(--u-good)" />
            <span className="grow t-14 w-6" style={{ color: 'var(--u-good)' }}>{count} students are on your list.</span>
            <Button small block={false} variant="white" onClick={() => go('AT04')}>Open</Button>
          </Card>
        ) : (
          <p className="t-15 muted">Your class list is how attendance knows who is who. Students claim their own name from it, so nobody types their name differently.</p>
        )}
        <ListCard>
          <ListRow leading={<Ico dark><Upload size={16} /></Ico>} title="Upload a document" sub="Excel, CSV, Word or PDF" right={<Arrow />} onClick={() => go('AT01a')} />
          <ListRow leading={<Ico><ClipboardPaste size={16} /></Ico>} title="Paste the list" sub="Copy names and matric numbers from anywhere" right={<Arrow />} onClick={() => go('AT02')} />
          <ListRow leading={<Ico><SheetIcon size={16} /></Ico>} title="Use our template" sub="A sheet with the right columns. Fill it, then upload it" right={<Arrow />} onClick={() => go('AT01b')} />
        </ListCard>
        {count ? <p className="t-13 faint">Uploading again adds new students and updates names. Nobody is removed and claims are kept.</p> : null}
        <Card pad={16} style={{ background: 'var(--u-good-tint)', border: 0 }}>
          <span className="t-13 w-5" style={{ color: 'var(--u-good)' }}>Your class can have up to 3 HOCs. Any of you can upload or edit the list, and you all share the same one. Only your class's HOCs and lecturers can see it.</span>
        </Card>
      </div>
    </Screen>
  );
}

/* ---------- AT01a · upload a document ---------- */
export function LiveUploadDocument() {
  const go = useGo();
  const { classId } = useHocClass();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [table, setTable] = useState<{ matrix: unknown[][]; header: boolean; mapping: Target[]; headings: string[]; note: string } | null>(null);
  const [textRows, setTextRows] = useState<{ rows: Student[]; note: string } | null>(null);
  const { busy, error, run } = useAction();
  if (!classId) return <NotHoc />;

  const pick = (f: File | undefined) => f && run(async () => {
    setFile(f); setTable(null); setTextRows(null);
    const r = await readClassListFile(f);
    if (r.kind === 'table') { const g = guessMapping(r.matrix); setTable({ matrix: r.matrix, ...g, note: r.note }); }
    else setTextRows({ rows: parsePasted(r.text), note: r.note });
  });
  const rows = table ? rowsFromMatrix(table.matrix, table.mapping, table.header) : textRows?.rows ?? [];
  const mapped = table ? table.mapping.includes('matric') && (table.mapping.includes('surname') || table.mapping.includes('full_name')) : true;
  const sample = (c: number) => String((table!.header ? table!.matrix[1] : table!.matrix[0])?.[c] ?? '').slice(0, 24);

  return (
    <Screen actions>
      <TopBar title="Upload a document" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={30}>UPLOAD YOUR CLASS LIST</Display>
        <input ref={input} type="file" accept={ACCEPT} hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
        <div className="stack" style={{ gap: 10, padding: 20, borderRadius: 20, background: '#fff', border: '1.5px dashed #c9c6bf' }}>
          {file ? (
            <div className="row" style={{ gap: 12 }}>
              <span style={{ width: 40, height: 40, borderRadius: 10, background: '#1d6f42', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700 }}>{file.name.split('.').pop()?.toUpperCase().slice(0, 4)}</span>
              <span className="grow stack" style={{ minWidth: 0 }}><span className="t-15 w-6" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span><span className="t-12 faint">{Math.max(1, Math.round(file.size / 1024))} KB</span></span>
              <button className="t-13 w-6" style={{ color: 'var(--u-good-2)' }} onClick={() => input.current?.click()}>Change</button>
            </div>
          ) : (
            <Button variant="white" onClick={() => input.current?.click()}><Upload size={16} /> Choose a file</Button>
          )}
          {busy && <span className="t-13 muted">Reading the file…</span>}
          {!busy && file && rows.length > 0 && (
            <span className="row t-13 w-6" style={{ gap: 8, padding: '10px 12px', borderRadius: 12, background: 'var(--u-good-tint)', color: 'var(--u-good)' }}>
              <Check size={14} />{rows.length} students read{(table?.note || textRows?.note) ? ` ${table?.note || `· ${textRows?.note}`}` : ''}
            </span>
          )}
          {!busy && file && rows.length === 0 && !error && <Note tone="warn">We couldn't find any students in this file. Check the column choices below, or paste the list instead.</Note>}
        </div>
        {error && <Note>{error}</Note>}
        {table && (
          <>
            <Label>Which column is which?</Label>
            <span className="t-13 faint" style={{ marginTop: -8 }}>We guessed from the headings. Change any that are wrong.</span>
            <ListCard>
              {table.mapping.map((t, c) => (
                <ListRow key={c} title={`${String.fromCharCode(65 + (c % 26))}${table.headings[c] ? ` · "${table.headings[c]}"` : ''}`} sub={sample(c) ? `e.g. ${sample(c)}` : 'empty'}
                  right={<select value={t} onChange={(e) => setTable({ ...table, mapping: table.mapping.map((m, k) => (k === c ? (e.target.value as Target) : m)) })}
                    className="t-13 w-6" style={{ padding: '8px 10px', borderRadius: 10, background: 'var(--u-card-2)', border: '1px solid var(--u-border)' }}>
                    {(Object.keys(TARGET_LABEL) as Target[]).map((k) => <option key={k} value={k}>{TARGET_LABEL[k]}</option>)}
                  </select>} />
              ))}
            </ListCard>
            <label className="row t-13" style={{ gap: 8 }}><input type="checkbox" checked={table.header} onChange={(e) => setTable({ ...table, header: e.target.checked })} /> The first row is a heading</label>
            {!mapped && <Note tone="warn">Choose which column has the matric number and which has the names.</Note>}
          </>
        )}
      </div>
      <BottomActions hint="Next you'll see any rows that need fixing.">
        <Button disabled={busy || rows.length === 0 || !mapped} onClick={() => { setDraft({ rows, source: file?.name ?? 'document' }); go('AT03'); }}>Check the list</Button>
      </BottomActions>
    </Screen>
  );
}

/* ---------- AT01b · template ---------- */
export function LiveTemplate() {
  const go = useGo();
  const { error, run } = useAction();
  return (
    <Screen actions>
      <TopBar title="Use our template" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={30}>FILL IN OUR TEMPLATE</Display>
        <p className="t-15 muted">Four columns, one student per row. Open it in Excel or Google Sheets, fill it, then upload it back here.</p>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead><tr style={{ background: '#0a0a0a' }}>{['SURNAME', 'FIRST NAME', 'MIDDLE NAME', 'MATRIC NO'].map((h) => <th key={h} style={{ color: 'var(--u-green)', textAlign: 'left', padding: 10, fontWeight: 700 }}>{h}</th>)}</tr></thead>
            <tbody><tr>{['OLOTUCHE', 'Joshua', 'Oluwaseun', '220801234'].map((c) => <td key={c} style={{ padding: 10, borderTop: '1px solid var(--u-border)' }}>{c}</td>)}</tr></tbody>
          </table>
        </div>
        <Card pad={16} gap={8} style={{ background: 'var(--u-card-2)', border: 0 }}>
          {['Matric numbers exactly as on the ID card', "Leave middle name empty if there isn't one", "Department and level come from your class, so don't add them"].map((t) => <span key={t} className="t-13 muted">• {t}</span>)}
        </Card>
        {error && <Note>{error}</Note>}
      </div>
      <BottomActions>
        <Button onClick={() => run(downloadTemplate)}>Save the template</Button>
        <Button variant="white" onClick={() => go('AT01a')}>Upload my filled template</Button>
      </BottomActions>
    </Screen>
  );
}

/* ---------- AT02 · paste ---------- */
export function LivePasteList() {
  const go = useGo();
  const { classId } = useHocClass();
  const [text, setText] = useState('');
  const rows = useMemo(() => parsePasted(text), [text]);
  if (!classId) return <NotHoc />;
  return (
    <Screen actions>
      <TopBar title="Paste the list" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={30}>PASTE IT HERE</Display>
        <p className="t-15 muted">One student per line. Any order works: Unify finds the names and the matric number.</p>
        <textarea className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={'ADEBAYO Kunle Tobi 220801117\nBELLO Amaka Chioma 220803398'}
          style={{ height: 280, padding: 16, resize: 'none', fontSize: 13, lineHeight: 1.6, border: '1.5px solid #0a0a0a' }} />
        <span className="t-12 w-6 faint">{rows.length} student{rows.length === 1 ? '' : 's'} found</span>
      </div>
      <BottomActions hint="You can fix anything on the next screen.">
        <Button disabled={rows.length === 0} onClick={() => { setDraft({ rows, source: 'pasted list' }); go('AT03'); }}>Read the list</Button>
      </BottomActions>
    </Screen>
  );
}

/* ---------- AT03 · check, fix, confirm ---------- */
function EditRow({ row, onSave, onCancel }: { row: Student; onSave: (s: Student) => void; onCancel: () => void }) {
  const [s, setS] = useState(row);
  const f = (k: keyof Student) => (v: string) => setS({ ...s, [k]: k === 'surname' ? v.toUpperCase() : v });
  return (
    <div className="stack" style={{ gap: 10, padding: 14, background: '#fff' }}>
      <TextInput label="Surname" value={s.surname} onChange={f('surname')} />
      <div className="row" style={{ gap: 10 }}>
        <TextInput label="First name" value={s.first_name} onChange={f('first_name')} style={{ flex: 1 }} />
        <TextInput label="Middle name" value={s.middle_name} onChange={f('middle_name')} style={{ flex: 1 }} />
      </div>
      <TextInput label="Matric number" value={s.matric} onChange={(v) => setS({ ...s, matric: v.replace(/\D/g, '') })} inputMode="numeric" maxLength={12} />
      <div className="row" style={{ gap: 8 }}><Button small block={false} onClick={() => onSave(s)}>Save row</Button><Button small block={false} variant="white" onClick={onCancel}>Cancel</Button></div>
    </div>
  );
}

export function LiveCheckList() {
  const go = useGo();
  const { classId } = useHocClass();
  const [rows, setRows] = useState<Student[]>(() => draft?.rows ?? []);
  const [editing, setEditing] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const { busy, error, run } = useAction();
  const checked = useMemo(() => checkRows(rows), [rows]);
  const [existing, setExisting] = useState(0);
  useEffect(() => {
    if (classId) supabase.from('class_list_entries').select('id', { count: 'exact', head: true }).eq('class_id', classId).then(({ count }) => setExisting(count ?? 0));
  }, [classId]);
  if (!classId) return <NotHoc />;
  if (!draft) return <Navigate to="/screens/AT01" replace />;
  const flagged = checked.filter((c) => c.issues.length);
  const good = checked.filter((c) => !c.issues.length);
  const toSave = saveable(checked);
  const skipped = rows.length - toSave.length;
  const row = (c: Checked, warn: boolean) => editing === c.index
    ? <EditRow key={c.index} row={c.student} onCancel={() => setEditing(null)} onSave={(s) => { setRows(rows.map((r, i) => (i === c.index ? s : r))); setEditing(null); }} />
    : (
      <div key={c.index} style={{ background: warn ? 'var(--u-warn-tint)' : undefined }}>
        <ListRow title={`${c.student.surname || '—'} ${c.student.first_name} ${c.student.middle_name}`.trim()}
          sub={`${c.student.matric || 'no matric'}${c.issues.length ? ` · ${c.issues.map((i) => ISSUE_TEXT[i]).join(', ')}` : ''}`}
          right={<span className="row" style={{ gap: 4 }}>
            <button aria-label="Edit row" onClick={() => setEditing(c.index)} style={{ padding: 6 }}><Pencil size={15} /></button>
            <button aria-label="Remove row" onClick={() => setRows(rows.filter((_, i) => i !== c.index))} style={{ padding: 6 }}><Trash2 size={15} color="var(--u-red)" /></button>
          </span>} />
      </div>
    );
  return (
    <Screen actions>
      <TopBar title="Check the list" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Card tone="dark" pad={18} gap={6}>
          <span className="display" style={{ fontSize: 22, color: '#fff' }}>{rows.length} STUDENTS FOUND</span>
          <span className="t-13" style={{ color: 'rgba(255,255,255,.7)' }}>{flagged.length ? `${flagged.length} row${flagged.length === 1 ? ' needs' : 's need'} you · ` : ''}{good.length} look right</span>
        </Card>
        {flagged.length > 0 && <>
          <Label style={{ color: 'var(--u-warn-ink)' }}>Needs you · {flagged.length}</Label>
          <ListCard>{flagged.map((c) => row(c, true))}</ListCard>
        </>}
        <Label>Looks right · {good.length}</Label>
        <ListCard>{(showAll ? good : good.slice(0, 30)).map((c) => row(c, false))}</ListCard>
        {!showAll && good.length > 30 && <button className="link-btn" onClick={() => setShowAll(true)}>Show all {good.length}</button>}
        {error && <Note>{error}</Note>}
      </div>
      <BottomActions hint={skipped > 0 ? `${skipped} row${skipped === 1 ? '' : 's'} without a name or valid matric, or repeated, won't be saved. Fix or remove them first if you need them.`
        : existing > 0 ? `Your list already has ${existing} students. Nobody is removed: new matric numbers are added, matching ones get these names.` : 'You can still edit the list after saving.'}>
        <Button disabled={busy || toSave.length === 0} onClick={() => run(async () => {
          await rpc<number>('import_class_list', { p_class: classId, p_rows: toSave, p_source: draft?.source ?? 'document' });
          draft = null;
          go('AT04');
        })}>{busy ? 'Saving…' : existing > 0 ? `Add or update ${toSave.length} students` : `Confirm list · ${toSave.length} students`}</Button>
      </BottomActions>
    </Screen>
  );
}

/* ---------- AT04 · the list ---------- */
type Entry = { id: string; surname: string; first_name: string; middle_name: string | null; matric: string; reason: string | null };
type Claim = { entry_id: string; claimed_at: string; method: string };
type Priority = { registration: string; course: string; name: string; matric: string; from_class: string };
/* Fix or remove one saved row, from the class list. */
function StudentEditor({ entry, claimed, onDone, onCancel }: { entry: Entry; claimed: boolean; onDone: () => void; onCancel: () => void }) {
  const [s, setS] = useState({ surname: entry.surname, first: entry.first_name, middle: entry.middle_name ?? '', matric: entry.matric });
  const [sure, setSure] = useState(false);
  const { busy, error, run } = useAction();
  const save = () => run(async () => {
    if (!s.surname.trim() || !s.first.trim()) throw new Error('Surname and first name are needed.');
    if (!/^\d{6,12}$/.test(s.matric)) throw new Error('A matric number should be 6 to 12 digits.');
    await rpc('edit_student', { p_entry: entry.id, p_surname: s.surname, p_first: s.first, p_middle: s.middle, p_matric: s.matric });
    onDone();
  });
  const remove = () => run(async () => { await rpc('remove_student', { p_entry: entry.id }); onDone(); });
  return (
    <div className="stack" style={{ gap: 10, padding: 14, background: 'var(--u-card-2)' }}>
      <TextInput label="Surname" value={s.surname} onChange={(v) => setS({ ...s, surname: v.toUpperCase() })} />
      <div className="row" style={{ gap: 10 }}>
        <TextInput label="First name" value={s.first} onChange={(v) => setS({ ...s, first: v })} style={{ flex: 1 }} />
        <TextInput label="Middle name" value={s.middle} onChange={(v) => setS({ ...s, middle: v })} style={{ flex: 1 }} />
      </div>
      {claimed
        ? <span className="t-13 muted">Matric {entry.matric} · locked, because this student has claimed their name.</span>
        : <TextInput label="Matric number" value={s.matric} onChange={(v) => setS({ ...s, matric: v.replace(/\D/g, '') })} inputMode="numeric" maxLength={12} />}
      {error && <Note>{error}</Note>}
      <div className="row wrap" style={{ gap: 8 }}>
        <Button small block={false} disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</Button>
        <Button small block={false} variant="white" onClick={onCancel}>Cancel</Button>
        {!claimed && (sure
          ? <Button small block={false} variant="danger" disabled={busy} onClick={remove}><Trash2 size={14} /> Yes, remove</Button>
          : <Button small block={false} variant="white" onClick={() => setSure(true)}><Trash2 size={14} color="var(--u-red)" /> Remove</Button>)}
      </div>
      <span className="t-12 faint">Every change shows in History with your name.</span>
    </div>
  );
}

export function LiveClassList() {
  const go = useGo();
  const [editing, setEditing] = useState<string | null>(null);
  const [rev, setRev] = useState(0);
  const { classId, label } = useHocClass();
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [claims, setClaims] = useState<Map<string, Claim>>(new Map());
  const [clashes, setClashes] = useState<Set<string>>(new Set());
  const [others, setOthers] = useState<Priority[]>([]);
  const [inboxCount, setInboxCount] = useState(0);
  const [hocs, setHocs] = useState<string[]>([]);
  const [tab, setTab] = useState<'mine' | 'other'>('mine');
  const [q, setQ] = useState('');
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!classId) return;
    (async () => {
      const [e, c, i, o, st] = await Promise.all([
        supabase.from('class_list_entries').select('id,surname,first_name,middle_name,matric,reason').eq('class_id', classId).order('surname'),
        supabase.from('claims').select('entry_id,claimed_at,method,class_list_entries!inner(class_id)').eq('class_list_entries.class_id', classId),
        supabase.from('inbox_items').select('kind,payload').eq('class_id', classId).eq('status', 'open'),
        supabase.rpc('class_priority_students', { p_class: classId }),
        supabase.rpc('class_list_status'),
      ]);
      const firstErr = e.error ?? c.error ?? i.error ?? o.error;
      if (firstErr) { setErr(friendly(firstErr.message)); return; }
      setEntries((e.data ?? []) as Entry[]);
      setClaims(new Map(((c.data ?? []) as Claim[]).map((x) => [x.entry_id, x])));
      const items = (i.data ?? []) as { kind: string; payload: { entry_id?: string } }[];
      setInboxCount(items.length);
      setClashes(new Set(items.filter((x) => x.kind === 'clash').map((x) => x.payload.entry_id ?? '')));
      setOthers((o.data ?? []) as Priority[]);
      setHocs(((st.data as { hocs?: string[] } | null)?.hocs ?? []));
    })();
  }, [classId, rev]);
  if (!classId) return <NotHoc />;
  if (entries && entries.length === 0) return <Navigate to="/screens/AT01" replace />;
  const claimed = entries?.filter((e) => claims.has(e.id)).length ?? 0;
  const ql = q.trim().toLowerCase();
  const shown = (entries ?? []).filter((e) => !ql || `${e.surname} ${e.first_name} ${e.middle_name ?? ''} ${e.matric}`.toLowerCase().includes(ql));
  const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return (
    <Screen actions>
      <TopBar title={`Class list · ${label}`} right={<button className="t-13 w-7" style={{ color: 'var(--u-good-2)' }} onClick={() => go('AT15')}>Inbox{inboxCount ? ` · ${inboxCount}` : ''}</button>} />
      <div className="stack pad" style={{ gap: 14 }}>
        {err && <Note>{err}</Note>}
        <div className="row" style={{ gap: 10 }}>
          {[[claimed, 'claimed'], [(entries?.length ?? 0) - claimed, 'not yet'], [others.length, 'other levels']].map(([n, l]) => (
            <Card key={l as string} pad={14} gap={2} style={{ flex: 1 }}><span className="display" style={{ fontSize: 24 }}>{entries ? n : '–'}</span><span className="t-12 faint">{l}</span></Card>
          ))}
        </div>
        <input className="input" placeholder="Search name or matric number" value={q} onChange={(e) => setQ(e.target.value)} />
        <Chips><Chip on={tab === 'mine'} onClick={() => setTab('mine')}>My class · {entries?.length ?? 0}</Chip><Chip on={tab === 'other'} onClick={() => setTab('other')}>Other levels · {others.length}</Chip></Chips>
        <ListCard>
          {entries === null && <ListRow title="Loading…" />}
          {tab === 'mine' && shown.slice(0, 300).map((e) => {
            const c = claims.get(e.id);
            if (editing === e.id) return <StudentEditor key={e.id} entry={e} claimed={Boolean(c)} onCancel={() => setEditing(null)} onDone={() => { setEditing(null); setRev((r) => r + 1); }} />;
            return <ListRow key={e.id} title={`${e.surname} ${e.first_name} ${e.middle_name ?? ''}`.trim()}
              sub={`${e.matric}${c ? ` · claimed ${day(c.claimed_at)}${c.method === 'id_check' ? ' by ID card' : ''}` : ''}${e.reason ? ` · ${e.reason}` : ''}`}
              right={clashes.has(e.id) ? <Pill tone="bad">Clash</Pill> : c ? <Pill tone="good">Claimed</Pill> : <Pill>Not yet</Pill>}
              onClick={clashes.has(e.id) ? () => go('AT15') : () => setEditing(e.id)} />;
          })}
          {tab === 'mine' && shown.length > 300 && <ListRow title={`…and ${shown.length - 300} more. Search to find someone.`} />}
          {tab === 'other' && (others.length ? others.map((o) => <ListRow key={o.registration} title={o.name} sub={`${o.from_class} · ${o.course} · ${o.matric}`} right={<Pill tone="amber">Priority</Pill>} />)
            : <ListRow title="No students from other levels yet" sub="They appear here when you approve their requests in your inbox." />)}
        </ListCard>
        <div className="row between"><span className="t-12 faint">{hocs.length > 1 ? `Shared with ${hocs.length - 1} other HOC${hocs.length > 2 ? 's' : ''}` : 'You are the only HOC so far'}</span><button className="t-12 w-6" style={{ color: 'var(--u-good-2)' }} onClick={() => go('AT06')}>History ›</button></div>
      </div>
      <BottomActions>
        <div className="row" style={{ gap: 10 }}><Button variant="white" onClick={() => go('AT05')}>+ Add a student</Button><Button variant="white" onClick={() => go('AT01')}>Upload again</Button></div>
      </BottomActions>
    </Screen>
  );
}

/* ---------- AT05 · add a student ---------- */
export function LiveAddStudent() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { classId } = useHocClass();
  const [s, setS] = useState({ surname: '', first: '', middle: '', matric: params.get('matric') ?? '' });
  const [why, setWhy] = useState('Direct entry');
  const [tried, setTried] = useState(false);
  const { busy, error, run } = useAction();
  if (!classId) return <NotHoc />;
  const errs = { surname: !s.surname.trim() ? 'Required' : null, first: !s.first.trim() ? 'Required' : null, matric: !/^\d{6,12}$/.test(s.matric) ? '6 to 12 digits' : null };
  const save = () => { setTried(true); if (errs.surname || errs.first || errs.matric) return; run(async () => {
    await rpc('add_student', { p_class: classId, p_surname: s.surname, p_first: s.first, p_middle: s.middle, p_matric: s.matric, p_reason: why });
    const item = params.get('item');
    if (item) await rpc('resolve_inbox', { p_item: item, p_decision: 'resolved' });
    navigate(item ? '/screens/AT15' : '/screens/AT04', { replace: true });
  }); };
  return (
    <Screen actions>
      <TopBar title="Add a student" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={30}>ADD A STUDENT</Display>
        <p className="t-15 muted">For direct-entry students, transfers, or anyone the department list missed.</p>
        <TextInput label="Surname" value={s.surname} onChange={(v) => setS({ ...s, surname: v.toUpperCase() })} error={tried ? errs.surname : null} />
        <TextInput label="First name" value={s.first} onChange={(v) => setS({ ...s, first: v })} error={tried ? errs.first : null} />
        <TextInput label="Middle name (optional)" value={s.middle} onChange={(v) => setS({ ...s, middle: v })} />
        <TextInput label="Matric number" value={s.matric} inputMode="numeric" maxLength={12} onChange={(v) => setS({ ...s, matric: v.replace(/\D/g, '') })} error={tried ? errs.matric : null} />
        <Label>Why are they being added?</Label>
        <Chips>{['Direct entry', 'Transfer', 'Missed off the list'].map((w) => <Chip key={w} on={w === why} onClick={() => setWhy(w)}>{w}</Chip>)}</Chips>
        {error && <Note>{error}</Note>}
      </div>
      <BottomActions hint="Your other HOCs and the lecturers will see who added them."><Button onClick={save} disabled={busy}>{busy ? 'Adding…' : 'Add to class list'}</Button></BottomActions>
    </Screen>
  );
}

/* ---------- AT06 · history ---------- */
type Event = { action: string; detail: string | null; at: string; by: string };
const VERB: Record<string, string> = { uploaded: 'uploaded the class list', added: 'added a student', edited: 'fixed a student', removed: 'removed a student', clash: 'settled a clash', id_check: 'confirmed a student by ID card', priority: 'answered a priority request' };
export function LiveListHistory() {
  const { classId } = useHocClass();
  const [events, setEvents] = useState<Event[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!classId) return;
    supabase.rpc('class_history', { p_class: classId }).then(({ data, error }) => { if (error) setErr(friendly(error.message)); else setEvents((data ?? []) as Event[]); });
  }, [classId]);
  if (!classId) return <NotHoc />;
  return (
    <Screen>
      <TopBar title="History" />
      <div className="stack pad" style={{ gap: 14, paddingBottom: 28 }}>
        <Display size={30}>EVERY CHANGE, WHO MADE IT</Display>
        {err && <Note>{err}</Note>}
        <ListCard>
          {events === null && <ListRow title="Loading…" />}
          {events?.length === 0 && <ListRow title="No changes yet" />}
          {events?.map((e, i) => <ListRow key={i} title={`${e.by} ${VERB[e.action] ?? e.action}`} sub={`${e.detail ?? ''} · ${new Date(e.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}`} />)}
        </ListCard>
        <p className="t-13 faint">Lecturers can see this history too. Nothing is ever deleted without a record.</p>
      </div>
    </Screen>
  );
}
