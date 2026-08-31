import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), 'utf8')
}

describe('listing homogenize contract', () => {
  it('table primitive exposes horizontal scrolling and wraps cells', () => {
    const source = read('@payload-config/components/ui/table.tsx')
    expect(source).toContain('overflow-x-auto')
    expect(source).toContain('table-fixed')
    expect(source).toContain('[overflow-wrap:anywhere]')
    expect(source).not.toContain('whitespace-nowrap')
  })

  it('listing chrome uses Badge static and campus identity', () => {
    const badges = read('@payload-config/components/akademate/dashboard/CourseTaxonomyBadges.tsx')
    const shell = read('@payload-config/components/directory/PremiumDirectoryShell.tsx')
    expect(badges).toContain('variant="static"')
    expect(shell).toContain('DirectoryCampusIdentity')
    expect(shell).toContain('DirectoryAreaBadge')
    expect(shell).toContain('parseDirectoryHexColor')
    expect(shell).toContain('formatDirectoryAreaLabel')
  })

  it('course listings replace slate privados with funding badges', () => {
    const card = read('@payload-config/components/ui/CourseTemplateCard.tsx')
    const list = read('@payload-config/components/ui/CourseListItem.tsx')
    expect(card).toContain('CourseFundingBadge')
    expect(card).toContain('DirectoryAreaBadge')
    expect(list).toContain('CourseFundingBadge')
    expect(list).not.toContain('bg-slate-100')
  })

  it('entity thumbs canonicalize payload media and keep a square photographic fallback', () => {
    const thumb = read('@payload-config/components/ui/entity-thumb.tsx')
    const stock = read('app/lib/stock-fallbacks.ts')
    expect(thumb).toContain('canonicalizePayloadMediaUrl')
    expect(thumb).toContain('STOCK_FALLBACK_IMAGES')
    expect(thumb).toContain('aspect-square')
    expect(thumb).toContain("'h-10 w-10'")
    expect(thumb).toContain("'h-12 w-12'")
    expect(stock).toContain("book: '/stock/cursos.jpg'")
    expect(stock).toContain("page: '/stock/convocatoria.jpg'")
    expect(stock).toContain("cycle: '/stock/ciclos.jpg'")
    expect(stock).toContain("campus: '/stock/sedes.jpg'")
    expect(stock).toContain("person: '/stock/profesor.jpg'")
    expect(stock).toContain("student: '/stock/alumno.jpg'")
    expect(stock).toContain("admin: '/stock/administrativa.jpg'")
  })

  it('dashboard isolates lead fetch so other widgets can render', () => {
    const home = read('app/(app)/(dashboard)/_components/DashboardHome.tsx')
    expect(home).toContain("fetch('/api/leads?limit=50&sort=-createdAt'")
    expect(home).toContain('No se pudo cargar')
    expect(home).toContain('visibleActivities')
    expect(home).not.toContain('Error al cargar dashboard')
  })

  it('sort glyphs stay hidden until hover or active sort', () => {
    const primitive = read('@payload-config/components/ui/sortable-table-head.tsx')
    expect(primitive).toContain('opacity-0')
    expect(primitive).toContain('group-hover:opacity-100')
    expect(primitive).toContain('Ordenar por')
  })

  it('course list keeps area and funding badges in clipped columns', () => {
    const item = read('@payload-config/components/ui/CourseListItem.tsx')
    expect(item).toContain('overflow-hidden sm:block')
    expect(item).toContain('CourseFundingBadge')
    expect(item).toContain('DirectoryAreaBadge')
  })

  it('cycle listing headers name Convocatoria and Sede(s)', () => {
    const page = read('app/(app)/(dashboard)/ciclos/page.tsx')
    expect(page).toContain("label: 'Convocatoria'")
    expect(page).toContain("label: 'Sede(s)'")
    expect(page).toContain('/api/convocatorias?limit=500')
  })

  it('listings expose 3-state sortable headers', () => {
    const primitive = read('@payload-config/components/ui/sortable-table-head.tsx')
    const cycle = read('@payload-config/lib/cycle-sort.ts')
    expect(primitive).toContain('Ordenar por')
    expect(primitive).toContain('ArrowUpDown')
    expect(cycle).toContain("kind === 'number' ? 'desc' : 'asc'")
    const pages = [
      'app/(app)/(dashboard)/programacion/page.tsx',
      'app/(app)/(dashboard)/web/convocatorias/page.tsx',
      'app/(app)/(dashboard)/cursos/page.tsx',
      'app/(app)/(dashboard)/ciclos/page.tsx',
      'app/(app)/(dashboard)/profesores/page.tsx',
      'app/(app)/(dashboard)/sedes/page.tsx',
      'app/(app)/(dashboard)/alumnos/page.tsx',
      'app/(app)/(dashboard)/matriculas/page.tsx',
      'app/(app)/(dashboard)/leads/page.tsx',
      'app/(app)/(dashboard)/administrativo/page.tsx',
      'app/(app)/(dashboard)/personal/page.tsx',
    ]
    for (const relative of pages) {
      const source = read(relative)
      expect(source, relative).toContain('useCycleSort')
      expect(source, relative).toMatch(/SortableTableHead|SortableListHeader/)
    }
  })
})
