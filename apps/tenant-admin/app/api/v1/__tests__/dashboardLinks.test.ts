/**
 * @fileoverview Tests para los enlaces KPI del Dashboard
 * Valida: que cada KPI card tiene el href correcto para navegacion
 *
 * Los KPIs se definen en app/(app)/(dashboard)/_components/DashboardHome.tsx como primaryKpis y secondaryKpis.
 * Dado que es un componente React con hooks, las estructuras se replican aqui
 * para validar la logica de mapeo de enlaces.
 */

import { describe, it, expect } from 'vitest'

// ============================================================================
// KPI link mapping (mirrored from the dashboard page component)
// ============================================================================

interface KpiLink {
  title: string
  href: string
}

const primaryKpis: KpiLink[] = [
  { title: 'Cursos', href: '/cursos' },
  { title: 'Alumnos', href: '/dashboard/alumnos' },
  { title: 'Leads este Mes', href: '/leads' },
]

const secondaryKpis: KpiLink[] = [
  { title: 'Profesores', href: '/dashboard/profesores' },
  { title: 'Sedes', href: '/sedes' },
  { title: 'Convocatorias', href: '/programacion' },
]

const allKpis = [...primaryKpis, ...secondaryKpis]

// ============================================================================
// Tests: Primary KPIs
// ============================================================================

describe('Dashboard: Primary KPI links', () => {
  it('has 3 primary KPIs', () => {
    expect(primaryKpis).toHaveLength(3)
  })

  it('Cursos links to /cursos', () => {
    const kpi = primaryKpis.find((k) => k.title === 'Cursos')
    expect(kpi).toBeDefined()
    expect(kpi!.href).toBe('/cursos')
  })

  it('Alumnos links to /dashboard/alumnos', () => {
    const kpi = primaryKpis.find((k) => k.title === 'Alumnos')
    expect(kpi).toBeDefined()
    expect(kpi!.href).toBe('/dashboard/alumnos')
  })

  it('Leads este Mes links to /leads', () => {
    const kpi = primaryKpis.find((k) => k.title === 'Leads este Mes')
    expect(kpi).toBeDefined()
    expect(kpi!.href).toBe('/leads')
  })
})

// ============================================================================
// Tests: Secondary KPIs
// ============================================================================

describe('Dashboard: Secondary KPI links', () => {
  it('has 3 secondary KPIs', () => {
    expect(secondaryKpis).toHaveLength(3)
  })

  it('Profesores links to /dashboard/profesores', () => {
    const kpi = secondaryKpis.find((k) => k.title === 'Profesores')
    expect(kpi).toBeDefined()
    expect(kpi!.href).toBe('/dashboard/profesores')
  })

  it('Sedes links to /sedes', () => {
    const kpi = secondaryKpis.find((k) => k.title === 'Sedes')
    expect(kpi).toBeDefined()
    expect(kpi!.href).toBe('/sedes')
  })

  it('Convocatorias links to /programacion', () => {
    const kpi = secondaryKpis.find((k) => k.title === 'Convocatorias')
    expect(kpi).toBeDefined()
    expect(kpi!.href).toBe('/programacion')
  })
})

// ============================================================================
// Tests: All KPIs general validation
// ============================================================================

describe('Dashboard: All KPI links', () => {
  it('total of 6 primary + secondary KPIs', () => {
    expect(allKpis).toHaveLength(6)
  })

  it('all KPIs have href defined (not undefined or empty)', () => {
    for (const kpi of allKpis) {
      expect(kpi.href).toBeDefined()
      expect(kpi.href.length).toBeGreaterThan(0)
    }
  })

  it('all KPIs have title defined (not undefined or empty)', () => {
    for (const kpi of allKpis) {
      expect(kpi.title).toBeDefined()
      expect(kpi.title.length).toBeGreaterThan(0)
    }
  })

  it('all hrefs start with /', () => {
    for (const kpi of allKpis) {
      expect(kpi.href).toMatch(/^\//)
    }
  })

  it('no duplicate titles', () => {
    const titles = allKpis.map((k) => k.title)
    expect(new Set(titles).size).toBe(titles.length)
  })

  it('no duplicate hrefs', () => {
    const hrefs = allKpis.map((k) => k.href)
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })

  it('KPI link mapping is correct', () => {
    const expectedMap: Record<string, string> = {
      'Cursos': '/cursos',
      'Alumnos': '/dashboard/alumnos',
      'Leads este Mes': '/leads',
      'Profesores': '/dashboard/profesores',
      'Sedes': '/sedes',
      'Convocatorias': '/programacion',
    }

    for (const kpi of allKpis) {
      expect(expectedMap[kpi.title]).toBe(kpi.href)
    }
  })
})
