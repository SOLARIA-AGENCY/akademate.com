import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../../../')
const TENANT_ADMIN = resolve(ROOT)

function read(rel: string): string {
  return readFileSync(join(TENANT_ADMIN, rel), 'utf8')
}

describe('chrome phase A0+A contract', () => {
  it('registers @shadcn in components.json', () => {
    const json = read('components.json')
    expect(json).toContain('"@shadcn"')
    expect(json).toContain('https://ui.shadcn.com/r/{name}.json')
  })

  it('dashboard shell uses --sidebar token, never a host hex', () => {
    const source = read('components/layout/dashboard-shell.ts')
    expect(source).toContain('bg-[hsl(var(--sidebar))]')
    expect(source).not.toContain('#3E091A')
    expect(source).not.toContain('#0F2440')
    expect(source).not.toContain('#0B1D36')
  })

  it('dashboard layout mounts the tokenized shell', () => {
    const source = read('app/(app)/(dashboard)/layout.tsx')
    expect(source).toContain('DASHBOARD_SHELL_LOCKED_CLASS')
    expect(source).not.toContain('bg-[#3E091A]')
    expect(source).not.toContain('Buscar sección')
  })

  it('tenant branding writes --sidebar and has no CEP host adapter', () => {
    const source = read('app/providers/tenant-branding.tsx')
    expect(source).toContain("root.style.setProperty('--sidebar'")
    expect(source).toContain('AKADEMATE_SIDEBAR')
    expect(source).not.toContain('CEP_DEFAULT_BRANDING')
    expect(source).not.toContain('applyCepHostIdentity')
    expect(source).not.toContain('#f2014b')
    expect(source).not.toContain('#3E091A')
  })

  it('kebab ui primitives do not import CEP chrome constants', () => {
    const uiDir = join(TENANT_ADMIN, 'components/ui')
    const files = readdirSync(uiDir).filter((name) => name.endsWith('.tsx') && !name.includes('/'))
    for (const file of files) {
      if (file[0] !== file[0].toLowerCase() && file.includes('-') === false) continue
      if (!/^[a-z0-9-]+\.tsx$/.test(file)) continue
      const source = readFileSync(join(uiDir, file), 'utf8')
      expect(source, file).not.toContain('CEP_SIDEBAR')
      expect(source, file).not.toContain('academy-brand')
    }
  })

  it('directory listings use PremiumDirectoryShell', () => {
    const pages = [
      'app/(app)/(dashboard)/sedes/page.tsx',
      'app/(app)/(dashboard)/ciclos/page.tsx',
      'app/(app)/(dashboard)/cursos/page.tsx',
      'app/(app)/(dashboard)/profesores/page.tsx',
      'app/(app)/(dashboard)/alumnos/page.tsx',
      'app/(app)/(dashboard)/administrativo/page.tsx',
      'app/(app)/(dashboard)/web/convocatorias/page.tsx',
    ]
    for (const page of pages) {
      const source = read(page)
      expect(source, page).toContain('PremiumDirectoryShell')
    }
  })

  it('cobros uses TableHeader without a raw thead', () => {
    const source = read('app/(app)/(dashboard)/finanzas/cobros-pagos/page.tsx')
    expect(source).toContain('<TableHeader>')
    expect(source).not.toMatch(/<thead/)
  })

  it('leads and campanas use directory chrome', () => {
    expect(read('app/(app)/(dashboard)/leads/page.tsx')).toContain('PremiumDirectoryShell')
    expect(read('app/(app)/(dashboard)/campanas/page.tsx')).toContain('DashboardToolbar')
  })

  it('listing table heads are sticky opaque card', () => {
    const source = read('components/ui/table.tsx')
    const headerFn = source.slice(source.indexOf('function TableHeader'), source.indexOf('function TableBody'))
    expect(headerFn).toContain('sticky top-0')
    expect(headerFn).toContain('bg-card')
    expect(headerFn).toContain('border-t')
    expect(headerFn).toContain('border-border')
    expect(headerFn).not.toContain('border-primary')
    expect(headerFn).not.toContain('bg-muted/40')
    expect(source).toContain('overscroll-none')
  })
})

