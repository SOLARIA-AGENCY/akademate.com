import { displayCourseTitle, formatStartLabel, homeCourseSectionKey, type HomeCourseSectionKey } from './home-courses'
import { rewriteCampusNames } from './campus-name'
import { closedConvocatoriaKeys, homeRunBadge } from './enrollment-state'
import type { CatalogSnapshot } from './render'
import { isUnpublishedRunCode } from './unpublished-runs'

const FORBIDDEN_BLUES = /#2563eb|#0066cc|#3b82f6|#1a1a2e/gi

function replaceLiteral(html: string, from: string, to: string): string {
  if (!from || from === to) return html
  return html.split(from).join(to)
}

function factBox(label: string, value: string): string {
  return `<div class="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p class="text-xs font-semibold text-slate-500">${label}</p><p class="mt-2 text-sm font-semibold text-slate-950">${value}</p></div>`
}

function factsFromChipText(text: string): Array<[string, string]> {
  const facts: Array<[string, string]> = []
  const folded = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
  if (folded.includes('semipresencial')) facts.push(['Modalidad', 'Semipresencial'])
  else if (folded.includes('teleform') || folded.includes('online')) facts.push(['Modalidad', 'Online'])
  else if (folded.includes('presencial')) facts.push(['Modalidad', 'Presencial'])
  const practice = text.match(/(\d+)\s*h(?:oras)?(?:\s+de)?\s+pr[aá]cticas/i)
  if (practice) facts.push(['Prácticas', `${practice[1]} h en empresa`])
  return facts
}

function uniqueFacts(facts: Array<[string, string]>): Array<[string, string]> {
  const seen = new Set<string>()
  return facts.filter(([label]) => {
    if (seen.has(label)) return false
    seen.add(label)
    return true
  })
}

function factsGrid(facts: Array<[string, string]>): string {
  const unique = uniqueFacts(facts)
  if (!unique.length) return ''
  return `<div class="mt-5 grid gap-3 sm:grid-cols-2">${unique.map(([label, value]) => factBox(label, value)).join('')}</div>`
}

export function promoteCycleFacts(html: string): string {
  return html.replace(
    /<p class="text-sm leading-6 text-slate-700">([\s\S]*?)<\/p>(\s*<div class="flex flex-wrap gap-2">[\s\S]*?<\/div>)?/g,
    (match, subtitle: string, chips = '') => {
      const text = `${subtitle} ${chips}`
      if (!/Ciclo Formativo de Grado|Ciclo formativo oficial|Ref\.|Régimen LOE|semipresencial/i.test(text)) return match
      return `<p class="text-sm leading-6 text-slate-700">Ciclo formativo oficial</p>${factsGrid(factsFromChipText(text))}`
    },
  )
}

