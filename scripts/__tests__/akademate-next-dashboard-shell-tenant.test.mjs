import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const [layout, appLayout, provider, sidebar, footer, globals] = await Promise.all([
  readFile('apps/tenant-admin/app/(app)/(dashboard)/layout.tsx', 'utf8'),
  readFile('apps/tenant-admin/app/(app)/layout.tsx', 'utf8'),
  readFile('apps/tenant-admin/components/providers/RealtimeProvider.tsx', 'utf8'),
  readFile('apps/tenant-admin/@payload-config/components/layout/AppSidebar.tsx', 'utf8'),
  readFile('apps/tenant-admin/@payload-config/components/layout/DashboardFooter.tsx', 'utf8'),
  readFile('apps/tenant-admin/app/globals.css', 'utf8'),
])

test('dashboard shell never selects a fixed realtime tenant', () => {
  assert.doesNotMatch(layout, /RealtimeProvider\s+tenantId=\{\s*1\s*\}/)
  assert.doesNotMatch(provider, /defaultTenantId\s*=\s*1/)
})

test('realtime identity comes only from the authenticated session tenant', () => {
  assert.match(provider, /data\.user\?\.tenantId/)
  assert.doesNotMatch(provider, /tenantId:\s*data\.user\?\.tenantId\s*\|\|/)
})

test('Next runtime selects the shared navy sidebar without changing the legacy default', () => {
  assert.match(appLayout, /data-akademate-runtime=\{runtime\}/)
  assert.match(appLayout, /process\.env\.AKADEMATE_RUNTIME === 'next'/)
  assert.match(globals, /html\[data-akademate-runtime='next'\]/)
  assert.match(globals, /--sidebar:\s*222 70% 12%/)
  assert.match(sidebar, /bg-sidebar text-sidebar-foreground/)
  assert.doesNotMatch(sidebar, /overflow-hidden bg-card text-sidebar-foreground/)
})

test('dashboard navigation preserves visible keyboard focus and canonical Next routes', () => {
  assert.match(sidebar, /focus-visible:ring-2 focus-visible:ring-sidebar-ring/)
  assert.doesNotMatch(sidebar, /focus-visible:ring-0/)
  assert.match(sidebar, /url: '\/dashboard\/cursos\/solicitudes'/)
  assert.doesNotMatch(sidebar, /max-h-96 opacity-100/)
})

test('Next shell keeps the footer in the scroll region and contains no CEP endpoint', () => {
  const mainStart = layout.indexOf('<main')
  const footerPosition = layout.indexOf('<DashboardFooter')
  const mainEnd = layout.indexOf('</main>', mainStart)
  assert.ok(mainStart >= 0 && footerPosition > mainStart && footerPosition < mainEnd)
  assert.doesNotMatch(footer, /cepformacion\.akademate\.com/)
})
