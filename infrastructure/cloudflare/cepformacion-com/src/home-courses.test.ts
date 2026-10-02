import { describe, expect, it } from 'vitest'
import {
  catalogPayload,
  courseHours,
  displayCourseTitle,
  displayModalityLabel,
  listedCourseModality,
  groupHomeCourses,
  replaceHomeCourseCatalog,
  replaceSectionContaining,
  renderHomeCourseCatalog,
} from './home-courses'
import type { CatalogSnapshot } from './render'

const snapshot: CatalogSnapshot = {
  meta: {
    tenant: 'cep-formacion',
    host: 'cepformacion.akademate.com',
    generatedAt: '2026-09-03T00:00:00.000Z',
    version: 'test',
    cacheTtlSeconds: 60,
  },
  data: {
    branding: { academyName: 'CEP Formación' },
    seo: { defaultTitle: 'CEP', defaultDescription: 'Formación', canonicalOrigin: 'https://cepformacion.com' },
    courses: [
      { slug: 'zumba', nombre: 'ZUMBA CLÍNICA', studyType: 'privados', enrollmentStatus: 'none' },
      { slug: 'aaa-extra', nombre: 'AAA Extra', studyType: 'privados', enrollmentStatus: 'none' },
      {
        slug: 'farmacia',
        nombre: 'Auxiliar de farmacia',
        studyTypeLabel: 'Privados',
        enrollmentStatus: 'open',
        durationHours: 180,
        modality: 'presencial',
        area: 'Área Sanitaria y Clínica',
        areaColor: '#E3003A',
      },
      {
        slug: 'canino',
        nombre: 'Adiestramiento Canino I',
        studyType: 'privados',
        enrollmentStatus: 'open',
        durationHours: 90,
        modality: 'presencial',
      },
      {
        slug: 'dietetica',
        nombre: 'Dietética',
        studyType: 'ocupados',
        enrollmentStatus: 'published',
      },
      {
        slug: 'cerrado',
        nombre: 'Peluquería canina',
        studyType: 'privados',
        enrollmentStatus: 'closed',
      },
      {
        slug: 'redes',
        nombre: 'Gestión de redes',
        studyType: 'desempleados',
        enrollmentStatus: 'none',
        modality: 'teleformacion',
        durationHours: 40,
      },
      { slug: 'online', nombre: 'Tatuaje online', studyType: 'teleformacion', enrollmentStatus: 'open' },
      { slug: 'sin-nombre', nombre: '', studyType: 'privados', enrollmentStatus: 'open' },
      { slug: '', nombre: 'Sin slug', studyType: 'privados', enrollmentStatus: 'open' },
      { id: 'xss', slug: 'xss', nombre: '<script>alert(1)</script>', studyType: 'desempleados', enrollmentStatus: 'none' },
    ],
    convocatorias: [
      {
        codigo: 'CONV-1',
        status: 'enrollment_open',
        startDate: '2026-10-21',
        campus: { name: 'Sede Santa Cruz' },
        classroomHours: 250,
        deliveryMode: 'presencial',
        course: { slug: 'dietetica', nombre: 'Dietética' },
      },
      {
        codigo: 'CONV-CLOSED',
        status: 'in_progress',
        startDate: '2026-09-01',
        course: { slug: 'cerrado', nombre: 'Peluquería canina' },
      },
    ],
    cycles: [],
    campuses: [],
    teachers: [],
    sitemap: [],
  },
}

describe('displayCourseTitle', () => {
  it('uses sentence case so names are readable', () => {
    expect(displayCourseTitle('AUXILIAR DE ÓPTICA')).toBe('Auxiliar de óptica')
    expect(displayCourseTitle('Adiestramiento Canino I')).toBe('Adiestramiento canino I')
    expect(displayCourseTitle('Adiestramiento Canino II')).toBe('Adiestramiento canino II')
    expect(displayCourseTitle('curso iii')).toBe('Curso III')
    expect(displayCourseTitle('  ')).toBe('')
    expect(displayCourseTitle('a')).toBe('A')
  })
})

