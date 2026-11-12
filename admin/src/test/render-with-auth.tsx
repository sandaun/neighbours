import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';

import { AuthContext, type AuthContextValue } from '@/features/auth/AuthProvider';

export function makeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    client: null,
    status: 'signed-out',
    session: null,
    communities: [],
    error: null,
    signIn: vi.fn(async () => {}),
    signOut: vi.fn(async () => {}),
    retry: vi.fn(),
    ...overrides,
  };
}

export function renderWithAuth(
  ui: ReactElement,
  auth: AuthContextValue = makeAuth(),
  { route = '/' }: { route?: string } = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    auth,
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <AuthContext.Provider value={auth}>{ui}</AuthContext.Provider>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  };
}
