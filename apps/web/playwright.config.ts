import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  reporter: 'line',
  use: {
    ...devices['Desktop Chrome'],
    channel: 'chrome',
    baseURL: process.env.WEB_URL ?? 'http://127.0.0.1:3006',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
})
