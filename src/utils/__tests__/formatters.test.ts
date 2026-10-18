import { formatCurrency, formatShortDate } from '@/utils/formatters';

test('preserves a date-only charge date across device timezones', () => {
  expect(formatShortDate('2026-11-01', 'en-GB')).toBe('1 Nov 2026');
});

test('formats integer cents without rounding to whole euros', () => {
  expect(formatCurrency(7850, 'en-IE')).toBe('€78.50');
});