describe('chrome phase B+C+D contract', () => {
  it('CommandPalette uses the official command slug', () => {
    const source = read('components/layout/CommandPalette.tsx')
    expect(source).toContain("from '../ui/command'")
    expect(source).toContain('CommandDialog')
    expect(source).toContain('CommandInput')
    expect(source).toContain('CommandItem')
  })

  it('dashboard layout mounts command, sonner and SidebarProvider', () => {
    const source = read('app/(app)/(dashboard)/layout.tsx')
    expect(source).toContain('CommandPalette')
    expect(source).toContain("from '@payload-config/components/ui/sonner'")
    expect(source).toContain('SidebarProvider')
    expect(source).toContain('SidebarTrigger')
    expect(source).not.toContain('Buscar sección')
  })

  it('useToast is a sonner bridge', () => {
    const source = read('@payload-config/hooks/use-toast.ts')
    expect(source).toContain("from 'sonner'")
  })

  it('EmptyState wraps the official empty slug', () => {
    const source = read('components/ui/EmptyState.tsx')
    expect(source).toContain("from './empty'")
    expect(source).toContain('<Empty')
  })

  it('AppSidebar has no in-rail collapse chevron', () => {
    const source = read('components/layout/AppSidebar.tsx')
    expect(source).toContain('SIDEBAR_SUBNAV_ICON_CLASS')
    expect(source).toContain("'h-4 w-4'")
    expect(source).not.toContain('onToggle')
    expect(source).not.toContain('ChevronLeft')
    expect(source).toContain('ChevronRight')
    expect(source).toContain('<Sidebar')
    expect(source).not.toContain('SidebarProvider')
  })
})

describe('visual audit corrections', () => {
  it('canvas is inset from the window edge', () => {
    const source = read('components/layout/dashboard-shell.ts')
    expect(source).toContain('md:mb-3')
    expect(source).toContain('md:rounded-xl')
  })

  it('dashboard main does not clip horizontal overflow', () => {
    const source = read('app/(app)/(dashboard)/layout.tsx')
    expect(source).toContain('DASHBOARD_LISTING_MAIN_INNER_CLASS')
    expect(source).not.toContain('overflow-x-hidden')
    expect(read('app/lib/dashboard-listing-scroll.ts')).toContain('min-w-0')
  })

  it('hides scrollbar indicators globally while keeping overflow', () => {
    const css = read('app/globals.css')
    expect(css).toContain('scrollbar-width: none')
    expect(css).toContain('::-webkit-scrollbar')
    expect(css).toContain('display: none')
  })

  it('sidebar nav scrolls vertically when groups expand', () => {
    const sidebar = read('components/layout/AppSidebar.tsx')
    expect(sidebar).toContain('overflow-y-auto')
    expect(sidebar).toContain('min-h-0')
    expect(sidebar).toContain('max-h-[2000px]')
    expect(sidebar).not.toContain('max-h-96')
  })
})

describe('enrollment wizard and accesos contract', () => {
  it('exposes wizard, nueva, planes and portal pages', () => {
    expect(read('app/(app)/(dashboard)/matriculas/wizard/EnrollmentWizard.tsx')).toContain('EnrollmentWizard')
    expect(read('app/(app)/(dashboard)/matriculas/nueva/page.tsx')).toContain("from '../wizard/EnrollmentWizard'")
    expect(read('app/(app)/(dashboard)/matriculas/planes/page.tsx')).toContain('/api/convocatorias')
    expect(read('app/(app)/(dashboard)/matriculas/portal/page.tsx')).toContain('/matriculas/nueva')
    expect(read('app/(app)/(dashboard)/matriculas/portal/page.tsx')).toContain('<Card')
    expect(read('app/(app)/(dashboard)/matriculas/portal/page.tsx')).not.toContain('redirect')
  })

  it('exposes accesos pages and API', () => {
    expect(read('app/(app)/(dashboard)/accesos/page.tsx')).toContain('/accesos/recepcion')
    expect(read('app/(app)/(dashboard)/accesos/recepcion/page.tsx')).toContain('POST')
    expect(read('app/(app)/(dashboard)/accesos/pases/page.tsx')).toContain('magic_link')
    expect(read('app/(app)/(dashboard)/accesos/historico/page.tsx')).toContain('overflow-x-auto')
    expect(read('app/api/accesos/route.ts')).toContain('getAuthenticatedUserContext')
    expect(read('app/api/accesos/_lib/store.ts')).toContain('resetStore')
  })

  it('sidebar and command palette include new routes', () => {
    const sidebar = read('components/layout/AppSidebar.tsx')
    expect(sidebar).toContain('/matriculas/nueva')
    expect(sidebar).toContain('/matriculas/planes')
    expect(sidebar).toContain('/accesos/recepcion')
    const palette = read('components/layout/CommandPalette.tsx')
    expect(palette).toContain('/matriculas/nueva')
    expect(palette).toContain('/matriculas/planes')
    expect(palette).toContain('/accesos/recepcion')
    expect(palette).toContain('/accesos/pases')
    expect(palette).toContain('/accesos/historico')
    expect(palette).toContain('/marketing/analiticas')
    expect(palette).toContain('/web/analiticas')
    expect(palette).toContain('/matriculas/tarifas-acceso')
    expect(palette).not.toContain("href: '/analiticas'")
    expect(sidebar).toContain('/marketing/analiticas')
    expect(sidebar).toContain('/web/analiticas')
    expect(sidebar).toContain('/matriculas/tarifas-acceso')
    expect(sidebar).not.toContain("url: '/analiticas'")
  })

  it('ficha curso and convocatoria drop CEP hex wrappers', () => {
    const courseFicha = read('app/(app)/(dashboard)/cursos/[id]/ficha/page.tsx')
    expect(courseFicha).not.toContain('rounded-2xl bg-background')
    expect(courseFicha).not.toContain('#f2014b')
    expect(read('app/(app)/(dashboard)/programacion/[id]/ficha/page.tsx')).not.toContain('#f2014b')
  })

  it('calendario drops bg-red-600 and matriculas hub uses Alert plus wizard route', () => {
    expect(read('app/(app)/(dashboard)/calendario-citas/page.tsx')).not.toContain('bg-red-600')
    const matriculas = read('app/(app)/(dashboard)/matriculas/page.tsx')
    expect(matriculas).toContain('/matriculas/nueva')
    expect(matriculas).toContain('<Alert')
  })
})

