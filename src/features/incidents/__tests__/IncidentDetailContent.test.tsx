import { fireEvent, render, screen } from '@testing-library/react-native';

import type { IncidentDetail } from '@/data';
import { mockAppDataSource } from '@/mocks/app-data';

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

test('shows the original damp-wall photo with the local demo incident', async () => {
  const detail = await mockAppDataSource.getIncident('incident-damp-wall');
  await render(<IncidentDetailContent incident={detail} />);
  expect(screen.getByRole('header', { name: 'Humitat a la paret del traster' })).toBeTruthy();
  expect(screen.getByText(detail.description)).toBeTruthy();
  expect(screen.getByLabelText('incidentFlow.photoPreview')).toHaveProp(
    'source',
    detail.photoAsset
  );
});

test('loads a private photo URL and explains an image loading failure', async () => {
  const photoUrl = 'https://example.supabase.co/private/photo.jpg?token=test';
  await render(<IncidentDetailContent incident={{ ...incident, photoUrl }} />);
  const photo = screen.getByLabelText('incidentFlow.photoPreview');
  expect(photo).toHaveProp('source', { uri: photoUrl });
  await fireEvent(photo, 'error', { error: 'Unable to load image' });
  expect(screen.getByRole('alert')).toHaveTextContent('incidentFlow.photoLoadError');
});
