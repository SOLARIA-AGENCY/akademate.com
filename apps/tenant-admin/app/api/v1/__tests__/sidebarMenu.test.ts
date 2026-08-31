/**
 * @fileoverview Tests para la estructura del menu del sidebar
 * Valida: secciones, sub-items, URLs de navegacion
 *
 * La estructura del menu se define en @payload-config/components/layout/AppSidebar.tsx.
 * Como el componente requiere hooks de React (usePathname, useSWR, useTenantBranding),
 * replicamos la estructura estatica para validar la logica de navegacion.
 */

import { describe, it, expect } from 'vitest'

// ============================================================================
// Menu structure (mirrored from AppSidebar.tsx menuItems)
// ============================================================================

interface MenuItem {
  title: string
  url?: string
  items?: MenuItem[]
  sectionBefore?: string
}

const menuItems: MenuItem[] = [
  { title: 'Dashboard', url: '/dashboard' },
  { title: 'Programación', url: '/programacion', sectionBefore: 'ACADÉMICO' },
  { title: 'Planner Visual', url: '/planner' },
  { title: 'Cursos', url: '/dashboard/cursos' },
  { title: 'Ciclos', url: '/dashboard/ciclos' },
  { title: 'Sedes', url: '/dashboard/sedes' },
  { title: 'Alumnos', url: '/dashboard/alumnos' },
  {
    title: 'Matriculacion',
    items: [
      { title: 'Solicitudes', url: '/matriculas' },
      { title: 'Nueva matrícula', url: '/matriculas/nueva' },
      { title: 'Planes y tarifas', url: '/matriculas/planes' },
      { title: 'Tarifas de acceso', url: '/matriculas/tarifas-acceso' },
    ],
  },
  {
    title: 'Personal',
    sectionBefore: 'PERSONAL',
    items: [
      { title: 'Profesores', url: '/dashboard/profesores' },
      { title: 'Administrativos', url: '/dashboard/personal/administrativos' },
    ],
  },
  {
    title: 'Campus Virtual',
    sectionBefore: 'CAMPUS VIRTUAL',
    items: [
      { title: 'Vista General Campus', url: '/campus-virtual' },
      { title: 'Inscripciones LMS', url: '/campus-virtual/inscripciones' },
      { title: 'Progreso Alumnos', url: '/campus-virtual/progreso' },
      { title: 'Modulos y Lecciones', url: '/campus-virtual/contenido' },
      { title: 'Certificados', url: '/campus-virtual/certificados' },
    ],
  },
  {
    title: 'Marketing',
    sectionBefore: 'MARKETING',
    items: [
      { title: 'Campañas', url: '/campanas' },
      { title: 'Creatividades', url: '/marketing/creatividades' },
      { title: 'Leads', url: '/leads' },
      { title: 'Analíticas', url: '/marketing/analiticas' },
    ],
  },
  {
    title: 'Web',
    sectionBefore: 'WEB',
    items: [
      { title: 'Analíticas', url: '/web/analiticas' },
      { title: 'Cursos Publicados', url: '/web/cursos' },
      { title: 'Ciclos Publicados', url: '/web/ciclos' },
      { title: 'Convocatorias', url: '/web/convocatorias' },
    ],
  },
  {
    title: 'Administración',
    sectionBefore: 'ADMINISTRACIÓN',
    items: [
      { title: 'Usuarios', url: '/administracion/usuarios' },
      { title: 'Roles y Permisos', url: '/administracion/roles' },
      { title: 'Suscripcion', url: '/administracion/suscripcion' },
      { title: 'Registro de Actividad', url: '/administracion/actividad' },
    ],
  },
  { title: 'Configuración', url: '/configuracion', sectionBefore: 'CONFIGURACIÓN' },
]

// ============================================================================
// Helpers
// ============================================================================

function findMenuItem(title: string): MenuItem | undefined {
  return menuItems.find((item) => item.title === title)
}

function findSubItem(parentTitle: string, subTitle: string): MenuItem | undefined {
  const parent = findMenuItem(parentTitle)
  return parent?.items?.find((sub) => sub.title === subTitle)
}

function getAllUrls(items: MenuItem[]): string[] {
  const urls: string[] = []
  for (const item of items) {
    if (item.url) urls.push(item.url)
    if (item.items) urls.push(...getAllUrls(item.items))
  }
  return urls
}

// ============================================================================
// Tests: Dashboard section
// ============================================================================

describe('Sidebar: Dashboard', () => {
  it('Dashboard section exists', () => {
    const item = findMenuItem('Dashboard')
    expect(item).toBeDefined()
  })

  it('Dashboard has url /dashboard', () => {
    const item = findMenuItem('Dashboard')
    expect(item!.url).toBe('/dashboard')
  })

  it('Dashboard does not have sub-items (direct link)', () => {
    const item = findMenuItem('Dashboard')
    expect(item!.items).toBeUndefined()
  })
})