describe('gutter, collapsed rail, tenant tokens', () => {
  it('listing inner gutter is px-4 + pb-4 and FAB clearance defaults to 0rem', () => {
    const listing = read('app/lib/dashboard-listing-scroll.ts')
    expect(listing).toContain('px-4')
    expect(listing).toContain('pb-4')
    expect(listing).toContain('overscroll-none')
    expect(listing).toContain('--dashboard-fab-clearance')
    expect(listing).toContain('0rem')
    const layout = read('app/(app)/(dashboard)/layout.tsx')
    expect(layout).toContain("['--dashboard-fab-clearance' as string]: '0rem'")
    expect(layout).toContain('DASHBOARD_LISTING_MAIN_INNER_CLASS')
  })

  it('collapsed click parent exposes nested rail line; Dashboard and Ayuda stay leaf', () => {
    const sidebar = read('components/layout/AppSidebar.tsx')
    expect(sidebar).toContain('data-slot="sidebar-collapsed-subnav"')
    expect(sidebar).toContain('SIDEBAR_SUBNAV_TREE_CLASS')
    expect(sidebar).toContain('border-l-[1px]')
    expect(sidebar).toContain('border-primary')
    expect(sidebar).not.toContain('border-l border-sidebar-border')
    expect(sidebar).toContain('const next = activeParent ? [activeParent.title] : []')
    expect(sidebar).not.toContain('onMouseEnter')
    expect(sidebar).toContain("title: 'Dashboard'")
    expect(sidebar).toContain('Ayuda y Documentación')
    expect(sidebar).toContain('sidebar-active-bar')
    expect(sidebar).toContain('sidebar-subnav-indicator')
    expect(sidebar).toContain('bg-primary')
    expect(sidebar).not.toContain('#0066CC')
    expect(sidebar).not.toContain('#f2014b')
  })

  it('chrome indicators use --primary, never a host hex', () => {
    const files = [
      'components/layout/AppSidebar.tsx',
      '@payload-config/components/layout/AppSidebar.tsx',
      'app/providers/tenant-branding.tsx',
      'components/ui/listing-pills.tsx',
      'components/ui/SegmentedToggle.tsx',
      '@payload-config/lib/courseTypeConfig.ts',
    ]
    for (const file of files) {
      const source = read(file)
      expect(source, file).not.toContain('#f2014b')
      expect(source, file).not.toContain('applyCepHostIdentity')
    }
    expect(read('components/ui/SegmentedToggle.tsx')).toContain('data-[state=on]:bg-primary')
    expect(read('@payload-config/lib/courseTypeConfig.ts')).toContain("bgColor: 'bg-primary/10'")
    expect(read('@payload-config/lib/courseTypeConfig.ts')).not.toContain('bg-red-600')
    expect(read('app/globals.css')).toContain('--primary: 210 100% 40%')
    expect(read('app/globals.css')).toContain('--dashboard-canvas: 220 9% 96%')
  })

  it('host branding keeps CEP as inventory and Akademate as chrome fallback', () => {
    const source = read('app/lib/server/tenant-host-branding.ts')
    expect(source).toContain('CEP_TENANT_REFERENCE')
    expect(source).toContain("primaryColor: '#f2014b'")
    expect(source).toContain('...AKADEMATE_DEFAULTS')
    expect(source).not.toContain('CEP_DEFAULTS')
    expect(source).not.toContain('hostLooksLikeCep(host) ? CEP')
    expect(source).not.toContain('fallbackLogo = CEP_LOGO')
    expect(source).toContain("primaryColor: '#0066CC'")
    expect(read('app/providers/tenant-branding.tsx')).toContain("AKADEMATE_PRIMARY = '#0066CC'")
  })
})

