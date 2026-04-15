import { readFile } from 'fs/promises'
import { existsSync, readdirSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import { execFileSync } from 'child_process'
import { extname } from 'path'

import {
  buildSlugBase,
  classifyAreaCode,
  ensureUniqueSlug,
  normalizeCourseTitle,
} from './import-cep-courses-2026'

type SourceSection = 'PRIV' | 'OCU' | 'DES'
type CourseTypeValue = 'privado' | 'ocupados' | 'desempleados' | 'teleformacion'
type AreaCode = 'SCLN' | 'VETA' | 'SBD' | 'TDD' | 'EAG' | 'SVP'
type ModalityValue = 'presencial' | 'online' | 'hibrido'

type BaseCatalogRow = {
  section: SourceSection
  sourceType: CourseTypeValue
  title: string
  normalizedTitle: string
  modalityRaw: string
  durationRaw: string | null
  durationHours: number | null
  pdfFromRow: string | null
  line: number
}

type PreparedRow = {
  title: string
  normalizedTitle: string
  courseType: CourseTypeValue
  sourceSection: SourceSection
  derivedFromTeleRule: boolean
  modalityRaw: string
  modality: ModalityValue
  durationHoursFromCatalog: number | null
  pdfFilename: string | null
  imageFilename: string | null
}

type CourseImageIndex = Map<string, string>
type CoursePdfIndex = Map<string, string>

type ParsedCatalog = {
  rows: BaseCatalogRow[]
  pdfIndex: CoursePdfIndex
  imageIndex: CourseImageIndex
}

type PdfExtractedData = {
  specialtyName: string | null
  specialtyCode: string | null
  objective: string | null
  modules: Array<{ title: string; hours: number | null }>
  requirements: string | null
  modalityText: string | null
  durationHours: number | null
}

type PreparedPdfContent = {
  shortDescription: string | null
  longDescription: unknown
  durationHours: number | null
  modality: ModalityValue | null
}

type ExistingCourse = {
  id: number | string
  name?: string | null
  slug?: string | null
  codigo?: string | null
  course_type?: string | null
  area_formativa?: number | { id?: number | string } | null
  modality?: ModalityValue | null
  short_description?: string | null
  long_description?: unknown
  duration_hours?: number | null
  featured_image?: number | { id?: number | string } | null
  active?: boolean | null
}

type ExistingCourseIndexItem = {
  id: number | string
  normalizedTitle: string
  courseType: CourseTypeValue
  name: string
  slug: string | null
  codigo: string | null
  areaFormativaId: number | null
  modality: ModalityValue | null
  shortDescription: string | null
  longDescription: unknown
  durationHours: number | null
  featuredImageId: number | null
  active: boolean
}

type PayloadClient = {
  find: (args: Record<string, unknown>) => Promise<{ docs: any[]; totalPages?: number }>
  findByID: (args: Record<string, unknown>) => Promise<any>
  create: (args: Record<string, unknown>) => Promise<any>
  update: (args: Record<string, unknown>) => Promise<any>
}

type CliOptions = {
  inputMd: string
  pdfDir: string
  imagesDir: string
  tenantId: number
  apply: boolean
  parseOnly: boolean
  replaceImages: boolean
  excludeCycles: boolean
  json: boolean
}

type UpsertAction = 'create' | 'update' | 'skip' | 'conflict' | 'error'

type UpsertResult = {
  action: UpsertAction
  title: string
  courseType: CourseTypeValue
  sourceSection: SourceSection
  areaCode: AreaCode | null
  id?: number | string
  reason?: string
}

type ImportReport = {
  mode: 'dry-run' | 'apply'
  tenantId: number
  inputMd: string
  stats: {
    rawRows: number
    dedupedSourceRows: number
    teleDerivedRows: number
    finalRows: number
    overlapsAcrossTypes: number
    unmappedAreas: number
    missingPdfMatches: number
    missingImageMatches: number
  }
  result: {
    created: number
    updated: number
    skipped: number
    conflicts: number
    errors: number
  }
  byType: Record<CourseTypeValue, { created: number; updated: number; skipped: number }>
  warnings: string[]
  sampleActions: UpsertResult[]
}

const DEFAULT_INPUT_MD = '/Users/carlosjperez/Desktop/CursosTenerife_Catalogo/catalogo/CATALOGO_CURSOS_TENERIFE_2025.md'
const DEFAULT_PDF_DIR = '/Users/carlosjperez/Desktop/CursosTenerife_Catalogo/fichas_pdf'
const DEFAULT_IMAGES_DIR = '/Users/carlosjperez/Desktop/CursosTenerife_Catalogo/imagenes_cursos'
const DEFAULT_TENANT_ID = 1
const OFFICIAL_AREA_CODES: AreaCode[] = ['SCLN', 'VETA', 'SBD', 'TDD', 'EAG', 'SVP']
const TYPE_CODE_4: Record<CourseTypeValue, 'PRIV' | 'OCUP' | 'DESE' | 'TELE'> = {
  privado: 'PRIV',
  ocupados: 'OCUP',
  desempleados: 'DESE',
  teleformacion: 'TELE',
}

const SOURCE_TYPE_BY_SECTION: Record<SourceSection, CourseTypeValue> = {
  PRIV: 'privado',
  OCU: 'ocupados',
  DES: 'desempleados',
}

const CATALOG_AREA_OVERRIDES: Record<string, AreaCode> = {
  'direccion de equipos y coaching': 'EAG',
  'direccion de personas y desarrollo del talento': 'EAG',
  'elaboracion de cafes y cartas de cafe': 'EAG',
  'elaboracion de helados y sorbetes': 'EAG',
  'dirigir equipos en entornos virtuales': 'EAG',
}

const TELEFORMACION_TOKENS = ['teleformacion', 'tele_formacion', 'online']

const SECTION_REGEX = {
  DES: /^##\s+🔴\s*CURSOS PARA DESEMPLEADOS/i,
  OCU: /^##\s+🟢\s*CURSOS PARA OCUPADOS/i,
  PRIV: /^##\s+🔵\s*CURSOS PRIVADOS/i,
  CYCLES: /^##\s+🎓\s*CICLOS/i,
  SUMMARY: /^##\s+📊\s*RESUMEN/i,
  PDF_INDEX: /^##\s+📁\s*PDFS DESCARGADOS/i,
  IMAGE_INDEX: /^##\s+🖼️\s*ÍNDICE DE IMÁGENES/i,
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function normalizeFilename(value: string): string {
  return value.trim().replace(/`/g, '')
}

function parseHours(value: string | null | undefined): number | null {
  if (!value) return null
  const cleaned = value.replace(/\./g, '').replace(',', '.')
  const match = cleaned.match(/(\d{1,4})/)
  if (!match?.[1]) return null
  const parsed = Number.parseInt(match[1], 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}

function classifyAreaCodeForCatalog(title: string): AreaCode | null {
  const normalized = normalizeCourseTitle(title)
  const override = CATALOG_AREA_OVERRIDES[normalized]
  if (override) return override

  const classified = classifyAreaCode(title)
  return (classified.areaCode as AreaCode | null) ?? null
}

function normalizeCourseTypeValue(value: string | null | undefined): CourseTypeValue | null {
  if (!value) return null
  const normalized = normalizeText(value).replace(/\s+/g, '_')
  if (['privado', 'privados', 'priv'].includes(normalized)) return 'privado'
  if (['ocupados', 'ocupado', 'ocu'].includes(normalized)) return 'ocupados'
  if (['desempleados', 'desempleado', 'des'].includes(normalized)) return 'desempleados'
  if (['teleformacion', 'tele_formacion', 'tel', 'online'].includes(normalized)) return 'teleformacion'
  return null
}

function normalizeModality(raw: string, courseType: CourseTypeValue): ModalityValue {
  const normalized = normalizeText(raw)
  const hasPresencial = normalized.includes('presencial')
  const hasTele = TELEFORMACION_TOKENS.some((token) => normalized.includes(token))

  if (hasPresencial && hasTele) return 'hibrido'
  if (normalized.includes('mixto') || normalized.includes('hibrido')) return 'hibrido'
  if (hasTele || courseType === 'teleformacion') return 'online'
  if (hasPresencial) return 'presencial'
  return courseType === 'teleformacion' ? 'online' : 'presencial'
}

export function isTeleformacionEligible(modalityRaw: string): boolean {
  const normalized = normalizeText(modalityRaw)
  return TELEFORMACION_TOKENS.some((token) => normalized.includes(token))
}

function extractRelationshipId(value: ExistingCourse['area_formativa']): number | null {
  if (!value) return null
  if (typeof value === 'number') return value
  if (typeof value === 'object' && value.id !== undefined) {
    const parsed = Number(value.id)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function extractMediaId(value: ExistingCourse['featured_image']): number | null {
  if (!value) return null
  if (typeof value === 'number') return value
  if (typeof value === 'object' && value.id !== undefined) {
    const parsed = Number(value.id)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function buildNaturalKey(normalizedTitle: string, courseType: CourseTypeValue): string {
  return `${normalizedTitle}||${courseType}`
}

function parseCodigoSequence(codigo: string): { prefix: string; sequence: number } | null {
  const match = /^([A-Z]{3,4}-(?:PRIV|OCUP|DESE|TELE))-(\d{4})$/.exec(codigo)
  if (!match?.[1] || !match[2]) return null
  return {
    prefix: match[1],
    sequence: Number.parseInt(match[2], 10),
  }
}

function nextCodigo(prefix: string, codeRegistry: Set<string>, maxByPrefix: Map<string, number>): string {
  let next = (maxByPrefix.get(prefix) ?? 0) + 1
  let candidate = `${prefix}-${String(next).padStart(4, '0')}`

  while (codeRegistry.has(candidate)) {
    next += 1
    candidate = `${prefix}-${String(next).padStart(4, '0')}`
  }

  maxByPrefix.set(prefix, next)
  codeRegistry.add(candidate)
  return candidate
}

function looksLikeHeaderRow(cells: string[]): boolean {
  const normalized = cells.map((cell) => normalizeText(cell))
  return normalized.includes('curso') && normalized.includes('modalidad')
}

function createHeaderMap(cells: string[]): Record<string, number> {
  const map: Record<string, number> = {}
  cells.forEach((cell, index) => {
    map[normalizeText(cell)] = index
  })
  return map
}

function cleanCell(value: string | undefined): string {
  return (value ?? '').trim()
}

export function parseCourseRowsFromMarkdown(markdown: string): BaseCatalogRow[] {
  const lines = markdown.split(/\r?\n/)
  const rows: BaseCatalogRow[] = []

  let section: SourceSection | null = null
  let parsingCatalogTables = false
  let headerMap: Record<string, number> = {}

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    const trimmed = line.trim()

    if (SECTION_REGEX.DES.test(trimmed)) {
      section = 'DES'
      parsingCatalogTables = false
      headerMap = {}
      continue
    }
    if (SECTION_REGEX.OCU.test(trimmed)) {
      section = 'OCU'
      parsingCatalogTables = false
      headerMap = {}
      continue
    }
    if (SECTION_REGEX.PRIV.test(trimmed)) {
      section = 'PRIV'
      parsingCatalogTables = false
      headerMap = {}
      continue
    }
    if (SECTION_REGEX.CYCLES.test(trimmed) || SECTION_REGEX.SUMMARY.test(trimmed)) {
      section = null
      parsingCatalogTables = false
      headerMap = {}
      continue
    }
    if (!section) continue

    if (!trimmed.startsWith('|')) {
      if (trimmed === '') {
        parsingCatalogTables = false
        headerMap = {}
      }
      continue
    }

    const cells = trimmed.split('|').map((cell) => cell.trim()).slice(1, -1)
    if (cells.length === 0) continue
    if (cells.every((cell) => /^[-:]+$/.test(cell))) continue

    if (looksLikeHeaderRow(cells)) {
      parsingCatalogTables = true
      headerMap = createHeaderMap(cells)
      continue
    }
    if (!parsingCatalogTables) continue

    let title = ''
    let modalityRaw = ''
    let durationRaw = ''
    let pdfFromRow: string | null = null

    if (section === 'PRIV') {
      title = cleanCell(cells[0])
      modalityRaw = cleanCell(cells[1])
      durationRaw = cleanCell(cells[2])
    } else {
      const titleIndex = headerMap['curso'] ?? 1
      const modalityIndex = headerMap['modalidad'] ?? 2
      const durationIndex = headerMap['horas'] ?? 3
      const pdfIndex = headerMap['pdf']

      title = cleanCell(cells[titleIndex])
      modalityRaw = cleanCell(cells[modalityIndex])
      durationRaw = cleanCell(cells[durationIndex])
      if (pdfIndex !== undefined) {
        const value = normalizeFilename(cleanCell(cells[pdfIndex]))
        pdfFromRow = value && value !== '-' ? value : null
      }
    }

    if (!title || /^curso$/i.test(title) || /^#$/i.test(title) || /^-+$/.test(title)) continue

    rows.push({
      section,
      sourceType: SOURCE_TYPE_BY_SECTION[section],
      title,
      normalizedTitle: normalizeCourseTitle(title),
      modalityRaw,
      durationRaw: durationRaw || null,
      durationHours: parseHours(durationRaw),
      pdfFromRow,
      line: index + 1,
    })
  }

  return rows
}

export function parsePdfIndexFromMarkdown(markdown: string): CoursePdfIndex {
  const lines = markdown.split(/\r?\n/)
  const index = new Map<string, string>()

  let inPdfSection = false
  let inTable = false
  let headerMap: Record<string, number> = {}

  for (const line of lines) {
    const trimmed = line.trim()
    if (SECTION_REGEX.PDF_INDEX.test(trimmed)) {
      inPdfSection = true
      inTable = false
      headerMap = {}
      continue
    }
    if (!inPdfSection) continue

    if (trimmed.startsWith('## ') && !SECTION_REGEX.PDF_INDEX.test(trimmed)) {
      break
    }

    if (!trimmed.startsWith('|')) continue
    const cells = trimmed.split('|').map((cell) => cell.trim()).slice(1, -1)
    if (cells.length === 0) continue
    if (cells.every((cell) => /^[-:]+$/.test(cell))) continue

    if (cells.some((cell) => /^ARCHIVO$/i.test(cell)) && cells.some((cell) => /^CURSO$/i.test(cell))) {
      inTable = true
      headerMap = createHeaderMap(cells)
      continue
    }
    if (!inTable) continue

    const filename = normalizeFilename(cleanCell(cells[headerMap['archivo'] ?? 1]))
    const courseName = cleanCell(cells[headerMap['curso'] ?? 2])
    if (!filename || filename === '-' || !courseName) continue

    index.set(normalizeCourseTitle(courseName), filename)
  }

  return index
}

export function parseImageIndexFromMarkdown(markdown: string): CourseImageIndex {
  const lines = markdown.split(/\r?\n/)
  const index = new Map<string, string>()

  let inImageCoursesSection = false
  let inTable = false
  let headerMap: Record<string, number> = {}

  for (const line of lines) {
    const trimmed = line.trim()
    if (/^###\s+🎓\s*Imágenes de Cursos/i.test(trimmed)) {
      inImageCoursesSection = true
      inTable = false
      headerMap = {}
      continue
    }
    if (!inImageCoursesSection) continue
    if (trimmed.startsWith('### ') && !/^###\s+🎓\s*Imágenes de Cursos/i.test(trimmed)) break
    if (trimmed.startsWith('>')) break

    if (!trimmed.startsWith('|')) continue
    const cells = trimmed.split('|').map((cell) => cell.trim()).slice(1, -1)
    if (cells.length === 0) continue
    if (cells.every((cell) => /^[-:]+$/.test(cell))) continue

    if (
      cells.some((cell) => /^ARCHIVO$/i.test(cell)) &&
      cells.some((cell) => /^CURSO ASOCIADO$/i.test(cell))
    ) {
      inTable = true
      headerMap = createHeaderMap(cells)
      continue
    }
    if (!inTable) continue

    const filename = normalizeFilename(cleanCell(cells[headerMap['archivo'] ?? 1]))
    const courseName = cleanCell(cells[headerMap['curso asociado'] ?? 2])
    if (!filename || !courseName) continue
    if (/^logo-/i.test(filename)) continue
    if (/^ciclo-/i.test(filename)) continue
    if (normalizeCourseTitle(courseName).startsWith('ciclo ')) continue
    index.set(normalizeCourseTitle(courseName), filename)
  }

  return index
}

export function parseCatalogMarkdown(markdown: string): ParsedCatalog {
  return {
    rows: parseCourseRowsFromMarkdown(markdown),
    pdfIndex: parsePdfIndexFromMarkdown(markdown),
    imageIndex: parseImageIndexFromMarkdown(markdown),
  }
}

function buildLocalImageFallbackMap(imagesDir: string): Map<string, string> {
  if (!existsSync(imagesDir)) return new Map()
  const files = readdirSync(imagesDir).filter((file) => /\.(png|jpe?g|webp)$/i.test(file))
  const map = new Map<string, string>()
  for (const filename of files) {
    if (/^logo-/i.test(filename)) continue
    if (/^ciclo-/i.test(filename)) continue
    const base = path.basename(filename, extname(filename))
    map.set(normalizeCourseTitle(base), filename)
  }
  return map
}

function resolveImageFilename(
  normalizedTitle: string,
  imageIndex: CourseImageIndex,
  fallbackMap: Map<string, string>
): string | null {
  const explicit = imageIndex.get(normalizedTitle)
  if (explicit) return explicit

  if (fallbackMap.has(normalizedTitle)) return fallbackMap.get(normalizedTitle) ?? null

  for (const [key, filename] of fallbackMap.entries()) {
    if (key.includes(normalizedTitle) || normalizedTitle.includes(key)) return filename
  }

  return null
}

export function buildPreparedRows(
  parsed: ParsedCatalog,
  options: { imagesDir: string }
): {
  rows: PreparedRow[]
  stats: {
    rawRows: number
    dedupedSourceRows: number
    teleDerivedRows: number
    finalRows: number
    overlapsAcrossTypes: number
    missingPdfMatches: number
    missingImageMatches: number
  }
} {
  const sourceDedup = new Map<string, BaseCatalogRow>()
  for (const row of parsed.rows) {
    const key = buildNaturalKey(row.normalizedTitle, row.sourceType)
    if (!sourceDedup.has(key)) sourceDedup.set(key, row)
  }
  const dedupedRows = [...sourceDedup.values()]

  const allTypesByTitle = new Map<string, Set<CourseTypeValue>>()
  for (const row of dedupedRows) {
    if (!allTypesByTitle.has(row.normalizedTitle)) {
      allTypesByTitle.set(row.normalizedTitle, new Set())
    }
    allTypesByTitle.get(row.normalizedTitle)!.add(row.sourceType)
  }
  const overlapsAcrossTypes = [...allTypesByTitle.values()].filter((set) => set.size > 1).length

  const fallbackImageMap = buildLocalImageFallbackMap(options.imagesDir)
  const finalRowsByKey = new Map<string, PreparedRow>()
  let teleDerivedRows = 0
  let missingPdfMatches = 0
  let missingImageMatches = 0

  for (const row of dedupedRows) {
    const imageFilename = resolveImageFilename(row.normalizedTitle, parsed.imageIndex, fallbackImageMap)
    if (!imageFilename) missingImageMatches += 1

    const pdfFilename =
      row.pdfFromRow ??
      parsed.pdfIndex.get(row.normalizedTitle) ??
      null
    if (!pdfFilename) missingPdfMatches += 1

    const basePrepared: PreparedRow = {
      title: row.title,
      normalizedTitle: row.normalizedTitle,
      courseType: row.sourceType,
      sourceSection: row.section,
      derivedFromTeleRule: false,
      modalityRaw: row.modalityRaw,
      modality: normalizeModality(row.modalityRaw, row.sourceType),
      durationHoursFromCatalog: row.durationHours,
      pdfFilename,
      imageFilename,
    }

    const baseKey = buildNaturalKey(basePrepared.normalizedTitle, basePrepared.courseType)
    if (!finalRowsByKey.has(baseKey)) finalRowsByKey.set(baseKey, basePrepared)

    if (isTeleformacionEligible(row.modalityRaw)) {
      const telePrepared: PreparedRow = {
        ...basePrepared,
        courseType: 'teleformacion',
        derivedFromTeleRule: true,
        modality: normalizeModality(row.modalityRaw, 'teleformacion'),
      }
      const teleKey = buildNaturalKey(telePrepared.normalizedTitle, telePrepared.courseType)
      if (!finalRowsByKey.has(teleKey)) {
        finalRowsByKey.set(teleKey, telePrepared)
        teleDerivedRows += 1
      }
    }
  }

  return {
    rows: [...finalRowsByKey.values()],
    stats: {
      rawRows: parsed.rows.length,
      dedupedSourceRows: dedupedRows.length,
      teleDerivedRows,
      finalRows: finalRowsByKey.size,
      overlapsAcrossTypes,
      missingPdfMatches,
      missingImageMatches,
    },
  }
}

function cleanBlockText(value: string | null | undefined): string | null {
  if (!value) return null
  const cleaned = value
    .replace(/\f/g, ' ')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
  return cleaned.length > 0 ? cleaned : null
}

function extractSectionBlock(text: string, startRegex: RegExp, endRegexes: RegExp[]): string | null {
  const startMatch = text.match(startRegex)
  if (!startMatch || startMatch.index === undefined) return null
  const fromIndex = startMatch.index + startMatch[0].length
  const tail = text.slice(fromIndex)

  let endIndex = tail.length
  for (const endRegex of endRegexes) {
    const endMatch = tail.match(endRegex)
    if (endMatch && endMatch.index !== undefined && endMatch.index < endIndex) {
      endIndex = endMatch.index
    }
  }

  return cleanBlockText(tail.slice(0, endIndex))
}

function parseModules(block: string | null): Array<{ title: string; hours: number | null }> {
  if (!block) return []
  const modules: Array<{ title: string; hours: number | null }> = []
  const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)

  for (const line of lines) {
    const compact = line.replace(/[ \t]{2,}/g, ' ')
    const match =
      compact.match(/^M[oó]dulo\s+\d+\s+(.+?)\s+(\d+)\s+horas?/i) ??
      compact.match(/^M[oó]dulo\s+\d+\s+(.+)$/i)

    if (!match) continue
    modules.push({
      title: cleanBlockText(match[1] ?? '') ?? compact,
      hours: match[2] ? Number.parseInt(match[2], 10) : null,
    })
  }

  return modules
}

function parsePdfDurationHours(text: string): number | null {
  const regexes = [
    /Duraci[oó]n total(?:\s+en cualquier[^\n\r]*)?\s+(\d{1,4})\s+horas?/i,
    /Duraci[oó]n total\s+(\d{1,4})\s+horas?/i,
  ]
  for (const regex of regexes) {
    const match = text.match(regex)
    if (match?.[1]) {
      const parsed = Number.parseInt(match[1], 10)
      if (Number.isFinite(parsed) && parsed > 0) return parsed
    }
  }
  return null
}

function parsePdfModalityBlock(text: string): string | null {
  const block = extractSectionBlock(
    text,
    /Modalidad(?:es)? de impartici[oó]n/i,
    [/Duraci[oó]n de la formaci[oó]n/i, /Requisitos de acceso del alumnado/i]
  )
  if (!block) return null
  const normalized = cleanBlockText(block.replace(/[-•]/g, ' '))
  return normalized
}

export function parsePdfExtractedText(text: string): PdfExtractedData {
  const specialtyName =
    cleanBlockText(
      text.match(/Denominaci[oó]n de la\s+especialidad:\s*([^\n\r]+)/i)?.[1] ??
      text.match(/Denominaci[oó]n:\s*([^\n\r]+)/i)?.[1] ??
      null
    )

  const specialtyCode = cleanBlockText(text.match(/C[oó]digo:\s*([A-Z0-9]+)/i)?.[1] ?? null)

  const objective = extractSectionBlock(
    text,
    /Objetivo general/i,
    [/Relaci[oó]n de m[oó]dulos de formaci[oó]n/i, /Modalidad(?:es)? de impartici[oó]n/i]
  )

  const modulesBlock = extractSectionBlock(
    text,
    /Relaci[oó]n de m[oó]dulos de formaci[oó]n/i,
    [/Modalidad(?:es)? de impartici[oó]n/i, /Duraci[oó]n de la formaci[oó]n/i]
  )

  const requirements = extractSectionBlock(
    text,
    /Requisitos de acceso del alumnado/i,
    [
      /Prescripciones de formadores y tutores/i,
      /Justificaci[oó]n de los requisitos del alumnado/i,
      /Requisitos m[ií]nimos de espacios/i,
      /Aula virtual/i,
    ]
  )

  return {
    specialtyName,
    specialtyCode,
    objective,
    modules: parseModules(modulesBlock),
    requirements,
    modalityText: parsePdfModalityBlock(text),
    durationHours: parsePdfDurationHours(text),
  }
}

function buildRichTextParagraphs(lines: string[]): unknown {
  return lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => ({
      type: 'paragraph',
      children: [{ text: line }],
    }))
}

export function buildPdfContent(data: PdfExtractedData): PreparedPdfContent {
  const lines: string[] = []

  if (data.specialtyName) lines.push(`Especialidad: ${data.specialtyName}`)
  if (data.specialtyCode) lines.push(`Codigo oficial: ${data.specialtyCode}`)
  if (data.objective) {
    lines.push('Objetivo general:')
    lines.push(data.objective)
  }
  if (data.modules.length > 0) {
    lines.push('Modulos formativos:')
    for (const module of data.modules) {
      const moduleLabel = module.hours ? `- ${module.title} (${module.hours} h)` : `- ${module.title}`
      lines.push(moduleLabel)
    }
  }
  if (data.requirements) {
    lines.push('Requisitos de acceso:')
    lines.push(data.requirements)
  }

  const shortDescription = data.objective
    ? data.objective.slice(0, 420).trim()
    : null

  const longDescription = lines.length > 0 ? buildRichTextParagraphs(lines) : null

  return {
    shortDescription,
    longDescription,
    durationHours: data.durationHours,
    modality: data.modalityText ? normalizeModality(data.modalityText, 'teleformacion') : null,
  }
}

function readPdfText(pdfPath: string): string {
  return execFileSync('pdftotext', ['-layout', pdfPath, '-'], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  })
}

function mimeTypeFromPath(filePath: string): string {
  const extension = extname(filePath).toLowerCase()
  if (extension === '.png') return 'image/png'
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg'
  if (extension === '.webp') return 'image/webp'
  return 'application/octet-stream'
}

async function fetchAll(payload: PayloadClient, args: Record<string, unknown>): Promise<any[]> {
  const docs: any[] = []
  let page = 1
  let totalPages = 1
  do {
    const result = await payload.find({
      ...args,
      page,
      limit: 500,
      depth: 0,
      overrideAccess: true,
    })
    docs.push(...(result.docs ?? []))
    totalPages = result.totalPages ?? 1
    page += 1
  } while (page <= totalPages)
  return docs
}

async function ensureTenantExists(payload: PayloadClient, tenantId: number): Promise<void> {
  const tenant = await payload.findByID({
    collection: 'tenants',
    id: tenantId,
    depth: 0,
    overrideAccess: true,
  })
  if (!tenant) throw new Error(`Tenant ${tenantId} not found.`)
}

async function ensureCourseTypes(payload: PayloadClient): Promise<void> {
  const docs = await payload.find({
    collection: 'course-types',
    where: { code: { in: ['PRIV', 'OCU', 'DES', 'TEL'] } },
    limit: 50,
    depth: 0,
    overrideAccess: true,
  })
  const found = new Set((docs.docs ?? []).map((doc) => String(doc.code || '').toUpperCase()))
  const missing = ['PRIV', 'OCU', 'DES', 'TEL'].filter((code) => !found.has(code))
  if (missing.length > 0) {
    throw new Error(`Missing official course types in DB: ${missing.join(', ')}.`)
  }
}

async function loadAreaMap(payload: PayloadClient): Promise<Map<AreaCode, number>> {
  const docs = await payload.find({
    collection: 'areas-formativas',
    where: { codigo: { in: OFFICIAL_AREA_CODES } },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  const map = new Map<AreaCode, number>()
  for (const doc of docs.docs ?? []) {
    const code = String(doc.codigo || '').toUpperCase() as AreaCode
    const id = Number(doc.id)
    if (OFFICIAL_AREA_CODES.includes(code) && Number.isFinite(id)) map.set(code, id)
  }

  const missing = OFFICIAL_AREA_CODES.filter((code) => !map.has(code))
  if (missing.length > 0) {
    throw new Error(`Missing official areas in DB: ${missing.join(', ')}.`)
  }

  return map
}

async function resolveScriptUser(payload: PayloadClient): Promise<{ id: number | string; role: string; tenant?: number | string }> {
  const users = await payload.find({
    collection: 'users',
    where: { role: { in: ['admin', 'gestor', 'superadmin'] } },
    sort: 'id',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if ((users.docs ?? []).length === 0) {
    throw new Error('No admin/gestor user found to perform media upload.')
  }

  const user = users.docs[0] as { id: number | string; role?: string; tenant?: number | string }
  return {
    id: user.id,
    role: user.role ?? 'admin',
    tenant: user.tenant,
  }
}

async function ensureMediaFromFile(
  payload: PayloadClient,
  filePath: string,
  alt: string,
  scriptUser: { id: number | string; role: string; tenant?: number | string }
): Promise<number | null> {
  if (!existsSync(filePath)) return null
  const filename = path.basename(filePath)
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if ((existing.docs ?? []).length > 0) {
    const media = existing.docs[0] as { id: number | string }
    const id = Number(media.id)
    return Number.isFinite(id) ? id : null
  }

  const binary = readFileSync(filePath)
  const created = await payload.create({
    collection: 'media',
    data: {
      alt,
      folder: 'courses/cursostenerife-catalog',
      created_by: scriptUser.id,
    },
    file: {
      data: binary,
      mimetype: mimeTypeFromPath(filePath),
      name: filename,
      size: binary.byteLength,
    },
    req: {
      user: scriptUser,
    },
    overrideAccess: true,
    depth: 0,
  })
  const media = created as { id: number | string }
  const id = Number(media.id)
  return Number.isFinite(id) ? id : null
}

function parseArgs(argv: string[]): CliOptions {
  let inputMd = process.env.CEP_CURSOS_TENERIFE_INPUT_MD?.trim() || DEFAULT_INPUT_MD
  let pdfDir = process.env.CEP_CURSOS_TENERIFE_PDF_DIR?.trim() || DEFAULT_PDF_DIR
  let imagesDir = process.env.CEP_CURSOS_TENERIFE_IMAGES_DIR?.trim() || DEFAULT_IMAGES_DIR
  let tenantId = Number.parseInt(process.env.TENANT_ID ?? '', 10)
  let apply = false
  let parseOnly = false
  let replaceImages = true
  let excludeCycles = true
  let json = false

  for (const arg of argv) {
    if (arg === '--apply') {
      apply = true
      continue
    }
    if (arg === '--dry-run') {
      apply = false
      continue
    }
    if (arg === '--json') {
      json = true
      continue
    }
    if (arg === '--parse-only') {
      parseOnly = true
      continue
    }
    if (arg === '--replace-images=false') {
      replaceImages = false
      continue
    }
    if (arg === '--replace-images=true') {
      replaceImages = true
      continue
    }
    if (arg === '--exclude-cycles=false') {
      excludeCycles = false
      continue
    }
    if (arg === '--exclude-cycles=true') {
      excludeCycles = true
      continue
    }
    if (arg.startsWith('--input-md=')) {
      inputMd = arg.slice('--input-md='.length).trim()
      continue
    }
    if (arg.startsWith('--pdf-dir=')) {
      pdfDir = arg.slice('--pdf-dir='.length).trim()
      continue
    }
    if (arg.startsWith('--images-dir=')) {
      imagesDir = arg.slice('--images-dir='.length).trim()
      continue
    }
    if (arg.startsWith('--tenant-id=')) {
      tenantId = Number.parseInt(arg.slice('--tenant-id='.length), 10)
      continue
    }
  }

  if (!Number.isFinite(tenantId) || tenantId <= 0) tenantId = DEFAULT_TENANT_ID
  if (!excludeCycles) {
    throw new Error('exclude-cycles=false is not supported for this importer.')
  }

  return {
    inputMd,
    pdfDir,
    imagesDir,
    tenantId,
    apply,
    parseOnly,
    replaceImages,
    excludeCycles,
    json,
  }
}

function diffByTypeTemplate(): Record<CourseTypeValue, { created: number; updated: number; skipped: number }> {
  return {
    privado: { created: 0, updated: 0, skipped: 0 },
    ocupados: { created: 0, updated: 0, skipped: 0 },
    desempleados: { created: 0, updated: 0, skipped: 0 },
    teleformacion: { created: 0, updated: 0, skipped: 0 },
  }
}

function equalJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

export async function runImport(options: CliOptions): Promise<ImportReport> {
  if (!existsSync(options.inputMd)) {
    throw new Error(`Input markdown not found: ${options.inputMd}`)
  }
  if (!existsSync(options.pdfDir)) {
    throw new Error(`PDF folder not found: ${options.pdfDir}`)
  }
  if (!existsSync(options.imagesDir)) {
    throw new Error(`Images folder not found: ${options.imagesDir}`)
  }

  const markdown = await readFile(options.inputMd, 'utf8')
  const parsed = parseCatalogMarkdown(markdown)
  const prepared = buildPreparedRows(parsed, { imagesDir: options.imagesDir })

  const rowsWithArea = prepared.rows.map((row) => {
    const areaCode = classifyAreaCodeForCatalog(row.title)
    return {
      ...row,
      areaCode,
    }
  })
  const unmappedRows = rowsWithArea.filter((row) => !row.areaCode)
  if (unmappedRows.length > 0) {
    throw new Error(
      `Found ${unmappedRows.length} courses without area mapping:\n${unmappedRows
        .slice(0, 40)
        .map((row) => `- ${row.courseType} | ${row.title}`)
        .join('\n')}`
    )
  }

  if (options.parseOnly) {
    return {
      mode: 'dry-run',
      tenantId: options.tenantId,
      inputMd: options.inputMd,
      stats: {
        ...prepared.stats,
        unmappedAreas: 0,
      },
      result: {
        created: 0,
        updated: 0,
        skipped: 0,
        conflicts: 0,
        errors: 0,
      },
      byType: diffByTypeTemplate(),
      warnings: [],
      sampleActions: [],
    }
  }

  const payloadModule = await import('payload')
  const payloadConfig = await import('@payload-config')
  const payload = (await payloadModule.getPayload({ config: payloadConfig.default })) as PayloadClient

  await ensureTenantExists(payload, options.tenantId)
  await ensureCourseTypes(payload)
  const areaByCode = await loadAreaMap(payload)
  const scriptUser = await resolveScriptUser(payload)

  const tenantCourses = (await fetchAll(payload, {
    collection: 'courses',
    where: { tenant: { equals: options.tenantId } },
  })) as ExistingCourse[]

  const globalCourses = (await fetchAll(payload, {
    collection: 'courses',
  })) as ExistingCourse[]

  const slugRegistry = new Set(
    globalCourses.map((course) => String(course.slug ?? '').trim()).filter((slug) => slug.length > 0)
  )
  const codeRegistry = new Set(
    globalCourses.map((course) => String(course.codigo ?? '').trim()).filter((code) => code.length > 0)
  )
  const maxCodeByPrefix = new Map<string, number>()
  for (const course of globalCourses) {
    if (!course.codigo) continue
    const parsedCode = parseCodigoSequence(course.codigo)
    if (!parsedCode) continue
    const current = maxCodeByPrefix.get(parsedCode.prefix) ?? 0
    if (parsedCode.sequence > current) maxCodeByPrefix.set(parsedCode.prefix, parsedCode.sequence)
  }

  const existingByNaturalKey = new Map<string, ExistingCourseIndexItem[]>()
  for (const course of tenantCourses) {
    const type = normalizeCourseTypeValue(course.course_type)
    if (!type) continue
    const normalizedTitle = normalizeCourseTitle(String(course.name ?? ''))
    if (!normalizedTitle) continue
    const key = buildNaturalKey(normalizedTitle, type)
    const item: ExistingCourseIndexItem = {
      id: course.id,
      normalizedTitle,
      courseType: type,
      name: String(course.name ?? ''),
      slug: course.slug ?? null,
      codigo: course.codigo ?? null,
      areaFormativaId: extractRelationshipId(course.area_formativa),
      modality: course.modality ?? null,
      shortDescription: course.short_description ?? null,
      longDescription: course.long_description ?? null,
      durationHours: course.duration_hours ?? null,
      featuredImageId: extractMediaId(course.featured_image),
      active: Boolean(course.active),
    }
    if (!existingByNaturalKey.has(key)) existingByNaturalKey.set(key, [])
    existingByNaturalKey.get(key)!.push(item)
  }

  const pdfCache = new Map<string, PreparedPdfContent>()
  const imageCache = new Map<string, number | null>()

  let created = 0
  let updated = 0
  let skipped = 0
  let conflicts = 0
  let errors = 0
  const warnings: string[] = []
  const actions: UpsertResult[] = []
  const byType = diffByTypeTemplate()

  for (const row of rowsWithArea) {
    const areaCode = row.areaCode as AreaCode
    const areaId = areaByCode.get(areaCode)
    if (!areaId) {
      errors += 1
      actions.push({
        action: 'error',
        title: row.title,
        courseType: row.courseType,
        sourceSection: row.sourceSection,
        areaCode: row.areaCode,
        reason: `Area code ${areaCode} not found in DB`,
      })
      continue
    }

    const key = buildNaturalKey(row.normalizedTitle, row.courseType)
    const existingMatches = existingByNaturalKey.get(key) ?? []
    if (existingMatches.length > 1) {
      conflicts += 1
      actions.push({
        action: 'conflict',
        title: row.title,
        courseType: row.courseType,
        sourceSection: row.sourceSection,
        areaCode: row.areaCode,
        reason: `Duplicate natural key in DB (${existingMatches.length})`,
      })
      continue
    }

    let preparedPdfContent: PreparedPdfContent = {
      shortDescription: null,
      longDescription: null,
      durationHours: null,
      modality: null,
    }
    if (row.pdfFilename) {
      if (!pdfCache.has(row.pdfFilename)) {
        const fullPath = path.join(options.pdfDir, row.pdfFilename)
        if (existsSync(fullPath)) {
          try {
            const extracted = parsePdfExtractedText(readPdfText(fullPath))
            pdfCache.set(row.pdfFilename, buildPdfContent(extracted))
          } catch (error) {
            warnings.push(`Could not parse PDF ${row.pdfFilename}: ${error instanceof Error ? error.message : String(error)}`)
            pdfCache.set(row.pdfFilename, {
              shortDescription: null,
              longDescription: null,
              durationHours: null,
              modality: null,
            })
          }
        } else {
          warnings.push(`PDF not found on disk: ${row.pdfFilename}`)
          pdfCache.set(row.pdfFilename, {
            shortDescription: null,
            longDescription: null,
            durationHours: null,
            modality: null,
          })
        }
      }
      preparedPdfContent = pdfCache.get(row.pdfFilename)!
    }

    let featuredImageId: number | null = null
    if (row.imageFilename) {
      if (!imageCache.has(row.imageFilename)) {
        const fullPath = path.join(options.imagesDir, row.imageFilename)
        if (existsSync(fullPath)) {
          const imageId = await ensureMediaFromFile(
            payload,
            fullPath,
            `Imagen del curso: ${row.title}`,
            scriptUser
          )
          imageCache.set(row.imageFilename, imageId)
        } else {
          warnings.push(`Image file not found on disk: ${row.imageFilename}`)
          imageCache.set(row.imageFilename, null)
        }
      }
      featuredImageId = imageCache.get(row.imageFilename) ?? null
    }

    const durationToSet = preparedPdfContent.durationHours ?? row.durationHoursFromCatalog ?? null
    const shortDescriptionToSet = preparedPdfContent.shortDescription
    const longDescriptionToSet = preparedPdfContent.longDescription
    const modalityToSet = preparedPdfContent.modality ?? row.modality

    if (existingMatches.length === 1) {
      const existing = existingMatches[0]
      const updateData: Record<string, unknown> = {}

      if (existing.name !== row.title) updateData.name = row.title
      if (existing.courseType !== row.courseType) updateData.course_type = row.courseType
      if (existing.areaFormativaId !== areaId) updateData.area_formativa = areaId
      if (existing.modality !== modalityToSet) updateData.modality = modalityToSet
      if (durationToSet && existing.durationHours !== durationToSet) {
        updateData.duration_hours = durationToSet
      }
      if (shortDescriptionToSet && existing.shortDescription !== shortDescriptionToSet) {
        updateData.short_description = shortDescriptionToSet
      }
      if (longDescriptionToSet && !equalJson(existing.longDescription, longDescriptionToSet)) {
        updateData.long_description = longDescriptionToSet
      }
      if (options.replaceImages && featuredImageId && existing.featuredImageId !== featuredImageId) {
        updateData.featured_image = featuredImageId
      }
      if (!existing.active) updateData.active = true

      if (!existing.slug) {
        updateData.slug = ensureUniqueSlug(buildSlugBase(row.title, row.courseType), slugRegistry)
      }
      if (!existing.codigo) {
        const prefix = `${areaCode}-${TYPE_CODE_4[row.courseType]}`
        updateData.codigo = nextCodigo(prefix, codeRegistry, maxCodeByPrefix)
      }

      if (Object.keys(updateData).length === 0) {
        skipped += 1
        byType[row.courseType].skipped += 1
        actions.push({
          action: 'skip',
          title: row.title,
          courseType: row.courseType,
          sourceSection: row.sourceSection,
          areaCode: row.areaCode,
          id: existing.id,
          reason: 'No changes',
        })
        continue
      }

      if (options.apply) {
        await payload.update({
          collection: 'courses',
          id: existing.id,
          data: updateData,
          overrideAccess: true,
          depth: 0,
        })
      }

      updated += 1
      byType[row.courseType].updated += 1
      actions.push({
        action: 'update',
        title: row.title,
        courseType: row.courseType,
        sourceSection: row.sourceSection,
        areaCode: row.areaCode,
        id: existing.id,
      })
      continue
    }

    const slug = ensureUniqueSlug(buildSlugBase(row.title, row.courseType), slugRegistry)
    const codigo = nextCodigo(`${areaCode}-${TYPE_CODE_4[row.courseType]}`, codeRegistry, maxCodeByPrefix)

    const createData: Record<string, unknown> = {
      name: row.title,
      slug,
      codigo,
      course_type: row.courseType,
      area_formativa: areaId,
      tenant: options.tenantId,
      modality: modalityToSet,
      active: true,
      featured: false,
    }
    if (durationToSet) createData.duration_hours = durationToSet
    if (shortDescriptionToSet) createData.short_description = shortDescriptionToSet
    if (longDescriptionToSet) createData.long_description = longDescriptionToSet
    if (options.replaceImages && featuredImageId) createData.featured_image = featuredImageId

    if (options.apply) {
      await payload.create({
        collection: 'courses',
        data: createData,
        overrideAccess: true,
        depth: 0,
      })
    }

    created += 1
    byType[row.courseType].created += 1
    actions.push({
      action: 'create',
      title: row.title,
      courseType: row.courseType,
      sourceSection: row.sourceSection,
      areaCode: row.areaCode,
    })
  }

  return {
    mode: options.apply ? 'apply' : 'dry-run',
    tenantId: options.tenantId,
    inputMd: options.inputMd,
    stats: {
      ...prepared.stats,
      unmappedAreas: unmappedRows.length,
    },
    result: {
      created,
      updated,
      skipped,
      conflicts,
      errors,
    },
    byType,
    warnings,
    sampleActions: actions.slice(0, 40),
  }
}

function printHumanReport(report: ImportReport): void {
  console.log('=== CursosTenerife Import ===')
  console.log(`Mode: ${report.mode}`)
  console.log(`Tenant: ${report.tenantId}`)
  console.log(`Input: ${report.inputMd}`)
  console.log(
    `Rows: raw=${report.stats.rawRows} deduped=${report.stats.dedupedSourceRows} teleDerived=${report.stats.teleDerivedRows} final=${report.stats.finalRows}`
  )
  console.log(
    `Coverage: overlaps=${report.stats.overlapsAcrossTypes} unmapped=${report.stats.unmappedAreas} missingPdf=${report.stats.missingPdfMatches} missingImage=${report.stats.missingImageMatches}`
  )
  console.log(
    `Actions: created=${report.result.created} updated=${report.result.updated} skipped=${report.result.skipped} conflicts=${report.result.conflicts} errors=${report.result.errors}`
  )
  console.log('By type:')
  for (const [type, values] of Object.entries(report.byType)) {
    console.log(` - ${type}: created=${values.created}, updated=${values.updated}, skipped=${values.skipped}`)
  }
  if (report.warnings.length > 0) {
    console.log('Warnings:')
    for (const warning of report.warnings.slice(0, 20)) {
      console.log(` - ${warning}`)
    }
    if (report.warnings.length > 20) {
      console.log(` - ... ${report.warnings.length - 20} more warnings`)
    }
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  const report = await runImport(options)
  if (options.json) {
    console.log(JSON.stringify(report, null, 2))
    return
  }
  printHumanReport(report)
}

const currentFile = fileURLToPath(import.meta.url)
const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : ''
if (entryFile && entryFile === currentFile) {
  void main().catch((error) => {
    console.error('✗ import-cursostenerife-catalog failed:', error)
    process.exitCode = 1
  })
}