describe('course meta', () => {
  it('keeps hours and modality from catalog fields without inventing them', () => {
    expect(courseHours({ durationHours: 180 })).toBe(180)
    expect(courseHours({ duracionReferencia: 72 })).toBe(72)
    expect(courseHours({ durationHours: 0, duracionReferencia: 40 })).toBe(40)
    expect(courseHours({ durationHours: -3 })).toBeNull()
    expect(courseHours({ duracionReferencia: 0 })).toBeNull()
    expect(courseHours({})).toBeNull()
    expect(displayModalityLabel({ modality: 'presencial' })).toBe('Presencial')
    expect(displayModalityLabel({ modality: 'teleformacion' })).toBe('Teleformación')
    expect(displayModalityLabel({ deliveryMode: 'semipresencial' })).toBe('Semipresencial')
    expect(displayModalityLabel({ studyType: 'privados' })).toBeNull()
    expect(displayModalityLabel({})).toBeNull()
    expect(listedCourseModality({})).toBe('Presencial')
    expect(listedCourseModality({ slug: 'auxiliar-optica-tel', nombre: 'Auxiliar de óptica' })).toBe('Teleformación')
    expect(listedCourseModality({ nombre: 'Seminario semipresencial' })).toBe('Semipresencial')
    expect(listedCourseModality({ slug: 'hotel-recepcion', nombre: 'Recepción de hotel' })).toBe('Presencial')
  })
})

