import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { formatDirectoryAreaLabel, TELEFORMACION_PILL } from '../../@payload-config/lib/courseTypeConfig'
import { isStockAcademicCover } from '../../@payload-config/components/directory/campus-identity-map'
import { getPublicCampusImage } from '../../app/lib/public-campus-assets'

const root = process.cwd()

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), 'utf8')
}

describe('chrome UI contract', () => {
  it('home toolbar is range buttons only', () => {
    const source = read('app/(app)/(dashboard)/_components/DashboardHome.tsx')
    expect(source).toContain('aria-label="Rango"')
    expect(source).toContain('1D')
    expect(source).toContain('7D')
    expect(source).toContain('30D')
    expect(source).toContain('6M')
    expect(source).not.toContain('SelectValue placeholder="Rango"')
    expect(source).not.toContain('placeholder="Sede"')
    expect(source).not.toContain('placeholder="Tipo"')
  })

  it('teleformación uses the pastel pill', () => {
    expect(TELEFORMACION_PILL).toContain('bg-yellow-50')
    expect(TELEFORMACION_PILL).not.toContain('bg-yellow-300')
  })

  it('area labels strip the Área prefix', () => {
    expect(formatDirectoryAreaLabel('Área Sanidad')).toBe('Sanidad')
    expect(formatDirectoryAreaLabel('Área Sanidad')).not.toMatch(/Área/)
  })

  it('stock covers are akademate website assets, not live media', () => {
    expect(isStockAcademicCover('/website/akademate/hero-formacion.png')).toBe(true)
    expect(isStockAcademicCover('/api/media/file/portada.webp')).toBe(false)
  })

  it('getPublicCampusImage stays slug-agnostic', () => {
    expect(getPublicCampusImage('campus-alpha')).toBeNull()
    expect(getPublicCampusImage('campus-alpha', '/api/media/file/sede.png')).toBe('/api/media/file/sede.png')
  })

  it('listings use DirectoryCampusIdentity instead of the red sede pill', () => {
    const pages = [
      'app/(app)/(dashboard)/profesores/page.tsx',
      'app/(app)/(dashboard)/programacion/page.tsx',
      'app/(app)/(dashboard)/alumnos/page.tsx',
    ]
    for (const relative of pages) {
      const source = read(relative)
      expect(source, relative).toContain('DirectoryCampusIdentity')
      expect(source, relative).not.toContain('<DirectoryCampusBadge')
    }
  })

  it('planner keeps Nueva convocatoria visible and sizes occupancy to aulas', () => {
    const planner = read('app/(app)/(dashboard)/planner/page.tsx')
    expect(planner).toContain('+ Nueva convocatoria')
    expect(planner).toContain('data-aula-count')
  })

  it('course ficha exposes Descargar PDF', () => {
    const ficha = read('app/(app)/(dashboard)/cursos/[id]/page.tsx')
    expect(ficha).toContain('Descargar PDF')
    const print = read('app/(app)/(dashboard)/cursos/[id]/ficha/page.tsx')
    expect(print).toContain('Descargar PDF')
  })

  it('template has no CEP academy strings', () => {
    const home = read('app/(app)/(dashboard)/_components/DashboardHome.tsx')
    const identity = read('@payload-config/components/directory/PremiumDirectoryShell.tsx')
    const campusAssets = read('app/lib/public-campus-assets.ts')
    for (const source of [home, identity, campusAssets]) {
      expect(source).not.toMatch(/El Trompo|ACATEN|APROEM|B76|E765/)
    }
  })
})
