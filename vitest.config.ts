import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    // Use projects mode (Vitest 4.x)
    projects: [
      // Apps with jsdom environment (React components)
      'apps/campus/vitest.config.ts',
      'apps/portal/vitest.config.ts',
      'apps/tenant-admin/vitest.config.ts',

      // Packages with node environment (backend/utilities)
      'packages/api/vitest.config.ts',
      'packages/catalog/vitest.config.ts',
      'packages/db/vitest.config.ts',
      'packages/imports/vitest.config.ts',
      'packages/leads/vitest.config.ts',
      'packages/lms/vitest.config.ts',
      'packages/notifications/vitest.config.ts',
      'packages/operations/vitest.config.ts',
      'packages/realtime/vitest.config.ts',
      'packages/reports/vitest.config.ts',
    ],
    // Global excludes
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/*.spec.ts',
      '**/*.spec.js',
      '**/infra/**',
    ],
  },
})
