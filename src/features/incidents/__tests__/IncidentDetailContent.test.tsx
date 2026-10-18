import { render, screen } from '@testing-library/react-native';

import type { IncidentDetail } from '@/data';

import { IncidentDetailContent } from '../IncidentDetailContent';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { resolvedLanguage: 'ca' } }),
}));
jest.mock('expo-image', () => ({ Image: 'Image' }));

const incident: IncidentDetail = {
  id: '1',
  title: 'Leak in garage',
  location: 'Garage',
  description: 'The pipe near the door is leaking.',
  category: 'plumbing',
  reportedAt: '2026-10-18T10:00:00Z',
  status: 'resolved',
  updates: [
    {
      id: 'update',
      authorName: 'Building manager',
      createdAt: '2026-10-18T11:00:00Z',
      body: 'The plumber replaced the pipe.',
      status: 'resolved',
    },
  ],
};

test('shows the incident description and administrator history', async () => {
  await render(<IncidentDetailContent incident={incident} />);
  expect(screen.getByRole('header', { name: incident.title })).toBeTruthy();
  expect(screen.getByText(incident.description)).toBeTruthy();
  expect(screen.getByText('Building manager')).toBeTruthy();
  expect(screen.getByText('The plumber replaced the pipe.')).toBeTruthy();
  expect(screen.getAllByText('incidents.status.resolved')).toHaveLength(2);
});

test('explains when a received incident has no updates yet', async () => {
  await render(
    <IncidentDetailContent incident={{ ...incident, status: 'received', updates: [] }} />
  );
  expect(screen.getByText('incidentFlow.noUpdates')).toBeTruthy();
  expect(screen.queryByText('Building manager')).toBeNull();
});
