import { describe, expect, it } from 'vitest'
import { parseCourseDescriptions, parseCourseListCards, rewriteCourseCatalog, courseKindFromHref, omitIdleHomeCatalogLock } from './course-catalog'

function listCard(opts: {
  href: string
  title: string
  image: string
  open: boolean
  area: string
  modality: string
  start: string
  campus: string
}): string {
  const badge = opts.open
    ? '<span class="ml-auto rounded-full px-3 py-1 text-[10px] font-black text-white bg-green-600">Matrícula abierta</span>'
    : '<span class="ml-auto rounded-full px-3 py-1 text-[10px] font-black text-white bg-slate-500">Próximamente</span>'
  return `<a class="group block" href="${opts.href}"><div class="rounded-xl border text-card-foreground grid min-h-[112px] grid-cols-[112px_minmax(0,1fr)] overflow-hidden border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:min-h-[220px] sm:grid-cols-[220px_1fr]"><div class="relative aspect-square w-full overflow-hidden sm:w-[220px]"><img src="${opts.image}" alt="${opts.title}" class="h-full w-full object-cover object-center"/></div><div class="flex min-w-0 flex-col gap-4 p-5"><div class="grid gap-4 xl:grid-cols-[1fr_1.45fr]"><div class="min-w-0"><div class="mb-2 flex flex-wrap items-center justify-start gap-2"><span class="rounded-full px-3 py-1 text-[10px] font-black text-white" style="background-color:#E3003A">Cursos privados</span>${badge}</div><h3 class="line-clamp-2 text-xl font-black text-slate-950">${opts.title}</h3><p class="mt-1 text-sm leading-6 text-slate-600">Curso de formación profesional</p></div><div class="grid gap-3 rounded-xl bg-slate-50 p-4"><div class="grid gap-1 text-sm sm:grid-cols-[120px_minmax(0,1fr)]"><span class="font-bold text-slate-950">Área</span><span class="min-w-0 leading-relaxed text-slate-600 sm:text-right">${opts.area}</span></div><div class="grid gap-1 text-sm sm:grid-cols-[120px_minmax(0,1fr)]"><span class="font-bold text-slate-950">Modalidad</span><span class="min-w-0 leading-relaxed text-slate-600 sm:text-right">${opts.modality}</span></div><div class="grid gap-1 text-sm sm:grid-cols-[120px_minmax(0,1fr)]"><span class="font-bold text-slate-950">Inicio</span><span class="min-w-0 leading-relaxed text-slate-600 sm:text-right">${opts.start}</span></div><div class="grid gap-1 text-sm sm:grid-cols-[120px_minmax(0,1fr)]"><span class="font-bold text-slate-950">Sede</span><span class="min-w-0 leading-relaxed text-slate-600 sm:text-right">${opts.campus}</span></div></div></div><div class="mt-auto flex justify-end pt-2"><span class="inline-flex items-center justify-center gap-2 rounded-full bg-[#f2014b] px-5 py-3 text-sm font-black text-white">Ver curso</span></div></div></div></a>`
}

const listing = `<!doctype html><html><head></head><body>
<section id="privados">
<div class="grid gap-5">
${listCard({
  href: '/p/cursos/farmacia-y-dermocosmetica-priv',
  title: 'Auxiliar de Farmacia y Parafarmacia y Dermocosmética',
  image: 'https://cepformacion.com/api/media/file/farmacia.webp',
  open: true,
  area: 'Área Sanitaria y Clínica',
  modality: 'Presencial',
  start: '08 sept 2026',
  campus: 'CEP Santa Cruz',
})}
${listCard({
  href: '/p/cursos/adiestramiento-canino-ii-priv',
  title: 'Adiestramiento Canino II',
  image: 'https://cepformacion.com/api/media/file/canino.webp',
  open: false,
  area: 'Área Veterinaria y Bienestar Animal',
  modality: 'Presencial',
  start: '-',
  campus: '-',
})}
</div>
</section>
<script>self.__next_f.push([1,"{\\"slug\\":\\"farmacia-y-dermocosmetica-priv\\",\\"descripcion\\":\\"Formacion en auxiliar de farmacia, parafarmacia y dermocosmetica con atencion al publico y consejo profesional.\\"}"])</script>
<script>self.__next_f.push([1,"{\\"slug\\":\\"adiestramiento-canino-ii-priv\\",\\"descripcion\\":\\"Curso de formaci\\u00f3n profesional\\"}"])</script>
</body></html>`

