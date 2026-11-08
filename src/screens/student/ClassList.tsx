import { useState, type ReactNode } from 'react';
import { Check, ChevronRight, ClipboardPaste, Sheet as SheetIcon, Upload, X } from 'lucide-react';
import { Screen, TopBar, BottomActions } from '../../components/chrome';
import { Button, Card, Chip, Chips, Display, Field, Label, ListCard, ListRow, Pill } from '../../components/ui';
import { BoxBoy, FadedBoxBoy } from '../../components/brand';
import { useGo } from '../../components/nav';

/* ===================== Class list & claiming your name (AT01–AT19) =====================
   Decisions (5 Nov):
   - The HOC MUST upload the class list (surname, first, middle name, matric) before anyone claims.
     Upload a document (Excel/CSV, Word, PDF), paste a list, or fill our template. No photos.
   - Students sign up/log in with their normal Gmail. The first time they want an attendance pass,
     they sign in ONCE with their LASU student email (firstname.lastnameMATRIC@st.lasu.edu.ng).
     The matric in the address is matched to the list; name + matric lock to the account.
   - Can't get into student email → HOC checks their ID card in person.
   - Clashes / not on list / priority (carryover) requests land in the HOC's inbox.
   - Priority students are matched once against their OWN class list; the other level's HOC
     only approves them onto that course's register.
   - The list is visible only to that class's HOCs and lecturers. Every edit is logged.
   - Each new session the class is promoted (300L → 400L) and the list carries over.
   - Later: fill the list straight from the school's systems (portal) when that's possible. */

