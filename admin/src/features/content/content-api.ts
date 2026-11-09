import type { BoardPostRow, DirectoryContactRow, EventRow } from '@shared/database';

import type { AdminClient } from '@/lib/supabase';

// Editable fields only: `id` and `community_id` are fixed by the database grants.
export type EventInput = Pick<EventRow, 'title' | 'location' | 'starts_at' | 'ends_at'>;
export type PostInput = Pick<
  BoardPostRow,
  'title' | 'body' | 'author_name' | 'topic' | 'published_at'
>;
export type ContactInput = Pick<
  DirectoryContactRow,
  'name' | 'service' | 'phone' | 'email' | 'hours' | 'sort_order'
>;

export type { BoardPostRow, DirectoryContactRow, EventRow };

const LIST_LIMIT = 500;

// RLS skips rows the caller may not change instead of failing, so every write
// returns the affected row and treats "no row" as an error.
function one<T>(result: { data: T[] | null; error: Error | null }): T {
  if (result.error) throw result.error;
  const row = result.data?.[0];
  if (!row) throw new Error('The row does not exist or cannot be changed.');
  return row;
}

export async function listEvents(client: AdminClient, communityId: string) {
  const { data, error } = await client
    .from('community_events')
    .select('*')
    .eq('community_id', communityId)
    .order('starts_at', { ascending: true })
    .limit(LIST_LIMIT);
  if (error) throw error;
  return data;
}

export async function createEvent(client: AdminClient, communityId: string, input: EventInput) {
  return one(
    await client
      .from('community_events')
      .insert({ community_id: communityId, ...input })
      .select()
  );
}

export async function updateEvent(client: AdminClient, id: string, input: EventInput) {
  return one(await client.from('community_events').update(input).eq('id', id).select());
}

export async function deleteEvent(client: AdminClient, id: string) {
  return one(await client.from('community_events').delete().eq('id', id).select('id'));
}

export async function listPosts(client: AdminClient, communityId: string) {
  const { data, error } = await client
    .from('board_posts')
    .select('*')
    .eq('community_id', communityId)
    .order('published_at', { ascending: false })
    .limit(LIST_LIMIT);
  if (error) throw error;
  return data;
}

export async function createPost(client: AdminClient, communityId: string, input: PostInput) {
  return one(
    await client
      .from('board_posts')
      .insert({ community_id: communityId, ...input })
      .select()
  );
}

export async function updatePost(client: AdminClient, id: string, input: PostInput) {
  return one(await client.from('board_posts').update(input).eq('id', id).select());
}

export async function deletePost(client: AdminClient, id: string) {
  return one(await client.from('board_posts').delete().eq('id', id).select('id'));
}

export async function listContacts(client: AdminClient, communityId: string) {
  const { data, error } = await client
    .from('directory_contacts')
    .select('*')
    .eq('community_id', communityId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
    .limit(LIST_LIMIT);
  if (error) throw error;
  return data;
}

export async function createContact(client: AdminClient, communityId: string, input: ContactInput) {
  return one(
    await client
      .from('directory_contacts')
      .insert({ community_id: communityId, ...input })
      .select()
  );
}

export async function updateContact(client: AdminClient, id: string, input: ContactInput) {
  return one(await client.from('directory_contacts').update(input).eq('id', id).select());
}

export async function deleteContact(client: AdminClient, id: string) {
  return one(await client.from('directory_contacts').delete().eq('id', id).select('id'));
}
