import { defineConfig } from 'vitest/config'
import baseConfig from './vitest.config'
import testInventory from '../../scripts/test-file-allowlist.json'

const quarantinedUnitTests = testInventory.entries
  .filter(
    (entry) =>
      entry.workspace === '@akademate/tenant-admin' &&
      entry.classification === 'quarantined-legacy-unit'
  )
  .map((entry) => entry.path)

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: quarantinedUnitTests,
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
  },
})
