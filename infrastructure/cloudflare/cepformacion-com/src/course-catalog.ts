import { campusPublicHref } from './campus-name'
import { resolveCourseArea } from './home-course-areas'
import { displayCourseTitle, formatStartLabel } from './home-courses'
import { enrollmentByCourseSlug, homeRunBadge, type PublicEnrollment } from './enrollment-state'
import type { CatalogSnapshot } from './render'

export type CourseKind = 'privados' | 'ocupados' | 'desempleados' | 'teleformacion'

export type CourseListItem = {
  href: string
  title: string
  image: string
  open: boolean
  closed: boolean
  kind: CourseKind
  area: string
  areaLabel: string
  areaColor: string
  modality: string
  start: string
  campus: string
  campusHref: string
  description: string
  convocatoriaHref: string
  runKey?: string
}

export const COURSE_KIND_BADGE: Record<CourseKind, string> = {
  privados: '#f2014b',
  ocupados: '#16a34a',
  desempleados: '#1d4ed8',
  teleformacion: '#f97316',
}

function slugFromHref(href: string): string {
  const path = href.split('?')[0]
  const parts = path.split('/').filter(Boolean)
  return parts[parts.length - 1] || ''
}

export function courseKindFromHref(href: string): CourseKind {
  const slug = slugFromHref(href).toLowerCase()
  if (slug.endsWith('-des')) return 'desempleados'
  if (slug.endsWith('-ocu')) return 'ocupados'
  if (slug.endsWith('-tel')) return 'teleformacion'
  return 'privados'
}