describe('groupHomeCourses', () => {
  it('keeps privados, ocupados, desempleados and teleformación in that order', () => {
    const groups = groupHomeCourses(snapshot)
    expect(groups.map((group) => group.key)).toEqual(['privados', 'ocupados', 'desempleados', 'teleformacion'])
    expect(groups.map((group) => group.title)).toEqual([
      'Privados',
      'Trabajadores ocupados',
      'Trabajadores desempleados/as',
      'Teleformación',
    ])
    expect(groups[0]?.courses.map((course) => course.name)).toEqual([
      'Adiestramiento Canino I',
      'Auxiliar de farmacia',
      'Peluquería canina',
      'AAA Extra',
      'ZUMBA CLÍNICA',
    ])
    expect(groups.flatMap((group) => group.courses.map((course) => course.name))).toContain('Tatuaje online')
    expect(groups.flatMap((group) => group.courses.map((course) => course.name))).not.toContain('Sin slug')
    expect(groups.flatMap((group) => group.courses.map((course) => course.href))).not.toContain('/p/cursos/sin-nombre')
  })

  it('marks matrícula abierta from course status or an open convocatoria', () => {
    const groups = groupHomeCourses(snapshot)
    const privados = groups.find((group) => group.key === 'privados')?.courses || []
    const ocupados = groups.find((group) => group.key === 'ocupados')?.courses || []
    expect(privados.find((course) => course.href.endsWith('/farmacia'))?.enrollmentOpen).toBe(true)
    expect(privados.find((course) => course.href.endsWith('/zumba'))?.enrollmentOpen).toBe(false)
    expect(privados.find((course) => course.name === 'Peluquería canina')).toMatchObject({
      enrollmentOpen: false,
      badge: 'running',
      href: '/p/cursos/cerrado',
    })
    expect(privados.find((course) => course.href.endsWith('/zumba'))).toMatchObject({ badge: 'upcoming' })
    expect(ocupados[0]?.enrollmentOpen).toBe(true)
  })

  it('puts an open teleformación convocatoria in that list', () => {
    const extra = structuredClone(snapshot)
    extra.data.convocatorias.push({
      codigo: 'ONL-2026-001',
      status: 'enrollment_open',
      startDate: '2026-12-01',
      trainingLine: 'privados',
      course: { slug: 'canino', nombre: 'Tatuaje profesional online' },
    })
    const row = groupHomeCourses(extra)
      .find((group) => group.key === 'teleformacion')
      ?.courses.find((course) => course.href.includes('ONL-2026-001'))
    expect(row).toMatchObject({ enrollmentOpen: true, badge: 'open', campuses: ['CEP VIRTUAL'] })
    expect(
      groupHomeCourses(extra)
        .find((group) => group.key === 'privados')
        ?.courses.some((course) => course.href.includes('ONL-2026-001')),
    ).toBe(false)
  })

  it('uses the open convocatoria when the course slug only shares the stem', () => {
    const extra = structuredClone(snapshot)
    extra.data.courses.push({
      slug: 'dietetica-y-nutricion-online-priv',
      nombre: 'Dietética y nutrición online',
      studyType: 'privados',
      enrollmentStatus: 'open',
    })
    extra.data.convocatorias.push({
      codigo: 'SC-OPEN',
      status: 'enrollment_open',
      startDate: '2026-11-03',
      campus: { name: 'Sede Santa Cruz' },
      course: { slug: 'dietetica-y-nutricion-online', nombre: 'Dietética y nutrición online' },
    })
    const row = groupHomeCourses(extra)
      .flatMap((group) => group.courses)
      .find((course) => course.name.includes('nutrición'))
    expect(row?.href).toBe('/convocatorias/SC-OPEN')
    expect(row?.badge).toBe('open')
  })

  it('lists an open or in-progress convocatoria even when the card has no course slug', () => {
    const extra = structuredClone(snapshot)
    extra.data.convocatorias.push(
      {
        codigo: 'DES-SUR-2026-002',
        status: 'enrollment_open',
        startDate: '2026-10-05',
        campus: { name: 'Sede CEP Sur' },
        course: { nombre: 'Gestión de proyectos' },
      },
      {
        codigo: 'SC-2026-003',
        status: 'enrollment_open',
        startDate: '2026-05-11',
        campus: { name: 'Sede Santa Cruz' },
        course: { nombre: 'Auxiliar de clínicas estéticas' },
      },
    )
    const groups = groupHomeCourses(extra)
    const rows = groups.flatMap((group) => group.courses)
    expect(groups.find((group) => group.key === 'desempleados')?.courses.some((course) => course.href.endsWith('/DES-SUR-2026-002'))).toBe(true)
    expect(rows.find((course) => course.href.endsWith('/SC-2026-003'))).toMatchObject({
      badge: 'running',
      campuses: ['CEP SANTA CRUZ'],
    })
  })

  it('orders matrícula abierta by start date, nearest first', () => {
    const dated = structuredClone(snapshot)
    dated.data.courses.push(
      {
        slug: 'lejana',
        nombre: 'Alfa lejana',
        studyType: 'privados',
        enrollmentStatus: 'none',
      },
      {
        slug: 'cercana',
        nombre: 'Zeta cercana',
        studyType: 'privados',
        enrollmentStatus: 'none',
      },
    )
    dated.data.convocatorias.push(
      {
        codigo: 'LEJ',
        status: 'enrollment_open',
        startDate: '2027-03-05',
        course: { slug: 'lejana', nombre: 'Alfa lejana' },
      },
      {
        codigo: 'CER',
        status: 'enrollment_open',
        startDate: '2026-10-01',
        course: { slug: 'cercana', nombre: 'Zeta cercana' },
      },
    )
    const names = groupHomeCourses(dated)[0]?.courses.filter((course) => course.badge === 'open').map((course) => course.name)
    expect(names?.indexOf('Zeta cercana')).toBeLessThan(names?.indexOf('Alfa lejana') ?? -1)
    expect(names?.[0]).toBe('Zeta cercana')
  })

  it('sentence-cases payload names used by the hydration lock', () => {
    const payload = catalogPayload(snapshot)
    expect(payload[0]?.courses.map((course) => course.name)).toEqual([
      'Adiestramiento canino I',
      'Auxiliar de farmacia',
      'Peluquería canina',
      'Aaa extra',
      'Zumba clínica',
    ])
    const farmacia = payload[0]?.courses.find((course) => course.href.endsWith('/farmacia'))
    expect(farmacia).toMatchObject({ hours: 180, modality: 'Presencial', open: true, free: false, areaLabel: 'Sanitaria' })
    const zumba = payload[0]?.courses.find((course) => course.href.endsWith('/zumba'))
    expect(zumba).toMatchObject({ hours: null, modality: 'Presencial', open: false, badge: 'upcoming', free: false, areaLabel: null })
    const dietetica = payload.find((group) => group.key === 'ocupados')?.courses[0]
    expect(dietetica).toMatchObject({ hours: 250, modality: 'Presencial', open: true, free: true, areaLabel: 'Salud y deporte' })
    const redes = payload.find((group) => group.key === 'desempleados')?.courses.find((course) => course.href.endsWith('/redes'))
    expect(redes).toMatchObject({ free: false, areaLabel: 'Empresa' })
  })
})

