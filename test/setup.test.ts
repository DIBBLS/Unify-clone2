import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
// @ts-expect-error plain .mjs build script
import { buildSetupSql } from '../scripts/setup-sql.mjs';

describe('supabase/setup.sql', () => {
  it('matches the migration and seed (run `npm run setup-sql` after changing them)', () => {
    expect(readFileSync(new URL('../supabase/setup.sql', import.meta.url), 'utf8')).toBe(buildSetupSql());
  });
});
