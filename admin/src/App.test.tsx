import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';

import { App } from './App';
import { makeAuth, renderWithAuth } from '@/test/render-with-auth';
import { makeSession } from '@/test/fake-client';

test('shows the login when signed out', () => {
  renderWithAuth(<App />);
  expect(
    screen.getByRole('heading', { name: 'Gestiona les teves comunitats' })
  ).toBeInTheDocument();
});

test('explains a missing configuration', () => {
  renderWithAuth(<App />, makeAuth({ status: 'config-error' }));
  expect(
    screen.getByRole('heading', { name: 'El backoffice no està configurat' })
  ).toBeInTheDocument();
});

test('offers a retry after an error', async () => {
  const auth = makeAuth({ status: 'error', error: new Error('network') });
  renderWithAuth(<App />, auth);
  await userEvent.click(screen.getByRole('button', { name: 'Tornar-ho a provar' }));
  expect(auth.retry).toHaveBeenCalled();
});

test('blocks residents and lets them sign out', async () => {
  const auth = makeAuth({ status: 'no-access', session: makeSession() });
  renderWithAuth(<App />, auth);
  expect(
    screen.getByRole('heading', { name: 'Aquest compte no té permisos d’administració' })
  ).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Tancar sessió' }));
  expect(auth.signOut).toHaveBeenCalled();
});

test('lists the administered communities', () => {
  renderWithAuth(
    <App />,
    makeAuth({
      status: 'ready',
      session: makeSession(),
      communities: [
        { communityId: 'c1', communityName: 'Gran Via 12', displayName: 'Anna Puig' },
        { communityId: 'c2', communityName: 'Rambla 8', displayName: 'Anna Puig' },
      ],
    })
  );
  expect(screen.getByRole('heading', { name: 'Les teves comunitats' })).toBeInTheDocument();
  expect(screen.getByText('Administres 2 comunitats.')).toBeInTheDocument();
  expect(screen.getByText('Gran Via 12')).toBeInTheDocument();
  expect(screen.getByText('Rambla 8')).toBeInTheDocument();
  expect(screen.getByText('Anna Puig')).toBeInTheDocument();
});