describe('renderHomeCourseCatalog', () => {
  it('renders one column, sentence-case names, ver curso and a green badge only when open', () => {
    const html = renderHomeCourseCatalog(snapshot)
    expect(html).toContain('data-cep-course-column="1"')
    expect(html).toContain('data-cep-course-table="1"')
    expect(html).toContain('data-cep-course-css="1"')
    expect(html).toContain('data-cep-cell="name"')
    expect(html).toContain('data-cep-btn')
    expect(html).toContain('display:grid')
    expect(html).toContain('grid-template-areas:"name area campus start free open cta"')
    expect(html).toContain('display:flex!important;flex-direction:column!important')
    expect(html).toContain('[data-cep-cell="campus"]{order:3;flex:0 0 auto}')
    expect(html).toContain('[data-cep-cell="free"]{order:4;flex:0 0 auto}')
    expect(html).toContain('[data-kind="ocupados"] [data-cep-course-table],[data-kind="desempleados"] [data-cep-course-table]{display:flex!important;flex-direction:column!important')
    expect(html).not.toContain('grid-column:auto')
    expect(html).toContain('[data-cep-chip="campus"]{background:#fff;color:#0f172a;border:1px solid #e5e7eb;font-size:11px;text-transform:uppercase}')
    expect(html).toContain('data-cep-cell="cta"')
    expect(html).toContain('data-cep-cell="open"')
    expect(html).toContain('grid-template-columns:subgrid')
    expect(html).toContain('#ecfdf5')
    expect(html).toContain('data-cep-open="1"')
    expect(html).toMatch(/href="[^"]*\/farmacia"[^>]*data-cep-open="1"|data-cep-open="1"[^>]*href="[^"]*\/farmacia"/)
    expect(html).not.toMatch(/\/zumba"[^>]*data-cep-open/)
    expect(html).toContain('@media (max-width:1023px)')
    expect(html).toContain('grid-template-areas:"name name name name name" "area campus free open cta"')
    expect(html).toContain('@media (max-width:767px)')
    expect(html).toContain('overflow-x:hidden')
    expect(html).toContain('max-width:80rem')
    expect(html).toContain('padding:0 1rem')
    expect(html).not.toContain('max-width:44rem')
    expect(html).not.toContain('max-width:22rem')
    expect(html).not.toContain('max-width:56rem')
    expect(html).toContain('data-layout="stack"')
    expect(html).toContain('mx-auto max-w-3xl text-center text-3xl')
    expect(html).toContain('px-2 text-center text-lg')
    expect(html).toContain('[data-cep-chip="open"]{background:#16a34a')
    expect(html.replace('text-transform:uppercase', '')).not.toContain('uppercase')
    expect(html).not.toContain('sm:grid-cols-2')
    expect(html).toContain('text-overflow:ellipsis')
    expect(html).not.toContain('display:table-cell')
    expect(html).not.toContain('table-layout:fixed')
    expect(html).toContain('text-transform:none')
    expect(html).toContain('white-space:nowrap')
    expect(html).toContain('Ver&nbsp;curso')
    expect(html).toContain('100% gratuito')
    expect(html).toContain('Sanitaria')
    expect(html).toContain('Veterinaria')
    expect(html).toContain('Salud y deporte')
    expect(html).toContain('Empresa')
    expect(html).toContain('#059669')
    expect(html).toContain('[data-cep-chip="open"]{background:#16a34a')
    expect(html).toContain('data-kind="privados"')
    expect(html).toContain('data-kind="ocupados"')
    expect(html).toContain('data-kind="desempleados"')
    expect(html).toContain('#E3003A')
    expect(html).toContain('#16A34A')
    expect(html).toContain('#7C3AED')
    expect(html).toContain('#F59E0B')
    expect(html).toContain('#f2014b')
    expect(html).toContain('Zumba clínica')
    expect(html).toContain('Adiestramiento canino I')
    expect(html).toContain('180 h')
    expect(html).toContain('90 h')
    expect(html).toContain('250 h')
    expect(html).toContain('Presencial')
    expect(html).toContain('Teleformación')
    expect(html).not.toContain('ZUMBA CLÍNICA')
    expect(html).toContain('Tatuaje online')
    expect(html).toContain('id="home-courses-teleformacion"')
    expect(html).toContain('margin-top:64px')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html.indexOf('Privados')).toBeLessThan(html.indexOf('Trabajadores ocupados'))
    expect(html.indexOf('Trabajadores ocupados')).toBeLessThan(html.indexOf('Trabajadores desempleados/as'))
    expect(html.indexOf('id="home-courses-desempleados"')).toBeLessThan(html.indexOf('id="home-courses-teleformacion"'))
    expect(html).not.toContain('#2563eb')
    expect(html).not.toContain('#2563EB')
    const zumbaEnd = html.indexOf('</a>', html.indexOf('Zumba clínica'))
    const zumba = html.slice(html.indexOf('Zumba clínica'), zumbaEnd)
    expect(zumba).toContain('Ver&nbsp;curso')
    expect(zumba).toContain('Próximamente')
    expect(zumba).toContain('data-cep-chip="upcoming"')
    expect(zumba).not.toContain('Matrícula abierta')
    expect(zumba).not.toContain('100% gratuito')
    expect(zumba).not.toContain(' h')
    expect(zumba).toContain('data-cep-meta>Presencial')
    const farmaciaEnd = html.indexOf('</a>', html.indexOf('Auxiliar de farmacia'))
    const farmacia = html.slice(html.indexOf('Auxiliar de farmacia'), farmaciaEnd)
    expect(farmacia).toContain('Matrícula abierta')
    expect(farmacia).toContain('Sanitaria')
    expect(farmacia).not.toContain('100% gratuito')
    expect(farmacia).toContain('180 h · Presencial')
    expect(farmacia.indexOf('Sanitaria')).toBeLessThan(farmacia.indexOf('Matrícula abierta'))
    expect(farmacia.indexOf('Matrícula abierta')).toBeLessThan(farmacia.indexOf('Ver&nbsp;convocatoria'))
    expect(farmacia).not.toContain('Ver&nbsp;curso')
    const cerradoEnd = html.indexOf('</a>', html.indexOf('Peluquería canina'))
    const cerrado = html.slice(html.indexOf('Peluquería canina'), cerradoEnd)
    expect(cerrado).toContain('En curso')
    expect(cerrado).toContain('data-cep-chip="running"')
    expect(cerrado).toContain('Ver&nbsp;curso')
    expect(cerrado).not.toContain('Ver&nbsp;convocatoria')
    expect(cerrado).not.toContain('Matrícula abierta')
    const dieteticaEnd = html.indexOf('</a>', html.indexOf('Dietética'))
    const dietetica = html.slice(html.indexOf('Dietética'), dieteticaEnd)
    expect(dietetica).toContain('250 h · Presencial')
    expect(dietetica).toContain('100% gratuito')
    expect(dietetica).toContain('Salud y deporte')
    expect(dietetica.indexOf('Salud y deporte')).toBeLessThan(dietetica.indexOf('CEP SANTA CRUZ'))
    expect(dietetica.indexOf('CEP SANTA CRUZ')).toBeLessThan(dietetica.indexOf('21 oct 2026'))
    expect(dietetica.indexOf('21 oct 2026')).toBeLessThan(dietetica.indexOf('100% gratuito'))
    expect(dietetica.indexOf('100% gratuito')).toBeLessThan(dietetica.indexOf('Matrícula abierta'))
    expect(dietetica.indexOf('Matrícula abierta')).toBeLessThan(dietetica.indexOf('Ver&nbsp;convocatoria'))
    expect(html).toContain('href="/convocatorias/CONV-1"')
    const redesAt = html.indexOf('Gestión de redes')
    const redesEnd = html.indexOf('</a>', redesAt)
    const redes = html.slice(html.lastIndexOf('<a', redesAt), redesEnd)
    expect(redes).toContain('40 h · Teleformación')
    expect(redes).toContain('CEP VIRTUAL')
    expect(redes).toContain('data-cep-virtual="1"')
    expect(redes).not.toContain('100% gratuito')
    expect(redes).toContain('Empresa')
    expect(redes.indexOf('Empresa')).toBeLessThan(redes.indexOf('CEP VIRTUAL'))
    expect(redes.indexOf('CEP VIRTUAL')).toBeLessThan(redes.indexOf('Ver&nbsp;curso'))
  })
})

