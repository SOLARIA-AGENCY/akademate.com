import { describe, expect, it } from 'vitest'
import {
  bindSedeRunsToCourses,
  catalogFromOriginHtml,
  catalogHasHomeCourses,
  coalesceCatalog,
  convocatoriasFromSedeHtml,
  coursesFromOriginHtml,
  cyclesFromOriginHtml,
  convocatoriasFromOriginHtml,
  flightRunsFromHtml,
  applyOvhHomeCatalog,
  mergeConvocatorias,
} from './catalog-from-html'
import type { CatalogSnapshot } from './render'

const originHome = `<main>
<section id="nuevas-formaciones"><a class="group flex h-full" href="/p/cursos/logistica-en-la-cocina-des"><img alt="Logística cocina" src="/foto.jpg"><h3>Logística en la cocina</h3></a></section>
<section>
  <h2>Cursos</h2>
  <p>Consulta de un vistazo todos los cursos que imparte CEP Formación, agrupados por tipo de formación.</p>
  <a class="group h-5" href="/p/cursos/adiestramiento-canino-i-priv">
    <span>Cursos privados</span>
    <span>Área Veterinaria y Bienestar Animal</span>
    <h3>Adiestramiento Canino I</h3>
    <span>Matrícula abierta</span>
  </a>
  <a href="/p/cursos/gestion-de-redes-ocu">
    <span>Cursos para ocupados</span>
    <h3>Gestión de redes</h3>
    <span>40 h</span>
    <span>Teleformación</span>
  </a>
</section>
<section>
  <h2>Ciclos formativos oficiales</h2>
  <div class="mt-10 grid gap-8 lg:grid-cols-2">
    <a href="/ciclos/cfgm-farmacia-parafarmacia"><h3>Farmacia y Parafarmacia</h3><p>Grado medio</p></a>
    <a href="/ciclos/cfgs-higiene-bucodental"><h3>Higiene Bucodental</h3><p>Grado superior</p></a>
    <a href="/ciclos/qa-ciclo-omega-persistencia"><h3>QA Ciclo Omega</h3></a>
  </div>
</section>
<a href="/convocatorias/SC-2026-020"><h3>Estéticas</h3><span>Matrícula abierta</span><dt>Inicio:</dt><dd>17 sept 2026</dd><dt>Sede:</dt><dd>Sede Santa Cruz</dd></a>
<a href="/convocatorias/SC-2026-008"><h3>Estéticas dup</h3><span>Matrícula cerrada</span><dt>Inicio:</dt><dd>17 sept 2026</dd></a>
</main>`

