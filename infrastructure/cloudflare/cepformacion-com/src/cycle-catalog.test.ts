import { describe, expect, it } from 'vitest'
import {
  publicCycleRows,
  renderCycleTable,
  rewriteCycleCatalog,
  rewriteHomeCycles,
  rewriteHomeCyclesHeading,
} from './cycle-catalog'
import type { CatalogSnapshot } from './render'

const snapshot = {
  data: {
    cycles: [
      { slug: 'cfgs-higiene-bucodental', name: 'Higiene Bucodental', level: 'grado_superior' },
      { slug: 'cfgm-farmacia-parafarmacia', name: 'Farmacia y Parafarmacia', level: 'grado_medio' },
      { slug: 'qa-ciclo-omega', name: 'QA Ciclo Omega', level: 'grado_medio' },
    ],
    convocatorias: [
      { codigo: 'CIC-1', status: 'enrollment_open', cycle: { slug: 'cfgm-farmacia-parafarmacia' } },
    ],
    courses: [],
  },
} as unknown as CatalogSnapshot

describe('cycle catalog table', () => {
  it('keeps official cycles and drops QA', () => {
    expect(publicCycleRows(snapshot).map((row) => row.slug)).toEqual([
      'cfgm-farmacia-parafarmacia',
      'cfgs-higiene-bucodental',
    ])
  })

  it('renders a sortable table with green open badge', () => {
    const html = renderCycleTable(publicCycleRows(snapshot))
    expect(html).toContain('data-cep-cycle-table="1"')
    expect(html).toContain('Ordenar por nombre')
    expect(html).toContain('Ordenar por área')
    expect(html).toContain('Ordenar por matrícula')
    expect(html).toContain('↕')
    expect(html).toContain('Farmacia y parafarmacia')
    expect(html).toContain('Grado medio')
    expect(html).toContain('[data-cep-chip="open"]{')
    expect(html).toContain('background:#16a34a')
    expect(html).toContain('Matrícula abierta')
  })

  it('centers the home ciclos heading', () => {
    const html = rewriteHomeCyclesHeading(
      '<h2>Ciclos formativos oficiales</h2><p>Texto previo.</p>',
    )
    expect(html).toContain('mx-auto max-w-3xl text-center text-3xl')
    expect(html).toContain('Oferta oficial con foco en empleabilidad y continuidad académica.')
  })

  it('keeps origin ciclo photo cards and locks the centered heading', () => {
    const html = rewriteHomeCycles(
      `<section>
        <h2>Ciclos formativos oficiales</h2>
        <p>Texto previo.</p>
        <div class="mt-10 grid gap-8 lg:grid-cols-2">
          <a href="/ciclos/cfgm-farmacia-parafarmacia"><img src="/farmacia.png" alt="Farmacia"><h3>Farmacia y Parafarmacia</h3></a>
        </div>
      </section>`,
      snapshot,
    )
    expect(html).toContain('src="/farmacia.png"')
    expect(html).not.toContain('data-cep-home-cycle-card="1"')
    expect(html).toContain('data-cep-home-cycles-heading-lock="1"')
    expect(html).toContain('mx-auto max-w-3xl text-center text-3xl')
  })

  it('builds the table from origin cards when the catalog has no cycles', () => {
    const html = rewriteCycleCatalog(`<main><div class="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
      <article><h2>Farmacia y Parafarmacia</h2><a href="/ciclos/cfgm-farmacia-parafarmacia">Ver ciclo</a><span>Matrícula abierta</span></article>
      <article><h2>Higiene Bucodental</h2><a href="/ciclos/cfgs-higiene-bucodental">Ver ciclo</a></article>
    </div></main>`)
    expect(html).toContain('data-cep-cycle-cards="1"')
    expect(html).toContain('md:grid-cols-2')
    expect(html).toContain('repeat(2,minmax(0,1fr))')
    expect(html).toContain('farmacia-hero.png')
    expect(html).toContain('higiene-hero.png')
    expect(html).toContain('Ver ciclo')
    expect(html).not.toContain('<article')
  })

  it('replaces the empty ciclos listing with the photo cards', () => {
    const html = rewriteCycleCatalog(
      '<main><div class="py-16 text-center text-slate-500"><p class="text-lg">Próximamente disponibles</p></div></main>',
      snapshot,
    )
    expect(html).toContain('data-cep-cycle-cards="1"')
    expect(html).toContain('Higiene Bucodental')
    expect(html).not.toContain('Próximamente disponibles')
    expect(html).toContain('data-cep-cycle-cards-lock="1"')
  })
})
