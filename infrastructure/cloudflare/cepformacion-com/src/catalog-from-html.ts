import { displayCampusName } from './campus-name'
import { courseKindFromHref } from './course-catalog'
import { isHiddenPublicCycle } from './hidden-cycles'
import { homeCourseSectionKey } from './home-courses'
import { sitemapEntriesFromSnapshot } from './public-seo'
import type { CatalogCourse, CatalogCycle, CatalogConvocatoria, CatalogSnapshot } from './render'

const MONTH_NUMBERS: Record<string, string> = {
  ene: '01',
  enero: '01',
  feb: '02',
  febrero: '02',
  mar: '03',
  marzo: '03',
  abr: '04',
  abril: '04',
  may: '05',
  mayo: '05',
  jun: '06',
  junio: '06',
  jul: '07',
  julio: '07',
  ago: '08',
  agosto: '08',
  sep: '09',
  sept: '09',
  septiembre: '09',
  oct: '10',
  octubre: '10',
  nov: '11',
  noviembre: '11',
  dic: '12',
  diciembre: '12',
}

function compact(value: string): string {
  return value.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

function visibleText(block: string): string {
  return compact(block.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' '))
}

function slugFromHref(href: string): string {
  const path = href.split('?')[0]
  const parts = path.split('/').filter(Boolean)
  return decodeURIComponent(parts[parts.length - 1] || '')
}

function cardTitle(block: string, fallback: string): string {
  const heading = block.match(/<h[23][^>]*>([^<]+)<\/h[23]>/i)?.[1]
  const alt = block.match(/\salt="([^"]+)"/i)?.[1]
  return compact(heading || alt || fallback.replace(/-/g, ' '))
}

function enrollmentFromBlock(block: string): CatalogCourse['enrollmentStatus'] {
  const text = visibleText(block)
  if (/matr[ií]cula abierta/i.test(text)) return 'open'
  if (/matr[ií]cula cerrada/i.test(text)) return 'closed'
  return 'none'
}

function studyTypeFromBlock(block: string, href: string): string {
  const folded = visibleText(block)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
  if (folded.includes('cursos para desempleados') || /\bdesempleados\b/.test(folded)) return 'desempleados'
  if (folded.includes('cursos para ocupados') || /\bocupados\b/.test(folded)) return 'ocupados'
  if (folded.includes('cursos privados') || /\bprivados\b/.test(folded)) return 'privados'
  return courseKindFromHref(href)
}

function areaFromBlock(block: string): string | null {
  const labeled = visibleText(block).match(/Área\s+([^·\n]+)/i)?.[1]
  if (labeled) return compact(labeled)
  return null
}

function hoursFromBlock(block: string): number | null {
  const match = visibleText(block).match(/\b(\d+)\s*h(?:oras)?\b/i)
  if (!match) return null
  const amount = Number(match[1])
  if (!Number.isFinite(amount) || amount < 8) return null
  return amount
}

function modalityFromBlock(block: string): string | null {
  const folded = visibleText(block)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
  if (folded.includes('teleform') || folded.includes('online')) return 'teleformacion'
  if (folded.includes('semi')) return 'semipresencial'
  if (folded.includes('presenc')) return 'presencial'
  return null
}

function foldKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

export function parseSpanishDate(raw: string): string | null {
  const text = compact(raw)
  if (!text) return null
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const long = text.match(/(\d{1,2})\s+de\s+([A-Za-zÁÉÍÓÚáéíóú]+)\s+de\s+(\d{4})/i)
  if (long) {
    const month = MONTH_NUMBERS[foldKey(long[2])]
    if (month) return `${long[3]}-${month}-${long[1].padStart(2, '0')}`
  }
  const short = text.match(/(\d{1,2})\s+([A-Za-zÁÉÍÓÚáéíóú]+)\s+(\d{4})/i)
  if (short) {
    const month = MONTH_NUMBERS[foldKey(short[2])]
    if (month) return `${short[3]}-${month}-${short[1].padStart(2, '0')}`
  }
  return null
}

function datesFromBlock(block: string): { startDate: string | null; endDate: string | null } {
  const text = visibleText(block)
  const inicio = text.match(/Inicio:\s*(.+?)(?=\s+Sede:|\s+Horario:|\s+Precio:|$)/i)
  if (inicio) {
    return { startDate: parseSpanishDate(inicio[1]), endDate: null }
  }
  const range = text.match(
    /(\d{1,2}\s+de\s+[A-Za-zÁÉÍÓÚáéíóú]+\s+de\s+\d{4})\s*[-–—]\s*(\d{1,2}\s+de\s+[A-Za-zÁÉÍÓÚáéíóú]+\s+de\s+\d{4})/i,
  )
  if (range) {
    return { startDate: parseSpanishDate(range[1]), endDate: parseSpanishDate(range[2]) }
  }
  const single = text.match(/(\d{1,2}\s+de\s+[A-Za-zÁÉÍÓÚáéíóú]+\s+de\s+\d{4})/i)
  if (single) return { startDate: parseSpanishDate(single[1]), endDate: null }
  return { startDate: null, endDate: null }
}

