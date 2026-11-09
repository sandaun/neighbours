import { describe, expect, test } from 'vitest';

import { resolveAdminConfig } from './config';

const url = 'https://example.supabase.co';
const publishableKey = 'sb_publishable_abc123';

describe('resolveAdminConfig', () => {
  test('accepts an HTTPS origin and a publishable key', () => {
    expect(resolveAdminConfig({ url, publishableKey })).toEqual({ ok: true, url, publishableKey });
  });

  test('requires both values', () => {
    expect(resolveAdminConfig({ url })).toMatchObject({ ok: false });
    expect(resolveAdminConfig({ publishableKey })).toMatchObject({ ok: false });
  });

  test('allows plain HTTP only for local development', () => {
    expect(resolveAdminConfig({ url: 'http://localhost:54321/', publishableKey })).toMatchObject({
      ok: true,
    });
    expect(resolveAdminConfig({ url: 'http://example.supabase.co', publishableKey })).toMatchObject(
      {
        ok: false,
      }
    );
  });

  test('rejects URLs with paths or credentials', () => {
    expect(resolveAdminConfig({ url: `${url}/rest/v1`, publishableKey })).toMatchObject({
      ok: false,
    });
    expect(
      resolveAdminConfig({ url: 'https://user:pass@example.supabase.co', publishableKey })
    ).toMatchObject({
      ok: false,
    });
  });

  test('rejects secret and legacy keys', () => {
    for (const key of ['sb_secret_abc123', 'eyJhbGciOiJIUzI1NiJ9.payload.signature']) {
      expect(resolveAdminConfig({ url, publishableKey: key })).toEqual({
        ok: false,
        error: 'Use a Supabase publishable key, never a secret or service role key.',
      });
    }
  });
});
