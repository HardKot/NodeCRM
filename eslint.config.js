import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js },
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

      strict: 'warn',
      'no-undef': 'warn',
      'func-name-matching': 'warn',
      'func-names': 'warn',
      'max-nested-callbacks': ['warn', 3],
    },
  },
  tseslint.configs.recommended,
]);
