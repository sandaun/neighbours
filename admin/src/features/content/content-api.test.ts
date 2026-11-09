import { expect, test } from 'vitest';

import {
  createContact,
  createEvent,
  createPost,
  deleteContact,
  deletePost,
  listContacts,
  listEvents,
  listPosts,
  updateEvent,
  updatePost,
} from './content-api';
import { makeFakeClient } from '@/test/fake-client';

const event = {
  title: 'Junta',
  location: 'Sala',
  starts_at: '2026-12-01T18:00:00.000Z',
  ends_at: null,
};
const post = {
  title: 'Tall d’aigua',
  body: 'Dilluns',
  author_name: 'Anna',
  topic: 'Avís',
  published_at: '2026-11-10T08:00:00.000Z',
};

test('lists each kind of content for one community in display order', async () => {
  const { client, calls } = makeFakeClient();
  await listEvents(client, 'c1');
  await listPosts(client, 'c1');
  await listContacts(client, 'c1');
  for (const table of ['community_events', 'board_posts', 'directory_contacts']) {
    expect(calls).toContainEqual({ table, method: 'eq', args: ['community_id', 'c1'] });
  }
  expect(calls).toContainEqual({
    table: 'community_events',
    method: 'order',
    args: ['starts_at', { ascending: true }],
  });
  expect(calls).toContainEqual({
    table: 'board_posts',
    method: 'order',
    args: ['published_at', { ascending: false }],
  });
  expect(calls).toContainEqual({
    table: 'directory_contacts',
    method: 'order',
    args: ['sort_order', { ascending: true }],
  });
});

test('creates rows in the given community', async () => {
  const { client, calls } = makeFakeClient();
  await createEvent(client, 'c1', event);
  await createPost(client, 'c1', post);
  await createContact(client, 'c1', {
    name: 'Fontaner',
    service: 'Fontaneria',
    phone: null,
    email: null,
    hours: null,
    sort_order: 0,
  });
  expect(calls).toContainEqual({
    table: 'community_events',
    method: 'insert',
    args: [{ community_id: 'c1', ...event }],
  });
  expect(calls).toContainEqual({
    table: 'board_posts',
    method: 'insert',
    args: [{ community_id: 'c1', ...post }],
  });
  expect(
    calls.find((call) => call.table === 'directory_contacts' && call.method === 'insert')
  ).toBeTruthy();
});

test('updates only editable fields, never the community', async () => {
  const { client, calls } = makeFakeClient();
  await updateEvent(client, 'e1', event);
  await updatePost(client, 'p1', post);
  const updates = calls.filter((call) => call.method === 'update');
  expect(updates).toHaveLength(2);
  for (const update of updates) {
    expect(update.args[0]).not.toHaveProperty('community_id');
    expect(update.args[0]).not.toHaveProperty('id');
  }
  expect(calls).toContainEqual({ table: 'community_events', method: 'eq', args: ['id', 'e1'] });
});

test('treats a write that RLS skipped as an error', async () => {
  const { client } = makeFakeClient({
    tables: { 'board_posts:write': { data: [], error: null } },
  });
  await expect(deletePost(client, 'p1')).rejects.toThrow('cannot be changed');
  await expect(updatePost(client, 'p1', post)).rejects.toThrow('cannot be changed');
});

test('propagates database errors', async () => {
  const failure = new Error('violates check constraint');
  const { client } = makeFakeClient({
    tables: { 'directory_contacts:write': { data: null, error: failure } },
  });
  await expect(deleteContact(client, 'x')).rejects.toBe(failure);
});
