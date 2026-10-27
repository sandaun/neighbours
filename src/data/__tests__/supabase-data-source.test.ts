import { createClient } from '@supabase/supabase-js';

import type { Database, IncidentRow, MembershipRow, ReceiptRow, UnitRow } from '../database.types';
import { createSupabaseDataSource } from '../supabase-data-source';

jest.mock('@/lib/supabase', () => ({ getSupabase: jest.fn() }), { virtual: true });

const COMMUNITY_ID = '10000000-0000-0000-0000-000000000001';
const UNIT_ID = '20000000-0000-0000-0000-000000000001';
const USER_ID = '00000000-0000-0000-0000-000000000001';
const INCIDENT_ID = '30000000-0000-0000-0000-000000000001';
const membership: MembershipRow = {
  community_id: COMMUNITY_ID,
  user_id: USER_ID,
  unit_id: UNIT_ID,
  display_name: 'Resident A',
  role: 'resident',
  created_at: '2026-10-18T10:00:00Z',
};
const incident: IncidentRow = {
  id: INCIDENT_ID,
  community_id: COMMUNITY_ID,
  reporter_id: USER_ID,
  title: 'Broken light',
  description: 'The entrance light is broken',
  location: 'Entrance',
  category: 'electrical',
  status: 'received',
  photo_path: null,
  reported_at: '2026-10-18T11:00:00Z',
};
const unit: UnitRow = {
  id: UNIT_ID,
  community_id: COMMUNITY_ID,
  label: '1A',
  balance_cents: 1250,
  next_charge_at: null,
  next_charge_cents: null,
  created_at: '2026-10-18T10:00:00Z',
};
const receipt: ReceiptRow = {
  id: 'receipt-a',
  community_id: COMMUNITY_ID,
  unit_id: UNIT_ID,
  concept: 'Monthly fee',
  amount_cents: 1250,
  issued_at: '2026-10-01',
  period: 'October',
  status: 'paid',
  storage_path: null,
};

