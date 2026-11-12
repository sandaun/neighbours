const formatters: Record<string, Intl.NumberFormat> = {};

export function formatCents(cents: number, language: string | undefined) {
  const locale = language === 'es' ? 'es-ES' : 'ca-ES';
  formatters[locale] ??= new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' });
  return formatters[locale].format(cents / 100);
}

// "125", "125,5", "125.50" → 12550. Up to two decimals, never negative.
export function parseEuros(value: string): number | null {
  const match = /^(\d{1,7})(?:[.,](\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
}

// Like parseEuros, but allows a leading minus (e.g. a balance the resident owes).
export function parseSignedEuros(value: string): number | null {
  const trimmed = value.trim();
  const negative = trimmed.startsWith('-');
  const cents = parseEuros(negative ? trimmed.slice(1) : trimmed);
  return cents === null ? null : negative ? -cents : cents;
}

export function centsToInput(cents: number | null | undefined) {
  if (cents === undefined || cents === null) return '';
  const sign = cents < 0 ? '-' : '';
  const value = Math.abs(cents);
  return `${sign}${Math.floor(value / 100)},${String(value % 100).padStart(2, '0')}`;
}
