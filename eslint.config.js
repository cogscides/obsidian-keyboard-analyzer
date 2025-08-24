import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import svelte from 'eslint-plugin-svelte'
import globals from 'globals'
import prettier from 'eslint-config-prettier'
import svelteConfig from './svelte.config.js'

export default tseslint.config(
  // Base JS rules
  eslint.configs.recommended,

  // TypeScript rules (type-aware)
  ...tseslint.configs.recommendedTypeChecked,

  // Svelte plugin recommended flat config
  ...svelte.configs['flat/recommended'],

  // Configure Svelte files to use TS parser for <script lang="ts">
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        svelteConfig,
        extraFileExtensions: ['.svelte'],
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.browser },
    },
    rules: {
      'svelte/no-unused-svelte-ignore': 'error',
    },
  },

  // Configure TS/JS parser options and globals
  {
    files: ['**/*.{ts,tsx,js,jsx,mts,cts,mjs,cjs}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'no-console': 'warn',
      'no-debugger': 'warn',
      'no-empty': 'warn',
      'no-var': 'error',
      'prefer-const': 'error',

      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-this-alias': 'error',
    },
  },

  // Disable formatting rules in favor of Prettier
  prettier,

  // Ignores
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'main.js',
      'styles.css',
      '**/*.d.ts',
      '*.config.{js,ts,mjs,cjs,mts,cts}',
      '**/.svelte-kit/**',
    ],
  }
)
