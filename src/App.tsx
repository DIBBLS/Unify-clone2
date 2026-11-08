import { useEffect, useState, type ComponentType } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import { SCREENS, GROUPS, byId } from './screens/registry';
import { LIVE_SCREENS } from './live';
import { Wordmark } from './components/brand';
import { AuthProvider, useAuth } from './lib/auth';
import { isLive } from './lib/supabase';

/* Routes
   /              live: sends you to welcome, onboarding or home. Preview: the gallery.
   /gallery       every screen, grouped like the Figma sections (always available)
   /screens/:id   one screen. In live mode, screens other than the welcome/sign-in ones need a session. */

/** Screens you can open without being signed in. */
const PUBLIC = new Set(['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'LOGIN', 'RESET', 'TERMS', 'PRIVACY', 'L00', 'L01a', 'L01b', 'L01c', 'L01', 'L02']);

function Gallery() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px 60px', background: 'var(--u-page)', minHeight: '100vh' }}>
      <Wordmark size={22} />
      <h1 className="display" style={{ fontSize: 34, marginTop: 14 }}>Phone screens</h1>
      <p className="t-15 muted" style={{ maxWidth: 560 }}>{SCREENS.length} screens, numbered as in Figma. Tap one to open it.{isLive ? ' Screens marked LIVE use your real account and data.' : ''}</p>
      {GROUPS.map((g) => (
        <section key={g} style={{ marginTop: 28 }}>
          <div className="label" style={{ marginBottom: 10 }}>{g}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 8 }}>
            {SCREENS.filter((s) => s.group === g).map((s) => (
              <Link key={s.id} to={`/screens/${s.id}`} className="card row" style={{ gap: 10, padding: '12px 14px', textDecoration: 'none', color: 'inherit' }}>
                <span className="t-13 w-8" style={{ color: 'var(--u-good-2)', width: 36 }}>{s.id}</span>
                <span className="t-14 w-6 grow">{s.name}</span>
                {isLive && LIVE_SCREENS[s.id] && <span className="pill pill--good">LIVE</span>}
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
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
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
      <Link to="/gallery" title="All screens" style={{ color: '#fff', padding: 6, display: 'grid' }}><LayoutGrid size={16} /></Link>
      <button disabled={!prev} onClick={() => prev && navigate(`/screens/${prev.id}`)} style={{ color: '#fff', padding: 6, opacity: prev ? 1 : 0.3, display: 'grid' }}><ChevronLeft size={16} /></button>
      <span className="w-7" style={{ minWidth: 30, textAlign: 'center' }}>{id}</span>
      <button disabled={!next} onClick={() => next && navigate(`/screens/${next.id}`)} style={{ color: '#fff', padding: 6, opacity: next ? 1 : 0.3, display: 'grid' }}><ChevronRight size={16} /></button>
    </div>
  );
}

export function Loading() {
  return (
    <div className="screen" style={{ background: 'var(--u-green)', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
      <Wordmark size={30} />
    </div>
  );
}

/** Where a signed-in person belongs. */
function home(role: string | undefined, hasClass: boolean) {
  if (role === 'lecturer') return '/screens/L07';
  if (!hasClass) return '/screens/S07';
  return '/screens/S19';
}

function Entry() {
  const { ready, session, profile } = useAuth();
  if (!isLive) return <Gallery />;
  if (!ready) return <Loading />;
  if (!session) return <Navigate to="/screens/S01" replace />;
  if (!profile) return <Loading />;
  return <Navigate to={home(profile.role, Boolean(profile.class_id))} replace />;
}

function ScreenRoute() {
  const { id = '' } = useParams();
  const { ready, session, recovering } = useAuth();
  const entry = byId(id);
  const key = entry?.id ?? id.toUpperCase();
  const live: ComponentType | undefined = isLive ? LIVE_SCREENS[key] : undefined;
  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  if (isLive) {
    if (!ready) return <Loading />;
    if (recovering && key !== 'RESET') return <Navigate to="/screens/RESET" replace />;
    if (!session && !PUBLIC.has(key)) return <Navigate to="/screens/S05" replace />;
  }
  const Component = live ?? entry?.Component;
  if (!Component) return <div className="pad t-15" style={{ paddingTop: 40 }}>No screen called {id}. <Link to="/">Go home</Link></div>;
  const showDev = !isLive || new URLSearchParams(location.search).has('dev');
  return (
    <>
      {showDev && entry && <DevBar id={entry.id} />}
      <Component key={key} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Entry />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/screens/:id" element={<ScreenRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
