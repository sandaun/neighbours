import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import LoginScreen from '@/app/login';
import { useAuth } from '@/features/auth/AuthProvider';

jest.mock('lucide-react-native', () => ({
  Eye: () => null,
  EyeOff: () => null,
}));
jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({ primary: '#803EF6', muted: '#7B7487' }),
}));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('expo-router', () => ({ useFocusEffect: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const signIn = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  signIn.mockResolvedValue(undefined);
  jest.mocked(useAuth).mockReturnValue({
    session: null,
    membership: null,
    status: 'signed-out',
    error: null,
    retry: jest.fn(),
    signOut: jest.fn(),
    signIn,
  });
});

test('requires a valid email and password, then submits both without trimming the password', async () => {
  await render(<LoginScreen />);
  expect(
    screen.getByRole('button', { name: 'auth.signIn' }).props.accessibilityState.disabled
  ).toBe(true);
  await fireEvent.changeText(screen.getByLabelText('auth.email'), '  Neighbour@Example.com ');
  expect(
    screen.getByRole('button', { name: 'auth.signIn' }).props.accessibilityState.disabled
  ).toBe(true);
  await fireEvent.changeText(screen.getByLabelText('auth.password'), ' Test password ');
  await fireEvent.press(screen.getByRole('button', { name: 'auth.signIn' }));
  expect(signIn).toHaveBeenCalledWith('neighbour@example.com', ' Test password ');
});

test('keeps the form after a sign-in error and allows retry', async () => {
  signIn.mockRejectedValueOnce(new Error('Invalid credentials'));
  await render(<LoginScreen />);
  await fireEvent.changeText(screen.getByLabelText('auth.email'), 'resident@example.com');
  await fireEvent.changeText(screen.getByLabelText('auth.password'), 'Wrong password');
  await fireEvent.press(screen.getByRole('button', { name: 'auth.signIn' }));
  expect(screen.getByRole('alert').props.children).toBe('auth.signInError');
  expect(screen.getByLabelText('auth.email').props.value).toBe('resident@example.com');
  await fireEvent.changeText(screen.getByLabelText('auth.password'), 'Correct password');
  await fireEvent.press(screen.getByRole('button', { name: 'auth.signIn' }));
  expect(signIn).toHaveBeenLastCalledWith('resident@example.com', 'Correct password');
  expect(screen.queryByRole('alert')).toBeNull();
});

test('conceals the password by default and supports showing and hiding it', async () => {
  await render(<LoginScreen />);
  expect(screen.getByLabelText('auth.password').props.secureTextEntry).toBe(true);
  await fireEvent.press(screen.getByRole('button', { name: 'auth.showPassword' }));
  expect(screen.getByLabelText('auth.password').props.secureTextEntry).toBe(false);
  await fireEvent.press(screen.getByRole('button', { name: 'auth.hidePassword' }));
  expect(screen.getByLabelText('auth.password').props.secureTextEntry).toBe(true);
});

test('rejects keyboard submission with an invalid email', async () => {
  await render(<LoginScreen />);
  await fireEvent.changeText(screen.getByLabelText('auth.email'), 'invalid');
  await fireEvent.changeText(screen.getByLabelText('auth.password'), 'Test password');
  await fireEvent(screen.getByLabelText('auth.password'), 'submitEditing');
  expect(signIn).not.toHaveBeenCalled();
});

test('prevents duplicate submissions while sign-in is pending', async () => {
  let finish!: () => void;
  signIn.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      })
  );
  await render(<LoginScreen />);
  await fireEvent.changeText(screen.getByLabelText('auth.email'), 'resident@example.com');
  await fireEvent.changeText(screen.getByLabelText('auth.password'), 'Test password');
  await fireEvent.press(screen.getByRole('button', { name: 'auth.signIn' }));
  await fireEvent(screen.getByLabelText('auth.password'), 'submitEditing');
  expect(signIn).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('auth.password').props.editable).toBe(false);
  finish();
  await waitFor(() => expect(screen.getByLabelText('auth.password').props.editable).toBe(true));
});
