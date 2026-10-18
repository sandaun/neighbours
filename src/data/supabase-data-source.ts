import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabase } from '@/lib/supabase';

import type { AppDataSource } from './app-data-source';
import type { Database, IncidentRow } from './database.types';
import {
  INCIDENT_CATEGORIES,
  type CreateIncidentInput,
  type Incident,
  type IncidentDetail,
  type MoreModuleData,
} from './types';

const SIGNED_URL_SECONDS = 120;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function toIncident(row: IncidentRow): Incident {
  return {
    id: row.id,
    title: row.title,
    location: row.location,
    reportedAt: row.reported_at,
    status: row.status,
  };
}

function validateInput(input: CreateIncidentInput) {
  const title = input.title.trim();
  const description = input.description.trim();
  const location = input.location.trim();
  if (
    title.length < 3 ||
    title.length > 120 ||
    description.length < 10 ||
    description.length > 4000 ||
    location.length < 2 ||
    location.length > 160 ||
    !INCIDENT_CATEGORIES.includes(input.category)
  ) {
    throw new Error('Invalid incident fields.');
  }

  let photo: { bytes: ArrayBuffer; extension: string; mimeType: string } | undefined;
  if (input.photo) {
    const { base64, mimeType } = input.photo;
    const extension = PHOTO_EXTENSIONS[mimeType];
    if (
      !extension ||
      base64.length === 0 ||
      base64.length > Math.ceil(MAX_PHOTO_BYTES / 3) * 4 ||
      base64.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)
    ) {
      throw new Error('Photo must be a JPEG, PNG, or WebP image of at most 5 MiB.');
    }
    // React Native uploads require an ArrayBuffer rather than a Blob or FormData.
    const decoded = atob(base64);
    if (decoded.length > MAX_PHOTO_BYTES) {
      throw new Error('Photo exceeds 5 MiB.');
    }
    const bytes = new Uint8Array(decoded.length);
    for (let index = 0; index < decoded.length; index += 1) {
      bytes[index] = decoded.charCodeAt(index);
    }
    photo = { bytes: bytes.buffer, extension, mimeType };
  }
  return { title, description, location, category: input.category, photo };
}

