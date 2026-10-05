import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import testInventory from '../../scripts/test-file-allowlist.json'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const quarantinedUnitTests = testInventory.entries
  .filter(
    (entry) =>
      entry.workspace === '@akademate/tenant-admin' &&
      entry.classification === 'quarantined-legacy-unit'
  )
  .map((entry) => entry.path)

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: [
      '__tests__/**/*.test.{ts,tsx}',
      'tests/**/*.test.{ts,tsx}',
      'app/**/*.test.{ts,tsx}',
      'components/**/*.test.{ts,tsx}',
      'lib/**/*.test.{ts,tsx}',
      'src/**/*.test.{ts,tsx}',
      'scripts/**/*.test.{ts,tsx}',
      '@payload-config/**/*.test.{ts,tsx}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      'tests/e2e/courses-catalog.test.ts',
      'tests/integration/staff-module.test.ts',
      'tests/deployment.test.ts',
      ...quarantinedUnitTests,
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.*',
        '**/*.d.ts',
        '**/dist/**',
        '**/.next/**',
      ],
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 75,
        statements: 75,
      },
    },
  },
  resolve: {
    alias: [
      {
        find: 'server-only',
        replacement: path.resolve(__dirname, './tests/__mocks__/server-only.ts'),
      },
      {
        find: /^@\/app\/\(dashboard\)\//,
        replacement: `${path.resolve(__dirname, './app/(app)/(dashboard)')}/`,
      },
      {
        find: /^@\/app\/auth\//,
        replacement: `${path.resolve(__dirname, './app/(app)/auth')}/`,
      },
      {
        find: /^@\/app\/campus\//,
        replacement: `${path.resolve(__dirname, './app/(app)/campus')}/`,
      },
      {
        find: /^@\/app\/legal\//,
        replacement: `${path.resolve(__dirname, './app/(app)/legal')}/`,
      },
      {
        find: '@akademate/types',
        replacement: path.resolve(__dirname, '../../packages/types/src/index'),
      },
      {
        find: '@payload-config/components/layout',
        replacement: path.resolve(__dirname, './tests/__mocks__/@payload-config/components/layout'),
      },
      {
        find: '@payload-config/components/ui/QualifiedAreasMultiSelect',
        replacement: path.resolve(
          __dirname,
          './@payload-config/components/ui/QualifiedAreasMultiSelect'
        ),
      },
      {
        find: '@payload-config/components/ui',
        replacement: path.resolve(__dirname, './tests/__mocks__/@payload-config/components/ui'),
      },
      {
        find: '@payload-config/components/akademate',
        replacement: path.resolve(__dirname, './@payload-config/components/akademate'),
      },
      {
        find: '@payload-config/components',
        replacement: path.resolve(__dirname, './tests/__mocks__/@payload-config/components'),
      },
      {
        find: '@payload-config/hooks',
        replacement: path.resolve(__dirname, './tests/__mocks__/@payload-config/hooks'),
      },
      {
        find: '@payload-config',
        replacement: path.resolve(__dirname, './tests/__mocks__/@payload-config'),
      },
      {
        find: 'next/navigation',
        replacement: 'next-router-mock',
      },
      {
        find: '@',
        replacement: path.resolve(__dirname, './'),
      },
    ],
  },
})
