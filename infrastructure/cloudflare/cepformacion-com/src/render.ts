import { displayCampusName } from './campus-name'

const BRAND = '#f2014b'
const DARK = '#3E091A'
const LOGO_PNG = '/logos/cep-formacion-logo-rectangular.png'
const OPERATIVE_SITE = 'https://cepformacion.akademate.com/'
const FORBIDDEN_BLUES = ['#2563eb', '#0066cc', '#3b82f6', '#1a1a2e']

export type CatalogFaq = { question?: string; answer?: string }
export type CatalogSchedule = { days?: string[]; start?: string | null; end?: string | null }
export type CatalogPrice = { label?: string }

export type CatalogCourse = {
  id?: string
  slug: string
  nombre: string
  studyType?: string | null
  studyTypeLabel?: string | null
  studyTypeColor?: string | null
  enrollmentStatus?: 'open' | 'published' | 'closed' | 'none' | null
  descripcion?: string
  imagenPortada?: string | null
  imageUrl?: string | null
  durationHours?: number | null
  duracionReferencia?: number | null
  modality?: string | null
  area?: string | null
  areaColor?: string | null
  area_formativa?: { nombre?: string | null; name?: string | null; color?: string | null } | string | null
  landingObjectives?: string[]
  landingProgramBlocks?: Array<{ title?: string; body?: string; items?: string[] }>
  landingOutcomes?: string | null
  landingFaqs?: CatalogFaq[]
  landingAccessRequirements?: string | null
  landingTargetAudience?: string | null
  featured?: boolean
  created_at?: string | null
  updated_at?: string | null
}

export type CatalogCycle = {
  id?: string
  slug: string
  name: string
  level?: string | null
  description?: string
  imageUrl?: string | null
  officialTitle?: string | null
}

export type CatalogConvocatoria = {
  id?: string
  codigo: string
  status?: string | null
  startDate?: string | null
  endDate?: string | null
  enrollmentDeadline?: string | null
  schedule?: CatalogSchedule | null
  classFrequency?: number | null
  classroomHours?: number | null
  companyHours?: number | null
  certificationType?: string | null
  deliveryMode?: string | null
  financialAidAvailable?: boolean | null
  price?: CatalogPrice | null
  trainingLine?: string | null
  availableSeats?: number | null
  course?: (Partial<CatalogCourse> & { nombre?: string | null; imageUrl?: string | null }) | null
  campus?: { slug?: string | null; name?: string | null; city?: string | null } | null
  instructor?: { id?: string; name?: string | null; photoUrl?: string | null } | null
  cycle?: { slug?: string | null; name?: string | null; level?: string | null } | null
  imageUrl?: string | null
  updatedAt?: string | null
}

export type CatalogSnapshot = {
  meta: { tenant: string; host: string; generatedAt: string; version: string; cacheTtlSeconds: number }
  data: {
    branding: {
      academyName?: string
      logoUrl?: string
      faviconUrl?: string
      primaryColor?: string
      contact?: { phone?: string[] }
    }
    navigation?: {
      items?: Array<{ kind?: string; label?: string; href?: string }>
      cta?: { label?: string; href?: string }
    }
    seo?: { defaultTitle?: string; defaultDescription?: string; canonicalOrigin?: string }
    courses: CatalogCourse[]
    cycles: CatalogCycle[]
    convocatorias: CatalogConvocatoria[]
    campuses: Array<{ slug: string; name: string; city?: string | null; imageUrl?: string | null; address?: string | null; phone?: string | null }>
    teachers: Array<{ slug: string; name: string; photoUrl?: string | null; bio?: string | null }>
    website?: {
      visualIdentity?: Record<string, unknown> | null
      navigation?: {
        items?: Array<{ kind?: string; label?: string; href?: string }>
        cta?: { label?: string; href?: string }
      }
      footer?: {
        description?: string
        columns?: Array<{ title?: string; links?: Array<{ label?: string; href?: string }> }>
        legalNote?: string
      } | null
      pages?: Array<{
        path?: string
        pageKind?: string
        title?: string
        seo?: { title?: string; description?: string }
        sections?: Array<Record<string, unknown>>
      }>
    } | null
    sitemap: Array<{ path: string; changefreq: string; lastmod: string | null }>
  }
}

type DenseKey = 'privados' | 'desempleados' | 'ocupados' | 'teleformacion' | 'otros'

const DENSE_VISUALS: Record<DenseKey, { label: string; color: string }> = {
  privados: { label: 'Privados', color: BRAND },
  desempleados: { label: 'Trabajadores/as desempleados/as', color: DARK },
  ocupados: { label: 'Trabajadores/as ocupados/as', color: '#059669' },
  teleformacion: { label: 'Teleformación', color: '#c2410c' },
  otros: { label: 'Otros', color: '#6f5d60' },
}

const DENSE_ORDER: DenseKey[] = ['privados', 'desempleados', 'ocupados', 'teleformacion', 'otros']

const LEVEL_META: Record<string, { label: string; color: string }> = {
  grado_medio: { label: 'Grado Medio · CFGM', color: DARK },
  grado_superior: { label: 'Grado Superior · CFGS', color: BRAND },
}

const DAY_LABELS: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function publicAsset(src: string | null | undefined, prefix: string): string {
  if (!src) return ''
  let path = src.trim()
  try {
    if (/^https?:\/\//i.test(path)) {
      const url = new URL(path)
      path = url.pathname
      const mediaAt = path.indexOf('/api/media/file/')
      if (mediaAt >= 0) path = path.slice(mediaAt)
    }
  } catch {
    return ''
  }
  if (!path.startsWith('/')) path = `/${path}`
  if (path.startsWith('/p/')) path = path.replace(/^\/p/, '')
  return `${prefix}${path}`
}

export function siteHref(href: string | null | undefined, prefix: string): string {
  if (!href) return prefix || '/'
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return href
  }
  if (href.startsWith('#')) return href
  const clean = href.startsWith('/p/') ? href.replace(/^\/p/, '') : href
  const path = clean.startsWith('/') ? clean : `/${clean}`
  if (!prefix) return path
  if (path === '/') return prefix || '/'
  return `${prefix}${path}`
}

export function isForbiddenBlue(value: string | null | undefined): boolean {
  const hex = String(value || '').trim().toLowerCase()
  return FORBIDDEN_BLUES.includes(hex)
}

