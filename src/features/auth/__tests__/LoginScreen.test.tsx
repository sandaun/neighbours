import { fireEvent, render, screen } from '@testing-library/react-native';

import LoginScreen from '@/app/login';
import { useAuth } from '@/features/auth/AuthProvider';

jest.mock('lucide-react-native', () => ({
  KeyRound: () => null,
  Mail: () => null,
  ShieldCheck: () => null,
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

const sendCode = jest.fn();
const verifyCode = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  sendCode.mockResolvedValue(undefined);
  verifyCode.mockResolvedValue(undefined);
  jest.mocked(useAuth).mockReturnValue({
    session: null,
    membership: null,
    status: 'signed-out',
    error: null,
    retry: jest.fn(),
    signOut: jest.fn(),
    sendCode,
    verifyCode,
  });
});

test('requests an invitation code and verifies it with the same email', async () => {
  await render(<LoginScreen />);
  expect(
    screen.getByRole('button', { name: 'auth.sendCode' }).props.accessibilityState.disabled
  ).toBe(true);
  await fireEvent.changeText(screen.getByLabelText('auth.email'), '  Neighbour@Example.com ');
  await fireEvent.press(screen.getByRole('button', { name: 'auth.sendCode' }));
  expect(sendCode).toHaveBeenCalledWith('neighbour@example.com');
  expect(screen.getByRole('header', { name: 'auth.codeTitle' })).toBeTruthy();
  expect(screen.queryByLabelText('auth.email')).toBeNull();
  await fireEvent.changeText(screen.getByLabelText('auth.code'), '12345678');
  await fireEvent.press(screen.getByRole('button', { name: 'auth.verify' }));
  expect(verifyCode).toHaveBeenCalledWith('neighbour@example.com', '12345678');
});

test('keeps the code form after a verification error and allows changing email', async () => {
  verifyCode.mockRejectedValueOnce(new Error('Expired OTP'));
  await render(<LoginScreen />);
  await fireEvent.changeText(screen.getByLabelText('auth.email'), 'resident@example.com');
  await fireEvent.press(screen.getByRole('button', { name: 'auth.sendCode' }));
  await fireEvent.changeText(screen.getByLabelText('auth.code'), '123456');
  await fireEvent.press(screen.getByRole('button', { name: 'auth.verify' }));
  expect(screen.getByRole('alert').props.children).toBe('auth.invalidCode');
  expect(screen.getByLabelText('auth.code')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'auth.changeEmail' }));
  expect(screen.getByLabelText('auth.email').props.value).toBe('resident@example.com');
  expect(screen.queryByLabelText('auth.code')).toBeNull();
  expect(screen.queryByRole('alert')).toBeNull();
});
