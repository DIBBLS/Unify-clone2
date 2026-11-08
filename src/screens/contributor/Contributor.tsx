import { useState } from 'react';
import { ArrowRight, FileText, Plus, Sparkles, PenLine, Bot, AlertTriangle, Check } from 'lucide-react';
import { Screen, TabBar, BottomActions } from '../../components/chrome';
import { Button, Card, Display, Label, ListCard, ListRow, Pill, Chip, Chips, Segmented, Checkbox } from '../../components/ui';
import { BoxBoy, Wordmark } from '../../components/brand';
import { useGo } from '../../components/nav';
import { S26ClassNote } from '../student/Learning';

/* ===================== Contributor (C01–C06) =====================
   Contributors are students who turn lecturer materials into weekly notes.
   Studio has three steps: Compose → Review → Live. */

/* C01 · Dashboard */
export function C01Dashboard() {
  const go = useGo();
  return (
    <Screen tabs>
      <div className="stack" style={{ background: 'var(--u-green)', padding: '14px 16px 22px', gap: 12 }}>
        <Wordmark />
        <Display size={32}>{'GOOD MORNING,\nDAVID.'}</Display>
        <span className="t-13 w-6" style={{ marginTop: -6 }}>Contributor · MEE 301 & MEE 351</span>
        <div className="row" style={{ gap: 8 }}>
          {[['6', 'weeks live'], ['2', 'courses'], ['312', 'students'], ['1', 'due now']].map(([n, l]) => (
            <span key={l} className="stack center" style={{ flex: 1, background: 'rgba(255,255,255,.55)', borderRadius: 14, padding: '10px 0' }}><span className="display" style={{ fontSize: 22 }}>{n}</span><span className="t-12 w-6">{l}</span></span>
          ))}
        </div>
      </div>
      <div className="stack pad" style={{ gap: 12, paddingTop: 16, paddingBottom: 24 }}>
        <Label>Due this week</Label>
        <Card tone="dark" pad={18} gap={8}>
          <div className="row between"><span className="eyebrow" style={{ color: 'var(--u-green)', fontSize: 11 }}>MEE 301 · Week 4</span><Pill tone="amber">5 days left</Pill></div>
          <span className="t-17 w-7">Vector calculus: gradient, divergence, curl</span>
          <span className="row t-13" style={{ gap: 6, color: '#aaa' }}><FileText size={14} />Week 4 slides.pdf · From Tolu A., HOC · Tue</span>
          <Button onClick={() => go('C02')} style={{ marginTop: 6 }}>Open in Studio <ArrowRight size={16} /></Button>
        </Card>
        <ListCard><ListRow title="MEE 351 · Week 4" sub="Waiting for the lecturer's materials" right={<Pill>Waiting</Pill>} /></ListCard>
        <Label>My courses</Label>
        <ListCard>
          <ListRow title="MEE 301 · Engineering Mathematics III" sub="3 of 12 live · 2 reviewed · 1 pending" />
          <ListRow title="MEE 351 · Fluid Mechanics I" sub="3 of 12 live · 3 reviewed · 0 pending" />
        </ListCard>
        <div className="row between"><Label>Student reports</Label><Pill tone="bad">2 to fix</Pill></div>
        <ListCard><ListRow title="MEE 301 · Week 2, Topic 1" sub={'"The worked example skips a step"'} /></ListCard>
      </div>
      <TabBar role="contributor" active="home" />
    </Screen>
  );
}

function StudioTop({ title, step }: { title: string; step: 'Compose' | 'Review' | 'Live' }) {
  const go = useGo();
  return (
    <div className="stack pad" style={{ gap: 12, paddingTop: 16 }}>
      <Display size={30}>{title}</Display>
      <Segmented options={['Compose', 'Review', 'Live'] as const} value={step} onChange={(s) => go(s === 'Compose' ? 'C02' : s === 'Review' ? 'C05' : 'C06')} />
    </div>
  );
}
function ModeTabs({ mode }: { mode: 'ai' | 'manual' | 'external' }) {
  const go = useGo();
  const tabs = [['ai', 'AI Generate', Sparkles, 'C02'], ['manual', 'Manual', PenLine, 'C03'], ['external', 'External AI', Bot, 'C02']] as const;
  return (
    <div className="row" style={{ gap: 6 }}>
      {tabs.map(([k, l, Icon, to]) => (
        <button key={k} onClick={() => go(to)} className="row t-13 w-7" style={{ flex: 1, gap: 6, justifyContent: 'center', padding: 10, borderRadius: 14, background: k === mode ? '#0a0a0a' : '#fff', color: k === mode ? '#fff' : '#555', border: k === mode ? 0 : '1px solid var(--u-border)' }}><Icon size={14} />{l}</button>
      ))}
    </div>
  );
}

