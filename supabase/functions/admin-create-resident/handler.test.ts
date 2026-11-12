// Run: deno test supabase/functions/admin-create-resident
import { type AddResidentArgs, type Deps, generatePassword, handle } from './handler.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function assertEquals(actual: unknown, expected: unknown, message = '') {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${message}\n  expected: ${e}\n  actual:   ${a}`);
}

const COMMUNITY = '10000000-0000-0000-0000-000000000001';
const UNIT = '20000000-0000-0000-0000-000000000001';
const dbError = (code: string) => Object.assign(new Error(code), { code });

type Fake = Deps & {
  created: string[];
  deleted: string[];
  added: AddResidentArgs[];
};

function fake(overrides: Partial<Deps> = {}): Fake {
  const state = {
    created: [] as string[],
    deleted: [] as string[],
    added: [] as AddResidentArgs[],
  };
  return {
    ...state,
    getCallerId: async (token) => (token === 'admin-token' ? 'admin-1' : null),
    isCommunityAdmin: async (caller, community) => caller === 'admin-1' && community === COMMUNITY,
    findUserIdByEmail: async () => null,
    createUser: async (email) => {
      state.created.push(email);
      return 'new-user';
    },
    deleteUser: async (id) => {
      state.deleted.push(id);
    },
    addResident: async (args) => {
      state.added.push(args);
    },
    generatePassword: () => 'Kp7m-x9Qa-3Vtz',
    ...overrides,
    get created() {
      return state.created;
    },
    get deleted() {
      return state.deleted;
    },
    get added() {
      return state.added;
    },
  } as Fake;
}

const request = (body: unknown, token: string | null = 'admin-token', method = 'POST') =>
  new Request('http://localhost/admin-create-resident', {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: method === 'POST' ? JSON.stringify(body) : undefined,
  });

const valid = {
  communityId: COMMUNITY,
  email: '  Marta@Example.COM ',
  displayName: ' Marta Vidal ',
  unitId: UNIT,
};

Deno.test('creates a new account and returns its password once', async () => {
  const deps = fake();
  const response = await handle(request(valid), deps);
  assertEquals(response.status, 201);
  assertEquals(await response.json(), {
    userId: 'new-user',
    created: true,
    password: 'Kp7m-x9Qa-3Vtz',
  });
  assertEquals(deps.created, ['marta@example.com'], 'email is normalised');
  assertEquals(deps.added, [
    {
      callerId: 'admin-1',
      communityId: COMMUNITY,
      userId: 'new-user',
      displayName: 'Marta Vidal',
      unitId: UNIT,
    },
  ]);
  assert(response.headers.get('Access-Control-Allow-Origin') === '*', 'CORS header present');
});

Deno.test('adds an existing account without creating or revealing a password', async () => {
  const deps = fake({ findUserIdByEmail: async () => 'existing-user' });
  const response = await handle(request(valid), deps);
  assertEquals(response.status, 200);
  assertEquals(await response.json(), { userId: 'existing-user', created: false });
  assertEquals(deps.created, []);
});

Deno.test('rejects missing or invalid tokens before anything else', async () => {
  for (const token of [null, 'expired-token']) {
    const deps = fake();
    const response = await handle(request(valid, token), deps);
    assertEquals(response.status, 401);
    assertEquals(deps.created, []);
  }
});

Deno.test('rejects non-admins without creating an account', async () => {
  const deps = fake({ isCommunityAdmin: async () => false });
  const response = await handle(request(valid), deps);
  assertEquals(response.status, 403);
  assertEquals(await response.json(), { error: 'forbidden' });
  assertEquals(deps.created, []);
  assertEquals(deps.added, []);
});

Deno.test('validates the input', async () => {
  const cases = [
    { ...valid, email: 'not-an-email' },
    { ...valid, email: `${'a'.repeat(250)}@x.cat` },
    { ...valid, communityId: 'not-a-uuid' },
    { ...valid, unitId: 'not-a-uuid' },
    { ...valid, displayName: '   ' },
    { ...valid, displayName: 'x'.repeat(161) },
    'not an object',
  ];
  for (const body of cases) {
    const deps = fake();
    const response = await handle(request(body), deps);
    assertEquals(response.status, 400, JSON.stringify(body).slice(0, 60));
    assertEquals(deps.created, []);
  }
  const noUnit = fake();
  const response = await handle(request({ ...valid, unitId: null }), noUnit);
  assertEquals(response.status, 201, 'a resident without a unit is allowed');
});

Deno.test('maps database rejections and deletes the account it just created', async () => {
  const cases: [string, number, string][] = [
    ['23505', 409, 'already_member'],
    ['23503', 422, 'invalid_unit'],
    ['42501', 403, 'forbidden'],
    ['23514', 400, 'invalid_input'],
  ];
  for (const [code, status, error] of cases) {
    const deps = fake({ addResident: async () => Promise.reject(dbError(code)) });
    const response = await handle(request(valid), deps);
    assertEquals(response.status, status, code);
    assertEquals(await response.json(), { error });
    assertEquals(deps.deleted, ['new-user'], `${code} rolls back the new account`);
  }
});

Deno.test('never deletes an existing account when adding it fails', async () => {
  const deps = fake({
    findUserIdByEmail: async () => 'existing-user',
    addResident: async () => Promise.reject(dbError('23505')),
  });
  const response = await handle(request(valid), deps);
  assertEquals(response.status, 409);
  assertEquals(deps.deleted, []);
});

Deno.test('reuses an account created concurrently with the same email', async () => {
  let lookups = 0;
  const deps = fake({
    findUserIdByEmail: async () => (lookups++ === 0 ? null : 'raced-user'),
    createUser: async () => Promise.reject(dbError('email_exists')),
  });
  const response = await handle(request(valid), deps);
  assertEquals(response.status, 200);
  assertEquals(await response.json(), { userId: 'raced-user', created: false });
});

Deno.test('answers CORS preflight and rejects other methods', async () => {
  const preflight = await handle(request(null, null, 'OPTIONS'), fake());
  assertEquals(preflight.status, 204);
  assert(
    preflight.headers.get('Access-Control-Allow-Headers')?.includes('authorization'),
    'allows auth header'
  );
  const get = await handle(request(null, 'admin-token', 'GET'), fake());
  assertEquals(get.status, 405);
});

Deno.test('generates readable, random passwords', () => {
  const seen = new Set<string>();
  for (let index = 0; index < 500; index++) {
    const password = generatePassword();
    assert(
      /^[A-HJ-NP-Za-km-z2-9]{4}-[A-HJ-NP-Za-km-z2-9]{4}-[A-HJ-NP-Za-km-z2-9]{4}$/.test(password),
      password
    );
    seen.add(password);
  }
  assertEquals(seen.size, 500, 'no repeats');
});
