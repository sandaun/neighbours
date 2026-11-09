import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { vi } from 'vitest';

import { AuthContext, type AuthContextValue } from '@/features/auth/AuthProvider';

export function makeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
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

export function renderWithAuth(ui: ReactElement, auth: AuthContextValue = makeAuth()) {
  return { auth, ...render(<AuthContext.Provider value={auth}>{ui}</AuthContext.Provider>) };
}
