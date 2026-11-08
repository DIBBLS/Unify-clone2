/* Test database: real Postgres (PGlite, in-process) + small stand-ins for what Supabase provides
   (auth.users, auth.uid(), auth.jwt(), the anon/authenticated roles). Then the real migration and seed run on top. */
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const SUPABASE_STUBS = `
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
grant usage on schema auth to authenticated, anon;
grant execute on all functions in schema auth to authenticated, anon;
`;
const GRANTS = `
grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
`;

export type Db = PGlite & { as: (user: User | null) => Promise<void>; makeUser: (email: string, name?: string) => Promise<User> };
export type User = { id: string; email: string };

export async function createDb(): Promise<Db> {
  const db = (await PGlite.create()) as Db;
  await db.exec(SUPABASE_STUBS);
  await db.exec(readFileSync(new URL('../supabase/migrations/20261108000000_init.sql', import.meta.url), 'utf8'));
  await db.exec(readFileSync(new URL('../supabase/seed.sql', import.meta.url), 'utf8'));
  await db.exec(GRANTS);

  db.as = async (user) => {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claims', '', false);`);
    if (!user) return;
    await db.query(`select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)`,
      [user.id, JSON.stringify({ sub: user.id, email: user.email, role: 'authenticated' })]);
    await db.exec('set role authenticated');
  };
  db.makeUser = async (email, name) => {
    await db.exec('reset role');
    const id = randomUUID();
    await db.query(`insert into auth.users(id, email, raw_user_meta_data) values ($1, $2, $3)`, [id, email, JSON.stringify({ display_name: name ?? email.split('@')[0] })]);
    return { id, email };
  };
  return db;
}

/** Run as superuser (setup helpers). */
export async function admin<T>(db: Db, sql: string, params: unknown[] = []) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claims', '', false);`);
  return (await db.query<T>(sql, params)).rows;
}

export async function rpc<T = unknown>(db: Db, fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const names = Object.keys(args);
  const sql = `select public.${fn}(${names.map((n, i) => `${n} => $${i + 1}`).join(', ')}) as r`;
  const res = await db.query<{ r: T }>(sql, names.map((n) => args[n]));
  return res.rows[0]?.r as T;
}
