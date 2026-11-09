import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';

import { LoginScreen } from './LoginScreen';
import { makeAuth, renderWithAuth } from '@/test/render-with-auth';
import { chooseOption } from '@/test/select';

test('enables sign-in only with a valid email and a password', async () => {
  renderWithAuth(<LoginScreen />);
  const submit = screen.getByRole('button', { name: 'Entrar' });
  expect(submit).toBeDisabled();
  await userEvent.type(screen.getByLabelText('Correu electrònic'), 'not-an-email');
  await userEvent.type(screen.getByLabelText('Contrasenya'), 'secret');
  expect(submit).toBeDisabled();
  await userEvent.clear(screen.getByLabelText('Correu electrònic'));
  await userEvent.type(screen.getByLabelText('Correu electrònic'), 'admin@example.com');
  expect(submit).toBeEnabled();
});

test('signs in with the entered credentials', async () => {
  const { auth } = renderWithAuth(<LoginScreen />);
  await userEvent.type(screen.getByLabelText('Correu electrònic'), 'admin@example.com');
  await userEvent.type(screen.getByLabelText('Contrasenya'), 'secret{Enter}');
  expect(auth.signIn).toHaveBeenCalledWith('admin@example.com', 'secret');
});

test('shows a generic error when sign-in fails', async () => {
  const auth = makeAuth({
    signIn: async () => {
      throw new Error('invalid_credentials');
    },
  });
  renderWithAuth(<LoginScreen />, auth);
  await userEvent.type(screen.getByLabelText('Correu electrònic'), 'admin@example.com');
  await userEvent.type(screen.getByLabelText('Contrasenya'), 'wrong');
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('No hem pogut iniciar la sessió');
});

test('toggles password visibility', async () => {
  renderWithAuth(<LoginScreen />);
  const password = screen.getByLabelText('Contrasenya');
  expect(password).toHaveAttribute('type', 'password');
  await userEvent.click(screen.getByRole('button', { name: 'Mostra la contrasenya' }));
  expect(password).toHaveAttribute('type', 'text');
});

test('switches the interface to Spanish', async () => {
  renderWithAuth(<LoginScreen />);
  await chooseOption(screen.getByRole('combobox', { name: 'Idioma' }), 'Castellà');
  expect(screen.getByRole('heading', { name: 'Gestiona tus comunidades' })).toBeInTheDocument();
});
