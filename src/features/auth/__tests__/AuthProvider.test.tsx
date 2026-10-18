import type { Session } from '@supabase/supabase-js';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Pressable, Text, View } from 'react-native';

import { AuthProvider, useAuth } from '../AuthProvider';
import { loadMembership, type Membership } from '../auth-api';
import { getSupabase } from '@/lib/supabase';

jest.mock('@/lib/app-config', () => ({ isDemoMode: false }));
jest.mock('@/lib/supabase', () => ({ getSupabase: jest.fn() }));
jest.mock('../auth-api', () => ({
  loadMembership: jest.fn(),
  signInWithPassword: jest.fn(),
}));
jest.mock('../use-persisted-language', () => ({ usePersistedLanguage: jest.fn() }));

function makeSession(id: string): Session {
  return {
    access_token: 'access',
    refresh_token: 'refresh',
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id,
      aud: 'authenticated',
      created_at: '2026-10-18T00:00:00Z',
      app_metadata: {},
      user_metadata: {},
    },
  };
}
const resident: Membership = {
  communityId: 'home',
  communityName: 'Home',
  userId: 'first',
  unitId: '1',
  unitLabel: '1A',
  displayName: 'Neighbour',
  role: 'resident',
};
let authListener: (event: string, session: Session | null) => void;
const auth = {
  onAuthStateChange: jest.fn((listener: typeof authListener) => {
    authListener = listener;
    return { data: { subscription: { unsubscribe: jest.fn() } } };
  }),
  getSession: jest.fn(),
  signOut: jest.fn(),
  startAutoRefresh: jest.fn(),
  stopAutoRefresh: jest.fn(),
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function Probe() {
  const state = useAuth();
  return (
    <View>
      <Text>{state.status}</Text>
      <Text>{state.membership?.displayName ?? 'No resident'}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Retry" onPress={state.retry}>
        <Text>Retry</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        onPress={() => void state.signOut()}
      >
        <Text>Sign out</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Switch account"
        onPress={() => authListener('SIGNED_IN', makeSession('second'))}
      >
        <Text>Switch account</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Finish lookup"
        onPress={() => finishLookup?.()}
      >
        <Text>Finish lookup</Text>
      </Pressable>
    </View>
  );
}
let finishLookup: (() => void) | undefined;

beforeEach(() => {
  jest.clearAllMocks();
  finishLookup = undefined;
  jest.mocked(getSupabase).mockReturnValue({ auth } as unknown as ReturnType<typeof getSupabase>);
  auth.getSession.mockResolvedValue({ data: { session: makeSession('first') }, error: null });
  auth.signOut.mockImplementation(async () => {
    authListener('SIGNED_OUT', null);
    return { error: null };
  });
});

test('blocks a signed-in user without membership and supports retry then signout', async () => {
  jest.mocked(loadMembership).mockResolvedValueOnce(null).mockResolvedValueOnce(resident);
  await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
  await waitFor(() => expect(screen.getByText('no-membership')).toBeTruthy());
  expect(screen.getByText('No resident')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(() => expect(screen.getByText('ready')).toBeTruthy());
  expect(screen.getByText('Neighbour')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));
  await waitFor(() => expect(screen.getByText('signed-out')).toBeTruthy());
  expect(screen.getByText('No resident')).toBeTruthy();
  expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
});

test('does not display a previous account while a new membership is loading', async () => {
  const next = deferred<Membership | null>();
  jest.mocked(loadMembership).mockResolvedValueOnce(resident).mockReturnValueOnce(next.promise);
  await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
  await waitFor(() => expect(screen.getByText('Neighbour')).toBeTruthy());
  await fireEvent.press(screen.getByRole('button', { name: 'Switch account' }));
  await waitFor(() => expect(screen.getByText('loading')).toBeTruthy());
  expect(screen.queryByText('Neighbour')).toBeNull();
  finishLookup = () =>
    next.resolve({ ...resident, userId: 'second', displayName: 'Second neighbour' });
  await fireEvent.press(screen.getByRole('button', { name: 'Finish lookup' }));
  await waitFor(() => expect(screen.getByText('Second neighbour')).toBeTruthy());
});

test('ignores a previous account membership response after account switching', async () => {
  const first = deferred<Membership | null>();
  jest
    .mocked(loadMembership)
    .mockReturnValueOnce(first.promise)
    .mockResolvedValueOnce({ ...resident, userId: 'second', displayName: 'Second neighbour' });
  await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
  await waitFor(() => expect(loadMembership).toHaveBeenCalledWith('first'));
  await fireEvent.press(screen.getByRole('button', { name: 'Switch account' }));
  await waitFor(() => expect(screen.getByText('Second neighbour')).toBeTruthy());
  finishLookup = () => first.resolve(resident);
  await fireEvent.press(screen.getByRole('button', { name: 'Finish lookup' }));
  await waitFor(() => expect(screen.getByText('Second neighbour')).toBeTruthy());
  expect(screen.queryByText('Neighbour')).toBeNull();
});

test('shows an auth error when persistence cleanup fails instead of reopening private data', async () => {
  jest.mocked(loadMembership).mockResolvedValue(resident);
  auth.signOut.mockResolvedValueOnce({ error: new Error('Keychain locked') });
  await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
  await waitFor(() => expect(screen.getByText('ready')).toBeTruthy());
  await fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));
  await waitFor(() => expect(screen.getByText('error')).toBeTruthy());
  expect(screen.getByText('No resident')).toBeTruthy();
});
