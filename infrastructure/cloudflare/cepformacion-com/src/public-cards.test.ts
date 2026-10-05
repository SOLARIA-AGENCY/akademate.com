import { describe, expect, it } from 'vitest'
import {
  rewritePublicCards,
  extractCycleFactPayload,
  mosaicOpenConvocations,
  stripClosedListing,
  detectCycleLevel,
  cycleBadgeCopy,
  formatMosaicCampus,
  formatMosaicSchedule,
  groupHomeOpenMosaic,
} from './public-cards'

const ciclosListing = `<!doctype html><html><head></head><body>
<article>
  <span class="inline-flex" style="background-color:#16A34A;color:#FFFFFF">Grado Medio · CFGM</span>
  <span class="rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-800">Ref. SANMS</span>
  <h2>Farmacia y Parafarmacia</h2>
  <p class="mt-2">Ciclo Formativo de Grado Medio (LOE)</p>
  <p class="text-base leading-7 text-slate-600"><em>Ciclo Formativo de Grado Medio en Farmacia. Centro autorizado MEC 38017275.</em></p>
  <div class="mt-5 flex flex-wrap gap-2">
    <span class="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-[11px] font-bold text-slate-700">Régimen LOE</span>
    <span class="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-[11px] font-bold text-slate-700">500h de prácticas en empresa</span>
  </div>
  <span class="mt-0.5 block truncate text-xs text-slate-600">Sede Sede Santa Cruz</span>
</article>
</body></html>`

const homeCycle = `<a href="/ciclos/cfgm-farmacia-parafarmacia">
  <p style="background-color:#E3003A;color:#FFFFFF">GRADO MEDIO</p>
  <p class="text-sm leading-6 text-slate-700">Ciclo Formativo de Grado Medio (LOE) · Ref. SANMS · Semipresencial</p>
  <div class="flex flex-wrap gap-2">
    <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700">Régimen LOE</span>
    <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700">Titulación oficial reconocida por el Ministerio de Educación</span>
    <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700">Modalidad semipresencial (1 día/semana presencial)</span>
    <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700">500h de prácticas en empresa</span>
  </div>
</a>`

const convocatoriasListing = `<article class="group grid md:grid-cols-[240px_1fr]">
  <h2 class="line-clamp-2 text-xl font-extrabold uppercase leading-tight tracking-wide text-gray-950">AUXILIAR DE CLINICAS ESTETICAS</h2>
  <div class="min-w-0 p-6">
  <div class="grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
    <span class="flex items-center gap-2"><svg class="lucide lucide-map-pin h-4 w-4 text-red-600"></svg>Sede Santa Cruz</span>
    <span>11 de mayo de 2026</span>
    <span>lunes · 10:00-14:00</span>
    <span>0/22 plazas</span>
    <span>1100 €</span>
  </div>
  <div class="mt-5 grid gap-2 sm:grid-cols-2">
    <a class="inline-flex w-full items-center justify-center rounded-md bg-red-600 px-3 py-3 text-sm font-extrabold uppercase tracking-wide text-white hover:bg-red-700" href="/convocatorias/SC-2026-003">VER CONVOCATORIA</a>
    <a class="inline-flex w-full items-center justify-center rounded-md border border-red-200 bg-white px-3 py-3 text-sm font-extrabold uppercase tracking-wide text-red-700 hover:bg-red-50" href="/convocatorias/SC-2026-003">RESERVAR PLAZA</a>
  </div>
  </div>
</article>`

const homeConvocation = `<a style="border-color:#2563EB" href="/convocatorias/SC-2026-005">
  <span class="absolute right-4 top-4 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] shadow-lg" style="background-color:#E3003A;color:#FFFFFF">GRADO MEDIO</span>
  <span class="mb-2 inline-flex rounded-full bg-green-600 px-3 py-1">Matrícula abierta</span>
</a>`

