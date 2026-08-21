import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

function read(relative: string): string {
  return readFileSync(path.join(root, relative), 'utf8')
}

describe('dashboard operational create CTAs', () => {
  it('opens existing create pages from the staff listings', () => {
    expect(read('app/(app)/(dashboard)/alumnos/page.tsx')).toContain('/dashboard/alumnos/nuevo')
    expect(read('app/(app)/(dashboard)/sedes/page.tsx')).toContain('/dashboard/sedes/nueva')
    expect(read('app/(app)/(dashboard)/programacion/page.tsx')).toContain('/dashboard/programacion/nueva')
    expect(read('app/(app)/(dashboard)/campanas/page.tsx')).toContain('`/campanas/${row.id}`')
    expect(read('app/(app)/(dashboard)/_components/DashboardHome.tsx')).toContain('directoryError')
    expect(read('app/(app)/(dashboard)/_components/DashboardHome.tsx')).not.toContain('animate-spin text-primary')
    expect(read('app/(app)/(dashboard)/planner/page.tsx')).toContain('/dashboard/programacion/nueva')
    expect(read('app/(app)/(dashboard)/leads/page.tsx')).toContain('Nuevo lead')
    expect(read('app/(app)/(dashboard)/contenido/testimonios/page.tsx')).toContain('/api/contenido/testimonials')
    expect(read('app/(app)/(dashboard)/contenido/formularios/page.tsx')).toContain('/api/contenido/forms')
    expect(read('app/(app)/(dashboard)/ciclos-medio/page.tsx')).toContain("redirect('/dashboard/ciclos')")
  })
})
