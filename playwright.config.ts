import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E Test Configuration for Akademate Multi-tenant SaaS
 *
 * Apps under test:
 * - web: Public portal (port 3006)
 * - admin-client: Admin dashboard (port 3001)
 * - portal: Tenant portal (port 3002)
 * - tenant-admin: Tenant administration (port 3003)
 */

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  outputDir: 'playwright-results',
  timeout: 30_000,
  expect: {
    timeout: 20_000,
  },
  use: {
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'web-chromium',
      testDir: './e2e/web',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.WEB_URL ?? 'http://localhost:3006',
      },
    },
    {
      name: 'web-mobile',
      testDir: './e2e/web',
      use: {
        ...devices['iPhone 14'],
        baseURL: process.env.WEB_URL ?? 'http://localhost:3006',
      },
    },

    {
      name: 'payload-chromium',
      testDir: './e2e/payload',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.PAYLOAD_URL ?? 'http://localhost:3003',
      },
    },

    {
      name: 'campus-chromium',
      testDir: './e2e/campus',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.CAMPUS_URL ?? 'http://localhost:3005',
      },
    },

    {
      name: 'admin-chromium',
      testDir: './e2e/admin',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.ADMIN_CLIENT_URL ?? 'http://localhost:3001',
      },
    },

    {
      name: 'tenant-admin-chromium',
      testDir: './e2e/tenant-admin',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.TENANT_ADMIN_URL ?? 'http://localhost:3009',
      },
    },

    {
      name: 'portal-chromium',
      testDir: './e2e/portal',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.PORTAL_URL ?? 'http://localhost:3008',
      },
    },

    {
      name: 'ops-chromium',
      testDir: './e2e/ops',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.OPS_URL ?? 'http://localhost:3070',
      },
    },
  ],

  // Web server configuration for local development
  webServer: process.env.CI
    ? undefined
    : {
        command: 'pnpm --filter @akademate/web dev',
        url: 'http://localhost:3006',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
