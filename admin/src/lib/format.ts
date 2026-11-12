const locales: Record<string, string> = { ca: 'ca-ES', es: 'es-ES' };

// Browser local time, matching the datetime-local inputs used for editing.
export function formatDateTime(value: string, language: string | undefined) {
  return new Intl.DateTimeFormat(locales[language ?? 'ca'] ?? 'ca-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
