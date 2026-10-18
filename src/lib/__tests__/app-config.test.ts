import { resolveAppConfig } from '../app-config';

const live = { url: 'https://example.supabase.co', publishableKey: 'sb_publishable_example' };

describe('runtime configuration', () => {
  test('defaults to demo only with no credentials', () => {
    expect(resolveAppConfig({})).toEqual({ mode: 'demo' });
    expect(resolveAppConfig({ url: live.url }).mode).toBe('error');
    expect(resolveAppConfig({ publishableKey: live.publishableKey }).mode).toBe('error');
  });
  test('supports an explicit demo and complete live credentials', () => {
    expect(resolveAppConfig({ ...live, mode: 'demo' })).toEqual({ mode: 'demo' });
    expect(resolveAppConfig(live)).toEqual({ mode: 'supabase', ...live });
    expect(resolveAppConfig({ mode: 'supabase' }).mode).toBe('error');
  });
  test.each(['typo', 'production'])('fails visibly for unknown mode %s', (mode) => {
    expect(resolveAppConfig({ ...live, mode }).mode).toBe('error');
  });
  test.each(['sb_secret_example', 'eyJhbGciOiJIUzI1NiJ9.e30.signature'])(
    'rejects non-public key %s',
    (publishableKey) => {
      expect(resolveAppConfig({ ...live, publishableKey }).mode).toBe('error');
    }
  );
  test.each(['http://example.supabase.co', 'https://user:secret@example.supabase.co', 'invalid'])(
    'rejects invalid origin %s',
    (url) => {
      expect(resolveAppConfig({ ...live, url }).mode).toBe('error');
    }
  );
});