/* C02 · Compose with AI from the HOC's slides */
export function C02StudioCompose() {
  const go = useGo();
  const [course, setCourse] = useState('MEE 301');
  const [split, setSplit] = useState(0);
  const splits = [['Use my headers', 'Recommended. Each header becomes a topic'], ['Let the AI decide', 'It finds the topic boundaries'], ['One topic at a time', 'Paste and convert topic by topic']];
  return (
    <Screen tabs actions>
      <StudioTop title="AUTHOR A WEEK" step="Compose" />
      <div className="stack pad" style={{ gap: 14, paddingTop: 14 }}>
        <div className="row" style={{ gap: 16 }}>
          <div className="stack" style={{ gap: 6 }}><span className="field-label">Course</span><Chips>{['MEE 301', 'MEE 351'].map((c) => <Chip key={c} on={c === course} onClick={() => setCourse(c)}>{c}</Chip>)}</Chips></div>
          <div className="stack" style={{ gap: 6 }}><span className="field-label">Week</span><span className="display" style={{ fontSize: 26 }}>4</span></div>
        </div>
        <span className="t-12 faint" style={{ marginTop: -8 }}>Week 4 is the next free week</span>
        <Label>From your HOC</Label>
        <ListCard><ListRow leading={<FileText size={18} />} title="Week 4 slides.pdf" sub="2.1 MB · Tue · text read in" /></ListCard>
        <ModeTabs mode="ai" />
        <div className="stack" style={{ gap: 6 }}>
          <textarea className="input math" style={{ height: 120, padding: 14, resize: 'none', fontSize: 15 }} defaultValue={'WEEK 4 — VECTOR CALCULUS\n1. Gradient of a scalar field: ∇φ = (∂φ/∂x)i + (∂φ/∂y)j + (∂φ/∂z)k …'} />
          <span className="t-12 faint">4,212 of 60,000 characters · 1 part</span>
        </div>
        <Label>How should it split into topics?</Label>
        <ListCard>
          {splits.map(([t, s], i) => <ListRow key={t} title={t} sub={s} onClick={() => setSplit(i)} right={<span style={{ width: 20, height: 20, borderRadius: 10, border: i === split ? '6px solid #0a0a0a' : '1.5px solid var(--u-border)' }} />} />)}
        </ListCard>
        <ListCard><ListRow title="Title, tags and quiz settings" right={<Plus size={18} />} /></ListCard>
      </div>
      <BottomActions><Button onClick={() => go('C03')}>Generate the week <ArrowRight size={16} /></Button></BottomActions>
      <TabBar role="contributor" active="studio" />
    </Screen>
  );
}

/* C03 · Manual builder: one block at a time */
const BLOCKS = ['Paragraph', 'Definition', 'Formula', 'Insight', 'Analogy', 'Diagram', 'Worked example', 'Quick check', 'Pulse check', 'Recall card', 'Fill in', 'Bullets'];
export function C03StudioManual() {
  const [topic, setTopic] = useState(0);
  return (
    <Screen tabs>
      <StudioTop title="AUTHOR A WEEK" step="Compose" />
      <div className="stack pad" style={{ gap: 12, paddingTop: 14, paddingBottom: 24 }}>
        <ModeTabs mode="manual" />
        <Chips>{['Topic 1', 'Topic 2'].map((t, i) => <Chip key={t} small on={i === topic} onClick={() => setTopic(i)}>{t}</Chip>)}<Chip small off>+ Topic</Chip></Chips>
        {[['Paragraph', 'The gradient points in the direction a scalar field rises fastest…'], ['Formula', '∇φ = ∂φ/∂x i + ∂φ/∂y j + ∂φ/∂z k'], ['Worked example', 'Find ∇φ for φ = x²y + yz at (1, 2, −1)']].map(([k, v]) => (
          <Card key={k} pad={14} gap={6} style={{ borderLeft: '3px solid var(--u-green)' }}>
            <Label style={{ fontSize: 10 }}>{k}</Label>
            <span className={k === 'Paragraph' ? 't-14' : 'math'} style={{ fontSize: k === 'Paragraph' ? undefined : 17 }}>{v}</span>
          </Card>
        ))}
        <Label>Add a block</Label>
        <div className="row wrap" style={{ gap: 8 }}>{BLOCKS.map((b) => <button key={b} className="chip">{b}</button>)}</div>
      </div>
      <TabBar role="contributor" active="studio" />
    </Screen>
  );
}

