import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isLive, supabase, friendly } from './supabase';

export type Role = 'student' | 'lecturer' | 'admin';
export type Profile = {
  id: string; email: string | null; display_name: string | null; role: Role;
  class_id: string | null; persona: string | null; goal: string | null;
  study_time: string | null; focus_minutes: number | null; reminders: boolean | null;
};
export type ClassInfo = { id: string; department_code: string; level: number; session: string; department_name: string };

type AuthState = {
  /** false until the first session check finishes */
  ready: boolean;
  session: Session | null;
  profile: Profile | null;
  klass: ClassInfo | null;
  /** class ids this user is an HOC of */
  hocOf: string[];
  /** true right after a password-reset link is opened */
  recovering: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<Profile, 'display_name' | 'persona' | 'goal' | 'role' | 'study_time' | 'focus_minutes' | 'reminders'>>) => Promise<void>;
};

const empty: AuthState = {
  ready: true, session: null, profile: null, klass: null, hocOf: [], recovering: false,
  refresh: async () => {}, signOut: async () => {}, updateProfile: async () => {},
};
const Ctx = createContext<AuthState>(empty);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isLive);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [klass, setKlass] = useState<ClassInfo | null>(null);
  const [hocOf, setHocOf] = useState<string[]>([]);
  const [recovering, setRecovering] = useState(false);

  const load = useCallback(async (s: Session | null) => {
    if (!s) { setProfile(null); setKlass(null); setHocOf([]); return; }
    const uid = s.user.id;
    // One round trip for the profile and its class (plus the HOC check alongside): this runs on every app open.
    const [{ data: p }, { data: h }] = await Promise.all([
      supabase.from('profiles')
        // profiles and classes are linked twice (class_id, and HOCs through class_hocs): name the class_id link
        .select('id,email,display_name,role,class_id,persona,goal,study_time,focus_minutes,reminders,classes!profiles_class_id_fkey(id,department_code,level,session,departments(name))')
        .eq('id', uid).maybeSingle(),
      supabase.from('class_hocs').select('class_id').eq('user_id', uid),
    ]);
    type Embedded = { id: string; department_code: string; level: number; session: string; departments?: { name: string } | { name: string }[] | null };
    const row = p as (Profile & { classes?: Embedded | Embedded[] | null }) | null;
    const k = Array.isArray(row?.classes) ? row?.classes[0] : row?.classes;
    const dep = k?.departments;
    if (row) delete row.classes;
    // set together, so screens never see a profile with a class but no class details
    setProfile(row ?? null);
    setHocOf((h ?? []).map((r: { class_id: string }) => r.class_id));
    setKlass(k ? { id: k.id, department_code: k.department_code, level: k.level, session: k.session, department_name: (Array.isArray(dep) ? dep[0]?.name : dep?.name) ?? k.department_code } : null);
  }, []);

  useEffect(() => {
    if (!isLive) return;
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      setSession(data.session);
      await load(data.session);
      if (alive) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        // load() talks to Supabase; never await inside this callback (supabase-js deadlocks), so defer it.
        setTimeout(() => { load(s); }, 0);
      }
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, [load]);

  const value = useMemo<AuthState>(() => ({
    ready, session, profile, klass, hocOf, recovering,
    refresh: () => load(session),
    signOut: async () => { await supabase.auth.signOut(); setRecovering(false); },
    updateProfile: async (patch) => {
      if (!session) return;
      const { error } = await supabase.from('profiles').update(patch).eq('id', session.user.id);
      if (error) throw new Error(friendly(error.message));
      await load(session);
    },
  }), [ready, session, profile, klass, hocOf, recovering, load]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

/** First name for greetings: "Joshua" from "Joshua Olotuche". */
export const firstName = (p: Profile | null, fallback = '') => (p?.display_name ?? '').split(' ')[0] || fallback;

/** "300L ECE" */
export const classLabel = (k: ClassInfo | null) => (k ? `${k.level}L ${k.department_code}` : '');
