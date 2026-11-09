import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { type AdminCommunity, loadAdminCommunities, signInWithPassword } from './auth-api';
import { type AdminClient, getSupabase } from '@/lib/supabase';

export type AuthStatus =
  'config-error' | 'loading' | 'signed-out' | 'ready' | 'no-access' | 'error';

export type AuthContextValue = {
  client: AdminClient | null;
  status: AuthStatus;
  session: Session | null;
  communities: AdminCommunity[];
  error: Error | null;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  retry(): void;
};

type CommunitiesState = { userId: string; communities: AdminCommunity[]; error: Error | null };

export const AuthContext = createContext<AuthContextValue | null>(null);

const asError = (error: unknown) =>
  error instanceof Error ? error : new Error('Unable to authenticate.');

function resolveClient(): { client: AdminClient | null; error: Error | null } {
  try {
    return { client: getSupabase(), error: null };
  } catch (error) {
    return { client: null, error: asError(error) };
  }
}

export function AuthProvider({
  children,
  client: injected,
}: {
  children: ReactNode;
  client?: AdminClient;
}) {
  const [runtime] = useState(() =>
    injected ? { client: injected, error: null } : resolveClient()
  );
  const client = runtime.client;
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);
  const [communitiesState, setCommunitiesState] = useState<CommunitiesState | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const userId = session?.user.id;

  useEffect(() => {
    if (!client) return;
    let alive = true;
    let revision = 0;
    // Keep this callback synchronous; querying Supabase inside it can deadlock auth.
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!alive) return;
      revision++;
      setSession(nextSession);
      if (!nextSession) setCommunitiesState(null);
      setAuthError(null);
      setInitialized(true);
    });
    const initialRevision = revision;
    client.auth.getSession().then(
      ({ data, error }) => {
        if (!alive || revision !== initialRevision) return;
        setSession(data.session);
        setAuthError(error ? asError(error) : null);
        setInitialized(true);
      },
      (error: unknown) => {
        if (!alive || revision !== initialRevision) return;
        setAuthError(asError(error));
        setInitialized(true);
      }
    );
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [attempt, client]);

  useEffect(() => {
    if (!client || !userId) return;
    let alive = true;
    loadAdminCommunities(client, userId).then(
      (communities) => {
        if (alive) setCommunitiesState({ userId, communities, error: null });
      },
      (error: unknown) => {
        if (alive) setCommunitiesState({ userId, communities: [], error: asError(error) });
      }
    );
    return () => {
      alive = false;
    };
  }, [attempt, client, userId]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!client) throw runtime.error ?? new Error('Supabase is not configured.');
      await signInWithPassword(client, email, password);
    },
    [client, runtime.error]
  );

  const signOut = useCallback(async () => {
    if (!client) return;
    setSigningOut(true);
    setCommunitiesState(null);
    try {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw error;
      setSession(null);
      setAuthError(null);
    } catch (error) {
      setAuthError(asError(error));
    } finally {
      setSigningOut(false);
    }
  }, [client]);

  const retry = useCallback(() => {
    setAuthError(null);
    setCommunitiesState(null);
    setInitialized(false);
    setAttempt((value) => value + 1);
  }, []);

  const current = communitiesState?.userId === userId ? communitiesState : null;
  const error = runtime.error ?? authError ?? current?.error ?? null;
  const status: AuthStatus = runtime.error
    ? 'config-error'
    : signingOut
      ? 'loading'
      : error
        ? 'error'
        : !initialized
          ? 'loading'
          : !session
            ? 'signed-out'
            : !current
              ? 'loading'
              : current.communities.length > 0
                ? 'ready'
                : 'no-access';

  return (
    <AuthContext.Provider
      value={{
        client,
        status,
        session,
        communities: current?.communities ?? [],
        error,
        signIn,
        signOut,
        retry,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
