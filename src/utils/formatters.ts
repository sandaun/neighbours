export function formatCurrency(amountCents: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(amountCents / 100);
}

export function formatShortDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value));
}

export function formatEventDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

/** Full address, e.g. "Carrer del Mar, 14 · Sitges". */
export function formatCommunityAddress(
  addressLine: string | null,
  municipality: string | null
): string | null {
  const parts = [addressLine, municipality].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(' · ') : null;
}

function normalizeForComparison(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/**
 * Line shown under the community name: the municipality alone when the name
 * already contains the street and number, otherwise the full address.
 */
export function formatCommunityCaption(
  name: string,
  addressLine: string | null,
  municipality: string | null
): string | null {
  if (addressLine) {
    const normalizedName = ` ${normalizeForComparison(name)} `;
    const normalizedLine = normalizeForComparison(addressLine);
    if (normalizedLine && normalizedName.includes(` ${normalizedLine} `)) {
      return municipality;
    }
  }
  return formatCommunityAddress(addressLine, municipality);
}
