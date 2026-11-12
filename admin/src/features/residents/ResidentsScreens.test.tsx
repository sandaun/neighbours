import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';

import { App } from '@/App';
import { makeFakeClient, makeSession, type QueryResult } from '@/test/fake-client';
import { makeAuth, renderWithAuth } from '@/test/render-with-auth';
import { chooseOption } from '@/test/select';

const communities = [{ communityId: 'c1', communityName: 'Gran Via 112', displayName: 'Oriol' }];
const units = [
  {
    id: 'u1',
    community_id: 'c1',
    label: '1r 1a',
    balance_cents: -12050,
    next_charge_at: '2026-12-01',
    next_charge_cents: 9800,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'u2',
    community_id: 'c1',
    label: '2n 2a',
    balance_cents: 0,
    next_charge_at: null,
    next_charge_cents: null,
    created_at: '2026-01-01T00:00:00Z',
  },
];
const members = [
  {
    user_id: 'user-1',
    display_name: 'Oriol',
    email: 'oriol@example.com',
    unit_id: null,
    role: 'admin',
    created_at: '',
  },
  {
    user_id: 'user-2',
    display_name: 'Marta Vidal',
    email: 'marta@example.com',
    unit_id: 'u1',
    role: 'resident',
    created_at: '',
  },
  {
    user_id: 'user-3',
    display_name: 'Joan Puig',
    email: 'joan@example.com',
    unit_id: null,
    role: 'resident',
    created_at: '',
  },
  {
    user_id: 'user-4',
    display_name: 'Carbonell · Laura',
    email: 'laura@carbonell.example',
    unit_id: null,
    role: 'admin',
    created_at: '',
  },
];

function setup(
  route: string,
  {
    tables = {},
    rpcs = {},
  }: { tables?: Record<string, QueryResult>; rpcs?: Record<string, QueryResult> } = {}
) {
  const fake = makeFakeClient({
    tables: { units: { data: units, error: null }, ...tables },
    rpcs: { admin_list_members: { data: members, error: null }, ...rpcs },
  });
  const auth = makeAuth({
    client: fake.client,
    status: 'ready',
    session: makeSession('user-1'),
    communities,
  });
  return { fake, ...renderWithAuth(<App />, auth, { route }) };
}

test('lists residents with email, unit, and admin/you badges', async () => {
  setup('/communities/c1/residents');
  expect(await screen.findByText('Marta Vidal')).toBeInTheDocument();
  expect(screen.getByText('marta@example.com')).toBeInTheDocument();
  expect(screen.getByText('1r 1a')).toBeInTheDocument();
  expect(screen.getAllByText('Sense pis').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Admin')).toHaveLength(2);
  expect(screen.getByText('Tu')).toBeInTheDocument();
  expect(screen.getByText(/contacta amb l’equip de Neighbours/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /^Afegir/ })).not.toBeInTheDocument();
});

test('only residents other than oneself can be edited or removed', async () => {
  setup('/communities/c1/residents');
  await screen.findByText('Marta Vidal');
  expect(screen.getByRole('button', { name: 'Editar Marta Vidal' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Donar de baixa Joan Puig' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Editar Oriol' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Donar de baixa Oriol' })).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Donar de baixa Carbonell · Laura' })
  ).not.toBeInTheDocument();
});

test('changes a resident’s name and unit', async () => {
  const { fake } = setup('/communities/c1/residents');
  await userEvent.click(await screen.findByRole('button', { name: 'Editar Joan Puig' }));
  const form = screen.getByRole('form', { name: 'Editar veí' });
  const name = within(form).getByLabelText('Nom');
  await userEvent.clear(name);
  await userEvent.type(name, ' Joan Puig i Soler ');
  await chooseOption(within(form).getByRole('combobox', { name: 'Pis' }), '2n 2a');
  await userEvent.click(within(form).getByRole('button', { name: 'Desar' }));
  expect(fake.rpc).toHaveBeenCalledWith('admin_update_member', {
    p_community_id: 'c1',
    p_user_id: 'user-3',
    p_display_name: 'Joan Puig i Soler',
    p_unit_id: 'u2',
  });
  expect(await screen.findByRole('status')).toHaveTextContent('Canvis desats');
});

test('removes a resident’s access after confirming', async () => {
  const { fake } = setup('/communities/c1/residents');
  await userEvent.click(await screen.findByRole('button', { name: 'Donar de baixa Marta Vidal' }));
  expect(screen.getByText(/Perdrà l’accés a aquesta comunitat/)).toBeInTheDocument();
  expect(fake.rpc).not.toHaveBeenCalledWith('admin_remove_member', expect.anything());
  await userEvent.click(screen.getByRole('button', { name: 'Sí, dona de baixa' }));
  expect(fake.rpc).toHaveBeenCalledWith('admin_remove_member', {
    p_community_id: 'c1',
    p_user_id: 'user-2',
  });
  expect(await screen.findByRole('status')).toHaveTextContent('Veí donat de baixa');
});

test('shows units with balance, next charge, and residents', async () => {
  setup('/communities/c1/units');
  expect(await screen.findByText('1r 1a')).toBeInTheDocument();
  expect(screen.getByText(/-120,50\s€/)).toHaveClass('text-danger');
  expect(screen.getByText(/Proper càrrec: 98,00\s€ el 1 de des\. 2026/)).toBeInTheDocument();
  expect(await screen.findByText('1 veí')).toBeInTheDocument();
  expect(screen.getByText('0 veïns')).toBeInTheDocument();
});

test('creates a unit with a debt and validates the next charge pair', async () => {
  const { fake } = setup('/communities/c1/units');
  await userEvent.click(await screen.findByRole('button', { name: 'Afegir pis' }));
  const form = screen.getByRole('form', { name: 'Afegir pis' });
  await userEvent.type(within(form).getByLabelText('Nom del pis'), 'Àtic');
  const balance = within(form).getByLabelText('Saldo (€)');
  await userEvent.clear(balance);
  await userEvent.type(balance, '-45,5');
  await userEvent.type(within(form).getByLabelText('Data del proper càrrec'), '2026-12-01');
  await userEvent.click(within(form).getByRole('button', { name: 'Desar' }));
  expect(within(form).getByText(/Omple la data i l’import/)).toBeInTheDocument();
  expect(fake.calls.some((call) => call.method === 'insert')).toBe(false);

  await userEvent.type(within(form).getByLabelText('Import del proper càrrec (€)'), '98');
  await userEvent.click(within(form).getByRole('button', { name: 'Desar' }));
  expect(fake.calls.find((call) => call.method === 'insert')?.args[0]).toEqual({
    community_id: 'c1',
    label: 'Àtic',
    balance_cents: -4550,
    next_charge_at: '2026-12-01',
    next_charge_cents: 9800,
  });
});

test('explains why a unit in use cannot be deleted', async () => {
  const inUse = Object.assign(new Error('violates foreign key constraint'), { code: '23503' });
  setup('/communities/c1/units', { tables: { 'units:write': { data: null, error: inUse } } });
  await userEvent.click(await screen.findByRole('button', { name: 'Esborrar 1r 1a' }));
  await userEvent.click(screen.getByRole('button', { name: 'Sí, esborra' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'No es pot esborrar: aquest pis té veïns o rebuts assignats'
  );
});
