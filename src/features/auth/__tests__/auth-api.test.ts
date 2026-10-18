import { loadMembership, sendEmailCode, verifyEmailCode } from '../auth-api';
import { getSupabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({ getSupabase: jest.fn() }));
const query = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn(),
};
const client = {
  auth: { signInWithOtp: jest.fn(), verifyOtp: jest.fn() },
  from: jest.fn(() => query),
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getSupabase).mockReturnValue(client as unknown as ReturnType<typeof getSupabase>);
});

test('requests an email code without public signup', async () => {
  client.auth.signInWithOtp.mockResolvedValue({ error: null });
  await sendEmailCode('  Neighbour@Example.com ');
  expect(client.auth.signInWithOtp).toHaveBeenCalledWith({
    email: 'neighbour@example.com',
    options: { shouldCreateUser: false },
  });
});

test('verifies the email OTP and propagates an expired code', async () => {
  client.auth.verifyOtp
    .mockResolvedValueOnce({ error: null })
    .mockResolvedValueOnce({ error: new Error('Expired token') });
  await verifyEmailCode('Neighbour@Example.com', ' 123456 ');
  expect(client.auth.verifyOtp).toHaveBeenCalledWith({
    email: 'neighbour@example.com',
    token: '123456',
    type: 'email',
  });
  await expect(verifyEmailCode('neighbour@example.com', '999999')).rejects.toThrow('Expired token');
});

test('selects one membership deterministically and maps its community and unit', async () => {
  query.maybeSingle.mockResolvedValue({
    data: {
      community_id: 'community',
      user_id: 'user',
      unit_id: 'unit',
      display_name: 'Neighbour',
      role: 'resident',
      communities: { name: 'Home' },
      units: { label: '1A' },
    },
    error: null,
  });
  expect(await loadMembership('user')).toEqual({
    communityId: 'community',
    communityName: 'Home',
    userId: 'user',
    unitId: 'unit',
    unitLabel: '1A',
    displayName: 'Neighbour',
    role: 'resident',
  });
  expect(query.eq).toHaveBeenCalledWith('user_id', 'user');
  expect(query.order.mock.calls).toEqual([
    ['created_at', { ascending: true }],
    ['community_id', { ascending: true }],
  ]);
  expect(query.limit).toHaveBeenCalledWith(1);
});

test('distinguishes missing membership from a failed lookup', async () => {
  query.maybeSingle
    .mockResolvedValueOnce({ data: null, error: null })
    .mockResolvedValueOnce({ data: null, error: new Error('Offline') });
  expect(await loadMembership('user')).toBeNull();
  await expect(loadMembership('user')).rejects.toThrow('Offline');
});