export function extractCycleFactPayload(html: string): Array<{ href: string; facts: Array<[string, string]> }> {
  const items = new Map<string, Array<[string, string]>>()
  const consider = (href: string, chunk: string) => {
    const facts = factsFromChipText(chunk)
    if (!facts.length) return
    const key = href.replace(/^\/p(?=\/)/, '')
    items.set(key, uniqueFacts([...(items.get(key) || []), ...facts]))
  }
  for (const match of html.matchAll(/<a[^>]+href="(\/(?:p\/)?ciclos\/[^"#?]+)"[^>]*>[\s\S]*?<\/a>/gi)) {
    consider(match[1], match[0])
  }
  for (const match of html.matchAll(/<article[\s\S]*?<\/article>/gi)) {
    const href = match[0].match(/href="(\/(?:p\/)?ciclos\/[^"#?]+)"/)
    if (href) consider(href[1], match[0])
  }
  return [...items.entries()].map(([href, facts]) => ({ href, facts }))
}

function cardsCss(): string {
  return `<style data-cep-cards-css="1">
span.border-rose-100{display:none!important}
a[aria-label^="Ver cursos"] span.inline-flex{white-space:nowrap!important;min-width:0!important;width:auto!important}
a[aria-label^="Ver cursos"] svg{display:none!important}
article svg.lucide-arrow-right,a.group svg.lucide-arrow-right,span[class*="f2014b"] svg,a[class*="f2014b"] svg,[data-cep-btn] svg{display:none!important}
article[class*="md:grid-cols-[240px"]{align-items:stretch;min-height:0;transition:none!important}
article[class*="md:grid-cols-[240px"]:hover{border-color:#e5e7eb!important;box-shadow:0 1px 2px rgb(15 23 42 / .05)!important}
article[class*="md:grid-cols-[240px"]>div:first-child{min-height:11.5rem!important}
article[class*="md:grid-cols-[240px"] img{height:100%;object-fit:cover;transform:none!important}
article[class*="md:grid-cols-[240px"] h2{min-height:0;font-size:1.2rem;line-height:1.3}
article[class*="md:grid-cols-[240px"] .min-w-0.p-6{display:flex;flex-direction:column;gap:1rem;padding:1.15rem 1.35rem!important}
article[class*="md:grid-cols-[240px"] .min-w-0.p-6>.mb-4{margin-bottom:0!important;gap:.75rem}
article[class*="md:grid-cols-[240px"] .min-w-0.p-6>.mb-4 p.font-mono{font-size:.8rem}
article[class*="md:grid-cols-[240px"] .min-w-0.p-6>.grid.gap-3{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.65rem 1.15rem;flex:1;align-content:start}
article[class*="md:grid-cols-[240px"] .min-w-0.p-6>.grid.gap-3>*{min-width:0;min-height:0;display:flex;align-items:flex-start;gap:.5rem;color:#0f172a;font-size:.95rem;font-weight:600;line-height:1.35}
article[class*="md:grid-cols-[240px"] .min-w-0.p-6>.grid.gap-3 a{display:none!important}
article[class*="md:grid-cols-[240px"] .min-w-0.p-6>.grid.gap-3 svg{width:1.15rem;height:1.15rem;flex:0 0 auto;margin-top:.12rem}
article[class*="md:grid-cols-[240px"] .min-w-0.p-6>div.mt-5{margin-top:auto!important;display:flex!important;justify-content:flex-end;align-items:center;grid-template-columns:none!important;gap:.75rem}
article[class*="md:grid-cols-[240px"] .min-w-0.p-6>div.mt-5>a{width:auto!important;min-width:10.75rem;min-height:2.75rem;height:2.75rem;padding:0 1.15rem!important;font-size:.875rem!important;font-weight:600!important;white-space:nowrap}
article[class*="md:grid-cols-[240px"] .min-w-0.p-6>div.mt-5>a:not(:first-child){display:none!important}
article[class*="md:grid-cols-[240px"] .min-w-0.p-6>a.mt-5{display:inline-flex!important;width:fit-content!important;max-width:100%;align-self:flex-start!important;margin-top:auto!important;justify-content:center!important;white-space:nowrap}
@media (min-width:768px){
  article[class*="md:grid-cols-[240px"]{grid-template-columns:15.5rem minmax(0,1fr)!important}
  article[class*="md:grid-cols-[240px"]>div:first-child{min-height:100%!important}
}
@media (min-width:1024px){
  article[class*="md:grid-cols-[240px"] .min-w-0.p-6>.grid.gap-3{grid-template-columns:repeat(3,minmax(0,1fr))}
}
article.group:has(.bg-green-600),article.group:has(.bg-emerald-600){background:#ecfdf5!important;border-color:#a7f3d0!important}
a[href^="/convocatorias/"] > div.p-5 > span.mt-5,
a[href^="/convocatorias/"] > div.p-4 > span.mt-auto{display:flex;width:100%;box-sizing:border-box;justify-content:center;white-space:normal;text-align:center}
[aria-label="Controles del carrusel"]{display:none!important}
[data-cep-convocatorias-mosaic="1"],
[role="region"][aria-label="Convocatorias abiertas"]{
  display:grid!important;
  grid-template-columns:repeat(1,minmax(0,1fr))!important;
  gap:1.25rem!important;
  overflow:visible!important;
  overflow-x:visible!important;
  scroll-snap-type:none!important
}
@media (min-width:640px){
  [data-cep-convocatorias-mosaic="1"],
  [role="region"][aria-label="Convocatorias abiertas"]{grid-template-columns:repeat(3,minmax(0,1fr))!important}
}
@media (min-width:768px){
  [data-cep-convocatorias-mosaic="1"],
  [role="region"][aria-label="Convocatorias abiertas"]{grid-template-columns:repeat(4,minmax(0,1fr))!important}
}
@media (min-width:1280px){
  [data-cep-convocatorias-mosaic="1"],
  [role="region"][aria-label="Convocatorias abiertas"]{grid-template-columns:repeat(5,minmax(0,1fr))!important}
}
section:has([data-cep-convocatorias-mosaic="1"]) > div.mx-auto,
section:has([data-cep-convocatorias-groups="1"]) > div.mx-auto{max-width:96rem!important}
[data-cep-convocatorias-groups="1"]{display:flex;flex-direction:column;gap:2.75rem;margin-top:2rem}
[data-cep-sede-group] > h3{margin:0 0 1rem;color:#fff;font-size:1.35rem;font-weight:700;letter-spacing:0;text-transform:none}
[data-cep-open-empty="1"]{display:flex!important;min-height:10rem!important;height:auto!important}
[data-cep-convocatorias-mosaic="1"],
[role="region"][aria-label="Convocatorias abiertas"]{align-items:stretch!important}
[data-cep-convocatorias-mosaic="1"]>a,
[role="region"][aria-label="Convocatorias abiertas"]>a{
  display:flex!important;
  flex-direction:column!important;
  height:auto!important;
  min-height:20rem!important;
  min-width:0!important;
  width:auto!important;
  max-width:none!important;
  flex:none!important;
  flex-basis:auto!important;
  scroll-snap-align:unset!important;
  border-radius:.375rem!important
}
[data-cep-convocatorias-mosaic="1"]>a .relative.h-44,
[data-cep-convocatorias-mosaic="1"]>a [data-cep-card-photo],
[role="region"][aria-label="Convocatorias abiertas"]>a .relative.h-44,
[role="region"][aria-label="Convocatorias abiertas"]>a [data-cep-card-photo]{height:12.5rem!important;position:relative!important}
[data-cep-card-badges]{display:flex;flex-wrap:wrap;align-items:center;gap:.35rem;min-height:0;margin:0 0 .4rem}
[data-cep-convocatorias-mosaic="1"] [data-cep-chip="open"],
[role="region"][aria-label="Convocatorias abiertas"] [data-cep-chip="open"]{position:absolute!important;top:.65rem!important;right:.65rem!important;left:auto!important;z-index:2;display:inline-flex!important;width:fit-content!important;max-width:calc(100% - 1.3rem)!important;background:#16a34a!important;color:#fff!important;border:0!important;border-radius:999px;padding:.28rem .6rem;font-size:.72rem;font-weight:700;line-height:1.2;white-space:nowrap;box-shadow:0 1px 2px rgb(15 23 42 / .18)}
[data-cep-chip="kind"][data-kind="privados"]{background:#f2014b!important;color:#fff!important}
[data-cep-chip="kind"][data-kind="ocupados"]{background:#14532d!important;color:#fff!important}
[data-cep-chip="kind"][data-kind="desempleados"]{background:#1e3a8a!important;color:#fff!important}
[data-cep-chip="ciclo"]{background:#fff!important;color:#3E091A!important;border:1px solid #3E091A!important;border-radius:999px;padding:.2rem .55rem;font-size:.68rem;font-weight:600;line-height:1.2;white-space:nowrap}
[data-cep-convocatorias-mosaic="1"]>a,
[role="region"][aria-label="Convocatorias abiertas"]>a,
[data-cep-card-body]{
  color:#3E091A!important
}
[data-cep-card-title],
[data-cep-convocatorias-mosaic="1"]>a h3,
[role="region"][aria-label="Convocatorias abiertas"]>a h3{
  color:#3E091A!important;
  font-size:1.05rem!important;
  line-height:1.25!important;
  min-height:2.3em!important;
  display:-webkit-box!important;
  -webkit-line-clamp:2;
  -webkit-box-orient:vertical;
  overflow:hidden
}
[data-cep-card-body]{display:flex;flex-direction:column;flex:1;min-height:0}
[data-cep-card-meta]{flex:1}
[data-cep-convocatorias-mosaic="1"]>a .p-5,
[role="region"][aria-label="Convocatorias abiertas"]>a .p-5{padding:1.05rem 1.15rem 1.25rem!important;gap:.35rem}
[data-cep-card-when]{margin:.35rem 0 0;font-size:.875rem;line-height:1.25;font-weight:600;color:#150702}
[data-cep-card-sede]{margin:.05rem 0 0;font-size:.8125rem;line-height:1.25;color:#150702}
[data-cep-card-sede] strong{font-size:.8125rem;font-weight:700;color:#150702}
[data-cep-chip="kind"]{max-width:100%;white-space:normal}
[data-cep-convocatorias-mosaic="1"]>a dl,
[role="region"][aria-label="Convocatorias abiertas"]>a dl{gap:.45rem!important;margin-top:.65rem!important;font-size:.9rem!important}
[data-cep-convocatorias-mosaic="1"]>a .mt-auto.inline-flex,
[data-cep-convocatorias-mosaic="1"]>a .mt-5.inline-flex,
[data-cep-convocatorias-mosaic="1"]>a [data-cep-card-cta],
[role="region"][aria-label="Convocatorias abiertas"]>a .mt-5.inline-flex{display:flex!important;width:100%!important;box-sizing:border-box;justify-content:center!important;margin-top:1rem!important;padding:.7rem .75rem!important;font-size:.95rem!important;white-space:normal!important;text-align:center}
</style>`
}

const OPEN_MOSAIC_CLASS = 'grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'

export type CycleLevel = 'medio' | 'superior'

function foldEs(value: string): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function compactText(value: string): string {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const MOSAIC_DAY_ORDER = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const
const MOSAIC_DAY_PATTERNS: Array<{ letter: (typeof MOSAIC_DAY_ORDER)[number]; re: RegExp }> = [
  { letter: 'L', re: /\b(?:lunes|monday|lun\.?)\b/i },
  { letter: 'M', re: /\b(?:martes|tuesday|mar\.?)\b/i },
  { letter: 'X', re: /\b(?:mi[eé]rcoles|wednesday|mi[eé]\.?)\b/i },
  { letter: 'J', re: /\b(?:jueves|thursday|jue\.?)\b/i },
  { letter: 'V', re: /\b(?:viernes|friday|vie\.?)\b/i },
  { letter: 'S', re: /\b(?:s[aá]bados?|saturday|s[aá]b\.?)\b/i },
  { letter: 'D', re: /\b(?:domingos?|sunday|dom\.?)\b/i },
]

export function formatMosaicCampus(value: string): string {
  const raw = compactText(value)
  if (!raw) return raw
  const folded = foldEs(raw)
  if (/\bsur\b/.test(folded)) return 'CEP SUR'
  if (/\bnorte\b/.test(folded) || /\borotava\b/.test(folded) || /\blaguna\b/.test(folded)) return 'CEP NORTE'
  if (/\bsanta\s*cruz\b/.test(folded)) return 'CEP SANTA CRUZ'
  return raw
}

export function formatMosaicSchedule(value: string): string {
  const raw = compactText(value)
  if (!raw) return raw
  const folded = foldEs(raw)
  const time = raw.match(/(\d{1,2}[:.]\d{2}\s*[-–—]\s*\d{1,2}[:.]\d{2})/)?.[1]
    ?.replace(/[–—]/g, '-')
    .replace(/\s+/g, '') || ''
  const found = new Set<(typeof MOSAIC_DAY_ORDER)[number]>()
  const weekdayRange =
    /(?:de\s+)?lunes\s+a\s+viernes/.test(folded) ||
    /monday\s+to\s+friday/.test(folded) ||
    /lun(?:es)?\s*[-a]\s*vie(?:rnes)?/.test(folded)
  if (weekdayRange) {
    ;(['L', 'M', 'X', 'J', 'V'] as const).forEach((letter) => found.add(letter))
  }
  for (const { letter, re } of MOSAIC_DAY_PATTERNS) {
    if ((letter === 'S' || letter === 'D') && !re.test(raw) && !re.test(folded)) continue
    if (letter !== 'S' && letter !== 'D' && weekdayRange) continue
    if (re.test(raw) || re.test(folded)) found.add(letter)
  }
  if (!found.size) {
    const tokens = folded
      .toUpperCase()
      .split(/[\s,·•/]+/)
      .flatMap((token) => token.split('-'))
      .map((token) => token.trim())
      .filter(Boolean)
    for (const letter of MOSAIC_DAY_ORDER) {
      if (tokens.includes(letter)) found.add(letter)
    }
  }
  const days = MOSAIC_DAY_ORDER.filter((letter) => found.has(letter))
  if (!days.length) return raw
  const label = days.join(' - ')
  return time ? `${label} · ${time}` : label
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function convocationCodeFromHref(href: string): string {
  const path = String(href || '').split('?')[0]
  const parts = path.split('/').filter(Boolean)
  try {
    return decodeURIComponent(parts[parts.length - 1] || '')
  } catch {
    return parts[parts.length - 1] || ''
  }
}

function levelFromToken(value: string): CycleLevel | null {
  const folded = foldEs(value)
  if (!folded) return null
  if (folded.includes('superior') || /\bcfgs\b/.test(folded)) return 'superior'
  if (folded.includes('medio') || /\bcfgm\b/.test(folded)) return 'medio'
  return null
}

function looksLikePrivateCourse(title: string): boolean {
  const folded = foldEs(title)
  if (/\bauxiliar\b/.test(folded)) return true
  if (/dermocosm/.test(folded)) return true
  if (/odontologia/.test(folded) && /higiene/.test(folded)) return true
  return false
}

export function cycleBadgeCopy(level: CycleLevel): string {
  return level === 'superior' ? 'Ciclo superior' : 'Ciclo medio'
}

/** Official FP cycles only. Private Auxiliar de Farmacia / Odontología must not get a ciclo badge. */
export function detectCycleLevel(input: {
  title?: string
  href?: string
  code?: string
  text?: string
  snapshot?: CatalogSnapshot | null
}): CycleLevel | null {
  const title = foldEs(input.title || '')
  const href = foldEs(input.href || '')
  const code = String(input.code || convocationCodeFromHref(input.href || ''))
  const text = foldEs(input.text || '')
  const blob = `${title} ${href} ${text}`
  const officialToken = /\/ciclos\/|\bcfgm\b|\bcfgs\b|ciclo formativo/.test(blob)
  if (looksLikePrivateCourse(input.title || '') && !officialToken) return null

  const conv = (input.snapshot?.data.convocatorias || []).find((item) => item.codigo === code)
  const fromConv = levelFromToken(conv?.cycle?.level || conv?.cycle?.slug || conv?.cycle?.name || '')
  if (fromConv) return fromConv

  for (const cycle of input.snapshot?.data.cycles || []) {
    const name = foldEs(cycle.name)
    const slug = foldEs(cycle.slug)
    if (!name && !slug) continue
    const hit = (title && (title === name || title.startsWith(`${name} `))) || (slug && href.includes(`/ciclos/${slug}`))
    if (!hit) continue
    return (
      levelFromToken(cycle.level || cycle.slug || cycle.name) ||
      (name.includes('higiene') ? 'superior' : name.includes('farmacia') ? 'medio' : null)
    )
  }

  if (/\/ciclos\//.test(href)) {
    if (/higiene|bucodental|cfgs|superior/.test(href)) return 'superior'
    if (/farmacia|cfgm|medio/.test(href)) return 'medio'
  }

  if (title === 'higiene bucodental' || title.startsWith('higiene bucodental')) return 'superior'
  if (title === 'farmacia y parafarmacia' || title.startsWith('farmacia y parafarmacia')) return 'medio'
  if (looksLikePrivateCourse(input.title || '')) return null
  if (/\bcfgs\b|ciclo superior|grado superior/.test(blob)) return 'superior'
  if (/\bcfgm\b|ciclo medio|grado medio/.test(blob)) return 'medio'
  return null
}

function compactMosaicCardClass(className: string): string {
  return className
    .replace(/\bshrink-0\b/g, '')
    .replace(/\bsnap-start\b/g, '')
    .replace(/\bbasis-full\b/g, '')
    .replace(/\bmd:basis-\[[^\]]+\]/g, '')
    .replace(/\bxl:basis-\[[^\]]+\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Convert the origin home carousel into a wrapping 5-column mosaic. No scroller. */
export function mosaicOpenConvocations(html: string): string {
  let next = html.replace(/<div class="flex gap-2" aria-label="Controles del carrusel">[\s\S]*?<\/div>/g, '')
  next = next.replace(/<div\b([^>]*aria-label="Convocatorias abiertas"[^>]*)>/gi, (open) => {
    let tag = open
    if (!tag.includes('data-cep-convocatorias-mosaic')) {
      tag = tag.replace('<div', '<div data-cep-convocatorias-mosaic="1"')
    }
    if (/\bclass="/i.test(tag)) {
      tag = tag.replace(/\bclass="[^"]*"/i, `class="${OPEN_MOSAIC_CLASS}"`)
    } else {
      tag = tag.replace('<div', `<div class="${OPEN_MOSAIC_CLASS}"`)
    }
    return tag
  })
  next = next.replace(
    /(<a class=")([^"]*)("[^>]*href="[^"]*\/(?:p\/)?convocatorias\/[^"]+")/gi,
    (match, pre: string, cls: string, post: string) => {
      if (!/\b(snap-start|basis-full|xl:basis-|md:basis-)/.test(cls)) return match
      return `${pre}${compactMosaicCardClass(cls)}${post}`
    },
  )
  return next
}

const PRICE_TEXT = /^(?:consultar|\d[\d.\s\u00a0]*\s*(?:€|eur))$/i

function findMatchingClose(html: string, from: number, tag: 'a' | 'article'): number {
  const openNeedle = `<${tag}`
  const closeNeedle = `</${tag}>`
  let depth = 1
  let index = from
  while (index < html.length) {
    const nextOpen = html.toLowerCase().indexOf(openNeedle, index)
    const nextClose = html.toLowerCase().indexOf(closeNeedle, index)
    if (nextClose === -1) return -1
    const openIsTag = nextOpen !== -1 && (html[nextOpen + openNeedle.length] === ' ' || html[nextOpen + openNeedle.length] === '>')
    if (openIsTag && nextOpen < nextClose) {
      depth += 1
      index = nextOpen + openNeedle.length
      continue
    }
    depth -= 1
    if (depth === 0) return nextClose + closeNeedle.length
    index = nextClose + closeNeedle.length
  }
  return -1
}

function isHomeMosaicCard(block: string): boolean {
  if (block.includes('data-cep-mosaic-card="1"')) return true
  if (!/<h3[\s>]/i.test(block)) return false
  if (/md:grid-cols-\[240px/i.test(block)) return false
  return /relative h-44|Precio:|matr[ií]cula abierta/i.test(block)
}

function dlLabeled(block: string, label: string): string {
  const match = block.match(new RegExp(`<dt[^>]*>\\s*${label}:\\s*</dt>\\s*<dd[^>]*>([\\s\\S]*?)</dd>`, 'i'))
  return compactText(match?.[1] || '')
}

function openAttr(open: string, name: string): string {
  return open.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'))?.[1] || ''
}

function metaRow(label: string, value: string): string {
  return `<div class="flex gap-2"><dt class="font-semibold text-slate-950">${label}:</dt><dd>${escapeText(value)}</dd></div>`
}

function sedeLine(value: string): string {
  return `<p data-cep-card-sede="1" class="text-[13px] font-bold leading-tight text-[#150702]"><strong class="font-extrabold text-[#150702]">${escapeText(value)}</strong></p>`
}

function whenLine(value: string): string {
  return `<p data-cep-card-when="1" class="mt-1 text-sm font-semibold leading-tight text-[#150702]">${escapeText(value)}</p>`
}

const KIND_COLOR: Record<'privados' | 'ocupados' | 'desempleados', string> = {
  privados: '#f2014b',
  ocupados: '#14532d',
  desempleados: '#1e3a8a',
}

function kindChips(kind: HomeCourseSectionKey | null | undefined): string {
  if (kind !== 'privados' && kind !== 'ocupados' && kind !== 'desempleados') return ''
  const free =
    kind === 'privados'
      ? ''
      : `<span data-cep-chip="free" class="inline-flex w-fit rounded-full bg-[#ecfdf5] px-2 py-1 text-[13px] font-semibold leading-tight text-[#166534]">100% gratuito</span>`
  return `<div data-cep-card-badges="1" class="mt-2 flex flex-wrap items-center gap-1"><span data-cep-chip="kind" data-kind="${kind}" class="inline-flex w-fit max-w-full rounded-full px-2 py-1 text-[13px] font-semibold leading-tight text-white" style="background:${KIND_COLOR[kind]}">${escapeText(KIND_TITLE[kind])}</span>${free}</div>`
}

function cardHasCode(card: string, code: string): boolean {
  return card.includes(`/convocatorias/${code}`) || card.includes(`/convocatorias/${encodeURIComponent(code)}`)
}

function catalogOpenCard(row: HomeOpenRow): string {
  const href = `/convocatorias/${encodeURIComponent(row.code)}`
  const img = row.image
    ? `<img src="${escapeText(row.image)}" alt="${escapeText(row.title)}" class="h-full w-full object-cover">`
    : ''
  const chip = `<span data-cep-chip="open" class="absolute right-3 top-3 z-10 inline-flex rounded-full bg-[#16a34a] px-3.5 py-1.5 text-xs font-bold text-white">Matrícula abierta</span>`
  return `<a class="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl bg-white text-[#3E091A] shadow-sm" data-cep-mosaic-card="1" data-cep-sede="${row.sede}" href="${escapeText(href)}"><div class="relative h-52 shrink-0 overflow-hidden bg-slate-200" data-cep-card-photo="1">${img}${chip}</div><div class="flex flex-1 flex-col gap-1 p-4 text-[#3E091A]" data-cep-card-body="1"><h3 data-cep-card-title="1" class="line-clamp-2 min-h-[2.3em] font-semibold leading-[1.25] text-[#3E091A]">${escapeText(row.title)}</h3>${kindChips(row.kind)}${row.startLabel ? whenLine(row.startLabel) : ''}${row.campus ? sedeLine(row.campus) : ''}<span data-cep-card-cta="1" class="mt-auto inline-flex w-full justify-center rounded-full bg-[#f2014b] px-3 py-2.5 text-[15px] font-semibold text-white">Ver convocatoria</span></div></a>`
}

const SEDE_ORDER = ['norte', 'santa-cruz', 'sur', 'otra'] as const
type SedeBucket = (typeof SEDE_ORDER)[number]
const SEDE_TITLE: Record<SedeBucket, string> = {
  norte: 'CEP NORTE',
  'santa-cruz': 'CEP SANTA CRUZ',
  sur: 'CEP SUR',
  otra: 'Otras sedes',
}

const KIND_ORDER: HomeCourseSectionKey[] = ['privados', 'ocupados', 'desempleados']
const KIND_TITLE: Record<HomeCourseSectionKey, string> = {
  privados: 'Privados',
  ocupados: 'Trabajadores ocupados',
  desempleados: 'Trabajadores desempleados/as',
  teleformacion: 'Teleformación',
}
const HOME_SEDES: SedeBucket[] = ['norte', 'santa-cruz', 'sur']

type HomeOpenRow = {
  code: string
  kind: HomeCourseSectionKey
  sede: SedeBucket
  start: string
  title: string
  image: string
  campus: string
  startLabel: string
}

function homeOpenRows(snapshot?: CatalogSnapshot | null): HomeOpenRow[] {
  const rows: HomeOpenRow[] = []
  for (const convocatoria of snapshot?.data.convocatorias || []) {
    if (isUnpublishedRunCode(convocatoria.codigo)) continue
    if (homeRunBadge(convocatoria) !== 'open' && homeRunBadge(convocatoria) !== 'running') continue
    const line = String(convocatoria.trainingLine || '')
    if (convocatoria.cycle?.slug || convocatoria.cycle?.name) continue
    if (/teleform|ciclo/i.test(line)) continue
    const linked = (snapshot?.data.courses || []).find((course) => course.slug && course.slug === convocatoria.course?.slug)
    const slug = String(convocatoria.course?.slug || linked?.slug || '')
    const code = convocatoria.codigo
    const kind =
      homeCourseSectionKey({ studyType: line }) ||
      homeCourseSectionKey(convocatoria.course || {}) ||
      homeCourseSectionKey(linked || {}) ||
      (slug.endsWith('-des') || code.startsWith('DES-')
        ? 'desempleados'
        : slug.endsWith('-ocu')
          ? 'ocupados'
          : slug.endsWith('-priv') || code.startsWith('NOR-') || code.startsWith('SC-') || code.startsWith('PRIV-')
            ? 'privados'
            : null)
    const sede = campusBucket(convocatoria.campus?.name || '')
    if (!kind || sede === 'otra' || !convocatoria.codigo) continue
    const start = String(convocatoria.startDate || '').slice(0, 10)
    const title = displayCourseTitle(String(convocatoria.course?.nombre || linked?.nombre || convocatoria.codigo))
    const image = String(
      convocatoria.imageUrl || convocatoria.course?.imageUrl || linked?.imageUrl || linked?.imagenPortada || '',
    )
    rows.push({
      code: convocatoria.codigo,
      kind,
      sede,
      start,
      title,
      image,
      campus: formatMosaicCampus(String(convocatoria.campus?.name || SEDE_TITLE[sede])),
      startLabel: formatStartLabel(start) || '',
    })
  }
  return rows
}

function campusBucket(label: string): SedeBucket {
  const folded = foldEs(label)
  if (/\bsur\b/.test(folded)) return 'sur'
  if (/\bnorte\b/.test(folded) || /\borotava\b/.test(folded) || /\blaguna\b/.test(folded)) return 'norte'
  if (/santa\s*cruz/.test(folded)) return 'santa-cruz'
  return 'otra'
}

function stripPriceNodes(block: string): string {
  let next = block.replace(
    /<div class="flex gap-2">\s*<dt[^>]*>\s*Precio:\s*<\/dt>\s*<dd[^>]*>[\s\S]*?<\/dd>\s*<\/div>/gi,
    '',
  )
  next = next.replace(/<span class="flex items-center gap-2">\s*<svg[^>]*lucide-euro[\s\S]*?<\/span>/gi, '')
  next = next.replace(/<(span|dd|p)([^>]*)>([\s\S]*?)<\/\1>/gi, (node, _tag: string, attrs: string, inner: string) => {
    const text = compactText(inner)
    if (PRICE_TEXT.test(text)) return /data-cep-/i.test(attrs) ? node : ''
    return node
  })
  return next
}

export function stripConvocationPrices(html: string): string {
  let next = html.replace(
    /<div class="flex gap-2">\s*<dt[^>]*>\s*Precio:\s*<\/dt>\s*<dd[^>]*>[\s\S]*?<\/dd>\s*<\/div>/gi,
    '',
  )
  next = next.replace(/<span class="flex items-center gap-2">\s*<svg[^>]*lucide-euro[\s\S]*?<\/span>/gi, '')
  next = next.replace(/<(article|a)(\s[^>]*)?>[\s\S]*?<\/\1>/gi, (block) => {
    if (!/\/(?:p\/)?convocatorias\//i.test(block)) return block
    return stripPriceNodes(block)
  })
  return next
}

function rebuildMosaicCard(block: string, snapshot?: CatalogSnapshot | null): string {
  const closed = /matr[ií]cula cerrada/i.test(block) && !/matr[ií]cula abierta/i.test(block)
  if (closed) return stripPriceNodes(block)
  const open = block.match(/^<a\b[^>]*>/i)?.[0] || '<a>'
  const href = openAttr(open, 'href')
  const style = openAttr(open, 'style').replace(/#2563eb|#0066cc|#3b82f6|#1a1a2e/gi, '#3E091A')
  const className = `${compactMosaicCardClass(openAttr(open, 'class'))} h-full`.replace(/\s+/g, ' ').trim()
  const img = block.match(/<img\b[^>]*>/i)?.[0] || ''
  const title = compactText(block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1] || '')
  const code = convocationCodeFromHref(href)
  const catalog = code ? homeOpenRows(snapshot).find((row) => row.code === code) : undefined
  const inicio = dlLabeled(block, 'Inicio') || catalog?.startLabel || ''
  const sedeRaw = dlLabeled(block, 'Sede') || compactText(block.match(/data-cep-card-sede="1"[\s\S]*?<strong[^>]*>([\s\S]*?)<\/strong>/i)?.[1] || '') || catalog?.campus || ''
  const sede = formatMosaicCampus(sedeRaw)
  const horario = formatMosaicSchedule(dlLabeled(block, 'Horario'))
  const level = detectCycleLevel({ title, href, code, text: compactText(block), snapshot })
  const openChip = `<span data-cep-chip="open" class="absolute right-3 top-3 z-10 inline-flex rounded-full bg-[#16a34a] px-3.5 py-1.5 text-xs font-bold text-white">Matrícula abierta</span>`
  const photo = `<div class="relative h-52 shrink-0 overflow-hidden" data-cep-card-photo="1">${img}${openChip}</div>`
  const ciclo = level
    ? `<span data-cep-chip="ciclo" class="inline-flex rounded-full border border-[#3E091A] px-3 py-1 text-[11px] font-semibold text-[#3E091A]">${cycleBadgeCopy(level)}</span>`
    : ''
  const chips = ciclo || catalog?.kind ? `<div data-cep-card-badges="1" class="mt-2 flex flex-wrap items-center gap-1">${ciclo}${kindChips(catalog?.kind).replace(/<div[^>]*>|<\/div>/g, '')}</div>` : ''
  const meta = horario ? metaRow('Horario', horario) : ''
  const styleAttr = style ? ` style="${escapeText(style)}"` : ''
  const bucket = catalog?.sede || campusBucket(sede)
  return `<a class="${className}" data-cep-mosaic-card="1" data-cep-sede="${bucket}"${styleAttr} href="${escapeText(href)}">${photo}<div class="flex flex-1 flex-col gap-1 p-4 text-[#3E091A]" data-cep-card-body="1"><h3 data-cep-card-title="1" class="line-clamp-2 min-h-[2.3em] font-semibold leading-[1.25] text-[#3E091A]">${escapeText(title)}</h3>${chips}${inicio ? whenLine(inicio) : ''}${sede ? sedeLine(sede) : ''}${meta ? `<dl class="mt-2 grid gap-1 text-sm text-slate-700" data-cep-card-meta="1">${meta}</dl>` : ''}<span data-cep-card-cta="1" class="mt-auto inline-flex w-full justify-center rounded-full bg-[#f2014b] px-3 py-2.5 text-[15px] font-semibold text-white">Ver convocatoria</span></div></a>`
}

function replaceTaggedBlocks(
  html: string,
  tag: 'a' | 'article',
  hrefNeedle: string,
  rewrite: (block: string) => string,
): string {
  const openNeedle = `<${tag}`
  let output = ''
  let last = 0
  let searchFrom = 0
  const lower = html.toLowerCase()
  while (searchFrom < html.length) {
    const start = lower.indexOf(openNeedle, searchFrom)
    if (start === -1) break
    const afterTag = html[start + openNeedle.length]
    if (afterTag !== ' ' && afterTag !== '>') {
      searchFrom = start + openNeedle.length
      continue
    }
    const gt = html.indexOf('>', start)
    if (gt === -1) break
    const close = findMatchingClose(html, gt + 1, tag)
    if (close < 0) break
    const block = html.slice(start, close)
    output += html.slice(last, start)
    output += hrefNeedle && !block.includes(hrefNeedle) ? block : rewrite(block)
    last = close
    searchFrom = close
  }
  return output + html.slice(last)
}

export function pinOpenConvocationCards(html: string, snapshot?: CatalogSnapshot | null): string {
  return replaceTaggedBlocks(html, 'a', '/convocatorias/', (block) =>
    isHomeMosaicCard(block) ? rebuildMosaicCard(block, snapshot) : block,
  )
}

function sedeFromCard(block: string): SedeBucket {
  const marked = block.match(/\bdata-cep-sede="(norte|santa-cruz|sur|otra)"/)
  if (marked) return marked[1] as SedeBucket
  const strong = block.match(/data-cep-card-sede="1"[\s\S]*?<strong[^>]*>([\s\S]*?)<\/strong>/i)
  return campusBucket(compactText(strong?.[1] || dlLabeled(block, 'Sede')))
}

/** Split the home mosaic into one grid per campus so Norte and Santa Cruz are not mixed. */
export function groupMosaicByCampus(html: string): string {
  if (html.includes('data-cep-convocatorias-groups="1"')) return html
  const marker = 'data-cep-convocatorias-mosaic="1"'
  const markerAt = html.indexOf(marker)
  if (markerAt < 0) return html
  const divStart = html.lastIndexOf('<div', markerAt)
  if (divStart < 0) return html
  const openEnd = html.indexOf('>', markerAt)
  if (openEnd < 0) return html
  const cards: string[] = []
  let cursor = openEnd + 1
  const lower = html.toLowerCase()
  while (cursor < html.length) {
    const nextA = lower.indexOf('<a', cursor)
    const nextDivClose = lower.indexOf('</div>', cursor)
    if (nextDivClose === -1) return html
    const aIsTag = nextA !== -1 && (html[nextA + 2] === ' ' || html[nextA + 2] === '>')
    if (!aIsTag || nextDivClose < nextA) break
    const gt = html.indexOf('>', nextA)
    if (gt < 0) return html
    const close = findMatchingClose(html, gt + 1, 'a')
    if (close < 0) return html
    cards.push(html.slice(nextA, close))
    cursor = close
  }
  const regionEnd = lower.indexOf('</div>', cursor)
  if (regionEnd < 0 || cards.length < 2) return html
  const buckets = new Map<SedeBucket, string[]>()
  for (const card of cards) {
    const key = sedeFromCard(card)
    const list = buckets.get(key) || []
    list.push(card)
    buckets.set(key, list)
  }
  const real = SEDE_ORDER.filter((key) => key !== 'otra' && (buckets.get(key) || []).length > 0)
  if (real.length < 2) return html
  const keys = SEDE_ORDER.filter((key) => (buckets.get(key) || []).length > 0)
  const groups = keys
    .map((key) => {
      const title = SEDE_TITLE[key]
      const body = (buckets.get(key) || []).join('')
      return `<section data-cep-sede-group="${key}"><h3 class="mb-4 text-xl font-semibold text-white">${title}</h3><div data-cep-convocatorias-mosaic="1" role="region" aria-label="Convocatorias ${title}" class="${OPEN_MOSAIC_CLASS}">${body}</div></section>`
    })
    .join('')
  const wrapped = `<div data-cep-convocatorias-groups="1" class="mt-8 flex flex-col gap-10">${groups}</div>`
  return html.slice(0, divStart) + wrapped + html.slice(regionEnd + '</div>'.length)
}

function mosaicCards(html: string): { divStart: number; regionEnd: number; cards: string[] } | null {
  const marker = 'data-cep-convocatorias-mosaic="1"'
  const markerAt = html.indexOf(marker)
  if (markerAt < 0) return null
  const divStart = html.lastIndexOf('<div', markerAt)
  if (divStart < 0) return null
  const openEnd = html.indexOf('>', markerAt)
  if (openEnd < 0) return null
  const cards: string[] = []
  let cursor = openEnd + 1
  const lower = html.toLowerCase()
  while (cursor < html.length) {
    const nextA = lower.indexOf('<a', cursor)
    const nextDivClose = lower.indexOf('</div>', cursor)
    if (nextDivClose === -1) return null
    const aIsTag = nextA !== -1 && (html[nextA + 2] === ' ' || html[nextA + 2] === '>')
    if (!aIsTag || nextDivClose < nextA) break
    const gt = html.indexOf('>', nextA)
    if (gt < 0) return null
    const close = findMatchingClose(html, gt + 1, 'a')
    if (close < 0) return null
    cards.push(html.slice(nextA, close))
    cursor = close
  }
  const regionEnd = lower.indexOf('</div>', cursor)
  if (regionEnd < 0) return null
  return { divStart, regionEnd, cards }
}

/** Home: sede, then course type. Every open run from the catalog. A type with zero runs gets one notice card. */
export function groupHomeOpenMosaic(html: string, snapshot?: CatalogSnapshot | null): string {
  if (html.includes('data-cep-kind-group="privados"')) return html
  if (!homeOpenRows(snapshot).length) return html
  const found = mosaicCards(html)
  if (!found) return html
  const index = new Map(homeOpenRows(snapshot).map((row) => [row.code, row]))
  const picked = new Map<string, string[]>()
  for (const card of found.cards) {
    const href = card.match(/href="([^"]+)"/i)?.[1] || ''
    const row = index.get(convocationCodeFromHref(href))
    if (!row) continue
    const key = `${row.sede}:${row.kind}`
    const list = picked.get(key) || []
    list.push(card)
    picked.set(key, list)
  }
  for (const row of homeOpenRows(snapshot)) {
    const key = `${row.sede}:${row.kind}`
    const list = picked.get(key) || []
    if (list.some((card) => cardHasCode(card, row.code))) continue
    list.push(catalogOpenCard(row))
    picked.set(key, list)
  }
  for (const [key, list] of picked) {
    const sede = key.split(':')[0]
    list.sort((left, right) => {
      const a = index.get(convocationCodeFromHref(left.match(/href="([^"]+)"/i)?.[1] || ''))
      const b = index.get(convocationCodeFromHref(right.match(/href="([^"]+)"/i)?.[1] || ''))
      const start = (a?.start || '9999').localeCompare(b?.start || '9999')
      return start
    })
    picked.set(key, list)
    void sede
  }
  const empty = `<article data-cep-open-empty="1" class="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-white/40 bg-white/10 p-6 text-center text-base font-semibold text-white">Próximamente más convocatorias</article>`
  const groups = HOME_SEDES.map((sede) => {
    const kinds = KIND_ORDER.map((kind) => {
      const cards = picked.get(`${sede}:${kind}`) || []
      const body = cards.length ? cards.join('') : empty
      return `<div data-cep-kind-group="${kind}" class="mt-6"><h4 class="mb-3 text-lg font-semibold text-white">${KIND_TITLE[kind]}</h4><div data-cep-convocatorias-mosaic="1" role="region" aria-label="${KIND_TITLE[kind]}" class="${OPEN_MOSAIC_CLASS}">${body}</div></div>`
    }).join('')
    return `<section data-cep-sede-group="${sede}"><h3 class="mb-2 text-xl font-semibold text-white">${SEDE_TITLE[sede]}</h3>${kinds}</section>`
  }).join('')
  const wrapped = `<div data-cep-convocatorias-groups="1" class="mt-8 flex flex-col gap-12">${groups}</div>`
  return html.slice(0, found.divStart) + wrapped + html.slice(found.regionEnd + '</div>'.length)
}

function decorateListingCycleBadges(html: string, snapshot?: CatalogSnapshot | null): string {
  return replaceTaggedBlocks(html, 'article', '/convocatorias/', (block) => {
    let next = stripPriceNodes(block)
    const href = next.match(/href="([^"]*\/(?:p\/)?convocatorias\/[^"]+)"/i)?.[1] || ''
    const title = compactText(next.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || '')
    const code = compactText(next.match(/font-mono[^>]*>([^<]+)/i)?.[1] || '') || convocationCodeFromHref(href)
    const level = detectCycleLevel({ title, href, code, text: compactText(next), snapshot })
    if (!level || next.includes('data-cep-chip="ciclo"')) return next
    const chip = `<span data-cep-chip="ciclo" class="inline-flex rounded-full border border-[#3E091A] px-3 py-1 text-[11px] font-semibold text-[#3E091A]">${cycleBadgeCopy(level)}</span>`
    if (/matr[ií]cula abierta/i.test(next)) {
      return next.replace(/(<span[^>]*>\s*Matrícula abierta\s*<\/span>)/i, `$1${chip}`)
    }
    return next.replace(/<h2\b/, `${chip}<h2`)
  })
}

function isOpenListingPath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/'
  return path === '/' || path === '/p/convocatorias' || path === '/convocatorias'
}

export function stripClosedListing(html: string, closedKeys: string[]): string {
  const keys = closedKeys.filter(Boolean)
  if (!keys.length) return html
  return html.replace(/<(article|a)(\s[^>]*)?>[\s\S]*?<\/\1>/gi, (block) => {
    const href = block.match(/href="([^"]*\/(?:p\/)?convocatorias\/[^"]+)"/i)?.[1] || ''
    if (!href) return block
    const closed = keys.some((key) => href.includes(`/${key}`) || href.endsWith(key))
    return closed ? '' : block
  })
}

function cardsLockScript(
  cycleFacts: Array<{ href: string; facts: Array<[string, string]> }> = [],
  closedKeys: string[] = [],
  listing = false,
  home = false,
  openRows: HomeOpenRow[] = [],
): string {
  return `<script data-cep-cards-lock="1">
(function () {
  if (window.__cepCardsLock) return;
  window.__cepCardsLock = 1;
  var cycleFacts = ${JSON.stringify(cycleFacts)};
  var CLOSED = ${JSON.stringify(closedKeys)};
  var LISTING = ${JSON.stringify(listing)};
  var HOME = ${JSON.stringify(home)};
  var OPEN_ROWS = ${JSON.stringify(openRows)};
  function titleCase(name) {
    var trimmed = String(name || '').trim();
    if (!trimmed) return trimmed;
    var lower = trimmed.toLocaleLowerCase('es');
    var sentence = lower.charAt(0).toLocaleUpperCase('es') + lower.slice(1);
    return sentence.replace(/\\b(i{1,3}|iv|vi{0,3}|ix|xi{0,3}|xl)\\b/gi, function (match) {
      return match.toLocaleUpperCase('es');
    });
  }
  function compact(text) {
    return String(text || '').replace(/\\s+/g, ' ').trim();
  }
  function isClosedHref(href) {
    var value = String(href || '').split('?')[0];
    if (!value) return false;
    for (var i = 0; i < CLOSED.length; i += 1) {
      var key = CLOSED[i];
      if (!key || String(key).length < 6) continue;
      if (value.indexOf('/' + key) !== -1 || value.slice(-String(key).length) === key) return true;
    }
    return false;
  }
  function removeClosedListing() {
    if (!LISTING) return;
    document.querySelectorAll('article.group, a[href*="/convocatorias/"]').forEach(function (node) {
      var href = node.getAttribute('href') || '';
      if (!href) {
        var link = node.querySelector('a[href*="/convocatorias/"]');
        href = link ? (link.getAttribute('href') || '') : '';
      }
      if (!isClosedHref(href)) return;
      if (node.parentNode) node.parentNode.removeChild(node);
    });
  }
  function paintClosedConvocations() {
    if (LISTING) return;
    document.querySelectorAll('article.group, a[href*="/convocatorias/"]').forEach(function (node) {
      var href = node.getAttribute('href') || '';
      if (!href) {
        var link = node.querySelector('a[href*="/convocatorias/"]');
        href = link ? (link.getAttribute('href') || '') : '';
      }
      if (!isClosedHref(href)) return;
      if (node.closest && node.closest('.cep-course-list-cta')) return;
      if (compact(node.textContent) === 'Ver convocatoria') return;
      node.querySelectorAll('p').forEach(function (para) {
        if (compact(para.textContent) === 'Convocatorias abiertas') para.textContent = 'Convocatorias cerradas';
      });
      node.querySelectorAll('span').forEach(function (span) {
        var text = compact(span.textContent);
        if (!/^matr[ií]cula abierta$/i.test(text) && !/^pr[oó]ximas fechas$/i.test(text) && !/^pr[oó]ximamente$/i.test(text) && !/^matr[ií]cula cerrada$/i.test(text)) return;
        if (span.textContent !== 'Matrícula cerrada') span.textContent = 'Matrícula cerrada';
        span.style.setProperty('background-color', '#64748b', 'important');
        span.style.setProperty('color', '#fff', 'important');
      });
      node.style.setProperty('background-color', '#fff', 'important');
      node.style.setProperty('border-color', '#e5e7eb', 'important');
    });
  }
  function isInventedChip(text) {
    if (text.length > 90) return false;
    if (text === 'Régimen LOE') return true;
    if (text.indexOf('Titulación oficial reconocida') === 0) return true;
    if (text.indexOf('Modalidad semipresencial (1 día') === 0) return true;
    if (/^\\d+h de prácticas en empresa$/.test(text)) return true;
    if (/^Ref\\.\\s+[A-Z0-9]+$/.test(text)) return true;
    return false;
  }
  function isExactSubtitle(text) {
    return /^Ciclo Formativo de Grado (Medio|Superior) \\(LOE\\)(?: · Ref\\. [A-Z0-9]+ · .+)?$/.test(text);
  }
  function campusOfficial(value) {
    var raw = String(value || '').trim();
    if (!raw) return raw;
    var folded = raw.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
    if (/\\b(por confirmar|a confirmar|sin sede|online|teleform|desde casa)\\b/.test(folded) && !/\\b(norte|sur|santa\\s*cruz|orotava|laguna)\\b/.test(folded)) return raw;
    if (/\\bsur\\b/.test(folded)) return 'CEP Sur';
    if (/\\bnorte\\b/.test(folded) || /\\borotava\\b/.test(folded) || /\\blaguna\\b/.test(folded)) return 'CEP Norte';
    if (/\\bsanta\\s*cruz\\b/.test(folded)) return 'CEP Santa Cruz';
    return raw.replace(/^(sede\\s+)+/i, '').trim() || raw;
  }
  function mosaicCampus(value) {
    var raw = compact(value);
    if (!raw) return raw;
    var folded = foldKey(raw);
    if (/\\bsur\\b/.test(folded)) return 'CEP SUR';
    if (/\\bnorte\\b/.test(folded) || /\\borotava\\b/.test(folded) || /\\blaguna\\b/.test(folded)) return 'CEP NORTE';
    if (/\\bsanta\\s*cruz\\b/.test(folded)) return 'CEP SANTA CRUZ';
    return raw;
  }
  function mosaicSchedule(value) {
    var raw = compact(value);
    if (!raw) return raw;
    var folded = foldKey(raw);
    var timeMatch = raw.match(/(\\d{1,2}[:.]\\d{2}\\s*[-–—]\\s*\\d{1,2}[:.]\\d{2})/);
    var time = timeMatch ? timeMatch[1].replace(/[–—]/g, '-').replace(/\\s+/g, '') : '';
    var found = {};
    var range = /(?:de\\s+)?lunes\\s+a\\s+viernes/.test(folded) || /monday\\s+to\\s+friday/.test(folded) || /lun(?:es)?\\s*[-a]\\s*vie(?:rnes)?/.test(folded);
    if (range) { found.L = 1; found.M = 1; found.X = 1; found.J = 1; found.V = 1; }
    var days = [
      ['L', /\\b(?:lunes|monday|lun\\.?)\\b/i],
      ['M', /\\b(?:martes|tuesday|mar\\.?)\\b/i],
      ['X', /\\b(?:mi[eé]rcoles|wednesday|mi[eé]\\.?)\\b/i],
      ['J', /\\b(?:jueves|thursday|jue\\.?)\\b/i],
      ['V', /\\b(?:viernes|friday|vie\\.?)\\b/i],
      ['S', /\\b(?:s[aá]bados?|saturday|s[aá]b\\.?)\\b/i],
      ['D', /\\b(?:domingos?|sunday|dom\\.?)\\b/i]
    ];
    days.forEach(function (pair) {
      var letter = pair[0];
      var re = pair[1];
      if (letter !== 'S' && letter !== 'D' && range) return;
      if (re.test(raw) || re.test(folded)) found[letter] = 1;
    });
    if (!Object.keys(found).length) {
      folded.toUpperCase().split(/[\\s,·•/]+/).forEach(function (token) {
        token.split('-').forEach(function (part) {
          var letter = part.trim();
          if ('LMXJVSD'.indexOf(letter) !== -1) found[letter] = 1;
        });
      });
    }
    var ordered = ['L', 'M', 'X', 'J', 'V', 'S', 'D'].filter(function (letter) { return found[letter]; });
    if (!ordered.length) return raw;
    var label = ordered.join(' - ');
    return time ? label + ' · ' + time : label;
  }
  function rewriteCampusText(text) {
    var next = String(text || '').replace(/(?:Sede\\s+)+(?:CEP\\s+)?(?:Santa\\s+Cruz|Norte(?:\\s*[–—-]\\s*La\\s+Orotava|\\s*\\(La\\s+Laguna\\))?|Sur)|CEP(?:\\s+FORMACI[OÓ]N)?\\s+(?:SANTA\\s+CRUZ|NORTE|SUR)\\b/gi, function (match) {
      return campusOfficial(match);
    });
    var compactText = compact(next);
    if (compactText === 'Sede CEP Formación' || compactText === 'Sede CEP Formacion') return 'CEP Formación';
    if (compactText === 'Santa Cruz') return 'CEP Santa Cruz';
    if (compactText === 'Norte') return 'CEP Norte';
    if (compactText === 'Sur') return 'CEP Sur';
    return next;
  }
  function factsFromText(text) {
    var facts = [];
    var folded = String(text || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
    if (folded.indexOf('semipresencial') !== -1) facts.push(['Modalidad', 'Semipresencial']);
    else if (folded.indexOf('teleform') !== -1 || folded.indexOf('online') !== -1) facts.push(['Modalidad', 'Online']);
    else if (folded.indexOf('presencial') !== -1) facts.push(['Modalidad', 'Presencial']);
    var practice = String(text || '').match(/(\\d+)\\s*h(?:oras)?(?:\\s+de)?\\s+pr[aá]cticas/i);
    if (practice) facts.push(['Prácticas', practice[1] + ' h en empresa']);
    return facts;
  }
  function payloadFactsFor(root) {
    var link = root.tagName === 'A' && (root.getAttribute('href') || '').indexOf('/ciclos/') !== -1
      ? root
      : root.querySelector('a[href*="/ciclos/"]');
    var href = link ? String(link.getAttribute('href') || '').replace(/^\\/p(?=\\/)/, '') : '';
    if (!href) return [];
    for (var i = 0; i < cycleFacts.length; i += 1) {
      if (String(cycleFacts[i].href || '').replace(/^\\/p(?=\\/)/, '') === href) return cycleFacts[i].facts || [];
    }
    return [];
  }
  function hasLabeledFacts(root) {
    if (root.querySelector('[data-cep-cycle-facts="1"]')) return true;
    var found = false;
    root.querySelectorAll('p').forEach(function (node) {
      var t = compact(node.textContent);
      if (t === 'Modalidad' || t === 'Prácticas') found = true;
    });
    return found;
  }
  function injectCycleFacts(root, facts) {
    if (!facts.length || hasLabeledFacts(root)) return;
    var grid = document.createElement('div');
    grid.setAttribute('data-cep-cycle-facts', '1');
    grid.className = 'mt-5 grid gap-3 sm:grid-cols-2';
    facts.forEach(function (pair) {
      var box = document.createElement('div');
      box.className = 'rounded-2xl border border-slate-200 bg-slate-50 p-4';
      var label = document.createElement('p');
      label.className = 'text-xs font-semibold text-slate-500';
      label.textContent = pair[0];
      var value = document.createElement('p');
      value.className = 'mt-2 text-sm font-semibold text-slate-950';
      value.textContent = pair[1];
      box.appendChild(label);
      box.appendChild(value);
      grid.appendChild(box);
    });
    var body = root.querySelector('.p-6') || root;
    var subtitle = null;
    body.querySelectorAll('p').forEach(function (node) {
      var t = compact(node.textContent);
      if (t === 'Ciclo formativo oficial' || t.indexOf('Ciclo Formativo de Grado') === 0) subtitle = node;
    });
    var chips = body.querySelector('.flex.flex-wrap');
    if (subtitle && subtitle.parentNode) subtitle.parentNode.insertBefore(grid, subtitle.nextSibling);
    else if (chips && chips.parentNode) chips.parentNode.insertBefore(grid, chips);
    else body.appendChild(grid);
  }
  function restoreCycleFacts() {
    document.querySelectorAll('a[href*="/ciclos/"], article').forEach(function (root) {
      if (root.closest && root.closest('[data-cep-area-page]')) return;
      if (root.closest && root.closest('[data-cep-cycle-cards="1"]')) return;
      if (root.tagName === 'A' && !root.querySelector('h2,h3,img')) return;
      var text = root.textContent || '';
      if (text.indexOf('Ver ciclo') === -1 && text.indexOf('Ciclo') === -1 && text.indexOf('GRADO') === -1) return;
      var facts = payloadFactsFor(root);
      if (!facts.length) facts = factsFromText(text);
      injectCycleFacts(root, facts);
    });
  }
  function mosaicOpenConvocations() {
    document.querySelectorAll('[aria-label="Controles del carrusel"]').forEach(function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    document.querySelectorAll('[aria-label="Convocatorias abiertas"]').forEach(function (track) {
      track.setAttribute('data-cep-convocatorias-mosaic', '1');
      track.className = ${JSON.stringify(OPEN_MOSAIC_CLASS)};
      track.style.setProperty('overflow', 'visible', 'important');
      track.style.setProperty('overflow-x', 'visible', 'important');
      Array.prototype.slice.call(track.children).forEach(function (card) {
        if (card.tagName !== 'A') return;
        var href = card.getAttribute('href') || '';
        var text = compact(card.textContent);
        var closedBadge = /matr[ií]cula cerrada/i.test(text) && !/matr[ií]cula abierta/i.test(text);
        if (isClosedHref(href) || closedBadge) {
          if (card.parentNode) card.parentNode.removeChild(card);
          return;
        }
        card.className = String(card.className || '')
          .replace(/\\bshrink-0\\b/g, '')
          .replace(/\\bsnap-start\\b/g, '')
          .replace(/\\bbasis-full\\b/g, '')
          .replace(/\\bmd:basis-\\[[^\\]]+\\]/g, '')
          .replace(/\\bxl:basis-\\[[^\\]]+\\]/g, '')
          .replace(/\\s+/g, ' ')
          .trim();
        if (String(card.className).indexOf('h-full') === -1) card.className += ' h-full';
      });
    });
  }
  function foldKey(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/\\s+/g, ' ').trim();
  }
  function privateCourseTitle(title) {
    var folded = foldKey(title);
    if (/\\bauxiliar\\b/.test(folded)) return true;
    if (folded.indexOf('dermocosm') !== -1) return true;
    if (folded.indexOf('odontologia') !== -1 && folded.indexOf('higiene') !== -1) return true;
    return false;
  }
  function cycleLevelFromCard(title, href) {
    var folded = foldKey(title);
    var link = foldKey(href || '');
    if (privateCourseTitle(title) && link.indexOf('/ciclos/') === -1) return '';
    if (folded === 'higiene bucodental' || folded.indexOf('higiene bucodental') === 0) return 'superior';
    if (folded === 'farmacia y parafarmacia' || folded.indexOf('farmacia y parafarmacia') === 0) return 'medio';
    if (/\\bcfgs\\b/.test(folded) || link.indexOf('cfgs-') !== -1) return 'superior';
    if (/\\bcfgm\\b/.test(folded) || link.indexOf('cfgm-') !== -1) return 'medio';
    return '';
  }
  function stripPriceRows(root) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('dt').forEach(function (dt) {
      if (compact(dt.textContent) !== 'Precio:') return;
      var row = dt.parentNode;
      if (row && row.parentNode) row.parentNode.removeChild(row);
    });
    root.querySelectorAll('svg.lucide-euro').forEach(function (svg) {
      var span = svg.closest ? svg.closest('span') : svg.parentNode;
      if (span && span.parentNode) span.parentNode.removeChild(span);
    });
  }
  function pinMosaicCards() {
    document.querySelectorAll('[data-cep-convocatorias-mosaic] > a, [aria-label="Convocatorias abiertas"] > a').forEach(function (card) {
      stripPriceRows(card);
      var title = card.querySelector('h3');
      if (!title) return;
      card.setAttribute('data-cep-mosaic-card', '1');
      var body = card.querySelector('[data-cep-card-body]') || card.querySelector('.p-5') || card.querySelector('.p-4') || card.querySelector('.p-2');
      if (!body) return;
      body.setAttribute('data-cep-card-body', '1');
      var photo = card.querySelector('[data-cep-card-photo]') || card.querySelector('.relative');
      if (!photo) {
        photo = document.createElement('div');
        photo.className = 'relative h-52 shrink-0 overflow-hidden';
        card.insertBefore(photo, card.firstChild);
      }
      photo.setAttribute('data-cep-card-photo', '1');
      var openChip = null;
      card.querySelectorAll('span').forEach(function (span) {
        if (/^matr[ií]cula abierta$/i.test(compact(span.textContent))) openChip = span;
      });
      if (openChip) {
        openChip.setAttribute('data-cep-chip', 'open');
        openChip.className = 'inline-flex w-fit rounded-full bg-[#16a34a] px-2.5 py-1 text-xs font-bold text-white';
        openChip.style.width = 'fit-content';
        openChip.style.backgroundColor = '#16a34a';
        openChip.style.color = '#fff';
        if (openChip.parentNode !== photo) photo.appendChild(openChip);
      }
      title.setAttribute('data-cep-card-title', '1');
      title.style.setProperty('color', '#3E091A', 'important');
      title.className = String(title.className || '').replace(/\\btext-white\\b/g, '').replace(/\\btext-slate-950\\b/g, 'text-[#3E091A]');
      if (title.parentNode !== body) body.insertBefore(title, body.firstChild);
      var dl = body.querySelector('dl');
      var sedeName = '';
      card.querySelectorAll('dt').forEach(function (dt) {
        var label = compact(dt.textContent);
        var dd = dt.nextElementSibling;
        if (!dd) return;
        if (label === 'Horario:') dd.textContent = mosaicSchedule(dd.textContent || '');
        if (label === 'Sede:') {
          sedeName = mosaicCampus(dd.textContent || '');
          dd.textContent = sedeName;
        }
        if (label === 'Código:') {
          var codeRow = dt.parentNode;
          if (codeRow && codeRow.parentNode) codeRow.parentNode.removeChild(codeRow);
        }
      });
      var sedeP = body.querySelector('[data-cep-card-sede]');
      if (!sedeName && sedeP) {
        var existing = sedeP.querySelector('strong');
        sedeName = mosaicCampus(existing ? existing.textContent : sedeP.textContent);
      }
      if (sedeName) {
        if (!sedeP) {
          sedeP = document.createElement('p');
          sedeP.setAttribute('data-cep-card-sede', '1');
          sedeP.className = 'text-[13px] font-bold leading-tight text-[#150702]';
          var strong = document.createElement('strong');
          strong.className = 'font-extrabold text-[#150702]';
          strong.textContent = sedeName;
          sedeP.appendChild(strong);
          if (dl && dl.parentNode === body) body.insertBefore(sedeP, dl);
          else title.insertAdjacentElement('afterend', sedeP);
        } else {
          var strongNode = sedeP.querySelector('strong');
          if (!strongNode) {
            strongNode = document.createElement('strong');
            sedeP.textContent = '';
            sedeP.appendChild(strongNode);
          }
          strongNode.textContent = sedeName;
          Array.prototype.forEach.call(sedeP.childNodes, function (node) {
            if (node !== strongNode && node.nodeType === 3) node.textContent = '';
          });
          if (!body.querySelector('[data-cep-card-when]') && title.nextElementSibling !== sedeP) title.insertAdjacentElement('afterend', sedeP);
        }
        card.querySelectorAll('dt').forEach(function (dt) {
          if (compact(dt.textContent) !== 'Sede:') return;
          var row = dt.parentNode;
          if (row && row.parentNode) row.parentNode.removeChild(row);
        });
        card.setAttribute('data-cep-sede', campusBucket(sedeName));
      }
      if (dl) {
        var inicioRow = null;
        var horarioRow = null;
        Array.prototype.forEach.call(dl.children, function (row) {
          var dt = row.querySelector && row.querySelector('dt');
          if (!dt) return;
          var label = compact(dt.textContent);
          if (label === 'Inicio:') inicioRow = row;
          if (label === 'Horario:') horarioRow = row;
        });
        if (inicioRow) dl.appendChild(inicioRow);
        if (horarioRow) dl.appendChild(horarioRow);
      }
      var cta = card.querySelector('[data-cep-card-cta]');
      card.querySelectorAll('span, a').forEach(function (span) {
        var label = compact(span.textContent);
        if (label === 'Ver convocatoria' || label === 'Ver' || label === 'VER CONVOCATORIA') cta = span;
      });
      if (!cta) {
        cta = document.createElement('span');
        body.appendChild(cta);
      }
      cta.setAttribute('data-cep-card-cta', '1');
      cta.textContent = 'Ver convocatoria';
      cta.className = 'mt-auto inline-flex w-full justify-center rounded-full bg-[#f2014b] px-3 py-2.5 text-[15px] font-semibold text-white';
      if (cta.parentNode !== body) body.appendChild(cta);
      paintOpenFacts(card, body, title);
      var level = cycleLevelFromCard(title.textContent || '', card.getAttribute('href') || '');
      if (level) {
        var badges = body.querySelector('[data-cep-card-badges]');
        if (!badges) {
          badges = document.createElement('div');
          badges.setAttribute('data-cep-card-badges', '1');
          badges.className = 'flex flex-wrap items-center gap-1';
          body.insertBefore(badges, title);
        }
        if (!badges.querySelector('[data-cep-chip="ciclo"]')) {
          var ciclo = document.createElement('span');
          ciclo.setAttribute('data-cep-chip', 'ciclo');
          ciclo.textContent = level === 'superior' ? 'Ciclo superior' : 'Ciclo medio';
          badges.appendChild(ciclo);
        }
      }
      pruneStaleCardFacts(card);
    });
    document.querySelectorAll('article.group').forEach(stripPriceRows);
  }
  function campusBucket(value) {
    var folded = foldKey(value);
    if (/\\bsur\\b/.test(folded)) return 'sur';
    if (/\\bnorte\\b/.test(folded) || /\\borotava\\b/.test(folded) || /\\blaguna\\b/.test(folded)) return 'norte';
    if (/santa\\s*cruz/.test(folded)) return 'santa-cruz';
    return 'otra';
  }
  var KIND_LABEL = { privados: 'Privados', ocupados: 'Trabajadores ocupados', desempleados: 'Trabajadores desempleados/as' };
  var KIND_COLOR = { privados: '#f2014b', ocupados: '#14532d', desempleados: '#1e3a8a' };
  function pruneStaleCardFacts(card) {
    var body = card.querySelector('[data-cep-card-body]');
    if (!body) return;
    Array.prototype.slice.call(body.querySelectorAll('span, p')).forEach(function (node) {
      if (node.hasAttribute('data-cep-card-when') || node.hasAttribute('data-cep-card-sede') || node.hasAttribute('data-cep-card-cta') || node.hasAttribute('data-cep-card-title')) return;
      if (node.getAttribute('data-cep-chip') === 'free') return;
      if (node.closest && node.closest('[data-cep-card-badges]') && node.getAttribute('data-cep-chip') === 'kind') return;
      var text = compact(node.textContent);
      if (/^cursos( para)?\\b/i.test(text)) { node.remove(); return; }
      if (node.tagName !== 'P') return;
      if (/^\\d{1,2} [a-záéíóú]{3,}\\.? \\d{4}$/i.test(text) || /^cep (norte|sur|santa cruz)$/i.test(text)) node.remove();
    });
  }
  function rowForCard(card) {
    var href = card.getAttribute('href') || '';
    var parts = href.split('?')[0].split('/').filter(Boolean);
    var code = parts[parts.length - 1] || '';
    try { code = decodeURIComponent(code); } catch (error) {}
    for (var i = 0; i < OPEN_ROWS.length; i++) {
      if (OPEN_ROWS[i].code === code) return OPEN_ROWS[i];
    }
    return null;
  }
  function paintOpenFacts(card, body, title) {
    var row = rowForCard(card);
    var kind = row && KIND_LABEL[row.kind] ? row.kind : '';
    if (kind) {
      var badges = body.querySelector('[data-cep-card-badges]');
      if (!badges) {
        badges = document.createElement('div');
        badges.setAttribute('data-cep-card-badges', '1');
        badges.className = 'mt-2 flex flex-wrap items-center gap-1';
        title.insertAdjacentElement('afterend', badges);
      }
      var kindChip = badges.querySelector('[data-cep-chip="kind"]');
      if (!kindChip) {
        kindChip = document.createElement('span');
        kindChip.setAttribute('data-cep-chip', 'kind');
        kindChip.className = 'inline-flex max-w-full rounded-full bg-[#3E091A] px-2 py-1 text-[13px] font-semibold leading-tight text-white';
        badges.appendChild(kindChip);
      }
      kindChip.setAttribute('data-kind', kind);
      kindChip.textContent = KIND_LABEL[kind];
      kindChip.style.setProperty('background-color', KIND_COLOR[kind], 'important');
      kindChip.style.setProperty('color', '#ffffff', 'important');
      if ((kind === 'ocupados' || kind === 'desempleados') && !badges.querySelector('[data-cep-chip="free"]')) {
        var free = document.createElement('span');
        free.setAttribute('data-cep-chip', 'free');
        free.className = 'inline-flex rounded-full bg-[#ecfdf5] px-2 py-1 text-[13px] font-semibold leading-tight text-[#166534]';
        free.textContent = '100% gratuito';
        badges.appendChild(free);
      }
    }
    var whenText = row && row.startLabel ? row.startLabel : '';
    if (!whenText) {
      card.querySelectorAll('dt').forEach(function (dt) {
        if (compact(dt.textContent) === 'Inicio:' && dt.nextElementSibling) whenText = compact(dt.nextElementSibling.textContent);
      });
    }
    if (whenText) {
      var when = body.querySelector('[data-cep-card-when]');
      if (!when) {
        when = document.createElement('p');
        when.setAttribute('data-cep-card-when', '1');
        var after = body.querySelector('[data-cep-card-badges]') || title;
        after.insertAdjacentElement('afterend', when);
      }
      when.className = 'mt-1 text-sm font-semibold leading-tight text-[#150702]';
      when.textContent = whenText;
      card.querySelectorAll('dt').forEach(function (dt) {
        if (compact(dt.textContent) !== 'Inicio:') return;
        var fact = dt.parentNode;
        if (fact && fact.parentNode) fact.parentNode.removeChild(fact);
      });
    }
    if (row && row.campus) {
      var sedeP = body.querySelector('[data-cep-card-sede]');
      if (!sedeP) {
        sedeP = document.createElement('p');
        sedeP.setAttribute('data-cep-card-sede', '1');
        var strong = document.createElement('strong');
        sedeP.appendChild(strong);
        var whenNode = body.querySelector('[data-cep-card-when]');
        if (whenNode) whenNode.insertAdjacentElement('afterend', sedeP);
        else title.insertAdjacentElement('afterend', sedeP);
      }
      sedeP.className = 'text-[13px] font-bold leading-tight text-[#150702]';
      var strongNode = sedeP.querySelector('strong') || sedeP.appendChild(document.createElement('strong'));
      strongNode.className = 'font-extrabold text-[#150702]';
      strongNode.textContent = row.campus;
      card.setAttribute('data-cep-sede', row.sede || campusBucket(row.campus));
    }
    var badgesNode = body.querySelector('[data-cep-card-badges]');
    if (badgesNode && title.nextElementSibling !== badgesNode) title.insertAdjacentElement('afterend', badgesNode);
    var whenNode = body.querySelector('[data-cep-card-when]');
    var sedeNode = body.querySelector('[data-cep-card-sede]');
    if (whenNode && sedeNode && whenNode.nextElementSibling !== sedeNode) whenNode.insertAdjacentElement('afterend', sedeNode);
  }
  function openCard(row) {
    var link = document.createElement('a');
    link.className = 'group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl bg-white text-[#3E091A] shadow-sm';
    link.setAttribute('data-cep-mosaic-card', '1');
    link.setAttribute('data-cep-sede', row.sede || '');
    link.setAttribute('href', '/convocatorias/' + encodeURIComponent(row.code || ''));
    var photo = document.createElement('div');
    photo.className = 'relative h-52 shrink-0 overflow-hidden bg-slate-200';
    photo.setAttribute('data-cep-card-photo', '1');
    if (row.image) {
      var img = document.createElement('img');
      img.setAttribute('src', row.image);
      img.setAttribute('alt', row.title || row.code || '');
      img.className = 'h-full w-full object-cover';
      photo.appendChild(img);
    }
    var chip = document.createElement('span');
    chip.setAttribute('data-cep-chip', 'open');
    chip.className = 'absolute right-3 top-3 z-10 inline-flex rounded-full bg-[#16a34a] px-3.5 py-1.5 text-xs font-bold text-white';
    chip.textContent = 'Matrícula abierta';
    photo.appendChild(chip);
    var body = document.createElement('div');
    body.className = 'flex flex-1 flex-col gap-1 p-4 text-[#3E091A]';
    body.setAttribute('data-cep-card-body', '1');
    var title = document.createElement('h3');
    title.setAttribute('data-cep-card-title', '1');
    title.className = 'line-clamp-2 min-h-[2.3em] font-semibold leading-[1.25] text-[#3E091A]';
    title.textContent = row.title || row.code || '';
    body.appendChild(title);
    if (row.kind && KIND_LABEL[row.kind]) {
      var badges = document.createElement('div');
      badges.setAttribute('data-cep-card-badges', '1');
      badges.className = 'mt-2 flex flex-wrap items-center gap-1';
      var kindChip = document.createElement('span');
      kindChip.setAttribute('data-cep-chip', 'kind');
      kindChip.setAttribute('data-kind', row.kind);
      kindChip.className = 'inline-flex w-fit max-w-full rounded-full px-2 py-1 text-[13px] font-semibold leading-tight text-white';
      kindChip.style.backgroundColor = KIND_COLOR[row.kind];
      kindChip.textContent = KIND_LABEL[row.kind];
      badges.appendChild(kindChip);
      if (row.kind === 'ocupados' || row.kind === 'desempleados') {
        var free = document.createElement('span');
        free.setAttribute('data-cep-chip', 'free');
        free.className = 'inline-flex rounded-full bg-[#ecfdf5] px-2 py-1 text-[13px] font-semibold leading-tight text-[#166534]';
        free.textContent = '100% gratuito';
        badges.appendChild(free);
      }
      body.appendChild(badges);
    }
    if (row.startLabel) {
      var when = document.createElement('p');
      when.setAttribute('data-cep-card-when', '1');
      when.className = 'mt-1 text-sm font-semibold leading-tight text-[#150702]';
      when.textContent = row.startLabel;
      body.appendChild(when);
    }
    if (row.campus) {
      var sede = document.createElement('p');
      sede.setAttribute('data-cep-card-sede', '1');
      sede.className = 'text-[13px] font-bold leading-tight text-[#150702]';
      var strong = document.createElement('strong');
      strong.className = 'font-extrabold text-[#150702]';
      strong.textContent = row.campus;
      sede.appendChild(strong);
      body.appendChild(sede);
    }
    var cta = document.createElement('span');
    cta.setAttribute('data-cep-card-cta', '1');
    cta.className = 'mt-auto inline-flex w-full justify-center rounded-full bg-[#f2014b] px-3 py-2.5 text-[15px] font-semibold text-white';
    cta.textContent = 'Ver convocatoria';
    body.appendChild(cta);
    link.appendChild(photo);
    link.appendChild(body);
    return link;
  }
  function groupHomeOpen() {
    if (!HOME || !OPEN_ROWS.length) return false;
    var tracks = document.querySelectorAll('[aria-label="Convocatorias abiertas"], [data-cep-convocatorias-mosaic]');
    var track = null;
    for (var i = 0; i < tracks.length; i++) {
      if (tracks[i].closest && tracks[i].closest('[data-cep-kind-group]')) continue;
      track = tracks[i];
      break;
    }
    if (!track) return true;
    var byCode = {};
    OPEN_ROWS.forEach(function (row) { byCode[row.code] = row; });
    var cards = Array.prototype.filter.call(track.querySelectorAll('a[href*="/convocatorias/"]'), function (card) {
      return !(card.closest && card.closest('[data-cep-kind-group]'));
    });
    var picked = {};
    var seen = {};
    cards.forEach(function (card) {
      var href = card.getAttribute('href') || '';
      var parts = href.split('?')[0].split('/').filter(Boolean);
      var code = decodeURIComponent(parts[parts.length - 1] || '');
      var row = byCode[code];
      if (!row) return;
      seen[row.code] = true;
      var key = row.sede + ':' + row.kind;
      if (!picked[key]) picked[key] = [];
      picked[key].push({ card: card, start: row.start || '9999' });
    });
    OPEN_ROWS.forEach(function (row) {
      if (!row || !row.code || seen[row.code]) return;
      var key = row.sede + ':' + row.kind;
      if (!picked[key]) picked[key] = [];
      picked[key].push({ card: openCard(row), start: row.start || '9999' });
    });
    var sedes = ['norte', 'santa-cruz', 'sur'];
    var sedeTitle = { norte: 'CEP NORTE', 'santa-cruz': 'CEP SANTA CRUZ', sur: 'CEP SUR' };
    var kinds = ['privados', 'ocupados', 'desempleados'];
    var kindTitle = KIND_LABEL;
    var wrap = document.createElement('div');
    wrap.setAttribute('data-cep-convocatorias-groups', '1');
    wrap.className = 'mt-8 flex flex-col gap-12';
    sedes.forEach(function (sede) {
      var section = document.createElement('section');
      section.setAttribute('data-cep-sede-group', sede);
      var heading = document.createElement('h3');
      heading.className = 'mb-2 text-xl font-semibold text-white';
      heading.textContent = sedeTitle[sede];
      section.appendChild(heading);
      kinds.forEach(function (kind) {
        var block = document.createElement('div');
        block.setAttribute('data-cep-kind-group', kind);
        block.className = 'mt-6';
        var sub = document.createElement('h4');
        sub.className = 'mb-3 text-lg font-semibold text-white';
        sub.textContent = kindTitle[kind];
        var grid = document.createElement('div');
        grid.setAttribute('data-cep-convocatorias-mosaic', '1');
        grid.setAttribute('role', 'region');
        grid.setAttribute('aria-label', kindTitle[kind]);
        grid.className = ${JSON.stringify(OPEN_MOSAIC_CLASS)};
        var list = (picked[sede + ':' + kind] || []).sort(function (a, b) { return a.start < b.start ? -1 : a.start > b.start ? 1 : 0; });
        list.forEach(function (item) { grid.appendChild(item.card); });
        if (!list.length) {
          var empty = document.createElement('article');
          empty.setAttribute('data-cep-open-empty', '1');
          empty.className = 'flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-white/40 bg-white/10 p-6 text-center text-base font-semibold text-white';
          empty.textContent = 'Próximamente más convocatorias';
          grid.appendChild(empty);
        }
        block.appendChild(sub);
        block.appendChild(grid);
        section.appendChild(block);
      });
      wrap.appendChild(section);
    });
    if (track.parentNode) track.parentNode.replaceChild(wrap, track);
    return true;
  }
  function groupMosaicByCampus() {
    if (groupHomeOpen()) return;
    var headings = { norte: 'CEP NORTE', 'santa-cruz': 'CEP SANTA CRUZ', sur: 'CEP SUR', otra: 'Otras sedes' };
    var order = ['norte', 'santa-cruz', 'sur', 'otra'];
    document.querySelectorAll('[data-cep-convocatorias-mosaic], [aria-label="Convocatorias abiertas"]').forEach(function (track) {
      if (track.closest && track.closest('[data-cep-sede-group]')) return;
      var cards = Array.prototype.filter.call(track.children, function (node) { return node.tagName === 'A'; });
      if (cards.length < 2) return;
      var buckets = { norte: [], 'santa-cruz': [], sur: [], otra: [] };
      cards.forEach(function (card) {
        var marked = card.getAttribute('data-cep-sede') || '';
        var name = '';
        var strong = card.querySelector('[data-cep-card-sede] strong');
        if (strong) name = compact(strong.textContent);
        var key = marked || campusBucket(name);
        if (!buckets[key]) key = 'otra';
        buckets[key].push(card);
      });
      var real = order.filter(function (key) { return key !== 'otra' && buckets[key].length; });
      if (real.length < 2) return;
      var wrap = document.createElement('div');
      wrap.setAttribute('data-cep-convocatorias-groups', '1');
      wrap.className = 'mt-8 flex flex-col gap-10';
      order.forEach(function (key) {
        if (!buckets[key].length) return;
        var section = document.createElement('section');
        section.setAttribute('data-cep-sede-group', key);
        var heading = document.createElement('h3');
        heading.className = 'mb-4 text-xl font-semibold text-white';
        heading.textContent = headings[key];
        var grid = document.createElement('div');
        grid.setAttribute('data-cep-convocatorias-mosaic', '1');
        grid.setAttribute('role', 'region');
        grid.setAttribute('aria-label', 'Convocatorias ' + headings[key]);
        grid.className = ${JSON.stringify(OPEN_MOSAIC_CLASS)};
        buckets[key].forEach(function (card) { grid.appendChild(card); });
        section.appendChild(heading);
        section.appendChild(grid);
        wrap.appendChild(section);
      });
      if (track.parentNode) track.parentNode.replaceChild(wrap, track);
    });
  }
  function apply() {
    if (!document.body) return;
    mosaicOpenConvocations();
    pinMosaicCards();
    groupMosaicByCampus();
    restoreCycleFacts();
    removeClosedListing();
    paintClosedConvocations();
    document.querySelectorAll('em').forEach(function (node) {
      var text = document.createTextNode(node.textContent || '');
      if (node.parentNode) node.parentNode.replaceChild(text, node);
    });
    document.querySelectorAll('span.rounded-full, span.inline-flex').forEach(function (node) {
      if (node.closest && node.closest('[data-cep-cycle-cards="1"]')) return;
      var text = compact(node.textContent);
      if (!text) {
        var emptyParent = node.parentNode;
        node.remove();
        if (emptyParent && emptyParent.childElementCount === 0 && emptyParent.tagName === 'DIV') emptyParent.remove();
        return;
      }
      if (text.length > 90) return;
      if (isInventedChip(text)) {
        var parent = node.parentNode;
        node.remove();
        if (parent && parent.childElementCount === 0 && parent.tagName === 'DIV') parent.remove();
        return;
      }
      if (text === 'GRADO MEDIO' || text === 'Grado Medio · CFGM') {
        node.textContent = 'Grado medio';
        node.style.backgroundColor = '#3E091A';
        node.style.color = '#FFFFFF';
      } else if (text === 'GRADO SUPERIOR' || text === 'Grado Superior · CFGS') {
        node.textContent = 'Grado superior';
        node.style.backgroundColor = '#f2014b';
        node.style.color = '#FFFFFF';
      } else if (text === 'TELEFORMACIÓN') {
        node.textContent = 'Teleformación';
      } else if (text === 'VER CONVOCATORIA') {
        node.textContent = 'Ver convocatoria';
      } else if (text === 'RESERVAR PLAZA' || text === 'Reservar plaza →') {
        node.textContent = 'Reservar plaza';
      }
    });
    document.querySelectorAll('div.flex.flex-wrap').forEach(function (node) {
      if (!compact(node.textContent) && !node.querySelector('a,img,svg,button')) node.remove();
    });
    document.querySelectorAll('p').forEach(function (node) {
      if (node.closest && node.closest('[data-cep-cycle-cards="1"]')) return;
      var text = compact(node.textContent);
      if (!text || text.length > 90) return;
      if (isExactSubtitle(text)) node.textContent = 'Ciclo formativo oficial';
    });
    document.querySelectorAll('h1,h2,h3,h4,p,span,dd,dt,strong,a,li').forEach(function (node) {
      if (node.closest && node.closest('[data-cep-sede-group]') && node.tagName === 'H3') return;
      if (node.closest && (node.closest('[data-cep-mosaic-card="1"]') || node.closest('[data-cep-convocatorias-mosaic="1"]'))) return;
      if ((node.textContent || '').length > 80) return;
      if (node.children.length) {
        for (var i = 0; i < node.childNodes.length; i++) {
          var child = node.childNodes[i];
          if (child.nodeType !== 3) continue;
          var next = rewriteCampusText(child.textContent || '');
          if (next !== child.textContent) child.textContent = next;
        }
        return;
      }
      var rewritten = rewriteCampusText(node.textContent || '');
      if (rewritten !== node.textContent) node.textContent = rewritten;
    });
    document.querySelectorAll('h2,h3').forEach(function (node) {
      var className = String(node.className || '');
      if (className.indexOf('uppercase') === -1) return;
      var current = compact(node.textContent);
      if (current === 'CEP Norte' || current === 'CEP Sur' || current === 'CEP Santa Cruz') return;
      node.textContent = titleCase(node.textContent || '');
      node.className = className.replace('uppercase', '').replace('font-extrabold', 'font-semibold');
    });
    document.querySelectorAll('[style]').forEach(function (node) {
      if (node.closest && node.closest('[data-cep-chip="kind"]')) return;
      var style = node.getAttribute('style') || '';
      if (!/#(2563eb|0066cc|3b82f6|1a1a2e)/i.test(style)) return;
      node.setAttribute('style', style.replace(/#(2563eb|0066cc|3b82f6|1a1a2e)/gi, '#3E091A'));
    });
    document.querySelectorAll('span').forEach(function (node) {
      if (node.closest && node.closest('h1,h2,h3,h4,[data-cep-mosaic-card],#wa-popup,[data-cep-wa-menu]')) return;
      var text = compact(node.textContent);
      if (text.length > 70 || text.toLowerCase().indexOf('desempleados') === -1) return;
      if (/^cursos\\b/i.test(text)) return;
      node.setAttribute('data-cep-chip', 'kind');
      node.setAttribute('data-kind', 'desempleados');
      node.style.setProperty('background-color', '#1e3a8a', 'important');
      node.style.setProperty('color', '#ffffff', 'important');
    });
    document.querySelectorAll('[data-cep-mosaic-card]').forEach(pruneStaleCardFacts);
    document.querySelectorAll('span.absolute.right-4.top-4, span.absolute.right-5.top-5').forEach(function (node) {
      var text = compact(node.textContent);
      if (/^Grado |^Teleformación$|^GRADO |^TELEFORM/.test(text)) node.remove();
    });
    document.querySelectorAll('a[aria-label^="Ver cursos"] svg, article svg.lucide-arrow-right').forEach(function (node) {
      node.remove();
    });
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
    [400, 1200, 3000, 8000].forEach(function (ms) { setTimeout(apply, ms); });
    setTimeout(function () { obs.disconnect(); apply(); }, 15000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
</script>`
}

function composeConvocationMarkup(html: string): string {
  return html.replace(
    /(<div class="grid gap-3 text-sm text-gray-700 sm:grid-cols-2">[\s\S]*?<\/div>)(\s*<div class="mt-5 grid gap-2 sm:grid-cols-2">)([\s\S]*?)(<\/div>)/g,
    (_match, facts: string, _actionsOpen: string, actionsInner: string) => {
      const primary = actionsInner.match(/<a class="[^"]*(?:bg-\[#f2014b\]|bg-red-600)[\s\S]*?<\/a>/)
      if (!primary) return `${facts}`
      const cta = primary[0]
        .replace(/\bw-full\b/g, 'w-auto')
        .replace(/\bpx-3 py-3\b/g, 'px-4 py-2')
      return `${facts}<div class="mt-5 flex justify-end">${cta}</div>`
    },
  )
}

export function rewritePublicCards(
  html: string,
  snapshot?: CatalogSnapshot | null,
  pathname = '',
): string {
  if (html.includes('data-cep-cards="1"')) return html
  const cycleFacts = extractCycleFactPayload(html)
  const closedKeys = closedConvocatoriaKeys(snapshot)
  const listing = isOpenListingPath(pathname)
  let next = html.replace(FORBIDDEN_BLUES, '#3E091A')
  if (listing) next = stripClosedListing(next, closedKeys)
  next = promoteCycleFacts(next)

  next = next.replace(/<span class="[^"]*border-rose-100[^"]*"[^>]*>[\s\S]*?<\/span>/g, '')
  next = next.replace(/<div class="mt-5 flex flex-wrap gap-2">\s*<\/div>/g, '')
  next = next.replace(
    /<div class="flex flex-wrap gap-2">(?:\s*<span class="rounded-full border border-slate-200 bg-slate-50[^>]*>[\s\S]*?<\/span>)+\s*<\/div>/g,
    '',
  )
  next = next.replace(/<p class="text-base leading-7 text-slate-600"><em>([\s\S]*?)<\/em><\/p>/g, '<p class="text-base leading-7 text-slate-600">$1</p>')
  next = next.replace(/<span class="rounded-full bg-white\/90[^"]*">Ref\.\s*[A-Z0-9]+<\/span>/g, '')
  next = next.replace(/<span class="absolute right-4 top-4 rounded-full[^>]*>[\s\S]*?<\/span>/g, '')

  next = replaceLiteral(next, 'background-color:#16A34A;color:#FFFFFF">Grado Medio · CFGM', 'background-color:#3E091A;color:#FFFFFF">Grado medio')
  next = replaceLiteral(next, 'background-color:#E3003A;color:#FFFFFF">Grado Superior · CFGS', 'background-color:#f2014b;color:#FFFFFF">Grado superior')
  next = replaceLiteral(next, 'background-color:#E3003A;color:#FFFFFF">GRADO MEDIO', 'background-color:#3E091A;color:#FFFFFF">Grado medio')
  next = replaceLiteral(next, 'background-color:#E3003A;color:#FFFFFF">GRADO SUPERIOR', 'background-color:#f2014b;color:#FFFFFF">Grado superior')
  next = replaceLiteral(next, '"backgroundColor":"#16A34A","color":"#FFFFFF"},"children":"Grado Medio · CFGM"', '"backgroundColor":"#3E091A","color":"#FFFFFF"},"children":"Grado medio"')
  next = replaceLiteral(next, '\\"backgroundColor\\":\\"#16A34A\\",\\"color\\":\\"#FFFFFF\\"},\\"children\\":\\"Grado Medio · CFGM\\"', '\\"backgroundColor\\":\\"#3E091A\\",\\"color\\":\\"#FFFFFF\\"},\\"children\\":\\"Grado medio\\"')
  next = replaceLiteral(next, '"backgroundColor":"#E3003A","color":"#FFFFFF"},"children":"GRADO MEDIO"', '"backgroundColor":"#3E091A","color":"#FFFFFF"},"children":"Grado medio"')
  next = replaceLiteral(next, '\\"backgroundColor\\":\\"#E3003A\\",\\"color\\":\\"#FFFFFF\\"},\\"children\\":\\"GRADO MEDIO\\"', '\\"backgroundColor\\":\\"#3E091A\\",\\"color\\":\\"#FFFFFF\\"},\\"children\\":\\"Grado medio\\"')
  next = replaceLiteral(next, '"backgroundColor":"#E3003A","color":"#FFFFFF"},"children":"GRADO SUPERIOR"', '"backgroundColor":"#f2014b","color":"#FFFFFF"},"children":"Grado superior"')
  next = replaceLiteral(next, '\\"backgroundColor\\":\\"#E3003A\\",\\"color\\":\\"#FFFFFF\\"},\\"children\\":\\"GRADO SUPERIOR\\"', '\\"backgroundColor\\":\\"#f2014b\\",\\"color\\":\\"#FFFFFF\\"},\\"children\\":\\"Grado superior\\"')

  next = replaceLiteral(next, 'Grado Medio · CFGM', 'Grado medio')
  next = replaceLiteral(next, 'Grado Superior · CFGS', 'Grado superior')
  next = replaceLiteral(next, 'GRADO MEDIO', 'Grado medio')
  next = replaceLiteral(next, 'GRADO SUPERIOR', 'Grado superior')
  next = replaceLiteral(next, 'TELEFORMACIÓN', 'Teleformación')
  next = next.replace(
    /Ciclo Formativo de Grado (?:Medio|Superior) \(LOE\)(?: · Ref\. [A-Z0-9]+ · Semipresencial)?/g,
    'Ciclo formativo oficial',
  )
  next = rewriteCampusNames(next)
  next = replaceLiteral(next, '"children":"Régimen LOE"', '"children":""')
  next = replaceLiteral(next, '\\"children\\":\\"Régimen LOE\\"', '\\"children\\":\\"\\"')
  next = replaceLiteral(next, '"children":"Ref. SANMS"', '"children":""')
  next = replaceLiteral(next, '\\"children\\":\\"Ref. SANMS\\"', '\\"children\\":\\"\\"')
  next = replaceLiteral(next, '"children":"Ref. SANSS"', '"children":""')
  next = replaceLiteral(next, '\\"children\\":\\"Ref. SANSS\\"', '\\"children\\":\\"\\"')
  next = replaceLiteral(next, 'Ref. SANMS', '')
  next = replaceLiteral(next, 'Ref. SANSS', '')
  next = replaceLiteral(next, 'Reservar plaza<!-- --> →', 'Reservar plaza')
  next = replaceLiteral(next, 'Reservar plaza →', 'Reservar plaza')
  next = replaceLiteral(next, 'Ver ciclo<!-- --> →', 'Ver ciclo')
  next = replaceLiteral(next, 'Ver ciclo →', 'Ver ciclo')
  next = replaceLiteral(next, 'Ver convocatoria<!-- --> →', 'Ver convocatoria')
  next = replaceLiteral(next, 'Ver convocatoria →', 'Ver convocatoria')

  next = next.replace(
    /<h2 class="line-clamp-2 text-xl font-extrabold uppercase leading-tight tracking-wide text-gray-950">([^<]+)<\/h2>/g,
    (_match, title: string) =>
      `<h2 class="line-clamp-2 text-xl font-semibold leading-tight tracking-tight text-gray-950">${displayCourseTitle(title)}</h2>`,
  )
  next = replaceLiteral(next, 'rounded-md bg-red-600 ', 'rounded-full bg-[#f2014b] ')
  next = replaceLiteral(next, 'hover:bg-red-700', 'hover:bg-[#d0013f]')
  next = next.replace(/class="lucide lucide-[^"]* h-4 w-4 text-red-600"/g, (match) => match.replace('text-red-600', 'text-[#f2014b]'))
  next = replaceLiteral(
    next,
    'border border-red-200 bg-white px-3 py-3 text-sm font-extrabold uppercase tracking-wide text-red-700 hover:bg-red-50',
    'border border-[#f2014b]/30 bg-white px-3 py-3 text-sm font-semibold text-[#3E091A] hover:bg-[#fff7fa]',
  )
  next = replaceLiteral(
    next,
    'text-sm font-extrabold uppercase tracking-wide text-white hover:bg-[#d0013f]',
    'text-sm font-semibold text-white hover:bg-[#d0013f]',
  )
  next = replaceLiteral(next, 'VER CONVOCATORIA', 'Ver convocatoria')
  next = replaceLiteral(next, 'RESERVAR PLAZA', 'Reservar plaza')
  next = composeConvocationMarkup(next)
  next = mosaicOpenConvocations(next)
  next = stripConvocationPrices(next)
  next = pinOpenConvocationCards(next, snapshot)
  const home = pathname === '/' || pathname === ''
  if (home) {
    const grouped = groupHomeOpenMosaic(next, snapshot)
    next = grouped === next ? groupMosaicByCampus(next) : grouped
  } else {
    next = groupMosaicByCampus(next)
  }
  next = decorateListingCycleBadges(next, snapshot)
  next = next.replace(
    /<h3 class="line-clamp-2 min-h-\[3\.5rem\] text-xl font-black uppercase leading-tight text-slate-950">([^<]+)<\/h3>/g,
    (_match, title: string) =>
      `<h3 class="line-clamp-2 min-h-[3.5rem] text-xl font-semibold leading-tight text-slate-950">${displayCourseTitle(title)}</h3>`,
  )
  next = next.replace(
    /<h3 class="line-clamp-3 min-h-\[4\.75rem\] text-xl font-black uppercase leading-tight text-slate-950">([^<]+)<\/h3>/g,
    (_match, title: string) =>
      `<h3 class="line-clamp-2 min-h-0 text-xl font-semibold leading-tight text-slate-950">${displayCourseTitle(title)}</h3>`,
  )
  next = replaceLiteral(
    next,
    'font-extrabold uppercase leading-tight tracking-wide text-gray-900',
    'font-semibold leading-tight tracking-tight text-gray-900',
  )
  next = replaceLiteral(
    next,
    'font-extrabold uppercase leading-tight tracking-wide text-gray-950',
    'font-semibold leading-tight tracking-tight text-gray-950',
  )
  next = replaceLiteral(next, 'min-w-[11rem]', 'min-w-0 whitespace-nowrap')
  next = replaceLiteral(next, 'min-h-[11.75rem]', 'min-h-0')
  next = replaceLiteral(next, 'min-h-[4.75rem]', 'min-h-0')

  if (!next.includes('data-cep-cards="1"')) {
    next = next.includes('<head>') ? next.replace('<head>', '<head><meta data-cep-cards="1" content="1">') : `<meta data-cep-cards="1" content="1">${next}`
  }
  if (!next.includes('data-cep-cards-css="1"')) {
    const css = cardsCss()
    next = next.includes('</head>') ? next.replace('</head>', `${css}</head>`) : css + next
  }
  if (!next.includes('data-cep-cards-lock="1"')) {
    const home = pathname === '/' || pathname === ''
    const lock = cardsLockScript(cycleFacts, closedKeys, listing, home, home ? homeOpenRows(snapshot) : [])
    next = next.includes('</body>') ? next.replace('</body>', `${lock}</body>`) : next + lock
  }

  return next
}
