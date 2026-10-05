import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: __dirname,
  test: {
    globals: true,
    environment: 'node',
    include: [
      '__tests__/**/*.test.ts',
      'access/**/__tests__/**/*.test.ts',
      'hooks/**/__tests__/**/*.test.ts',
    ],
  },
})
