import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';

import { App } from '@/App';
import { makeFakeClient, makeSession, type QueryResult } from '@/test/fake-client';
import { makeAuth, renderWithAuth } from '@/test/render-with-auth';

const communities = [
  { communityId: 'c1', communityName: 'Gran Via 112', displayName: 'Anna Puig' },
];
const documents = [
  {
    id: 'd1',
    community_id: 'c1',
    title: 'Acta de la junta',
    category: 'minutes',
    file_size_bytes: 1_572_864,
    storage_path: 'c1/documents/acta.pdf',
    updated_at: '2026-11-02T10:00:00Z',
  },
  {
    id: 'd2',
    community_id: 'c1',
    title: 'Pòlissa de l’edifici',
    category: 'insurance',
    file_size_bytes: 0,
    storage_path: null,
    updated_at: '2026-10-02T10:00:00Z',
  },
];
const units = [
  { id: 'u1', label: '1r 1a' },
  { id: 'u2', label: '2n 2a' },
];
const receipts = [
  {
    id: 'r1',
    community_id: 'c1',
    unit_id: 'u1',
    concept: 'Quota ordinària',
    amount_cents: 12550,
    issued_at: '2026-11-01',
    period: 'Novembre 2026',
    status: 'scheduled',
    storage_path: 'c1/receipts/u1/nov.pdf',
  },
  {
    id: 'r2',
    community_id: 'c1',
    unit_id: 'u2',
    concept: 'Derrama ascensor',
    amount_cents: 30000,
    issued_at: '2026-10-01',
    period: 'Octubre 2026',
    status: 'paid',
    storage_path: null,
  },
];

function setup(route: string, tables: Record<string, QueryResult> = {}) {
  const fake = makeFakeClient({
    tables: {
      documents: { data: documents, error: null },
      receipts: { data: receipts, error: null },
      units: { data: units, error: null },
      ...tables,
    },
  });
  const auth = makeAuth({
    client: fake.client,
    status: 'ready',
    session: makeSession(),
    communities,
  });
  return { fake, ...renderWithAuth(<App />, auth, { route }) };
}

const pdf = (name = 'acta.pdf') => new File(['%PDF-1.7'], name, { type: 'application/pdf' });

test('lists documents with category, size, and a warning when the PDF is missing', async () => {
  setup('/communities/c1/documents');
  expect(await screen.findByText('Acta de la junta')).toBeInTheDocument();
  expect(screen.getByText('Actes')).toBeInTheDocument();
  expect(screen.getByText('· 1,5 MB')).toBeInTheDocument();
  expect(screen.getByText(/Sense PDF: els veïns veuen el document/)).toBeInTheDocument();
});

test('publishes a document with its PDF', async () => {
  const { fake } = setup('/communities/c1/documents');
  await userEvent.click(await screen.findByRole('button', { name: 'Afegir document' }));
  const form = screen.getByRole('form', { name: 'Afegir document' });
  await userEvent.type(within(form).getByLabelText('Títol'), 'Acta de novembre');
  await userEvent.selectOptions(within(form).getByLabelText('Categoria'), 'minutes');
  await userEvent.upload(within(form).getByLabelText('PDF (opcional)'), pdf());
  expect(within(form).getByText(/acta\.pdf ·/)).toBeInTheDocument();
  await userEvent.click(within(form).getByRole('button', { name: 'Desar' }));

  expect(fake.upload).toHaveBeenCalledTimes(1);
  expect(fake.calls.find((call) => call.method === 'insert')?.args[0]).toMatchObject({
    community_id: 'c1',
    title: 'Acta de novembre',
    category: 'minutes',
    file_size_bytes: 8,
  });
  expect(await screen.findByRole('status')).toHaveTextContent('Canvis desats');
});