describe('replaceHomeCourseCatalog', () => {
  it('replaces the nested photo-card Cursos section and leaves the rest', () => {
    const html = `<main><section class="hero">Hero</section><section class="bg-[#fff7fa]"><div><h2>Cursos</h2><p>Consulta de un vistazo todos los cursos que imparte CEP Formación, agrupados por tipo de formación.</p><section id="privados">ficha pesada</section></div></section><section>Convocatorias</section></main>`
    const next = replaceHomeCourseCatalog(html, snapshot)
    expect(next).toContain('data-cep-home-courses="ovh"')
    expect(next).toContain('Hero')
    expect(next).toContain('Convocatorias')
    expect(next).not.toContain('ficha pesada')
    expect(next).toContain('Auxiliar de farmacia')
    expect(next).toContain('data-cep-home-courses-lock="1"')
    expect(next).toContain('home-courses-privados')
    expect(next).not.toContain('innerHTML')
    expect(next).toContain('data-cep-course-column="1"')
    expect(next).toContain('data-cep-course-table="1"')
    expect(next).toContain('data-cep-course-css="1"')
    expect(next).not.toContain('max-width:44rem')
    expect(next).toContain('data-cep-course-list="1"')
    expect(next).toContain("document.readyState === 'loading'")
    expect(next.indexOf('data-cep-home-courses-lock="1"')).toBeGreaterThan(next.indexOf('<body>'))
    expect(next).toContain('textContent')
    expect(next.match(/data-cep-home-courses-lock="1"/g)?.length).toBe(1)
  })

  it('still injects the lock script when the photo section marker is missing', () => {
    const next = replaceHomeCourseCatalog('<html><head></head><body><h1>Home</h1></body></html>', snapshot)
    expect(next).toContain('data-cep-home-courses-lock="1"')
    expect(next).toContain('Zumba clínica')
    expect(next.indexOf('data-cep-home-courses-lock="1"')).toBeGreaterThan(next.indexOf('</head>'))
    expect(next.indexOf('data-cep-home-courses-lock="1"')).toBeLessThan(next.indexOf('</body>'))
  })

  it('drops the origin Nuevas formaciones photo dump after injecting the Cursos table', () => {
    const html = `<main>
<section id="nuevas-formaciones" class="bg-[#fff7fa]"><h2>Nuevas formaciones</h2><img src="/foto.jpg" alt="dump"></section>
<section class="bg-[#fff7fa]"><h2>Cursos</h2><p>Consulta de un vistazo todos los cursos que imparte CEP Formación, agrupados por tipo de formación.</p><section id="privados">ficha pesada</section></section>
</main>`
    const next = replaceHomeCourseCatalog(html, snapshot)
    expect(next).toContain('data-cep-home-courses="ovh"')
    expect(next).not.toContain('ficha pesada')
    expect(next).not.toContain('<section id="nuevas-formaciones"')
    expect(next).toContain('<span id="nuevas-formaciones"></span>')
  })
})

describe('replaceSectionContaining', () => {
  it('replaces a nested section without eating the next sibling', () => {
    const html = `<section class="outer"><p>Consulta de un vistazo todos los cursos</p><section>inner</section></section><section>after</section>`
    const next = replaceSectionContaining(html, 'Consulta de un vistazo todos los cursos', '<section>NEW</section>')
    expect(next).toBe('<section>NEW</section><section>after</section>')
  })
})