/* C04 · End-of-week quiz: objective + theory */
export function C04StudioQuiz() {
  const go = useGo();
  const [right, setRight] = useState('B');
  return (
    <Screen tabs actions>
      <StudioTop title="WEEK 4 QUIZ" step="Compose" />
      <div className="stack pad" style={{ gap: 12, paddingTop: 14 }}>
        <div className="row" style={{ gap: 10 }}>
          {[['Timer', '20 min'], ['Pass mark', '6 of 10']].map(([l, v]) => <Card key={l} pad={14} gap={2} style={{ flex: 1 }}><Label style={{ fontSize: 10 }}>{l}</Label><span className="t-17 w-7">{v}</span></Card>)}
        </div>
        <div className="row between"><Label>Objective · 7 of 10</Label><button className="t-13 w-7" style={{ color: 'var(--u-good-2)' }}>+ Add</button></div>
        <Card pad={16} gap={8}>
          <Label style={{ fontSize: 10 }}>Question 7</Label>
          <span className="t-15 w-7">The divergence of a vector field measures:</span>
          {[['A', 'How fast the field rotates'], ['B', 'The net outflow per unit volume at a point'], ['C', 'The steepest rate of change'], ['D', "The field's magnitude"]].map(([k, t]) => (
            <button key={k} onClick={() => setRight(k)} className="row" style={{ gap: 10, padding: 10, borderRadius: 12, background: k === right ? 'var(--u-good-tint)' : 'var(--u-card-2)', textAlign: 'left' }}>
              <span style={{ width: 24, height: 24, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, background: k === right ? 'var(--u-good-2)' : '#fff', color: k === right ? '#fff' : '#555' }}>{k === right ? <Check size={13} strokeWidth={3} /> : k}</span>
              <span className="t-14">{t}</span>
            </button>
          ))}
        </Card>
        <div className="row between"><Label>Theory · 3 of 10</Label><button className="t-13 w-7" style={{ color: 'var(--u-good-2)' }}>+ Add</button></div>
        <ListCard>
          <ListRow title={<span className="math" style={{ fontSize: 16 }}>1. Find ∇φ for φ = x²y + yz at (1, 2, −1).</span>} sub="Answer: 4i + 0j + 2k" />
          <ListRow title={<span className="math" style={{ fontSize: 16 }}>2. Show that ∇ × (∇φ) = 0 for any scalar field φ.</span>} sub="Model solution attached" />
        </ListCard>
      </div>
      <BottomActions><Button onClick={() => go('C05')}>Next: review</Button></BottomActions>
      <TabBar role="contributor" active="studio" />
    </Screen>
  );
}

/* C05 · Review: blockers, a live preview of the student view, and a publish checklist */
export function C05StudioReview() {
  const go = useGo();
  const checks = ["Outcomes match the lecturer's outline", 'Every formula checked against the slides', 'Quiz answers and model solutions are right', 'Nothing copied from a past paper'];
  const [ticked, setTicked] = useState<boolean[]>([true, true, false, false]);
  const ready = ticked.every(Boolean);
  return (
    <Screen tabs actions>
      <StudioTop title="REVIEW WEEK 4" step="Review" />
      <div className="stack pad" style={{ gap: 12, paddingTop: 14 }}>
        <Card pad={14} gap={4} style={{ background: 'var(--u-warn-tint)', border: 0 }}>
          <span className="row t-14 w-7" style={{ gap: 6, color: 'var(--u-warn-ink)' }}><AlertTriangle size={16} />2 things to fix before publishing</span>
          <span className="t-13" style={{ color: 'var(--u-warn-ink)' }}>• Topic 2 has no quick check{'\n'}</span>
          <span className="t-13" style={{ color: 'var(--u-warn-ink)' }}>• The quiz needs 3 more objective questions</span>
        </Card>
        <Label>How students will see it</Label>
        {/* Scaled live preview of the student note screen. */}
        <div style={{ height: 420, overflow: 'hidden', borderRadius: 24, border: '1px solid var(--u-border)', position: 'relative' }}>
          <div style={{ transform: 'scale(.62)', transformOrigin: 'top left', width: '161%', pointerEvents: 'none' }}><S26ClassNote /></div>
        </div>
        <Label>Before you publish, check</Label>
        <ListCard>
          {checks.map((c, i) => <ListRow key={c} title={c} leading={<Checkbox checked={ticked[i]} />} onClick={() => setTicked(ticked.map((t, k) => (k === i ? !t : t)))} />)}
        </ListCard>
      </div>
      <BottomActions>
        <Button disabled={!ready} onClick={() => go('C06')}>Publish to students</Button>
        <Button variant="white" onClick={() => go('C03')}>Edit content</Button>
      </BottomActions>
      <TabBar role="contributor" active="studio" />
    </Screen>
  );
}

/* C06 · Live */
export function C06StudioLive() {
  const go = useGo();
  return (
    <Screen bg="var(--u-green)" actions>
      <div className="stack pad" style={{ gap: 14, paddingTop: 70 }}>
        <BoxBoy pose="cheer" width={200} />
        <Display size={48}>{'WEEK 4\nIS LIVE.'}</Display>
        <span className="t-15">156 students in 300L can read MEE 301 Week 4 now. It shows a yellow clock until Dr. O. Adeyemi checks it, then a green check.</span>
        <Card pad={16} gap={4} style={{ border: 0 }}><Label style={{ fontSize: 10 }}>Next up</Label><span className="t-15 w-7">MEE 351 · Week 4</span><span className="t-13 muted">Waiting for the lecturer's materials</span></Card>
      </div>
      <BottomActions tone="green"><Button variant="dark" onClick={() => go('C01')}>Back to my dashboard</Button></BottomActions>
    </Screen>
  );
}
