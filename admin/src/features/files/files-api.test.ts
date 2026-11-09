import { expect, test } from 'vitest';

import {
  createDocument,
  createReceipt,
  deleteDocument,
  updateDocument,
  updateReceipt,
} from './files-api';
import { makeFakeClient } from '@/test/fake-client';

const pdf = () => new File(['%PDF-1.7 test'], 'acta.pdf', { type: 'application/pdf' });
const docPath = /^c1\/documents\/[0-9a-f-]{36}\.pdf$/;
const order = (fake: ReturnType<typeof makeFakeClient>) =>
  fake.calls
    .filter((call) => ['upload', 'insert', 'update', 'delete', 'remove'].includes(call.method))
    .map((call) => call.method);

const documentRow = {
  id: 'd1',
  community_id: 'c1',
  title: 'Acta',
  category: 'minutes' as const,
  file_size_bytes: 10,
  storage_path: 'c1/documents/old.pdf',
  updated_at: '2026-11-01T10:00:00Z',
};

test('uploads the PDF before creating the document that points to it', async () => {
  const fake = makeFakeClient();
  const file = pdf();
  await createDocument(fake.client, 'c1', {
    title: 'Acta',
    category: 'minutes',
    file,
    currentPath: null,
  });
  expect(order(fake)).toEqual(['upload', 'insert']);
  const path = fake.upload.mock.calls[0][0];
  expect(path).toMatch(docPath);
  expect(fake.calls.find((call) => call.method === 'insert')?.args[0]).toEqual({
    community_id: 'c1',
    title: 'Acta',
    category: 'minutes',
    storage_path: path,
    file_size_bytes: file.size,
  });
});

test('creates a document without a file', async () => {
  const fake = makeFakeClient();
  await createDocument(fake.client, 'c1', {
    title: 'Normes',
    category: 'rules',
    file: null,
    currentPath: null,
  });
  expect(order(fake)).toEqual(['insert']);
  expect(fake.calls.find((call) => call.method === 'insert')?.args[0]).toMatchObject({
    storage_path: null,
    file_size_bytes: 0,
  });
});

test('removes the uploaded PDF when the row cannot be written', async () => {
  const failure = new Error('permission denied');
  const fake = makeFakeClient({ tables: { 'documents:write': { data: null, error: failure } } });
  await expect(
    createDocument(fake.client, 'c1', {
      title: 'Acta',
      category: 'minutes',
      file: pdf(),
      currentPath: null,
    })
  ).rejects.toBe(failure);
  expect(order(fake)).toEqual(['upload', 'insert', 'remove']);
  expect(fake.remove.mock.calls[0][0]).toEqual([fake.upload.mock.calls[0][0]]);
});

test('does not write the row when the upload fails', async () => {
  const fake = makeFakeClient({ uploadResult: { data: null, error: new Error('too large') } });
  await expect(
    createDocument(fake.client, 'c1', {
      title: 'Acta',
      category: 'minutes',
      file: pdf(),
      currentPath: null,
    })
  ).rejects.toThrow('too large');
  expect(order(fake)).toEqual(['upload']);
});

test('replaces a PDF: new upload, row update, then the old file is removed', async () => {
  const fake = makeFakeClient();
  await updateDocument(fake.client, 'c1', 'd1', {
    title: 'Acta revisada',
    category: 'minutes',
    file: pdf(),
    currentPath: 'c1/documents/old.pdf',
  });
  expect(order(fake)).toEqual(['upload', 'update', 'remove']);
  const update = fake.calls.find((call) => call.method === 'update')?.args[0] as Record<
    string,
    unknown
  >;
  expect(update.storage_path).toMatch(docPath);
  expect(update).toHaveProperty('updated_at');
  expect(update).not.toHaveProperty('community_id');
  expect(fake.remove.mock.calls[0][0]).toEqual(['c1/documents/old.pdf']);
});

test('keeps the current PDF when only the details change', async () => {
  const fake = makeFakeClient();
  await updateDocument(fake.client, 'c1', 'd1', {
    title: 'Acta',
    category: 'rules',
    file: null,
    currentPath: 'c1/documents/old.pdf',
  });
  expect(order(fake)).toEqual(['update']);
  expect(fake.calls.find((call) => call.method === 'update')?.args[0]).not.toHaveProperty(
    'storage_path'
  );
});

test('keeps the old PDF when the replacement cannot be saved', async () => {
  const fake = makeFakeClient({
    tables: { 'documents:write': { data: [], error: null } },
  });
  await expect(
    updateDocument(fake.client, 'c1', 'd1', {
      title: 'Acta',
      category: 'minutes',
      file: pdf(),
      currentPath: 'c1/documents/old.pdf',
    })
  ).rejects.toThrow('cannot be changed');
  // Only the new, unreferenced upload is cleaned up.
  expect(fake.remove.mock.calls).toEqual([[[fake.upload.mock.calls[0][0]]]]);
});

test('deletes the row first and only then its PDF', async () => {
  const fake = makeFakeClient();
  await deleteDocument(fake.client, documentRow);
  expect(order(fake)).toEqual(['delete', 'remove']);
  expect(fake.remove.mock.calls[0][0]).toEqual(['c1/documents/old.pdf']);

  const denied = makeFakeClient({ tables: { 'documents:write': { data: [], error: null } } });
  await expect(deleteDocument(denied.client, documentRow)).rejects.toThrow();
  expect(order(denied)).toEqual(['delete']);
});

test('stores receipt PDFs in the unit folder and never moves the unit', async () => {
  const fake = makeFakeClient();
  const input = {
    unitId: 'u7',
    concept: 'Quota',
    amount_cents: 12550,
    issued_at: '2026-11-01',
    period: 'Novembre 2026',
    status: 'scheduled' as const,
    file: pdf(),
    currentPath: null,
  };
  await createReceipt(fake.client, 'c1', input);
  expect(fake.upload.mock.calls[0][0]).toMatch(/^c1\/receipts\/u7\/[0-9a-f-]{36}\.pdf$/);
  expect(fake.calls.find((call) => call.method === 'insert')?.args[0]).toMatchObject({
    community_id: 'c1',
    unit_id: 'u7',
    amount_cents: 12550,
  });

  await updateReceipt(fake.client, 'c1', 'r1', { ...input, file: null });
  const update = fake.calls.find((call) => call.method === 'update')?.args[0];
  expect(update).not.toHaveProperty('unit_id');
  expect(update).not.toHaveProperty('community_id');
});