function campusFromBlock(block: string): CatalogConvocatoria['campus'] {
  const text = visibleText(block)
  const labeled = text.match(/Sede:\s*(.+?)(?=\s+Horario:|\s+Precio:|$)/i)?.[1]
  const named = text.match(/\b(?:Sede|CEP)\s+(Santa Cruz|Norte|Sur)\b/i)?.[0]
  const raw = compact(labeled || named || '')
  if (!raw) return null
  const name = displayCampusName(raw.replace(/\s+·\s+Aula.*$/i, ''))
  if (!name) return null
  return { name }
}

function convocatoriaFromBlock(codigo: string, block: string): CatalogConvocatoria {
  const enrollment = enrollmentFromBlock(block)
  const status =
    enrollment === 'open' ? 'enrollment_open' : enrollment === 'closed' ? 'enrollment_closed' : 'published'
  const dates = datesFromBlock(block)
  const imageUrl = block.match(/<img[^>]+src="([^"]+)"/i)?.[1] || null
  const nombre = cardTitle(block, codigo)
  return {
    codigo,
    status,
    startDate: dates.startDate,
    endDate: dates.endDate,
    imageUrl,
    course: { nombre, imageUrl },
    campus: campusFromBlock(block),
  }
}

function nameBeatsCode(value: string | null | undefined, codigo: string): string {
  const text = compact(value || '')
  if (!text) return ''
  const folded = text.replace(/\s+/g, '-').toUpperCase()
  if (folded === codigo.toUpperCase()) return ''
  return text
}

function richerConvocatoria(current: CatalogConvocatoria, next: CatalogConvocatoria): CatalogConvocatoria {
  const imageUrl = next.imageUrl || current.imageUrl || next.course?.imageUrl || current.course?.imageUrl || null
  return {
    ...current,
    ...next,
    status: next.status && next.status !== 'published' ? next.status : current.status,
    startDate: next.startDate || current.startDate,
    endDate: next.endDate || current.endDate,
    imageUrl,
    course: {
      ...(current.course || {}),
      ...(next.course || {}),
      nombre:
        nameBeatsCode(next.course?.nombre, next.codigo) ||
        nameBeatsCode(current.course?.nombre, current.codigo) ||
        next.course?.nombre ||
        current.course?.nombre,
      imageUrl: next.course?.imageUrl || current.course?.imageUrl || imageUrl,
    },
    campus: next.campus?.name ? next.campus : current.campus,
  }
}

function preferHtmlFillGaps<T>(
  htmlItems: T[],
  apiItems: T[],
  keyOf: (item: T) => string,
  merge = (htmlItem: T, apiItem: T): T => ({ ...apiItem, ...htmlItem }),
): T[] {
  if (!htmlItems.length) return apiItems
  if (!apiItems.length) return htmlItems
  const htmlKeys = new Set(htmlItems.map(keyOf).filter(Boolean))
  const apiByKey = new Map(apiItems.map((item) => [keyOf(item), item]))
  const merged = htmlItems.map((htmlItem) => {
    const key = keyOf(htmlItem)
    const apiItem = key ? apiByKey.get(key) : undefined
    return apiItem ? merge(htmlItem, apiItem) : htmlItem
  })
  for (const apiItem of apiItems) {
    const key = keyOf(apiItem)
    if (key && !htmlKeys.has(key)) merged.push(apiItem)
  }
  return merged
}

function collectAnchors(html: string, pattern: RegExp): Array<{ href: string; slug: string; block: string }> {
  const out: Array<{ href: string; slug: string; block: string }> = []
  const seen = new Set<string>()
  for (const match of html.matchAll(pattern)) {
    const href = match[1]
    const slug = slugFromHref(href)
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    out.push({ href, slug, block: match[0] })
  }
  return out
}

function courseCardScore(block: string): number {
  return (block.includes('<img') ? 2 : 0) + (/<h[23]/i.test(block) ? 1 : 0)
}

