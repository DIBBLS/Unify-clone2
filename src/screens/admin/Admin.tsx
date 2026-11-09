import { useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { Pill } from '../../components/ui';
import { useGo } from '../../components/nav';

/* ===================== Unify admin (AD01–AD04) · desktop =====================
   For the Unify team. Counts and status only: names and matric numbers on class
   lists stay with each class's HOCs and lecturers. */

const NAV: [string, string, string?][] = [['Overview', 'AD01'], ['HOC requests', 'AD02', '5'], ['Class lists', 'AD03', '17'], ['Reports', 'AD04', '12'], ['Contributors', ''], ['Lecturers', ''], ['Courses', '']];

export function Shell({ active, title, sub, children, nav = NAV, scope }: { active: string; title: string; sub: string; children: ReactNode; nav?: [string, string, string?][]; scope?: ReactNode }) {
  const go = useGo();
  return (
    <div className="admin-shell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--u-page)', width: '100%' }}>
      <aside className="stack admin-nav" style={{ width: 240, background: '#0a0a0a', padding: '24px 16px', gap: 4, flexShrink: 0 }}>
        <div className="row" style={{ gap: 8, padding: '0 8px 24px' }}>
          <span className="wordmark" style={{ fontSize: 22, color: '#fff' }}>Unify</span>
          <span className="pill" style={{ background: 'var(--u-green)', color: '#0a0a0a' }}>ADMIN</span>
        </div>
        {nav.map(([n, to, count]) => {
          const on = n === active;
          return (
            <button key={n} onClick={() => to && go(to)} className="row between" style={{ padding: '10px 12px', borderRadius: 10, background: on ? '#1f1f1f' : 'transparent', color: on ? 'var(--u-green)' : 'rgba(255,255,255,.7)', fontWeight: on ? 600 : 500, fontSize: 14 }}>
              {n}{count && <span className="pill" style={{ background: on ? 'var(--u-green)' : '#2a2a2a', color: on ? '#0a0a0a' : '#ddd' }}>{count}</span>}
            </button>
          );
        })}
      </aside>
      <main className="stack grow admin-main" style={{ padding: '36px 40px', gap: 20, minWidth: 0 }}>
        <div className="row between" style={{ alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div className="stack" style={{ gap: 4 }}><h1 className="display" style={{ fontSize: 30 }}>{title}</h1><span className="t-14 faint">{sub}</span></div>
          {scope ?? (
            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn--white btn--sm" style={{ width: 'auto' }}>LASU · Faculty of Engineering ▾</button>
              <button className="btn btn--white btn--sm" style={{ width: 'auto' }}>2026/27 · First semester ▾</button>
            </div>
          )}
        </div>
        {children}
      </main>
    </div>
  );
}

export function Table({ cols, rows, highlight }: { cols: string[]; rows: ReactNode[][]; highlight?: number }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead><tr style={{ background: 'var(--u-card-2)' }}>{cols.map((c) => <th key={c} className="label" style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11 }}>{c}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={i} style={{ borderTop: '1px solid var(--u-border)', background: highlight === i ? '#fffbeb' : undefined }}>
            {r.map((c, j) => <td key={j} style={{ padding: '14px 20px', fontWeight: j === 0 ? 600 : 400, color: j === 0 ? '#0a0a0a' : '#555' }}>{c}</td>)}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
export const SmallBtn = ({ children, dark, green, onClick }: { children: ReactNode; dark?: boolean; green?: boolean; onClick?: () => void }) => (
  <button onClick={onClick} className="t-13 w-6" style={{ padding: '8px 14px', borderRadius: 20, whiteSpace: 'nowrap', background: dark ? '#0a0a0a' : green ? 'var(--u-green)' : '#fff', color: dark ? '#fff' : '#0a0a0a', border: dark || green ? 0 : '1px solid var(--u-border)' }}>{children}</button>
);

/* AD01 · Overview */
export function AD01Overview() {
  const go = useGo();
  const kpis: [string, string, string, boolean?][] = [['48', 'Classes on Unify', '5 departments · 100L to 500L'], ['31 / 48', 'Class lists uploaded', '17 classes still waiting', true], ['6,214', 'Students claimed their name', '63% of 9,870 on the lists'], ['12', 'Open note reports', '3 older than 3 days', true]];
  const needs: [string, 'bad' | 'warn' | 'grey', string, string, string, string][] = [
    ['Urgent', 'bad', '5 HOC requests', 'Oldest waiting 2 days. 1 class already has 2 HOCs.', 'Review', 'AD02'],
    ['Soon', 'warn', '17 classes without a list', 'Mostly 100L and 500L. Remind their HOCs.', 'Remind all', 'AD03'],
    ['Soon', 'warn', '3 reports over 3 days old', 'MEE 301 Week 2, ECE 305 Week 1, CHE 352 Week 3', 'Open', 'AD04'],
    ['FYI', 'grey', '1 contributor behind', 'Kemi Okafor · ECE 303 Week 3 notes 3 days late', 'Message', ''],
  ];
  return (
    <Shell active="Overview" title="GOOD MORNING, TEAM" sub="Thursday 6 November · Week 2 of 12">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
        {kpis.map(([v, l, s, warn]) => <div key={l} className="card stack" style={{ padding: 20, gap: 6 }}><span className="display" style={{ fontSize: 32 }}>{v}</span><span className="t-14 w-6">{l}</span><span className="t-12" style={{ color: warn ? 'var(--u-warn-ink)' : '#8a8a8a' }}>{s}</span></div>)}
      </div>
      <div className="admin-split" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 400px', gap: 16, alignItems: 'start' }}>
        <div className="card stack" style={{ padding: 24, gap: 4 }}>
          <span className="label" style={{ fontSize: 12, marginBottom: 8 }}>Needs you today</span>
          {needs.map(([tag, tone, t, s, a, to]) => (
            <div key={t} className="row" style={{ gap: 14, padding: '12px 0' }}>
              <Pill tone={tone}>{tag}</Pill>
              <span className="stack grow" style={{ gap: 2 }}><span className="t-15 w-6">{t}</span><span className="t-13 faint">{s}</span></span>
              <SmallBtn onClick={() => to && go(to)}>{a}</SmallBtn>
            </div>
          ))}
        </div>
        <div className="card stack" style={{ padding: 24, gap: 14 }}>
          <span className="label" style={{ fontSize: 12 }}>Name claims by department</span>
          {[['Electrical & Computer', 78], ['Mechanical', 71], ['Chemical', 58], ['Civil', 49], ['Industrial & Production', 41]].map(([d, v]) => (
            <div key={d} className="stack" style={{ gap: 6 }}>
              <div className="row between t-13"><span className="w-5">{d}</span><span className="w-6">{v}%</span></div>
              <div style={{ height: 8, borderRadius: 4, background: 'var(--u-border)' }}><div style={{ width: `${v}%`, height: 8, borderRadius: 4, background: '#0a0a0a' }} /></div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

/* AD02 · HOC requests */
export function AD02HocRequests() {
  const [checks, setChecks] = useState([true, true, false]);
  return (
    <Shell active="HOC requests" title="HOC REQUESTS" sub="Students asking for HOC tools. One HOC per class, up to 3 for big classes.">
      <div className="admin-split" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 380px', gap: 16, alignItems: 'start' }}>
        <Table cols={['Student', 'Class', 'Confirms', 'Sent', 'Status']} highlight={0} rows={[
          ['Joshua Olotuche', '300L ECE', 'Level adviser', '2 days', <Pill tone="warn">Has 2 HOCs</Pill>],
          ['Mariam Lawal', '100L CHE', 'Level adviser', '1 day', <Pill>New</Pill>],
          ['Samuel Charles', '500L MEE', 'HOD', '1 day', <Pill>New</Pill>],
          ['Fathia Ismail', '200L CVE', 'Level adviser', '5 hrs', <Pill>New</Pill>],
          ['Great Ifet', '400L IPE', 'Course adviser', '2 hrs', <Pill>New</Pill>],
        ]} />
        <div className="card stack" style={{ padding: 24, gap: 14 }}>
          <span className="display" style={{ fontSize: 22 }}>JOSHUA OLOTUCHE</span>
          <span className="t-13 muted">300L Electrical & Computer Eng. · 0813 000 0000 · claimed name ✓</span>
          <div style={{ padding: 14, borderRadius: 12, background: 'var(--u-warn-tint)', color: 'var(--u-warn-ink)', fontSize: 13, lineHeight: 1.45 }}>300L ECE already has 2 HOCs: Femi O. and Tolu A. Big class (312), so a third is allowed. Tell them before approving.</div>
          <span className="label" style={{ fontSize: 11 }}>Checks</span>
          {['Called the level adviser', 'Name is on the 300L ECE class list', 'Told the current HOCs'].map((t, i) => (
            <button key={t} className="row t-14" style={{ gap: 10 }} onClick={() => setChecks(checks.map((c, k) => (k === i ? !c : c)))}>
              <span style={{ width: 20, height: 20, borderRadius: 6, display: 'grid', placeItems: 'center', background: checks[i] ? '#0a0a0a' : '#fff', border: checks[i] ? 0 : '1px solid var(--u-border)' }}>{checks[i] && <Check size={12} color="#50ff90" strokeWidth={3} />}</span>{t}
            </button>
          ))}
          <div className="row" style={{ gap: 10 }}><SmallBtn green>Approve</SmallBtn><SmallBtn>Decline</SmallBtn></div>
          <span className="t-12 faint">The student gets a notification either way.</span>
        </div>
      </div>
    </Shell>
  );
}

/* AD03 · Class lists */
export function AD03ClassLists() {
  const [f, setF] = useState('All 48');
  return (
    <Shell active="Class lists" title="CLASS LISTS" sub="Every class, whether its list is up, and how many students have claimed their name.">
      <div className="row wrap" style={{ gap: 8 }}>{['All 48', 'No list · 17', 'Open clashes · 4'].map((x) => <SmallBtn key={x} dark={x === f} onClick={() => setF(x)}>{x}</SmallBtn>)}</div>
      <Table cols={['Class', 'HOCs', 'List', 'Students', 'Claimed', 'Clashes', '']} rows={[
        ['300L ECE', 'Femi O., Tolu A.', <Pill tone="good">Uploaded</Pill>, '312', '241 · 77%', <Pill tone="bad">1</Pill>, <SmallBtn>Open</SmallBtn>],
        ['300L MEE', 'Kunle B.', <Pill tone="good">Uploaded</Pill>, '248', '176 · 71%', '0', <SmallBtn>Open</SmallBtn>],
        ['200L MEE', 'Tolu A.', <Pill tone="good">Uploaded</Pill>, '455', '301 · 66%', '0', <SmallBtn>Open</SmallBtn>],
        ['100L CHE', 'No HOC yet', <Pill tone="warn">No list</Pill>, '—', '—', '—', <SmallBtn>Find an HOC</SmallBtn>],
        ['500L MEE', 'Samuel C. (pending)', <Pill tone="warn">No list</Pill>, '—', '—', '—', <SmallBtn>Remind HOC</SmallBtn>],
        ['400L IPE', 'Ada O.', <Pill tone="good">Uploaded</Pill>, '96', '39 · 41%', '0', <SmallBtn>Open</SmallBtn>],
        ['200L CVE', 'Ibrahim M.', <Pill tone="warn">No list</Pill>, '—', '—', '—', <SmallBtn>Remind HOC</SmallBtn>],
      ]} />
      <span className="t-13 faint">Unify staff see counts and status only. Names and matric numbers stay with each class's HOCs and lecturers.</span>
    </Shell>
  );
}

/* AD04 · Note reports */
export function AD04Reports() {
  return (
    <Shell active="Reports" title="NOTE REPORTS" sub="What students flagged in the notes, and who is fixing it.">
      <div className="admin-split" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 380px', gap: 16, alignItems: 'start' }}>
        <Table cols={['Where', 'Problem', 'Students', 'Contributor', 'Age', 'Status']} highlight={0} rows={[
          ['MEE 301 · Wk 2 · Topic 1', 'Something looks wrong', '7', 'Tobi A.', '4 days', <Pill tone="warn">With contributor</Pill>],
          ['ECE 305 · Wk 1 · Topic 2', "Image doesn't load", '3', 'Ifeoluwa S.', '3 days', <Pill>New</Pill>],
          ['CHE 352 · Wk 3 · Quiz', "Doesn't match the lecturer", '5', 'Kemi O.', '3 days', <Pill>New</Pill>],
          ['MEE 352 · Wk 2 · Topic 1', 'Something is missing', '2', 'David K.', '1 day', <Pill tone="good">Fixed</Pill>],
        ]} />
        <div className="card stack" style={{ padding: 24, gap: 12 }}>
          <span className="display" style={{ fontSize: 18 }}>MEE 301 · WEEK 2 · TOPIC 1</span>
          <span className="t-14 muted">Worked example 2.1 skips the step from det(A − λI) to the characteristic equation.</span>
          <div style={{ padding: 14, borderRadius: 12, background: 'var(--u-card-2)', fontSize: 13, color: '#555' }}>"The worked example skips a step" — and 6 others said the same</div>
          <span className="t-13 faint">Contributor: Tobi A. · lecturer review: not yet (yellow clock)</span>
          <div className="row" style={{ gap: 10 }}><SmallBtn dark>Remind contributor</SmallBtn><SmallBtn>Mark fixed</SmallBtn></div>
        </div>
      </div>
    </Shell>
  );
}
