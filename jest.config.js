module.exports = {
  preset: 'jest-expo',
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
