import { formatCommunityCaption, formatCurrency, formatShortDate } from '@/utils/formatters';

test('preserves a date-only charge date across device timezones', () => {
  expect(formatShortDate('2026-11-01', 'en-GB')).toBe('1 Nov 2026');
});

test('formats integer cents without rounding to whole euros', () => {
  expect(formatCurrency(7850, 'en-IE')).toBe('€78.50');
});

describe('formatCommunityCaption', () => {
  test('shows the full address when the name does not include it', () => {
    expect(formatCommunityCaption('Residencial Les Oliveres', 'Carrer del Mar, 14', 'Sitges')).toBe(
      'Carrer del Mar, 14 · Sitges'
    );
  });

  test('shows only the municipality when the name already includes street and number', () => {
    expect(formatCommunityCaption('Carrer del Mar 14', 'Carrer del Mar, 14', 'Sitges')).toBe(
      'Sitges'
    );
    expect(formatCommunityCaption('CP Carrer de l’Àngel, 3', 'carrer de l’angel 3', 'Vic')).toBe(
      'Vic'
    );
  });

  test('keeps the full address when only part of it matches', () => {
    expect(formatCommunityCaption('Carrer del Mar 140', 'Carrer del Mar, 14', 'Sitges')).toBe(
      'Carrer del Mar, 14 · Sitges'
    );
  });

  test('handles missing parts', () => {
    expect(formatCommunityCaption('Comunitat de prova', null, null)).toBeNull();
    expect(formatCommunityCaption('Comunitat de prova', null, 'Sitges')).toBe('Sitges');
    expect(formatCommunityCaption('Carrer del Mar 14', 'Carrer del Mar, 14', null)).toBeNull();
  });
});
