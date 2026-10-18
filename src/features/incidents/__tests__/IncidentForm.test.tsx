import * as ImagePicker from 'expo-image-picker';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { IncidentDetail } from '@/data';

import { IncidentForm } from '../IncidentForm';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { resolvedLanguage: 'ca' } }),
}));
jest.mock('@/hooks/use-theme', () => ({ useTheme: () => ({ muted: 'gray', primary: 'purple' }) }));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('expo-image', () => ({ Image: 'Image' }));

const incident: IncidentDetail = {
  id: 'new-incident',
  title: 'Water leak',
  location: 'Garage',
  description: 'Water is leaking from the pipe',
  category: 'plumbing',
  status: 'received',
  reportedAt: '2026-10-18T10:00:00Z',
  updates: [],
};

async function fillForm() {
  await fireEvent.changeText(screen.getByLabelText('incidentFlow.fields.title'), ' Water leak ');
  await fireEvent.changeText(screen.getByLabelText('incidentFlow.fields.location'), ' Garage ');
  await fireEvent.changeText(
    screen.getByLabelText('incidentFlow.fields.description'),
    ' Water is leaking from the pipe '
  );
  await fireEvent.press(screen.getByRole('button', { name: 'incidentFlow.categories.plumbing' }));
}

describe('IncidentForm', () => {
  test('keeps invalid input local and explains all required fields', async () => {
    const onSubmit = jest.fn();
    await render(<IncidentForm onSubmit={onSubmit} onCreated={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: 'incidentFlow.submit' }));
    expect(await screen.findByText('incidentFlow.validation.title')).toBeTruthy();
    expect(screen.getByText('incidentFlow.validation.location')).toBeTruthy();
    expect(screen.getByText('incidentFlow.validation.description')).toBeTruthy();
    expect(screen.getByText('incidentFlow.validation.category')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('submits trimmed fields once while the request is pending', async () => {
    let finish: ((value: IncidentDetail) => void) | undefined;
    const onSubmit = jest.fn(
      () =>
        new Promise<IncidentDetail>((resolve) => {
          finish = resolve;
        })
    );
    const onCreated = jest.fn();
    await render(<IncidentForm onSubmit={onSubmit} onCreated={onCreated} />);
    await fillForm();
    const submit = screen.getByRole('button', { name: 'incidentFlow.submit' });
    await fireEvent.press(submit);
    await fireEvent.press(submit);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      title: incident.title,
      location: incident.location,
      description: incident.description,
      category: 'plumbing',
    });
    finish?.(incident);
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(incident));
  });

  test('preserves input after failure so it can be retried', async () => {
    const onSubmit = jest
      .fn()
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce(incident);
    const onCreated = jest.fn();
    await render(<IncidentForm onSubmit={onSubmit} onCreated={onCreated} />);
    await fillForm();
    await fireEvent.press(screen.getByRole('button', { name: 'incidentFlow.submit' }));
    expect(await screen.findByText('incidentFlow.submitError')).toBeTruthy();
    expect(screen.getByLabelText('incidentFlow.fields.title').props.value).toBe(' Water leak ');
    await fireEvent.press(screen.getByRole('button', { name: 'incidentFlow.submit' }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(incident));
  });

  test('attaches the selected photo to a single creation request', async () => {
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: 'file:///photo.jpg',
          width: 100,
          height: 100,
          base64: '/9j/AAAA',
          mimeType: 'image/jpeg',
        },
      ],
    });
    const onSubmit = jest.fn().mockResolvedValueOnce({ ...incident, photoUploadFailed: true });
    const onCreated = jest.fn();
    await render(<IncidentForm onSubmit={onSubmit} onCreated={onCreated} />);
    await fillForm();
    await fireEvent.press(screen.getByRole('button', { name: 'incidentFlow.addPhoto' }));
    expect(await screen.findByRole('button', { name: 'incidentFlow.removePhoto' })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'incidentFlow.submit' }));
    await waitFor(() =>
      expect(onCreated).toHaveBeenCalledWith({ ...incident, photoUploadFailed: true })
    );
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].photo).toEqual({ base64: '/9j/AAAA', mimeType: 'image/jpeg' });
  });
});