export function createSupabaseDataSource(
  getClient: () => SupabaseClient<Database> = getSupabase
): AppDataSource {
  async function context() {
    const client = getClient();
    const { data: auth, error: authError } = await client.auth.getUser();
    if (authError) throw authError;
    if (!auth.user) throw new Error('A signed-in resident is required.');
    const { data: membership, error } = await client
      .from('community_members')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: true })
      .order('community_id', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!membership) throw new Error('No community membership is assigned.');
    return { client, membership, userId: auth.user.id };
  }

  async function signedUrl(client: SupabaseClient<Database>, bucket: string, path: string) {
    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrl(path, SIGNED_URL_SECONDS);
    if (error) throw error;
    return data.signedUrl;
  }

  async function events(client: SupabaseClient<Database>, communityId: string) {
    const { data, error } = await client
      .from('community_events')
      .select('*')
      .eq('community_id', communityId)
      .order('starts_at', { ascending: true });
    if (error) throw error;
    return data;
  }

  return {
    async getHome() {
      const { client, membership } = await context();
      const [communityResult, incidentResult, communityEvents] = await Promise.all([
        client.from('communities').select('*').eq('id', membership.community_id).single(),
        client
          .from('incidents')
          .select('*')
          .eq('community_id', membership.community_id)
          .order('reported_at', { ascending: false })
          .limit(3),
        events(client, membership.community_id),
      ]);
      if (communityResult.error) throw communityResult.error;
      if (incidentResult.error) throw incidentResult.error;
      return {
        communityName: communityResult.data.name,
        incidents: incidentResult.data.map(toIncident),
        events: communityEvents
          .filter((event) => new Date(event.ends_at ?? event.starts_at).getTime() >= Date.now())
          .slice(0, 3)
          .map((event) => ({
            id: event.id,
            title: event.title,
            location: event.location,
            startsAt: event.starts_at,
          })),
        boardPosts: [],
      };
    },

    async getIncidents() {
      const { client, membership } = await context();
      const { data, error } = await client
        .from('incidents')
        .select('*')
        .eq('community_id', membership.community_id)
        .order('reported_at', { ascending: false });
      if (error) throw error;
      return data.map(toIncident);
    },

    async getIncident(id) {
      const { client, membership } = await context();
      const { data: incident, error } = await client
        .from('incidents')
        .select('*')
        .eq('community_id', membership.community_id)
        .eq('id', id)
        .single();
      if (error) throw error;
      const { data: updates, error: updatesError } = await client
        .from('incident_updates')
        .select('*')
        .eq('incident_id', incident.id)
        .order('created_at', { ascending: true });
      if (updatesError) throw updatesError;
      return {
        ...toIncident(incident),
        description: incident.description,
        category: incident.category,
        photoUrl: incident.photo_path
          ? await signedUrl(client, 'incident-photos', incident.photo_path)
          : undefined,
        updates: updates.map((update) => ({
          id: update.id,
          body: update.body,
          createdAt: update.created_at,
          authorName: update.author_name,
          status: update.status ?? undefined,
        })),
      };
    },

    async createIncident(input) {
      const { photo, ...fields } = validateInput(input);
      const { client, membership, userId } = await context();
      const { data: incident, error } = await client
        .from('incidents')
        .insert({
          ...fields,
          community_id: membership.community_id,
          reporter_id: userId,
        })
        .select('*')
        .single();
      if (error) throw error;
      const detail: IncidentDetail = {
        ...toIncident(incident),
        description: incident.description,
        category: incident.category,
        updates: [],
      };
      if (photo) {
        // The incident is already saved. A failed photo never turns this into a retryable create.
        try {
          const path = `${membership.community_id}/${incident.id}/photo.${photo.extension}`;
          const upload = await client.storage.from('incident-photos').upload(path, photo.bytes, {
            contentType: photo.mimeType,
            upsert: false,
          });
          if (upload.error) throw upload.error;
          const attach = await client
            .from('incidents')
            .update({ photo_path: path })
            .eq('community_id', membership.community_id)
            .eq('id', incident.id)
            .select('id')
            .single();
          if (attach.error) throw attach.error;
          detail.photoUrl = await signedUrl(client, 'incident-photos', path);
        } catch {
          detail.photoUploadFailed = true;
        }
      }
      return detail;
    },

    async getDocuments() {
      const { client, membership } = await context();
      const { data, error } = await client
        .from('documents')
        .select('*')
        .eq('community_id', membership.community_id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data.map((document) => ({
        id: document.id,
        title: document.title,
        category: document.category,
        fileType: 'PDF' as const,
        fileSize:
          document.file_size_bytes >= 1024 * 1024
            ? `${(document.file_size_bytes / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.ceil(document.file_size_bytes / 1024)} KB`,
        updatedAt: document.updated_at,
      }));
    },

    async getDocumentUrl(id) {
      const { client, membership } = await context();
      const { data, error } = await client
        .from('documents')
        .select('storage_path')
        .eq('community_id', membership.community_id)
        .eq('id', id)
        .single();
      if (error) throw error;
      return signedUrl(client, 'community-documents', data.storage_path);
    },

    async getAccounts() {
      const { client, membership } = await context();
      if (!membership.unit_id) throw new Error('No unit is assigned to this resident.');
      const [unit, receipts] = await Promise.all([
        client
          .from('units')
          .select('*')
          .eq('community_id', membership.community_id)
          .eq('id', membership.unit_id)
          .single(),
        client
          .from('receipts')
          .select('*')
          .eq('community_id', membership.community_id)
          .eq('unit_id', membership.unit_id)
          .order('issued_at', { ascending: false }),
      ]);
      if (unit.error) throw unit.error;
      if (receipts.error) throw receipts.error;
      return {
        balanceCents: unit.data.balance_cents,
        nextChargeAt: unit.data.next_charge_at,
        nextChargeCents: unit.data.next_charge_cents,
        receipts: receipts.data.map((receipt) => ({
          id: receipt.id,
          concept: receipt.concept,
          amountCents: receipt.amount_cents,
          issuedAt: receipt.issued_at,
          period: receipt.period,
          status: receipt.status,
          hasFile: receipt.storage_path !== null,
        })),
      };
    },

    async getReceiptUrl(id) {
      const { client, membership } = await context();
      if (!membership.unit_id) throw new Error('No unit is assigned to this resident.');
      const { data, error } = await client
        .from('receipts')
        .select('storage_path')
        .eq('community_id', membership.community_id)
        .eq('unit_id', membership.unit_id)
        .eq('id', id)
        .single();
      if (error) throw error;
      if (!data.storage_path) throw new Error('This receipt has no PDF attached.');
      return signedUrl(client, 'community-documents', data.storage_path);
    },

    async getMoreModule(key): Promise<MoreModuleData> {
      if (key !== 'calendar') {
        return {
          key,
          descriptionKey: 'more.comingSoon',
          highlight: { labelKey: 'more.comingSoon', value: '—' },
          sections: [],
        };
      }
      const { client, membership } = await context();
      const communityEvents = await events(client, membership.community_id);
      return {
        key,
        descriptionKey: 'more.modules.calendar.description',
        highlight: {
          labelKey: 'more.modules.calendar.highlight',
          value: String(communityEvents.length),
        },
        sections: [
          {
            id: 'events',
            titleKey: 'more.modules.calendar.highlight',
            items: communityEvents.map((event) => ({
              id: event.id,
              title: event.title,
              meta: event.location,
              startsAt: event.starts_at,
              endsAt: event.ends_at ?? undefined,
            })),
          },
        ],
      };
    },
  };
}

export const supabaseAppDataSource = createSupabaseDataSource();
