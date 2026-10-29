import { fireEvent, render, screen } from '@testing-library/react-native';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';

import { appDataSource } from '@/data';
import { useDataResource } from '@/hooks/use-data-resource';
import ca from '@/i18n/locales/ca.json';
import es from '@/i18n/locales/es.json';

import MoreDestinationScreen from '../../../app/(tabs)/mes/[module]';

let mockDemoMode = false;
jest.mock('expo-router', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    Stack: {
      Screen: ({ options }: { options: { title: string } }) => (
        <Text accessibilityRole="header">{options.title}</Text>
      ),
    },
    useLocalSearchParams: () => ({ module: 'voting' }),
  };
});
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
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
jest.mock('@/features/auth/ProfileContent', () => ({ ProfileContent: () => null }));
jest.mock('@/features/auth/LanguageContent', () => ({ LanguageContent: () => null }));
jest.mock('../EmergenciesContent', () => ({ EmergenciesContent: () => null }));
jest.mock('../MoreModuleContent', () => ({ MoreModuleContent: () => null }));
jest.mock('@/design-system', () => {
  const { Text } = jest.requireActual('react-native');
  return { EmptyState: ({ subtitle }: { subtitle: string }) => <Text>{subtitle}</Text> };
});

async function renderVoting(language: 'ca' | 'es' = 'ca') {
  const i18n = createInstance();
  await i18n.init({
    lng: language,
    resources: { ca: { translation: ca }, es: { translation: es } },
    interpolation: { escapeValue: false },
  });
  return render(
    <I18nextProvider i18n={i18n}>
      <MoreDestinationScreen />
    </I18nextProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockDemoMode = false;
});

test.each([
  { language: 'ca' as const, demo: false, messages: ca.more.modules.voting },
  { language: 'ca' as const, demo: true, messages: ca.more.modules.voting },
  { language: 'es' as const, demo: false, messages: es.more.modules.voting },
  { language: 'es' as const, demo: true, messages: es.more.modules.voting },
])(
  'shows an identified voting preview in $language with demo=$demo',
  async ({ language, demo, messages }) => {
    mockDemoMode = demo;
    await renderVoting(language);
    const destination =
      language === 'ca' ? ca.more.destinations.voting : es.more.destinations.voting;
    expect(screen.getByRole('header', { name: destination })).toBeTruthy();
    expect(screen.getByRole('header', { name: messages.meeting })).toBeTruthy();
    expect(screen.getByText(language === 'ca' ? '18 de novembre' : '18 de noviembre')).toBeTruthy();
    expect(screen.getByRole('header', { name: messages.question })).toBeTruthy();
    expect(screen.getByText(/18.*2026/)).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: messages.choices.for })).toHaveProp(
      'accessibilityValue',
      { min: 0, max: 100, now: 68 }
    );
    expect(screen.getByRole('progressbar', { name: messages.choices.against })).toHaveProp(
      'accessibilityValue',
      { min: 0, max: 100, now: 32 }
    );
    expect(screen.getByRole('button', { name: messages.voteFor })).toBeEnabled();
    expect(screen.getByRole('button', { name: messages.voteAgainst })).toBeEnabled();
    expect(appDataSource.getMoreModule).not.toHaveBeenCalled();
    expect(useDataResource).not.toHaveBeenCalled();
  }
);

test('counts only one local vote, allows changing it, and restores the original results', async () => {
  await renderVoting();
  await fireEvent.press(screen.getByRole('button', { name: 'Vota a favor' }));
  expect(screen.getByRole('button', { name: 'Vota a favor', selected: true })).toBeTruthy();
  expect(screen.getByText('69%')).toBeTruthy();
  expect(screen.getByText('31%')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Tria representant' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Vota a favor' }));
  expect(screen.getByText('69%')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Vota en contra' }));
  expect(screen.getByText('65%')).toBeTruthy();
  expect(screen.getByText('35%')).toBeTruthy();
  expect(screen.getByText('Vot de mostra: En contra.')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Retira el vot de mostra' }));
  expect(screen.getByText('68%')).toBeTruthy();
  expect(screen.getByText('32%')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Tria representant' })).toBeEnabled();
});

test('chooses, changes and removes a delegate while preventing a simultaneous direct vote', async () => {
  await renderVoting();
  await fireEvent.press(screen.getByRole('button', { name: 'Tria representant' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Delega a Marta Puig' }));
  expect(screen.getByText('Marta Puig')).toBeTruthy();
  expect(screen.getByText('3r 1a')).toBeTruthy();
  expect(screen.getByText(/Coeficient: 4,2/)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Vota a favor' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Vota en contra' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Vota a favor' }));
  expect(screen.getByText('68%')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Canvia' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Cancel·la' }));
  expect(screen.getByText('Marta Puig')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Canvia' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Delega a Sara Martí' }));
  expect(screen.getByText('Sara Martí')).toBeTruthy();
  expect(screen.queryByText('Marta Puig')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Elimina' }));
  expect(screen.queryByText('Sara Martí')).toBeNull();
  expect(screen.getByRole('button', { name: 'Vota a favor' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Vota en contra' })).toBeEnabled();
});

test('does not persist the demonstration choice after the screen remounts', async () => {
  const { unmount } = await renderVoting();
  await fireEvent.press(screen.getByRole('button', { name: 'Vota a favor' }));
  expect(screen.getByText('69%')).toBeTruthy();
  await unmount();
  await renderVoting();
  expect(screen.getByText('68%')).toBeTruthy();
  expect(screen.queryByText('69%')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Retira el vot de mostra' })).toBeNull();
});