test('rejects files that are not PDFs or are too large', async () => {
  const user = userEvent.setup({ applyAccept: false });
  const { fake } = setup('/communities/c1/documents');
  await user.click(await screen.findByRole('button', { name: 'Afegir document' }));
  const form = screen.getByRole('form', { name: 'Afegir document' });
  await user.type(within(form).getByLabelText('Títol'), 'Foto');
  const input = within(form).getByLabelText('PDF (opcional)');

  await user.upload(input, new File(['x'], 'foto.png', { type: 'image/png' }));
  expect(within(form).getByText('El fitxer ha de ser un PDF.')).toBeInTheDocument();

  const huge = pdf('enorme.pdf');
  Object.defineProperty(huge, 'size', { value: 21 * 1024 * 1024 });
  await user.upload(input, huge);
  expect(within(form).getByText('El PDF no pot superar els 20 MB.')).toBeInTheDocument();

  await user.click(within(form).getByRole('button', { name: 'Desar' }));
  expect(fake.upload).not.toHaveBeenCalled();
});

test('opens a private PDF through a short-lived link', async () => {
  const tab = { opener: {}, location: { href: '' }, close: vi.fn() };
  const open = vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
  const { fake } = setup('/communities/c1/documents');
  await userEvent.click(
    await screen.findByRole('button', { name: 'Veure el PDF de Acta de la junta' })
  );
  expect(open).toHaveBeenCalledWith('', '_blank');
  expect(fake.createSignedUrl).toHaveBeenCalledWith('c1/documents/acta.pdf', 120);
  await vi.waitFor(() => expect(tab.location.href).toBe('https://files.example/photo.jpg'));
  expect(tab.opener).toBeNull();
});

test('shows receipts with unit, amount, status, and filters by unit', async () => {
  setup('/communities/c1/receipts');
  expect(await screen.findByText('Quota ordinària')).toBeInTheDocument();
  expect(screen.getByText('Derrama ascensor')).toBeInTheDocument();
  expect(screen.getByText(/125,50\s€/)).toBeInTheDocument();
  expect(screen.getByText('Programat')).toBeInTheDocument();
  expect(screen.getByText('Pagat')).toBeInTheDocument();

  await userEvent.selectOptions(screen.getByLabelText('Pis'), 'u2');
  expect(screen.queryByText('Quota ordinària')).not.toBeInTheDocument();
  expect(screen.getByText('Derrama ascensor')).toBeInTheDocument();
});

test('creates a receipt converting euros to cents', async () => {
  const { fake } = setup('/communities/c1/receipts');
  await userEvent.click(await screen.findByRole('button', { name: 'Afegir rebut' }));
  const form = screen.getByRole('form', { name: 'Afegir rebut' });
  await userEvent.selectOptions(within(form).getByLabelText('Pis'), 'u2');
  await userEvent.type(within(form).getByLabelText('Concepte'), 'Quota ordinària');
  await userEvent.type(within(form).getByLabelText('Import (€)'), '12,5');
  await userEvent.type(within(form).getByLabelText('Data d’emissió'), '2026-12-01');
  await userEvent.type(within(form).getByLabelText('Període'), 'Desembre 2026');
  await userEvent.click(within(form).getByRole('button', { name: 'Desar' }));
  expect(fake.calls.find((call) => call.method === 'insert')?.args[0]).toEqual({
    community_id: 'c1',
    unit_id: 'u2',
    concept: 'Quota ordinària',
    amount_cents: 1250,
    issued_at: '2026-12-01',
    period: 'Desembre 2026',
    status: 'scheduled',
    storage_path: null,
  });
});

test('validates the amount and locks the unit when editing', async () => {
  const { fake } = setup('/communities/c1/receipts');
  await userEvent.click(
    await screen.findByRole('button', { name: 'Editar Quota ordinària · 1r 1a' })
  );
  const form = screen.getByRole('form', { name: 'Editar rebut' });
  expect(within(form).getByLabelText('Pis')).toBeDisabled();
  expect(within(form).getByLabelText('Import (€)')).toHaveValue('125,50');
  const amount = within(form).getByLabelText('Import (€)');
  await userEvent.clear(amount);
  await userEvent.type(amount, '-3');
  await userEvent.click(within(form).getByRole('button', { name: 'Desar' }));
  expect(within(form).getByText('Escriu un import en euros, p. ex. 125,50.')).toBeInTheDocument();
  expect(fake.calls.some((call) => call.method === 'update')).toBe(false);
});

test('explains that receipts need units first', async () => {
  setup('/communities/c1/receipts', { units: { data: [], error: null } });
  expect(await screen.findByText(/encara no té pisos donats d’alta/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Afegir rebut' })).not.toBeInTheDocument();
});