type Request = { url: URL; init?: RequestInit };
type Reply = { body: unknown; status?: number };
function harness(reply?: (request: Request) => Reply | undefined) {
  const requests: Request[] = [];
  const fetcher = jest.fn(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const request = { url: new URL(String(input)), init };
      requests.push(request);
      const custom = reply?.(request);
      const table = request.url.pathname.split('/').at(-1);
      const fixtures: Record<string, unknown> = {
        community_members: [membership],
        incidents: init?.method === 'GET' ? [incident] : incident,
        incident_updates: [],
        units: unit,
        receipts: [receipt],
        communities: { id: COMMUNITY_ID, name: 'Community A' },
        community_events: [],
        documents: [],
        board_posts: [],
        directory_contacts: [],
      };
      let body = custom?.body ?? fixtures[table ?? ''] ?? {};
      const headers = init?.headers as Record<string, string> | undefined;
      if (headers?.Accept?.includes('application/vnd.pgrst.object+json') && Array.isArray(body)) {
        body = body[0] ?? null;
      }
      const status = custom?.status ?? 200;
      return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  );
  const client = createClient<Database>('https://example.supabase.co', 'test-publishable', {
    global: { fetch: fetcher },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  jest.spyOn(client.auth, 'getUser').mockResolvedValue({
    data: {
      user: {
        id: USER_ID,
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: '2026-10-18T10:00:00Z',
      },
    },
    error: null,
  });
  return { source: createSupabaseDataSource(() => client), requests, client };
}

const input = {
  title: ' Broken light ',
  description: ' The entrance light is broken ',
  location: ' Entrance ',
  category: 'electrical' as const,
};

describe('Supabase resident data source', () => {
  test('selects one deterministic membership and filters incidents to its community', async () => {
    const { source, requests } = harness();
    await expect(source.getIncidents()).resolves.toEqual([
      {
        id: INCIDENT_ID,
        title: 'Broken light',
        location: 'Entrance',
        status: 'received',
        reportedAt: incident.reported_at,
      },
    ]);
    expect(requests[0].url.searchParams.get('order')).toBe('created_at.asc,community_id.asc');
    expect(requests[0].url.searchParams.get('limit')).toBe('1');
    expect(requests[0].url.searchParams.get('user_id')).toBe(`eq.${USER_ID}`);
    expect(requests[1].url.searchParams.get('community_id')).toBe(`eq.${COMMUNITY_ID}`);
  });

  test('preserves unscheduled charges and identifies missing receipt PDFs', async () => {
    const { source, requests } = harness();
    const accounts = await source.getAccounts();
    expect(accounts.nextChargeAt).toBeNull();
    expect(accounts.nextChargeCents).toBeNull();
    expect(accounts.balanceCents).toBe(1250);
    expect(accounts.receipts[0].hasFile).toBe(false);
    const receiptRequest = requests.find((request) => request.url.pathname.endsWith('/receipts'));
    expect(receiptRequest?.url.searchParams.get('unit_id')).toBe(`eq.${UNIT_ID}`);
    await expect(source.getReceiptUrl('receipt-a')).rejects.toThrow('no PDF attached');
  });

  test('refuses accounts without a unit instead of showing invented finances', async () => {
    const { source } = harness((request) =>
      request.url.pathname.endsWith('/community_members')
        ? { body: [{ ...membership, unit_id: null }] }
        : undefined
    );
    await expect(source.getAccounts()).rejects.toThrow('No unit is assigned');
  });

  test('propagates backend errors without mock fallback', async () => {
    const { source } = harness((request) =>
      request.url.pathname.endsWith('/incidents')
        ? { status: 403, body: { message: 'Access denied', code: '42501' } }
        : undefined
    );
    await expect(source.getIncidents()).rejects.toMatchObject({ message: 'Access denied' });
  });

  test('refuses users without membership', async () => {
    const { source } = harness((request) =>
      request.url.pathname.endsWith('/community_members') ? { body: [] } : undefined
    );
    await expect(source.getHome()).rejects.toThrow('No community membership');
  });

  test('inserts only resident fields and trims user input', async () => {
    const { source, requests } = harness();
    await expect(source.createIncident(input)).resolves.toMatchObject({
      id: INCIDENT_ID,
      updates: [],
    });
    const created = requests.find((request) => request.init?.method === 'POST');
    expect(JSON.parse(String(created?.init?.body))).toEqual({
      title: 'Broken light',
      description: 'The entrance light is broken',
      location: 'Entrance',
      category: 'electrical',
      community_id: COMMUNITY_ID,
      reporter_id: USER_ID,
    });
  });

  test('validates fields and photo types before creating an incident', async () => {
    const { source, requests } = harness();
    await expect(source.createIncident({ ...input, title: 'x' })).rejects.toThrow(
      'Invalid incident'
    );
    await expect(
      source.createIncident({ ...input, photo: { base64: 'eA==', mimeType: 'text/html' } })
    ).rejects.toThrow('Photo must');
    await expect(
      source.createIncident({ ...input, photo: { base64: 'bad base64', mimeType: 'image/jpeg' } })
    ).rejects.toThrow('Photo must');
    expect(requests).toHaveLength(0);
  });

  test('rejects oversized photos before saving the incident', async () => {
    const { source, requests } = harness();
    await expect(
      source.createIncident({
        ...input,
        photo: {
          base64: 'A'.repeat(Math.ceil((5 * 1024 * 1024) / 3) * 4 + 4),
          mimeType: 'image/jpeg',
        },
      })
    ).rejects.toThrow('Photo must');
    expect(requests).toHaveLength(0);
  });

  test('keeps successful incident creation when optional photo upload fails', async () => {
    const { source, requests } = harness((request) =>
      request.url.pathname.startsWith('/storage/')
        ? { status: 500, body: { message: 'Upload failed' } }
        : undefined
    );
    await expect(
      source.createIncident({ ...input, photo: { base64: 'eA==', mimeType: 'image/jpeg' } })
    ).resolves.toMatchObject({ id: INCIDENT_ID, photoUploadFailed: true });
    expect(
      requests.filter(
        (request) => request.url.pathname.endsWith('/incidents') && request.init?.method === 'POST'
      )
    ).toHaveLength(1);
  });

  test('uploads ArrayBuffer, attaches only photo_path, and signs short-lived URL', async () => {
    const { source, requests } = harness((request) => {
      if (request.url.pathname.includes('/object/sign/'))
        return { body: { signedURL: '/object/sign/incident-photos/photo.jpg?token=test' } };
      if (request.url.pathname.startsWith('/storage/'))
        return { body: { Key: 'incident-photos/photo.jpg' } };
      return undefined;
    });
    const created = await source.createIncident({
      ...input,
      photo: { base64: 'eA==', mimeType: 'image/jpeg' },
    });
    expect(created.photoUploadFailed).toBeUndefined();
    expect(created.photoUrl).toContain('token=test');
    const upload = requests.find((request) =>
      request.url.pathname.includes('/object/incident-photos/')
    );
    expect(upload?.init?.body).toBeInstanceOf(ArrayBuffer);
    expect(upload?.url.pathname).toContain(`${COMMUNITY_ID}/${INCIDENT_ID}/photo.jpg`);
    const attach = requests.find((request) => request.init?.method === 'PATCH');
    expect(JSON.parse(String(attach?.init?.body))).toEqual({
      photo_path: `${COMMUNITY_ID}/${INCIDENT_ID}/photo.jpg`,
    });
    const sign = requests.find((request) => request.url.pathname.includes('/object/sign/'));
    expect(JSON.parse(String(sign?.init?.body))).toMatchObject({ expiresIn: 120 });
  });

  test('keeps incident creation successful when attaching a photo is denied', async () => {
    const { source, requests } = harness((request) => {
      if (request.init?.method === 'PATCH')
        return { status: 403, body: { message: 'Attachment denied' } };
      if (request.url.pathname.startsWith('/storage/'))
        return { body: { Key: 'incident-photos/photo.jpg' } };
      return undefined;
    });
    await expect(
      source.createIncident({ ...input, photo: { base64: 'eA==', mimeType: 'image/jpeg' } })
    ).resolves.toMatchObject({ id: INCIDENT_ID, photoUploadFailed: true });
    expect(
      requests.filter(
        (request) => request.url.pathname.endsWith('/incidents') && request.init?.method === 'POST'
      )
    ).toHaveLength(1);
  });

  test('signs only an authorized row and scopes receipt lookup to the selected unit', async () => {
    const path = `${COMMUNITY_ID}/receipts/${UNIT_ID}/october.pdf`;
    const { source, requests } = harness((request) => {
      if (request.url.pathname.endsWith('/receipts')) return { body: { storage_path: path } };
      if (request.url.pathname.includes('/object/sign/'))
        return { body: { signedURL: '/object/sign/receipt.pdf?token=private' } };
      return undefined;
    });
    await expect(source.getReceiptUrl('receipt-a')).resolves.toContain('token=private');
    const row = requests.find((request) => request.url.pathname.endsWith('/receipts'));
    expect(row?.url.searchParams.get('unit_id')).toBe(`eq.${UNIT_ID}`);
    expect(row?.url.searchParams.get('community_id')).toBe(`eq.${COMMUNITY_ID}`);
    const sign = requests.find((request) => request.url.pathname.includes('/object/sign/'));
    expect(sign?.url.pathname).toContain(path);
    expect(JSON.parse(String(sign?.init?.body))).toEqual({ expiresIn: 120 });
  });

  test('home reads connected content, calendar uses real events, unsupported modules are empty', async () => {
    const { source } = harness((request) =>
      request.url.pathname.endsWith('/community_events')
        ? {
            body: [
              {
                id: 'event-a',
                community_id: COMMUNITY_ID,
                title: 'Meeting',
                location: 'Hall',
                starts_at: '2099-01-01T12:00:00Z',
                ends_at: null,
              },
            ],
          }
        : undefined
    );
    expect((await source.getHome()).boardPosts).toEqual([]);
    expect((await source.getMoreModule('calendar')).sections[0].items[0].title).toBe('Meeting');
    expect(await source.getMoreModule('emergencies')).toMatchObject({
      descriptionKey: 'more.comingSoon',
      sections: [],
    });
  });

  test('home and board share published community posts with a limited home preview', async () => {
    const { source, requests } = harness((request) =>
      request.url.pathname.endsWith('/board_posts')
        ? {
            body: [
              {
                id: 'post-a',
                community_id: COMMUNITY_ID,
                title: 'Lift inspection',
                body: 'The lift will be inspected tomorrow.',
                author_name: 'Alex Smith',
                topic: 'Maintenance',
                published_at: '2026-10-20T09:00:00Z',
              },
            ],
          }
        : undefined
    );
    const home = await source.getHome();
    expect(home.boardPosts[0]).toMatchObject({
      id: 'post-a',
      author: 'Alex Smith',
      authorInitials: 'AS',
      body: 'The lift will be inspected tomorrow.',
      commentsCount: 0,
    });
    const board = await source.getMoreModule('board');
    expect(board.highlight.value).toBe('1');
    expect(board.sections[0].items[0]).toMatchObject({
      id: home.boardPosts[0].id,
      title: 'Lift inspection',
      subtitle: home.boardPosts[0].body,
      publishedAt: '2026-10-20T09:00:00Z',
    });
    const postRequests = requests.filter((request) =>
      request.url.pathname.endsWith('/board_posts')
    );
    expect(postRequests[0].url.searchParams.get('limit')).toBe('3');
    expect(postRequests[1].url.searchParams.has('limit')).toBe(false);
    for (const request of postRequests) {
      expect(request.url.searchParams.get('community_id')).toBe(`eq.${COMMUNITY_ID}`);
      expect(request.url.searchParams.get('published_at')).toMatch(/^lte\./u);
      expect(request.url.searchParams.get('order')).toBe('published_at.desc,id.asc');
    }
  });

  test('directory reads ordered community contacts and tolerates missing contact fields', async () => {
    const { source, requests } = harness((request) =>
      request.url.pathname.endsWith('/directory_contacts')
        ? {
            body: [
              {
                id: 'contact-a',
                community_id: COMMUNITY_ID,
                name: 'Maintenance team',
                service: 'Building repairs',
                phone: null,
                email: 'repairs@example.com',
                hours: 'Weekdays',
                sort_order: 0,
              },
            ],
          }
        : undefined
    );
    const directory = await source.getMoreModule('directory');
    expect(directory.highlight.value).toBe('1');
    expect(directory.sections[0].items[0]).toEqual({
      id: 'contact-a',
      title: 'Maintenance team',
      subtitle: 'Building repairs',
      meta: 'repairs@example.com · Weekdays',
    });
    const request = requests.find((request) =>
      request.url.pathname.endsWith('/directory_contacts')
    );
    expect(request?.url.searchParams.get('community_id')).toBe(`eq.${COMMUNITY_ID}`);
    expect(request?.url.searchParams.get('order')).toBe('sort_order.asc,name.asc,id.asc');
  });

  test.each(['board_posts', 'directory_contacts'])(
    'does not replace failed %s reads with fixtures',
    async (table) => {
      const { source } = harness((request) =>
        request.url.pathname.endsWith(`/${table}`)
          ? { status: 403, body: { message: 'Content denied', code: '42501' } }
          : undefined
      );
      await expect(
        source.getMoreModule(table === 'board_posts' ? 'board' : 'directory')
      ).rejects.toMatchObject({ message: 'Content denied' });
    }
  );

  test('lists documents without attachments and refuses to sign a missing file', async () => {
    const { source, requests } = harness((request) =>
      request.url.pathname.endsWith('/documents')
        ? {
            body: [
              {
                id: 'document-a',
                community_id: COMMUNITY_ID,
                title: 'Community rules',
                category: 'rules',
                file_size_bytes: 0,
                storage_path: null,
                updated_at: '2026-10-27T10:00:00Z',
              },
            ],
          }
        : undefined
    );
    expect(await source.getDocuments()).toEqual([
      expect.objectContaining({
        id: 'document-a',
        title: 'Community rules',
        hasFile: false,
      }),
    ]);
    await expect(source.getDocumentUrl('document-a')).rejects.toThrow('no PDF attached');
    expect(requests.some((request) => request.url.pathname.startsWith('/storage/'))).toBe(false);
  });
});
