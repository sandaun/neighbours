import { fireEvent, render, screen } from '@testing-library/react-native';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';

import type { MoreModuleData } from '@/data/types';
import ca from '@/i18n/locales/ca.json';
import es from '@/i18n/locales/es.json';

import { MoreModuleContent } from '../MoreModuleContent';

jest.mock('lucide-react-native', () => ({ MessageSquare: () => null }));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({ primary: '#803EF6', danger: '#BA1A1A' }),
}));
jest.mock('../CalendarModuleContent', () => ({ CalendarModuleContent: () => null }));
jest.mock('@/design-system', () => ({
  Card: jest.requireActual('@/design-system/Card').Card,
  Chip: jest.requireActual('@/design-system/Chip').Chip,
  SectionHeader: jest.requireActual('@/design-system/SectionHeader').SectionHeader,
}));

const board: MoreModuleData = {
  key: 'board',
  descriptionKey: 'more.modules.board.description',
  highlight: { labelKey: 'more.modules.board.highlight', value: '4' },
  sections: [
    {
      id: 'latest',
      titleKey: 'more.modules.sections.latest',
      items: [
        { id: 'parking', title: 'Garage space for rent', topic: 'Parking' },
        { id: 'garden', title: 'Garden maintenance', topic: 'Jardí' },
        { id: 'activities', title: 'Community gathering', topic: 'Activitats' },
        { id: 'other', title: 'Parking rules reminder', topic: 'Convivència' },
      ],
    },
  ],
};

async function renderBoard(language: 'ca' | 'es', data = board) {
  const i18n = createInstance();
  await i18n.init({
    lng: language,
    resources: { ca: { translation: ca }, es: { translation: es } },
  });
  await render(
    <I18nextProvider i18n={i18n}>
      <MoreModuleContent data={data} />
    </I18nextProvider>
  );
}

test.each([
  { language: 'ca' as const, all: 'Tots', garden: 'Jardí', activities: 'Activitats' },
  { language: 'es' as const, all: 'Todos', garden: 'Jardín', activities: 'Actividades' },
])('filters board topics and restores every post in $language', async (labels) => {
  await renderBoard(labels.language);
  expect(screen.getByText('Garage space for rent')).toBeTruthy();
  expect(screen.getByText('Parking rules reminder')).toBeTruthy();

  await fireEvent.press(screen.getByRole('button', { name: 'Parking' }));
  expect(screen.getByRole('button', { name: 'Parking', selected: true })).toBeTruthy();
  expect(screen.getByText('Garage space for rent')).toBeTruthy();
  expect(screen.queryByText('Parking rules reminder')).toBeNull();
  expect(screen.queryByText('Garden maintenance')).toBeNull();

  await fireEvent.press(screen.getByRole('button', { name: labels.garden }));
  expect(screen.getByText('Garden maintenance')).toBeTruthy();
  expect(screen.queryByText('Garage space for rent')).toBeNull();

  await fireEvent.press(screen.getByRole('button', { name: labels.activities }));
  expect(screen.getByText('Community gathering')).toBeTruthy();
  expect(screen.queryByText('Garden maintenance')).toBeNull();

  await fireEvent.press(screen.getByRole('button', { name: labels.all }));
  expect(screen.getByText('Garage space for rent')).toBeTruthy();
  expect(screen.getByText('Garden maintenance')).toBeTruthy();
  expect(screen.getByText('Community gathering')).toBeTruthy();
  expect(screen.getByText('Parking rules reminder')).toBeTruthy();
});

test('shows an empty state when a topic has no posts, including posts without a topic', async () => {
  await renderBoard('ca', {
    ...board,
    sections: [
      {
        ...board.sections[0],
        items: [{ id: 'untagged', title: 'Untagged notice' }],
      },
    ],
  });
  expect(screen.getByText('Untagged notice')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Parking' }));
  expect(screen.getByText(ca.more.modules.board.noPosts)).toBeTruthy();
  expect(screen.queryByText('Untagged notice')).toBeNull();
  expect(screen.queryByText(ca.more.modules.sections.latest)).toBeNull();

  await fireEvent.press(screen.getByRole('button', { name: 'Tots' }));
  expect(screen.getByText('Untagged notice')).toBeTruthy();
  expect(screen.queryByText(ca.more.modules.board.noPosts)).toBeNull();
});
