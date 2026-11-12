import { expect, test } from 'vitest';

import { addIncidentUpdate, getIncident, listIncidents } from './incidents-api';
import { makeFakeClient } from '@/test/fake-client';

const incidentRow = {
  id: 'i1',
  title: 'Broken light',
  description: 'The entrance light is broken',
  location: 'Entrance',
  category: 'electrical',
  status: 'received',
  photo_path: 'c1/i1/photo.jpg',
  reported_at: '2026-11-02T09:30:00Z',
};

test('lists a community’s incidents, newest first', async () => {
  const { client, calls } = makeFakeClient({
    tables: { incidents: { data: [incidentRow], error: null } },
  });
  await expect(listIncidents(client, 'c1')).resolves.toEqual([
    {
      id: 'i1',
      title: 'Broken light',
      location: 'Entrance',
      category: 'electrical',
      status: 'received',
      reportedAt: '2026-11-02T09:30:00Z',
    },
  ]);
  expect(calls).toContainEqual({ table: 'incidents', method: 'eq', args: ['community_id', 'c1'] });
  expect(calls).toContainEqual({
    table: 'incidents',
    method: 'order',
    args: ['reported_at', { ascending: false }],
  });
});

test('loads the detail with updates and a private photo URL', async () => {
  const { client, calls, storage, createSignedUrl } = makeFakeClient({
    tables: {
      incidents: { data: incidentRow, error: null },
      incident_updates: {
        data: [
          {
            id: 'u1',
            body: 'Electrician contacted',
            author_name: 'Anna',
            status: 'in-progress',
            created_at: '2026-11-03T10:00:00Z',
          },
        ],
        error: null,
      },
    },
  });
  const detail = await getIncident(client, 'c1', 'i1');
  expect(detail).toMatchObject({
    id: 'i1',
    description: 'The entrance light is broken',
    hasPhoto: true,
    photoUrl: 'https://files.example/photo.jpg',
    updates: [{ id: 'u1', authorName: 'Anna', status: 'in-progress' }],
  });
  // The incident must belong to the community in the URL.
  expect(calls).toContainEqual({ table: 'incidents', method: 'eq', args: ['community_id', 'c1'] });
  expect(storage.from).toHaveBeenCalledWith('incident-photos');
  expect(createSignedUrl).toHaveBeenCalledWith('c1/i1/photo.jpg', 300);
});

test('keeps the incident when its photo cannot be signed', async () => {
  const { client } = makeFakeClient({
    tables: { incidents: { data: incidentRow, error: null } },
    signedUrl: { data: null, error: new Error('not found') },
  });
  await expect(getIncident(client, 'c1', 'i1')).resolves.toMatchObject({
    hasPhoto: true,
    photoUrl: null,
  });
});

test('returns null for an incident outside the community', async () => {
  const { client } = makeFakeClient({ tables: { incidents: { data: null, error: null } } });
  await expect(getIncident(client, 'c1', 'missing')).resolves.toBeNull();
});

test('posts updates through the admin function, trimming the body', async () => {
  const { client, rpc } = makeFakeClient({
    rpc: {
      data: {
        id: 'u2',
        incident_id: 'i1',
        body: 'Fixed',
        author_name: 'Anna',
        status: 'resolved',
        created_at: '2026-11-04T10:00:00Z',
      },
      error: null,
    },
  });
  await expect(
    addIncidentUpdate(client, { incidentId: 'i1', body: '  Fixed  ', status: 'resolved' })
  ).resolves.toMatchObject({ id: 'u2', status: 'resolved' });
  expect(rpc).toHaveBeenCalledWith('admin_add_incident_update', {
    p_incident_id: 'i1',
    p_body: 'Fixed',
    p_status: 'resolved',
  });
});

test('omits the status to keep the current one', async () => {
  const { client, rpc } = makeFakeClient({
    rpc: {
      data: { id: 'u3', body: 'Note', author_name: 'Anna', status: null, created_at: '' },
      error: null,
    },
  });
  await addIncidentUpdate(client, { incidentId: 'i1', body: 'Note', status: null });
  expect(rpc).toHaveBeenCalledWith('admin_add_incident_update', {
    p_incident_id: 'i1',
    p_body: 'Note',
  });
});

test('throws when the database rejects the update', async () => {
  const failure = new Error('permission denied');
  const { client } = makeFakeClient({ rpc: { data: null, error: failure } });
  await expect(
    addIncidentUpdate(client, { incidentId: 'i1', body: 'Note', status: null })
  ).rejects.toBe(failure);
});
