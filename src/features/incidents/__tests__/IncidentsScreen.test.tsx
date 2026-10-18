import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import type { Incident } from '@/data/types';

import IncidentsScreen from '../../../app/(tabs)/incidencies';

const mockReload = jest.fn();
const mockIncidents: Incident[] = [
  {
    id: '1',
    title: 'Received leak',
    location: 'Garage',
    reportedAt: '2026-10-18',
    status: 'received',
  },
  {
    id: '2',
    title: 'Working on lights',
    location: 'Hall',
    reportedAt: '2026-10-18',
    status: 'in-progress',
  },
  {
    id: '3',
    title: 'Fixed elevator',
    location: 'Hall',
    reportedAt: '2026-10-18',
    status: 'resolved',
  },
];
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('lucide-react-native', () => ({ Plus: () => null }));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({ primary: '#803EF6', onPrimary: '#FFFFFF' }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 34, left: 0 }),
}));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('@/data', () => ({ appDataSource: { getIncidents: jest.fn() } }));
jest.mock('@/hooks/use-data-resource', () => ({
  useDataResource: () => ({
    status: 'success',
    data: mockIncidents,
    refreshing: false,
    reload: mockReload,
  }),
}));
jest.mock('@/design-system', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    Button: jest.requireActual('@/design-system/Button').Button,
    Chip: jest.requireActual('@/design-system/Chip').Chip,
    ScreenHeader: () => null,
    SectionHeader: () => null,
    EmptyState: ({ title }: { title: string }) => <Text>{title}</Text>,
    LoadingState: () => null,
    ErrorState: () => null,
  };
});
jest.mock('../IncidentCard', () => {
  const { Text } = jest.requireActual('react-native');
  return { IncidentCard: ({ incident }: { incident: Incident }) => <Text>{incident.title}</Text> };
});

test('filters displayed incidents by selected status and returns to all', async () => {
  await render(<IncidentsScreen />);
  expect(screen.getByText('Received leak')).toBeTruthy();
  expect(screen.getByText('Fixed elevator')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'incidents.status.resolved' }));
  expect(screen.getByText('Fixed elevator')).toBeTruthy();
  expect(screen.queryByText('Received leak')).toBeNull();
  expect(screen.queryByText('Working on lights')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'incidents.filters.all' }));
  expect(screen.getByText('Received leak')).toBeTruthy();
  expect(screen.getByText('Working on lights')).toBeTruthy();
});

test('opens incident creation from the accessible floating action', async () => {
  await render(<IncidentsScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'incidentFlow.create' }));
  expect(router.push).toHaveBeenCalledWith('/incidents/new');
});