describe('rewritePublicCards', () => {
  function visible(html: string): string {
    const lock = html.indexOf('data-cep-cards-lock="1"')
    return lock === -1 ? html : html.slice(0, lock)
  }

  it('strips duplicate ciclo chips, invented refs and italic copy', () => {
    const html = rewritePublicCards(ciclosListing)
    const body = visible(html)
    expect(html).toContain('data-cep-cards="1"')
    expect(html).toContain('data-cep-cards-lock="1"')
    expect(html).toContain('length < 6')
    expect(html).toContain('#1e3a8a')
    expect(body).toContain('Grado medio')
    expect(body).toContain('Ciclo formativo oficial')
    expect(body).toContain('CEP Santa Cruz')
    expect(body).not.toContain('Sede Santa Cruz')
    expect(body).not.toContain('Sede Sede')
    expect(body).toContain('Centro autorizado MEC 38017275')
    expect(body).not.toContain('<em>')
    expect(body).not.toContain('Régimen LOE')
    expect(body).not.toContain('Ref. SANMS')
    expect(body).not.toContain('#16A34A')
    expect(body).toContain('#3E091A')
    expect(html).toContain('span.border-rose-100{display:none!important}')
    expect(html).toContain("closest('[data-cep-area-page]')")
  })

  it('rewrites home ciclo cards to labeled official copy', () => {
    const body = visible(rewritePublicCards(homeCycle))
    expect(body).toContain('Grado medio')
    expect(body).toContain('Ciclo formativo oficial')
    expect(body).toContain('Modalidad')
    expect(body).toContain('Semipresencial')
    expect(body).toContain('Prácticas')
    expect(body).toContain('500 h en empresa')
    expect(body).not.toContain('SANMS')
    expect(body).not.toContain('Régimen LOE')
    expect(body).not.toContain('GRADO MEDIO')
  })

  it('keeps ciclo descriptions instead of collapsing them to the subtitle', () => {
    const body = visible(rewritePublicCards(ciclosListing))
    expect(body).toContain('Centro autorizado MEC 38017275')
    expect(body.match(/Ciclo formativo oficial/g)?.length).toBe(1)
  })

  it('sentence-cases convocation titles and uses CEP pink CTAs', () => {
    const html = rewritePublicCards(convocatoriasListing)
    const body = visible(html)
    expect(body).toContain('Auxiliar de clinicas esteticas')
    expect(body).not.toContain('font-extrabold uppercase')
    expect(body).toContain('Ver convocatoria')
    expect(body).toContain('bg-[#f2014b]')
    expect(body).toContain('text-[#f2014b]')
    expect(body).not.toContain('bg-red-600')
    expect(body).not.toContain('VER CONVOCATORIA')
    expect(body).not.toContain('mt-5 grid gap-2 sm:grid-cols-2')
    expect(body).toContain('mt-5 flex justify-end')
    expect(body).toContain('CEP Santa Cruz')
    expect(body).not.toContain('Sede Santa Cruz')
    expect(body).not.toContain('1100 €')
    expect(html).toContain('grid-template-columns:15.5rem minmax(0,1fr)!important')
    expect(html).toContain('transform:none!important')
    expect(html).not.toContain('composeConvocationCards')
    expect(html).not.toContain('facts.appendChild')
  })

  it('keeps a single matrícula badge and remaps forbidden blues', () => {
    const body = visible(rewritePublicCards(homeConvocation))
    expect(body).toContain('Matrícula abierta')
    expect(body).toContain('border-color:#3E091A')
    expect(body).not.toContain('GRADO MEDIO')
    expect(body).not.toContain('#2563EB')
    expect(body).not.toContain('#2563eb')
  })

  it('turns the home carousel into a wrapping 6-column mosaic of every open card', () => {
    const home = `<div class="mt-10"><div class="mb-5 flex items-center justify-between gap-4"><p>7 convocatorias disponibles</p><div class="flex gap-2" aria-label="Controles del carrusel"><button type="button" aria-label="Ver más convocatorias">next</button></div></div>
      <div role="region" aria-label="Convocatorias abiertas" class="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4">
        <a class="group flex min-w-0 shrink-0 basis-full snap-start flex-col overflow-hidden rounded-3xl border md:basis-[calc((100%_-_1.5rem)/2)] xl:basis-[calc((100%_-_3rem)/3)]" href="/convocatorias/NOR-2026-009">
          <span>Matrícula abierta</span><h3>ACV</h3><dt>Inicio:</dt><dd>01 oct 2026</dd>
        </a>
        <a class="group flex min-w-0 shrink-0 basis-full snap-start flex-col" href="/convocatorias/SC-2026-020">
          <span>Matrícula abierta</span><h3>Estéticas</h3>
        </a>
        <a class="group flex min-w-0 shrink-0 basis-full snap-start flex-col" href="/convocatorias/SC-CLOSED">
          <span>Matrícula cerrada</span><h3>Cerrado</h3>
        </a>
      </div></div>`
    const html = rewritePublicCards(`<html><head></head><body>${home}</body></html>`, undefined, '/')
    const page = html.slice(html.indexOf('<body>'), html.indexOf('data-cep-cards-lock'))
    expect(html).toContain('data-cep-convocatorias-mosaic="1"')
    expect(html).toContain('xl:grid-cols-5')
    expect(html).toContain('grid-template-columns:repeat(5,minmax(0,1fr))!important')
    expect(html).toContain('[aria-label="Controles del carrusel"]{display:none!important}')
    expect(page).not.toContain('overflow-x-auto')
    expect(page).not.toContain('snap-x')
    expect(page).not.toContain('Ver más convocatorias')
    expect(page).not.toContain('xl:basis')
    expect(page).toContain('01 oct 2026')
    expect(page).toContain('NOR-2026-009')
    expect(page).toContain('SC-2026-020')
    expect(mosaicOpenConvocations(home)).toContain('data-cep-convocatorias-mosaic="1"')
  })

  it('strips prices and pins mosaic card layout with a 2-line title slot', () => {
    const card = `<div role="region" aria-label="Convocatorias abiertas" class="flex snap-x">
      <a class="group flex min-w-0 shrink-0 basis-full snap-start flex-col" href="/convocatorias/NOR-2026-009">
        <div class="relative h-44"><img src="/acv.webp" alt="ACV"/></div>
        <div class="absolute bottom-4"><span class="mb-2 inline-flex rounded-full bg-green-600">Matrícula abierta</span>
        <h3 class="line-clamp-2">Auxiliar Clinico Veterinario</h3></div>
        <dl><div class="flex gap-2"><dt>Inicio:</dt><dd>01 oct 2026</dd></div>
        <div class="flex gap-2"><dt>Sede:</dt><dd>CEP Norte</dd></div>
        <div class="flex gap-2"><dt>Horario:</dt><dd>jueves · 17:00-20:00</dd></div>
        <div class="flex gap-2"><dt>Precio:</dt><dd>Consultar</dd></div></dl>
      </a>
      <a class="group flex min-w-0 shrink-0 basis-full snap-start flex-col" href="/convocatorias/SC-2026-016">
        <span>Matrícula abierta</span><h3>Peluquería</h3>
        <div class="flex gap-2"><dt>Precio:</dt><dd>630 €</dd></div>
      </a>
    </div>`
    const html = rewritePublicCards(`<html><head></head><body>${card}</body></html>`, undefined, '/')
    const page = html.slice(html.indexOf('<body>'), html.indexOf('data-cep-cards-lock'))
    expect(page).not.toMatch(/Precio:/)
    expect(page).not.toMatch(/630\s*€/)
    expect(page).not.toMatch(/Consultar/)
    expect(page).toContain('data-cep-chip="open"')
    expect(page).toContain('#16a34a')
    expect(page.indexOf('Matrícula abierta')).toBeLessThan(page.indexOf('Auxiliar Clinico Veterinario'))
    expect(page).toContain('data-cep-card-title="1"')
    expect(page).toContain('min-h-[2.3em]')
    expect(html).toContain('min-height:2.3em')
    expect(page).toContain('items-stretch')
    expect(html).toContain('xl:grid-cols-5')
    expect(page).not.toContain('Código:')
    expect(page).toContain('NOR-2026-009')
    expect(page).toContain('data-cep-card-photo="1"')
    expect(page).toContain('data-cep-card-sede="1"')
    expect(page.indexOf('Auxiliar Clinico Veterinario')).toBeLessThan(page.indexOf('data-cep-card-when="1"'))
    expect(page.indexOf('data-cep-card-when="1"')).toBeLessThan(page.indexOf('data-cep-card-sede="1"'))
    expect(page).toContain('01 oct 2026')
    expect(page).toContain('CEP NORTE')
    expect(page).not.toContain('CEP Norte')
    expect(page).not.toMatch(/data-cep-card-sede="1"[^>]*>\s*Sede\s/)
    expect(html).not.toContain("createTextNode('Sede ')")
    expect(page).toContain('J · 17:00-20:00')
    expect(page).not.toMatch(/\bjueves\b/i)
    expect(page).toContain('text-[#3E091A]')
    expect(page).toContain('data-cep-card-title="1"')
    expect(html).toContain('color:#3E091A!important')
    expect(html).not.toMatch(/data-cep-card-title="1"[^>]*text-white/)
  })

  it('splits Norte and Santa Cruz into separate mosaics and keeps the campus name bold', () => {
    const mosaic = `<div role="region" aria-label="Convocatorias abiertas" class="flex snap-x">
      <a class="group flex min-w-0 shrink-0 basis-full snap-start flex-col" href="/convocatorias/NOR-2026-009">
        <span>Matrícula abierta</span><h3>Auxiliar Clinico Veterinario</h3>
        <div class="flex gap-2"><dt>Sede:</dt><dd>CEP Norte</dd></div>
        <div class="flex gap-2"><dt>Inicio:</dt><dd>01 oct 2026</dd></div>
        <div class="flex gap-2"><dt>Horario:</dt><dd>jueves · 17:00-20:00</dd></div>
      </a>
      <a class="group flex min-w-0 shrink-0 basis-full snap-start flex-col" href="/convocatorias/SC-2026-016">
        <span>Matrícula abierta</span><h3>Peluquería Canina</h3>
        <div class="flex gap-2"><dt>Sede:</dt><dd>CEP Santa Cruz</dd></div>
        <div class="flex gap-2"><dt>Inicio:</dt><dd>26 oct 2026</dd></div>
        <div class="flex gap-2"><dt>Horario:</dt><dd>lunes · 16:00-19:00</dd></div>
      </a>
    </div>`
    const html = rewritePublicCards(`<html><head></head><body>${mosaic}</body></html>`, undefined, '/')
    const page = html.slice(html.indexOf('<body>'), html.indexOf('data-cep-cards-lock'))
    expect(page).toContain('data-cep-convocatorias-groups="1"')
    expect(page).toContain('data-cep-sede-group="norte"')
    expect(page).toContain('data-cep-sede-group="santa-cruz"')
    expect(page.indexOf('CEP NORTE')).toBeLessThan(page.indexOf('CEP SANTA CRUZ'))
    expect(page).toContain('<strong class="font-extrabold text-[#150702]">CEP NORTE</strong>')
    expect(page).toContain('<strong class="font-extrabold text-[#150702]">CEP SANTA CRUZ</strong>')
    expect(page.indexOf('Auxiliar Clinico Veterinario')).toBeLessThan(page.indexOf('data-cep-card-when="1"'))
    expect(page.indexOf('data-cep-card-when="1"')).toBeLessThan(page.indexOf('>CEP NORTE</strong>'))
    expect(page).toContain('data-cep-card-photo="1"')
    expect(page).toContain('data-cep-card-cta="1"')
    expect(html).toContain('#14532d')
    expect(html).toContain('pruneStaleCardFacts')
    expect(html).toContain('width:fit-content')
    const norte = page.slice(page.indexOf('data-cep-sede-group="norte"'), page.indexOf('data-cep-sede-group="santa-cruz"'))
    expect(norte).toContain('NOR-2026-009')
    expect(norte).not.toContain('SC-2026-016')
  })

  it('nests course types under each campus and fills an empty type with a notice', () => {
    const mosaic = `<div data-cep-convocatorias-mosaic="1" role="region" aria-label="Convocatorias abiertas"><a href="/convocatorias/NOR-2026-010">abierta</a></div>`
    const snapshot = {
      data: {
        convocatorias: [
          {
            codigo: 'NOR-2026-010',
            status: 'enrollment_open',
            startDate: '2026-10-28',
            course: { studyType: 'privados', slug: 'canino' },
            campus: { name: 'Sede Norte' },
          },
        ],
      },
    } as never
    const html = groupHomeOpenMosaic(mosaic, snapshot)
    expect(html.indexOf('CEP NORTE')).toBeLessThan(html.indexOf('CEP SANTA CRUZ'))
    expect(html.indexOf('CEP SANTA CRUZ')).toBeLessThan(html.indexOf('CEP SUR'))
    expect(html).toContain('Privados')
    expect(html).toContain('Trabajadores ocupados')
    expect(html).toContain('Trabajadores desempleados/as')
    expect(html).toContain('NOR-2026-010')
    expect(html).not.toContain('Ver más convocatorias')
    expect(html.match(/Próximamente más convocatorias/g)?.length).toBe(8)
    const norte = html.slice(html.indexOf('data-cep-sede-group="norte"'), html.indexOf('data-cep-sede-group="santa-cruz"'))
    expect(norte.indexOf('Privados')).toBeLessThan(norte.indexOf('Trabajadores ocupados'))
    expect(norte.indexOf('Trabajadores ocupados')).toBeLessThan(norte.indexOf('Trabajadores desempleados/as'))
    expect(norte).toContain('NOR-2026-010')
    const nortePriv = norte.slice(norte.indexOf('data-cep-kind-group="privados"'), norte.indexOf('data-cep-kind-group="ocupados"'))
    expect(nortePriv).toContain('NOR-2026-010')
    expect(nortePriv).not.toContain('Próximamente más convocatorias')
    const norteOcu = norte.slice(norte.indexOf('data-cep-kind-group="ocupados"'), norte.indexOf('data-cep-kind-group="desempleados"'))
    expect(norteOcu).toContain('Próximamente más convocatorias')
  })

  it('builds a card from the catalog when the origin carousel has no matching anchor', () => {
    const mosaic = `<div data-cep-convocatorias-mosaic="1" role="region" aria-label="Convocatorias abiertas"></div>`
    const snapshot = {
      data: {
        courses: [],
        convocatorias: [
          {
            codigo: 'SC-2026-099',
            status: 'enrollment_open',
            startDate: '2026-11-02',
            imageUrl: '/foto.jpg',
            course: { nombre: 'Revolución artificial', studyType: 'desempleados', slug: 'revolucion-des' },
            campus: { name: 'Sede Santa Cruz' },
          },
          {
            codigo: 'DES-SUR-2026-001',
            status: 'enrollment_open',
            startDate: '2026-11-02',
            course: { nombre: 'Oculto', studyType: 'desempleados' },
            campus: { name: 'Sede Sur' },
          },
          {
            codigo: 'NOR-2026-020',
            status: 'enrollment_open',
            startDate: '2026-12-01',
            course: { nombre: 'Yoga', studyType: 'privados', slug: 'yoga' },
            campus: { name: 'CEP Norte' },
          },
        ],
      },
    } as never
    const html = groupHomeOpenMosaic(mosaic, snapshot)
    expect(html).toContain('href="/convocatorias/SC-2026-099"')
    expect(html).toContain('Revolución artificial')
    expect(html).toContain('Ver convocatoria')
    expect(html).toContain('/foto.jpg')
    expect(html).not.toContain('DES-SUR-2026-001')
    expect(html).toContain('/convocatorias/NOR-2026-020')
    const santa = html.slice(html.indexOf('data-cep-sede-group="santa-cruz"'), html.indexOf('data-cep-sede-group="sur"'))
    expect(santa).toContain('SC-2026-099')
    expect(santa).toContain('Trabajadores desempleados/as')
    expect(santa).toContain('data-kind="desempleados"')
    expect(santa).toContain('100% gratuito')
    expect(html).toContain('data-kind="privados"')
    expect(santa).toContain('data-cep-card-when')
    expect(santa).not.toContain('Cursos para')
    const norte = html.slice(html.indexOf('data-cep-sede-group="norte"'), html.indexOf('data-cep-sede-group="santa-cruz"'))
    expect(norte).toContain('NOR-2026-020')
    expect(norte).toContain('CEP NORTE')
  })

  it('badges official CFGM/CFGS mosaic cards only', () => {
    const mosaic = `<div role="region" aria-label="Convocatorias abiertas">
      <a class="group flex min-w-0 shrink-0 basis-full snap-start flex-col" href="/convocatorias/SC-2026-001">
        <span>Matrícula abierta</span><h3>Farmacia y Parafarmacia</h3>
        <div class="flex gap-2"><dt>Precio:</dt><dd>6000 €</dd></div>
      </a>
      <a class="group flex min-w-0 shrink-0 basis-full snap-start flex-col" href="/convocatorias/SC-2026-002">
        <span>Matrícula abierta</span><h3>Higiene Bucodental</h3>
      </a>
      <a class="group flex min-w-0 shrink-0 basis-full snap-start flex-col" href="/convocatorias/SC-2026-015">
        <span>Matrícula abierta</span><h3>Auxiliar de Farmacia y Parafarmacia y Dermocosmética</h3>
      </a>
      <a class="group flex min-w-0 shrink-0 basis-full snap-start flex-col" href="/convocatorias/SC-2026-009">
        <span>Matrícula abierta</span><h3>Auxiliar de Odontologia e Higiene</h3>
      </a>
    </div>`
    const html = rewritePublicCards(`<html><head></head><body>${mosaic}</body></html>`, undefined, '/')
    const page = html.slice(html.indexOf('<body>'), html.indexOf('data-cep-cards-lock'))
    expect(page).toContain('Ciclo medio')
    expect(page).toContain('Ciclo superior')
    expect(page.match(/data-cep-chip="ciclo"/g)?.length).toBe(2)
    expect(page).not.toContain('6000')
    const privateFarma = page.slice(page.indexOf('SC-2026-015'), page.indexOf('SC-2026-009'))
    expect(privateFarma).not.toContain('Ciclo medio')
    expect(privateFarma).not.toContain('Ciclo superior')
  })

  it('abbreviates weekdays and uppercases mosaic campus labels with dark titles', () => {
    expect(formatMosaicSchedule('lunes a viernes · 10:00-14:00')).toBe('L - M - X - J - V · 10:00-14:00')
    expect(formatMosaicSchedule('de lunes a viernes')).toBe('L - M - X - J - V')
    expect(formatMosaicSchedule('lunes, miércoles, viernes · 10:00-14:00')).toBe('L - X - V · 10:00-14:00')
    expect(formatMosaicSchedule('jueves · 17:00-20:00')).toBe('J · 17:00-20:00')
    expect(formatMosaicSchedule('lunes y sábado · 16:00-19:00')).toBe('L - S · 16:00-19:00')
    expect(formatMosaicSchedule('10:00-14:00')).toBe('10:00-14:00')
    expect(formatMosaicCampus('CEP Norte')).toBe('CEP NORTE')
    expect(formatMosaicCampus('La Orotava')).toBe('CEP NORTE')
    expect(formatMosaicCampus('Cep Santa Cruz')).toBe('CEP SANTA CRUZ')
    expect(formatMosaicCampus('Santa Cruz de Tenerife')).toBe('CEP SANTA CRUZ')
    expect(formatMosaicCampus('Sur')).toBe('CEP SUR')
    const mosaic = `<div role="region" aria-label="Convocatorias abiertas">
      <a class="group flex min-w-0 shrink-0 basis-full snap-start flex-col" href="/convocatorias/NOR-2026-009">
        <span>Matrícula abierta</span><h3 class="text-white">Auxiliar Clinico Veterinario</h3>
        <div class="flex gap-2"><dt>Sede:</dt><dd>CEP Norte</dd></div>
        <div class="flex gap-2"><dt>Horario:</dt><dd>jueves · 17:00-20:00</dd></div>
      </a>
      <a class="group flex min-w-0 shrink-0 basis-full snap-start flex-col" href="/convocatorias/SC-2026-001">
        <span>Matrícula abierta</span><h3>Farmacia y Parafarmacia</h3>
        <div class="flex gap-2"><dt>Sede:</dt><dd>Santa Cruz de Tenerife</dd></div>
        <div class="flex gap-2"><dt>Horario:</dt><dd>lunes a viernes · 10:00-14:00</dd></div>
      </a>
      <a class="group flex min-w-0 shrink-0 basis-full snap-start flex-col" href="/convocatorias/SUR-2026-001">
        <span>Matrícula abierta</span><h3>Peluquería</h3>
        <div class="flex gap-2"><dt>Sede:</dt><dd>CEP Sur</dd></div>
        <div class="flex gap-2"><dt>Horario:</dt><dd>lunes, miércoles, viernes · 16:00-20:00</dd></div>
      </a>
    </div>`
    const html = rewritePublicCards(`<html><head></head><body>${mosaic}</body></html>`, undefined, '/')
    const page = html.slice(html.indexOf('<body>'), html.indexOf('data-cep-cards-lock'))
    expect(page).toContain('CEP NORTE')
    expect(page).toContain('CEP SANTA CRUZ')
    expect(page).toContain('CEP SUR')
    expect(page).not.toContain('CEP Norte')
    expect(page).not.toContain('CEP Santa Cruz')
    expect(page).not.toContain('CEP Sur')
    expect(page).not.toMatch(/\b(lunes|martes|miércoles|miercoles|jueves|viernes|Monday)\b/)
    expect(page).toContain('L - M - X - J - V · 10:00-14:00')
    expect(page).toContain('L - X - V · 16:00-20:00')
    expect(page).toContain('J · 17:00-20:00')
    expect(page).not.toContain('Lunes a viernes')
    expect(page).toContain('text-[#3E091A]')
    expect(html).toContain('[data-cep-card-title],')
    expect(html).toContain('color:#3E091A!important')
    const titleOpen = page.match(/<h3 data-cep-card-title="1"[^>]*>/)?.[0] || ''
    expect(titleOpen).toContain('text-[#3E091A]')
    expect(titleOpen).not.toContain('text-white')
    expect(titleOpen).not.toContain('#fff')
  })

  it('detects official cycles and ignores private farmacia lookalikes', () => {
    expect(detectCycleLevel({ title: 'Farmacia y Parafarmacia' })).toBe('medio')
    expect(detectCycleLevel({ title: 'Higiene Bucodental' })).toBe('superior')
    expect(detectCycleLevel({ href: '/p/ciclos/cfgm-farmacia-parafarmacia', title: 'Farmacia' })).toBe('medio')
    expect(detectCycleLevel({ title: 'Auxiliar de Farmacia y Parafarmacia y Dermocosmética' })).toBe(null)
    expect(detectCycleLevel({ title: 'Auxiliar de Odontologia e Higiene' })).toBe(null)
    expect(cycleBadgeCopy('medio')).toBe('Ciclo medio')
    expect(cycleBadgeCopy('superior')).toBe('Ciclo superior')
  })

  it('rewrites Next flight payloads and installs a hydration lock', () => {
    const payload = `self.__next_f.push([1,"span\\",{\\"className\\":\\"rounded-full border border-rose-100\\",\\"children\\":\\"Régimen LOE\\"}])`
    const html = rewritePublicCards(`<html><head></head><body>${payload}<span class="border-rose-100">Régimen LOE</span></body></html>`)
    expect(html).toContain('data-cep-cards-lock="1"')
    expect(html).toContain('data-cep-cards-css="1"')
    expect(html).toContain('#ecfdf5')
    expect(html).toContain('createTextNode')
    expect(html).not.toContain('innerHTML')
    expect(visible(html)).toContain('\\"children\\":\\"\\"')
  })

  it('keeps area CTAs on one line without arrows', () => {
    const html = rewritePublicCards(`<html><head></head><body>
      <a aria-label="Ver cursos de Área Sanitaria">
        <h3 class="line-clamp-3 min-h-[4.75rem] text-xl font-black uppercase leading-tight text-slate-950">Sanitaria y Clínica</h3>
        <span class="inline-flex min-w-[11rem]">Ver formaciones<svg class="lucide lucide-arrow-right size-4"></svg></span>
      </a>
    </body></html>`)
    const body = visible(html)
    expect(body).toContain('whitespace-nowrap')
    expect(body).not.toContain('min-w-[11rem]')
    expect(html).toContain('a[aria-label^="Ver cursos"] svg{display:none!important}')
  })

  it('is idempotent', () => {
    const once = rewritePublicCards(ciclosListing + convocatoriasListing)
    const twice = rewritePublicCards(once)
    expect(twice).toBe(once)
  })

  it('uses official campus names on sede cards', () => {
    const body = visible(rewritePublicCards(`<html><head></head><body>
      <h3>Sede CEP Sur</h3>
      <h3>Sede Norte</h3>
      <h3>Sede Santa Cruz</h3>
      <span class="block font-semibold text-slate-900">Santa Cruz</span>
      <span class="block font-semibold text-slate-900">Norte</span>
    </body></html>`))
    expect(body).toContain('>CEP Sur<')
    expect(body).toContain('>CEP Norte<')
    expect(body).toContain('>CEP Santa Cruz<')
    expect(body).not.toContain('Sede CEP Sur')
    expect(body).not.toContain('Sede Norte')
    expect(body).not.toContain('Sede Santa Cruz')
  })

  it('keeps a payload so hydration can restore ciclo facts', () => {
    const facts = extractCycleFactPayload(homeCycle)
    expect(facts[0]?.facts).toEqual([
      ['Modalidad', 'Semipresencial'],
      ['Prácticas', '500 h en empresa'],
    ])
    const html = rewritePublicCards(homeCycle)
    expect(html).toContain('data-cep-cycle-facts')
    expect(html).toContain('500 h en empresa')
    expect(html).toContain('createElement')
    expect(html).not.toContain('innerHTML')
  })

  it('closes convocation badges from Payload enrollmentDeadline', () => {
    const html = rewritePublicCards(homeConvocation, {
      data: {
        convocatorias: [
          {
            codigo: 'SC-2026-005',
            status: 'enrollment_open',
            enrollmentDeadline: '2026-09-01',
          },
        ],
      },
    } as never)
    expect(html).toContain('"SC-2026-005"')
    expect(html).toContain('paintClosedConvocations')
    expect(html).toContain('Convocatorias cerradas')
    expect(html).toContain(".closest('.cep-course-list-cta')")
  })

  it('removes closed convocatorias from the open listing', () => {
    const listing = `<article class="group"><a href="/p/convocatorias/SC-2026-005">Matrícula abierta</a></article>
<article class="group"><a href="/p/convocatorias/SC-2026-099">Abierta</a></article>`
    const snapshot = {
      data: {
        convocatorias: [
          { codigo: 'SC-2026-005', status: 'enrollment_closed' },
          { codigo: 'SC-2026-099', status: 'enrollment_open', enrollmentDeadline: '2026-12-01' },
        ],
      },
    } as never
    const html = rewritePublicCards(listing, snapshot, '/p/convocatorias')
    const body = visible(html)
    expect(body).not.toContain('SC-2026-005')
    expect(body).toContain('SC-2026-099')
    expect(stripClosedListing(listing, ['SC-2026-005'])).not.toContain('SC-2026-005')
  })
})
