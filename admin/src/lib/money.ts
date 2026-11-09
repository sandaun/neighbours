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

export function centsToInput(cents: number | undefined) {
  if (cents === undefined) return '';
  return `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, '0')}`;
}
