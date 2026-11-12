import { expect, test } from 'vitest';

import { centsToInput, formatCents, parseEuros, parseSignedEuros } from './money';

test('parses euro amounts into integer cents', () => {
  expect(parseEuros('125')).toBe(12500);
  expect(parseEuros('125,5')).toBe(12550);
  expect(parseEuros(' 125.05 ')).toBe(12505);
  expect(parseEuros('0')).toBe(0);
});

test('rejects ambiguous or invalid amounts', () => {
  for (const value of ['', '-5', '12,345', '1.234,56', 'abc', '12,']) {
    expect(parseEuros(value)).toBeNull();
  }
});

test('round-trips cents through the form value', () => {
  expect(centsToInput(12505)).toBe('125,05');
  expect(parseEuros(centsToInput(12505))).toBe(12505);
  expect(formatCents(12550, 'ca')).toMatch(/125,50\s€/);
});

test('parses signed balances', () => {
  expect(parseSignedEuros('-120,5')).toBe(-12050);
  expect(parseSignedEuros('35')).toBe(3500);
  expect(parseSignedEuros('--3')).toBeNull();
  expect(centsToInput(-12050)).toBe('-120,50');
  expect(parseSignedEuros(centsToInput(-12050))).toBe(-12050);
});
