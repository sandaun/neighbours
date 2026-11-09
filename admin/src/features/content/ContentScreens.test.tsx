import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';

import { App } from '@/App';
import { makeFakeClient, makeSession, type QueryResult } from '@/test/fake-client';
import { makeAuth, renderWithAuth } from '@/test/render-with-auth';

const communities = [
  { communityId: 'c1', communityName: 'Gran Via 112', displayName: 'Anna Puig' },
];

const events = [
  {
    id: 'e1',
    community_id: 'c1',
    title: 'Junta ordinària',
    location: 'Sala comunitària',
    starts_at: '2099-12-01T17:00:00Z',
    ends_at: null,
  },
  {
    id: 'e2',
    community_id: 'c1',
    title: 'Revisió extintors',
    location: 'Garatge',
    starts_at: '2020-01-10T08:00:00Z',
    ends_at: null,
  },
];
const posts = [
  {
    id: 'p1',
    community_id: 'c1',
    title: 'Tall d’aigua',
    body: 'Dilluns de 9 a 12.',
    author_name: 'Administració',
    topic: 'Avís',
    published_at: '2099-01-01T08:00:00Z',
  },
];
const contacts = [
  {
    id: 'k1',
    community_id: 'c1',
    name: 'Fontaneria Puig',
    service: 'Fontaneria',
    phone: '600 000 000',
    email: null,
    hours: null,
    sort_order: 0,
  },
];

