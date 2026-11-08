// Builds supabase/setup.sql: the schema and starting data in one file, to paste into the
// Supabase SQL editor on a new project. Run `npm run setup-sql` after changing either source.
import { readFileSync, writeFileSync } from 'node:fs';

export function buildSetupSql() {
  const migration = readFileSync(new URL('../supabase/migrations/20261108000000_init.sql', import.meta.url), 'utf8');
  const seed = readFileSync(new URL('../supabase/seed.sql', import.meta.url), 'utf8');
  return `-- =====================================================================================
-- Unify Learn · one-file setup for a NEW Supabase project
-- Generated from supabase/migrations/20261108000000_init.sql and supabase/seed.sql
-- (npm run setup-sql). Edit those files, not this one.
--
-- How to use: Supabase dashboard → SQL Editor → New query → paste this whole file → Run.
-- Run it once, on an empty project. It creates every table, rule and function the app uses,
-- then adds LASU Engineering's departments, classes and first courses.
-- =====================================================================================

${migration.trim()}

-- =====================================================================================
-- Starting data
-- =====================================================================================

${seed.trim()}

-- =====================================================================================
-- Done. Next: sign up in the app with your own email, then run this on its own
-- (with your email) to make yourself the Unify admin:
--
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- =====================================================================================
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeFileSync(new URL('../supabase/setup.sql', import.meta.url), buildSetupSql());
  console.log('wrote supabase/setup.sql');
}
