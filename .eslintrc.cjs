const { readFileSync } = require('fs');
const prettierConfig = readFileSync('.prettierrc.json', {
  encoding: 'utf8',
  flag: 'r'
});

module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true
  },
  parserOptions: {
    sourceType: 'module'
  },
  overrides: [
    {
      files: ['**/*.ts'],
      parserOptions: {
        sourceType: 'module',
        project: ['./tsconfig.json'],
        ecmaVersion: 2022
      },
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint', 'jest'],
      extends: [
        'plugin:jest/recommended',
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:prettier/recommended'
      ],
      rules: {
        curly: 'off',
        'no-async-promise-executor': 'off',
        'brace-style': 'off',
        // '@typescript-eslint/no-explicit-any': 'error',
        indent: 'off',
        'import/prefer-default-export': 'off',
        'prettier/prettier': [
          'error',
          { rules: JSON.stringify(prettierConfig) }
        ]
      }
    }
  ]
};
