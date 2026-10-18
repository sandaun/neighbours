import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Button, Text, View } from 'react-native';

import { useDataResource } from '../use-data-resource';

let mockFocused = true;

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => (() => void) | void) => {
    const { useEffect } = jest.requireActual('react');
    const focused = mockFocused;
    useEffect(() => (focused ? callback() : undefined), [callback, focused]);
  },
}));

beforeEach(() => {
  mockFocused = true;
});

function ResourceHarness({ load }: { load: () => Promise<string> }) {
  const resource = useDataResource(load);
  return (
    <View>
      <Text testID="status">{resource.status}</Text>
      <Text testID="value">{resource.data ?? 'No data'}</Text>
      <Text testID="error">{resource.error?.message ?? 'No error'}</Text>
      <Text testID="refreshing">{resource.refreshing ? 'Refreshing' : 'Idle'}</Text>
      <Button title="Reload" onPress={resource.reload} />
    </View>
  );
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((finish, fail) => {
    resolve = finish;
    reject = fail;
  });
  return { promise, resolve, reject };
}

test('keeps content visible and refreshes silently when returning to the screen', async () => {
  const refresh = deferred<string>();
  const load = jest
    .fn()
    .mockResolvedValueOnce('Existing data')
    .mockReturnValueOnce(refresh.promise);
  const { rerender } = await render(<ResourceHarness load={load} />);
  await waitFor(() => expect(screen.getByTestId('value')).toHaveTextContent('Existing data'));

  mockFocused = false;
  await rerender(<ResourceHarness load={load} />);
  mockFocused = true;
  await rerender(<ResourceHarness load={load} />);
  await waitFor(() => expect(load).toHaveBeenCalledTimes(2));

  expect(screen.getByTestId('status')).toHaveTextContent('success');
  expect(screen.getByTestId('value')).toHaveTextContent('Existing data');
  expect(screen.getByTestId('refreshing')).toHaveTextContent('Idle');
  refresh.resolve('Updated data');
  await waitFor(() => expect(screen.getByTestId('value')).toHaveTextContent('Updated data'));
});

test('shows the refresh indicator only for a manual refresh without clearing content', async () => {
  const initial = deferred<string>();
  const refresh = deferred<string>();
  const load = jest.fn().mockReturnValueOnce(initial.promise).mockReturnValueOnce(refresh.promise);
  await render(<ResourceHarness load={load} />);
  await waitFor(() => expect(load).toHaveBeenCalledTimes(1));
  expect(screen.getByTestId('refreshing')).toHaveTextContent('Idle');
  initial.resolve('Existing data');
  await waitFor(() => expect(screen.getByTestId('value')).toHaveTextContent('Existing data'));
  await fireEvent.press(screen.getByRole('button', { name: 'Reload' }));
  expect(screen.getByTestId('refreshing')).toHaveTextContent('Refreshing');
  expect(screen.getByTestId('value')).toHaveTextContent('Existing data');
  refresh.resolve('Updated data');
  await waitFor(() => expect(screen.getByTestId('refreshing')).toHaveTextContent('Idle'));
});

test('clears previous content when the requested resource changes', async () => {
  const next = deferred<string>();
  const firstLoad = jest.fn().mockResolvedValue('First incident');
  const secondLoad = jest.fn(() => next.promise);
  const { rerender } = await render(<ResourceHarness load={firstLoad} />);
  await waitFor(() => expect(screen.getByTestId('value')).toHaveTextContent('First incident'));
  await rerender(<ResourceHarness load={secondLoad} />);
  expect(screen.getByTestId('status')).toHaveTextContent('loading');
  expect(screen.getByTestId('value')).toHaveTextContent('No data');
  next.resolve('Second incident');
  await waitFor(() => expect(screen.getByTestId('value')).toHaveTextContent('Second incident'));
});

test('uses the latest response when overlapping reloads finish out of order', async () => {
  const oldRequest = deferred<string>();
  const latestRequest = deferred<string>();
  const load = jest
    .fn()
    .mockReturnValueOnce(oldRequest.promise)
    .mockReturnValueOnce(latestRequest.promise);
  await render(<ResourceHarness load={load} />);
  await waitFor(() => expect(load).toHaveBeenCalledTimes(1));
  await fireEvent.press(screen.getByRole('button', { name: 'Reload' }));
  await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
  latestRequest.resolve('Newest data');
  await waitFor(() => expect(screen.getByTestId('value')).toHaveTextContent('Newest data'));
  oldRequest.resolve('Stale data');
  await waitFor(() => expect(screen.getByTestId('refreshing')).toHaveTextContent('Idle'));
  expect(screen.getByTestId('value')).toHaveTextContent('Newest data');
  expect(screen.getByTestId('status')).toHaveTextContent('success');
});

test('ignores stale errors while a newer request is still refreshing', async () => {
  const oldRequest = deferred<string>();
  const latestRequest = deferred<string>();
  const load = jest
    .fn()
    .mockReturnValueOnce(oldRequest.promise)
    .mockReturnValueOnce(latestRequest.promise);
  await render(<ResourceHarness load={load} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Reload' }));
  await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
  oldRequest.reject(new Error('Stale failure'));
  await waitFor(() => expect(screen.getByTestId('refreshing')).toHaveTextContent('Refreshing'));
  expect(screen.getByTestId('error')).toHaveTextContent('No error');
  latestRequest.resolve('Latest success');
  await waitFor(() => expect(screen.getByTestId('value')).toHaveTextContent('Latest success'));
});

test('invalidates the previous focus request after the loader changes', async () => {
  const oldRequest = deferred<string>();
  const newRequest = deferred<string>();
  const firstLoad = jest.fn(() => oldRequest.promise);
  const secondLoad = jest.fn(() => newRequest.promise);
  const { rerender } = await render(<ResourceHarness load={firstLoad} />);
  await waitFor(() => expect(firstLoad).toHaveBeenCalledTimes(1));
  await rerender(<ResourceHarness load={secondLoad} />);
  await waitFor(() => expect(secondLoad).toHaveBeenCalledTimes(1));
  newRequest.resolve('Second focus data');
  await waitFor(() => expect(screen.getByTestId('value')).toHaveTextContent('Second focus data'));
  oldRequest.reject(new Error('Old focus failure'));
  await waitFor(() => expect(screen.getByTestId('refreshing')).toHaveTextContent('Idle'));
  expect(screen.getByTestId('value')).toHaveTextContent('Second focus data');
  expect(screen.getByTestId('error')).toHaveTextContent('No error');
});

test('normalizes thrown values and recovers through retry', async () => {
  const load = jest
    .fn()
    .mockImplementationOnce(() => {
      throw 'Offline';
    })
    .mockResolvedValueOnce('Recovered data');
  await render(<ResourceHarness load={load} />);
  await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('error'));
  expect(screen.getByTestId('error')).toHaveTextContent('Unable to load data');
  await fireEvent.press(screen.getByRole('button', { name: 'Reload' }));
  await waitFor(() => expect(screen.getByTestId('value')).toHaveTextContent('Recovered data'));
  expect(screen.getByTestId('error')).toHaveTextContent('No error');
});