export function hostColor(value: string | null | undefined, fallback: string): string {
  if (!value || isForbiddenBlue(value)) return fallback
  return value
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function asPositiveInt(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null
  return Math.trunc(value)
}

function denseKey(label: string | null | undefined, studyType: string | null | undefined): DenseKey {
  const raw = `${studyType || ''} ${label || ''}`
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (raw.includes('privad')) return 'privados'
  if (raw.includes('desemple')) return 'desempleados'
  if (raw.includes('ocupad')) return 'ocupados'
  if (raw.includes('teleform')) return 'teleformacion'
  return 'otros'
}

function groupCourses(snapshot: CatalogSnapshot) {
  const buckets = new Map<DenseKey, CatalogSnapshot['data']['courses']>()
  for (const course of snapshot.data.courses || []) {
    const key = denseKey(course.studyTypeLabel, course.studyType)
    const list = buckets.get(key) ?? []
    list.push(course)
    buckets.set(key, list)
  }
  return DENSE_ORDER.flatMap((key) => {
    const courses = buckets.get(key)
    if (!courses?.length) return []
    return [
      {
        key,
        ...DENSE_VISUALS[key],
        courses: [...courses].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
      },
    ]
  })
}

function normalizePath(path: string | null | undefined): string {
  const value = asText(path)
  if (!value || value === '/') return '/'
  return value.replace(/\/$/, '') || '/'
}

function cmsPages(snapshot: CatalogSnapshot) {
  return snapshot.data.website?.pages || []
}

function pageByPath(snapshot: CatalogSnapshot, path: string) {
  const pages = cmsPages(snapshot)
  const exact = pages.find((page) => normalizePath(page.path) === path)
  if (exact) return exact
  if (path === '/') return pages.find((page) => page.pageKind === 'home')
  if (path === '/cursos') return pages.find((page) => page.pageKind === 'courses_index')
  if (path === '/ciclos') return pages.find((page) => page.pageKind === 'cycles_index')
  if (path === '/convocatorias') return pages.find((page) => page.pageKind === 'convocations_index')
  if (path === '/sedes') return pages.find((page) => page.pageKind === 'campuses_index')
  if (path === '/contacto') return pages.find((page) => page.pageKind === 'contact')
  return undefined
}

function visibleSections(page: { sections?: Array<Record<string, unknown>> } | null | undefined) {
  return (page?.sections || []).filter((section) => section && section.enabled !== false && asText(section.kind))
}

function takeLimit<T>(items: T[], limit: unknown): T[] {
  const count = asPositiveInt(limit)
  if (!count) return items
  return items.slice(0, count)
}

function clock(value: string): string {
  return value.replace(/^(\d{1,2}:\d{2}):00$/, '$1')
}

export function displayNameFor(conv: CatalogConvocatoria): string {
  if (conv.cycle) return asText(conv.cycle.name) || asText(conv.course?.nombre) || conv.codigo
  return asText(conv.course?.nombre) || conv.codigo
}

function courseByRef(snapshot: CatalogSnapshot, course: CatalogConvocatoria['course']): CatalogCourse | null {
  if (!course) return null
  const id = course.id ? String(course.id) : ''
  const slug = asText(course.slug)
  return (
    snapshot.data.courses.find((item) => (id && item.id === id) || (slug && item.slug === slug)) ||
    null
  )
}

function editorialFrom(snapshot: CatalogSnapshot, conv: CatalogConvocatoria) {
  const listed = courseByRef(snapshot, conv.course)
  const nested = conv.course
  const faqs = (nested?.landingFaqs?.length ? nested.landingFaqs : listed?.landingFaqs) || []
  return {
    descripcion: asText(listed?.descripcion),
    imageUrl: conv.imageUrl || nested?.imageUrl || listed?.imageUrl || listed?.imagenPortada || null,
    landingObjectives: (nested?.landingObjectives?.length ? nested.landingObjectives : listed?.landingObjectives) || [],
    landingProgramBlocks:
      (nested?.landingProgramBlocks?.length ? nested.landingProgramBlocks : listed?.landingProgramBlocks) || [],
    landingOutcomes: asText(nested?.landingOutcomes) || asText(listed?.landingOutcomes) || null,
    landingFaqs: faqs.filter((faq) => asText(faq.question) && asText(faq.answer)),
    landingAccessRequirements:
      asText(nested?.landingAccessRequirements) || asText(listed?.landingAccessRequirements) || null,
    landingTargetAudience: asText(nested?.landingTargetAudience) || asText(listed?.landingTargetAudience) || null,
  }
}

function formatDay(value: string): string {
  return DAY_LABELS[value.toLowerCase()] || value
}

function scheduleLabel(schedule: CatalogSchedule | null | undefined): string | null {
  if (!schedule) return null
  const days = (schedule.days || []).map((day) => formatDay(String(day))).filter(Boolean)
  const start = clock(asText(schedule.start))
  const end = clock(asText(schedule.end))
  const range = start && end ? `${start}–${end}` : start || end
  if (days.length && range) return `${days.join(', ')} · ${range}`
  if (days.length) return days.join(', ')
  if (range) return range
  return null
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

function siteCss(): string {
  return `
    :root { color-scheme: light; --ink:${DARK}; --muted:#6f5d60; --brand:${BRAND}; --dark:${DARK}; --line:#eadadd; --paper:#fffdfd; --emerald:#059669; }
    * { box-sizing: border-box; }
    html, body { margin: 0; background: #fff; color: var(--ink); font-family: Manrope, ui-sans-serif, sans-serif; }
    a { color: var(--brand); }
    img { max-width: 100%; display: block; }
    .wrap { width: min(100%, 72rem); margin: 0 auto; padding: 0 1.25rem; }
    header.site { border-bottom: 1px solid var(--line); background: #fff; }
    .nav { display: flex; align-items: center; justify-content: space-between; gap: 1rem; min-height: 4.5rem; }
    .brand { display: inline-flex; align-items: center; gap: .75rem; color: var(--ink); text-decoration: none; font-weight: 800; }
    .brand-disk { width: 2.75rem; height: 2.75rem; border-radius: 50%; background: #fff; border: 1px solid var(--line); display: grid; place-items: center; overflow: hidden; flex-shrink: 0; }
    .brand-disk img { width: 72%; height: 72%; object-fit: contain; }
    nav.links { display: flex; flex-wrap: wrap; gap: .75rem 1.25rem; font-size: .9rem; font-weight: 700; }
    nav.links a { color: var(--ink); text-decoration: none; }
    nav.links a:hover { color: var(--brand); }
    .cta { display: inline-flex; align-items: center; min-height: 2.5rem; padding: .5rem 1rem; border-radius: 999px; background: var(--brand); color: #fff; text-decoration: none; font-weight: 800; }
    .hero { position: relative; min-height: 22rem; display: grid; align-items: end; background: var(--dark); color: #fff; overflow: hidden; }
    .hero img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .45; }
    .hero-copy { position: relative; padding: 4rem 0 3rem; }
    .eyebrow { margin: 0 0 .75rem; color: #ffd4e0; font-size: .75rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 0; font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1.05; letter-spacing: -.04em; max-width: 18ch; }
    .lede { max-width: 40rem; margin: 1rem 0 0; color: #f5e9ec; font-size: 1.1rem; line-height: 1.5; }
    .stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; margin: -2rem auto 0; position: relative; }
    .stat { background: #fff; border: 1px solid var(--line); border-radius: 1rem; padding: 1rem 1.25rem; }
    .stat b { display: block; font-size: 1.6rem; color: var(--brand); }
    .stat span { color: var(--muted); font-size: .85rem; }
    section.block { padding: 3rem 0; }
    h2 { margin: 0 0 1.25rem; font-size: 1.75rem; }
    .cycles, .cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.25rem; }
    .cycle, .card { display: block; text-decoration: none; color: inherit; border: 1px solid var(--line); border-radius: 1rem; overflow: hidden; background: #fff; }
    .cycle-photo, .card-photo { height: 12rem; background: var(--dark); }
    .cycle-photo img, .card-photo img { width: 100%; height: 100%; object-fit: cover; }
    .cycle-body, .card-body { padding: 1rem 1.1rem 1.2rem; }
    .level { display: inline-block; padding: .2rem .5rem; border-radius: .35rem; color: #fff; font-size: .7rem; font-weight: 800; margin-bottom: .5rem; }
    .cycle h3, .card h3 { margin: 0; font-size: 1.1rem; }
    .meta { margin: .4rem 0 0; color: var(--muted); font-size: .85rem; }
    .hours { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .75rem; }
    .chip { display: inline-flex; align-items: center; border-radius: 999px; padding: .2rem .6rem; font-size: .72rem; font-weight: 800; background: #fff0f4; color: var(--brand); }
    .chip-dark { background: var(--dark); color: #fff; }
    .group-title { margin: 0 0 .5rem; font-size: 1.1rem; font-weight: 800; }
    .dense-grid { display: grid; grid-template-columns: 1fr; }
    .dense-row { display: flex; align-items: center; min-height: 3rem; gap: .75rem; border-bottom: 1px solid var(--line); text-decoration: none; padding: 0; color: inherit; }
    .dense-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .875rem; font-weight: 700; text-transform: uppercase; color: var(--ink); }
    .dense-badge-slot { width: 7.5rem; flex-shrink: 0; display: flex; justify-content: flex-start; }
    .dense-badge { display: inline-flex; align-items: center; height: 1.25rem; padding: 0 .75rem; border-radius: 999px; background: var(--emerald); color: #fff; font-size: .7rem; font-weight: 700; }
    .dense-cta { display: inline-flex; align-items: center; height: 2rem; padding: 0 1rem; border-radius: 999px; background: var(--brand); color: #fff; font-size: .75rem; font-weight: 800; flex-shrink: 0; }
    .detail { padding: 3rem 0 4rem; display: grid; gap: 1.5rem; }
    .detail img.cover { width: min(100%, 42rem); height: 16rem; object-fit: cover; border-radius: 1rem; }
    .facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: .75rem; }
    .fact { border: 1px solid var(--line); border-radius: 1rem; padding: 1rem; background: #fff; }
    .fact b { display: block; font-size: .72rem; letter-spacing: .08em; text-transform: uppercase; color: var(--brand); }
    .fact span { display: block; margin-top: .35rem; font-weight: 800; }
    .prose { color: #3b2428; line-height: 1.55; }
    .faq { border-top: 1px solid var(--line); padding: 1rem 0; }
    .faq dt { font-weight: 800; }
    .faq dd { margin: .4rem 0 0; color: var(--muted); }
    footer.site { border-top: 1px solid var(--line); padding: 1.5rem 0 2rem; color: var(--muted); }
    footer.site a { color: var(--brand); font-weight: 800; text-decoration: none; }
    .features { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
    .feature { border: 1px solid var(--line); border-radius: 1rem; padding: 1.1rem; }
    .banner { border-radius: 1.25rem; padding: 2rem 1.5rem; }
    .banner-dark { background: var(--dark); color: #fff; }
    .banner-brand { background: var(--brand); color: #fff; }
    .banner-light { background: #fff0f4; color: var(--ink); }
    .lead { display: grid; gap: .75rem; max-width: 28rem; }
    .lead input, .lead textarea { width: 100%; min-height: 2.75rem; border: 1px solid var(--line); border-radius: .75rem; padding: .7rem .9rem; font: inherit; }
    .lead button { border: 0; cursor: pointer; }
    @media (min-width: 640px) { .dense-grid { grid-template-columns: 1fr 1fr; column-gap: 2rem; } }
    @media (max-width: 900px) { .cycles, .cards, .stats, .features { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 640px) { .cycles, .cards, .stats, .features { grid-template-columns: 1fr; } .nav { flex-wrap: wrap; } }
  `
}

function layout(options: {
  prefix: string
  snapshot: CatalogSnapshot
  title: string
  description: string
  canonical: string
  body: string
}): string {
  const name = options.snapshot.data.branding.academyName || 'CEP Formación'
  const logo = publicAsset(LOGO_PNG, options.prefix)
  const favicon = publicAsset(
    options.snapshot.data.branding.faviconUrl || '/website/cep/logos/cep-circle-icon.svg',
    options.prefix,
  )
  const navItems = (options.snapshot.data.navigation?.items || [])
    .filter((item) => item.href && item.label)
    .slice(0, 8)
  const cta = options.snapshot.data.navigation?.cta
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="${BRAND}">
    <meta name="description" content="${escapeHtml(options.description)}">
    <link rel="canonical" href="${escapeHtml(options.canonical)}">
    <link rel="icon" href="${escapeHtml(favicon)}" type="image/svg+xml">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap" rel="stylesheet">
    <title>${escapeHtml(options.title)}</title>
    <style>${siteCss()}</style>
  </head>
  <body>
    <header class="site">
      <div class="wrap nav">
        <a class="brand" href="${escapeHtml(siteHref('/', options.prefix))}">
          <span class="brand-disk"><img src="${escapeHtml(logo)}" alt="${escapeHtml(name)}"></span>
          <span>${escapeHtml(name)}</span>
        </a>
        <nav class="links" aria-label="Principal">
          ${navItems
            .map(
              (item) =>
                `<a href="${escapeHtml(siteHref(item.href, options.prefix))}">${escapeHtml(item.label || '')}</a>`,
            )
            .join('')}
        </nav>
        ${
          cta?.href
            ? `<a class="cta" href="${escapeHtml(siteHref(cta.href, options.prefix))}">${escapeHtml(cta.label || 'Contacto')}</a>`
            : ''
        }
      </div>
    </header>
    ${options.body}
    <footer class="site">
      <div class="wrap" style="display:flex;justify-content:space-between;gap:1rem;width:100%;flex-wrap:wrap;">
        <p>${escapeHtml(name)}.</p>
        <a href="${OPERATIVE_SITE}">Sitio actual ↗</a>
      </div>
    </footer>
  </body>
</html>`
}

function hoursChips(classroomHours: number | null, companyHours: number | null): string {
  const chips: string[] = []
  if (classroomHours != null) chips.push(`<span class="chip">${classroomHours} h</span>`)
  if (companyHours != null) chips.push(`<span class="chip chip-dark">Prácticas ${companyHours} h</span>`)
  return chips.length ? `<div class="hours">${chips.join('')}</div>` : ''
}

function denseCatalogHtml(snapshot: CatalogSnapshot, prefix: string, courses?: CatalogCourse[]): string {
  const groups = groupCourses({
    ...snapshot,
    data: { ...snapshot.data, courses: courses ?? snapshot.data.courses },
  })
  if (!groups.length) return ''
  return groups
    .map(
      (group) => `
      <section aria-labelledby="type-${group.key}">
        <h3 class="group-title" id="type-${group.key}" style="color:${group.color}">${escapeHtml(group.label)}</h3>
        <div class="dense-grid">
          ${group.courses
            .map((course) => {
              const open = course.enrollmentStatus === 'open'
              return `<a class="dense-row" href="${escapeHtml(siteHref(`/cursos/${course.slug}`, prefix))}">
                <span class="dense-name">${escapeHtml(course.nombre)}</span>
                <span class="dense-badge-slot">${open ? '<span class="dense-badge">Matrícula abierta</span>' : ''}</span>
                <span class="dense-cta">Ver curso →</span>
              </a>`
            })
            .join('')}
        </div>
      </section>`,
    )
    .join('')
}

function cyclesGridHtml(snapshot: CatalogSnapshot, prefix: string, cycles = snapshot.data.cycles || []): string {
  if (!cycles.length) return ''
  return `<div class="cycles">${cycles
    .map((cycle) => {
      const level = cycle.level ? LEVEL_META[String(cycle.level)] : null
      const src = publicAsset(cycle.imageUrl, prefix)
      return `<a class="cycle" href="${escapeHtml(siteHref(`/ciclos/${cycle.slug}`, prefix))}">
        <div class="cycle-photo">${src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(cycle.name)}">` : ''}</div>
        <div class="cycle-body">
          ${level ? `<span class="level" style="background:${level.color}">${escapeHtml(level.label)}</span>` : ''}
          <h3>${escapeHtml(cycle.name)}</h3>
        </div>
      </a>`
    })
    .join('')}</div>`
}

function convocatoriasGridHtml(
  snapshot: CatalogSnapshot,
  prefix: string,
  items = snapshot.data.convocatorias || [],
): string {
  if (!items.length) return ''
  return `<div class="cards">${items
    .map((conv) => {
      const name = displayNameFor(conv)
      const src = publicAsset(conv.imageUrl || conv.course?.imageUrl, prefix)
      const schedule = scheduleLabel(conv.schedule)
      const price = asText(conv.price?.label)
      const campus = [conv.campus?.name, conv.campus?.city].filter(Boolean).join(' · ')
      return `<a class="card" href="${escapeHtml(siteHref(`/convocatorias/${conv.codigo}`, prefix))}">
        <div class="card-photo">${src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(name)}">` : ''}</div>
        <div class="card-body">
          <h3>${escapeHtml(name)}</h3>
          ${campus ? `<p class="meta">${escapeHtml(campus)}</p>` : ''}
          ${schedule ? `<p class="meta">${escapeHtml(schedule)}</p>` : ''}
          ${hoursChips(asPositiveInt(conv.classroomHours), asPositiveInt(conv.companyHours))}
          ${price ? `<p class="meta">${escapeHtml(price)}</p>` : ''}
        </div>
      </a>`
    })
    .join('')}</div>`
}

function sectionHeading(title: string, subtitle?: string): string {
  const heading = asText(title)
  const lead = asText(subtitle)
  if (!heading && !lead) return ''
  return `${heading ? `<h2>${escapeHtml(heading)}</h2>` : ''}${lead ? `<p class="meta">${escapeHtml(lead)}</p>` : ''}`
}

function filterCourses(snapshot: CatalogSnapshot, section: Record<string, unknown>): CatalogCourse[] {
  let list = [...(snapshot.data.courses || [])]
  const types = (Array.isArray(section.courseTypes) ? section.courseTypes : [])
    .map((value) => denseKey(String(value), String(value)))
    .filter((key, index, all) => all.indexOf(key) === index)
  if (types.length) {
    list = list.filter((course) => types.includes(denseKey(course.studyTypeLabel, course.studyType)))
  }
  if (section.featuredOnly) list = list.filter((course) => course.featured)
  const title = asText(section.title).toLowerCase()
  if (title.includes('nuevas')) {
    list.sort((a, b) => asText(b.created_at || b.updated_at).localeCompare(asText(a.created_at || a.updated_at)))
  }
  return takeLimit(list, section.limit)
}

function renderCtas(
  prefix: string,
  primary?: { label?: string; href?: string } | null,
  secondary?: { label?: string; href?: string } | null,
): string {
  const links = [primary, secondary].filter((item): item is { label?: string; href?: string } => Boolean(item?.href))
  if (!links.length) return ''
  return `<p>${links
    .map(
      (item, index) =>
        `<a class="${index === 0 ? 'cta' : ''}" href="${escapeHtml(siteHref(item.href, prefix))}">${escapeHtml(asText(item.label) || 'Ver')}</a>`,
    )
    .join(' ')}</p>`
}

function renderSection(snapshot: CatalogSnapshot, prefix: string, section: Record<string, unknown>): string {
  const kind = asText(section.kind)
  if (kind === 'heroCarousel') {
    const slides = Array.isArray(section.slides) ? (section.slides as Array<Record<string, unknown>>) : []
    const slide = slides[0] || {}
    const title = asText(slide.title) || asText(section.title)
    const subtitle = asText(slide.subtitle) || asText(section.subtitle)
    const image = publicAsset(asText(slide.image) || null, prefix)
    const alt = asText(slide.alt) || title
    const eyebrow = asText(section.eyebrow)
    if (!title && !image) return ''
    return `<section class="hero">
      ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(alt)}">` : ''}
      <div class="wrap hero-copy">
        ${eyebrow ? `<p class="eyebrow">${escapeHtml(eyebrow)}</p>` : ''}
        ${title ? `<h1>${escapeHtml(title)}</h1>` : ''}
        ${subtitle ? `<p class="lede">${escapeHtml(subtitle)}</p>` : ''}
        ${renderCtas(prefix, section.primaryCta as { label?: string; href?: string }, section.secondaryCta as { label?: string; href?: string })}
      </div>
    </section>`
  }
  if (kind === 'statsStrip') {
    const items = Array.isArray(section.items) ? (section.items as Array<{ value?: string; label?: string }>) : []
    const cards = items.filter((item) => asText(item.value) || asText(item.label))
    if (!cards.length) return ''
    return `<div class="wrap"><div class="stats">${cards
      .map((item) => `<div class="stat"><b>${escapeHtml(asText(item.value))}</b><span>${escapeHtml(asText(item.label))}</span></div>`)
      .join('')}</div></div>`
  }
  if (kind === 'featureStrip') {
    const items = Array.isArray(section.items) ? (section.items as Array<{ title?: string; description?: string }>) : []
    const cards = items.filter((item) => asText(item.title) || asText(item.description))
    if (!asText(section.title) && !cards.length) return ''
    return `<div class="wrap"><section class="block">${sectionHeading(asText(section.title), asText(section.subtitle))}
      ${cards.length ? `<div class="features">${cards
        .map((item) => `<article class="feature"><h3>${escapeHtml(asText(item.title))}</h3><p class="meta">${escapeHtml(asText(item.description))}</p></article>`)
        .join('')}</div>` : ''}
    </section></div>`
  }
  if (kind === 'ctaBanner') {
    const title = asText(section.title)
    const body = asText(section.body)
    if (!title && !body) return ''
    const theme = asText(section.theme) === 'brand' ? 'banner-brand' : asText(section.theme) === 'light' ? 'banner-light' : 'banner-dark'
    return `<div class="wrap"><section class="block"><div class="banner ${theme}">
      ${title ? `<h2>${escapeHtml(title)}</h2>` : ''}
      ${body ? `<p>${escapeHtml(body)}</p>` : ''}
      ${renderCtas(prefix, section.cta as { label?: string; href?: string })}
    </div></section></div>`
  }
  if (kind === 'jobPlacement') {
    const title = asText(section.title)
    const image = publicAsset(asText(section.image) || null, prefix)
    if (!title && !image) return ''
    return `<div class="wrap"><section class="block">${sectionHeading(title, asText(section.subtitle))}
      ${image ? `<img class="cover" src="${escapeHtml(image)}" alt="${escapeHtml(title)}">` : ''}
      ${renderCtas(prefix, section.cta as { label?: string; href?: string }, section.secondaryCta as { label?: string; href?: string })}
    </section></div>`
  }
  if (kind === 'courseList') {
    const courses = filterCourses(snapshot, section)
    const html = denseCatalogHtml(snapshot, prefix, courses)
    if (!html) return ''
    return `<div class="wrap"><section class="block">${sectionHeading(asText(section.title), asText(section.subtitle))}${html}</section></div>`
  }
  if (kind === 'cycleList') {
    const html = cyclesGridHtml(snapshot, prefix, takeLimit(snapshot.data.cycles || [], section.limit))
    if (!html) return ''
    return `<div class="wrap"><section class="block">${sectionHeading(asText(section.title), asText(section.subtitle))}${html}</section></div>`
  }
  if (kind === 'convocationList') {
    const html = convocatoriasGridHtml(snapshot, prefix, takeLimit(snapshot.data.convocatorias || [], section.limit))
    if (!html) return ''
    return `<div class="wrap"><section class="block">${sectionHeading(asText(section.title), asText(section.subtitle))}${html}</section></div>`
  }
  if (kind === 'campusList') {
    const campuses = takeLimit(snapshot.data.campuses || [], section.limit)
    if (!campuses.length) return ''
    return `<div class="wrap"><section class="block">${sectionHeading(asText(section.title), asText(section.subtitle))}<div class="cards">${campuses
      .map((campus) => {
        const src = publicAsset(campus.imageUrl, prefix)
        const city = asText(campus.city)
        return `<a class="card" href="${escapeHtml(siteHref(`/sedes/${campus.slug}`, prefix))}">
          <div class="card-photo">${src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(displayCampusName(campus.name))}">` : ''}</div>
          <div class="card-body"><h3>${escapeHtml(displayCampusName(campus.name))}</h3>${city ? `<p class="meta">${escapeHtml(city)}</p>` : ''}</div>
        </a>`
      })
      .join('')}</div></section></div>`
  }
  if (kind === 'categoryGrid') {
    const items = Array.isArray(section.items) ? (section.items as Array<{ title?: string; image?: string; href?: string }>) : []
    const cards = items.filter((item) => asText(item.title))
    if (!cards.length && !asText(section.title)) return ''
    return `<div class="wrap"><section class="block">${sectionHeading(asText(section.title), asText(section.subtitle))}<div class="cards">${cards
      .map((item) => {
        const src = publicAsset(item.image, prefix)
        const href = asText(item.href)
        const inner = `${src ? `<div class="card-photo"><img src="${escapeHtml(src)}" alt="${escapeHtml(asText(item.title))}"></div>` : ''}<div class="card-body"><h3>${escapeHtml(asText(item.title))}</h3></div>`
        return href
          ? `<a class="card" href="${escapeHtml(siteHref(href, prefix))}">${inner}</a>`
          : `<div class="card">${inner}</div>`
      })
      .join('')}</div></section></div>`
  }
  if (kind === 'teamGrid') {
    const members = Array.isArray(section.members)
      ? (section.members as Array<{ name?: string; role?: string; image?: string; href?: string }>)
      : []
    const cards = members.filter((member) => asText(member.name))
    if (!cards.length && !asText(section.title)) return ''
    return `<div class="wrap"><section class="block">${sectionHeading(asText(section.title), asText(section.subtitle))}<div class="cards">${cards
      .map((member) => {
        const src = publicAsset(member.image, prefix)
        return `<article class="card">${src ? `<div class="card-photo"><img src="${escapeHtml(src)}" alt="${escapeHtml(asText(member.name))}"></div>` : ''}<div class="card-body"><h3>${escapeHtml(asText(member.name))}</h3>${asText(member.role) ? `<p class="meta">${escapeHtml(asText(member.role))}</p>` : ''}</div></article>`
      })
      .join('')}</div></section></div>`
  }
  if (kind === 'leadForm') {
    const title = asText(section.title)
    const subtitle = asText(section.subtitle)
    const source = asText(section.source) || 'website'
    return `<div class="wrap"><section class="block">${sectionHeading(title, subtitle)}
      <form class="lead" method="post" action="/api/leads">
        <input type="hidden" name="source" value="${escapeHtml(source)}">
        <input name="name" required placeholder="Nombre">
        <input name="email" type="email" required placeholder="Email">
        <input name="phone" placeholder="Teléfono">
        <textarea name="message" placeholder="Mensaje"></textarea>
        <button class="cta" type="submit">Enviar</button>
      </form>
    </section></div>`
  }
  return ''
}

function renderPageSections(snapshot: CatalogSnapshot, prefix: string, page: { sections?: Array<Record<string, unknown>> }): string {
  return visibleSections(page).map((section) => renderSection(snapshot, prefix, section)).join('')
}

function renderHome(snapshot: CatalogSnapshot, prefix: string): string {
  const page = pageByPath(snapshot, '/')
  if (visibleSections(page).length) return renderPageSections(snapshot, prefix, page || { sections: [] })
  if (cmsPages(snapshot).length) return ''
  const coursesHtml = denseCatalogHtml(snapshot, prefix)
  const cyclesHtml = cyclesGridHtml(snapshot, prefix)
  const convHtml = convocatoriasGridHtml(snapshot, prefix)
  const name = snapshot.data.branding.academyName || 'CEP Formación'
  return `
    <section class="hero"><div class="wrap hero-copy"><h1>${escapeHtml(name)}</h1></div></section>
    <div class="wrap">
      ${cyclesHtml ? `<section class="block"><h2>Ciclos formativos</h2>${cyclesHtml}</section>` : ''}
      ${convHtml ? `<section class="block"><h2>Convocatorias</h2>${convHtml}</section>` : ''}
      ${coursesHtml ? `<section class="block"><h2>Cursos destacados</h2>${coursesHtml}</section>` : ''}
    </div>`
}

function renderCourses(snapshot: CatalogSnapshot, prefix: string): string {
  const page = pageByPath(snapshot, '/cursos')
  if (visibleSections(page).length) return renderPageSections(snapshot, prefix, page || { sections: [] })
  return `<div class="wrap"><section class="block"><h1>Cursos</h1>${denseCatalogHtml(snapshot, prefix)}</section></div>`
}

function renderCycles(snapshot: CatalogSnapshot, prefix: string): string {
  const page = pageByPath(snapshot, '/ciclos')
  if (visibleSections(page).length) return renderPageSections(snapshot, prefix, page || { sections: [] })
  return `<div class="wrap"><section class="block"><h1>Ciclos formativos</h1>${cyclesGridHtml(snapshot, prefix)}</section></div>`
}

function renderConvocatorias(snapshot: CatalogSnapshot, prefix: string): string {
  const page = pageByPath(snapshot, '/convocatorias')
  if (visibleSections(page).length) return renderPageSections(snapshot, prefix, page || { sections: [] })
  return `<div class="wrap"><section class="block"><h1>Convocatorias</h1>${convocatoriasGridHtml(snapshot, prefix)}</section></div>`
}

function fact(label: string, value: string | null | undefined): string {
  if (!value) return ''
  return `<div class="fact"><b>${escapeHtml(label)}</b><span>${escapeHtml(value)}</span></div>`
}

function faqsHtml(faqs: CatalogFaq[]): string {
  if (!faqs.length) return ''
  return `<section><h2>Preguntas frecuentes</h2>${faqs
    .map(
      (faq) =>
        `<div class="faq"><dt>${escapeHtml(asText(faq.question))}</dt><dd>${escapeHtml(asText(faq.answer))}</dd></div>`,
    )
    .join('')}</section>`
}

function renderCourseDetail(snapshot: CatalogSnapshot, prefix: string, slug: string): string | null {
  const course = snapshot.data.courses.find((item) => item.slug === slug)
  if (!course) return null
  const src = publicAsset(course.imagenPortada || course.imageUrl, prefix)
  const open = course.enrollmentStatus === 'open'
  const faqs = (course.landingFaqs || []).filter((faq) => asText(faq.question) && asText(faq.answer))
  const objectives = (course.landingObjectives || []).map((item) => asText(item)).filter(Boolean)
  const hours = asPositiveInt(course.durationHours) ?? asPositiveInt(course.duracionReferencia)
  return `<div class="wrap detail">
    ${src ? `<img class="cover" src="${escapeHtml(src)}" alt="${escapeHtml(course.nombre)}">` : ''}
    <div>
      ${open ? '<span class="dense-badge">Matrícula abierta</span>' : ''}
      <h1>${escapeHtml(course.nombre)}</h1>
      <div class="facts">
        ${hours != null ? fact('Duración', `${hours} h`) : ''}
      </div>
      ${asText(course.descripcion) ? `<p class="prose">${escapeHtml(asText(course.descripcion))}</p>` : ''}
      ${asText(course.landingTargetAudience) ? `<p class="prose">${escapeHtml(asText(course.landingTargetAudience))}</p>` : ''}
      ${
        objectives.length
          ? `<ul>${objectives.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
          : ''
      }
      ${asText(course.landingOutcomes) ? `<p class="prose">${escapeHtml(asText(course.landingOutcomes))}</p>` : ''}
      ${asText(course.landingAccessRequirements) ? `<p class="prose">${escapeHtml(asText(course.landingAccessRequirements))}</p>` : ''}
      ${faqsHtml(faqs)}
      <p><a class="dense-cta" href="${escapeHtml(siteHref('/contacto', prefix))}">Solicitar información</a></p>
    </div>
  </div>`
}

function renderCycleDetail(snapshot: CatalogSnapshot, prefix: string, slug: string): string | null {
  const cycle = snapshot.data.cycles.find((item) => item.slug === slug)
  if (!cycle) return null
  const src = publicAsset(cycle.imageUrl, prefix)
  const level = cycle.level ? LEVEL_META[String(cycle.level)] : null
  return `<div class="wrap detail">
    ${src ? `<img class="cover" src="${escapeHtml(src)}" alt="${escapeHtml(cycle.name)}">` : ''}
    <div>
      ${level ? `<span class="level" style="background:${level.color}">${escapeHtml(level.label)}</span>` : ''}
      <h1>${escapeHtml(cycle.name)}</h1>
      ${asText(cycle.officialTitle) ? `<p class="meta">${escapeHtml(asText(cycle.officialTitle))}</p>` : ''}
      ${asText(cycle.description) ? `<p class="prose">${escapeHtml(asText(cycle.description))}</p>` : ''}
    </div>
  </div>`
}

function renderConvocatoriaDetail(snapshot: CatalogSnapshot, prefix: string, codigo: string): string | null {
  const conv = snapshot.data.convocatorias.find((item) => item.codigo === codigo || item.id === codigo)
  if (!conv) return null
  const editorial = editorialFrom(snapshot, conv)
  const name = displayNameFor(conv)
  const src = publicAsset(editorial.imageUrl, prefix)
  const schedule = scheduleLabel(conv.schedule)
  const classroomHours = asPositiveInt(conv.classroomHours)
  const companyHours = asPositiveInt(conv.companyHours)
  const price = asText(conv.price?.label)
  const campus = [conv.campus?.name, conv.campus?.city].filter(Boolean).join(' · ')
  const start = formatDate(conv.startDate)
  const end = formatDate(conv.endDate)
  const objectives = editorial.landingObjectives.map((item) => asText(item)).filter(Boolean)
  return `<div class="wrap detail">
    ${src ? `<img class="cover" src="${escapeHtml(src)}" alt="${escapeHtml(name)}">` : ''}
    <div>
      <h1>${escapeHtml(name)}</h1>
      <div class="facts">
        ${classroomHours != null ? fact('Duración', `${classroomHours} h`) : ''}
        ${companyHours != null ? fact('Prácticas', `${companyHours} h`) : ''}
        ${schedule ? fact('Horario', schedule) : ''}
        ${conv.classFrequency != null ? fact('Días', String(conv.classFrequency)) : ''}
        ${price ? fact('Precio', price) : ''}
        ${campus ? fact('Sede', campus) : ''}
        ${start ? fact('Inicio', start) : ''}
        ${end ? fact('Fin', end) : ''}
        ${asText(conv.certificationType) ? fact('Diploma', asText(conv.certificationType)) : ''}
        ${asText(conv.deliveryMode) ? fact('Modalidad', asText(conv.deliveryMode)) : ''}
        ${conv.availableSeats != null ? fact('Plazas', String(conv.availableSeats)) : ''}
        ${conv.instructor?.name ? fact('Docente', asText(conv.instructor.name)) : ''}
      </div>
      ${editorial.descripcion ? `<p class="prose">${escapeHtml(editorial.descripcion)}</p>` : ''}
      ${editorial.landingTargetAudience ? `<p class="prose">${escapeHtml(editorial.landingTargetAudience)}</p>` : ''}
      ${
        objectives.length
          ? `<ul>${objectives.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
          : ''
      }
      ${editorial.landingOutcomes ? `<p class="prose">${escapeHtml(editorial.landingOutcomes)}</p>` : ''}
      ${editorial.landingAccessRequirements ? `<p class="prose">${escapeHtml(editorial.landingAccessRequirements)}</p>` : ''}
      ${faqsHtml(editorial.landingFaqs)}
      <p><a class="dense-cta" href="${escapeHtml(siteHref('/contacto', prefix))}">Solicitar información</a></p>
    </div>
  </div>`
}

function renderCampuses(snapshot: CatalogSnapshot, prefix: string): string {
  const campuses = snapshot.data.campuses || []
  if (!campuses.length) return ''
  return `<div class="wrap"><section class="block"><h1>Sedes</h1><div class="cards">${campuses
    .map((campus) => {
      const src = publicAsset(campus.imageUrl, prefix)
      const city = asText(campus.city)
      return `<a class="card" href="${escapeHtml(siteHref(`/sedes/${campus.slug}`, prefix))}">
        <div class="card-photo">${src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(displayCampusName(campus.name))}">` : ''}</div>
        <div class="card-body">
          <h3>${escapeHtml(displayCampusName(campus.name))}</h3>
          ${city ? `<p class="meta">${escapeHtml(city)}</p>` : ''}
        </div>
      </a>`
    })
    .join('')}</div></section></div>`
}

function renderCampusDetail(snapshot: CatalogSnapshot, prefix: string, slug: string): string | null {
  const campus = snapshot.data.campuses.find((item) => item.slug === slug)
  if (!campus) return null
  const src = publicAsset(campus.imageUrl, prefix)
  return `<div class="wrap detail">
    ${src ? `<img class="cover" src="${escapeHtml(src)}" alt="${escapeHtml(displayCampusName(campus.name))}">` : ''}
    <div>
      <h1>${escapeHtml(displayCampusName(campus.name))}</h1>
      <div class="facts">
        ${asText(campus.city) ? fact('Ciudad', asText(campus.city)) : ''}
        ${asText(campus.address) ? fact('Dirección', asText(campus.address)) : ''}
        ${asText(campus.phone) ? fact('Teléfono', asText(campus.phone)) : ''}
      </div>
    </div>
  </div>`
}

function renderTeachers(snapshot: CatalogSnapshot, prefix: string): string {
  const teachers = snapshot.data.teachers || []
  if (!teachers.length) return ''
  return `<div class="wrap"><section class="block"><h1>Profesorado</h1><div class="cards">${teachers
    .map((teacher) => {
      const src = publicAsset(teacher.photoUrl, prefix)
      return `<a class="card" href="${escapeHtml(siteHref(`/profesores/${teacher.slug}`, prefix))}">
        <div class="card-photo">${src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(teacher.name)}">` : ''}</div>
        <div class="card-body"><h3>${escapeHtml(teacher.name)}</h3></div>
      </a>`
    })
    .join('')}</div></section></div>`
}

function renderTeacherDetail(snapshot: CatalogSnapshot, prefix: string, slug: string): string | null {
  const teacher = snapshot.data.teachers.find((item) => item.slug === slug)
  if (!teacher) return null
  const src = publicAsset(teacher.photoUrl, prefix)
  return `<div class="wrap detail">
    ${src ? `<img class="cover" src="${escapeHtml(src)}" alt="${escapeHtml(teacher.name)}">` : ''}
    <div>
      <h1>${escapeHtml(teacher.name)}</h1>
      ${asText(teacher.bio) ? `<p class="prose">${escapeHtml(asText(teacher.bio))}</p>` : ''}
    </div>
  </div>`
}

function renderContact(snapshot: CatalogSnapshot, prefix: string): string {
  const page = pageByPath(snapshot, '/contacto')
  if (visibleSections(page).length) return renderPageSections(snapshot, prefix, page || { sections: [] })
  const phones = snapshot.data.branding.contact?.phone || []
  return `<div class="wrap"><section class="block">
    <h1>Contacto</h1>
    ${phones.map((phone) => `<p><a href="tel:${escapeHtml(phone.replace(/\s+/g, ''))}">${escapeHtml(phone)}</a></p>`).join('')}
  </section></div>`
}

export function renderSitePage(
  snapshot: CatalogSnapshot,
  pathname: string,
  prefix: string,
): { html: string; status: number } {
  const path = pathname.replace(/\/$/, '') || '/'
  const seo = snapshot.data.seo
  const name = snapshot.data.branding.academyName || 'CEP Formación'
  const origin = seo?.canonicalOrigin || 'https://cepformacion.com'
  const publicPath = prefix && path === '/' ? '/preview' : `${prefix}${path === '/' ? '' : path}`
  const canonical = `${origin}${publicPath || '/'}`
  let title = seo?.defaultTitle || name
  let description = seo?.defaultDescription || 'Formación profesional en Tenerife.'
  let body = ''
  let status = 200

  if (path === '/') {
    const page = pageByPath(snapshot, '/')
    title = page?.seo?.title || page?.title || title
    description = page?.seo?.description || description
    body = renderHome(snapshot, prefix)
  } else if (path === '/cursos') {
    const page = pageByPath(snapshot, '/cursos')
    title = page?.seo?.title || `Cursos | ${name}`
    body = renderCourses(snapshot, prefix)
  } else if (path === '/ciclos') {
    const page = pageByPath(snapshot, '/ciclos')
    title = page?.seo?.title || `Ciclos formativos | ${name}`
    body = renderCycles(snapshot, prefix)
  } else if (path === '/convocatorias') {
    const page = pageByPath(snapshot, '/convocatorias')
    title = page?.seo?.title || `Convocatorias | ${name}`
    body = renderConvocatorias(snapshot, prefix)
  } else if (path === '/sedes') {
    title = `Sedes | ${name}`
    body = renderCampuses(snapshot, prefix)
  } else if (path === '/profesores') {
    title = `Profesorado | ${name}`
    body = renderTeachers(snapshot, prefix)
  } else if (path.startsWith('/cursos/')) {
    const detail = renderCourseDetail(snapshot, prefix, path.slice('/cursos/'.length))
    if (!detail) {
      status = 404
      title = `No encontrado | ${name}`
      body = `<div class="wrap"><section class="block"><h1>Curso no encontrado</h1></section></div>`
    } else {
      body = detail
    }
  } else if (path.startsWith('/ciclos/')) {
    const detail = renderCycleDetail(snapshot, prefix, path.slice('/ciclos/'.length))
    if (!detail) {
      status = 404
      title = `No encontrado | ${name}`
      body = `<div class="wrap"><section class="block"><h1>Ciclo no encontrado</h1></section></div>`
    } else {
      body = detail
    }
  } else if (path.startsWith('/convocatorias/')) {
    const detail = renderConvocatoriaDetail(snapshot, prefix, path.slice('/convocatorias/'.length))
    if (!detail) {
      status = 404
      title = `No encontrado | ${name}`
      body = `<div class="wrap"><section class="block"><h1>Convocatoria no encontrada</h1></section></div>`
    } else {
      body = detail
    }
  } else if (path.startsWith('/sedes/')) {
    const detail = renderCampusDetail(snapshot, prefix, path.slice('/sedes/'.length))
    if (!detail) {
      status = 404
      title = `No encontrado | ${name}`
      body = `<div class="wrap"><section class="block"><h1>Sede no encontrada</h1></section></div>`
    } else {
      body = detail
    }
  } else if (path.startsWith('/profesores/')) {
    const detail = renderTeacherDetail(snapshot, prefix, path.slice('/profesores/'.length))
    if (!detail) {
      status = 404
      title = `No encontrado | ${name}`
      body = `<div class="wrap"><section class="block"><h1>Docente no encontrado</h1></section></div>`
    } else {
      body = detail
    }
  } else if (path === '/contacto') {
    const page = pageByPath(snapshot, '/contacto')
    title = page?.seo?.title || `Contacto | ${name}`
    body = renderContact(snapshot, prefix)
  } else {
    const cmsPage = pageByPath(snapshot, path)
    if (cmsPage && visibleSections(cmsPage).length) {
      title = cmsPage.seo?.title || cmsPage.title || title
      description = cmsPage.seo?.description || description
      body = renderPageSections(snapshot, prefix, cmsPage)
    } else {
      status = 404
      title = `No encontrado | ${name}`
      body = `<div class="wrap"><section class="block"><h1>Página no encontrada</h1><p><a href="${escapeHtml(siteHref('/', prefix))}">Volver al inicio</a></p></section></div>`
    }
  }

  return {
    status,
    html: layout({ prefix, snapshot, title, description, canonical, body }),
  }
}
