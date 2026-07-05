import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import unicorn from 'eslint-plugin-unicorn';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js, unicorn },
    extends: ['js/recommended'],
    languageOptions: { globals: globals.node },
    rules: {
      'no-unused-vars': 'error',
      'no-const-assign': 'error',
      'no-debugger': 'error',
      'max-statements': ['error', 75],
      'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],

      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/no-named-default': 'error',

      strict: 'warn',
      'no-undef': 'warn',
      'func-name-matching': 'warn',
      'func-names': 'warn',
      'max-nested-callbacks': ['warn', 3],
      'unicorn/filename-case': ['warn', { case: 'camelCase' }]
    },
  },
  tseslint.configs.recommended,
]);
