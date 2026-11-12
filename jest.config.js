module.exports = {
  preset: 'jest-expo',
  // admin/ has its own Vitest suite; Edge Functions run under Deno (deno test).
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/admin/', '<rootDir>/supabase/functions/'],
  modulePathIgnorePatterns: ['<rootDir>/admin/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/design-system/**/*.{ts,tsx}',
    '!src/design-system/index.ts',
    '!src/design-system/__tests__/**',
  ],
  coverageDirectory: 'coverage',
};
