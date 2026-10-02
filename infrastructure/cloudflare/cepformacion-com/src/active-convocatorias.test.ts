import { describe, expect, it } from 'vitest'
import { activeRuns, replaceActiveConvocatorias } from './active-convocatorias'
import type { CatalogSnapshot } from './render'

const snapshot = {
  data: {
    courses: [],
    convocatorias: [
      {
        codigo: 'NOR-2026-009',
        status: 'enrollment_open',
        startDate: '2026-10-01',
        trainingLine: 'privado',
        course: { nombre: 'Auxiliar clínico veterinario', imageUrl: '/api/media/file/atv.webp' },
        campus: { name: 'Sede Norte' },
      },
      {
        codigo: 'PRIV-SUR-2026-001',
        status: 'published',
        startDate: '2026-09-01',
        trainingLine: 'privado',
        course: { nombre: 'Quiromasaje' },
        campus: { name: 'Sede CEP Sur' },
      },
      {
        codigo: 'SC-2026-016',
        status: 'enrollment_open',
        startDate: '2026-10-26',
        trainingLine: 'privado',
        course: { nombre: 'Peluquería', imageUrl: '/api/media/file/pelu.webp' },
        campus: { name: 'Sede Santa Cruz' },
      },
      {
        codigo: 'DES-SUR-2026-004',
        status: 'enrollment_open',
        startDate: '2026-10-20',
        trainingLine: 'ocupados',
        course: { nombre: 'Plan de acogida', imageUrl: '/api/media/file/acogida.webp' },
        campus: { name: 'Sede CEP Sur' },
      },
      {
        codigo: 'ONL-2026-001',
        status: 'enrollment_open',
        startDate: '2026-05-11',
        trainingLine: 'teleformacion',
        course: { nombre: 'Tatuador', slug: 'tatuaje-tel' },
        campus: { name: 'Sin sede' },
      },
    ],
  },
} as unknown as CatalogSnapshot

describe('active convocatorias', () => {
  it('keeps open runs on the three sedes and drops scheduled and teleformación', () => {
    const runs = activeRuns(snapshot)
    expect(runs.map((run) => run.codigo).sort()).toEqual(['DES-SUR-2026-004', 'NOR-2026-009', 'SC-2026-016'])
    const html = replaceActiveConvocatorias(
      '<div class="space-y-10"><article>vieja</article></div>',
      snapshot,
    )
    expect(html.indexOf('CEP NORTE')).toBeLessThan(html.indexOf('CEP SANTA CRUZ'))
    expect(html.indexOf('CEP SANTA CRUZ')).toBeLessThan(html.indexOf('CEP SUR'))
    expect(html).toContain('Privados')
    expect(html).toContain('Trabajadores desempleados/as')
    expect(html).toContain('Trabajadores ocupados')
    expect(html).toContain('100% gratuito')
    expect(html).toContain('/api/media/file/atv.webp')
    expect(html).toContain('cep-conv-card')
    expect(html).toContain('cep-conv-row')
    expect(html).toContain('Vista en cuadrícula')
    expect(html).toContain('Vista de lista')
    expect(html).toContain('grid-template-columns:repeat(3,minmax(0,1fr))')
    expect(html).toContain('.cep-conv-row .cep-conv-cta{width:auto;align-self:flex-start')
    expect(html).toContain('#1e3a8a')
    expect(html).not.toContain('md:grid-cols-[240px_1fr]')
    expect(html).not.toContain('PRIV-SUR-2026-001')
    expect(html).not.toContain('ONL-2026-001')
    expect(html).not.toContain('vieja')
  })
})
