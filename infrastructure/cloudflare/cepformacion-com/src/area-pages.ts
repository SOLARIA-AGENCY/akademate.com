import { expandCatalogRuns, parseCourseDescriptions, type CourseKind, type CourseListItem } from './course-catalog'
import { isHiddenPublicCycle } from './hidden-cycles'
import { resolveCourseArea, type CourseAreaBadge } from './home-course-areas'
import { displayCourseTitle, homeCourseSectionKey, listedCourseModality } from './home-courses'
import type { CatalogCourse, CatalogCycle, CatalogSnapshot } from './render'

type AreaSection = 'ciclos' | 'privados' | 'ocupados' | 'desempleados' | 'teleformacion'

type AreaPage = {
  slug: string
  title: string
  image: string
  matches: (badge: CourseAreaBadge | null) => boolean
}

const AREA_PAGES: AreaPage[] = [
  {
    slug: 'area-sanitaria-y-clinica',
    title: 'Área Sanitaria y Clínica',
    image: '/media/area-sanitaria-clinica.webp',
    matches: (badge) => badge?.code === 'SCLN',
  },
  {
    slug: 'area-veterinaria-y-bienestar-animal',
    title: 'Área Veterinaria y Bienestar Animal',
    image: '/media/area-veterinaria-bienestar-animal.webp',
    matches: (badge) => badge?.code === 'VETA',
  },
  {
    slug: 'area-salud-bienestar-y-deporte',
    title: 'Área Salud, Bienestar y Deporte',
    image: '/media/area-salud-bienestar-deporte.webp',
    matches: (badge) => badge?.code === 'SBD',
  },
  {
    slug: 'area-tecnologia-digital-y-diseno',
    title: 'Área Tecnología, Digital y Diseño',
    image: '/media/area-tecnologia-digital-diseno.webp',
    matches: (badge) => badge?.code === 'TDD',
  },
  {
    slug: 'area-empresa-administracion-y-gestion',
    title: 'Área Empresa, Administración y Gestión',
    image: '/media/area-empresa-administracion-gestion.webp',
    matches: (badge) => badge?.code === 'EAG',
  },
  {
    slug: 'area-seguridad-vigilancia-y-proteccion',
    title: 'Área Seguridad, Vigilancia y Protección',
    image: '/media/area-seguridad-vigilancia-proteccion.webp',
    matches: (badge) => badge?.code === 'SVP',
  },
  {
    slug: 'area-idiomas-y-competencias-linguisticas',
    title: 'Área Idiomas y Competencias Lingüísticas',
    image: '/website/cep/categories/idiomas-competencias-linguisticas.jpg',
    matches: (badge) => badge?.label === 'Idiomas',
  },
]

const SECTION_TITLES: Record<AreaSection, string> = {
  ciclos: 'Ciclos formativos',
  privados: 'Privados',
  ocupados: 'Trabajadores ocupados',
  desempleados: 'Trabajadores desempleados/as',
  teleformacion: 'Teleformación',
}

const SECTION_ORDER: AreaSection[] = ['ciclos', 'privados', 'ocupados', 'desempleados', 'teleformacion']

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function areaSlugFromPath(pathname: string): string | null {
  const match = pathname.replace(/\/+$/, '').match(/^\/(?:p\/)?areas\/([a-z0-9-]+)$/i)
  return match ? match[1].toLowerCase() : null
}

function areaPage(slug: string): AreaPage {
  return (
    AREA_PAGES.find((page) => page.slug === slug) || {
      slug,
      title: slug
        .split('-')
        .filter((part) => part !== 'area')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' '),
      image: '/website/cep/hero/cursos-privados-v2.jpg',
      matches: () => false,
    }
  )
}

