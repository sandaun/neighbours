// Request handling for admin-create-resident, kept free of Supabase and Deno
// specifics so it can be tested with fakes (see handler.test.ts).

export type AddResidentArgs = {
  callerId: string;
  communityId: string;
  userId: string;
  displayName: string;
  unitId: string | null;
};

export type Deps = {
  /** Verifies the caller's access token; null when invalid or expired. */
  getCallerId(token: string): Promise<string | null>;
  isCommunityAdmin(callerId: string, communityId: string): Promise<boolean>;
  findUserIdByEmail(email: string): Promise<string | null>;
  /** Creates a confirmed account; throws { code: 'email_exists' } on a race. */
  createUser(email: string, password: string): Promise<string>;
  deleteUser(userId: string): Promise<void>;
  /** service_add_resident: throws with the Postgres error code on rejection. */
  addResident(args: AddResidentArgs): Promise<void>;
  generatePassword(): string;
  log?(message: string): void;
};

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const fail = (status: number, error: string) => json(status, { error });

function codeOf(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code: unknown }).code);
  }
  return undefined;
}

type Input = { communityId: string; email: string; displayName: string; unitId: string | null };

function parseInput(body: unknown): Input | null {
  if (typeof body !== 'object' || body === null) return null;
  const { communityId, email, displayName, unitId } = body as Record<string, unknown>;
  if (typeof communityId !== 'string' || !UUID.test(communityId)) return null;
  if (typeof email !== 'string') return null;
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail.length > 254 || !EMAIL.test(normalizedEmail)) return null;
  if (typeof displayName !== 'string') return null;
  const name = displayName.trim();
  if (name.length < 1 || name.length > 160) return null;
  if (
    unitId !== null &&
    unitId !== undefined &&
    (typeof unitId !== 'string' || !UUID.test(unitId))
  ) {
    return null;
  }
  return { communityId, email: normalizedEmail, displayName: name, unitId: unitId ?? null };
}

export async function handle(request: Request, deps: Deps): Promise<Response> {
  if (request.method === 'OPTIONS')
    return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== 'POST') return fail(405, 'method_not_allowed');

  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  const callerId = token ? await deps.getCallerId(token) : null;
  if (!callerId) return fail(401, 'unauthenticated');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, 'invalid_input');
  }
  const input = parseInput(body);
  if (!input) return fail(400, 'invalid_input');

  // Checked before any account exists, so non-admins never create users.
  if (!(await deps.isCommunityAdmin(callerId, input.communityId))) return fail(403, 'forbidden');

  let userId = await deps.findUserIdByEmail(input.email);
  let password: string | null = null;
  if (!userId) {
    password = deps.generatePassword();
    try {
      userId = await deps.createUser(input.email, password);
    } catch (error) {
      // Another request created the same email in the meantime: reuse it.
      if (codeOf(error) !== 'email_exists') throw error;
      userId = await deps.findUserIdByEmail(input.email);
      password = null;
      if (!userId) throw error;
    }
  }
  const created = password !== null;

  try {
    await deps.addResident({
      callerId,
      communityId: input.communityId,
      userId,
      displayName: input.displayName,
      unitId: input.unitId,
    });
  } catch (error) {
    // Never leave a new account behind without its membership.
    if (created) {
      await deps.deleteUser(userId).catch(() => deps.log?.(`Could not delete user ${userId}`));
    }
    switch (codeOf(error)) {
      case '23505':
        return fail(409, 'already_member');
      case '23503':
        return fail(422, 'invalid_unit');
      case '42501':
        return fail(403, 'forbidden');
      case '23514':
        return fail(400, 'invalid_input');
      default:
        throw error;
    }
  }

  return created ? json(201, { userId, created, password }) : json(200, { userId, created });
}

// Unambiguous characters (no 0/O, 1/l/I) in three groups, e.g. "Kp7m-x9Qa-3Vtz".
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

export function generatePassword(groups = 3, size = 4): string {
  const chars: string[] = [];
  // Rejection sampling avoids modulo bias.
  const limit = 256 - (256 % ALPHABET.length);
  while (chars.length < groups * size) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    for (const byte of bytes) {
      if (byte < limit && chars.length < groups * size)
        chars.push(ALPHABET[byte % ALPHABET.length]);
    }
  }
  return Array.from({ length: groups }, (_, index) =>
    chars.slice(index * size, (index + 1) * size).join('')
  ).join('-');
}
