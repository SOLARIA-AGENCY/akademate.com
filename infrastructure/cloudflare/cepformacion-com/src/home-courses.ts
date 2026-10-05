import type { CatalogSnapshot } from './render'
import { isFundedFreeSection, resolveCourseArea } from './home-course-areas'
import { displayCampusName } from './campus-name'
import { homeBadgeByCourseSlug, homeRunBadge, type HomeCourseBadge } from './enrollment-state'
import { isUnpublishedRunCode } from './unpublished-runs'

export const HOME_COURSE_SECTION_KEYS = ['privados', 'ocupados', 'desempleados', 'teleformacion'] as const
export type HomeCourseSectionKey = (typeof HOME_COURSE_SECTION_KEYS)[number]

export const HOME_COURSE_SECTIONS: Array<{ key: HomeCourseSectionKey; title: string }> = [
  { key: 'privados', title: 'Privados' },
  { key: 'ocupados', title: 'Trabajadores ocupados' },
  { key: 'desempleados', title: 'Trabajadores desempleados/as' },
  { key: 'teleformacion', title: 'Teleformación' },
]

export type HomeCourseCard = {
  id: string
  name: string
  href: string
  enrollmentOpen: boolean
  badge: HomeCourseBadge | null
  running: boolean
  hours: number | null
  modality: string | null
  free: boolean
  areaLabel: string | null
  areaColor: string | null
  startLabel: string | null
  startKey: string | null
  campuses: string[]
}

export type HomeCourseGroup = {
  key: HomeCourseSectionKey
  title: string
  courses: HomeCourseCard[]
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    if (character === '&') return '&amp;'
    if (character === '<') return '&lt;'
    if (character === '>') return '&gt;'
    if (character === '"') return '&quot;'
    return '&#39;'
  })
}

function normalizeTypeKey(value: string): HomeCourseSectionKey | null {
  const key = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
  if (key.includes('privad')) return 'privados'
  if (key.includes('ocupad')) return 'ocupados'
  if (key.includes('desemple')) return 'desempleados'
  if (key.includes('teleform')) return 'teleformacion'
  return null
}

export function homeCourseSectionKey(course: {
  studyType?: string | null
  studyTypeLabel?: string | null
  tipo?: string | null
}): HomeCourseSectionKey | null {
  return normalizeTypeKey(course.studyType || '') || normalizeTypeKey(course.studyTypeLabel || '') || normalizeTypeKey(course.tipo || '')
}

function positiveHours(value: unknown): number | null {
  const amount = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(amount) || amount <= 0) return null
  return Math.round(amount)
}

export function courseHours(course: {
  durationHours?: number | null
  duracionReferencia?: number | null
}): number | null {
  return positiveHours(course.durationHours) ?? positiveHours(course.duracionReferencia)
}

export function displayModalityLabel(course: {
  modality?: string | null
  studyType?: string | null
  studyTypeLabel?: string | null
  tipo?: string | null
  deliveryMode?: string | null
}): string | null {
  const raw = [course.modality, course.deliveryMode, course.studyType, course.studyTypeLabel, course.tipo]
    .filter(Boolean)
    .join(' ')
  if (!raw.trim()) return null
  const key = raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
  if (key.includes('teleform') || key.includes('online')) return 'Teleformación'
  if (key.includes('semi')) return 'Semipresencial'
  if (key.includes('presenc')) return 'Presencial'
  return null
}

/** Every home row gets a modality. Empty catalog fields stay empty in displayModalityLabel. */
export function listedCourseModality(course: {
  modality?: string | null
  studyType?: string | null
  studyTypeLabel?: string | null
  tipo?: string | null
  deliveryMode?: string | null
  slug?: string | null
  nombre?: string | null
}): string {
  const fromFields = displayModalityLabel(course)
  if (fromFields) return fromFields
  const hint = `${course.slug || ''} ${course.nombre || ''}`
  const fromName = displayModalityLabel({ modality: hint })
  if (fromName) return fromName
  const slug = (course.slug || '').toLowerCase()
  if (/(^|-)tel$/.test(slug) || slug.includes('-tel-')) return 'Teleformación'
  return 'Presencial'
}

function hoursBySlug(snapshot: CatalogSnapshot): Map<string, number> {
  const hours = new Map<string, number>()
  for (const convocatoria of snapshot.data.convocatorias || []) {
    const amount = positiveHours(convocatoria.classroomHours) ?? courseHours(convocatoria.course || {})
    const slug = convocatoria.course?.slug
    if (!amount || !slug || hours.has(slug)) continue
    hours.set(slug, amount)
  }
  return hours
}

