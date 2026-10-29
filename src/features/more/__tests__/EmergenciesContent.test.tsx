import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import * as Linking from 'expo-linking';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';

import { appDataSource } from '@/data';
import { useDataResource } from '@/hooks/use-data-resource';
import ca from '@/i18n/locales/ca.json';
import es from '@/i18n/locales/es.json';

import MoreDestinationScreen from '../../../app/(tabs)/mes/[module]';

let mockDemoMode = false;
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ module: 'emergencies' }),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-linking', () => ({ openURL: jest.fn() }));
jest.mock('lucide-react-native', () => ({ Phone: () => null }));
jest.mock('@/lib/app-config', () => ({
  get isDemoMode() {
    return mockDemoMode;
  },
}));
jest.mock('@/data', () => ({
  appDataSource: { getMoreModule: jest.fn() },
  isMoreModuleKey: jest.requireActual('@/data/types').isMoreModuleKey,
}));
jest.mock('@/hooks/use-data-resource', () => ({ useDataResource: jest.fn() }));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({ primary: '#803EF6', muted: '#7B7487' }),
}));
jest.mock('@/features/auth/ProfileContent', () => ({ ProfileContent: () => null }));
jest.mock('@/features/auth/LanguageContent', () => ({ LanguageContent: () => null }));
jest.mock('../MoreModuleContent', () => ({ MoreModuleContent: () => null }));
jest.mock('@/design-system', () => {
  const { Text } = jest.requireActual('react-native');
  return { EmptyState: ({ subtitle }: { subtitle: string }) => <Text>{subtitle}</Text> };
});

async function renderScreen(language: 'ca' | 'es' = 'ca') {
  const i18n = createInstance();
  await i18n.init({
    lng: language,
    resources: { ca: { translation: ca }, es: { translation: es } },
    interpolation: { escapeValue: false },
  });
  await render(
    <I18nextProvider i18n={i18n}>
      <MoreDestinationScreen />
    </I18nextProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockDemoMode = false;
  jest.mocked(Linking.openURL).mockResolvedValue(true);
});

test.each([
  { language: 'ca' as const, demo: false, messages: ca.more.modules.emergencies },
  { language: 'ca' as const, demo: true, messages: ca.more.modules.emergencies },
  { language: 'es' as const, demo: false, messages: es.more.modules.emergencies },
  { language: 'es' as const, demo: true, messages: es.more.modules.emergencies },
])(
  'shows four local contacts in $language with demo=$demo',
  async ({ language, demo, messages }) => {
    mockDemoMode = demo;
    await renderScreen(language);
    expect(screen.getAllByRole('button')).toHaveLength(4);
    expect(screen.getByText('112')).toBeTruthy();
    expect(screen.getByText('XXXXXXX')).toBeTruthy();
    expect(screen.getAllByText('XXXXXX')).toHaveLength(2);
    expect(screen.getByText(messages.sampleNotice)).toBeTruthy();
    for (const [key, contact] of Object.entries(messages.contacts)) {
      expect(screen.getByText(contact.title)).toBeTruthy();
      const label = messages.call.replace('{{name}}', contact.title);
      const button = screen.getByRole('button', { name: label });
      if (key === 'general') expect(button).toBeEnabled();
      else {
        expect(button).toBeDisabled();
        await userEvent.press(button);
      }
    }
    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(appDataSource.getMoreModule).not.toHaveBeenCalled();
    expect(useDataResource).not.toHaveBeenCalled();
  }
);

test('opens only the configured phone number after pressing its call button', async () => {
  await renderScreen();
  await userEvent.press(screen.getByRole('button', { name: 'Truca a Urgències generals' }));
  expect(Linking.openURL).toHaveBeenCalledWith('tel:112');
  expect(Linking.openURL).toHaveBeenCalledTimes(1);
});

test('shows the number when opening fails and allows retry', async () => {
  jest.mocked(Linking.openURL).mockRejectedValueOnce(new Error('No phone app'));
  await renderScreen();
  await userEvent.press(screen.getByRole('button', { name: 'Truca a Urgències generals' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    ca.more.modules.emergencies.callError.replace('{{number}}', '112')
  );
  await userEvent.press(screen.getByRole('button', { name: 'Truca a Urgències generals' }));
  expect(Linking.openURL).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole('alert')).toBeNull();
});

test('prevents another request while the phone app is opening', async () => {
  let finish: ((value: true) => void) | undefined;
  jest.mocked(Linking.openURL).mockImplementationOnce(
    () =>
      new Promise<true>((resolve) => {
        finish = resolve;
      })
  );
  await renderScreen();
  await userEvent.press(screen.getByRole('button', { name: 'Truca a Urgències generals' }));
  const pendingButton = screen.getByRole('button', { name: 'Truca a Urgències generals' });
  expect(pendingButton).toBeDisabled();
  await userEvent.press(pendingButton);
  expect(Linking.openURL).toHaveBeenCalledTimes(1);
  finish?.(true);
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Truca a Urgències generals' })).toBeEnabled()
  );
});
