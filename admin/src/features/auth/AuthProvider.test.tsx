import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import { AuthProvider, useAuth } from './AuthProvider';
import { makeFakeClient, makeSession } from '@/test/fake-client';

function Probe() {
  const auth = useAuth();
  return (
    <p>
      {auth.status}:{auth.communities.map((community) => community.communityName).join(',')}
    </p>
  );
}

test('is signed out without a session', async () => {
  const { client } = makeFakeClient();
  render(
    <AuthProvider client={client}>
      <Probe />
    </AuthProvider>
  );
  expect(await screen.findByText('signed-out:')).toBeInTheDocument();
});

test('is ready when the user administers at least one community', async () => {
  const { client } = makeFakeClient({
    session: makeSession(),
    memberships: {
      data: [{ community_id: 'c1', display_name: 'Anna', communities: { name: 'Gran Via 12' } }],
      error: null,
    },
  });
  render(
    <AuthProvider client={client}>
      <Probe />
    </AuthProvider>
  );
  expect(await screen.findByText('ready:Gran Via 12')).toBeInTheDocument();
});

test('denies access to accounts without an admin membership', async () => {
  const { client } = makeFakeClient({ session: makeSession() });
  render(
    <AuthProvider client={client}>
      <Probe />
    </AuthProvider>
  );
  expect(await screen.findByText('no-access:')).toBeInTheDocument();
});

test('reports membership errors', async () => {
  const { client } = makeFakeClient({
    session: makeSession(),
    memberships: { data: null, error: new Error('network') },
  });
  render(
    <AuthProvider client={client}>
      <Probe />
    </AuthProvider>
  );
  expect(await screen.findByText('error:')).toBeInTheDocument();
});
