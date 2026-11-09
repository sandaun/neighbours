// Deterministic local time for date formatting and datetime-local inputs.
process.env.TZ = 'Europe/Madrid';

import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

import i18n from '@/i18n';

beforeEach(async () => {
  await i18n.changeLanguage('ca');
});

afterEach(() => {
  cleanup();
});
