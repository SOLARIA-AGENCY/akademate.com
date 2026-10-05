import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root,
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/integration/staff-module.test.ts'],
  },
})
