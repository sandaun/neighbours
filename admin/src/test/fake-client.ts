import type { Session } from '@supabase/supabase-js';
import { vi } from 'vitest';

import type { AdminClient } from '@/lib/supabase';

export type QueryResult = { data: unknown; error: Error | null };
type Call = { table: string; method: string; args: unknown[] };

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
// Each table resolves to its configured result, whatever filters are chained.
export function makeFakeClient({
  session = null,
  memberships = { data: [], error: null },
  tables = {},
  rpc = { data: null, error: null },
  signedUrl = { data: { signedUrl: 'https://files.example/photo.jpg' }, error: null },
}: {
  session?: Session | null;
  memberships?: QueryResult;
  tables?: Record<string, QueryResult>;
  rpc?: QueryResult;
  signedUrl?: QueryResult;
} = {}) {
  const calls: Call[] = [];
  const results: Record<string, QueryResult> = { community_members: memberships, ...tables };

  const builder = (table: string) => {
    let write = false;
    // Writes resolve to `<table>:write` when configured, else to one stub row.
    const result = () =>
      write
        ? (results[`${table}:write`] ?? { data: [{ id: 'written' }], error: null })
        : (results[table] ?? { data: [], error: null });
    const query: Record<string, unknown> = {};
    for (const method of ['select', 'eq', 'order', 'limit', 'insert', 'update', 'delete']) {
      query[method] = (...args: unknown[]) => {
        if (['insert', 'update', 'delete'].includes(method)) write = true;
        calls.push({ table, method, args });
        return query;
      };
    }
    query.maybeSingle = () => {
      calls.push({ table, method: 'maybeSingle', args: [] });
      return Promise.resolve(result());
    };
    query.then = (resolve: (value: QueryResult) => unknown, reject?: (error: unknown) => unknown) =>
      Promise.resolve(result()).then(resolve, reject);
    return query;
  };

  const auth = {
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    getSession: vi.fn(async () => ({ data: { session }, error: null })),
    signInWithPassword: vi.fn(async () => ({ data: {}, error: null as Error | null })),
    signOut: vi.fn(async () => ({ error: null as Error | null })),
  };
  const createSignedUrl = vi.fn(async () => signedUrl);
  const storage = { from: vi.fn(() => ({ createSignedUrl })) };
  const client = {
    auth,
    storage,
    from: vi.fn((table: string) => {
      calls.push({ table, method: 'from', args: [table] });
      return builder(table);
    }),
    rpc: vi.fn(async () => rpc),
  };
  return {
    client: client as unknown as AdminClient,
    auth,
    calls,
    rpc: client.rpc,
    storage,
    createSignedUrl,
    setTable(table: string, value: QueryResult) {
      results[table] = value;
    },
  };
}
