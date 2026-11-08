import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isLive, supabase, friendly } from './supabase';

export type Role = 'student' | 'lecturer' | 'admin';
export type Profile = {
  id: string; email: string | null; display_name: string | null; role: Role;
  class_id: string | null; persona: string | null; goal: string | null;
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
  updateProfile: (patch: Partial<Pick<Profile, 'display_name' | 'persona' | 'goal' | 'role'>>) => Promise<void>;
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
    const [{ data: p }, { data: h }] = await Promise.all([
      supabase.from('profiles').select('id,email,display_name,role,class_id,persona,goal').eq('id', uid).maybeSingle(),
      supabase.from('class_hocs').select('class_id').eq('user_id', uid),
    ]);
    setProfile((p as Profile) ?? null);
    setHocOf((h ?? []).map((r: { class_id: string }) => r.class_id));
    if (p?.class_id) {
      const { data: k } = await supabase.from('classes').select('id,department_code,level,session,departments(name)').eq('id', p.class_id).maybeSingle();
      const dep = (k as unknown as { departments?: { name: string } | { name: string }[] } | null)?.departments;
      setKlass(k ? { id: k.id, department_code: k.department_code, level: k.level, session: k.session, department_name: Array.isArray(dep) ? dep[0]?.name : dep?.name ?? k.department_code } : null);
    } else setKlass(null);
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