function imageFromBlock(block: string): string | null {
  const src = block.match(/<img[^>]+src="([^"]+)"/i)?.[1] || ''
  if (!src || /fallback-/i.test(src)) return null
  return src
    .replace(/https?:\/\/cepformacion\.akademate\.com\/api\/media\/file\//g, '/api/media/file/')
    .replace(/https?:\/\/cepformacion\.com\/api\/media\/file\//g, '/api/media/file/')
}

export function coursesFromOriginHtml(html: string): CatalogCourse[] {
  const pattern = /<a\b[^>]*href="(\/p\/cursos\/[^"#?]+)"[^>]*>[\s\S]*?<\/a>/gi
  const chosen = new Map<string, { block: string; slug: string; score: number }>()
  for (const match of html.matchAll(pattern)) {
    const href = match[1]
    const slug = slugFromHref(href)
    if (!slug || slug === 'cursos') continue
    const block = match[0]
    const score = courseCardScore(block)
    const current = chosen.get(slug)
    if (!current || score > current.score) chosen.set(slug, { block, slug, score })
  }
  return [...chosen.values()].map((card) => {
    const studyType = studyTypeFromBlock(card.block, `/p/cursos/${card.slug}`)
    const image = imageFromBlock(card.block)
    return {
      slug: card.slug,
      nombre: cardTitle(card.block, card.slug),
      studyType,
      studyTypeLabel: studyType,
      enrollmentStatus: enrollmentFromBlock(card.block),
      durationHours: hoursFromBlock(card.block),
      modality: modalityFromBlock(card.block),
      area: areaFromBlock(card.block),
      imageUrl: image,
      imagenPortada: image,
    }
  })
}

export function cyclesFromOriginHtml(html: string): CatalogCycle[] {
  const pattern = /<a\b[^>]*href="(\/(?:p\/)?ciclos\/[^"#?]+)"[^>]*>[\s\S]*?<\/a>/gi
  const chosen = new Map<string, { block: string; slug: string; hasHeading: boolean }>()
  for (const match of html.matchAll(pattern)) {
    const href = match[1]
    const slug = slugFromHref(href)
    if (!slug || slug === 'ciclos' || href === '/p/ciclos' || href === '/ciclos') continue
    if (isHiddenPublicCycle(slug)) continue
    const own = match[0]
    const start = html.lastIndexOf('<article', match.index ?? 0)
    const end = html.indexOf('</article>', match.index ?? 0)
    const article = start !== -1 && end > start && (match.index ?? 0) - start < 12000 ? html.slice(start, end) : ''
    const block = /<h[23][^>]*>[^<]+<\/h[23]>/i.test(own) ? own : article || own
    const hasHeading = /<h[23][^>]*>[^<]+<\/h[23]>/i.test(block)
    const current = chosen.get(slug)
    if (!current || (hasHeading && !current.hasHeading)) chosen.set(slug, { block, slug, hasHeading })
  }
  return [...chosen.values()].map((card) => {
    const folded = visibleText(card.block).toLowerCase()
    const level = folded.includes('grado superior')
      ? 'grado_superior'
      : folded.includes('grado medio')
        ? 'grado_medio'
        : null
    const image = card.block.match(/<img[^>]*\ssrc="([^"]+)"/i)?.[1] || null
    return {
      slug: card.slug,
      name: cardTitle(card.block, card.slug),
      level,
      imageUrl: image,
    }
  })
}