// ============================================================================
// Tests: Personal section
// ============================================================================

describe('Sidebar: Personal', () => {
  it('Personal section exists', () => {
    const item = findMenuItem('Personal')
    expect(item).toBeDefined()
  })

  it('Personal has items array (not a direct url)', () => {
    const item = findMenuItem('Personal')
    expect(item!.items).toBeDefined()
    expect(Array.isArray(item!.items)).toBe(true)
    expect(item!.url).toBeUndefined()
  })

  it('Personal has exactly 2 sub-items', () => {
    const item = findMenuItem('Personal')
    expect(item!.items).toHaveLength(2)
  })

  it('Personal has Profesores sub-item', () => {
    const sub = findSubItem('Personal', 'Profesores')
    expect(sub).toBeDefined()
  })

  it('Profesores url is /dashboard/profesores', () => {
    const sub = findSubItem('Personal', 'Profesores')
    expect(sub!.url).toBe('/dashboard/profesores')
  })

  it('Personal has Administrativos sub-item', () => {
    const sub = findSubItem('Personal', 'Administrativos')
    expect(sub).toBeDefined()
  })

  it('Administrativos url is /dashboard/personal/administrativos', () => {
    const sub = findSubItem('Personal', 'Administrativos')
    expect(sub!.url).toBe('/dashboard/personal/administrativos')
  })
})

// ============================================================================
// Tests: Sedes section
// ============================================================================

describe('Sidebar: Sedes', () => {
  it('Sedes section exists in menu', () => {
    const item = findMenuItem('Sedes')
    expect(item).toBeDefined()
  })

  it('Sedes has url /dashboard/sedes (direct link by default)', () => {
    const item = findMenuItem('Sedes')
    expect(item!.url).toBe('/dashboard/sedes')
  })
})

// ============================================================================
// Tests: Key sections exist
// ============================================================================

describe('Sidebar: Key sections', () => {
  it.each([
    'Dashboard',
    'Cursos',
    'Ciclos',
    'Sedes',
    'Alumnos',
    'Personal',
    'Marketing',
    'Web',
    'Campus Virtual',
    'Administración',
    'Configuración',
  ])('section "%s" exists', (title) => {
    expect(findMenuItem(title)).toBeDefined()
  })
})

// ============================================================================
// Tests: General structure
// ============================================================================

describe('Sidebar: General structure', () => {
  it('has at least 10 top-level items', () => {
    expect(menuItems.length).toBeGreaterThanOrEqual(10)
  })

  it('all URLs start with /', () => {
    const urls = getAllUrls(menuItems)
    for (const url of urls) {
      expect(url).toMatch(/^\//)
    }
  })

  it('no duplicate URLs in the entire menu', () => {
    const urls = getAllUrls(menuItems)
    const unique = new Set(urls)
    // Allow for potential intentional duplicates but flag them
    // In this case we check that most are unique
    expect(unique.size).toBe(urls.length)
  })

  it('all top-level items have a title', () => {
    for (const item of menuItems) {
      expect(item.title).toBeDefined()
      expect(item.title.length).toBeGreaterThan(0)
    }
  })

  it('items with sub-items do not have a direct url', () => {
    for (const item of menuItems) {
      if (item.items && item.items.length > 0) {
        expect(item.url).toBeUndefined()
      }
    }
  })

  it('items without sub-items have a url', () => {
    for (const item of menuItems) {
      if (!item.items || item.items.length === 0) {
        expect(item.url).toBeDefined()
        expect(item.url!.length).toBeGreaterThan(0)
      }
    }
  })
})

// ============================================================================
// Tests: Section separators
// ============================================================================

describe('Sidebar: Section separators', () => {
  it('Programación has sectionBefore (ACADÉMICO)', () => {
    const item = findMenuItem('Programación')
    expect(item!.sectionBefore).toBeDefined()
  })

  it('Marketing has sectionBefore (MARKETING)', () => {
    const item = findMenuItem('Marketing')
    expect(item!.sectionBefore).toBeDefined()
  })

  it('Campus Virtual has sectionBefore', () => {
    const item = findMenuItem('Campus Virtual')
    expect(item!.sectionBefore).toBeDefined()
  })

  it('Administración has sectionBefore', () => {
    const item = findMenuItem('Administración')
    expect(item!.sectionBefore).toBeDefined()
  })

  it('Dashboard does NOT have sectionBefore', () => {
    const item = findMenuItem('Dashboard')
    expect(item!.sectionBefore).toBeUndefined()
  })
})
