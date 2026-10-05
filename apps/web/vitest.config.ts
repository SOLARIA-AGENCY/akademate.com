import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: __dirname,
  test: {
    environment: 'jsdom',
    globals: true,
    include: [
      '__tests__/**/*.test.{ts,tsx}',
      'tests/**/*.test.{ts,tsx}',
      'app/**/*.test.{ts,tsx}',
      'components/**/*.test.{ts,tsx}',
      'lib/**/*.test.{ts,tsx}',
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/e2e/**', '**/*.spec.ts'],
  },
  resolve: {
    alias: {
      '@': __dirname,
    },
  },
})
