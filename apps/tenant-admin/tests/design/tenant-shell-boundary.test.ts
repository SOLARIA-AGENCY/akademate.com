import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const testDirectory = dirname(fileURLToPath(import.meta.url))
const dashboardLayout = readFileSync(
  resolve(testDirectory, '../../app/(app)/(dashboard)/layout.tsx'),
  'utf8'
)
const realtimeProvider = readFileSync(
  resolve(testDirectory, '../../@payload-config/components/providers/RealtimeProvider.tsx'),
  'utf8'
)
const sessionRoute = readFileSync(
  resolve(testDirectory, '../../app/api/auth/session/route.ts'),
  'utf8'
)

describe('tenant-admin shell identity boundary', () => {
  it('does not inject a fixture tenant into the realtime provider', () => {
    expect(dashboardLayout).not.toMatch(/<RealtimeProvider\s+tenantId=/)
    expect(realtimeProvider).not.toMatch(/defaultTenantId\s*=\s*1/)
    expect(realtimeProvider).not.toMatch(/tenantId:\s*data\.user\?\.tenantId\s*\|\|/)
  })

  it('publishes the verified tenant identity from the session route', () => {
    expect(sessionRoute).toContain('tenantId: user.tenantId ?? authenticated.tenantId ?? undefined')
  })

  it('keeps realtime subscription fail-closed when the tenant claim is absent', () => {
    expect(realtimeProvider).toContain('if (tenantId && userId && role)')
    expect(realtimeProvider).toContain('render children without socket')
  })
})
