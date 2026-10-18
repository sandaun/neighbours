import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';

import { loadMembership, type Membership, signInWithPassword } from './auth-api';
import { usePersistedLanguage } from './use-persisted-language';
import { isDemoMode } from '@/lib/app-config';
import { getSupabase } from '@/lib/supabase';

type Status = 'loading' | 'signed-out' | 'ready' | 'no-membership' | 'error';
type AuthContextValue = {
  session: Session | null;
  membership: Membership | null;
  status: Status;
  error: Error | null;
  retry(): void;
  signOut(): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
};
type MembershipState = { userId: string; membership: Membership | null; error: Error | null };
const AuthContext = createContext<AuthContextValue | null>(null);
const asError = (error: unknown) =>
  error instanceof Error ? error : new Error('Unable to authenticate.');

export function AuthProvider({ children }: { children: ReactNode }) {
  usePersistedLanguage();
  const [runtime] = useState(() => {
    if (isDemoMode) return { client: null, error: null };
    try {
      return { client: getSupabase(), error: null };
    } catch (error) {
      return { client: null, error: asError(error) };
    }
  });
  const [signingOut, setSigningOut] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(isDemoMode);
  const [authError, setAuthError] = useState<Error | null>(null);
  const [membershipState, setMembershipState] = useState<MembershipState | null>(null);
  const [attempt, setAttempt] = useState(0);
  const userId = session?.user.id;

  useEffect(() => {
    const client = runtime.client;
    if (!client) return;
    let alive = true;
    let revision = 0;
    // Keep this callback synchronous; querying Supabase here can deadlock auth.
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!alive) return;
      revision++;
      setSession(nextSession);
      if (!nextSession) setMembershipState(null);
      setAuthError(null);
      setInitialized(true);
    });
    const initialRevision = revision;
    void client.auth
      .getSession()
      .then(({ data, error }) => {
        if (!alive || revision !== initialRevision) return;
        setSession(data.session);
        setAuthError(error ? asError(error) : null);
        setInitialized(true);
      })
      .catch((error: unknown) => {
        if (alive && revision === initialRevision) {
          setAuthError(asError(error));
          setInitialized(true);
        }
      });
    if (Platform.OS !== 'web') {
      if (AppState.currentState === 'active') client.auth.startAutoRefresh();
      else client.auth.stopAutoRefresh();
    }
    const appStateSubscription =
      Platform.OS !== 'web'
        ? AppState.addEventListener('change', (state) => {
            if (state === 'active') client.auth.startAutoRefresh();
            else client.auth.stopAutoRefresh();
          })
        : null;
    return () => {
      alive = false;
      subscription.unsubscribe();
      appStateSubscription?.remove();
      if (Platform.OS !== 'web') client.auth.stopAutoRefresh();
    };
  }, [attempt, runtime.client]);

  useEffect(() => {
    if (!userId || isDemoMode) return;
    let alive = true;
    void loadMembership(userId).then(
      (membership) => {
        if (alive) setMembershipState({ userId, membership, error: null });
      },
      (error: unknown) => {
        if (alive) setMembershipState({ userId, membership: null, error: asError(error) });
      }
    );
    return () => {
      alive = false;
    };
  }, [userId, attempt]);

  const retry = useCallback(() => {
    setAuthError(null);
    setMembershipState(null);
    setInitialized(false);
    setAttempt((value) => value + 1);
  }, []);
  const signOut = useCallback(async () => {
    setSigningOut(true);
    setMembershipState(null);
    try {
      const { error } = await getSupabase().auth.signOut({ scope: 'local' });
      if (error) throw error;
      setSession(null);
      setAuthError(null);
    } catch (error) {
      setAuthError(asError(error));
    } finally {
      setSigningOut(false);
    }
  }, []);

  const current = membershipState?.userId === userId ? membershipState : null;
  const error = runtime.error ?? authError ?? current?.error ?? null;
  const status: Status = isDemoMode
    ? 'ready'
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
              : current.membership
                ? 'ready'
                : 'no-membership';
  return (
    <AuthContext.Provider
      value={{
        session,
        membership: current?.membership ?? null,
        status,
        error,
        retry,
        signOut,
        signIn: signInWithPassword,
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