/** Next open run embedded in the origin flight. Dashboard edits show up on the next HTML fetch. */
export function flightRunsFromHtml(html: string): CatalogConvocatoria[] {
  const text = html.includes('\\"slug\\"') ? html.replace(/\\"/g, '"') : html
  const runs: CatalogConvocatoria[] = []
  const seen = new Set<string>()
  const runPattern =
    /"(?:nextRun|currentRun)":\{"id":"[^"]*","codigo":"([^"]+)","href":"[^"]*","status":"([^"]*)"(?:,"enrollmentDeadline":(?:null|"[^"]*"))?,"startDate":"([^"]+)"(?:,"endDate":"([^"]*)")?(?:,"scheduleLabel":"[^"]*")?(?:,"campusLabel":"([^"]*)")?/g
  for (const part of text.split('"slug":"').slice(1)) {
    const endSlug = part.indexOf('"')
    if (endSlug <= 0 || endSlug > 160) continue
    const slug = part.slice(0, endSlug)
    const nextCourse = part.indexOf('"slug":"', endSlug + 1)
    const window = part.slice(0, nextCourse === -1 ? part.length : nextCourse)
    const studyType = window.match(/"studyType":"([^"]+)"/)?.[1] || null
    const nombre = window.match(/"nombre":"([^"]*)"/)?.[1] || null
    const imageUrl = window.match(/"imagenPortada":"([^"]+)"/)?.[1] || null
    for (const runMatch of window.matchAll(new RegExp(runPattern.source, 'g'))) {
      if (seen.has(runMatch[1])) continue
      seen.add(runMatch[1])
      runs.push({
        codigo: runMatch[1],
        status: runMatch[2] || 'enrollment_open',
        startDate: runMatch[3],
        endDate: runMatch[4] || null,
        trainingLine: studyType,
        imageUrl,
        course: { slug, nombre, studyType, imageUrl },
        campus: runMatch[5] ? { name: runMatch[5] } : null,
      })
    }
  }
  return runs
}

/** Home lists: the open runs embedded in the OVH public pages, not the Hetzner catalog. */
export function applyOvhHomeCatalog(
  snapshot: CatalogSnapshot | null,
  pages: string[],
): CatalogSnapshot | null {
  const byCode = new Map<string, CatalogConvocatoria>()
  for (const page of pages) {
    if (!page) continue
    for (const run of convocatoriasFromOriginHtml(page)) {
      if (!run.codigo) continue
      const current = byCode.get(run.codigo)
      byCode.set(run.codigo, current ? richerConvocatoria(current, run) : run)
    }
  }
  if (!byCode.size || !snapshot) return snapshot
  return {
    ...snapshot,
    data: {
      ...snapshot.data,
      convocatorias: [...byCode.values()],
      courses: (snapshot.data.courses || []).map((course) =>
        course.enrollmentStatus === 'open' ? { ...course, enrollmentStatus: 'none' } : course,
      ),
    },
  }
}

export function convocatoriasFromOriginHtml(html: string): CatalogConvocatoria[] {
  const byCode = new Map<string, CatalogConvocatoria>()
  const put = (item: CatalogConvocatoria) => {
    const current = byCode.get(item.codigo)
    byCode.set(item.codigo, current ? richerConvocatoria(current, item) : item)
  }
  for (const match of html.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/gi)) {
    const href = match[0].match(/href="(\/(?:p\/)?convocatorias\/[^"#?]+)"/i)?.[1]
    if (!href) continue
    const codigo = slugFromHref(href)
    if (!codigo || codigo === 'convocatorias') continue
    put(convocatoriaFromBlock(codigo, match[0]))
  }
  for (const card of collectAnchors(html, /<a\b[^>]*href="(\/(?:p\/)?convocatorias\/[^"#?]+)"[^>]*>[\s\S]*?<\/a>/gi)) {
    if (!card.slug || card.slug === 'convocatorias') continue
    put(convocatoriaFromBlock(card.slug, card.block))
  }
  for (const run of flightRunsFromHtml(html)) put(run)
  return [...byCode.values()]
}

function foldTitle(value: string): string {
  return compact(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Open convocatoria cards on a sede page. The course slug is filled later by title. */
export function convocatoriasFromSedeHtml(html: string, campusName: string): CatalogConvocatoria[] {
  const out: CatalogConvocatoria[] = []
  const seen = new Set<string>()
  for (const match of html.matchAll(/href="\/convocatorias\/([A-Za-z0-9-]+)"/gi)) {
    const codigo = match[1]
    if (!codigo || seen.has(codigo)) continue
    seen.add(codigo)
    const at = match.index || 0
    const articleEnd = html.indexOf('</article>', at)
    const end = articleEnd === -1 ? at + 8000 : Math.min(html.length, articleEnd + '</article>'.length)
    const window = html.slice(Math.max(0, at - 800), end)
    const aria = window.match(/aria-label="Ver convocatoria:\s*([^"]+)"/i)?.[1]
    const heading = window.match(/<h[23][^>]*>([^<]+)<\/h[23]>/i)?.[1]
    const nombre = compact(aria || heading || '')
    if (!nombre) continue
    const text = visibleText(window)
    const start = text.match(/Inicio\s+(\d{1,2}\s+[A-Za-zÁÉÍÓÚáéíóúñ]+\s+\d{4})/i)?.[1]
    const status = /matr[ií]cula abierta/i.test(text)
      ? 'enrollment_open'
      : /en curso/i.test(text)
        ? 'in_progress'
        : 'published'
    const trainingLine = /desempleados/i.test(text)
      ? 'desempleados'
      : /ocupados/i.test(text)
        ? 'ocupados'
        : /teleformaci/i.test(text)
          ? 'teleformacion'
          : /privados/i.test(text)
            ? 'privados'
            : ''
    out.push({
      codigo,
      status,
      startDate: start ? parseSpanishDate(start) : null,
      trainingLine,
      course: { nombre },
      campus: { name: campusName },
    })
  }
  return out
}

export function bindSedeRunsToCourses(
  courses: Array<{ slug: string; nombre?: string | null }>,
  runs: CatalogConvocatoria[],
): CatalogConvocatoria[] {
  const byTitle = new Map<string, string[]>()
  for (const course of courses) {
    const key = `${foldTitle(course.nombre || '')}|${courseKindFromHref(`/p/cursos/${course.slug}`)}`
    if (key.startsWith('|')) continue
    const slugs = byTitle.get(key) || []
    if (!slugs.includes(course.slug)) slugs.push(course.slug)
    byTitle.set(key, slugs)
  }
  return runs.flatMap((run) => {
    if (run.course?.slug) return [run]
    const line = run.trainingLine || ''
    if (!line) return []
    const slugs = byTitle.get(`${foldTitle(run.course?.nombre || '')}|${line}`) || []
    if (slugs.length !== 1) return []
    return [{ ...run, course: { ...(run.course || {}), slug: slugs[0] } }]
  })
}

export function mergeConvocatorias(
  snapshot: CatalogSnapshot,
  extra: CatalogConvocatoria[],
): CatalogSnapshot {
  const byCode = new Map<string, CatalogConvocatoria>()
  for (const item of snapshot.data.convocatorias || []) {
    if (item.codigo) byCode.set(item.codigo, item)
  }
  for (const item of extra) {
    if (!item.codigo) continue
    const current = byCode.get(item.codigo)
    byCode.set(item.codigo, current ? richerConvocatoria(current, item) : item)
  }
  return {
    ...snapshot,
    data: { ...snapshot.data, convocatorias: [...byCode.values()] },
  }
}

export function campusesFromOriginHtml(html: string): CatalogSnapshot['data']['campuses'] {
  const cards = collectAnchors(html, /<a\b[^>]*href="(\/p\/sedes\/[^"#?]+)"[^>]*>[\s\S]*?<\/a>/gi)
  return cards
    .filter((card) => card.slug && card.slug !== 'sedes')
    .map((card) => ({
      slug: card.slug,
      name: displayCampusName(cardTitle(card.block, card.slug)),
    }))
}

export function catalogFromOriginHtml(html: string): CatalogSnapshot {
  const generatedAt = new Date().toISOString()
  const data = {
    branding: { academyName: 'CEP Formación', primaryColor: '#f2014b' },
    seo: {
      defaultTitle: 'CEP Formación',
      defaultDescription: 'Formación',
      canonicalOrigin: 'https://cepformacion.com',
    },
    courses: coursesFromOriginHtml(html),
    cycles: cyclesFromOriginHtml(html),
    convocatorias: convocatoriasFromOriginHtml(html),
    campuses: campusesFromOriginHtml(html),
    teachers: [],
    sitemap: [] as CatalogSnapshot['data']['sitemap'],
  }
  const snapshot: CatalogSnapshot = {
    meta: {
      tenant: 'cep-formacion',
      host: 'cepformacion.akademate.com',
      generatedAt,
      version: 'origin-html',
      cacheTtlSeconds: 60,
    },
    data,
  }
  snapshot.data.sitemap = sitemapEntriesFromSnapshot(snapshot)
  return snapshot
}

export function catalogHasHomeCourses(snapshot: CatalogSnapshot | null | undefined): boolean {
  return Boolean(snapshot?.data.courses?.some((course) => homeCourseSectionKey(course)))
}

export function coalesceCatalog(
  api: CatalogSnapshot | null | undefined,
  htmlCatalog: CatalogSnapshot,
): CatalogSnapshot {
  if (!api) return htmlCatalog
  return {
    ...api,
    data: {
      ...api.data,
      courses: preferHtmlFillGaps(htmlCatalog.data.courses, api.data.courses || [], (course) => course.slug, (htmlItem, apiItem) => ({
        ...apiItem,
        ...htmlItem,
        imageUrl: htmlItem.imageUrl || apiItem.imageUrl || null,
        imagenPortada: htmlItem.imagenPortada || apiItem.imagenPortada || null,
        area: htmlItem.area || apiItem.area || null,
      })),
      cycles: preferHtmlFillGaps(htmlCatalog.data.cycles, api.data.cycles || [], (cycle) => cycle.slug),
      convocatorias: preferHtmlFillGaps(
        htmlCatalog.data.convocatorias,
        api.data.convocatorias || [],
        (item) => item.codigo,
        (htmlItem, apiItem) => richerConvocatoria(apiItem, htmlItem),
      ),
      campuses: preferHtmlFillGaps(htmlCatalog.data.campuses, api.data.campuses || [], (campus) => campus.slug),
    },
  }
}