describe('form chrome: returnTo and title-only headers', () => {
  it('convocatoria entry points stamp returnTo', () => {
    expect(read('app/(app)/(dashboard)/programacion/page.tsx')).toContain('convocatoriaNuevaHref')
    expect(read('app/(app)/(dashboard)/web/convocatorias/page.tsx')).toContain(
      "convocatoriaNuevaHref('/web/convocatorias')"
    )
    expect(read('app/(app)/(dashboard)/planner/page.tsx')).toContain("convocatoriaNuevaHref('/planner')")
    expect(read('app/(app)/(dashboard)/cursos/[id]/page.tsx')).toContain('convocatoriaNuevaHref')
    expect(read('app/(app)/(dashboard)/ciclos/[id]/page.tsx')).toContain('convocatoriaNuevaHref')
    expect(read('app/(app)/(dashboard)/programacion/nueva/page.tsx')).toContain('useFormReturnNavigation')
    expect(read('app/(app)/(dashboard)/programacion/nueva/page.tsx')).not.toContain(
      'Crear una nueva convocatoria de curso'
    )
  })

  it('create and edit forms have title-only PageHeader', () => {
    const pages = [
      'app/(app)/(dashboard)/cursos/nuevo/page.tsx',
      'app/(app)/(dashboard)/cursos/[id]/editar/page.tsx',
      'app/(app)/(dashboard)/ciclos/nuevo/page.tsx',
      'app/(app)/(dashboard)/ciclos/[id]/editar/page.tsx',
      'app/(app)/(dashboard)/sedes/nueva/page.tsx',
      'app/(app)/(dashboard)/sedes/[id]/editar/page.tsx',
      'app/(app)/(dashboard)/profesores/nuevo/page.tsx',
      'app/(app)/(dashboard)/profesores/[id]/editar/page.tsx',
      'app/(app)/(dashboard)/administrativo/nuevo/page.tsx',
      'app/(app)/(dashboard)/administrativo/[id]/editar/page.tsx',
      'app/(app)/(dashboard)/alumnos/nuevo/page.tsx',
      'app/(app)/(dashboard)/matriculas/[id]/editar/page.tsx',
      'app/(app)/(dashboard)/perfil/editar/page.tsx',
      'app/(app)/(dashboard)/matriculas/wizard/EnrollmentWizard.tsx',
      'app/(app)/(dashboard)/programacion/nueva/page.tsx',
    ]
    for (const page of pages) {
      const source = read(page)
      expect(source, page).not.toMatch(/<PageHeader[\s\S]{0,280}description=/)
    }
  })
})