function courseSection(course: CatalogCourse): AreaSection | null {
  const typed = homeCourseSectionKey(course)
  if (typed) return typed
  const raw = `${course.studyType || ''} ${course.studyTypeLabel || ''} ${course.slug || ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
  if (raw.includes('teleform') || /(?:^|-)tel$/.test(course.slug || '')) return 'teleformacion'
  return null
}

function courseBadge(course: CatalogCourse): CourseAreaBadge | null {
  return resolveCourseArea(course)
}

export function areaPageBody(
  snapshot: CatalogSnapshot | null,
  slug: string,
  descriptions: Record<string, string> = {},
): string {
  const page = areaPage(slug)
  const courses = (snapshot?.data.courses || []).filter((course) => course.slug && course.nombre && page.matches(courseBadge(course)))
  const cycles = (snapshot?.data.cycles || []).filter((cycle) => {
    if (!cycle.slug || !cycle.name || isHiddenPublicCycle(cycle.slug, cycle.name)) return false
    return page.matches(resolveCourseArea({ nombre: cycle.name }))
  })
  const groups = new Map<AreaSection, string[]>()
  for (const section of SECTION_ORDER) groups.set(section, [])
  for (const cycle of cycles) groups.get('ciclos')?.push(cycleCard(cycle))
  for (const course of courses) {
    const section = courseSection(course)
    if (!section || section === 'ciclos') continue
    const item = listItem(course, section, descriptions[course.slug] || '')
    for (const run of expandCatalogRuns(item, snapshot)) groups.get(section)?.push(gridCard(run))
  }
  const sections = SECTION_ORDER.map((section) => {
    const rows = groups.get(section) || []
    if (!rows.length) return ''
    return `<section data-cep-area-section="${section}">
      <h2>${escapeHtml(SECTION_TITLES[section])}</h2>
      <p>${rows.length} ${rows.length === 1 ? 'formación' : 'formaciones'}</p>
      <div data-cep-area-grid="1">${rows.join('')}</div>
    </section>`
  }).join('')
  const empty = sections
    ? ''
    : '<p data-cep-area-empty="1">No hay formaciones publicadas en esta área.</p>'
  return `<article data-cep-area-page="1">
    <section class="relative isolate min-h-[420px] overflow-hidden bg-slate-950 text-white sm:min-h-[480px]">
      <img src="${escapeHtml(page.image)}" alt="${escapeHtml(page.title)}" class="absolute inset-0 h-full w-full object-cover object-center">
      <div class="absolute inset-0 bg-gradient-to-r from-slate-950/55 via-slate-950/25 to-transparent" data-cep-area-hero="1" aria-hidden="true"></div>
      <div class="relative mx-auto flex min-h-[420px] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
        <div class="max-w-3xl">
          <p class="text-sm font-black text-rose-200">Área de formación</p>
          <h1 class="mt-4 text-4xl font-black leading-tight tracking-tight text-white sm:text-6xl">${escapeHtml(page.title)}</h1>
          <p class="mt-6 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl">Ciclos y cursos de esta área, separados por tipo de formación.</p>
        </div>
      </div>
    </section>
    <div class="mx-auto max-w-7xl space-y-12 px-4 py-14 sm:px-6 lg:px-8">${sections}${empty}</div>
    ${cardClicks()}
  </article>
  <style data-cep-area-css="1">
    [data-cep-area-page] section.relative.isolate>img.object-cover{object-position:center center!important}
    [data-cep-area-page] [data-cep-area-hero]{background-image:linear-gradient(to right,rgb(2 6 23/.45),rgb(2 6 23/.12) 42%,transparent 68%)!important}
    [data-cep-area-page] h2{margin:0 0 .35rem;color:#0f172a;font-size:1.7rem;font-weight:800}
    [data-cep-area-page] section[data-cep-area-section]>p{margin:0 0 1rem;color:#64748b}
    [data-cep-area-page] [data-cep-area-grid]{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:1.5rem!important;align-items:stretch}
    [data-cep-area-page] [data-cep-area-grid] a.group.h-full{display:flex!important;height:auto!important;min-height:0;color:inherit;text-decoration:none}
    [data-cep-area-page] [data-cep-area-grid] a.group.h-full>div[class*="min-h-[560px]"]{min-height:560px!important;height:auto!important}
    [data-cep-area-page] [data-cep-area-grid] .aspect-square{aspect-ratio:1/1!important;height:auto!important}
    @media (max-width:767px){[data-cep-area-page] [data-cep-area-grid]{grid-template-columns:minmax(0,1fr)!important}}
  </style>`
}

function listItem(course: CatalogCourse, kind: CourseKind, description = ''): CourseListItem {
  const badge = resolveCourseArea(course)
  return {
    href: `/cursos/${course.slug}`,
    title: displayCourseTitle(course.nombre),
    image: course.imagenPortada || course.imageUrl || '',
    open: course.enrollmentStatus === 'open',
    closed: course.enrollmentStatus === 'closed',
    kind,
    area: typeof course.area === 'string' ? course.area : '',
    areaLabel: badge?.label || '',
    areaColor: badge?.color || '#475569',
    modality: listedCourseModality(course),
    start: '',
    campus: '',
    campusHref: '',
    description: description || course.descripcion || '',
    convocatoriaHref: '',
  }
}

function gridCard(course: CourseListItem, labels?: { badge?: string; course?: string }): string {
  const open = course.open
  const status = labels?.badge || (open ? 'Matrícula abierta' : course.closed ? 'Matrícula cerrada' : 'Próximamente')
  const statusClass = open ? 'bg-green-600' : 'bg-slate-500'
  const tint = open ? ' style="background-color:#ecfdf5;border-color:#a7f3d0"' : ''
  const color = course.areaColor || '#475569'
  const chip = course.areaLabel
    ? `<span data-cep-chip="area" class="rounded-full px-3 py-1" style="background:${color}26;color:${color};border:1px solid ${color}59">${escapeHtml(course.areaLabel)}</span>`
    : ''
  const copy = course.description
    ? `<p class="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-600">${escapeHtml(course.description)}</p>`
    : ''
  const sede = course.campusHref ? ` data-cep-sede="${escapeHtml(course.campusHref)}"` : ''
  const run = course.convocatoriaHref
    ? `<span data-cep-grid-cta="run" data-cep-href="${escapeHtml(course.convocatoriaHref)}" role="link">Ver convocatoria</span>`
    : ''
  const action = labels?.course || 'Ver curso'
  return `<a class="group h-full" href="${escapeHtml(course.href)}"${open ? ' data-cep-open="1"' : ''}><div class="flex h-full min-h-[560px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"${tint}><div class="relative aspect-square w-full shrink-0"><img src="${escapeHtml(course.image)}" alt="${escapeHtml(course.title)}" class="h-full w-full object-cover object-center"><div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div><div class="absolute bottom-4 left-4 right-4"><h3 class="line-clamp-2 text-xl font-bold leading-tight text-white">${escapeHtml(course.title)}</h3></div><span class="ml-auto rounded-full px-3 py-1 text-white ${statusClass}">${escapeHtml(status)}</span></div><div class="flex flex-1 flex-col p-5"><div class="mb-4 flex flex-wrap items-center gap-2">${chip}</div>${copy}<div class="mt-5 grid gap-2 sm:grid-cols-2"><div class="rounded-xl border border-slate-200 bg-white/90 p-3"><p class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">Inicio</p><p class="mt-1 text-sm font-bold text-slate-950">${escapeHtml(course.start || '-')}</p></div><div class="rounded-xl border border-slate-200 bg-white/90 p-3"${sede}><p class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">Sede</p><p class="mt-1 text-sm font-bold text-slate-950">${escapeHtml(course.campus || '-')}</p></div></div><div class="mt-auto flex justify-start gap-2 pt-5" data-cep-card-actions="1"><span class="inline-flex items-center justify-center rounded-full bg-[#f2014b] px-5 py-3 text-sm font-black text-white"${course.convocatoriaHref ? ' data-cep-cta="course"' : ''}>${escapeHtml(action)}</span>${run}</div></div></div></a>`
}

function cycleCard(cycle: CatalogCycle): string {
  const badge = resolveCourseArea({ nombre: cycle.name })
  const item: CourseListItem = {
    href: `/ciclos/${cycle.slug}`,
    title: cycle.name.trim(),
    image: cycle.imageUrl || '',
    open: false,
    closed: false,
    kind: 'privados',
    area: '',
    areaLabel: badge?.label || '',
    areaColor: badge?.color || '#475569',
    modality: 'Presencial',
    start: '',
    campus: '',
    campusHref: '',
    description: '',
    convocatoriaHref: '',
  }
  return gridCard(item, { badge: 'Ciclo formativo', course: 'Ver ciclo' })
}

function cardClicks(): string {
  return `<script data-cep-area-cards="1">
document.addEventListener('click', function (ev) {
  var node = ev.target && ev.target.closest ? ev.target : null;
  if (!node) return;
  var run = node.closest('[data-cep-grid-cta="run"]');
  var sede = node.closest('[data-cep-sede]');
  var dest = run ? run.getAttribute('data-cep-href') : sede ? sede.getAttribute('data-cep-sede') : '';
  if (!dest) return;
  ev.preventDefault();
  ev.stopPropagation();
  location.href = dest;
}, true);
</script>`
}

function stripNextFlight(html: string): string {
  return html.replace(/<script\b([^>]*)>[\s\S]*?<\/script>/gi, (full, attrs: string) => {
    if (/data-cep-/i.test(attrs)) return full
    if (/application\/ld\+json/i.test(attrs)) return full
    if (/__next|\/_next\//i.test(full) || /__next/i.test(attrs)) return ''
    return full
  })
}

export function rewriteAreaPage(html: string, snapshot: CatalogSnapshot | null, pathname: string): string {
  const slug = areaSlugFromPath(pathname)
  if (!slug) return html
  const body = areaPageBody(snapshot, slug, parseCourseDescriptions(html))
  const main = `<main data-cep-area-rendered="${escapeHtml(slug)}">${body}</main>`
  const next = /<main\b/i.test(html) ? html.replace(/<main\b[^>]*>[\s\S]*?<\/main>/i, main) : html.replace('</body>', `${main}</body>`)
  const title = areaPage(slug).title
  const titled = next.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)} | CEP Formación</title>`)
  return stripNextFlight(titled).replace(/<script\b[^>]*data-cep-course-catalog-lock="1"[^>]*>[\s\S]*?<\/script>/gi, '')
}