function modalityBySlug(snapshot: CatalogSnapshot): Map<string, string> {
  const modes = new Map<string, string>()
  for (const convocatoria of snapshot.data.convocatorias || []) {
    const slug = convocatoria.course?.slug
    const label = displayModalityLabel({
      modality: convocatoria.course?.modality,
      deliveryMode: convocatoria.deliveryMode,
    })
    if (!slug || !label || modes.has(slug)) continue
    modes.set(slug, label)
  }
  return modes
}

function homeBadges(snapshot: CatalogSnapshot): Record<string, HomeCourseBadge | null> {
  return homeBadgeByCourseSlug(snapshot)
}

const START_MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function isoStartKey(value: string | null | undefined): string | null {
  const day = String(value || '').trim().slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null
}

export function formatStartLabel(value: string | null | undefined): string | null {
  const day = String(value || '').trim().slice(0, 10)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
  if (!match) return null
  const month = START_MONTHS[Number(match[2]) - 1]
  if (!month) return null
  return `${Number(match[3])} ${month} ${match[1]}`
}

function openStartBySlug(snapshot: CatalogSnapshot): Map<string, string> {
  const dates = new Map<string, string>()
  for (const convocatoria of snapshot.data.convocatorias || []) {
    const slug = convocatoria.course?.slug
    if (!slug || homeRunBadge(convocatoria) !== 'open') continue
    const day = String(convocatoria.startDate || '').slice(0, 10)
    if (!formatStartLabel(day)) continue
    const current = dates.get(slug)
    if (!current || day < current) dates.set(slug, day)
  }
  return dates
}

function campusesBySlug(snapshot: CatalogSnapshot): Map<string, string[]> {
  const grouped = new Map<string, Set<string>>()
  for (const convocatoria of snapshot.data.convocatorias || []) {
    const slug = convocatoria.course?.slug
    const badge = homeRunBadge(convocatoria)
    if (!slug || (badge !== 'open' && badge !== 'running')) continue
    const label = displayCampusName(convocatoria.campus?.name).toLocaleUpperCase('es')
    if (!label.startsWith('CEP ')) continue
    const names = grouped.get(slug) || new Set<string>()
    names.add(label)
    grouped.set(slug, names)
  }
  const order = ['CEP NORTE', 'CEP SANTA CRUZ', 'CEP SUR']
  const out = new Map<string, string[]>()
  for (const [slug, names] of grouped) {
    out.set(slug, [...names].sort((left, right) => order.indexOf(left) - order.indexOf(right)))
  }
  return out
}

