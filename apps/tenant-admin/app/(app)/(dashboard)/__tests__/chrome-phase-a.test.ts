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

  it('leads and campanas use DashboardToolbar', () => {
    expect(read('app/(app)/(dashboard)/leads/page.tsx')).toContain('DashboardToolbar')
    expect(read('app/(app)/(dashboard)/campanas/page.tsx')).toContain('DashboardToolbar')
  })

  it('listing table heads are sticky opaque card', () => {
    const source = read('components/ui/table.tsx')
    const headerFn = source.slice(source.indexOf('function TableHeader'), source.indexOf('function TableBody'))
    expect(headerFn).toContain('sticky top-0')
    expect(headerFn).toContain('bg-card')
    expect(headerFn).not.toContain('bg-muted/40')
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
