module.exports = {
  preset: 'jest-expo',
  // The web backoffice in admin/ has its own Vitest suite.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/admin/'],
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
