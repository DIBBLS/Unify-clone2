import type { ReactNode } from 'react';
import { BookOpen, CalendarDays, ClipboardList, Home, Inbox, LogOut, MessageSquare, QrCode, ScanLine, Shield, User, Users, type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Wordmark } from './brand';
import { useGo } from './nav';
import { useAuth, classLabel } from '../lib/auth';
import { isLive } from '../lib/supabase';

/* How every screen sits on the page.

   Phones (under 640px): exactly the phone design, edge to edge. Nothing here renders.
   Tablets (640–999px):  app screens get a wider column (--shell 640px), bottom tabs stay.
   Laptops (1000px+):    app screens get a side menu instead of bottom tabs, and sit on a
                         rounded canvas up to 760px wide (--shell), centred in the space left.

   Sign-up and onboarding screens (Solo) keep their phone design and sit in a rounded
   card on a branded backdrop from 640px up. */

type Item = { label: string; to: string; icon: LucideIcon; match: string[] };

const range = (prefix: string, from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => `${prefix}${String(from + i).padStart(2, '0')}`);

const STUDENT: Item[] = [
  { label: 'Home', to: 'S19', icon: Home, match: [...range('S', 14, 36), 'S58'] },
  { label: 'Timetable', to: 'S37', icon: CalendarDays, match: [...range('S', 37, 41), ...range('S', 64, 73)] },
  { label: 'Class', to: 'S42', icon: MessageSquare, match: [...range('S', 42, 44), ...range('S', 53, 56)] },
  { label: 'Me', to: 'S45', icon: User, match: [...range('S', 45, 52), 'S57', 'S76'] },
];
const STUDENT_ATTENDANCE: Item[] = [
  { label: 'My pass', to: 'S59', icon: QrCode, match: ['S59', 'S74', 'AT07', 'AT08', 'AT09', 'AT10', 'AT11', 'AT12', 'AT13'] },
  { label: 'My attendance', to: 'S63', icon: ClipboardList, match: ['S63', 'AT14'] },
];
const HOC_TOOLS: Item[] = [
  { label: 'Class list', to: 'AT04', icon: Users, match: ['AT01', 'AT01A', 'AT01B', 'AT02', 'AT03', 'AT04', 'AT05', 'AT06', 'AT18', 'AT19'] },
  { label: 'Inbox', to: 'AT15', icon: Inbox, match: ['AT15', 'AT16', 'AT17', 'S62'] },
  { label: 'Take attendance', to: 'OPENSCAN', icon: ScanLine, match: ['OPENSCAN', 'S60', 'S61'] },
  { label: 'Registers', to: 'L16', icon: ClipboardList, match: ['L16'] },
];
const LECTURER: Item[] = [
  { label: 'Home', to: 'L07', icon: Home, match: ['L07', 'L08', ...range('L', 10, 14)] },
  { label: 'Timetable', to: 'L09', icon: CalendarDays, match: ['L09', 'L18', 'L19', 'L20'] },
  { label: 'Post to students', to: 'L15', icon: MessageSquare, match: ['L15'] },
  { label: 'Me', to: 'L17', icon: User, match: ['L17'] },
];
const LECTURER_ATTENDANCE: Item[] = [
  { label: 'Take attendance', to: 'OPENSCAN', icon: ScanLine, match: ['OPENSCAN', 'S61'] },
  { label: 'Registers', to: 'L16', icon: ClipboardList, match: ['L16'] },
  { label: 'My courses', to: 'L04', icon: BookOpen, match: ['L04'] },
];
const CONTRIBUTOR: Item[] = [
  { label: 'Home', to: 'C01', icon: Home, match: ['C01'] },
  { label: 'Studio', to: 'C02', icon: BookOpen, match: ['C02', 'C03', 'C04', 'C05', 'C06'] },
  { label: 'Me', to: 'S45', icon: User, match: [] },
];

function NavLink({ item, active }: { item: Item; active: boolean }) {
  const go = useGo();
  const Icon = item.icon;
  return (
    <button className={`app-nav__item${active ? ' is-on' : ''}`} aria-current={active ? 'page' : undefined} onClick={() => go(item.to)}>
      <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
      <span>{item.label}</span>
    </button>
  );
}

function Section({ title, items, screen }: { title?: string; items: Item[]; screen: string }) {
  return (
    <div className="stack" style={{ gap: 2 }}>
      {title && <div className="app-nav__label">{title}</div>}
      {items.map((it) => <NavLink key={it.label} item={it} active={it.to === screen || it.match.includes(screen)} />)}
    </div>
  );
}

/** The side menu (laptops) around an app screen. On phones it renders nothing extra. */
export function AppFrame({ screen, children }: { screen: string; children: ReactNode }) {
  const { profile, klass, hocOf, signOut } = useAuth();
  const navigate = useNavigate();
  // In the design gallery there is no account: pick the menu from the screen id.
  const role = isLive ? profile?.role ?? 'student' : screen.startsWith('L') && screen !== 'LOGIN' ? 'lecturer' : screen.startsWith('C') ? 'contributor' : 'student';
  const isHoc = isLive ? hocOf.length > 0 : screen.startsWith('AT') || ['S60', 'S61', 'S62', 'OPENSCAN'].includes(screen);
  const name = isLive ? profile?.display_name ?? '' : role === 'lecturer' ? 'Dr. Olusegun Adeyemi' : 'Joshua Olotuche';
  const sub = isLive ? (role === 'lecturer' ? 'Lecturer' : klass ? classLabel(klass) : 'Student') : role === 'lecturer' ? 'Lecturer · LASU' : '300L · ECE';

  return (
    <div className="app-frame">
      <aside className="app-nav" aria-label="Main menu">
        <div className="stack" style={{ gap: 2, padding: '4px 12px 18px' }}>
          <Wordmark size={22} />
          {role === 'lecturer' && <span className="t-12 w-6 faint">for Lecturers</span>}
        </div>
        <nav className="stack" style={{ gap: 18 }}>
          {role === 'lecturer' ? <>
            <Section items={LECTURER} screen={screen} />
            <Section title="Attendance" items={LECTURER_ATTENDANCE} screen={screen} />
          </> : role === 'contributor' ? (
            <Section items={CONTRIBUTOR} screen={screen} />
          ) : <>
            <Section items={STUDENT} screen={screen} />
            <Section title="Attendance" items={STUDENT_ATTENDANCE} screen={screen} />
            {isHoc && <Section title="HOC tools" items={HOC_TOOLS} screen={screen} />}
          </>}
          {role === 'admin' && <Section title="Unify" items={[{ label: 'Unify admin', to: 'AD01', icon: Shield, match: [] }]} screen={screen} />}
        </nav>
        <div className="app-nav__me">
          <div className="stack grow" style={{ gap: 1, minWidth: 0 }}>
            <span className="t-14 w-7" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name || 'You'}</span>
            <span className="t-12 faint" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</span>
          </div>
          {isLive && (
            <button className="app-nav__out" aria-label="Log out" title="Log out" onClick={async () => { await signOut(); navigate('/', { replace: true }); }}>
              <LogOut size={17} />
            </button>
          )}
        </div>
      </aside>
      <main className="app-main">{children}</main>
    </div>
  );
}

/** Sign-up and onboarding: the phone design, in a card on bigger screens. */
export function Solo({ children }: { children: ReactNode }) {
  return <div className="solo">{children}</div>;
}