describe('catalogFromOriginHtml', () => {
  it('reads home courses, official ciclos and convocatoria badges from Hetzner HTML', () => {
    const snapshot = catalogFromOriginHtml(originHome)
    const sitemapPaths = snapshot.data.sitemap.map((entry) => entry.path)
    expect(sitemapPaths).toContain('/cursos/adiestramiento-canino-i-priv')
    expect(sitemapPaths).toContain('/ciclos/cfgm-farmacia-parafarmacia')
    expect(sitemapPaths).toContain('/convocatorias/SC-2026-020')
    expect(sitemapPaths).not.toContain('/ciclos/qa-ciclo-omega-persistencia')
    const slugs = snapshot.data.courses.map((course) => course.slug)
    expect(slugs).toContain('adiestramiento-canino-i-priv')
    expect(slugs).toContain('gestion-de-redes-ocu')
    expect(slugs).toContain('logistica-en-la-cocina-des')
    expect(snapshot.data.courses.find((course) => course.slug === 'adiestramiento-canino-i-priv')).toMatchObject({
      studyType: 'privados',
      enrollmentStatus: 'open',
    })
    expect(snapshot.data.courses.find((course) => course.slug === 'adiestramiento-canino-i-priv')?.durationHours).toBeNull()
    expect(snapshot.data.courses.find((course) => course.slug === 'gestion-de-redes-ocu')).toMatchObject({
      studyType: 'ocupados',
      durationHours: 40,
      modality: 'teleformacion',
    })
    expect(cyclesFromOriginHtml(originHome).map((cycle) => cycle.slug)).toEqual([
      'cfgm-farmacia-parafarmacia',
      'cfgs-higiene-bucodental',
    ])
    expect(convocatoriasFromOriginHtml(originHome)).toEqual([
      expect.objectContaining({
        codigo: 'SC-2026-020',
        status: 'enrollment_open',
        startDate: '2026-09-17',
        campus: { name: 'CEP Santa Cruz' },
      }),
      expect.objectContaining({ codigo: 'SC-2026-008', status: 'enrollment_closed', startDate: '2026-09-17' }),
    ])
    expect(catalogHasHomeCourses(snapshot)).toBe(true)
  })

  it('lets Hetzner HTML convocatorias win over a stale API catalog', () => {
    const htmlCatalog = catalogFromOriginHtml(originHome)
    const api = catalogFromOriginHtml(originHome)
    api.data.convocatorias = [
      {
        codigo: 'SC-2026-020',
        status: 'enrollment_closed',
        startDate: '2025-01-01',
        course: { nombre: 'Stale' },
      },
      { codigo: 'STALE-999', status: 'enrollment_open', course: { nombre: 'Ghost' } },
    ]
    api.data.courses = [{ slug: 'from-api', nombre: 'API', studyType: 'privados' }]
    const merged = coalesceCatalog(api, htmlCatalog)
    expect(merged.data.convocatorias.find((item) => item.codigo === 'SC-2026-020')).toMatchObject({
      status: 'enrollment_open',
      startDate: '2026-09-17',
      course: { nombre: 'Estéticas' },
    })
    expect(merged.data.convocatorias.some((item) => item.codigo === 'SC-2026-008')).toBe(true)
    expect(merged.data.convocatorias.some((item) => item.codigo === 'STALE-999')).toBe(true)
    expect(merged.data.courses.some((course) => course.slug === 'adiestramiento-canino-i-priv')).toBe(true)
    expect(merged.data.courses.some((course) => course.slug === 'from-api')).toBe(true)
  })

  it('fills courses from origin HTML when the API catalog is empty', () => {
    const empty = {
      ...catalogFromOriginHtml(''),
      data: { ...catalogFromOriginHtml('').data, courses: [] as CatalogSnapshot['data']['courses'] },
    }
    const merged = coalesceCatalog(empty, catalogFromOriginHtml(originHome))
    expect(coursesFromOriginHtml(originHome).length).toBeGreaterThan(0)
    expect(merged.data.courses.some((course) => course.slug === 'adiestramiento-canino-i-priv')).toBe(true)
  })

  it('reads listing article dates and sede without dropping them', () => {
    const listing = `<article class="group grid md:grid-cols-[240px_1fr]">
      <h2>Instructor o Instructora de Pilates</h2>
      <p>SC-2026-005</p>
      <span>Matrícula abierta</span>
      <span>Sede Santa Cruz · Aula 2</span>
      <span>21 de octubre de 2026 - 2 de junio de 2027</span>
      <a href="/convocatorias/SC-2026-005">VER CONVOCATORIA</a>
    </article>`
    expect(convocatoriasFromOriginHtml(listing)).toEqual([
      expect.objectContaining({
        codigo: 'SC-2026-005',
        status: 'enrollment_open',
        startDate: '2026-10-21',
        endDate: '2027-06-02',
        campus: { name: 'CEP Santa Cruz' },
      }),
    ])
  })

  it('reads the open date when the sede card markup is long', () => {
    const filler = `<span>${'x'.repeat(5000)}</span>`
    const sede = `<a aria-label="Ver convocatoria: Auxiliar Clinico Veterinario" href="/convocatorias/NOR-2026-009"><article><span>Cursos privados</span>${filler}<span>Matrícula abierta</span><p>Inicio 01 oct 2026</p></article></a>`
    expect(convocatoriasFromSedeHtml(sede, 'Sede Norte')).toEqual([
      expect.objectContaining({
        codigo: 'NOR-2026-009',
        status: 'enrollment_open',
        startDate: '2026-10-01',
        campus: { name: 'Sede Norte' },
      }),
    ])
  })

  it('binds a sede convocatoria to the shared course so the catalog can list both sedes', () => {
    const sede = `<a aria-label="Ver convocatoria: Agente Funerario (Tanatopraxia y Tanatoestetica)" href="/convocatorias/NOR-2026-013"><article><span>Cursos privados</span><span>Matrícula abierta</span><p>Inicio 26 oct 2026</p></article></a>`
    const courses = [{ slug: 'agente-funerario-tanatopraxia-y-tanatoestetica-priv', nombre: 'Agente funerario (tanatopraxia y tanatoestetica)' }]
    const runs = bindSedeRunsToCourses(courses, convocatoriasFromSedeHtml(sede, 'CEP Norte'))
    expect(runs).toEqual([
      expect.objectContaining({
        codigo: 'NOR-2026-013',
        status: 'enrollment_open',
        startDate: '2026-10-26',
        campus: { name: 'CEP Norte' },
        course: expect.objectContaining({ slug: 'agente-funerario-tanatopraxia-y-tanatoestetica-priv' }),
      }),
    ])
    const snapshot = mergeConvocatorias(catalogFromOriginHtml('<html></html>'), runs)
    expect(snapshot.data.convocatorias.some((item) => item.codigo === 'NOR-2026-013')).toBe(true)
    const telOnly = [{ slug: 'agente-funerario-tanatopraxia-y-tanatoestetica-tel', nombre: 'Agente funerario (tanatopraxia y tanatoestetica)' }]
    expect(bindSedeRunsToCourses(telOnly, convocatoriasFromSedeHtml(sede, 'CEP Norte'))).toEqual([])
  })

  it('keeps the course photograph from the card, not a bare link', () => {
    const html = `<a href="/p/cursos/ingles-priv">Inglés</a><a class="group block" href="/p/cursos/ingles-priv"><img src="https://cepformacion.akademate.com/api/media/file/ingles.webp" alt="Inglés"><h3>Inglés A1</h3><span>Área Empresa, Administración y Gestión</span></a>`
    expect(coursesFromOriginHtml(html)[0]).toMatchObject({
      slug: 'ingles-priv',
      imageUrl: '/api/media/file/ingles.webp',
      area: 'Empresa, Administración y Gestión',
    })
  })

  it('reads an OVH nextRun when the deadline sits before the start date', () => {
    const html =
      '"slug":"tatuaje-profesional-online","nombre":"Tatuaje profesional online","studyType":"teleformacion","nextRun":{"id":"85","codigo":"ONL-2026-001","href":"/convocatorias/ONL-2026-001","status":"enrollment_open","enrollmentDeadline":null,"startDate":"2026-05-11T00:00:00.000Z","endDate":"2027-05-11T00:00:00.000Z","scheduleLabel":"","campusLabel":""}'
    expect(flightRunsFromHtml(html)[0]).toMatchObject({
      codigo: 'ONL-2026-001',
      status: 'enrollment_open',
      trainingLine: 'teleformacion',
    })
    const legacy =
      '"slug":"canino-priv","studyType":"privados","nextRun":{"id":"1","codigo":"SC-2026-099","href":"/convocatorias/SC-2026-099","status":"enrollment_open","startDate":"2026-10-01","campusLabel":"Sede Santa Cruz"}'
    expect(flightRunsFromHtml(legacy)[0]?.codigo).toBe('SC-2026-099')
  })

  it('replaces the home runs with the OVH pages', () => {
    const base = catalogFromOriginHtml(
      '<a class="group" href="/p/cursos/canino-priv"><span>Cursos privados</span><h3>Canino</h3></a>',
    )
    base.data.courses[0]!.enrollmentStatus = 'open'
    base.data.convocatorias = [{ codigo: 'CONV-HETZNER', status: 'enrollment_open', course: { slug: 'canino-priv' } }]
    const page =
      '"slug":"tatuaje-profesional-online","nombre":"Tatuaje profesional online","studyType":"teleformacion","nextRun":{"id":"85","codigo":"ONL-2026-001","href":"/convocatorias/ONL-2026-001","status":"enrollment_open","enrollmentDeadline":null,"startDate":"2026-05-11T00:00:00.000Z","campusLabel":""}'
    const next = applyOvhHomeCatalog(base, [page])
    expect(next?.data.convocatorias.map((item) => item.codigo)).toEqual(['ONL-2026-001'])
    expect(next?.data.courses[0]?.enrollmentStatus).toBe('none')
    expect(applyOvhHomeCatalog(base, ['<html></html>'])?.data.convocatorias[0]?.codigo).toBe('CONV-HETZNER')
  })
})
