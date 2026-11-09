const locales: Record<string, string> = { ca: 'ca-ES', es: 'es-ES' };

export function formatDateTime(value: string, language: string | undefined) {
  return new Intl.DateTimeFormat(locales[language ?? 'ca'] ?? 'ca-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Madrid',
  }).format(new Date(value));
}