const Arrow = () => <ChevronRight size={18} color="#8a8a8a" />;
const Ico = ({ children, dark }: { children: ReactNode; dark?: boolean }) => (
  <span style={{ width: 36, height: 36, borderRadius: 18, display: 'grid', placeItems: 'center', background: dark ? '#0a0a0a' : 'var(--u-card-2)', color: dark ? 'var(--u-green)' : '#0a0a0a', flexShrink: 0 }}>{children}</span>
);
const Step = ({ n, on = true }: { n: number; on?: boolean }) => (
  <span style={{ width: 30, height: 30, borderRadius: 15, display: 'grid', placeItems: 'center', background: on ? '#0a0a0a' : 'var(--u-card-2)', color: on ? 'var(--u-green)' : '#8a8a8a', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{n}</span>
);
function Steps({ items, on = true }: { items: [string, string][]; on?: boolean }) {
  return (
    <Card pad={16} gap={14}>
      {items.map(([t, s], i) => (
        <div key={t} className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
          <Step n={i + 1} on={on} />
          <span className="stack" style={{ gap: 2 }}><span className="t-15 w-6">{t}</span><span className="t-13 faint">{s}</span></span>
        </div>
      ))}
    </Card>
  );
}
const NameCard = ({ eyebrow, name, sub, foot }: { eyebrow: string; name: string; sub: string; foot?: string }) => (
  <Card tone="dark" pad={20} gap={6}>
    <span className="eyebrow" style={{ color: 'var(--u-green)', fontSize: 11 }}>{eyebrow}</span>
    <span className="display" style={{ fontSize: 24, color: '#fff' }}>{name}</span>
    <span className="t-13" style={{ color: 'rgba(255,255,255,.7)' }}>{sub}</span>
    {foot && <span className="t-13 w-6" style={{ color: 'var(--u-green)' }}>{foot}</span>}
  </Card>
);

/* ---------- HOC: class list ---------- */

/* AT01 · Set up the class list */
export function AT01SetUpList() {
  const go = useGo();
  return (
    <Screen>
      <TopBar title="Class list" />
      <div className="stack pad" style={{ gap: 14, paddingBottom: 28 }}>
        <Display size={30}>UPLOAD YOUR CLASS LIST</Display>
        <p className="t-15 muted">Your class list is how attendance knows who is who. Students claim their own name from it, so nobody types their name differently.</p>
        <ListCard>
          <ListRow leading={<Ico dark><Upload size={16} /></Ico>} title="Upload a document" sub="Excel, CSV, Word or PDF" right={<Arrow />} onClick={() => go('AT01a')} />
          <ListRow leading={<Ico><ClipboardPaste size={16} /></Ico>} title="Paste the list" sub="Copy names and matric numbers from anywhere" right={<Arrow />} onClick={() => go('AT02')} />
          <ListRow leading={<Ico><SheetIcon size={16} /></Ico>} title="Use our template" sub="A sheet with the right columns. Fill it, then upload it" right={<Arrow />} onClick={() => go('AT01b')} />
        </ListCard>
        <Card pad={16} gap={4} style={{ background: 'var(--u-card-2)', border: 0 }}>
          <span className="t-14 w-6">What each row needs</span>
          <span className="t-13 muted">Surname, first name, middle name and matric number. Department and level come from your class.</span>
        </Card>
        <Card pad={16} style={{ background: 'var(--u-good-tint)', border: 0 }}>
          <span className="t-13 w-5" style={{ color: 'var(--u-good)' }}>Your class can have more than one HOC. Any of you can upload or edit the list, and you all share the same one. Only your class's HOCs and lecturers can see it.</span>
        </Card>
      </div>
    </Screen>
  );
}

/* AT01a · Upload a document: Unify reads it and guesses which column is which; the HOC can correct the match. */
const COLS: [string, string, string][] = [['A · "SURNAME"', 'Surname', 'OLOTUCHE'], ['B · "FIRST NAME"', 'First name', 'Joshua'], ['C · "OTHER NAMES"', 'Middle name', 'Oluwaseun'], ['D · "MATRIC NO"', 'Matric number', '220801234']];
const TARGETS = ['Surname', 'First name', 'Middle name', 'Matric number', 'Ignore'];
export function AT01aUploadDocument() {
  const go = useGo();
  const [map, setMap] = useState(COLS.map((c) => c[1]));
  return (
    <Screen actions>
      <TopBar title="Upload a document" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={30}>UPLOAD YOUR CLASS LIST</Display>
        <div className="stack" style={{ gap: 10, padding: 20, borderRadius: 20, background: '#fff', border: '1.5px dashed #c9c6bf' }}>
          <div className="row" style={{ gap: 12 }}>
            <span style={{ width: 40, height: 40, borderRadius: 10, background: '#1d6f42', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700 }}>XLS</span>
            <span className="grow stack"><span className="t-15 w-6">300L ECE class list.xlsx</span><span className="t-12 faint">48 KB · Excel · 1 sheet</span></span>
            <button className="t-13 w-6" style={{ color: 'var(--u-good-2)' }}>Change</button>
          </div>
          <span className="row t-13 w-6" style={{ gap: 8, padding: '10px 12px', borderRadius: 12, background: 'var(--u-good-tint)', color: 'var(--u-good)' }}><Check size={14} />312 students read from Sheet 1</span>
        </div>
        <Label>Which column is which?</Label>
        <span className="t-13 faint" style={{ marginTop: -8 }}>We guessed from the headings. Change any that are wrong.</span>
        <ListCard>
          {COLS.map(([col, , ex], i) => (
            <ListRow key={col} title={col} sub={`e.g. ${ex}`} right={
              <select value={map[i]} onChange={(e) => setMap(map.map((m, k) => (k === i ? e.target.value : m)))} className="t-13 w-6" style={{ padding: '8px 10px', borderRadius: 10, background: 'var(--u-card-2)', border: '1px solid var(--u-border)' }}>
                {TARGETS.map((t) => <option key={t}>{t}</option>)}
              </select>} />
          ))}
        </ListCard>
        <span className="t-12 faint">Column E "PHONE" will be ignored</span>
      </div>
      <BottomActions hint="Next you'll see any rows that need fixing."><Button onClick={() => go('AT03')}>Check the list</Button></BottomActions>
    </Screen>
  );
}

/* AT01b · Our template */
export function AT01bTemplate() {
  const go = useGo();
  const rows = [['OLOTUCHE', 'Joshua', 'Oluwaseun', '220801234'], ['BELLO', 'Amaka', 'Chioma', '220803398'], ['', '', '', '']];
  return (
    <Screen actions>
      <TopBar title="Use our template" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={30}>FILL IN OUR TEMPLATE</Display>
        <p className="t-15 muted">Four columns, one student per row. Open it in Excel or Google Sheets, fill it, then upload it back here.</p>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead><tr style={{ background: '#0a0a0a' }}>{['SURNAME', 'FIRST NAME', 'MIDDLE NAME', 'MATRIC NO'].map((h) => <th key={h} style={{ color: 'var(--u-green)', textAlign: 'left', padding: 10, fontWeight: 700 }}>{h}</th>)}</tr></thead>
            <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={{ padding: 10, height: 36, borderTop: '1px solid var(--u-border)', borderLeft: j ? '1px solid var(--u-border)' : 0 }}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <Card pad={16} gap={8} style={{ background: 'var(--u-card-2)', border: 0 }}>
          {['Matric numbers exactly as on the ID card', "Leave middle name empty if there isn't one", "Department and level come from your class, so don't add them"].map((t) => <span key={t} className="t-13 muted">• {t}</span>)}
        </Card>
      </div>
      <BottomActions>
        <Button>Save the template</Button>
        <Button variant="white" onClick={() => go('AT01a')}>Upload my filled template</Button>
      </BottomActions>
    </Screen>
  );
}

/* AT02 · Paste the list */
export function AT02PasteList() {
  const go = useGo();
  return (
    <Screen actions>
      <TopBar title="Paste the list" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={30}>PASTE IT HERE</Display>
        <p className="t-15 muted">One student per line. Any order works: Unify finds the names and the matric number.</p>
        <textarea className="input" style={{ height: 260, padding: 16, resize: 'none', fontSize: 13, lineHeight: 1.6, border: '1.5px solid #0a0a0a' }}
          defaultValue={'ABIODUN Mariam Folake   220801001\nADEBAYO Kunle Tobi   220801117\nADEKUNLE Daniel   220801045\nAKINWALE Fathia Bisola   220801063\nBELLO Amaka Chioma   220803398\n…\nOLOTUCHE Joshua Oluwaseun   220801234\nYUSUF Zainab   220806042'} />
        <span className="t-12 w-6 faint">315 lines pasted</span>
      </div>
      <BottomActions hint="You can fix anything on the next screen."><Button onClick={() => go('AT03')}>Read the list</Button></BottomActions>
    </Screen>
  );
}

/* AT03 · Check the list: flagged rows first */
const FLAGGED: [string, string, string][] = [
  ['ADEBAYO Kunle Tobi', '220801117 · same matric as row 88', 'Duplicate'],
  ['ADEKUNLE Daniel', '22080145 · matric looks short (8 digits)', 'Check'],
  ['— Fathia Bisola', '220801063 · surname missing', 'Fix'],
];
export function AT03CheckList() {
  const go = useGo();
  return (
    <Screen actions>
      <TopBar title="Check the list" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Card tone="dark" pad={18} gap={6}>
          <span className="display" style={{ fontSize: 22, color: '#fff' }}>312 STUDENTS FOUND</span>
          <span className="t-13" style={{ color: 'rgba(255,255,255,.7)' }}>3 rows need you · 309 look right</span>
        </Card>
        <Label style={{ color: 'var(--u-warn-ink)' }}>Needs you · 3</Label>
        <ListCard>
          {FLAGGED.map(([n, s, tag]) => <div key={n} style={{ background: 'var(--u-warn-tint)' }}><ListRow title={n} sub={s} right={<Pill tone="warn">{tag}</Pill>} /></div>)}
        </ListCard>
        <Label>Looks right · 309</Label>
        <ListCard>
          {[['ABIODUN Mariam Folake', '220801001'], ['BELLO Amaka Chioma', '220803398'], ['OLOTUCHE Joshua Oluwaseun', '220801234']].map(([n, m]) => <ListRow key={m} title={n} sub={m} />)}
        </ListCard>
      </div>
      <BottomActions hint="Fix the 3 rows first, or confirm and fix them later."><Button onClick={() => go('AT04')}>Confirm list · 312 students</Button></BottomActions>
    </Screen>
  );
}

/* AT04 · The confirmed list */
export function AT04ClassList() {
  const go = useGo();
  const [tab, setTab] = useState<'mine' | 'other'>('mine');
  const mine: [string, string, ReactNode][] = [
    ['ABIODUN Mariam Folake', '220801001 · claimed 2 Nov', <Pill tone="good">Claimed</Pill>],
    ['ADEBAYO Kunle Tobi', '220801117 · two accounts tried', <Pill tone="bad">Clash</Pill>],
    ['AKINWALE Fathia Bisola', '220801063', <Pill>Not yet</Pill>],
    ['BELLO Amaka Chioma', '220803398 · claimed 3 Nov', <Pill tone="good">Claimed</Pill>],
  ];
  const other: [string, string, ReactNode][] = [
    ['OKAFOR Ada · 400L ECE', 'ECE 305 · approved 3 Nov', <Pill tone="amber">Priority</Pill>],
    ['EZE Chidera · 400L ECE', 'ECE 303 · approved 3 Nov', <Pill tone="amber">Priority</Pill>],
  ];
  return (
    <Screen actions>
      <TopBar title="Class list · 300L ECE" right={<button className="t-13 w-7" style={{ color: 'var(--u-good-2)' }} onClick={() => go('AT15')}>Inbox · 4</button>} />
      <div className="stack pad" style={{ gap: 14 }}>
        <div className="row" style={{ gap: 10 }}>
          {[['241', 'claimed'], ['71', 'not yet'], ['6', 'other levels']].map(([n, l]) => <Card key={l} pad={14} gap={2} style={{ flex: 1 }}><span className="display" style={{ fontSize: 24 }}>{n}</span><span className="t-12 faint">{l}</span></Card>)}
        </div>
        <input className="input" placeholder="Search name or matric number" />
        <Chips><Chip on={tab === 'mine'} onClick={() => setTab('mine')}>My class · 312</Chip><Chip on={tab === 'other'} onClick={() => setTab('other')}>Other levels · 6</Chip></Chips>
        <ListCard>{(tab === 'mine' ? mine : other).map(([n, s, r]) => <ListRow key={n} title={n} sub={s} right={r} onClick={() => n.startsWith('ADEBAYO') && go('AT16')} />)}</ListCard>
        <div className="row between"><span className="t-12 faint">Shared with Femi O. (HOC) · last edit by you, 4 Nov</span><button className="t-12 w-6" style={{ color: 'var(--u-good-2)' }} onClick={() => go('AT06')}>History ›</button></div>
      </div>
      <BottomActions><Button variant="white" onClick={() => go('AT05')}>+ Add a student</Button></BottomActions>
    </Screen>
  );
}

/* AT05 · Add a student (direct entry, transfer, missed off the list) */
export function AT05AddStudent() {
  const go = useGo();
  const [why, setWhy] = useState('Direct entry');
  return (
    <Screen actions>
      <TopBar title="Add a student" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={30}>ADD A STUDENT</Display>
        <p className="t-15 muted">For direct-entry students, transfers, or anyone the department list missed.</p>
        <Field label="Surname" value="OYELARAN" />
        <Field label="First name" value="Tomiwa" />
        <Field label="Middle name (optional)" value="Grace" />
        <Field label="Matric number" value="220811902" />
        <Label>Why are they being added?</Label>
        <Chips>{['Direct entry', 'Transfer', 'Missed off the list'].map((w) => <Chip key={w} on={w === why} onClick={() => setWhy(w)}>{w}</Chip>)}</Chips>
      </div>
      <BottomActions hint="Your other HOC and the lecturers will see who added them."><Button onClick={() => go('AT04')}>Add to class list</Button></BottomActions>
    </Screen>
  );
}

/* AT06 · Edit history */
export function AT06ListHistory() {
  return (
    <Screen>
      <TopBar title="History" />
      <div className="stack pad" style={{ gap: 14, paddingBottom: 28 }}>
        <Display size={30}>EVERY CHANGE, WHO MADE IT</Display>
        <ListCard>
          {[['You added OYELARAN Tomiwa Grace', 'Direct entry · 4 Nov, 2:10 PM'], ['Femi O. fixed a matric number', 'ADEKUNLE Daniel: 22080145 → 220801045 · 3 Nov'], ['You approved a priority student', 'EZE Chidera (400L) for ECE 303 · 3 Nov'], ['You settled a clash', "220801117 kept on Kunle Adebayo's account · 2 Nov"], ['You uploaded the class list', '312 students · Excel file · 1 Nov']].map(([t, s]) => <ListRow key={t} title={t} sub={s} />)}
        </ListCard>
        <p className="t-13 faint">Lecturers can see this history too. Nothing is ever deleted without a record.</p>
      </div>
    </Screen>
  );
}

/* ---------- Student: claim your name ---------- */

/* AT07 · Claim your name (shown the first time a student opens their pass) */
export function AT07ClaimName() {
  const go = useGo();
  return (
    <Screen actions>
      <TopBar title="Attendance" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={30}>CLAIM YOUR NAME</Display>
        <p className="t-15 muted">Attendance uses your class list, so your name is written the same way on every register. Sign in once with your LASU student email to prove it's you.</p>
        <Steps items={[['Sign in with your student email', 'Only this once. You keep using your normal Gmail.'], ["Check it's you", 'We find your name on the list your HOC uploaded.'], ['Get your attendance pass', 'Ready for every class you take.']]} />
      </div>
      <BottomActions hint="firstname.lastnameMATRIC@st.lasu.edu.ng">
        <Button variant="white" onClick={() => go('AT08')}><img src="/boxboy/google.png" alt="" width={18} height={18} /> Continue with student email</Button>
        <button className="t-14 w-6" style={{ color: 'var(--u-good-2)' }} onClick={() => go('AT13')}>Can't get into your student email?</button>
      </BottomActions>
    </Screen>
  );
}

/* AT08 · Is this you? */
export function AT08IsThisYou() {
  const go = useGo();
  return (
    <Screen actions>
      <TopBar title="Claim your name" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={30}>IS THIS YOU?</Display>
        <NameCard eyebrow="From the 300L ECE class list" name="OLOTUCHE JOSHUA OLUWASEUN" sub="Matric 220801234 · Electrical & Computer Eng. · 300L" />
        <Card pad={16} gap={4} style={{ background: 'var(--u-card-2)', border: 0 }}>
          <span className="t-12 faint">Matched from</span>
          <span className="t-14 w-6">joshua.olotuche220801234@st.lasu.edu.ng</span>
        </Card>
        <p className="t-13 faint">Once you confirm, this name and matric number are locked to your account. Only your HOC can change them.</p>
      </div>
      <BottomActions>
        <Button onClick={() => go('AT09')}>Yes, this is me</Button>
        <Button variant="white" onClick={() => go('AT12')}>This isn't me</Button>
      </BottomActions>
    </Screen>
  );
}

/* AT09 · On the list */
export function AT09OnTheList() {
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

/* AT10 · List not uploaded yet */
export function AT10ListNotUp() {
  return (
    <Screen actions>
      <TopBar title="Attendance" />
      <div className="stack pad" style={{ gap: 14, alignItems: 'flex-start' }}>
        <BoxBoy pose="peeking" width={200} style={{ alignSelf: 'center' }} />
        <Display size={30}>YOUR CLASS LIST ISN'T UP YET</Display>
        <p className="t-15 muted">Your HOC uploads the list once. As soon as it's up, we'll tell you and you can claim your name.</p>
        <ListCard style={{ alignSelf: 'stretch' }}><ListRow title="Femi O. and Tolu A." sub="HOCs, 300L ECE" right={<Pill tone="dark">HOC</Pill>} /></ListCard>
      </div>
      <BottomActions hint="We send one reminder a day, however many classmates tap it."><Button>Remind my HOCs</Button></BottomActions>
    </Screen>
  );
}

/* AT11 · Not on the list */
export function AT11NotOnList() {
  const go = useGo();
  return (
    <Screen actions>
      <TopBar title="Claim your name" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={30}>YOU'RE NOT ON THE LIST YET</Display>
        <p className="t-15 muted">Matric 220811902 from your student email isn't on the 300L ECE class list. Your HOC can add you. This often happens to direct-entry and transfer students.</p>
        <ListCard>
          <ListRow title="Ask my HOC to add me" sub="They get your name and matric number in their inbox" right={<Arrow />} />
          <ListRow title="Wrong class?" sub="Change your department or level in Me" right={<Arrow />} onClick={() => go('S47')} />
        </ListCard>
      </div>
      <BottomActions hint="You'll get a notification when they do."><Button>Ask my HOC to add me</Button></BottomActions>
    </Screen>
  );
}

/* AT12 · Matric already claimed → message box to the HOC */
export function AT12AlreadyClaimed() {
  const [sent, setSent] = useState(false);
  return (
    <Screen actions>
      <TopBar title="Claim your name" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={30}>THIS MATRIC NUMBER IS ALREADY CLAIMED</Display>
        <p className="t-15 muted">Someone else's account has 220801117. Tell your HOC: they see both accounts and decide.</p>
        <Label>Message to your HOC</Label>
        <textarea className="input" style={{ height: 120, padding: 16, resize: 'none', border: '1.5px solid #0a0a0a', lineHeight: 1.45 }} defaultValue="Someone claimed my matric number. I'm Kunle Adebayo, 300L ECE, 220801117. I can show my ID card." />
        {sent && <Card pad={12} style={{ background: 'var(--u-good-tint)', border: 0, flexDirection: 'row', gap: 8 }}><Check size={16} color="var(--u-good)" /><span className="t-13 w-6" style={{ color: 'var(--u-good)' }}>Sent to Femi O. and Tolu A.</span></Card>}
      </div>
      <BottomActions hint="Until your HOC decides, neither account gets a pass for this matric number."><Button onClick={() => setSent(true)}>Send to my HOC</Button></BottomActions>
    </Screen>
  );
}

/* AT13 · No access to student email → HOC checks the ID card */
export function AT13ShowIdCard() {
  return (
    <Screen>
      <TopBar title="Claim your name" />
      <div className="stack pad" style={{ gap: 14, paddingBottom: 28 }}>
        <Display size={30}>SHOW YOUR ID CARD TO YOUR HOC</Display>
        <p className="t-15 muted">No access to your student email? Your HOC can confirm you in person.</p>
        <NameCard eyebrow="Claim request" name="ADEKUNLE DANIEL" sub="Matric 220801045 · 300L ECE" foot="Sent to Femi O. and Tolu A." />
        <Steps on={false} items={[['Find your HOC in class', 'Take your LASU ID card.'], ['They check your card', 'Name, matric number and photo.'], ['Your pass unlocks', "You'll get a notification."]]} />
      </div>
    </Screen>
  );
}

/* AT14 · Priority (carryover) course: ask the other level's HOC to add you to that register */
export function AT14PriorityAttendance() {
  const [asked, setAsked] = useState(true);
  return (
    <Screen>
      <TopBar title="MEE 203" />
      <div className="stack pad" style={{ gap: 14, paddingBottom: 28 }}>
        <Chips><Pill tone="amber">PRIORITY</Pill><Pill>200L</Pill></Chips>
        <Display size={30}>ENGINEERING DRAWING II</Display>
        <p className="t-15 muted">Your notes, quizzes and timetable for MEE 203 are already on your Home.</p>
        <Card pad={18} gap={10}>
          <span className="t-16 w-6">Attendance for MEE 203</span>
          <span className="t-14 muted">The 200L MEE HOC keeps this register. Ask to be added so your attendance counts for the lecturer.</span>
          {asked
            ? <div className="row" style={{ gap: 10, padding: '12px 14px', background: 'var(--u-good-tint)', borderRadius: 14 }}><Check size={16} color="var(--u-good)" /><span className="t-13 w-5" style={{ color: 'var(--u-good)' }}>Request sent to Tolu A., HOC 200L MEE · today 9:12 AM</span></div>
            : <Button onClick={() => setAsked(true)}>Ask to be added</Button>}
        </Card>
        <p className="t-13 faint">Your name and matric come from your own class list, so the HOC only has to tap Approve.</p>
      </div>
    </Screen>
  );
}

/* ---------- HOC: inbox, clash, ID check, new session ---------- */

type InboxItem = { tone: 'bad' | 'grey' | 'warn' | 'amber'; tag: string; title: string; sub: string; action: string; to?: string; decline?: boolean };
const INBOX: InboxItem[] = [
  { tone: 'bad', tag: 'Clash', title: 'Two accounts claim 220801117', sub: 'Kunle Adebayo says someone took his matric number · 10 min ago', action: 'Settle it', to: 'AT16' },
  { tone: 'grey', tag: 'Not on the list', title: 'OYELARAN Tomiwa · 220811902', sub: 'Asked to be added · direct entry? · 1 hr ago', action: 'Add', to: 'AT05', decline: true },
  { tone: 'warn', tag: 'ID check', title: 'ADEKUNLE Daniel · 220801045', sub: "Can't get into student email. Check his ID card in class.", action: 'Check', to: 'AT17' },
  { tone: 'amber', tag: 'Priority student', title: 'OKAFOR Ada (400L ECE) · ECE 305', sub: 'Wants to be added to ECE 305 attendance · today', action: 'Approve', decline: true },
];
/* AT15 · Inbox */
export function AT15Inbox() {
  const go = useGo();
  const [f, setF] = useState('All');
  const [done, setDone] = useState<string[]>([]);
  const shown = INBOX.filter((i) => !done.includes(i.title) && (f === 'All' || (f === 'Clashes' ? i.tone === 'bad' : i.tone !== 'bad')));
  return (
    <Screen>
      <TopBar title="Inbox · 300L ECE" />
      <div className="stack pad" style={{ gap: 12, paddingBottom: 28 }}>
        <Chips>{[['All', 4], ['Clashes', 1], ['Requests', 3]].map(([l, n]) => <Chip key={l} small on={f === l} onClick={() => setF(String(l))}>{l} · {n}</Chip>)}</Chips>
        {shown.map((i) => (
          <Card key={i.title} pad={16} gap={8}>
            <Pill tone={i.tone} style={{ alignSelf: 'flex-start' }}>{i.tag}</Pill>
            <span className="t-15 w-6">{i.title}</span>
            <span className="t-13 faint">{i.sub}</span>
            <div className="row" style={{ gap: 8 }}>
              <Button small block={false} variant={i.tone === 'bad' ? 'dark' : 'green'} onClick={() => (i.to ? go(i.to) : setDone([...done, i.title]))}>{i.action}</Button>
              {i.decline && <Button small block={false} variant="white" onClick={() => setDone([...done, i.title])}>Decline</Button>}
            </div>
          </Card>
        ))}
        {shown.length === 0 && <p className="t-15 muted center" style={{ paddingTop: 40 }}>Nothing waiting. Nice.</p>}
      </div>
    </Screen>
  );
}

/* AT16 · Settle a clash */
export function AT16SettleClash() {
  const go = useGo();
  const [pick, setPick] = useState(1);
  const Acc = ({ n, title, tag, s1, s2 }: { n: number; title: string; tag: string; s1: string; s2: string }) => (
    <button onClick={() => setPick(n)} className="card stack" style={{ gap: 6, padding: 16, textAlign: 'left', border: `1.5px solid ${pick === n ? '#0a0a0a' : 'var(--u-border)'}` }}>
      <div className="row between"><span className="t-16 w-6">{title}</span><Pill tone={n === 1 ? 'good' : 'grey'}>{tag}</Pill></div>
      <span className="t-13 muted">{s1}</span><span className="t-12 faint">{s2}</span>
    </button>
  );
  return (
    <Screen actions>
      <TopBar title="Settle a clash" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={30}>WHO OWNS 220801117?</Display>
        <p className="t-15 muted">From the class list: ADEBAYO Kunle Tobi. Two accounts want it.</p>
        <Acc n={1} title="Account 1 · Kunle A." tag="Student email" s1="Claimed with kunle.adebayo220801117@st.lasu.edu.ng" s2="2 Nov, 8:14 AM · 4 classes attended" />
        <Acc n={2} title="Account 2 · K. Tobi" tag="Says it's his" s1={'"Someone claimed my matric number. I\'m Kunle Adebayo, 300L ECE. I can show my ID card."'} s2="5 Nov, 11:02 AM" />
        <Card pad={16} style={{ background: 'var(--u-card-2)', border: 0 }}><span className="t-13 muted">Not sure? Ask both to show their ID cards in class. Attendance for this matric is paused until you decide.</span></Card>
      </div>
      <BottomActions hint="Both students get a message with your decision.">
        <Button onClick={() => go('AT15')}>{pick === 1 ? 'Keep it on account 1' : 'Move it to account 2'}</Button>
      </BottomActions>
    </Screen>
  );
}

/* AT17 · Check an ID card in person */
export function AT17IdCheck() {
  const go = useGo();
  const [ok, setOk] = useState([true, true, false]);
  return (
    <Screen actions>
      <TopBar title="ID check" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Display size={30}>CHECK HIS ID CARD</Display>
        <NameCard eyebrow="On your class list" name="ADEKUNLE DANIEL" sub="Matric 220801045 · 300L ECE" />
        <Label>On the card, check</Label>
        <ListCard>
          {['Name matches', 'Matric number matches', 'Photo is the person in front of you'].map((t, i) => (
            <ListRow key={t} title={t} onClick={() => setOk(ok.map((v, k) => (k === i ? !v : v)))}
              right={<span style={{ width: 24, height: 24, borderRadius: 7, display: 'grid', placeItems: 'center', background: ok[i] ? '#0a0a0a' : '#fff', border: ok[i] ? 0 : '1px solid var(--u-border)' }}>{ok[i] && <Check size={14} color="#50ff90" strokeWidth={3} />}</span>} />
          ))}
        </ListCard>
      </div>
      <BottomActions hint="Your name is saved with this confirmation.">
        <Button disabled={!ok.every(Boolean)} onClick={() => go('AT15')}>Confirm, it's him</Button>
        <Button variant="white" onClick={() => go('AT15')}><X size={16} /> Not a match</Button>
      </BottomActions>
    </Screen>
  );
}

/* AT18 · New session: the class is promoted and the list carries over */
export function AT18NewSession() {
  const go = useGo();
  return (
    <Screen actions>
      <TopBar title="New session" />
      <div className="stack pad" style={{ gap: 14 }}>
        <Pill tone="dark" style={{ alignSelf: 'flex-start' }}>2026/2027</Pill>
        <Display size={30}>300L ECE IS NOW 400L ECE</Display>
        <p className="t-15 muted">Your class moves up together. The class list comes with you, so nobody has to claim their name again.</p>
        <ListCard>
          <ListRow title="Class list carried over" sub="312 students, all claims kept" right={<Pill tone="good">Done</Pill>} />
          <ListRow title="Who isn't moving up?" sub="Mark students repeating or leaving · 0 marked" right={<Arrow />} />
          <ListRow title="New students joining" sub="Add direct entry or transfer students" right={<Arrow />} onClick={() => go('AT05')} />
          <ListRow title="Priority students" sub="Last session's requests end. Students ask again for this session." />
        </ListCard>
        <Card pad={16} style={{ background: 'var(--u-card-2)', border: 0 }}><span className="t-13 muted">Last session's attendance stays on the 300L records. Lecturers can still see it.</span></Card>
        <ListCard><ListRow title="Still HOC this session?" sub="Hand over to the new HOC if not" right={<Pill tone="good">Yes</Pill>} /></ListCard>
      </div>
      <BottomActions><Button onClick={() => go('AT04')}>Start 2026/27 with this list</Button></BottomActions>
    </Screen>
  );
}

/* AT19 · Notifications for the class list and claims */
export function AT19Notifications() {
  const notes = [
    ['now', 'Your class list is up', 'Claim your name to get your attendance pass.'],
    ['2m', 'Your claim is sorted', 'Femi O. confirmed 220801117 is yours. Your pass is ready.'],
    ['1h', "You're on the MEE 203 register", 'Tolu A. added you for attendance. See you Tuesday, 2 PM.'],
    ['3h', '3 students need you', '1 clash, 1 ID check, 1 priority request in your class list inbox.'],
  ];
  return (
    <Screen bg="#101010" style={{ color: '#fff' }}>
      <div className="stack center" style={{ alignItems: 'center', paddingTop: 50 }}>
        <span className="t-17 w-5" style={{ opacity: 0.8 }}>Thursday, 6 November</span>
        <span style={{ fontSize: 72, fontWeight: 600 }}>9:41</span>
      </div>
      <div className="stack pad" style={{ gap: 10, paddingTop: 20 }}>
        {notes.map(([t, h, s], i) => (
          <div key={h} className="stack" style={{ gap: 4, padding: 14, borderRadius: 20, background: '#2a2a2a' }}>
            <div className="row" style={{ gap: 8 }}>
              <span style={{ width: 20, height: 20, borderRadius: 6, background: 'var(--u-green)', display: 'grid', placeItems: 'center', color: '#0a0a0a', fontFamily: 'var(--font-display)', fontSize: 12 }}>U</span>
              <span className="grow t-12 w-6" style={{ opacity: 0.6, letterSpacing: '0.04em' }}>UNIFY LEARN{i === 3 ? ' · HOC' : ''}</span>
              <span className="t-12" style={{ opacity: 0.5 }}>{t}</span>
            </div>
            <span className="t-15 w-6">{h}</span>
            <span className="t-14" style={{ opacity: 0.75 }}>{s}</span>
          </div>
        ))}
      </div>
    </Screen>
  );
}

