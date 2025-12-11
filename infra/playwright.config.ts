import { defineConfig } from '@playwright/test';

const baseURL = process.env.DFO_BASE_URL || 'http://localhost:3030';

export default defineConfig({
  timeout: 60_000,
  testDir: '.',
  use: {
    baseURL,
    headless: true,
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
  },
  reporter: [['list']],
});
