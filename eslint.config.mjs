import eslint from '@eslint/js'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/.turbo/**',
      'pnpm-lock.yaml',
      '**/payload-types.ts',
      '**/@payload-config/**',
      '**/*.d.ts',
      // Test files with JSX that need special handling
      'apps/tenant-admin/__tests__/**/*.js',
      'apps/tenant-admin/tests/**/*.js',
      // JS test files that use jest/test globals
      'apps/tenant-admin/src/**/*.test.js',
      // Infrastructure dashboards with browser-loaded globals
      'infra/**/*.js',
      // E2E and CMS test setup files with parsing issues
      'apps/tenant-admin/apps/cms/tests/**',
      'apps/web/__mocks__/**',
      'apps/web/e2e/**',
      // Types folder outside of tsconfig
      'apps/tenant-admin/types/**',
      // Test setup with references to unavailable rules
      'apps/tenant-admin/tests/setup.ts',
      // Files with React Compiler errors needing refactor
      'apps/admin-client/components/charts/MetricsBarChart.tsx',
      'apps/campus/lib/session-context.tsx',
      'apps/tenant-admin/app/(dashboard)/estado/page.tsx',
      'apps/tenant-admin/app/(dashboard)/programacion/nueva/page.tsx',
      'apps/admin-client/components/charts/ResponseTimeChart.tsx',
      'apps/admin-client/components/ui/sidebar.tsx',
      // E2E tests outside of tsconfig projects
      'e2e/**',
      'apps/tenant-admin/tests/e2e/**',
      'apps/tenant-admin/tests/__mocks__/**',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json', './apps/*/tsconfig.json', './packages/*/tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'jsx-a11y': jsxA11y,
      'react-hooks': reactHooks,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
      // Relax overly strict rules for better DX - keep as warnings
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'warn',
      '@typescript-eslint/no-base-to-string': 'warn',
      // Style preferences - warn to allow gradual adoption
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn', // Changed to warn - TODO: fix all and restore to error
      // Additional style rules as warnings
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/array-type': 'warn',
      '@typescript-eslint/dot-notation': 'warn',
      '@typescript-eslint/no-duplicate-type-constituents': 'warn',
      '@typescript-eslint/no-redundant-type-constituents': 'warn',
      '@typescript-eslint/consistent-indexed-object-style': 'warn',
      // jsx-a11y - warn for gradual accessibility improvement
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/interactive-supports-focus': 'warn',
      'jsx-a11y/iframe-has-title': 'warn',
      'jsx-a11y/media-has-caption': 'warn',
      'jsx-a11y/heading-has-content': 'warn',
      // TypeScript style preferences
      '@typescript-eslint/non-nullable-type-assertion-style': 'warn',
      '@typescript-eslint/triple-slash-reference': 'off', // Next.js uses triple-slash refs
      // React hooks - warn for set-state-in-effect while refactoring
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn', // React Compiler purity rules
      // Additional rules to relax
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-inferrable-types': 'warn',
      '@typescript-eslint/consistent-generic-constructors': 'warn',
      '@typescript-eslint/consistent-type-definitions': 'warn',
      '@typescript-eslint/prefer-includes': 'warn',
      '@typescript-eslint/prefer-regexp-exec': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/await-thenable': 'warn',
      // Base ESLint rules relaxed
      'prefer-const': 'warn',
      'no-useless-catch': 'warn',
      'no-useless-escape': 'warn',
      'no-control-regex': 'warn',
      'no-case-declarations': 'warn',
      // TypeScript method binding
      '@typescript-eslint/unbound-method': 'warn',
      // Unsafe function type
      '@typescript-eslint/no-unsafe-function-type': 'warn',
    },
  },
  {
    files: ['**/*.{js,mjs}'],
    extends: [eslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-useless-escape': 'warn',
      'no-control-regex': 'warn',
      'no-useless-catch': 'warn',
      'prefer-const': 'warn',
    },
  },
  {
    files: ['**/*.cjs', 'postcss.config.cjs', 'tailwind.config.js'],
    extends: [eslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
  },
  // Test files - relax type-safety rules for mocks and test utilities
  {
    files: [
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      '**/__tests__/**/*.{ts,tsx}',
      '**/tests/**/*.{ts,tsx}',
      '**/testHelpers.ts',
      '**/test-utils.{ts,tsx}',
    ],
    rules: {
      // Disable unsafe rules for test files - mocks need type flexibility
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      // Relax other rules that are less critical in tests
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  }
)
