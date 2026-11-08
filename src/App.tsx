import { useEffect, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import { SCREENS, GROUPS, byId } from './screens/registry';
import { Wordmark } from './components/brand';

/* Prototype shell.
   /              gallery of every screen, grouped like the Figma sections
   /screens/:id   one screen at phone width, with a small dev bar to step through */

function Gallery() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px 60px', background: 'var(--u-page)', minHeight: '100vh' }}>
      <Wordmark size={22} />
      <h1 className="display" style={{ fontSize: 34, marginTop: 14 }}>Phone screens</h1>
      <p className="t-15 muted" style={{ maxWidth: 560 }}>{SCREENS.length} screens, numbered as in Figma. Tap one to open it. Buttons inside each screen move between screens the same way the real app will.</p>
      {GROUPS.map((g) => (
        <section key={g} style={{ marginTop: 28 }}>
          <div className="label" style={{ marginBottom: 10 }}>{g}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 8 }}>
            {SCREENS.filter((s) => s.group === g).map((s) => (
              <Link key={s.id} to={`/screens/${s.id}`} className="card row" style={{ gap: 10, padding: '12px 14px', textDecoration: 'none', color: 'inherit' }}>
                <span className="t-13 w-8" style={{ color: 'var(--u-good-2)', width: 32 }}>{s.id}</span>
                <span className="t-14 w-6">{s.name}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function DevBar({ id }: { id: string }) {
  const navigate = useNavigate();
  const i = SCREENS.findIndex((s) => s.id === id);
  const prev = SCREENS[i - 1];
  const next = SCREENS[i + 1];
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft' && prev) navigate(`/screens/${prev.id}`);
      if (e.key === 'ArrowRight' && next) navigate(`/screens/${next.id}`);
      if (e.key === 'h') setHidden((h) => !h);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next, navigate]);
  if (hidden || new URLSearchParams(location.search).has('clean')) return null;
  return (
    <div className="row" style={{ position: 'fixed', top: 8, right: 8, zIndex: 100, gap: 4, background: 'rgba(10,10,10,.85)', color: '#fff', borderRadius: 14, padding: 4, fontSize: 12 }}>
      <Link to="/" title="All screens" style={{ color: '#fff', padding: 6, display: 'grid' }}><LayoutGrid size={16} /></Link>
      <button disabled={!prev} onClick={() => prev && navigate(`/screens/${prev.id}`)} style={{ color: '#fff', padding: 6, opacity: prev ? 1 : 0.3, display: 'grid' }}><ChevronLeft size={16} /></button>
      <span className="w-7" style={{ minWidth: 30, textAlign: 'center' }}>{id}</span>
      <button disabled={!next} onClick={() => next && navigate(`/screens/${next.id}`)} style={{ color: '#fff', padding: 6, opacity: next ? 1 : 0.3, display: 'grid' }}><ChevronRight size={16} /></button>
    </div>
  );
}

function ScreenRoute() {
  const { id = '' } = useParams();
  const entry = byId(id);
  useEffect(() => { window.scrollTo(0, 0); }, [id]);
  if (!entry) return <div className="pad t-15" style={{ paddingTop: 40 }}>No screen called {id}. <Link to="/">See all screens</Link></div>;
  const { Component } = entry;
  return (
    <>
      <DevBar id={entry.id} />
      <Component key={entry.id} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Gallery />} />
        <Route path="/screens/:id" element={<ScreenRoute />} />
      </Routes>
    </BrowserRouter>
  );
}