describe('parseCourseListCards', () => {
  it('reads list facts and drops doubled Área / empty dashes', () => {
    const cards = parseCourseListCards(listing)
    expect(cards).toHaveLength(2)
    expect(cards[0]).toMatchObject({
      href: '/p/cursos/farmacia-y-dermocosmetica-priv',
      title: 'Auxiliar de farmacia y parafarmacia y dermocosmética',
      open: true,
      area: 'Sanitaria y Clínica',
      modality: 'Presencial',
      start: '08 sept 2026',
      campus: 'CEP Santa Cruz',
      campusHref: '/sedes/sede-santa-cruz',
      kind: 'privados',
      description:
        'Formacion en auxiliar de farmacia, parafarmacia y dermocosmetica con atencion al publico y consejo profesional.',
    })
    expect(cards[1]).toMatchObject({
      href: '/p/cursos/adiestramiento-canino-ii-priv',
      open: false,
      start: '',
      campus: '',
      campusHref: '',
      area: 'Veterinaria y Bienestar Animal',
      description: '',
    })
  })
})

describe('courseKindFromHref', () => {
  it('reads the catalog suffix', () => {
    expect(courseKindFromHref('/p/cursos/auxiliar-clinico-des')).toBe('desempleados')
    expect(courseKindFromHref('/p/cursos/cocina-ocu')).toBe('ocupados')
    expect(courseKindFromHref('/p/cursos/farmacia-y-dermocosmetica-priv')).toBe('privados')
    expect(courseKindFromHref('/p/cursos/aleman-basico-tel')).toBe('teleformacion')
  })
})
describe('parseCourseDescriptions', () => {
  it('reads real copy from the RSC payload and skips the dummy fallback', () => {
    expect(parseCourseDescriptions(listing)).toEqual({
      'farmacia-y-dermocosmetica-priv':
        'Formacion en auxiliar de farmacia, parafarmacia y dermocosmetica con atencion al publico y consejo profesional.',
    })
  })
})

