import type { Session } from '@supabase/supabase-js';
import { vi } from 'vitest';

import type { AdminClient } from '@/lib/supabase';

type QueryResult = { data: unknown; error: Error | null };

export function makeSession(userId = 'user-1', email = 'admin@example.com'): Session {
  return {
    access_token: 'token',
    refresh_token: 'refresh',
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: userId,
      email,
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2026-01-01T00:00:00Z',
    },
  } as Session;
}

// Minimal chainable stand-in for the parts of supabase-js the backoffice uses.
export function makeFakeClient({
  session = null,
  memberships = { data: [], error: null },
}: { session?: Session | null; memberships?: QueryResult } = {}) {
  const calls: { method: string; args: unknown[] }[] = [];
  const query = {
    select: (...args: unknown[]) => (calls.push({ method: 'select', args }), query),
    eq: (...args: unknown[]) => (calls.push({ method: 'eq', args }), query),
    order: (...args: unknown[]) => (calls.push({ method: 'order', args }), query),
    then: (resolve: (value: QueryResult) => unknown, reject?: (error: unknown) => unknown) =>
      Promise.resolve(memberships).then(resolve, reject),
  };
  const auth = {
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    getSession: vi.fn(async () => ({ data: { session }, error: null })),
    signInWithPassword: vi.fn(async () => ({ data: {}, error: null as Error | null })),
    signOut: vi.fn(async () => ({ error: null as Error | null })),
  };
  const client = {
    auth,
    from: vi.fn((table: string) => (calls.push({ method: 'from', args: [table] }), query)),
  };
  return { client: client as unknown as AdminClient, auth, calls };
}
