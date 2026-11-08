import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True when the app is connected to Supabase. Without it the app runs as a design preview on sample data. */
export const isLive = Boolean(url && key);

export const supabase: SupabaseClient = isLive
  ? createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : (null as unknown as SupabaseClient);

/** A short-lived second client, used only to prove a student email (claim your name).
    It never touches the main session and keeps nothing in storage. */
export function schoolIdentityClient(): SupabaseClient {
  return createClient(url!, key!, {
    auth: { storageKey: 'unify-school-identity', persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/** Database errors are written for people (see the migration), so we show them as they are,
    minus Postgres noise. Network failures get a plain message. */
export function friendly(message: string): string {
  if (/Failed to fetch|NetworkError|Load failed/i.test(message)) return "Can't reach Unify. Check your connection and try again.";
  if (/JWT|not authenticated|Sign in first/i.test(message)) return 'Please sign in again.';
  // messages from Supabase Auth
  const wait = message.match(/only request this after (\d+) seconds?/i);
  if (wait) return `A code was just sent. Wait ${wait[1]} seconds, then ask for a new one.`;
  if (/rate limit/i.test(message)) return 'Too many emails sent in a short time. Wait a few minutes and try again.';
  if (/token has expired|invalid.*(otp|token)|otp.*(expired|invalid)/i.test(message)) return 'That code is wrong or has expired. Check the newest email, or ask for a new code.';
  if (/signups? not allowed/i.test(message)) return 'New sign-ups are paused right now. Try again later.';
  if (/error sending.*email/i.test(message)) return "We couldn't send the email. Try again in a minute.";
  if (/duplicate key.*class_list_entries/i.test(message)) return 'That matric number is already on this list.';
  if (/violates check constraint.*matric/i.test(message)) return 'A matric number should be 6 to 12 digits.';
  return message.replace(/^.*?ERROR:\s*/, '');
}

export async function rpc<T>(fn: string, args?: Record<string, unknown>, client: SupabaseClient = supabase): Promise<T> {
  const { data, error } = await client.rpc(fn, args);
  if (error) throw new Error(friendly(error.message));
  return data as T;
}
