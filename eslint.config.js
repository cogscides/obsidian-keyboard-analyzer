import js from '@eslint/js'
import svelte from 'eslint-plugin-svelte'
import svelteParser from 'svelte-eslint-parser'
import globals from 'globals'
import ts from 'typescript-eslint'
import tsParser from '@typescript-eslint/parser'
import svelteConfig from './svelte.config.js'

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ['**/*.svelte'],
    plugins: {
      svelte,
    },
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.svelte'],
        svelteConfig,
      },
    },
    rules: {
      // Add specific Svelte rules that we know exist
      'svelte/no-unused-svelte-ignore': 'error',
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // ESLint base rules
      'no-console': 'warn',
      'no-debugger': 'warn',
      'no-unused-vars': 'off', // Handled by TypeScript ESLint
      'prefer-const': 'error',
      'no-var': 'error',
      'no-empty': 'warn',

      // TypeScript ESLint rules
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-this-alias': 'error',
    },
  },
  {
    settings: {
      svelte: {
        // Ignore TypeScript warnings in Svelte templates that may produce false positives
        ignoreWarnings: [
          '@typescript-eslint/no-unsafe-assignment',
          '@typescript-eslint/no-unsafe-member-access',
        ],
      },
    },
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '*.config.js',
      '*.config.ts',
      'main.js',
      'styles.css',
      '**/*.d.ts',
    ],
  },
]