describe('sidebar order and split analytics', () => {
  it('keeps dual chrome trees identical and orders campus before marketing before web', () => {
    const sidebar = read('components/layout/AppSidebar.tsx')
    const payload = read('@payload-config/components/layout/AppSidebar.tsx')
    expect(sidebar).toBe(payload)
    expect(sidebar).not.toContain('Landings de pago')
    const dash = sidebar.indexOf("title: 'Dashboard'")
    const campus = sidebar.indexOf("sectionBefore: 'CAMPUS VIRTUAL'")
    const marketing = sidebar.indexOf("sectionBefore: 'MARKETING'")
    const web = sidebar.indexOf("sectionBefore: 'WEB'")
    const finance = sidebar.indexOf("sectionBefore: 'FINANZAS'")
    const admin = sidebar.indexOf("sectionBefore: 'ADMINISTRACIÓN'")
    const config = sidebar.indexOf("sectionBefore: 'CONFIGURACIÓN'")
    expect(dash).toBeGreaterThan(-1)
    expect(campus).toBeGreaterThan(dash)
    expect(marketing).toBeGreaterThan(campus)
    expect(web).toBeGreaterThan(marketing)
    expect(finance).toBeGreaterThan(web)
    expect(admin).toBeGreaterThan(finance)
    expect(config).toBeGreaterThan(admin)
  })

  it('splits analytics into marketing and web surfaces and redirects the old route', () => {
    expect(read('app/(app)/(dashboard)/analiticas/page.tsx')).toContain("redirect('/marketing/analiticas')")
    expect(read('app/(app)/(dashboard)/marketing/analiticas/page.tsx')).toContain('surface="marketing"')
    expect(read('app/(app)/(dashboard)/web/analiticas/page.tsx')).toContain('surface="web"')
    const view = read('app/(app)/(dashboard)/analiticas/analiticas-view.tsx')
    expect(view).toContain("from '@payload-config/components/ui/tabs'")
    expect(view).toContain("from '@payload-config/components/ui/SegmentedToggle'")
    expect(view).not.toContain('SOLARIA')
  })

  it('rebuilds matriculation hub, planes tabs, stepper and access tariffs on shadcn slugs', () => {
    const portal = read('app/(app)/(dashboard)/matriculas/portal/page.tsx')
    expect(portal).toContain("from '@payload-config/components/ui/card'")
    expect(portal).not.toContain('Visa/Mastercard')
    expect(read('app/(app)/(dashboard)/matriculas/portal/planes/page.tsx')).toContain(
      "redirect('/matriculas/planes')",
    )
    expect(read('app/(app)/(dashboard)/matriculas/page.tsx')).toContain('/matriculas/portal')
    expect(read('app/(app)/(dashboard)/matriculas/planes/page.tsx')).toContain('TabsTrigger')
    const stepper = read('app/(app)/(dashboard)/matriculas/wizard/EnrollmentStepper.tsx')
    expect(stepper).toContain("from '@payload-config/components/ui/button'")
    expect(stepper).toContain("from '@payload-config/components/ui/progress'")
    expect(stepper).toContain("from '@payload-config/components/ui/separator'")
    expect(stepper).toContain('WIZARD_STAGES')
    expect(read('app/(app)/(dashboard)/matriculas/wizard/types.ts')).toContain('Pago y RGPD')
    expect(read('@payload-config/components/ui/field.tsx')).toContain('data-slot="field"')
    expect(portal).toContain('lg:grid-cols-3')
    expect(portal).toContain('/matriculas/nueva?paso=1')
    expect(portal).not.toContain('#f2014b')
    expect(portal).not.toContain('/finanzas/metodos')
    expect(read('app/(app)/(dashboard)/layout.tsx')).toContain('isEnrollmentFocusPath')
    const steps = read('app/(app)/(dashboard)/matriculas/wizard/steps.tsx')
    expect(steps).toContain('export function AlumnoStep')
    expect(steps).toContain('showErrors')
    expect(steps).toContain('FieldLabel')
    const wizard = read('app/(app)/(dashboard)/matriculas/wizard/EnrollmentWizard.tsx')
    expect(wizard).toContain('Guardar y salir')
    expect(wizard).toContain('Continuar a Alumno')
    expect(wizard).toContain('sticky bottom-0')
    expect(read('app/(app)/(dashboard)/matriculas/tarifas-acceso/page.tsx')).toContain(
      '/api/matriculas/tarifas-acceso',
    )
    expect(read('app/api/matriculas/tarifas-acceso/route.ts')).toContain('getAuthenticatedUserContext')
  })
})

describe('elera canvas primitives', () => {
  it('cards are rounded-2xl with milky badges and muted table heads', () => {
    expect(read('@payload-config/components/ui/card.tsx')).toContain('rounded-2xl')
    expect(read('@payload-config/components/ui/card.tsx')).toContain('border-black/[0.04]')
    expect(read('@payload-config/components/ui/badge.tsx')).toContain('bg-emerald-50')
    expect(read('@payload-config/components/ui/badge.tsx')).toContain('text-emerald-700')
    expect(read('@payload-config/components/ui/table.tsx')).toContain('text-xs font-normal')
    expect(read('@payload-config/components/ui/table.tsx')).not.toContain('uppercase')
  })

  it('EntityThumb is square and never rounded-full', () => {
    const thumb = read('@payload-config/components/ui/entity-thumb.tsx')
    expect(thumb).toContain('aspect-square')
    expect(thumb).toContain('rounded-lg')
    expect(thumb).not.toContain('rounded-full')
    expect(read('@payload-config/components/ui/CourseListItem.tsx')).toContain('EntityThumb')
    expect(read('@payload-config/components/ui/CourseListItem.tsx')).not.toContain('rounded-full')
    expect(read('@payload-config/components/ui/CicloListItem.tsx')).not.toContain('rounded-full')
    expect(read('@payload-config/components/ui/SedeListItem.tsx')).not.toContain('rounded-full')
  })

  it('does not change AppSidebar identity classes in this pass', () => {
    const sidebar = read('components/layout/AppSidebar.tsx')
    expect(sidebar).toContain('ACADÉMICO')
    expect(sidebar).toContain('sidebar-active-bar')
    expect(sidebar).toContain('sidebar-subnav-indicator')
  })
})
