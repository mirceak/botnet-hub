export default {
  testEnvironment: 'node',
  preset: 'ts-jest/presets/default-esm',
  transform: {
    '^.+\\.m?[tj]s?$': ['ts-jest', { useESM: true }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.(m)?js$': '$1',
  },
  testRegex: '.*(test|spec).(m)?ts$',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    'src/**/*.mts',
    'exampleTest/example.ts',
    '!exampleTest/example.test.ts',
    '!src/**/*.d.ts',
    '!src/**/*.d.mts',
  ],
};