function setup(route: string, tables: Record<string, QueryResult> = {}) {
  const fake = makeFakeClient({
    tables: {
      community_events: { data: events, error: null },
      board_posts: { data: posts, error: null },
      directory_contacts: { data: contacts, error: null },
      incidents: { data: [], error: null },
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

const writes = (fake: ReturnType<typeof makeFakeClient>, method: string) =>
  fake.calls.filter((call) => call.method === method);

test('switches between community sections with tabs', async () => {
  setup('/communities/c1');
  const nav = screen.getByRole('navigation', { name: 'Seccions de la comunitat' });
  expect(await screen.findByRole('heading', { name: 'Incidències' })).toBeInTheDocument();
  await userEvent.click(within(nav).getByRole('link', { name: 'Calendari' }));
  expect(await screen.findByText('Junta ordinària')).toBeInTheDocument();
  await userEvent.click(within(nav).getByRole('link', { name: 'Tauló' }));
  expect(await screen.findByText('Tall d’aigua')).toBeInTheDocument();
  await userEvent.click(within(nav).getByRole('link', { name: 'Directori' }));
  expect(await screen.findByText('Fontaneria Puig')).toBeInTheDocument();
});

test('groups events into upcoming and past', async () => {
  setup('/communities/c1/events');
  const upcoming = await screen.findByRole('heading', { name: 'Propers' });
  const past = screen.getByRole('heading', { name: 'Passats' });
  expect(upcoming.parentElement).toHaveTextContent('Junta ordinària');
  expect(past.parentElement).toHaveTextContent('Revisió extintors');
});

test('creates an event after validating it', async () => {
  const { fake } = setup('/communities/c1/events');
  await userEvent.click(await screen.findByRole('button', { name: 'Afegir esdeveniment' }));
  const form = screen.getByRole('form', { name: 'Afegir esdeveniment' });
  await userEvent.click(within(form).getByRole('button', { name: 'Desar' }));
  expect(within(form).getAllByText('Aquest camp és obligatori.')).toHaveLength(3);
  expect(writes(fake, 'insert')).toHaveLength(0);

  await userEvent.type(within(form).getByLabelText('Títol'), '  Dia del jardí ');
  await userEvent.type(within(form).getByLabelText('Lloc'), 'Jardí');
  await userEvent.type(within(form).getByLabelText('Inici'), '2026-12-05T10:00');
  await userEvent.type(within(form).getByLabelText('Final'), '2026-12-05T09:00');
  await userEvent.click(within(form).getByRole('button', { name: 'Desar' }));
  expect(
    within(form).getByText('L’hora de final no pot ser anterior a la d’inici.')
  ).toBeInTheDocument();

  await userEvent.clear(within(form).getByLabelText('Final'));
  await userEvent.click(within(form).getByRole('button', { name: 'Desar' }));
  expect(writes(fake, 'insert')[0].args[0]).toEqual({
    community_id: 'c1',
    title: 'Dia del jardí',
    location: 'Jardí',
    // 10:00 in Madrid (UTC+1 in December).
    starts_at: '2026-12-05T09:00:00.000Z',
    ends_at: null,
  });
  expect(await screen.findByRole('status')).toHaveTextContent('Canvis desats');
  expect(screen.queryByRole('form')).not.toBeInTheDocument();
});

test('edits a post keeping its publication date and marks scheduled posts', async () => {
  const { fake } = setup('/communities/c1/board');
  expect(await screen.findByText('Programat')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Editar Tall d’aigua' }));
  const form = screen.getByRole('form', { name: 'Editar anunci' });
  expect(within(form).getByLabelText('Signat per')).toHaveValue('Administració');
  const body = within(form).getByLabelText('Text');
  await userEvent.clear(body);
  await userEvent.type(body, 'Dimarts de 9 a 12.');
  await userEvent.click(within(form).getByRole('button', { name: 'Desar' }));
  const update = writes(fake, 'update')[0];
  expect(update.args[0]).toEqual({
    title: 'Tall d’aigua',
    topic: 'Avís',
    body: 'Dimarts de 9 a 12.',
    author_name: 'Administració',
    published_at: '2099-01-01T08:00:00.000Z',
  });
  expect(fake.calls).toContainEqual({ table: 'board_posts', method: 'eq', args: ['id', 'p1'] });
});

test('signs new posts with the admin name and publishes them now by default', async () => {
  const { fake } = setup('/communities/c1/board');
  await userEvent.click(await screen.findByRole('button', { name: 'Afegir anunci' }));
  const form = screen.getByRole('form', { name: 'Afegir anunci' });
  expect(within(form).getByLabelText('Signat per')).toHaveValue('Anna Puig');
  await userEvent.type(within(form).getByLabelText('Títol'), 'Neteja de l’escala');
  await userEvent.type(within(form).getByLabelText('Tema'), 'Activitats');
  await userEvent.type(within(form).getByLabelText('Text'), 'Dissabte al matí.');
  const before = Date.now();
  await userEvent.click(within(form).getByRole('button', { name: 'Desar' }));
  const inserted = writes(fake, 'insert')[0].args[0] as { published_at: string };
  expect(Date.parse(inserted.published_at)).toBeGreaterThanOrEqual(before - 1000);
});

test('deletes a contact only after confirming', async () => {
  const { fake } = setup('/communities/c1/directory');
  await userEvent.click(await screen.findByRole('button', { name: 'Esborrar Fontaneria Puig' }));
  expect(
    screen.getByText('Segur que vols esborrar «Fontaneria Puig»? No es pot desfer.')
  ).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Cancel·lar' }));
  expect(writes(fake, 'delete')).toHaveLength(0);

  await userEvent.click(screen.getByRole('button', { name: 'Esborrar Fontaneria Puig' }));
  await userEvent.click(screen.getByRole('button', { name: 'Sí, esborra' }));
  expect(writes(fake, 'delete')).toHaveLength(1);
  expect(fake.calls).toContainEqual({
    table: 'directory_contacts',
    method: 'eq',
    args: ['id', 'k1'],
  });
  expect(await screen.findByRole('status')).toHaveTextContent('Esborrat');
});

test('stores blank optional contact fields as null and validates email', async () => {
  const { fake } = setup('/communities/c1/directory');
  await userEvent.click(await screen.findByRole('button', { name: 'Afegir contacte' }));
  const form = screen.getByRole('form', { name: 'Afegir contacte' });
  await userEvent.type(within(form).getByLabelText('Nom'), 'Ascensors Vidal');
  await userEvent.type(within(form).getByLabelText('Servei'), 'Manteniment ascensor');
  await userEvent.type(within(form).getByLabelText('Correu electrònic'), 'no-email');
  await userEvent.click(within(form).getByRole('button', { name: 'Desar' }));
  expect(within(form).getByText('Escriu un correu vàlid.')).toBeInTheDocument();
  expect(writes(fake, 'insert')).toHaveLength(0);

  await userEvent.clear(within(form).getByLabelText('Correu electrònic'));
  await userEvent.type(within(form).getByLabelText('Telèfon'), '   ');
  await userEvent.click(within(form).getByRole('button', { name: 'Desar' }));
  expect(writes(fake, 'insert')[0].args[0]).toEqual({
    community_id: 'c1',
    name: 'Ascensors Vidal',
    service: 'Manteniment ascensor',
    phone: null,
    email: null,
    hours: null,
    sort_order: 0,
  });
});

test('keeps the form open and explains a failed save', async () => {
  setup('/communities/c1/directory', {
    'directory_contacts:write': { data: null, error: new Error('network') },
  });
  await userEvent.click(await screen.findByRole('button', { name: 'Editar Fontaneria Puig' }));
  const form = screen.getByRole('form', { name: 'Editar contacte' });
  await userEvent.click(within(form).getByRole('button', { name: 'Desar' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('No hem pogut desar els canvis');
  expect(screen.getByRole('form', { name: 'Editar contacte' })).toBeInTheDocument();
});

test('shows a retryable error when content fails to load', async () => {
  setup('/communities/c1/events', {
    community_events: { data: null, error: new Error('network') },
  });
  expect(await screen.findByRole('alert')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Afegir esdeveniment' })).toBeDisabled();
});
