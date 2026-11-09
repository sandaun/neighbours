import type { IncidentRow, IncidentUpdateRow } from '@shared/database';

import type { AdminClient } from '@/lib/supabase';

export type IncidentStatus = IncidentRow['status'];
export type IncidentCategory = IncidentRow['category'];
export const incidentStatuses: IncidentStatus[] = ['received', 'in-progress', 'resolved'];

export type IncidentSummary = {
  id: string;
  title: string;
  location: string;
  category: IncidentCategory;
  status: IncidentStatus;
  reportedAt: string;
};

export type IncidentUpdate = {
  id: string;
  body: string;
  authorName: string;
  status: IncidentStatus | null;
  createdAt: string;
};

export type IncidentDetail = IncidentSummary & {
  description: string;
  hasPhoto: boolean;
  photoUrl: string | null;
  updates: IncidentUpdate[];
};

// Signed photo URLs are private and short lived, like in the resident app.
const PHOTO_URL_SECONDS = 300;
const LIST_LIMIT = 500;

const toUpdate = (
  row: Pick<IncidentUpdateRow, 'id' | 'body' | 'author_name' | 'status' | 'created_at'>
) => ({
  id: row.id,
  body: row.body,
  authorName: row.author_name,
  status: row.status,
  createdAt: row.created_at,
});

export async function listIncidents(
  client: AdminClient,
  communityId: string
): Promise<IncidentSummary[]> {
  const { data, error } = await client
    .from('incidents')
    .select('id, title, location, category, status, reported_at')
    .eq('community_id', communityId)
    .order('reported_at', { ascending: false })
    .limit(LIST_LIMIT);
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    location: row.location,
    category: row.category,
    status: row.status,
    reportedAt: row.reported_at,
  }));
}

export async function getIncident(
  client: AdminClient,
  communityId: string,
  incidentId: string
): Promise<IncidentDetail | null> {
  const { data: row, error } = await client
    .from('incidents')
    .select('id, title, description, location, category, status, photo_path, reported_at')
    .eq('id', incidentId)
    .eq('community_id', communityId)
    .maybeSingle();
  if (error) throw error;
  if (!row) return null;

  const { data: updates, error: updatesError } = await client
    .from('incident_updates')
    .select('id, body, author_name, status, created_at')
    .eq('incident_id', incidentId)
    .order('created_at', { ascending: true });
  if (updatesError) throw updatesError;

  let photoUrl: string | null = null;
  if (row.photo_path) {
    // A missing or unreadable photo must not hide the incident itself.
    const { data: signed } = await client.storage
      .from('incident-photos')
      .createSignedUrl(row.photo_path, PHOTO_URL_SECONDS);
    photoUrl = signed?.signedUrl ?? null;
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    category: row.category,
    status: row.status,
    reportedAt: row.reported_at,
    hasPhoto: Boolean(row.photo_path),
    photoUrl,
    updates: updates.map(toUpdate),
  };
}

export async function addIncidentUpdate(
  client: AdminClient,
  input: { incidentId: string; body: string; status: IncidentStatus | null }
): Promise<IncidentUpdate> {
  const { data, error } = await client.rpc('admin_add_incident_update', {
    p_incident_id: input.incidentId,
    p_body: input.body.trim(),
    ...(input.status ? { p_status: input.status } : {}),
  });
  if (error) throw error;
  return toUpdate(data);
}
