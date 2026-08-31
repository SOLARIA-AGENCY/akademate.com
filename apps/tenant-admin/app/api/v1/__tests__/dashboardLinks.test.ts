/**
 * @fileoverview Tests para los enlaces KPI del Dashboard
 * Contrato fuente de DashboardHome: 4 cards Alumnos, Leads, Matrículas, Convocatorias.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const home = readFileSync(
  join(process.cwd(), 'app/(app)/(dashboard)/_components/DashboardHome.tsx'),
  'utf8',
)

describe('Dashboard: KPI links', () => {
  it('exposes the four operational KPI titles', () => {
    expect(home).toContain("title: 'Alumnos'")
    expect(home).toContain("title: 'Leads'")
    expect(home).toContain("title: 'Matrículas'")
    expect(home).toContain("title: 'Convocatorias'")
  })

  it('links Alumnos and Matrículas to the students directory', () => {
    expect(home).toContain("href: '/dashboard/alumnos'")
  })

  it('links Leads to /leads', () => {
    expect(home).toContain("href: '/leads'")
  })

  it('links Convocatorias to /programacion', () => {
    expect(home).toContain("href: '/programacion'")
  })
})
