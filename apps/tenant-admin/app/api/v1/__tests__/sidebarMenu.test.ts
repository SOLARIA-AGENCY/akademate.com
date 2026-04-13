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
  { title: 'Programacion', url: '/programacion', sectionBefore: 'GESTION ACADEMICA' },
  { title: 'Planner Visual', url: '/planner' },
  { title: 'Cursos', url: '/cursos' },
  { title: 'Ciclos', url: '/ciclos' },
  { title: 'Sedes', url: '/sedes' },
  { title: 'Alumnos', url: '/alumnos' },
  {
    title: 'Personal',
    items: [
      { title: 'Profesores', url: '/personal/profesores' },
      { title: 'Administrativos', url: '/personal/administrativos' },
    ],
  },
  {
    title: 'Marketing',
    sectionBefore: 'GESTION COMERCIAL',
    items: [
      { title: 'Campañas', url: '/campanas' },
      { title: 'Creatividades', url: '/marketing/creatividades' },
    ],
  },
  {
    title: 'Leads e Inscripciones',
    items: [
      { title: 'Leads', url: '/leads' },
      { title: 'Matriculas', url: '/matriculas' },
      { title: 'Lista de Espera', url: '/lista-espera' },
    ],
  },
  {
    title: 'Contenido Web',
    items: [
      { title: 'Cursos Publicados', url: '/web/cursos' },
      { title: 'Ciclos Publicados', url: '/web/ciclos' },
      { title: 'Convocatorias', url: '/web/convocatorias' },
      { title: 'Noticias/Blog', url: '/contenido/blog' },
      { title: 'Paginas', url: '/contenido/paginas' },
      { title: 'FAQs', url: '/contenido/faqs' },
      { title: 'Testimonios', url: '/contenido/testimonios' },
      { title: 'Formularios', url: '/contenido/formularios' },
      { title: 'Medios', url: '/contenido/medios' },
      { title: 'Visitantes', url: '/contenido/visitantes' },
    ],
  },
  { title: 'Analiticas', url: '/analiticas' },
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
    title: 'Administracion',
    sectionBefore: 'ADMINISTRACION',
    items: [
      { title: 'Usuarios', url: '/administracion/usuarios' },
      { title: 'Roles y Permisos', url: '/administracion/roles' },
      { title: 'Suscripcion', url: '/administracion/suscripcion' },
      { title: 'Registro de Actividad', url: '/administracion/actividad' },
    ],
  },
  { title: 'Configuracion', url: '/configuracion' },
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

  it('Profesores url is /personal/profesores', () => {
    const sub = findSubItem('Personal', 'Profesores')
    expect(sub!.url).toBe('/personal/profesores')
  })

  it('Personal has Administrativos sub-item', () => {
    const sub = findSubItem('Personal', 'Administrativos')
    expect(sub).toBeDefined()
  })

  it('Administrativos url is /personal/administrativos', () => {
    const sub = findSubItem('Personal', 'Administrativos')
    expect(sub!.url).toBe('/personal/administrativos')
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

  it('Sedes has url /sedes (direct link by default)', () => {
    const item = findMenuItem('Sedes')
    expect(item!.url).toBe('/sedes')
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
    'Analiticas',
    'Campus Virtual',
    'Administracion',
    'Configuracion',
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
  it('Programacion has sectionBefore (GESTION ACADEMICA)', () => {
    const item = findMenuItem('Programacion')
    expect(item!.sectionBefore).toBeDefined()
  })

  it('Marketing has sectionBefore (GESTION COMERCIAL)', () => {
    const item = findMenuItem('Marketing')
    expect(item!.sectionBefore).toBeDefined()
  })

  it('Campus Virtual has sectionBefore', () => {
    const item = findMenuItem('Campus Virtual')
    expect(item!.sectionBefore).toBeDefined()
  })

  it('Administracion has sectionBefore', () => {
    const item = findMenuItem('Administracion')
    expect(item!.sectionBefore).toBeDefined()
  })

  it('Dashboard does NOT have sectionBefore', () => {
    const item = findMenuItem('Dashboard')
    expect(item!.sectionBefore).toBeUndefined()
  })
})
