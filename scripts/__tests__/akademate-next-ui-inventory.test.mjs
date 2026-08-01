import assert from 'node:assert/strict'
import test from 'node:test'
import {
  analyzeRouteSource,
  assertInventorySnapshot,
  deriveAppRoute,
} from '../lib/akademate-next-ui-inventory.mjs'

test('derives public routes while removing App Router groups', () => {
  assert.equal(
    deriveAppRoute('apps/tenant-admin/app/(app)/(dashboard)/cursos/[id]/page.tsx'),
    '/cursos/[id]'
  )
  assert.equal(deriveAppRoute('apps/campus/app/page.tsx'), '/')
  assert.equal(deriveAppRoute('apps/ops/app/health/page.jsx'), '/health')
})

test('detects shared authority, local primitives and hardcoded color utilities', () => {
  assert.deepEqual(
    analyzeRouteSource(`
      import { WorkspaceShell } from '@akademate/ui'
      import { Button } from '@/components/ui/button'
      export default function Page() {
        return <main className="bg-[#071633] text-[rgb(255,255,255)]">Content</main>
      }
    `),
    {
      sharedUiImport: true,
      localPrimitiveImportCount: 1,
      hardcodedColorTokenCount: 2,
    }
  )
})

test('rejects inventory drift with a useful regeneration command', () => {
  assert.throws(
    () => assertInventorySnapshot({ totalPages: 2 }, { totalPages: 1 }),
    /pnpm audit:ui:write/
  )
})
