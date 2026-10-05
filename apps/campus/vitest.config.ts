import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: [
      '__tests__/**/*.test.{ts,tsx}',
      'components/**/__tests__/**/*.test.{ts,tsx}',
      'lib/**/__tests__/**/*.test.{ts,tsx}',
      'hooks/**/__tests__/**/*.test.{ts,tsx}',
      'app/**/__tests__/**/*.test.{ts,tsx}',
    ],
    exclude: ['**/node_modules/**', '**/dist/**'],
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
