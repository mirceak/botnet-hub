import { pathsToModuleNameMapper } from 'ts-jest';
import tsconfigJson from './tsconfig.jest.json' assert { type: 'json' };

function manageKey(key) {
  return key.includes('(.*)') ? key.slice(0, -1) + '\\.js$' : key;
}
function manageMapper(mapper) {
  const newMapper = {};
  for (const key in mapper) {
    newMapper[manageKey(key)] = mapper[key];
  }
  newMapper['^./(.*)\\.js$'] = './$1';
  return newMapper;
}

export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: manageMapper(
    pathsToModuleNameMapper(tsconfigJson.compilerOptions.paths, {
      prefix: '<rootDir>/'
    })
  ), 
  transform: {
    "^.+\\.(ts|tsx)$": [
      'ts-jest',
      {
        tsconfig: 'tsconfig.jest.json', 
        useESM: true
      },
    ],
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  testRegex: '.*(test|spec).(m)?ts$',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    'src/**/*.mts',
    '!**/*.testno.js',
    '!**/*.testno.ts',
    '!**/*.d.ts',
    '!**/*.d.mts'
  ]
};
