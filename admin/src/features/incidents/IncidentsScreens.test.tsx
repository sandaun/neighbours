import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';

import { App } from '@/App';
import { makeFakeClient, makeSession } from '@/test/fake-client';
import { makeAuth, renderWithAuth } from '@/test/render-with-auth';

const communities = [
  { communityId: 'c1', communityName: 'Gran Via 112', displayName: 'Anna Puig' },
];
const incidentRows = [
  {
    id: 'i1',
    title: 'Llum de l’entrada espatllada',
    location: 'Entrada',
    category: 'electrical',
    status: 'received',
    reported_at: '2026-11-02T09:30:00Z',
  },
  {
    id: 'i2',
    title: 'Fuita al garatge',
    location: 'Garatge',
    category: 'plumbing',
    status: 'resolved',
    reported_at: '2026-10-20T08:00:00Z',
  },
];
const detailRow = {
  ...incidentRows[0],
  description: 'La llum no s’encén des d’ahir.',
  photo_path: null,
};

function setup(route: string, options: Parameters<typeof makeFakeClient>[0] = {}) {
  const fake = makeFakeClient({
    tables: {
      incidents: { data: route.endsWith('/i1') ? detailRow : incidentRows, error: null },
      incident_updates: { data: [], error: null },
    },
    ...options,
  });
  const auth = makeAuth({
    client: fake.client,
    status: 'ready',
    session: makeSession(),
    communities,
  });
  return { fake, ...renderWithAuth(<App />, auth, { route }) };
}

test('opens a community’s incidents from the community list', async () => {
  setup('/');
  await userEvent.click(screen.getByRole('link', { name: 'Obre Gran Via 112' }));
  expect(await screen.findByRole('heading', { name: 'Incidències' })).toBeInTheDocument();
  expect(await screen.findByText('Llum de l’entrada espatllada')).toBeInTheDocument();
  expect(screen.getByText('Fuita al garatge')).toBeInTheDocument();
});

test('filters incidents by status with counts', async () => {
  setup('/communities/c1/incidents');
  await screen.findByText('Llum de l’entrada espatllada');
  const filters = screen.getByRole('group', { name: 'Filtra per estat' });
  await userEvent.click(within(filters).getByRole('button', { name: /Resolta/ }));
  expect(within(filters).getByRole('button', { name: 'Resolta (1)' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(screen.queryByText('Llum de l’entrada espatllada')).not.toBeInTheDocument();
  expect(screen.getByText('Fuita al garatge')).toBeInTheDocument();
  await userEvent.click(within(filters).getByRole('button', { name: /En gestió/ }));
  expect(screen.getByText('No hi ha incidències amb aquest estat.')).toBeInTheDocument();
});

test('shows a retryable error when incidents fail to load', async () => {
  setup('/communities/c1/incidents', {
    tables: { incidents: { data: null, error: new Error('network') } },
  });
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'No hem pogut carregar les incidències'
  );
  expect(screen.getByRole('button', { name: 'Tornar-ho a provar' })).toBeInTheDocument();
});

test('does not open a community the admin does not manage', () => {
  setup('/communities/other/incidents');
  expect(screen.getByRole('heading', { name: 'Aquesta pàgina no existeix' })).toBeInTheDocument();
});

test('shows the incident detail and an empty history', async () => {
  setup('/communities/c1/incidents/i1');
  expect(
    await screen.findByRole('heading', { name: 'Llum de l’entrada espatllada' })
  ).toBeInTheDocument();
  expect(screen.getByText('La llum no s’encén des d’ahir.')).toBeInTheDocument();
  expect(screen.getByText('Electricitat')).toBeInTheDocument();
  expect(screen.getByText(/Encara no hi ha cap resposta/)).toBeInTheDocument();
});

test('reports a missing incident', async () => {
  setup('/communities/c1/incidents/i1', {
    tables: { incidents: { data: null, error: null } },
  });
  expect(
    await screen.findByRole('heading', { name: 'No trobem aquesta incidència' })
  ).toBeInTheDocument();
});

test('validates the reply before sending it', async () => {
  const { fake } = setup('/communities/c1/incidents/i1');
  await screen.findByRole('heading', { name: 'Respon al veí' });
  await userEvent.type(screen.getByLabelText('Missatge'), '   ');
  await userEvent.click(screen.getByRole('button', { name: 'Publicar resposta' }));
  expect(screen.getByText('Escriu un missatge d’entre 1 i 4.000 caràcters.')).toBeInTheDocument();
  expect(fake.rpc).not.toHaveBeenCalled();
});

test('publishes a reply with a status change and refreshes the incident', async () => {
  const { fake } = setup('/communities/c1/incidents/i1', {
    rpc: {
      data: {
        id: 'u1',
        incident_id: 'i1',
        body: 'Hem avisat l’electricista.',
        author_name: 'Anna Puig',
        status: 'in-progress',
        created_at: '2026-11-03T10:00:00Z',
      },
      error: null,
    },
  });
  await screen.findByRole('heading', { name: 'Respon al veí' });
  const status = screen.getByLabelText('Estat de la incidència');
  // The current status is the default and is not offered twice.
  expect(
    within(status)
      .getAllByRole('option')
      .map((option) => option.textContent)
  ).toEqual(['Mantenir (Rebuda)', 'En gestió', 'Resolta']);

  // The database now returns the updated incident and its history.
  fake.setTable('incidents', { data: { ...detailRow, status: 'in-progress' }, error: null });
  fake.setTable('incident_updates', {
    data: [
      {
        id: 'u1',
        body: 'Hem avisat l’electricista.',
        author_name: 'Anna Puig',
        status: 'in-progress',
        created_at: '2026-11-03T10:00:00Z',
      },
    ],
    error: null,
  });

  await userEvent.type(screen.getByLabelText('Missatge'), '  Hem avisat l’electricista.  ');
  await userEvent.selectOptions(status, 'in-progress');
  await userEvent.click(screen.getByRole('button', { name: 'Publicar resposta' }));

  expect(fake.rpc).toHaveBeenCalledWith('admin_add_incident_update', {
    p_incident_id: 'i1',
    p_body: 'Hem avisat l’electricista.',
    p_status: 'in-progress',
  });
  expect(await screen.findByRole('status')).toHaveTextContent('Resposta publicada');
  expect(await screen.findByText('Estat: En gestió')).toBeInTheDocument();
  expect(screen.getByLabelText('Missatge')).toHaveValue('');
});

test('keeps the reply when publishing fails', async () => {
  setup('/communities/c1/incidents/i1', {
    rpc: { data: null, error: new Error('permission denied') },
  });
  await screen.findByRole('heading', { name: 'Respon al veí' });
  await userEvent.type(screen.getByLabelText('Missatge'), 'Ho mirem demà');
  await userEvent.click(screen.getByRole('button', { name: 'Publicar resposta' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('No hem pogut publicar la resposta');
  expect(screen.getByLabelText('Missatge')).toHaveValue('Ho mirem demà');
});
