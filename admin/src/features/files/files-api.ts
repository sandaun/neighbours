import type { DocumentRow, ReceiptRow, UnitRow } from '@shared/database';

import { one } from '@/lib/rows';
import type { AdminClient } from '@/lib/supabase';

export type { DocumentRow, ReceiptRow };
export type Unit = Pick<UnitRow, 'id' | 'label'>;

export const BUCKET = 'community-documents';
// Same limit as the private bucket (20 MiB).
export const MAX_PDF_BYTES = 20 * 1024 * 1024;
const SIGNED_URL_SECONDS = 120;
const LIST_LIMIT = 500;

export type DocumentInput = Pick<DocumentRow, 'title' | 'category'> & {
  file: File | null;
  currentPath: string | null;
};
export type ReceiptInput = Pick<
  ReceiptRow,
  'concept' | 'amount_cents' | 'issued_at' | 'period' | 'status'
> & {
  unitId: string;
  file: File | null;
  currentPath: string | null;
};

export function isPdf(file: File) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

// Paths follow the namespaces the database enforces; a fresh UUID per upload
// means a file is never overwritten in place.
const documentPath = (communityId: string) => `${communityId}/documents/${crypto.randomUUID()}.pdf`;
const receiptPath = (communityId: string, unitId: string) =>
  `${communityId}/receipts/${unitId}/${crypto.randomUUID()}.pdf`;

async function upload(client: AdminClient, path: string, file: File) {
  // Some systems report no MIME type for PDFs; the bucket only accepts application/pdf.
  const body =
    file.type === 'application/pdf'
      ? file
      : new File([file], file.name, { type: 'application/pdf' });
  const { error } = await client.storage
    .from(BUCKET)
    .upload(path, body, { contentType: 'application/pdf', upsert: false });
  if (error) throw error;
}

// Cleanup after a replaced/deleted row. A leftover file is harmless: no row
// points to it, so residents cannot read it, and the admin can still remove it.
async function removeQuietly(client: AdminClient, path: string | null) {
  if (!path) return;
  await client.storage
    .from(BUCKET)
    .remove([path])
    .catch(() => undefined);
}

// Uploads first, so a row never points to a missing file; undoes the upload
// when the row write fails.
async function withUpload<T>(
  client: AdminClient,
  file: File | null,
  path: () => string,
  write: (uploaded: { path: string; size: number } | null) => Promise<T>
): Promise<T> {
  if (!file) return write(null);
  const target = path();
  await upload(client, target, file);
  try {
    return await write({ path: target, size: file.size });
  } catch (error) {
    await removeQuietly(client, target);
    throw error;
  }
}

export async function signedFileUrl(client: AdminClient, path: string) {
  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_SECONDS);
  if (error) throw error;
  return data.signedUrl;
}

export async function listDocuments(client: AdminClient, communityId: string) {
  const { data, error } = await client
    .from('documents')
    .select('*')
    .eq('community_id', communityId)
    .order('updated_at', { ascending: false })
    .limit(LIST_LIMIT);
  if (error) throw error;
  return data;
}

export async function createDocument(
  client: AdminClient,
  communityId: string,
  input: DocumentInput
) {
  return withUpload(
    client,
    input.file,
    () => documentPath(communityId),
    async (uploaded) =>
      one(
        await client
          .from('documents')
          .insert({
            community_id: communityId,
            title: input.title,
            category: input.category,
            storage_path: uploaded?.path ?? null,
            file_size_bytes: uploaded?.size ?? 0,
          })
          .select()
      )
  );
}

export async function updateDocument(
  client: AdminClient,
  communityId: string,
  id: string,
  input: DocumentInput
) {
  const row = await withUpload(
    client,
    input.file,
    () => documentPath(communityId),
    async (uploaded) =>
      one(
        await client
          .from('documents')
          .update({
            title: input.title,
            category: input.category,
            updated_at: new Date().toISOString(),
            ...(uploaded ? { storage_path: uploaded.path, file_size_bytes: uploaded.size } : {}),
          })
          .eq('id', id)
          .select()
      )
  );
  if (input.file) await removeQuietly(client, input.currentPath);
  return row;
}

export async function deleteDocument(client: AdminClient, row: DocumentRow) {
  const deleted = one(await client.from('documents').delete().eq('id', row.id).select('id'));
  await removeQuietly(client, row.storage_path);
  return deleted;
}

export async function listUnits(client: AdminClient, communityId: string): Promise<Unit[]> {
  const { data, error } = await client
    .from('units')
    .select('id, label')
    .eq('community_id', communityId)
    .order('label', { ascending: true });
  if (error) throw error;
  return data;
}

export async function listReceipts(client: AdminClient, communityId: string) {
  const { data, error } = await client
    .from('receipts')
    .select('*')
    .eq('community_id', communityId)
    .order('issued_at', { ascending: false })
    .limit(LIST_LIMIT);
  if (error) throw error;
  return data;
}

export async function createReceipt(client: AdminClient, communityId: string, input: ReceiptInput) {
  return withUpload(
    client,
    input.file,
    () => receiptPath(communityId, input.unitId),
    async (uploaded) =>
      one(
        await client
          .from('receipts')
          .insert({
            community_id: communityId,
            unit_id: input.unitId,
            concept: input.concept,
            amount_cents: input.amount_cents,
            issued_at: input.issued_at,
            period: input.period,
            status: input.status,
            storage_path: uploaded?.path ?? null,
          })
          .select()
      )
  );
}

export async function updateReceipt(
  client: AdminClient,
  communityId: string,
  id: string,
  input: ReceiptInput
) {
  const row = await withUpload(
    client,
    input.file,
    () => receiptPath(communityId, input.unitId),
    async (uploaded) =>
      one(
        await client
          .from('receipts')
          .update({
            concept: input.concept,
            amount_cents: input.amount_cents,
            issued_at: input.issued_at,
            period: input.period,
            status: input.status,
            ...(uploaded ? { storage_path: uploaded.path } : {}),
          })
          .eq('id', id)
          .select()
      )
  );
  if (input.file) await removeQuietly(client, input.currentPath);
  return row;
}

export async function deleteReceipt(client: AdminClient, row: ReceiptRow) {
  const deleted = one(await client.from('receipts').delete().eq('id', row.id).select('id'));
  await removeQuietly(client, row.storage_path);
  return deleted;
}