describe('rewriteCourseCatalog', () => {
  function visible(html: string): string {
    const lock = html.indexOf('data-cep-course-catalog-lock="1"')
    return lock === -1 ? html : html.slice(0, lock)
  }

  it('keeps origin list markup for React and restores it before the grid view', () => {
    const html = rewriteCourseCatalog(listing)
    const body = visible(html)
    expect(html).toContain('data-cep-course-catalog-css="1"')
    expect(html).toContain('data-cep-course-catalog-lock="1"')
    expect(html).toContain('createElement')
    expect(html).toContain('restoreParked')
    expect(html).toContain('cuadr[ií]cula')
    expect(html).not.toContain('innerHTML')
    expect(body).toContain('sm:grid-cols-[220px_1fr]')
    expect(body).toContain('Sanitaria y Clínica')
    expect(html).toContain('p.mt-1.text-sm.leading-6.text-slate-600{display:none!important}')
    expect(html).toContain('[data-cep-copy="1"]')
    expect(html).toContain('fillDescriptions')
    expect(html).toContain('Formacion en auxiliar de farmacia')
    expect(html).not.toContain('"description":"Curso de formación profesional"')
    expect(html).toContain('paintOpenCards')
    expect(html).toContain('#ecfdf5')
    expect(html).toContain('preferGrid = true')
    expect(html).toContain('paintAllEnrollmentBadges')
    expect(html).toContain('#1d4ed8')
    expect(html).toContain('#16a34a')
    expect(html).toContain('#f2014b')
    expect(html).toContain('data-kind')
    expect(html).toContain('a.group.h-full[href*="/cursos/"] .bg-green-600')
    expect(html).toContain('a.group[href*="/cursos/"] .bg-green-600,a.group[href*="/cursos/"] .bg-emerald-600{background:#16a34a!important;color:#fff!important}')
    expect(html).not.toContain('a.group[href$="-priv"] .bg-green-600,a.group[href$="-priv"] .bg-emerald-600{background:#f2014b!important}')
    expect(html).toContain('markSedeLinks')
    expect(html).toContain('pinEnrollmentBadges')
    expect(html).toContain('hideEmptyFacts')
    expect(html).toContain("'/sedes/sede-santa-cruz'")
    expect(html).toContain('data-cep-sede')
    expect(html).toContain('translate:none!important')
    expect(html).not.toContain('translateY(-3px)')
  })

  it('closes the badge from Payload when the enrollment deadline has passed', () => {
    const html = rewriteCourseCatalog(listing, {
      meta: {
        tenant: 'cep-formacion',
        host: 'cepformacion.akademate.com',
        generatedAt: '2026-09-04T00:00:00.000Z',
        version: 'test',
        cacheTtlSeconds: 60,
      },
      data: {
        branding: {},
        seo: {},
        courses: [],
        convocatorias: [
          {
            codigo: 'SC-1',
            status: 'enrollment_open',
            enrollmentDeadline: '2026-09-01',
            course: { slug: 'farmacia-y-dermocosmetica-priv' },
          },
        ],
        cycles: [],
        campuses: [],
        teachers: [],
        sitemap: [],
      },
    } as never)
    expect(html).toContain('Matrícula cerrada')
    expect(html).toContain('"closed":true')
  })

  it('lists one ficha per convocatoria and does not split the catalog by sede', () => {
    const html = rewriteCourseCatalog(listing, {
      meta: {
        tenant: 'cep-formacion',
        host: 'cepformacion.akademate.com',
        generatedAt: '2026-09-26T00:00:00.000Z',
        version: 'test',
        cacheTtlSeconds: 60,
      },
      data: {
        branding: {},
        seo: {},
        courses: [],
        convocatorias: [
          {
            codigo: 'SC-2026-099',
            status: 'enrollment_open',
            startDate: '2027-03-02',
            course: { slug: 'farmacia-y-dermocosmetica-priv' },
            campus: { name: 'Santa Cruz de Tenerife' },
          },
          {
            codigo: 'NOR-2026-099',
            status: 'enrollment_open',
            startDate: '2027-04-06',
            course: { slug: 'farmacia-y-dermocosmetica-priv' },
            campus: { name: 'La Orotava' },
          },
        ],
        cycles: [],
        campuses: [],
        teachers: [],
        sitemap: [],
      },
    } as never)
    expect(html).toContain('/convocatorias/SC-2026-099')
    expect(html).toContain('/convocatorias/NOR-2026-099')
    expect(html).toContain('"campus":"CEP Santa Cruz"')
    expect(html).toContain('"campus":"CEP Norte"')
    expect(html).toContain('2 mar 2027')
    expect(html).toContain('6 abr 2027')
    expect(html).toContain('coursesForHref')
    expect(html).not.toContain('cep-sede-heading')
    expect(html).not.toContain('No hay cursos en esta sede')
    expect(html).toContain('[data-cep-cta="course"]{display:inline-flex!important;width:fit-content!important')
    expect(html).toContain('border-radius:999px!important;background:#fff!important')
    expect(html).toContain('.cep-course-list-cta a:not([data-cep-cta="course"]){background:#f2014b!important;color:#fff!important')
  })

  it('does not embed flight descriptions when the visible page has no catalog cards', () => {
    const syllabus = 'Utilizar el idioma con cierta seguridad. '.repeat(30)
    const html = rewriteCourseCatalog(`<!doctype html><html><body>
<script>self.__next_f.push([1,${JSON.stringify(JSON.stringify({ slug: 'ingles', descripcion: syllabus }))}])</script>
<section data-cep-home-courses="ovh"><a data-cep-course-row="1" href="/p/cursos/ingles">Inglés</a></section>
</body></html>`)
    expect(html).not.toContain('data-cep-course-catalog-lock')
    expect(html).toContain('Inglés')
    expect(html).toContain(syllabus)
  })

  it('drops the catalog lock on the home table when it has no cards to paint', () => {
    const html = omitIdleHomeCatalogLock(`<html><body>
<script data-cep-home-courses-lock="1">var groups = [];</script>
<script data-cep-course-catalog-lock="1">var COURSES = []; var DESCRIPTIONS = {"ingles":"${'aula '.repeat(40)}"};</script>
</body></html>`)
    expect(html).toContain('data-cep-home-courses-lock="1"')
    expect(html).not.toContain('data-cep-course-catalog-lock')
    expect(html).not.toContain('DESCRIPTIONS')
  })

  it('is idempotent and a no-op without list cards', () => {
    const once = rewriteCourseCatalog(listing)
    expect(rewriteCourseCatalog(once)).toBe(once)
    expect(rewriteCourseCatalog('<html><body><p>Hola</p></body></html>')).toBe('<html><body><p>Hola</p></body></html>')
  })

  it('still injects the sede lock when origin renders grid cards', () => {
    const html = rewriteCourseCatalog(`<!doctype html><html><head></head><body>
<a class="group h-full" href="/p/cursos/pilates"><div class="min-h-[560px] flex flex-col"><div class="grid gap-2 sm:grid-cols-2 mt-5"><div class="rounded-xl border"><div class="p-3">Sede CEP Santa Cruz</div></div></div></div></a>
</body></html>`)
    expect(html).toContain('data-cep-course-catalog-lock="1"')
    expect(html).toContain('grid-template-columns:repeat(3,minmax(0,1fr))')
    expect(html).toContain('markSedeLinks')
    expect(html).toContain('data-cep-grid-cta')
    expect(html).toContain('pinAreaChips')
    expect(html).toContain(':not([data-cep-chip="area"])')
    expect(html).toContain('Ver convocatoria')
    expect(html).toContain("'/sedes/sede-santa-cruz'")
  })
})
