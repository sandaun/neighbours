import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';

import { App } from '@/App';
import { makeFakeClient, makeSession } from '@/test/fake-client';
import { makeAuth, renderWithAuth } from '@/test/render-with-auth';

const details = { name: 'Terramar', address_line: 'Carrer del Mar, 14', municipality: 'Sitges' };

function openDetails() {
  const fake = makeFakeClient({ tables: { communities: { data: [details], error: null } } });
  const { auth } = renderWithAuth(
    <App />,
    makeAuth({
      client: fake.client,
      status: 'ready',
      session: makeSession(),
      communities: [{ communityId: 'c1', communityName: 'Terramar', displayName: 'Admin' }],
    }),
    { route: '/communities/c1/details' }
  );
  return { ...fake, auth };
}

test('saves a renamed community and writes a cleared street as null', async () => {
  const fake = openDetails();
  const street = await screen.findByRole('textbox', { name: 'Carrer i número' });
  const name = screen.getByRole('textbox', { name: 'Nom de la comunitat' });
  const city = screen.getByRole('textbox', { name: 'Municipi' });
  const save = screen.getByRole('button', { name: 'Desar' });
  expect(name).toHaveValue(details.name);
  expect(street).toHaveValue(details.address_line);
  expect(city).toHaveValue(details.municipality);
  expect(save).toBeDisabled();

  const user = userEvent.setup();
  await user.clear(name);
  await user.click(save);
  expect(screen.getByText('Aquest camp és obligatori.')).toBeInTheDocument();
  expect(fake.calls.some(({ method }) => method === 'update')).toBe(false);

  const changed = { name: 'Terramar Marítim', address_line: null };
  const edited = { ...details, ...changed };
  fake.setTable('communities:write', { data: [edited], error: null });
  await user.type(name, '  Terramar Marítim  ');
  await user.clear(street);
  await user.click(save);
  expect(await screen.findByText('Dades de la comunitat desades.')).toBeInTheDocument();
  expect(name).toHaveValue(edited.name);
  expect(street).toHaveValue('');
  expect(save).toBeDisabled();
  expect(fake.auth.updateCommunityName).toHaveBeenCalledWith('c1', edited.name);
  expect(fake.calls.slice(-3)).toEqual([
    { table: 'communities', method: 'update', args: [changed] },
    { table: 'communities', method: 'eq', args: ['id', 'c1'] },
    { table: 'communities', method: 'select', args: ['name, address_line, municipality'] },
  ]);
});

test('reports when the database denies the update and preserves the draft', async () => {
  const fake = openDetails();
  fake.setTable('communities:write', { data: [], error: null });
  const city = await screen.findByRole('textbox', { name: 'Municipi' });
  const user = userEvent.setup();
  await user.type(city, ' nou');
  await user.click(screen.getByRole('button', { name: 'Desar' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('No hem pogut desar els canvis');
  expect(city).toHaveValue('Sitges nou');
});
