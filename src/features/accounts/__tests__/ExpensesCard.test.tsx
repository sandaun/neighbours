import { fireEvent, render, screen } from '@testing-library/react-native';
import { createInstance } from 'i18next';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import type { AccountsData } from '@/data/types';
import ca from '@/i18n/locales/ca.json';
import es from '@/i18n/locales/es.json';
import { formatCurrency } from '@/utils/formatters';

import AccountsScreen from '../../../app/(tabs)/comptes';

let mockStatus: 'success' | 'loading' | 'error' = 'success';
const mockAccounts: AccountsData = {
  balanceCents: 12345,
  nextChargeAt: '2026-11-01',
  nextChargeCents: 7850,
  receipts: [
    {
      id: 'live-receipt',
      concept: 'Real community receipt',
      amountCents: 7850,
      issuedAt: '2026-10-01',
      period: 'October 2026',
      status: 'paid',
      hasFile: false,
    },
  ],
};

jest.mock('lucide-react-native', () => ({
  CheckCircle2: () => null,
  Clock3: () => null,
  Wallet: () => null,
}));
jest.mock('@/data', () => ({
  appDataSource: { getAccounts: jest.fn(), getReceiptUrl: jest.fn() },
}));
jest.mock('@/hooks/use-data-resource', () => ({
  useDataResource: () => ({
    status: mockStatus,
    data: mockAccounts,
    refreshing: false,
    reload: jest.fn(),
  }),
}));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    primary: '#803EF6',
    secondary: '#50E3C2',
    highlight: '#D2BCFF',
    warning: '#FFBA00',
    muted: '#7B7487',
    outline: '#CCC3D8',
  }),
}));
jest.mock('@/features/documents/PdfButton', () => ({ PdfButton: () => null }));
jest.mock('@/design-system', () => {
  const { Text, View } = jest.requireActual('react-native');
  return {
    Card: jest.requireActual('@/design-system/Card').Card,
    Button: jest.requireActual('@/design-system/Button').Button,
    SectionHeader: jest.requireActual('@/design-system/SectionHeader').SectionHeader,
    CollapsibleScreen: ({ children }: { children: ReactNode }) => <View>{children}</View>,
    EmptyState: ({ title }: { title: string }) => <Text>{title}</Text>,
    ErrorState: ({ title }: { title: string }) => <Text>{title}</Text>,
    LoadingState: ({ label }: { label: string }) => <Text>{label}</Text>,
  };
});

async function renderAccounts(language: 'ca' | 'es' = 'ca') {
  const i18n = createInstance();
  await i18n.init({
    lng: language,
    resources: { ca: { translation: ca }, es: { translation: es } },
    interpolation: { escapeValue: false },
  });
  await render(
    <I18nextProvider i18n={i18n}>
      <AccountsScreen />
    </I18nextProvider>
  );
}

beforeEach(() => {
  mockStatus = 'success';
});

test('shows the January expense example separately from the real account and receipts', async () => {
  await renderAccounts();
  expect(screen.getByRole('header', { name: 'Despeses de la comunitat' })).toBeTruthy();
  expect(screen.getByText('Dades de demostració · 2026')).toBeTruthy();
  expect(
    screen.getByRole('image', {
      name: `Despeses de gener del 2026: ${formatCurrency(92000, 'ca')}`,
    })
  ).toBeTruthy();
  for (const amount of [32000, 18000, 19000, 15000, 8000]) {
    expect(screen.getByText(formatCurrency(amount, 'ca'))).toBeTruthy();
  }
  expect(screen.getByText(formatCurrency(12345, 'ca'))).toBeTruthy();
  expect(screen.getByText('Real community receipt')).toBeTruthy();
  expect(screen.getAllByText(formatCurrency(7850, 'ca'))).toHaveLength(2);
});

test('updates months and sums annual expenses while preserving the selected month and real balance', async () => {
  await renderAccounts();
  await fireEvent.press(screen.getByRole('button', { name: 'febrer del 2026' }));
  expect(screen.getByRole('button', { name: 'febrer del 2026', selected: true })).toBeTruthy();
  expect(
    screen.getByRole('image', {
      name: `Despeses de febrer del 2026: ${formatCurrency(88000, 'ca')}`,
    })
  ).toBeTruthy();
  expect(screen.getByText(formatCurrency(16000, 'ca'))).toBeTruthy();
  expect(screen.getByText(formatCurrency(6000, 'ca'))).toBeTruthy();

  await fireEvent.press(screen.getByRole('button', { name: 'Anual' }));
  expect(screen.getByRole('button', { name: 'Anual', selected: true })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'febrer del 2026' })).toBeNull();
  expect(
    screen.getByRole('image', { name: `Despeses de 2026: ${formatCurrency(1077000, 'ca')}` })
  ).toBeTruthy();
  for (const amount of [384000, 191000, 240000, 180000, 82000]) {
    expect(screen.getByText(formatCurrency(amount, 'ca'))).toBeTruthy();
  }
  expect(screen.getByText(formatCurrency(12345, 'ca'))).toBeTruthy();
  expect(screen.getByText('Real community receipt')).toBeTruthy();

  await fireEvent.press(screen.getByRole('button', { name: 'Mensual' }));
  expect(screen.getByRole('button', { name: 'febrer del 2026', selected: true })).toBeTruthy();
  expect(
    screen.getByRole('image', {
      name: `Despeses de febrer del 2026: ${formatCurrency(88000, 'ca')}`,
    })
  ).toBeTruthy();
});

test('localizes the controls, categories and accessible chart in Spanish', async () => {
  await renderAccounts('es');
  expect(screen.getByText('Datos de demostración · 2026')).toBeTruthy();
  for (const label of ['Ascensor', 'Luz de zonas comunes', 'Jardín', 'Limpieza', 'Otros']) {
    expect(screen.getByText(label)).toBeTruthy();
  }
  await fireEvent.press(screen.getByRole('button', { name: 'febrero de 2026' }));
  expect(
    screen.getByRole('image', { name: `Gastos de febrero de 2026: ${formatCurrency(88000, 'es')}` })
  ).toBeTruthy();
});

test.each(['loading', 'error'] as const)(
  'does not replace an account %s state with demo finances',
  async (status) => {
    mockStatus = status;
    await renderAccounts();
    expect(screen.queryByRole('image')).toBeNull();
    expect(screen.queryByText('Dades de demostració · 2026')).toBeNull();
    expect(screen.queryByText('Real community receipt')).toBeNull();
    expect(
      screen.getByText(status === 'loading' ? ca.common.loading : ca.errors.loadTitle)
    ).toBeTruthy();
  }
);
