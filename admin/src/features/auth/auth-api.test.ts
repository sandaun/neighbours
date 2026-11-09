import { expect, test } from 'vitest';

import { loadAdminCommunities, signInWithPassword } from './auth-api';
import { makeFakeClient } from '@/test/fake-client';

test('loads only admin memberships for the user, sorted by community name', async () => {
  const { client, calls } = makeFakeClient({
    memberships: {
      data: [
        { community_id: 'c2', display_name: 'Anna', communities: { name: 'Rambla 8' } },
        { community_id: 'c1', display_name: 'Anna', communities: { name: 'Gran Via 12' } },
      ],
      error: null,
    },
  });

  await expect(loadAdminCommunities(client, 'user-1')).resolves.toEqual([
    { communityId: 'c1', communityName: 'Gran Via 12', displayName: 'Anna' },
    { communityId: 'c2', communityName: 'Rambla 8', displayName: 'Anna' },
  ]);
  expect(calls).toContainEqual({ method: 'from', args: ['community_members'] });
  expect(calls).toContainEqual({ method: 'eq', args: ['user_id', 'user-1'] });
  expect(calls).toContainEqual({ method: 'eq', args: ['role', 'admin'] });
});

test('propagates query errors', async () => {
  const failure = new Error('network');
  const { client } = makeFakeClient({ memberships: { data: null, error: failure } });
  await expect(loadAdminCommunities(client, 'user-1')).rejects.toBe(failure);
});

test('normalizes the email before signing in', async () => {
  const { client, auth } = makeFakeClient();
  await signInWithPassword(client, '  Admin@Example.COM ', 'secret');
  expect(auth.signInWithPassword).toHaveBeenCalledWith({
    email: 'admin@example.com',
    password: 'secret',
  });
});

test('throws when Supabase rejects the credentials', async () => {
  const { client, auth } = makeFakeClient();
  const failure = new Error('invalid_credentials');
  auth.signInWithPassword.mockResolvedValueOnce({ data: {}, error: failure });
  await expect(signInWithPassword(client, 'a@b.cat', 'wrong')).rejects.toBe(failure);
});