function madridDay(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

function runningSlugs(snapshot: CatalogSnapshot): Set<string> {
  const slugs = new Set<string>()
  for (const convocatoria of snapshot.data.convocatorias || []) {
    const slug = convocatoria.course?.slug
    if (slug && homeRunBadge(convocatoria) === 'running') slugs.add(slug)
  }
  return slugs
}

function foldName(value: string): string {
  return value
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function courseSlugStem(slug: string): string {
  return slug.replace(/-(priv|ocu|des|tel)$/i, '')
}

function suffixSection(slug: string): HomeCourseSectionKey | null {
  if (slug.endsWith('-ocu')) return 'ocupados'
  if (slug.endsWith('-des')) return 'desempleados'
  if (slug.endsWith('-priv')) return 'privados'
  if (slug.endsWith('-tel')) return 'teleformacion'
  return null
}

function rowIsFree(section: HomeCourseSectionKey, modality: string): boolean {
  return isFundedFreeSection(section) && modality !== 'Teleformación'
}

function convocatoriaMatchesCourse(
  convocatoria: CatalogSnapshot['data']['convocatorias'][number],
  course: { slug: string; nombre: string },
  section: HomeCourseSectionKey,
): boolean {
  if (isUnpublishedRunCode(convocatoria.codigo)) return false
  const owned = sectionForConvocatoria(convocatoria)
  if (owned && owned !== section) return false
  const convSlug = String(convocatoria.course?.slug || '')
  if (convSlug && convSlug === course.slug) return true
  const line = homeCourseSectionKey({
    studyType: String(convocatoria.trainingLine || convocatoria.course?.studyType || ''),
  })
  if (line && line !== section) return false
  const courseSuffix = suffixSection(course.slug)
  const convSuffix = suffixSection(convSlug)
  if (courseSuffix && convSuffix && courseSuffix !== convSuffix) return false
  if (convSlug && course.slug && courseSlugStem(convSlug) === courseSlugStem(course.slug)) return true
  const convName = foldName(convocatoria.course?.nombre || '')
  const courseName = foldName(course.nombre || '')
  return Boolean(convName && courseName && convName === courseName)
}

function sectionForConvocatoria(
  convocatoria: CatalogSnapshot['data']['convocatorias'][number],
): HomeCourseSectionKey | null {
  const line = String(convocatoria.trainingLine || convocatoria.course?.studyType || '')
  const slug = String(convocatoria.course?.slug || '')
  const code = String(convocatoria.codigo || '')
  if (/teleform/i.test(line) || slug.endsWith('-tel') || code.startsWith('ONL-')) return 'teleformacion'
  if (slug.endsWith('-des') || code.startsWith('DES-')) return 'desempleados'
  if (slug.endsWith('-ocu')) return 'ocupados'
  if (slug.endsWith('-priv') || code.startsWith('NOR-') || code.startsWith('SC-') || code.startsWith('PRIV-')) {
    return 'privados'
  }
  if (/ciclo/i.test(line) || convocatoria.cycle?.slug || convocatoria.cycle?.name) return null
  return homeCourseSectionKey({ studyType: line, tipo: line })
}

function courseForConvocatoria(
  snapshot: CatalogSnapshot,
  convocatoria: CatalogSnapshot['data']['convocatorias'][number],
) {
  const slug = convocatoria.course?.slug
  if (slug) {
    const bySlug = (snapshot.data.courses || []).find((course) => course.slug === slug)
    if (bySlug) return bySlug
  }
  const name = foldName(convocatoria.course?.nombre || '')
  if (!name) return null
  const matches = (snapshot.data.courses || []).filter((course) => course.slug && foldName(course.nombre || '') === name)
  return matches.length === 1 ? matches[0] : null
}

function badgeRank(badge: HomeCourseBadge | null): number {
  if (badge === 'open') return 0
  if (badge === 'running') return 1
  return 2
}

const VIRTUAL_CAMPUS_BADGE = 'CEP VIRTUAL'

function campusLabel(name: string | null | undefined): string | null {
  const label = displayCampusName(name).toLocaleUpperCase('es')
  return label.startsWith('CEP ') ? label : null
}

function rowCampuses(modality: string, campuses: string[]): string[] {
  return modality === 'Teleformación' ? [VIRTUAL_CAMPUS_BADGE] : campuses
}

export function groupHomeCourses(snapshot: CatalogSnapshot): HomeCourseGroup[] {
  const fallbackHours = hoursBySlug(snapshot)
  const fallbackModes = modalityBySlug(snapshot)
  const buckets: Record<HomeCourseSectionKey, HomeCourseCard[]> = {
    privados: [],
    ocupados: [],
    desempleados: [],
    teleformacion: [],
  }
  const today = madridDay()
  const usedCodes = new Set<string>()

  for (const course of snapshot.data.courses || []) {
    const section = homeCourseSectionKey(course)
    if (!section || !course.slug || !course.nombre) continue
    const area = resolveCourseArea(course)
    const modality = listedCourseModality({
      ...course,
      modality: displayModalityLabel(course) ?? fallbackModes.get(course.slug) ?? null,
    })
    const base = {
      name: course.nombre,
      href: `/p/cursos/${course.slug}`,
      hours: courseHours(course) ?? fallbackHours.get(course.slug) ?? null,
      modality,
      free: rowIsFree(section, modality),
      areaLabel: area?.label ?? null,
      areaColor: area?.color ?? null,
    }
    const rows: HomeCourseCard[] = []
    for (const convocatoria of snapshot.data.convocatorias || []) {
      if (!convocatoriaMatchesCourse(convocatoria, course, section)) continue
      const badge = homeRunBadge(convocatoria)
      if (badge !== 'open' && badge !== 'running') continue
      const campus = campusLabel(convocatoria.campus?.name)
      const href =
        badge === 'running'
          ? base.href
          : convocatoria.codigo
            ? `/convocatorias/${encodeURIComponent(convocatoria.codigo)}`
            : base.href
      rows.push({
        ...base,
        href,
        id: `${course.slug}:${convocatoria.codigo || badge}`,
        enrollmentOpen: badge === 'open',
        badge,
        running: badge === 'running',
        startLabel: formatStartLabel(String(convocatoria.startDate || '').slice(0, 10)),
        startKey: isoStartKey(convocatoria.startDate),
        campuses: rowCampuses(base.modality, campus ? [campus] : []),
      })
      if (convocatoria.codigo) usedCodes.add(convocatoria.codigo)
    }
    if (!rows.some((row) => row.badge === 'open') && !rows.some((row) => row.badge === 'running')) {
      const ownRuns = (snapshot.data.convocatorias || []).filter((conv) => conv.course?.slug === course.slug)
      const futureUpcoming = ownRuns.some((conv) => {
        if (homeRunBadge(conv) !== 'upcoming') return false
        const start = String(conv.startDate || '').slice(0, 10)
        return /^\d{4}-\d{2}-\d{2}$/.test(start) && start >= today
      })
      if (ownRuns.length > 0 && !futureUpcoming) continue
      const open = course.enrollmentStatus === 'open'
      rows.push({
        ...base,
        id: course.slug,
        enrollmentOpen: open,
        badge: open ? 'open' : 'upcoming',
        running: false,
        startLabel: null,
        startKey: null,
        campuses: rowCampuses(base.modality, []),
      })
    }
    buckets[section].push(...rows)
  }

  for (const convocatoria of snapshot.data.convocatorias || []) {
    const codigo = String(convocatoria.codigo || '')
    if (!codigo || isUnpublishedRunCode(codigo) || usedCodes.has(codigo)) continue
    const badge = homeRunBadge(convocatoria)
    if (badge !== 'open' && badge !== 'running') continue
    const linked = courseForConvocatoria(snapshot, convocatoria)
    const section = sectionForConvocatoria(convocatoria) || (linked && homeCourseSectionKey(linked))
    if (!section) continue
    const name = String(convocatoria.course?.nombre || linked?.nombre || codigo)
    if (!name) continue
    if (linked?.slug) {
      for (const key of HOME_COURSE_SECTION_KEYS) {
        buckets[key] = buckets[key].filter((card) => card.id !== linked.slug)
      }
    }
    const area = linked ? resolveCourseArea(linked) : null
    const campus = campusLabel(convocatoria.campus?.name)
    const modality =
      section === 'teleformacion'
        ? 'Teleformación'
        : linked
          ? listedCourseModality({
              ...linked,
              modality: displayModalityLabel(linked) ?? fallbackModes.get(linked.slug) ?? null,
            })
          : ''
    buckets[section].push({
      id: `${linked?.slug || 'run'}:${codigo}`,
      name,
      href:
        badge === 'running' && linked?.slug
          ? `/p/cursos/${linked.slug}`
          : `/convocatorias/${encodeURIComponent(codigo)}`,
      enrollmentOpen: badge === 'open',
      badge,
      running: badge === 'running',
      hours: linked ? (courseHours(linked) ?? fallbackHours.get(linked.slug) ?? null) : null,
      modality,
      free: rowIsFree(section, modality),
      areaLabel: area?.label ?? null,
      areaColor: area?.color ?? null,
      startLabel: formatStartLabel(String(convocatoria.startDate || '').slice(0, 10)),
      startKey: isoStartKey(convocatoria.startDate),
      campuses: rowCampuses(modality, campus ? [campus] : []),
    })
    usedCodes.add(codigo)
  }

  return HOME_COURSE_SECTIONS.flatMap((section) => {
    const courses = [...buckets[section.key]].sort((left, right) => {
      const rank = badgeRank(left.badge) - badgeRank(right.badge)
      if (rank !== 0) return rank
      if (left.badge === 'open' && right.badge === 'open') {
        const leftKey = left.startKey || '9999-99-99'
        const rightKey = right.startKey || '9999-99-99'
        if (leftKey !== rightKey) return leftKey < rightKey ? -1 : 1
      }
      return left.name.localeCompare(right.name, 'es')
    })
    if (!courses.length) return []
    return [{ key: section.key, title: section.title, courses }]
  })
}

export function displayCourseTitle(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return trimmed
  const lower = trimmed.toLocaleLowerCase('es')
  const sentence = lower.charAt(0).toLocaleUpperCase('es') + lower.slice(1)
  return sentence.replace(/\b(i{1,3}|iv|vi{0,3}|ix|xi{0,3}|xl)\b/gi, (match) => match.toLocaleUpperCase('es'))
}

function courseCtaLabel(course: Pick<HomeCourseCard, 'href' | 'badge'>): string {
  if (course.badge === 'running') return 'Ver&nbsp;curso'
  if (course.badge === 'open' || course.href.includes('/convocatorias/')) return 'Ver&nbsp;convocatoria'
  return 'Ver&nbsp;curso'
}

function courseMetaLine(course: HomeCourseCard): string {
  const parts: string[] = []
  if (course.hours) parts.push(`${course.hours} h`)
  if (course.modality) parts.push(course.modality)
  return parts.join(' · ')
}

const COURSE_TABLE_CSS = `[data-cep-home-courses],[data-cep-home-courses]>*,[data-cep-course-column],[data-cep-course-table],[data-cep-course-row]{max-width:100%;min-width:0;box-sizing:border-box}
[data-cep-course-column]{margin:56px auto 0;width:100%;max-width:80rem;padding:0 1rem;overflow-x:hidden}
[data-cep-course-column]>section+section{margin-top:64px;padding-top:48px;border-top:1px solid #e5e7eb}
[data-cep-course-column] h3{margin:0;font-size:clamp(1.35rem,4vw,1.75rem);line-height:1.2;font-weight:650;color:#0f172a}
[data-cep-course-table]{display:grid;width:100%;max-width:100%;margin-top:40px;overflow-x:hidden;column-gap:8px;grid-template-columns:minmax(16rem,1fr) max-content max-content max-content max-content max-content max-content}
[data-cep-course-row]{display:grid;grid-template-columns:minmax(16rem,1fr) max-content max-content max-content max-content max-content max-content;grid-template-areas:"name area campus start free open cta";align-items:center;column-gap:8px;width:100%;min-width:0;max-width:100%;padding:4px 8px;border-bottom:1px solid #e5e7eb;border-radius:8px;color:inherit;text-decoration:none}
[data-cep-course-row][data-cep-open="1"]{background:#ecfdf5;border-bottom:1px solid #e5e7eb}
[data-cep-cell]{display:block;min-width:0}
[data-cep-cell="name"]{grid-area:name;overflow:hidden;min-width:16rem}
[data-cep-cell="area"]{grid-area:area}
[data-cep-cell="free"]{grid-area:free}
[data-cep-cell="cta"]{grid-area:cta}
[data-cep-cell="open"]{grid-area:open}
[data-cep-cell="start"]{grid-area:start;font-size:12px;font-weight:600;line-height:1.2;color:#0f172a;white-space:nowrap}
[data-cep-cell="campus"]{grid-area:campus;display:flex;gap:4px;min-width:0}
[data-cep-cell="spacer"]{display:none}
[data-cep-title]{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px;font-weight:500;line-height:1.25;color:#0f172a;text-transform:none}
[data-cep-meta]{display:block;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:500;line-height:1.2;color:#64748b}
[data-cep-chip],[data-cep-btn]{display:inline-flex;flex-shrink:0;align-items:center;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:600;line-height:1.2;white-space:nowrap}
[data-cep-chip="free"]{background:#059669;color:#fff}
[data-cep-chip="open"]{background:#16a34a;color:#fff;font-size:12px}
[data-cep-chip="running"]{background:#b8860b;color:#fff;font-size:12px}
[data-cep-chip="upcoming"]{background:#64748b;color:#fff;font-size:12px}
[data-cep-chip="campus"]{background:#fff;color:#0f172a;border:1px solid #e5e7eb;font-size:11px;text-transform:uppercase}
[data-cep-btn]{height:26px;padding:0 12px;font-size:12px;background:#f2014b;color:#fff;justify-content:center}
@supports (grid-template-columns:subgrid){
  [data-cep-course-row]{grid-template-columns:subgrid;grid-column:1/-1}
}
@media (max-width:1023px){
  [data-cep-course-column]{padding:0}
  [data-cep-course-column]>section+section{margin-top:48px;padding-top:36px}
  [data-cep-course-table]{margin-top:28px;grid-template-columns:minmax(0,1fr) minmax(0,1fr) max-content max-content max-content max-content}
  [data-cep-course-row]{grid-template-columns:minmax(0,1fr) minmax(0,1fr) max-content max-content max-content max-content;grid-template-areas:"name name name name name name" "area campus start free open cta";row-gap:8px;column-gap:8px}
}
@supports (grid-template-columns:subgrid){
  @media (max-width:1023px){
    [data-cep-course-row]{grid-template-columns:subgrid;grid-column:1/-1}
  }
}
@media (max-width:767px){
  [data-cep-course-column]{margin-top:40px}
  [data-cep-course-column]>section+section{margin-top:40px;padding-top:32px}
  [data-cep-course-table]{margin-top:20px}
  [data-cep-course-row]{padding:4px 8px}
}
[data-kind="ocupados"] [data-cep-course-table],[data-kind="desempleados"] [data-cep-course-table]{display:flex!important;flex-direction:column!important;align-items:stretch!important;grid-template-columns:none!important}
[data-kind="ocupados"] [data-cep-course-row],[data-kind="desempleados"] [data-cep-course-row]{display:flex!important;flex-flow:row nowrap!important;align-items:center!important;justify-content:flex-start!important;gap:8px!important;width:100%!important;max-width:100%!important;grid-column:1/-1!important;grid-template:none!important}
[data-kind="ocupados"] [data-cep-cell],[data-kind="desempleados"] [data-cep-cell]{grid-area:auto!important;position:static!important;width:auto!important}
[data-kind="ocupados"] [data-cep-cell="name"],[data-kind="desempleados"] [data-cep-cell="name"]{order:1;flex:1 1 auto;min-width:0!important}
[data-kind="ocupados"] [data-cep-cell="area"],[data-kind="desempleados"] [data-cep-cell="area"]{order:2;flex:0 0 auto}
[data-kind="ocupados"] [data-cep-cell="campus"],[data-kind="desempleados"] [data-cep-cell="campus"]{order:3;flex:0 0 auto}
[data-kind="ocupados"] [data-cep-cell="free"],[data-kind="desempleados"] [data-cep-cell="free"]{order:4;flex:0 0 auto}
[data-kind="ocupados"] [data-cep-cell="open"],[data-kind="desempleados"] [data-cep-cell="open"]{order:5;flex:0 0 auto}
[data-kind="ocupados"] [data-cep-cell="cta"],[data-kind="desempleados"] [data-cep-cell="cta"]{order:6;flex:0 0 auto}
[data-kind="ocupados"] [data-cep-cell="start"],[data-kind="desempleados"] [data-cep-cell="start"],[data-kind="ocupados"] [data-cep-cell="spacer"],[data-kind="desempleados"] [data-cep-cell="spacer"]{display:none!important}
[data-cep-virtual="1"] [data-cep-cell="free"]{display:none!important}
@media (max-width:1023px){
  [data-kind="ocupados"] [data-cep-course-row],[data-kind="desempleados"] [data-cep-course-row]{display:grid!important;grid-template-columns:minmax(0,1fr) max-content max-content max-content max-content!important;grid-template-areas:"name name name name name" "area campus free open cta"!important;justify-content:stretch!important;row-gap:8px!important}
  [data-kind="ocupados"] [data-cep-cell="name"],[data-kind="desempleados"] [data-cep-cell="name"]{grid-area:name!important;flex:none!important}
  [data-kind="ocupados"] [data-cep-cell="area"],[data-kind="desempleados"] [data-cep-cell="area"]{grid-area:area!important}
  [data-kind="ocupados"] [data-cep-cell="free"],[data-kind="desempleados"] [data-cep-cell="free"]{grid-area:free!important}
  [data-kind="ocupados"] [data-cep-cell="campus"],[data-kind="desempleados"] [data-cep-cell="campus"]{grid-area:campus!important}
  [data-kind="ocupados"] [data-cep-cell="open"],[data-kind="desempleados"] [data-cep-cell="open"]{grid-area:open!important}
  [data-kind="ocupados"] [data-cep-cell="cta"],[data-kind="desempleados"] [data-cep-cell="cta"]{grid-area:cta!important}
}
`

function courseTableStyleTag(): string {
  return `<style data-cep-course-css="1">${COURSE_TABLE_CSS}</style>`
}

function areaBadgeStyle(color: string): string {
  return `background:${color}26;color:${color};border:1px solid ${color}59`
}

function renderCourseRow(course: HomeCourseCard): string {
  const areaBadge =
    course.areaLabel && course.areaColor
      ? `<span data-cep-chip="area" style="${areaBadgeStyle(course.areaColor)}">${escapeHtml(course.areaLabel)}</span>`
      : ''
  const freeBadge = course.free ? `<span data-cep-chip="free">100% gratuito</span>` : ''
  const openBadge =
    course.badge === 'running'
      ? `<span data-cep-chip="running">En curso</span>`
      : course.badge === 'open'
        ? `<span data-cep-chip="open">Matrícula abierta</span>`
        : `<span data-cep-chip="upcoming">Próximamente</span>`
  const campusBadges = course.campuses
    .map((campus) => `<span data-cep-chip="campus">${escapeHtml(campus)}</span>`)
    .join('')
  const meta = courseMetaLine(course)
  const metaHtml = meta ? `<span data-cep-meta>${escapeHtml(meta)}</span>` : ''
  const virtual = course.modality === 'Teleformación' ? ' data-cep-virtual="1"' : ''
  return `<a href="${escapeHtml(course.href)}" data-cep-course-row="1"${virtual}${course.enrollmentOpen ? ' data-cep-open="1"' : ''}>
  <span data-cep-cell="name">
    <span data-cep-title title="${escapeHtml(displayCourseTitle(course.name))}">${escapeHtml(displayCourseTitle(course.name))}</span>
    ${metaHtml}
  </span>
  <span data-cep-cell="area">${areaBadge}</span>
  <span data-cep-cell="spacer" aria-hidden="true"></span>
  <span data-cep-cell="campus">${campusBadges}</span>
  <span data-cep-cell="start">${course.startLabel ? escapeHtml(course.startLabel) : ''}</span>
  <span data-cep-cell="free">${freeBadge}</span>
  <span data-cep-cell="open">${openBadge}</span>
  <span data-cep-cell="cta"><span data-cep-btn>${courseCtaLabel(course)}</span></span>
</a>`
}

export function renderHomeCourseCatalog(snapshot: CatalogSnapshot): string {
  const groups = groupHomeCourses(snapshot)
  const liveOpen = (snapshot.data.convocatorias || []).filter((conv) => {
    const badge = homeRunBadge(conv)
    return badge === 'open' || badge === 'running'
  }).length
  const shownOpen = groups.reduce(
    (count, group) => count + group.courses.filter((course) => course.badge === 'open' || course.badge === 'running').length,
    0,
  )
  const sections = groups
    .map(
      (group) => `<section data-kind="${escapeHtml(group.key)}" aria-labelledby="home-courses-${group.key}">
  <h3 id="home-courses-${group.key}">${escapeHtml(group.title)}</h3>
  <div data-cep-course-list="1" data-cep-course-table="1">
    ${group.courses.map(renderCourseRow).join('')}
  </div>
</section>`,
    )
    .join('')

  const body = sections
    ? `${courseTableStyleTag()}<div data-cep-course-column="1">${sections}</div>`
    : `<p class="mt-10 text-slate-600">El catálogo se está actualizando desde el dashboard.</p>`

  return `<section id="cursos" class="bg-[#fff7fa]" data-cep-home-courses="ovh" data-layout="stack" data-cep-home-open="${shownOpen}" data-cep-home-live="${liveOpen}">
  <span id="nuevas-formaciones"></span>
  <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
    <h2 class="mx-auto max-w-3xl text-center text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Cursos</h2>
    <p class="mx-auto mt-3 max-w-3xl px-2 text-center text-lg leading-8 text-slate-600">Consulta de un vistazo todos los cursos que imparte CEP Formación, agrupados por tipo de formación.</p>
    ${body}
  </div>
</section><script data-cep-home-courses-capture="1">(function(){var source=document.querySelector('[data-cep-home-courses="ovh"]');if(source&&source.getAttribute('data-layout')==='stack'&&!source.querySelector('img'))window.__cepHomeCoursesTemplate=source.cloneNode(true);})();</script>`
}

export function replaceSectionContaining(html: string, marker: string, replacement: string): string | null {
  const markerIndex = html.indexOf(marker)
  if (markerIndex === -1) return null
  const start = html.lastIndexOf('<section', markerIndex)
  if (start === -1) return null

  let depth = 0
  let cursor = start
  while (cursor < html.length) {
    const nextOpen = html.indexOf('<section', cursor)
    const nextClose = html.indexOf('</section>', cursor)
    if (nextClose === -1) return null
    if (nextOpen !== -1 && nextOpen <= nextClose) {
      depth += 1
      cursor = nextOpen + 8
      continue
    }
    depth -= 1
    cursor = nextClose + 10
    if (depth === 0) {
      return html.slice(0, start) + replacement + html.slice(cursor)
    }
  }
  return null
}

export function catalogPayload(snapshot: CatalogSnapshot): Array<{
  key: HomeCourseSectionKey
  title: string
  courses: Array<{
    name: string
    href: string
    open: boolean
    badge: HomeCourseBadge | null
    running: boolean
    hours: number | null
    modality: string | null
    free: boolean
    areaLabel: string | null
    areaColor: string | null
    startLabel: string | null
    campuses: string[]
  }>
}> {
  return groupHomeCourses(snapshot).map((group) => ({
    key: group.key,
    title: group.title,
    courses: group.courses.map((course) => ({
      name: displayCourseTitle(course.name),
      href: course.href,
      open: course.enrollmentOpen,
      badge: course.badge,
      running: course.running,
      hours: course.hours,
      modality: course.modality,
      free: course.free,
      areaLabel: course.areaLabel,
      areaColor: course.areaColor,
      startLabel: course.startLabel,
      campuses: course.campuses,
    })),
  }))
}

function hydrationLockScript(): string {
  return `<script data-cep-home-courses-lock="1">
(function () {
  var template = window.__cepHomeCoursesTemplate || null;
  if (!template) {
    var source = document.querySelector('[data-cep-home-courses="ovh"]');
    if (source && source.getAttribute('data-layout') === 'stack' && !source.querySelector('img')) template = source.cloneNode(true);
  }
  var applying = false;
  function listRoot() {
    return document.querySelector('[data-cep-home-courses="ovh"]');
  }
  function listOk(el) {
    return Boolean(el && el.getAttribute('data-layout') === 'stack' && document.querySelector('style[data-cep-course-css="1"]') && el.querySelector('[data-cep-course-column="1"]') && el.querySelector('[data-cep-course-table="1"]') && el.querySelector('[data-cep-course-list="1"]') && el.querySelector('[data-cep-cell="name"]') && el.querySelector('[data-cep-btn]') && el.querySelector('a[href*="/p/cursos/"]') && !el.querySelector('img') && !el.querySelector('input'));
  }
  function photoHosts() {
    var hosts = [];
    document.querySelectorAll('input[placeholder*="Buscar en cursos"]').forEach(function (input) {
      var inner = input.closest('section');
      var outer = inner && inner.parentElement ? inner.parentElement.closest('section') : null;
      var host = outer && (outer.textContent || '').indexOf('Consulta de un vistazo') !== -1 ? outer : inner;
      if (host && host.getAttribute('data-cep-home-courses') !== 'ovh') hosts.push(host);
    });
    var nuevas = document.getElementById('nuevas-formaciones');
    if (nuevas && nuevas.tagName === 'SECTION' && nuevas.querySelector('img') && nuevas.getAttribute('data-cep-home-courses') !== 'ovh') {
      hosts.push(nuevas);
    }
    return hosts.filter(function (host, index) { return hosts.indexOf(host) === index; });
  }
  function apply() {
    if (applying || !document.body || !template) return;
    var current = listRoot();
    var photos = photoHosts();
    if (listOk(current) && photos.length === 0) return;
    applying = true;
    try {
      var next = template.cloneNode(true);
      if (photos[0] && photos[0].parentNode) {
        photos[0].replaceWith(next);
        photos.slice(1).forEach(function (host) { if (host.parentNode) host.remove(); });
        if (current && current.parentNode && current !== next) current.remove();
      } else if (current && current.parentNode) {
        current.replaceWith(next);
      } else {
        var heading = Array.prototype.find.call(document.querySelectorAll('h2'), function (item) {
          return (item.textContent || '').trim() === 'Cursos';
        });
        if (heading && heading.closest('section')) heading.closest('section').replaceWith(next);
        else document.body.appendChild(next);
      }
    } finally {
      applying = false;
    }
  }
  var timer = 0;
  function schedule() {
    if (timer) return;
    timer = setTimeout(function () { timer = 0; apply(); }, 80);
  }
  function start() {
    apply();
    var obs = new MutationObserver(schedule);
    obs.observe(document.body, { childList: true, subtree: true });
    [400, 1200, 3000].forEach(function (ms) { setTimeout(apply, ms); });
    setTimeout(function () { obs.disconnect(); apply(); }, 8000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
</script>`
}

function injectLockScript(html: string, script: string): string {
  if (html.includes('data-cep-home-courses-lock="1"')) return html
  if (html.includes('</body>')) return html.replace('</body>', `${script}</body>`)
  if (html.includes('</head>')) return html.replace('</head>', `${script}</head>`)
  return html + script
}

export function stripOriginNuevasFormaciones(html: string): string {
  if (!html.includes('<section id="nuevas-formaciones"')) return html
  return replaceSectionContaining(html, '<section id="nuevas-formaciones"', '') || html
}

export function replaceHomeCourseCatalog(html: string, snapshot: CatalogSnapshot): string {
  const replacement = renderHomeCourseCatalog(snapshot)
  let next =
    replaceSectionContaining(html, 'Consulta de un vistazo todos los cursos', replacement) ||
    replaceSectionContaining(html, 'data-cep-home-courses="ovh"', replacement) ||
    html
  if (!next.includes('data-cep-home-courses="ovh"')) {
    next = replaceSectionContaining(next, 'id="nuevas-formaciones"', replacement) || next
  }
  if (!next.includes('data-cep-home-courses="ovh"')) {
    if (next.includes('</body>')) next = next.replace('</body>', `${replacement}</body>`)
    else next += replacement
  }
  if (next.includes('data-cep-home-courses="ovh"')) {
    next = stripOriginNuevasFormaciones(next)
  }
  return injectLockScript(next, hydrationLockScript())
}
