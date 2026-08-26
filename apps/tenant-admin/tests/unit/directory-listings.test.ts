import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

function read(relative: string): string {
  return readFileSync(path.join(root, relative), 'utf8')
}

describe('premium directory listings (saas)', () => {
  it('wires staff and catalog pages to PremiumDirectoryShell without Unsplash mocks', () => {
    for (const relative of [
      'app/(app)/(dashboard)/profesores/page.tsx',
      'app/(app)/(dashboard)/administrativo/page.tsx',
      'app/(app)/(dashboard)/cursos/page.tsx',
      'app/(app)/(dashboard)/ciclos/page.tsx',
      'app/(app)/(dashboard)/sedes/page.tsx',
    ] as const) {
      const source = read(relative)
      expect(source, relative).toContain('PremiumDirectoryShell')
      expect(source, relative).not.toContain('unsplash.com')
    }
  })

  it('computes programación KPIs from live rows', () => {
    const source = read('app/(app)/(dashboard)/programacion/page.tsx')
    expect(source).toContain('computeConvocationDirectoryKpis')
    expect(source).toContain('DirectoryKpiStrip')
  })
})
