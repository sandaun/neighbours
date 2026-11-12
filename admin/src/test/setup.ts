// Deterministic local time for date formatting and datetime-local inputs.
process.env.TZ = 'Europe/Madrid';

import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

import i18n from '@/i18n';

// Radix Select uses pointer capture and scrollIntoView, which jsdom lacks.
if (!Element.prototype.hasPointerCapture) Element.prototype.hasPointerCapture = () => false;
if (!Element.prototype.releasePointerCapture) Element.prototype.releasePointerCapture = () => {};
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};

beforeEach(async () => {
  await i18n.changeLanguage('ca');
});

afterEach(() => {
  cleanup();
});