function badgeText(course: Pick<CourseListItem, 'open' | 'closed'>): string {
  if (course.open) return 'Matrícula abierta'
  if (course.closed) return 'Matrícula cerrada'
  return 'Próximamente'
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function jsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

function decode(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function compact(value: string): string {
  return decode(value).replace(/\s+/g, ' ').trim()
}

function cleanArea(value: string): string {
  return compact(value).replace(/^Área\s+/i, '') || 'Por confirmar'
}

function cleanValue(value: string): string {
  const text = compact(value)
  if (!text || text === '-' || /^por confirmar$/i.test(text)) return ''
  return text
}

const VIRTUAL_CAMPUS_BADGE = 'CEP VIRTUAL'

function isTeleformacionPaint(kind: string, modality: string): boolean {
  if (kind === 'teleformacion') return true
  const folded = modality
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
  return folded.includes('teleform') || folded.includes('online')
}

function cleanCampus(value: string): string {
  const text = cleanValue(value)
  if (!text) return ''
  const folded = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
  if (/\bvirtual\b/.test(folded)) return VIRTUAL_CAMPUS_BADGE
  if (/\bsur\b/.test(folded)) return 'CEP Sur'
  if (/\bnorte\b/.test(folded) || /\borotava\b/.test(folded)) return 'CEP Norte'
  if (/\bsanta\s*cruz\b/.test(folded)) return 'CEP Santa Cruz'
  return text
}

function unescapeJsonString(value: string): string {
  try {
    return String(JSON.parse(`"${value}"`))
  } catch {
    return compact(value.replace(/\\"/g, '"').replace(/\\n/g, ' '))
  }
}

function isDummyDescription(value: string): boolean {
  const text = compact(value)
  return !text || /^curso de formaci[oó]n profesional$/i.test(text)
}

function ingestDescription(out: Record<string, string>, slug: string, raw: string) {
  if (!slug || slug.includes('/') || slug.length > 120) return
  const text = unescapeJsonString(raw)
  if (isDummyDescription(text)) return
  out[slug] = compact(text)
}

export function parseCourseDescriptions(html: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const match of html.matchAll(/"slug":"([^"]+)"[\s\S]{0,800}?"descripcion":"((?:\\.|[^"\\])*)"/g)) {
    ingestDescription(out, match[1], match[2])
  }
  for (const match of html.matchAll(
    /\\"slug\\":\\"([^\\"]+)\\"[\s\S]{0,800}?\\"descripcion\\":\\"((?:\\\\.|[^\\"\\\\])*)\\"/g,
  )) {
    ingestDescription(out, match[1], match[2])
  }
  for (const match of html.matchAll(/"slug":"([^"]+)"[\s\S]{0,1200}?"descripcionDetallada":\["((?:\\.|[^"\\])*)"/g)) {
    if (out[match[1]]) continue
    ingestDescription(out, match[1], match[2])
  }
  for (const match of html.matchAll(
    /\\"slug\\":\\"([^\\"]+)\\"[\s\S]{0,1200}?\\"descripcionDetallada\\":\[\\"((?:\\\\.|[^\\"\\\\])*)\\"/g,
  )) {
    if (out[match[1]]) continue
    ingestDescription(out, match[1], match[2])
  }
  return out
}

const LIST_CARD = /<a class="group block" href="(\/p\/cursos\/[^"]+)"[\s\S]*?<\/a>/g

export function parseCourseListCards(html: string): CourseListItem[] {
  const descriptions = parseCourseDescriptions(html)
  const cards: CourseListItem[] = []
  const seen = new Set<string>()
  for (const match of html.matchAll(LIST_CARD)) {
    const block = match[0]
    const href = match[1]
    if (seen.has(href)) continue
    const titleRaw = compact(block.match(/<h3[^>]*>([^<]+)<\/h3>/i)?.[1] || '')
    const image = block.match(/<img[^>]*\ssrc="([^"]+)"/i)?.[1] || ''
    if (!titleRaw || !image) continue
    const facts: Record<string, string> = {}
    for (const row of block.matchAll(
      /<span class="font-bold[^"]*">([^<]+)<\/span>\s*<span class="[^"]*">([^<]*)<\/span>/g,
    )) {
      facts[compact(row[1])] = compact(row[2])
    }
    seen.add(href)
    const title = displayCourseTitle(titleRaw)
    const area = cleanArea(facts.Área || facts.Area || '')
    const areaBadge = resolveCourseArea({ area, nombre: title })
    const kind = courseKindFromHref(href)
    const modality = cleanValue(facts.Modalidad || 'Presencial') || 'Presencial'
    const tele = isTeleformacionPaint(kind, modality)
    cards.push({
      href,
      title,
      image,
      open: /Matrícula abierta/.test(block),
      closed: /Matrícula cerrada/.test(block),
      kind,
      area,
      areaLabel: areaBadge?.label || area,
      areaColor: areaBadge?.color || '#475569',
      modality,
      start: cleanValue(facts.Inicio || ''),
      campus: tele ? VIRTUAL_CAMPUS_BADGE : cleanCampus(facts.Sede || ''),
      campusHref: tele ? '' : campusPublicHref(facts.Sede || ''),
      description: descriptions[slugFromHref(href)] || '',
      convocatoriaHref: '',
    })
  }
  return cards
}

const COURSE_CATALOG_CSS = `[data-cep-course-list="catalog"][data-cep-view="list"]{display:flex!important;flex-direction:column!important;gap:.65rem!important}
[data-cep-course-list="catalog"][data-cep-view="grid"]:not(:has(>.cep-course-row)){display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:1.5rem!important;align-items:stretch}
@media (max-width:767px){[data-cep-course-list="catalog"][data-cep-view="grid"]:not(:has(>.cep-course-row)){grid-template-columns:minmax(0,1fr)!important}}
button[aria-label="Vista de lista"][data-state="on"],button[aria-label="Vista en cuadrícula"][data-state="on"]{background:#f2014b!important;color:#fff!important;box-shadow:none!important}
[data-cep-course-list="catalog"] a.group.h-full [class*="min-h-[560px]"]{min-height:0!important}
[data-cep-course-list="catalog"]:has(>.cep-course-row){display:flex!important;flex-direction:column!important;gap:.65rem!important}
[data-cep-course-list="catalog"]>.cep-course-row{width:100%}
.cep-course-row{color:inherit}
.cep-course-list{display:grid;grid-template-columns:10.5rem minmax(0,1fr);align-items:stretch;overflow:hidden;border:1px solid #e5e7eb;border-radius:.85rem;background:#fff;box-shadow:0 1px 2px rgb(15 23 42 / .05)}
.cep-course-row[data-open="1"] .cep-course-list,.cep-course-list:has(.cep-course-list-badge[data-open="1"]){background:#ecfdf5;border-color:#a7f3d0}
.cep-course-list-photo{position:relative;min-height:7.25rem;background:#f1f5f9}
.cep-course-list-photo img{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover}
.cep-course-list-body{display:flex;min-width:0;flex-direction:column;justify-content:center;gap:.7rem;padding:.85rem 1.15rem}
.cep-course-list-head{display:flex;align-items:flex-start;justify-content:space-between;gap:.6rem}
.cep-course-list-head h3{margin:0;color:#0f172a;font-size:1.35rem;font-weight:650;line-height:1.2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.cep-course-list-badge{flex:0 0 auto;border-radius:999px;padding:.2rem .6rem;background:#f2014b;color:#fff;font-size:.72rem;font-weight:600;line-height:1.2;white-space:nowrap}
.cep-course-list-badge[data-kind="ocupados"]{background:#16a34a}
.cep-course-list-badge[data-kind="desempleados"]{background:#1d4ed8}
.cep-course-list-badge[data-kind="teleformacion"]{background:#f97316}
.cep-course-list-badge[data-open="0"]{background:#64748b}
.cep-course-list-facts{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;column-gap:1.5rem;row-gap:.55rem}
.cep-course-list-facts>div{min-width:0}
.cep-course-list-facts [data-cep-chip="area"]{display:inline-flex;align-items:center;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:600;line-height:1.2;white-space:nowrap}
.cep-course-list-facts p{margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cep-course-list-facts p:first-child{color:#64748b;font-size:.68rem;font-weight:600}
.cep-course-list-facts p+p{margin-top:.05rem;color:#0f172a;font-size:.84rem;font-weight:600}
.cep-course-list-cta{display:flex;flex-wrap:wrap;gap:.45rem;margin-left:0}
.cep-course-list-cta a{display:inline-flex;align-items:center;justify-content:center;padding:.4rem .85rem;border-radius:999px;background:#f2014b;color:#fff;font-size:.82rem;font-weight:600;white-space:nowrap;text-decoration:none}
.cep-course-list-cta a[data-cep-cta="course"]{background:#fff;color:#3E091A;border:1px solid #e5e7eb}
.cep-course-list-cta a:not([data-cep-cta="course"]){background:#f2014b!important;color:#fff!important;border-color:#f2014b!important}
@media (max-width:767px){
  .cep-course-list{grid-template-columns:7.5rem minmax(0,1fr)}
  .cep-course-list-photo{min-height:100%}
  .cep-course-list-facts{column-gap:1.15rem}
  .cep-course-list-cta{margin-left:0}
}
.cep-course-list-copy{display:none!important}
a.group.block[href*="/cursos/"]{color:inherit;text-decoration:none}
a.group.h-full[href*="/cursos/"],a.group.h-full[href*="/cursos/"]:hover,a.group.block[href*="/cursos/"],a.group.block[href*="/cursos/"]:hover,.cep-course-row,.cep-course-row:hover{translate:none!important;transform:none!important}
a.group.block[href*="/cursos/"]>div{grid-template-columns:10.5rem minmax(0,1fr)!important;min-height:0;border-radius:.85rem}
a.group.h-full[href*="/cursos/"]>div,a.group.h-full[href*="/cursos/"]>div:hover,a.group.block[href*="/cursos/"]>div,a.group.block[href*="/cursos/"]>div:hover,.cep-course-row .cep-course-list,.cep-course-row .cep-course-list:hover,.cep-course-row:hover .cep-course-list{translate:none!important;transform:none!important;transition:box-shadow .18s ease,border-color .18s ease!important}
a.group.h-full[href*="/cursos/"]:hover>div,a.group.block[href*="/cursos/"]:hover>div,.cep-course-row:hover .cep-course-list{box-shadow:0 8px 18px rgb(15 23 42 / .10)!important}
a.group.block[href*="/cursos/"]:has(.bg-green-600)>div,a.group.block[href*="/cursos/"]:has(.bg-emerald-600)>div,a.group.block[href*="/cursos/"][data-cep-open="1"]>div{background:#ecfdf5!important;border-color:#a7f3d0!important}
a.group.h-full[href*="/cursos/"]:has(.bg-green-600)>div,a.group.h-full[href*="/cursos/"]:has(.bg-emerald-600)>div,a.group.h-full[href*="/cursos/"]:has(.bg-green-600) [class*="min-h-[560px]"],a.group.h-full[href*="/cursos/"]:has(.bg-emerald-600) [class*="min-h-[560px]"],a.group.h-full[href*="/cursos/"][data-cep-open="1"]>div,a.group.h-full[href*="/cursos/"][data-cep-open="1"] [class*="min-h-[560px]"]{background:#ecfdf5!important;border-color:#a7f3d0!important}
a.group.block[href*="/cursos/"] p.mt-1.text-sm.leading-6.text-slate-600,a.group.h-full[href*="/cursos/"] p.mt-1.text-sm.leading-6.text-slate-600{display:none!important}
a.group.block[href*="/cursos/"] p.mt-1.text-sm.leading-6.text-slate-600[data-cep-copy="1"],a.group.h-full[href*="/cursos/"] p.mt-1.text-sm.leading-6.text-slate-600[data-cep-copy="1"]{display:-webkit-box!important;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:#475569!important;font-size:.9rem!important;line-height:1.45!important;font-weight:500}
a.group.block[href*="/cursos/"] span[style*="#E3003A"]{display:none!important}
a.group.block[href*="/cursos/"] [class*="xl:grid-cols-[1fr_1.45fr]"]{display:flex!important;flex-direction:column;gap:1rem}
a.group.block[href*="/cursos/"] [class*="bg-slate-50"]{background:transparent!important;padding:0!important;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.85rem 1.1rem}
a.group.block[href*="/cursos/"] h3{min-height:2.6em;font-weight:600!important}
@media (max-width:767px){a.group.block[href*="/cursos/"]>div{grid-template-columns:1fr!important}}
a.group.h-full[href*="/cursos/"]>div{position:relative}
a.group.h-full[href*="/cursos/"] [class*="min-h-[560px]"]{position:relative}
a.group.h-full[href*="/cursos/"] span[style*="#E3003A"]:not([data-cep-chip="area"]),a.group.h-full[href*="/cursos/"] span[style*="rgb(227, 0, 58)"]:not([data-cep-chip="area"]),a.group.h-full[href*="/cursos/"] span[style*="rgb(227,0,58)"]:not([data-cep-chip="area"]){display:none!important}
a.group.h-full[href*="/cursos/"] [data-cep-chip="area"]{display:inline-flex!important;align-items:center;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:600;line-height:1.2;letter-spacing:0;text-transform:none;white-space:nowrap}
a.group.h-full[href*="/cursos/"] .bg-green-600,a.group.h-full[href*="/cursos/"] .bg-emerald-600,a.group.h-full[href*="/cursos/"] .bg-slate-500,a.group.h-full[href*="/cursos/"] .bg-slate-600,a.group.h-full[href*="/cursos/"] .bg-slate-700,a.group.h-full[href*="/cursos/"] .bg-gray-500,a.group.h-full[href*="/cursos/"] .bg-gray-600{display:none!important}
a.group[href*="/cursos/"] .bg-green-600,a.group[href*="/cursos/"] .bg-emerald-600{background:#16a34a!important;color:#fff!important}
a.group.h-full[href*="/cursos/"] [class*="mb-4 flex flex-wrap"]{margin-bottom:.75rem}
[data-cep-sede]{cursor:pointer}
a.group.h-full[href*="/cursos/"] [data-cep-sede]{transition:border-color .15s ease,box-shadow .15s ease}
a.group.h-full[href*="/cursos/"] [data-cep-sede]:hover{border-color:#f2014b;box-shadow:0 0 0 1px #f2014b}
.cep-course-list-facts [data-cep-sede] p+p{color:#f2014b}
.cep-course-list-facts [data-cep-sede]:hover p+p{text-decoration:underline}
a.group.h-full[href*="/cursos/"] [data-cep-card-actions]{display:flex!important;justify-content:space-between!important;align-items:center;gap:.75rem;width:100%}
a.group.h-full[href*="/cursos/"] [data-cep-cta="course"]{display:inline-flex!important;width:fit-content!important;flex:0 0 auto!important;align-items:center;justify-content:center;border-radius:999px!important;background:#fff!important;color:#3E091A!important;border:1px solid #e5e7eb!important;box-shadow:none!important;padding:.7rem 1rem!important;font-size:.875rem!important;font-weight:800!important;line-height:1.2!important;white-space:nowrap}
a.group.h-full[href*="/cursos/"] [data-cep-cta="course"] svg{display:none!important}
a.group.h-full[href*="/cursos/"] [data-cep-grid-cta="run"]{display:inline-flex;width:fit-content;flex:0 0 auto;align-items:center;justify-content:center;border-radius:999px;background:#f2014b;color:#fff;padding:.7rem 1rem;font-size:.875rem;font-weight:800;line-height:1.2;white-space:nowrap;cursor:pointer}`

function catalogCss(): string {
  return `<style data-cep-course-catalog-css="1">${COURSE_CATALOG_CSS}</style>`
}

function factHtml(label: string, value: string, href = ''): string {
  const attr = href ? ` data-cep-sede="${escapeHtml(href)}"` : ''
  return `<div${attr}><p>${escapeHtml(label)}</p><p>${escapeHtml(value)}</p></div>`
}

function areaChipHtml(course: CourseListItem): string {
  const label = course.areaLabel || course.area
  if (!label) return ''
  const color = course.areaColor || '#475569'
  const style = `background:${color}26;color:${color};border:1px solid ${color}59`
  return `<span data-cep-chip="area" style="${style}">${escapeHtml(label)}</span>`
}

function ctaHtml(course: CourseListItem, courseLabel = 'Ver curso'): string {
  const courseLink = `<a href="${escapeHtml(course.href)}" data-cep-cta="course">${escapeHtml(courseLabel)}</a>`
  const runLink = course.convocatoriaHref
    ? `<a href="${escapeHtml(course.convocatoriaHref)}">Ver convocatoria</a>`
    : ''
  return `<div class="cep-course-list-cta">${courseLink}${runLink}</div>`
}

export function renderCatalogCard(course: CourseListItem, labels?: { badge?: string; course?: string }): string {
  return cardHtml(course, labels)
}

export function expandCatalogRuns(course: CourseListItem, snapshot?: CatalogSnapshot | null): CourseListItem[] {
  return expandCourseRuns(course, snapshot)
}

function cardHtml(course: CourseListItem, labels?: { badge?: string; course?: string }): string {
  return `<article class="cep-course-row" data-href="${escapeHtml(course.href)}" data-open="${course.open ? '1' : '0'}"><div class="cep-course-list">
  <div class="cep-course-list-photo"><img src="${escapeHtml(course.image)}" alt="${escapeHtml(course.title)}" loading="lazy" decoding="async"></div>
  <div class="cep-course-list-body">
    <div class="cep-course-list-head">
      <h3>${escapeHtml(course.title)}</h3>
      <span class="cep-course-list-badge" data-kind="${escapeHtml(course.kind)}" data-open="${course.open ? '1' : '0'}">${escapeHtml(labels?.badge || badgeText(course))}</span>
    </div>
    <div class="cep-course-list-facts">
      ${areaChipHtml(course)}
      ${factHtml('Modalidad', course.modality)}
      ${course.start ? factHtml('Inicio', course.start) : ''}
      ${course.campus ? factHtml('Sede', course.campus, course.campusHref) : ''}
      ${ctaHtml(course, labels?.course)}
    </div>
  </div>
</div></article>`
}

function injectCss(html: string): string {
  if (html.includes('data-cep-course-catalog-css="1"')) return html
  const tag = catalogCss()
  if (html.includes('</head>')) return html.replace('</head>', `${tag}</head>`)
  return tag + html
}

function injectLock(
  html: string,
  courses: CourseListItem[],
  descriptions: Record<string, string>,
  enrollment: Record<string, PublicEnrollment>,
): string {
  if (html.includes('data-cep-course-catalog-lock="1"')) return html
  const script = `<script data-cep-course-catalog-lock="1">
(function () {
  if (window.__cepCourseCatalogLock) return;
  window.__cepCourseCatalogLock = 1;
  var COURSES = ${jsonForScript(courses)};
  var DESCRIPTIONS = ${jsonForScript(descriptions)};
  var ENROLLMENT = ${jsonForScript(enrollment)};
  var CSS = ${jsonForScript(COURSE_CATALOG_CSS)};
  function ensureCss() {
    var style = document.querySelector('[data-cep-course-catalog-css="1"]');
    if (!style) {
      style = document.createElement('style');
      style.setAttribute('data-cep-course-catalog-css', '1');
      document.head.appendChild(style);
    }
    if (style.textContent !== CSS) style.textContent = CSS;
  }
  function findCourse(href) {
    var matches = coursesForHref(href);
    return matches.length ? matches[0] : null;
  }
  function coursesForHref(href) {
    var exact = [];
    var slugHits = [];
    var slug = slugFromHref(href);
    for (var i = 0; i < COURSES.length; i += 1) {
      if (COURSES[i].href === href) exact.push(COURSES[i]);
      else if (slug && slugFromHref(COURSES[i].href) === slug) slugHits.push(COURSES[i]);
    }
    return exact.length ? exact : slugHits;
  }
  function slugFromHref(href) {
    var parts = String(href || '').split('?')[0].split('/');
    return parts[parts.length - 1] || '';
  }
  var KIND_COLOR = { privados: '#f2014b', ocupados: '#16a34a', desempleados: '#1d4ed8', teleformacion: '#f97316' };
  function rowHref(node) {
    return (node && (node.getAttribute('data-href') || node.getAttribute('href'))) || '';
  }
  function courseKind(href) {
    var slug = slugFromHref(href).toLowerCase();
    if (/-des$/.test(slug)) return 'desempleados';
    if (/-ocu$/.test(slug)) return 'ocupados';
    if (/-tel$/.test(slug)) return 'teleformacion';
    return 'privados';
  }
  function paintEnrollmentBadge(span, href, open) {
    span.style.color = '#fff';
    span.style.backgroundColor = open ? '#16a34a' : '#64748b';
  }
  function enrollmentState(href) {
    var course = findCourse(href);
    if (course && course.open) return 'open';
    if (course && course.closed) return 'closed';
    var slug = slugFromHref(href);
    if (ENROLLMENT[slug] === 'closed') return 'closed';
    if (ENROLLMENT[slug] === 'open') return 'open';
    if (ENROLLMENT[slug] === 'upcoming') return 'upcoming';
    return '';
  }
  function enrollmentText(state) {
    if (state === 'open') return 'Matrícula abierta';
    if (state === 'closed') return 'Matrícula cerrada';
    return 'Próximamente';
  }
  function paintAllEnrollmentBadges() {
    document.querySelectorAll('a.group[href*="/cursos/"], .cep-course-row').forEach(function (link) {
      var href = rowHref(link);
      var state = enrollmentState(href);
      link.querySelectorAll('span').forEach(function (span) {
        var t = (span.textContent || '').replace(/\\s+/g, ' ').trim();
        if (!/^matr[ií]cula abierta$/i.test(t) && !/^matr[ií]cula cerrada$/i.test(t) && !/^pr[oó]ximamente$/i.test(t) && !/^pr[oó]ximas fechas$/i.test(t)) return;
        if (state) {
          var next = enrollmentText(state);
          if (span.textContent !== next) span.textContent = next;
        }
        paintEnrollmentBadge(span, href, state === 'open');
      });
    });
  }
  function paintOpenCards() {
    document.querySelectorAll('a.group[href*="/cursos/"], .cep-course-row').forEach(function (link) {
      var href = rowHref(link);
      var state = enrollmentState(href);
      var open = state === 'open';
      if (!state) {
        var spans = link.querySelectorAll('span');
        for (var i = 0; i < spans.length; i += 1) {
          var t = (spans[i].textContent || '').replace(/\\s+/g, ' ').trim();
          if (/^matr[ií]cula abierta$/i.test(t)) { open = true; break; }
        }
      }
      if (open) link.setAttribute('data-cep-open', '1');
      else link.removeAttribute('data-cep-open');
      var cards = [];
      var rewritten = link.querySelector('.cep-course-list');
      if (rewritten) cards.push(rewritten);
      var origin = link.firstElementChild;
      if (origin && origin !== rewritten) cards.push(origin);
      var grid = link.querySelector('[class*="min-h-[560px]"]');
      if (grid) cards.push(grid);
      cards.forEach(function (card) {
        if (open) {
          card.style.setProperty('background-color', '#ecfdf5', 'important');
          card.style.setProperty('border-color', '#a7f3d0', 'important');
        } else {
          card.style.removeProperty('background-color');
          card.style.removeProperty('border-color');
        }
      });
    });
  }
  function descriptionFor(href) {
    var course = findCourse(href);
    if (course && course.description) return course.description;
    return DESCRIPTIONS[slugFromHref(href)] || '';
  }
  function isDummyCopy(text) {
    return /^curso de formaci[oó]n profesional$/i.test(String(text || '').replace(/\\s+/g, ' ').trim());
  }
  function fillDescriptions() {
    document.querySelectorAll('a.group[href*="/cursos/"]').forEach(function (link) {
      if (link.className.indexOf('cep-course-row') !== -1) return;
      var href = link.getAttribute('href') || '';
      var copy = descriptionFor(href);
      var target = link.querySelector('p[data-cep-copy="1"]') || link.querySelector('p.cep-course-list-copy') || link.querySelector('p.mt-1.text-sm.leading-6.text-slate-600');
      if (!target) {
        var ps = link.querySelectorAll('p');
        for (var i = 0; i < ps.length; i += 1) {
          if (isDummyCopy(ps[i].textContent)) { target = ps[i]; break; }
        }
      }
      if (!target) return;
      if (!copy) {
        target.removeAttribute('data-cep-copy');
        target.style.display = 'none';
        return;
      }
      if (target.textContent !== copy) target.textContent = copy;
      target.setAttribute('data-cep-copy', '1');
    });
  }
  function fact(label, value, href) {
    var wrap = document.createElement('div');
    if (href) wrap.setAttribute('data-cep-sede', href);
    var k = document.createElement('p');
    k.textContent = label;
    var v = document.createElement('p');
    v.textContent = value;
    wrap.appendChild(k);
    wrap.appendChild(v);
    return wrap;
  }
  function build(course) {
    var link = document.createElement('article');
    link.className = 'cep-course-row';
    link.setAttribute('data-href', course.href);
    if (course.runKey) link.setAttribute('data-run', course.runKey);
    link.setAttribute('data-open', course.open ? '1' : '0');
    var article = document.createElement('div');
    article.className = 'cep-course-list';
    var photo = document.createElement('div');
    photo.className = 'cep-course-list-photo';
    var img = document.createElement('img');
    img.setAttribute('src', course.image);
    img.setAttribute('alt', course.title);
    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');
    photo.appendChild(img);
    var body = document.createElement('div');
    body.className = 'cep-course-list-body';
    var head = document.createElement('div');
    head.className = 'cep-course-list-head';
    var title = document.createElement('h3');
    title.textContent = course.title;
    var badge = document.createElement('span');
    badge.className = 'cep-course-list-badge';
    badge.setAttribute('data-kind', course.kind || courseKind(course.href));
    badge.setAttribute('data-open', course.open ? '1' : '0');
    badge.textContent = course.open ? 'Matrícula abierta' : course.closed ? 'Matrícula cerrada' : 'Próximamente';
    head.appendChild(title);
    head.appendChild(badge);
    var facts = document.createElement('div');
    facts.className = 'cep-course-list-facts';
    var areaName = course.areaLabel || course.area;
    if (areaName) {
      var chip = document.createElement('span');
      chip.setAttribute('data-cep-chip', 'area');
      var color = course.areaColor || '#475569';
      chip.style.background = color + '26';
      chip.style.color = color;
      chip.style.border = '1px solid ' + color + '59';
      chip.textContent = areaName;
      facts.appendChild(chip);
    }
    facts.appendChild(fact('Modalidad', course.modality));
    if (course.start) facts.appendChild(fact('Inicio', course.start));
    if (course.campus) facts.appendChild(fact('Sede', course.campus, course.campusHref));
    var cta = document.createElement('div');
    cta.className = 'cep-course-list-cta';
    var courseLink = document.createElement('a');
    courseLink.href = course.href;
    courseLink.textContent = 'Ver curso';
    courseLink.setAttribute('data-cep-cta', 'course');
    cta.appendChild(courseLink);
    if (course.convocatoriaHref) {
      var runLink = document.createElement('a');
      runLink.href = course.convocatoriaHref;
      runLink.textContent = 'Ver convocatoria';
      runLink.style.setProperty('background-color', '#f2014b', 'important');
      runLink.style.setProperty('color', '#fff', 'important');
      runLink.style.setProperty('border-color', '#f2014b', 'important');
      cta.appendChild(runLink);
    }
    facts.appendChild(cta);
    body.appendChild(head);
    body.appendChild(facts);
    article.appendChild(photo);
    article.appendChild(body);
    link.appendChild(article);
    return link;
  }
  var parked = {};
  var preferGrid = false;
  function markList() {
    var section = document.querySelector('#privados, #ocupados, #desempleados, #teleformacion');
    if (!section) return;
    var stack = section.querySelector('.grid.gap-5') || section.querySelector('[data-cep-course-list="catalog"]');
    if (!stack) return;
    stack.setAttribute('data-cep-course-list', 'catalog');
    stack.setAttribute('data-cep-view', preferGrid ? 'grid' : 'list');
  }
  function paintToggle() {
    document.querySelectorAll('button[aria-label="Vista de lista"], button[aria-label="Vista en cuadrícula"]').forEach(function (btn) {
      if (btn.getAttribute('data-state') === 'on') {
        btn.style.setProperty('background', '#f2014b', 'important');
        btn.style.setProperty('color', '#fff', 'important');
      } else {
        btn.style.removeProperty('background');
        btn.style.removeProperty('color');
      }
    });
  }
  function buttonLabel(btn) {
    return ((btn.getAttribute('aria-label') || '') + ' ' + (btn.getAttribute('title') || '') + ' ' + (btn.textContent || '')).replace(/\\s+/g, ' ').trim();
  }
  function isGridButton(btn) {
    return /cuadr[ií]cula|\\bCards\\b/i.test(buttonLabel(btn));
  }
  function isListButton(btn) {
    return /lista/i.test(buttonLabel(btn));
  }
  function restoreParked() {
    Object.keys(parked).forEach(function (href) {
      var rows = [].slice.call(document.querySelectorAll('.cep-course-row[data-href="' + href + '"]'));
      var orig = parked[href];
      if (!orig || !rows.length || !rows[0].parentNode) return;
      try {
        rows[0].parentNode.insertBefore(orig, rows[0]);
        rows.forEach(function (row) { row.remove(); });
      } catch (err) {}
    });
    document.querySelectorAll('.cep-course-row, a.group.h-full[data-cep-run-clone="1"]').forEach(function (node) { node.remove(); });
    var stack = document.querySelector('[data-cep-course-list="catalog"]');
    if (!stack) return;
    [].slice.call(stack.querySelectorAll('a.group')).forEach(function (link) { stack.appendChild(link); });
  }
  function isMessyList(link) {
    var nodes = link.querySelectorAll('div');
    for (var i = 0; i < nodes.length; i += 1) {
      if (String(nodes[i].className || '').indexOf('grid-cols-[220px') !== -1) return true;
    }
    return false;
  }
  function campusHref(text) {
    var folded = String(text || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
    if (!folded) return '';
    if (/\\b(por confirmar|a confirmar|sin sede|online|teleform|desde casa)\\b/.test(folded) && !/\\b(norte|sur|santa\\s*cruz|orotava|laguna)\\b/.test(folded)) return '';
    if (/\\bsur\\b/.test(folded)) return '/sedes/cep-sur';
    if (/\\bnorte\\b/.test(folded) || /\\borotava\\b/.test(folded) || /\\blaguna\\b/.test(folded)) return '/sedes/sede-norte';
    if (/\\bsanta\\s*cruz\\b/.test(folded)) return '/sedes/sede-santa-cruz';
    return '';
  }
  function markSedeBox(el) {
    var href = campusHref(el.textContent || '');
    if (!href) {
      if (el.hasAttribute('data-cep-sede')) el.removeAttribute('data-cep-sede');
      return;
    }
    if (el.getAttribute('data-cep-sede') !== href) el.setAttribute('data-cep-sede', href);
    el.style.cursor = 'pointer';
  }
  function markSedeLinks() {
    document.querySelectorAll('a.group.h-full[href*="/cursos/"] [class*="sm:grid-cols-2"] > div').forEach(markSedeBox);
    document.querySelectorAll('a.group.h-full[href*="/cursos/"] [class*="sm:grid-cols-2"] .p-3').forEach(markSedeBox);
    document.querySelectorAll('a.group.block[href*="/cursos/"] [class*="bg-slate-50"] > div').forEach(function (row) {
      var label = row.querySelector('span.font-bold, dt, p');
      if (!label || (label.textContent || '').replace(/\\s+/g, ' ').trim() !== 'Sede') return;
      markSedeBox(row);
    });
    document.querySelectorAll('.cep-course-list-facts > div').forEach(function (row) {
      var label = row.querySelector('p');
      if (!label || (label.textContent || '').trim() !== 'Sede') return;
      markSedeBox(row);
    });
  }
  function isPlaceholder(value) {
    var t = String(value || '').replace(/\\s+/g, ' ').trim();
    return !t || t === '-' || t === '–' || t === '—' || /^por confirmar$/i.test(t);
  }
  function pinEnrollmentBadges() {
    document.querySelectorAll('a.group.h-full[href*="/cursos/"]').forEach(function (link) {
      var card = link.querySelector('[class*="min-h-[560px]"]') || link.firstElementChild;
      if (card) card.style.position = 'relative';
      link.querySelectorAll('span').forEach(function (span) {
        var t = (span.textContent || '').replace(/\\s+/g, ' ').trim();
        if (/^cursos (privados|para desempleados|para ocupados|para trabajadores.as desempleados.as|para trabajadores.as ocupados.as)$/i.test(t) || /^teleformaci[oó]n$/i.test(t)) {
          span.style.display = 'none';
          return;
        }
        if (/^matr[ií]cula abierta$/i.test(t) || /^matr[ií]cula cerrada$/i.test(t) || /^pr[oó]ximamente$/i.test(t) || /^pr[oó]ximas fechas$/i.test(t)) {
          span.style.position = 'absolute';
          span.style.top = '1rem';
          span.style.right = '1rem';
          span.style.zIndex = '4';
          span.style.margin = '0';
          span.style.whiteSpace = 'nowrap';
          var href = link.getAttribute('href') || '';
          paintEnrollmentBadge(span, href, enrollmentState(href) === 'open' || (!enrollmentState(href) && /^matr[ií]cula abierta$/i.test(t)));
        }
      });
    });
  }
  function hideEmptyBox(box) {
    var text = (box.textContent || '').replace(/\\s+/g, ' ').trim();
    var match = text.match(/^(inicio|sede)\\s*(.*)$/i);
    if (!match) return false;
    if (!isPlaceholder(match[2])) return false;
    var target = box;
    if (box.parentNode && (' ' + String(box.className || '') + ' ').indexOf(' p-3 ') !== -1) target = box.parentNode;
    target.style.display = 'none';
    return true;
  }
  function hideEmptyFacts() {
    document.querySelectorAll('a.group.h-full[href*="/cursos/"] [class*="sm:grid-cols-2"] > div').forEach(hideEmptyBox);
    document.querySelectorAll('a.group.h-full[href*="/cursos/"] [class*="sm:grid-cols-2"] .p-3').forEach(hideEmptyBox);
    document.querySelectorAll('a.group.block[href*="/cursos/"] [class*="bg-slate-50"] > div').forEach(hideEmptyBox);
    document.querySelectorAll('.cep-course-list-facts > div').forEach(function (row) {
      var ps = row.querySelectorAll('p');
      if (ps.length < 2) return;
      var label = (ps[0].textContent || '').trim();
      if ((label === 'Inicio' || label === 'Sede') && isPlaceholder(ps[1].textContent || '')) row.style.display = 'none';
    });
    document.querySelectorAll('a.group.h-full[href*="/cursos/"] [class*="sm:grid-cols-2"]').forEach(function (grid) {
      var kids = grid.children;
      var shown = 0;
      for (var i = 0; i < kids.length; i += 1) {
        if (kids[i].style.display !== 'none') shown += 1;
      }
      if (!shown) grid.style.display = 'none';
    });
  }
  function setFact(link, label, value) {
    if (!value) return;
    var nodes = link.querySelectorAll('p');
    for (var i = 0; i < nodes.length; i += 1) {
      if ((nodes[i].textContent || '').replace(/\\s+/g, ' ').trim().toLowerCase() !== String(label).toLowerCase()) continue;
      var valueNode = nodes[i].nextElementSibling;
      if (valueNode && valueNode.tagName === 'P' && valueNode.textContent !== value) valueNode.textContent = value;
      return;
    }
  }
  function paintGridRun(link, course) {
    if (course.runKey) link.setAttribute('data-cep-run', course.runKey);
    else link.removeAttribute('data-cep-run');
    setFact(link, 'Inicio', course.start);
    setFact(link, 'Sede', course.campus);
  }
  function duplicateGridRuns() {
    [].slice.call(document.querySelectorAll('a.group.h-full[href*="/cursos/"]')).forEach(function (link) {
      if (link.getAttribute('data-cep-run-clone') === '1' || isMessyList(link)) return;
      var matches = coursesForHref(link.getAttribute('href') || '');
      if (!matches.length || !link.parentNode) return;
      paintGridRun(link, matches[0]);
      var expected = matches.slice(1);
      var sibling = link.nextElementSibling;
      var existing = [];
      while (sibling && sibling.getAttribute && sibling.getAttribute('data-cep-run-clone') === '1' && sibling.getAttribute('href') === link.getAttribute('href')) {
        existing.push(sibling);
        sibling = sibling.nextElementSibling;
      }
      var same = existing.length === expected.length;
      if (same) {
        expected.forEach(function (course, index) {
          if (existing[index].getAttribute('data-cep-run') !== (course.runKey || '')) same = false;
        });
      }
      if (same) {
        expected.forEach(function (course, index) { paintGridRun(existing[index], course); });
        return;
      }
      existing.forEach(function (node) { node.remove(); });
      var after = link;
      expected.forEach(function (course) {
        var clone = link.cloneNode(true);
        clone.setAttribute('data-cep-run-clone', '1');
        paintGridRun(clone, course);
        after.parentNode.insertBefore(clone, after.nextSibling);
        after = clone;
      });
    });
  }
  function equalizeGrid() {
    duplicateGridRuns();
    document.querySelectorAll('a.group[href*="/cursos/"]').forEach(function (link) {
      if (link.className.indexOf('cep-course-row') !== -1) return;
      if (isMessyList(link)) return;
      var title = link.querySelector('h3');
      if (title) {
        title.style.minHeight = '2.6em';
        title.style.display = '-webkit-box';
        title.style.webkitLineClamp = '2';
        title.style.webkitBoxOrient = 'vertical';
        title.style.overflow = 'hidden';
      }
    });
    fillDescriptions();
    pinEnrollmentBadges();
    paintAllEnrollmentBadges();
    paintOpenCards();
    pinConvocatoriaButtons();
    pinAreaChips();
    hideEmptyFacts();
    markSedeLinks();
  }
  function courseForHref(href) {
    return findCourse(href);
  }
  function courseForNode(link) {
    var key = link.getAttribute('data-cep-run') || '';
    var href = link.getAttribute('href') || '';
    if (key) {
      var matches = coursesForHref(href);
      for (var i = 0; i < matches.length; i += 1) {
        if (matches[i].runKey === key) return matches[i];
      }
    }
    return courseForHref(href);
  }
  function pinAreaChips() {
    document.querySelectorAll('a.group.h-full[href*="/cursos/"]').forEach(function (link) {
      var course = courseForHref(link.getAttribute('href') || '');
      var label = course && (course.areaLabel || course.area);
      var color = (course && course.areaColor) || '#475569';
      var row = link.querySelector('[class*="mb-4 flex flex-wrap"]');
      if (!row || !label) return;
      var chip = row.querySelector('[data-cep-chip="area"]');
      if (!chip) {
        var spans = row.querySelectorAll('span');
        for (var s = 0; s < spans.length; s += 1) {
          var text = (spans[s].textContent || '').replace(/\\s+/g, ' ').trim();
          if (/^matr[ií]cula|^pr[oó]ximamente|^pr[oó]ximas fechas|^cursos |^teleformaci/i.test(text)) continue;
          chip = spans[s];
          break;
        }
      }
      if (!chip) {
        chip = document.createElement('span');
        row.insertBefore(chip, row.firstChild);
      }
      chip.setAttribute('data-cep-chip', 'area');
      if (chip.textContent !== label) chip.textContent = label;
      chip.style.background = color + '26';
      chip.style.color = color;
      chip.style.border = '1px solid ' + color + '59';
      chip.style.textTransform = 'none';
      chip.style.letterSpacing = '0';
      chip.style.fontWeight = '600';
      Array.prototype.slice.call(row.querySelectorAll('span')).forEach(function (span) {
        if (span === chip) return;
        var text = (span.textContent || '').replace(/\\s+/g, ' ').trim();
        if (/^matr[ií]cula|^pr[oó]ximamente|^pr[oó]ximas fechas|^cursos |^teleformaci/i.test(text)) span.remove();
      });
    });
  }
  function courseButton(row) {
    var found = null;
    row.querySelectorAll('span').forEach(function (span) {
      if (found || span.getAttribute('data-cep-grid-cta') === 'run') return;
      if (/ver curso/i.test(span.textContent || '')) found = span;
    });
    return found;
  }
  function pinConvocatoriaButtons() {
    document.querySelectorAll('a.group.h-full[href*="/cursos/"]').forEach(function (link) {
      var href = link.getAttribute('href') || '';
      var course = courseForNode(link);
      var dest = course && course.convocatoriaHref && (course.open || enrollmentState(href) === 'open') ? course.convocatoriaHref : '';
      var row = null;
      link.querySelectorAll('div').forEach(function (div) {
        if (row) return;
        var cls = ' ' + String(div.className || '') + ' ';
        if (cls.indexOf(' mt-auto ') !== -1 && cls.indexOf(' flex ') !== -1) row = div;
      });
      if (!row) return;
      var current = row.querySelector('[data-cep-grid-cta="run"]');
      var courseBtn = courseButton(row);
      if (courseBtn) courseBtn.setAttribute('data-cep-cta', 'course');
      if (!dest) {
        if (current) current.remove();
        row.removeAttribute('data-cep-card-actions');
        return;
      }
      row.setAttribute('data-cep-card-actions', '1');
      if (current && current.getAttribute('data-cep-href') === dest) return;
      if (current) current.remove();
      var btn = document.createElement('span');
      btn.setAttribute('data-cep-grid-cta', 'run');
      btn.setAttribute('data-cep-href', dest);
      btn.setAttribute('role', 'link');
      btn.textContent = 'Ver convocatoria';
      row.appendChild(btn);
    });
  }
  var chosenView = false;
  var forcingList = false;
  function apply() {
    if (!document.body) return;
    ensureCss();
    if (!chosenView) {
      var listBtn = document.querySelector('button[aria-label="Vista de lista"]');
      if (listBtn && listBtn.getAttribute('data-state') !== 'on') {
        preferGrid = false;
        forcingList = true;
        listBtn.click();
        forcingList = false;
      }
    }
    paintToggle();
    markList();
    if (preferGrid || !COURSES.length) {
      if (preferGrid && document.querySelector('.cep-course-row')) restoreParked();
      equalizeGrid();
      return;
    }
    document.querySelectorAll('a.group.block[href*="/cursos/"]').forEach(function (link) {
      if (link.querySelector('.cep-course-list')) return;
      if (!isMessyList(link)) return;
      var href = link.getAttribute('href') || '';
      var matches = coursesForHref(href);
      if (!matches.length || !link.parentNode) return;
      parked[href] = link;
      var parent = link.parentNode;
      var marker = link.nextSibling;
      document.querySelectorAll('.cep-course-row[data-href="' + href + '"]').forEach(function (row) { row.remove(); });
      try {
        matches.forEach(function (course) { parent.insertBefore(build(course), marker); });
        parent.removeChild(link);
      } catch (err) {}
    });
    fillDescriptions();
    paintAllEnrollmentBadges();
    paintOpenCards();
    pinConvocatoriaButtons();
    pinAreaChips();
    hideEmptyFacts();
    markSedeLinks();
  }
  var timer = 0;
  function schedule() {
    if (timer) return;
    timer = setTimeout(function () { timer = 0; apply(); }, 80);
  }
  function start() {
    apply();
    var obs = new MutationObserver(schedule);
    obs.observe(document.documentElement, { childList: true, subtree: true });
    [400, 1200, 3000].forEach(function (ms) { setTimeout(apply, ms); });
    document.addEventListener('click', function (ev) {
      var target = ev.target;
      var run = target && target.closest ? target.closest('[data-cep-grid-cta="run"]') : null;
      if (run) {
        var dest = run.getAttribute('data-cep-href') || '';
        if (dest) {
          ev.preventDefault();
          ev.stopPropagation();
          if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
          window.location.assign(dest);
          return;
        }
      }
      var sede = target && target.closest ? target.closest('[data-cep-sede]') : null;
      if (sede) {
        var sedeHref = sede.getAttribute('data-cep-sede') || '';
        if (sedeHref) {
          ev.preventDefault();
          ev.stopPropagation();
          if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
          window.location.assign(sedeHref);
          return;
        }
      }
      var btn = target && target.closest ? target.closest('button') : null;
      if (!btn) return;
      if (forcingList) {
        preferGrid = false;
        return;
      }
      if (isGridButton(btn)) {
        chosenView = true;
        preferGrid = true;
        restoreParked();
        paintToggle();
        markList();
      } else if (isListButton(btn)) {
        chosenView = true;
        preferGrid = false;
        schedule();
      }
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
</script>`
  if (html.includes('</body>')) return html.replace('</body>', `${script}</body>`)
  if (html.includes('</head>')) return html.replace('</head>', `${script}</head>`)
  return html + script
}

function expandCourseRuns(course: CourseListItem, snapshot?: CatalogSnapshot | null): CourseListItem[] {
  if (!snapshot) return [course]
  const slug = slugFromHref(course.href)
  const runs = (snapshot.data.convocatorias || []).filter((conv) => conv.course?.slug === slug)
  const active = runs.filter((conv) => {
    const badge = homeRunBadge(conv)
    return badge === 'open' || badge === 'running'
  })
  const catalogCourse = (snapshot.data.courses || []).find((item) => item.slug === slug)
  const ownImage = String(catalogCourse?.imageUrl || catalogCourse?.imagenPortada || '')
  const image = /fallback-/i.test(course.image) && ownImage && !/fallback-/i.test(ownImage) ? ownImage : course.image
  const base = { ...course, image }
  if (!active.length) return [base]
  const sorted = [...active].sort((a, b) => {
    const start = String(a.startDate || '').localeCompare(String(b.startDate || ''))
    if (start) return start
    return String(a.campus?.name || '').localeCompare(String(b.campus?.name || ''), 'es')
  })
  return sorted.map((conv) => {
    const badge = homeRunBadge(conv)
    const tele = isTeleformacionPaint(base.kind, base.modality)
    const campus = tele ? VIRTUAL_CAMPUS_BADGE : cleanCampus(conv.campus?.name || '') || course.campus
    const start = formatStartLabel(String(conv.startDate || '').slice(0, 10)) || course.start
    return {
      ...base,
      campus,
      campusHref: tele ? '' : campus ? campusPublicHref(campus) : course.campusHref,
      start,
      open: badge === 'open',
      closed: false,
      convocatoriaHref: conv.codigo ? `/convocatorias/${encodeURIComponent(conv.codigo)}` : '',
      runKey: String(conv.codigo || ''),
    }
  })
}

export function rewriteCourseCatalog(html: string, snapshot?: CatalogSnapshot | null): string {
  if (html.includes('data-cep-course-catalog-lock="1"')) return html
  const descriptions = parseCourseDescriptions(html)
  const enrollment = enrollmentByCourseSlug(snapshot)
  const courses = parseCourseListCards(html).flatMap((course) => expandCourseRuns(course, snapshot)).map((course) => {
    if (course.runKey) return course
    const state = enrollment[slugFromHref(course.href)]
    if (!state) return course
    return {
      ...course,
      open: state === 'open',
      closed: state === 'closed',
    }
  })
  const visibleHtml = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  const paintsCatalog =
    courses.length > 0 ||
    visibleHtml.includes('min-h-[560px]') ||
    visibleHtml.includes('class="group') ||
    visibleHtml.includes('cep-course-list-copy')
  if (!paintsCatalog) return html
  return injectLock(injectCss(html), courses, descriptions, enrollment)
}

export function omitIdleHomeCatalogLock(html: string): string {
  if (!html.includes('data-cep-home-courses-lock="1"') || !html.includes('var COURSES = [];')) return html
  return html
    .replace(/<style\b[^>]*data-cep-course-catalog-css="1"[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script\b[^>]*data-cep-course-catalog-lock="1"[^>]*>[\s\S]*?<\/script>/gi, '')
}
