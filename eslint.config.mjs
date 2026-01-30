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
      'react-hooks/exhaustive-deps': 'off',
      ...jsxA11y.configs.recommended.rules,
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
      // Disable overly strict type-checking rules that cause false positives with Payload CMS
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
      // Disable style preferences that are too strict
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      // Keep important rules as warnings
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_|^req$|^res$|^payload$|^data$|^error$|^err$|^event$|^e$|^tx$',
        varsIgnorePattern: '^_|^error$|^err$',
        ignoreRestSiblings: true,
        caughtErrors: 'none'
      }],
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/dot-notation': 'off',
      '@typescript-eslint/no-duplicate-type-constituents': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/consistent-indexed-object-style': 'off',
      // jsx-a11y - disable for now, enable gradually
      'jsx-a11y/label-has-associated-control': 'off',
      'jsx-a11y/anchor-is-valid': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/interactive-supports-focus': 'off',
      'jsx-a11y/iframe-has-title': 'off',
      'jsx-a11y/media-has-caption': 'off',
      'jsx-a11y/heading-has-content': 'off',
      // TypeScript style preferences - off
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      // React hooks - disable problematic rules
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      // Additional rules disabled
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/consistent-generic-constructors': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/prefer-includes': 'off',
      '@typescript-eslint/prefer-regexp-exec': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/await-thenable': 'off',
      // Base ESLint rules - off
      'prefer-const': 'off',
      'no-useless-catch': 'off',
      'no-useless-escape': 'off',
      'no-control-regex': 'off',
      'no-case-declarations': 'off',
      // TypeScript method binding
      '@typescript-eslint/unbound-method': 'off',
      // Unsafe function type
      '@typescript-eslint/no-unsafe-function-type': 'off',
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
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_|^req$|^res$|^payload$|^data$|^error$|^err$|^event$|^e$',
        varsIgnorePattern: '^_|^error$|^err$',
        ignoreRestSiblings: true,
        caughtErrors: 'none'
      }],
      'no-useless-escape': 'off',
      'no-control-regex': 'off',
      'no-useless-catch': 'off',
      'prefer-const': 'off',
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
      // Disable unused vars rule for test files - test setup often has unused imports
      '@typescript-eslint/no-unused-vars': 'off',
    },
  }
)
