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

  it('stock covers include SaaS /stock photos and website assets, not live media', () => {
    expect(isStockAcademicCover('/website/akademate/hero-formacion.png')).toBe(true)
    expect(isStockAcademicCover('/stock/sedes.jpg')).toBe(true)
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

  it('recent activity is a full-width lead funnel table with navigation', () => {
    const dashboard = read('app/(app)/(dashboard)/_components/DashboardHome.tsx')
    const route = read('app/api/dashboard/route.ts')
    expect(dashboard).toContain('Actividad Reciente')
    expect(dashboard).toContain('<Table')
    expect(dashboard).toContain('Fecha de inscripción')
    expect(dashboard).toContain('hover:bg-muted/50')
    expect(dashboard).toContain('router.push(activity.href!)')
    expect(dashboard).toContain('Pendiente de contactar')
    expect(route).toContain('lead_type')
    expect(route).toContain('normalizeLeadIntakeType')
    expect(route).toContain('normalizeLeadOrigin')
    expect(route).toContain('href: row.id == null ? null : `/leads/${String(row.id)}`')
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

  it('home KPIs use short range comparison labels', () => {
    const home = read('app/(app)/(dashboard)/_components/DashboardHome.tsx')
    expect(home).toContain('data-testid="dashboard-home-range-bar"')
    expect(home).toContain('sticky top-0 z-20 isolate')
    expect(home).toContain('flex h-12 items-center')
    expect(home).toContain('flex flex-col gap-6 pt-6')
    expect(home).toContain("fetch('/api/leads?limit=50&sort=-createdAt'")
    expect(home).not.toMatch(/className="space-y-6"[\s\S]{0,400}dashboard-home-range-bar/)
    expect(home).toContain("return 'vs. -1d'")
    expect(home).toContain("return 'vs. -7d'")
    expect(home).toContain("return 'vs. -30d'")
    expect(home).toContain("return 'vs. -6m'")
    expect(home).toContain("title: 'Matrículas'")
    expect(home).toContain('sin cambio')
    expect(home).toContain('href={`/dashboard/sedes/${campus.id}`}')
    expect(home).toContain('DirectoryStaffIcons')
  })

  it('dashboard and course tables expose horizontal overflow', () => {
    const home = read('app/(app)/(dashboard)/_components/DashboardHome.tsx')
    const table = read('@payload-config/components/ui/table.tsx')
    const course = read('app/(app)/(dashboard)/cursos/[id]/page.tsx')
    expect(home).toContain('overflow-x-auto')
    expect(home).toContain('min-w-[720px]')
    expect(table).toContain('overflow-x-auto')
    expect(course).toContain('min-w-[720px]')
  })

  it('people without photos use initials and preserve custom photos', () => {
    const thumb = read('@payload-config/components/ui/entity-thumb.tsx')
    expect(thumb).toContain('initialsFromName')
    expect(thumb).toContain('usesInitialsFallback')
    expect(thumb).toContain('fallback === \'person\'')
    expect(thumb).toContain('customOk ? resolved')
  })

  it('new campuses receive a default classroom and migration backfills empty campuses', () => {
    const campus = read('src/collections/Campuses/Campuses.ts')
    const hook = read('src/collections/Campuses/hooks/ensureDefaultClassroom.ts')
    const migration = read('migrations/20260901_default_classrooms.ts')
    expect(campus).toContain('ensureDefaultClassroom')
    expect(hook).toContain("operation !== 'create'")
    expect(hook).toContain("collection: 'classrooms'")
    expect(migration).toContain('WHERE NOT EXISTS')
    expect(migration).toContain('Aula principal')
  })

  it('course and cycle listings use the requested labels and right-side metrics', () => {
    const courses = read('app/(app)/(dashboard)/cursos/page.tsx')
    const courseItem = read('@payload-config/components/ui/CourseListItem.tsx')
    const cycleItem = read('@payload-config/components/ui/CicloListItem.tsx')
    expect(courses).toContain("label: 'Horas'")
    expect(courseItem.indexOf('{hoursLabel}')).toBeLessThan(courseItem.indexOf('<Clock'))
    expect(cycleItem).toContain(
      '<span className="font-medium">{duracionLabel || `${ciclo.duracion_total_horas}h`}</span>',
    )
    expect(cycleItem).toContain('DirectoryNeutralBadge')
  })

  it('administrative listing has no selection checkbox column', () => {
    const administrative = read('app/(app)/(dashboard)/administrativo/page.tsx')
    expect(administrative).not.toContain('<Checkbox')
    expect(administrative).not.toContain('Seleccionar todos')
  })

  it('kpi comparison is smaller than the card label', () => {
    const card = read('@payload-config/components/akademate/dashboard/KpiStatCard.tsx')
    expect(card).toContain('text-meta')
    expect(card).toContain('text-micro')
  })

  it('profesorRefs include staff photo', () => {
    const route = read('app/api/convocatorias/route.ts')
    expect(route).toContain('photo: resolvePayloadMediaSrc(staff.photo)')
    const programacion = read('app/(app)/(dashboard)/programacion/page.tsx')
    expect(programacion).toContain('photo')
    const icons = read('@payload-config/components/directory/PremiumDirectoryShell.tsx')
    expect(icons).toContain('staff.photo ?? staff.src')
  })

  it('planner occupancy cards have no course image', () => {
    const planner = read('app/(app)/(dashboard)/planner/page.tsx')
    expect(planner).not.toMatch(/<img[^>]*cursoImagen/)
    expect(planner).toContain('formatSchedule(card)')
  })

  it('course listing does not render an id subtitle', () => {
    const cursos = read('app/(app)/(dashboard)/cursos/page.tsx')
    expect(cursos).not.toContain('subtitle={String(course.id)}')
    const item = read('@payload-config/components/ui/CourseListItem.tsx')
    expect(item).not.toMatch(/course\.id/)
  })

  it('course ficha puts convocatorias before ficha informativa', () => {
    const ficha = read('app/(app)/(dashboard)/cursos/[id]/page.tsx')
    const convIndex = ficha.indexOf('Convocatorias')
    const infoIndex = ficha.indexOf('Ficha informativa')
    expect(convIndex).toBeGreaterThan(-1)
    expect(infoIndex).toBeGreaterThan(convIndex)
    expect(ficha).toContain('FieldCard')
  })

  it('sede listing has Activo and no taxId chips', () => {
    const list = read('@payload-config/components/ui/SedeListItem.tsx')
    expect(list).toContain('Activo')
    expect(list).not.toContain('taxId')
    expect(list).not.toContain('locationChips')
    const page = read('app/(app)/(dashboard)/sedes/page.tsx')
    expect(page).not.toContain('sede.taxId')
  })

  it('sede ficha lists personal before profesores', () => {
    const ficha = read('app/(app)/(dashboard)/sedes/[id]/page.tsx')
    const start = ficha.indexOf('Equipo: personal primero')
    expect(start).toBeGreaterThan(-1)
    const slice = ficha.slice(start)
    expect(slice.indexOf('Personal Administrativo')).toBeLessThan(slice.indexOf('Profesores'))
    expect(ficha).toContain('StaffAvatar')
    expect(ficha).toContain('URL pública')
  })

  it('teacher ficha has three row actions and no codigo label', () => {
    const ficha = read('app/(app)/(dashboard)/profesores/[id]/page.tsx')
    expect(ficha).toContain('aria-label="Ver"')
    expect(ficha).toContain('aria-label="Editar"')
    expect(ficha).toContain('aria-label="Más acciones"')
    expect(ficha).not.toContain('Código:')
    expect(ficha).not.toContain('Alumnos')
    expect(ficha).not.toContain('Módulo')
  })

  it('convocatoria ficha separates publication from enrollment', () => {
    const ficha = read('app/(app)/(dashboard)/programacion/[id]/page.tsx')
    const headerSlice = ficha.slice(
      ficha.indexOf('title={title}'),
      ficha.indexOf('Resumen de convocatoria'),
    )
    expect(ficha).toContain('Resumen de convocatoria')
    expect(ficha).toContain("isPublished ? 'Publicado' : 'No publicado'")
    expect(ficha).toContain('>Estado<')
    expect(ficha).toContain('>Matrícula<')
    expect(ficha).not.toContain('Publicación')
    expect(ficha).toContain("isPublished ? 'Despublicar' : 'Publicar'")
    expect(headerSlice).not.toContain('Despublicar')
    expect(headerSlice).not.toContain('Publicar')
    expect(ficha).toContain('Landing de pago')
    expect(ficha).toContain('grayscale')
    expect(ficha).toContain('text-emerald-600')
    expect(ficha).toContain('Ver programa')
    expect(ficha).toContain('Ver docente')
    expect(ficha).toContain('EntityThumb')
    expect(ficha).toContain('Sede / aula / horario')
    expect(ficha).toContain('Profesores asignados')
    expect(ficha).toContain('resolvePayloadMediaSrc(instructor.photo)')
  })

  it('mock cycle pages redirect to the live listing', () => {
    expect(read('app/(app)/(dashboard)/ciclos-medio/page.tsx')).toContain("redirect('/dashboard/ciclos')")
    expect(read('app/(app)/(dashboard)/ciclos-superior/page.tsx')).toContain("redirect('/dashboard/ciclos')")
    expect(read('app/(app)/(dashboard)/ciclos-medio/page.tsx')).not.toContain('unsplash')
    expect(read('app/(app)/(dashboard)/ciclos-superior/page.tsx')).not.toContain('unsplash')
  })

  it('profesor edit form drops redundant chrome and validates on save', () => {
    const ficha = read('app/(app)/(dashboard)/profesores/[id]/editar/page.tsx')
    expect(ficha).not.toContain('Foto del profesor')
    expect(ficha).not.toContain('Esta ficha docente está incompleta')
    expect(ficha).not.toContain('Bloqueado:')
    expect(ficha).not.toContain('Visibles en la ficha pública')
    expect(ficha).toContain('Sede base')
    expect(ficha).toContain('Añadir sede adicional')
    expect(ficha).not.toContain('placeholder="Asignar sede"')
    expect(ficha).toContain('Primer apellido')
    expect(ficha).toContain('Email <RequiredMark')
    expect(ficha).toContain('Esta sede determinará también la empresa y base de facturación del docente.')
    expect(ficha).toContain('Seleccionar imagen')
    expect(ficha).toContain('Sedes asignadas')
    expect(ficha).toContain('variant="static"')
    expect(ficha).toContain('[aria-invalid="true"]')
    expect(ficha).toContain('Este campo es obligatorio')
    expect(ficha).toContain('[&_[data-slot=label]]:text-sm')
  })

  it('programacion list headers are sortable', () => {
    const source = read('app/(app)/(dashboard)/programacion/page.tsx')
    const head = read('@payload-config/components/ui/sortable-table-head.tsx')
    expect(source).toContain('SortableTableHead')
    expect(source).toContain('useCycleSort')
    expect(source).toContain('column="curso"')
    expect(head).toContain('Ordenar por')
    expect(head).toContain('cursor-pointer')
  })

  it('enrollment wizard stays inside dashboard chrome', () => {
    const layout = read('app/(app)/(dashboard)/layout.tsx')
    const wizard = read('app/(app)/(dashboard)/matriculas/wizard/EnrollmentWizard.tsx')
    const portal = read('app/(app)/(dashboard)/matriculas/portal/page.tsx')
    const listing = read('app/(app)/(dashboard)/matriculas/page.tsx')
    expect(layout).toContain('<AppSidebar />')
    expect(layout).toContain('DASHBOARD_LISTING_MAIN_INNER_CLASS')
    expect(layout).not.toContain('isEnrollmentFocusPath')
    expect(wizard).toContain('EnrollmentBreadcrumb')
    expect(wizard).toContain('Guardar borrador')
    expect(wizard).not.toContain('100vw')
    expect(portal).toContain('Nueva matrícula')
    expect(portal).not.toContain('Empezar')
    expect(listing).not.toContain('/matriculas/portal')
  })
})
