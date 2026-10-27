import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { PdfButton } from '../PdfButton';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));
jest.mock('@/design-system', () => ({
  Button: jest.requireActual('@/design-system/Button').Button,
}));

const signedUrl =
  'https://example.supabase.co/storage/v1/object/sign/private/file.pdf?token=short-lived';
const originalPlatform = Platform.OS;
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const mockOpenWindow = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = 'ios';
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { open: mockOpenWindow },
  });
});

afterEach(() => {
  Platform.OS = originalPlatform;
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else Reflect.deleteProperty(globalThis, 'window');
});

test('opens the resolved private URL in the native browser', async () => {
  const getUrl = jest.fn().mockResolvedValue(signedUrl);
  await render(<PdfButton getUrl={getUrl} />);
  await userEvent.press(screen.getByRole('button', { name: 'documents.openPdf' }));
  await waitFor(() => expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(signedUrl));
  expect(getUrl).toHaveBeenCalledTimes(1);
  expect(mockOpenWindow).not.toHaveBeenCalled();
});

test('shows a native browser error and allows another attempt', async () => {
  jest.mocked(WebBrowser.openBrowserAsync).mockRejectedValueOnce(new Error('Browser unavailable'));
  const getUrl = jest.fn().mockResolvedValue(signedUrl);
  await render(<PdfButton getUrl={getUrl} />);
  await userEvent.press(screen.getByRole('button', { name: 'documents.openPdf' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('documents.openError');
  await userEvent.press(screen.getByRole('button', { name: 'documents.openPdf' }));
  await waitFor(() => expect(WebBrowser.openBrowserAsync).toHaveBeenCalledTimes(2));
  expect(screen.queryByRole('alert')).toBeNull();
});

test('keeps unavailable documents disabled without a URL request', async () => {
  const getUrl = jest.fn();
  await render(<PdfButton getUrl={getUrl} available={false} />);
  const button = screen.getByRole('button', { name: 'documents.openPdf' });
  expect(button).toBeDisabled();
  await userEvent.press(button);
  expect(getUrl).not.toHaveBeenCalled();
  expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
  expect(screen.getByText('documents.noFile')).toBeTruthy();
});

test('does not request another URL while the first request is pending', async () => {
  let resolve: ((value: string) => void) | undefined;
  const getUrl = jest.fn(
    () =>
      new Promise<string>((finish) => {
        resolve = finish;
      })
  );
  await render(<PdfButton getUrl={getUrl} />);
  await userEvent.press(screen.getByRole('button', { name: 'documents.openPdf' }));
  await waitFor(() => expect(getUrl).toHaveBeenCalledTimes(1));
  const pendingButton = screen.getByRole('button');
  expect(pendingButton).toBeDisabled();
  await userEvent.press(pendingButton);
  expect(getUrl).toHaveBeenCalledTimes(1);
  resolve?.(signedUrl);
  await waitFor(() => expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(signedUrl));
});

test('reserves a web tab before requesting its signed URL and removes opener', async () => {
  Platform.OS = 'web';
  const popup = { opener: {}, location: { href: 'about:blank' }, close: jest.fn() };
  mockOpenWindow.mockReturnValue(popup);
  const getUrl = jest.fn(async () => {
    expect(mockOpenWindow).toHaveBeenCalledWith('about:blank', '_blank');
    expect(popup.opener).toBeNull();
    return signedUrl;
  });
  await render(<PdfButton getUrl={getUrl} />);
  await userEvent.press(screen.getByRole('button', { name: 'documents.openPdf' }));
  await waitFor(() => expect(popup.location.href).toBe(signedUrl));
  expect(popup.close).not.toHaveBeenCalled();
  expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
});

test('closes the reserved web tab when the signed URL request fails', async () => {
  Platform.OS = 'web';
  const popup = { opener: {}, location: { href: 'about:blank' }, close: jest.fn() };
  mockOpenWindow.mockReturnValue(popup);
  await render(<PdfButton getUrl={jest.fn().mockRejectedValue(new Error('No access'))} />);
  await userEvent.press(screen.getByRole('button', { name: 'documents.openPdf' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('documents.openError');
  expect(popup.close).toHaveBeenCalledTimes(1);
  expect(popup.location.href).toBe('about:blank');
});

test('reports blocked popups without requesting a private URL', async () => {
  Platform.OS = 'web';
  mockOpenWindow.mockReturnValue(null);
  const getUrl = jest.fn();
  await render(<PdfButton getUrl={getUrl} />);
  await userEvent.press(screen.getByRole('button', { name: 'documents.openPdf' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('documents.openError');
  expect(getUrl).not.toHaveBeenCalled();
});

test('rejects a URL with an unsupported protocol before opening it', async () => {
  await render(<PdfButton getUrl={async () => 'javascript:alert(1)'} />);
  await userEvent.press(screen.getByRole('button', { name: 'documents.openPdf' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('documents.openError');
  expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
});

test('recovers when the browser throws while reserving a web window', async () => {
  Platform.OS = 'web';
  mockOpenWindow.mockImplementationOnce(() => {
    throw new Error('SecurityError');
  });
  const getUrl = jest.fn().mockResolvedValue(signedUrl);
  await render(<PdfButton getUrl={getUrl} />);
  await userEvent.press(screen.getByRole('button', { name: 'documents.openPdf' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('documents.openError');
  expect(getUrl).not.toHaveBeenCalled();
  const popup = { opener: {}, location: { href: 'about:blank' }, close: jest.fn() };
  mockOpenWindow.mockReturnValueOnce(popup);
  await userEvent.press(screen.getByRole('button', { name: 'documents.openPdf' }));
  await waitFor(() => expect(popup.location.href).toBe(signedUrl));
  expect(screen.queryByRole('alert')).toBeNull();
});

test('does not launch a native browser after leaving the screen', async () => {
  let resolve: ((value: string) => void) | undefined;
  const request = new Promise<string>((finish) => {
    resolve = finish;
  });
  const getUrl = jest.fn(() => request);
  const { unmount } = await render(<PdfButton getUrl={getUrl} />);
  await userEvent.press(screen.getByRole('button', { name: 'documents.openPdf' }));
  await waitFor(() => expect(getUrl).toHaveBeenCalledTimes(1));
  await unmount();
  resolve?.(signedUrl);
  await request;
  expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
});

test('closes its reserved web window after leaving the screen', async () => {
  Platform.OS = 'web';
  const popup = { opener: {}, location: { href: 'about:blank' }, close: jest.fn() };
  mockOpenWindow.mockReturnValueOnce(popup);
  let resolve: ((value: string) => void) | undefined;
  const request = new Promise<string>((finish) => {
    resolve = finish;
  });
  const getUrl = jest.fn(() => request);
  const { unmount } = await render(<PdfButton getUrl={getUrl} />);
  await userEvent.press(screen.getByRole('button', { name: 'documents.openPdf' }));
  await unmount();
  resolve?.(signedUrl);
  await request;
  expect(popup.close).toHaveBeenCalledTimes(1);
  expect(popup.location.href).toBe('about:blank');
});
