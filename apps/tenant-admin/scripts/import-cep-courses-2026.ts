import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

type SourceSection = 'PRIV' | 'OCU' | 'DES'
type CourseTypeValue = 'privado' | 'ocupados' | 'desempleados' | 'teleformacion'
type AreaCode = 'SCLN' | 'VETA' | 'SBD' | 'TDD' | 'EAG' | 'SVP'

type SourceCourseRow = {
  section: SourceSection
  title: string
  normalizedTitle: string
  line: number
}

type ClassificationSource = 'override' | 'rule' | 'unmapped'

type ClassificationResult = {
  areaCode: AreaCode | null
  source: ClassificationSource
  matchedRules: AreaCode[]
}

type PreparedCourseRow = SourceCourseRow & {
  courseType: CourseTypeValue
  areaCode: AreaCode | null
  classificationSource: ClassificationSource
  matchedRules: AreaCode[]
}

type ImportStats = {
  rawRows: number
  dedupedByType: number
  excludedCycles: number
  finalRows: number
  overlapAcrossTypes: number
  overlapTitles: string[]
  ambiguousCount: number
  unmappedCount: number
}

type BuildRowsResult = {
  rows: PreparedCourseRow[]
  stats: ImportStats
  unmapped: PreparedCourseRow[]
}

type CliOptions = {
  inputPath: string
  tenantId: number
  apply: boolean
  excludeCycles: boolean
  json: boolean
  parseOnly: boolean
}

type ExistingCourse = {
  id: number | string
  name?: string | null
  slug?: string | null
  codigo?: string | null
  course_type?: string | null
  area_formativa?: number | { id?: number | string } | null
  active?: boolean | null
}

type ExistingCourseIndexItem = {
  id: number | string
  name: string
  normalizedTitle: string
  courseType: CourseTypeValue
  slug: string | null
  codigo: string | null
  areaFormativaId: number | null
  active: boolean
}

type UpsertAction = 'create' | 'update' | 'skip' | 'conflict'

type UpsertResult = {
  action: UpsertAction
  title: string
  section: SourceSection
  courseType: CourseTypeValue
  areaCode: AreaCode
  id?: number | string
  slug?: string
  codigo?: string
  reason?: string
}

type ImportReport = {
  mode: 'dry-run' | 'apply'
  tenantId: number
  inputPath: string
  stats: ImportStats
  result: {
    created: number
    updated: number
    skipped: number
    conflicts: number
    errors: number
  }
  unmappedTitles: string[]
  sampleActions: UpsertResult[]
}

type PayloadClient = {
  find: (args: Record<string, unknown>) => Promise<{ docs: any[]; totalPages?: number; totalDocs?: number }>
  findByID: (args: Record<string, unknown>) => Promise<any>
  create: (args: Record<string, unknown>) => Promise<any>
  update: (args: Record<string, unknown>) => Promise<any>
}

const SOURCE_HEADERS: Array<{ section: SourceSection; matcher: RegExp }> = [
  { section: 'PRIV', matcher: /^##\s+Cursos privados/i },
  { section: 'OCU', matcher: /^##\s+Cursos para trabajadores ocupados/i },
  { section: 'DES', matcher: /^##\s+Cursos para trabajadores desempleados/i },
]

const CYCLE_EXCLUSION_NORMALIZED = new Set([
  'ciclo de farmacia y parafarmacia',
  'ciclo de higiene bucodental',
])

const STUDY_TYPE_BY_SECTION: Record<SourceSection, CourseTypeValue> = {
  PRIV: 'privado',
  OCU: 'ocupados',
  DES: 'desempleados',
}

const TYPE_CODE_4: Record<CourseTypeValue, 'PRIV' | 'OCUP' | 'DESE' | 'TELE'> = {
  privado: 'PRIV',
  ocupados: 'OCUP',
  desempleados: 'DESE',
  teleformacion: 'TELE',
}

const TYPE_SLUG_SUFFIX: Record<CourseTypeValue, string> = {
  privado: 'priv',
  ocupados: 'ocu',
  desempleados: 'des',
  teleformacion: 'tel',
}

const OFFICIAL_AREA_CODES: AreaCode[] = ['SCLN', 'VETA', 'SBD', 'TDD', 'EAG', 'SVP']

const DEFAULT_INPUT_PATH = '/Users/carlosjperez/Downloads/CURSOS CEP FORMACION 2026.md'
const DEFAULT_TENANT_ID = 1

const AREA_OVERRIDES: Record<string, AreaCode> = {
  'especializacion clinica avanzada para acv': 'SCLN',
  'auxiliar de clinicas esteticas': 'SCLN',
  'comunicacion e interaccion social en entornos tic': 'TDD',
  'trafico de mercancias por carretera': 'EAG',
  'iluminacion en espectaculos': 'TDD',
  'oratoria publica y locucion audiovisual': 'TDD',
  'dirigir equipos de trabajo en entornos virtuales': 'EAG',
  'atencion al alumnado con altas capacidades': 'EAG',
  'programacion por competencias': 'EAG',
  'atencion a la diversidad': 'EAG',
  'inteligencia emocional en la escuela': 'EAG',
  'desarrollo organizacional coaching de equipos': 'EAG',
  'actividades basicas de atencion al cliente': 'EAG',
  'coordinacion y apoyo a la direccion de recursos y servicios dirigidos a las personas mayores': 'EAG',
  'elaboracion de un plan de acogida': 'EAG',
  'excel avanzado': 'TDD',
  'formacion de formadores en e learning': 'TDD',
  'huella de carbono de producto y organizacion': 'EAG',
  'insercion laboral de personas con discapacidad': 'EAG',
  'modelos de negocio en la economia circular': 'EAG',
  'operaciones auxiliares para personas con discapacidad intelectual': 'EAG',
  'organizacion del transporte y distribucion': 'EAG',
  'trabajo en equipo': 'EAG',
  'gestion ambiental': 'EAG',
  'la igualdad entre hombres y mujeres en la negociacion colectiva': 'EAG',
}

const AREA_RULES: Array<{ areaCode: AreaCode; pattern: RegExp }> = [
  {
    areaCode: 'SVP',
    pattern: /(vigilancia|seguridad privada|proteccion de personas|espacios publicos|centros comerciales)/i,
  },
  {
    areaCode: 'VETA',
    pattern: /(veterin|(^|\s)atv(\s|$)|canin|felin|cetace|animal|adiestramiento)/i,
  },
  {
    areaCode: 'SCLN',
    pattern:
      /(enfermer|odont|bucodental|farmacia|dermocosmet|clinica estetic|auxiliar de optica|tanatopraxia|tanatoestetica|clinicas dentales|sanitaria|sanitario)/i,
  },
  {
    areaCode: 'SBD',
    pattern: /(entrenamiento|pilates|yoga|quiromasaje|dietetic|nutricion|bienestar|deporte)/i,
  },
  {
    areaCode: 'TDD',
    pattern:
      /(inteligencia artificial|(^|\s)ia(\s|$)|digital|web|software|ofimatica|moodle|e learning|elearning|impresion 3d|diseno 3d|videojuegos|cloud|comercio electronico|marketing online|marketing digital|herramientas web 2 0|tratamiento de imagenes|nube ecloud|plataformas lms)/i,
  },
  {
    areaCode: 'EAG',
    pattern:
      /(contabilidad|fiscal|nominas|rrhh|recursos humanos|liderazgo|logistica|proyectos?|gestion|empresa|administracion|ingles|aleman|frances|hosteler|aliment|cocina|restauracion|vinos|clientes|tributari|financiacion|igualdad|ventas|almacen|transporte|organizacional|conciliacion|ambiental|discapacidad)/i,
  },
]

function toSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

function normalizeCourseTypeValue(value: string | null | undefined): CourseTypeValue | null {
  if (!value) return null
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9_]+/g, '_')

  if (['privado', 'privados', 'priv'].includes(normalized)) return 'privado'
  if (['ocupados', 'ocupado', 'ocu', 'trabajadores_ocupados'].includes(normalized)) return 'ocupados'
  if (['desempleados', 'desempleado', 'des', 'trabajadores_desempleados'].includes(normalized)) {
    return 'desempleados'
  }
  if (['teleformacion', 'tele_formacion', 'online', 'tel'].includes(normalized)) return 'teleformacion'
  return null
}

function parseBooleanFlag(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue
  if (['1', 'true', 'yes', 'on'].includes(value.toLowerCase())) return true
  if (['0', 'false', 'no', 'off'].includes(value.toLowerCase())) return false
  return defaultValue
}

export function normalizeCourseTitle(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function isExcludedCycleTitle(normalizedTitle: string): boolean {
  return CYCLE_EXCLUSION_NORMALIZED.has(normalizedTitle) || normalizedTitle.startsWith('ciclo de ')
}

function sectionFromHeading(line: string): SourceSection | null {
  for (const header of SOURCE_HEADERS) {
    if (header.matcher.test(line.trim())) return header.section
  }
  return null
}

export function parseMarkdownCourseRows(markdown: string): SourceCourseRow[] {
  const rows: SourceCourseRow[] = []
  const lines = markdown.split(/\r?\n/)
  let section: SourceSection | null = null

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    const detected = sectionFromHeading(line)
    if (detected) {
      section = detected
      continue
    }

    if (!section || !line.trim().startsWith('|')) continue
    const cells = line.split('|').map((cell) => cell.trim())
    const title = cells[1] ?? ''
    if (!title) continue
    if (/^curso$/i.test(title) || /^-+$/.test(title)) continue
    if (title.startsWith('Descripción breve') || title.startsWith('No disponible')) continue

    rows.push({
      section,
      title,
      normalizedTitle: normalizeCourseTitle(title),
      line: index + 1,
    })
  }

  return rows
}

export function dedupeRowsByType(rows: SourceCourseRow[]): SourceCourseRow[] {
  const byKey = new Map<string, SourceCourseRow>()
  for (const row of rows) {
    const key = `${row.normalizedTitle}||${row.section}`
    if (!byKey.has(key)) byKey.set(key, row)
  }
  return [...byKey.values()]
}

export function countOverlapAcrossTypes(rows: SourceCourseRow[]): { count: number; titles: string[] } {
  const map = new Map<string, Set<SourceSection>>()
  for (const row of rows) {
    if (!map.has(row.normalizedTitle)) map.set(row.normalizedTitle, new Set())
    map.get(row.normalizedTitle)!.add(row.section)
  }

  const titles = [...map.entries()]
    .filter(([, sectionSet]) => sectionSet.size > 1)
    .map(([normalized]) => normalized)
    .sort((a, b) => a.localeCompare(b))

  return { count: titles.length, titles }
}

export function classifyAreaCode(title: string): ClassificationResult {
  const normalized = normalizeCourseTitle(title)
  const override = AREA_OVERRIDES[normalized]
  if (override) {
    return { areaCode: override, source: 'override', matchedRules: [override] }
  }

  const matchedRules = AREA_RULES.filter((rule) => rule.pattern.test(normalized)).map((rule) => rule.areaCode)
  if (matchedRules.length === 0) {
    return { areaCode: null, source: 'unmapped', matchedRules: [] }
  }

  return { areaCode: matchedRules[0], source: 'rule', matchedRules }
}

export function buildRowsFromMarkdown(
  markdown: string,
  options?: { excludeCycles?: boolean }
): BuildRowsResult {
  const excludeCycles = options?.excludeCycles !== false
  const parsed = parseMarkdownCourseRows(markdown)
  const deduped = dedupeRowsByType(parsed)
  const overlaps = countOverlapAcrossTypes(deduped)

  const filtered = excludeCycles
    ? deduped.filter((row) => !isExcludedCycleTitle(row.normalizedTitle))
    : deduped
  const excludedCycles = deduped.length - filtered.length

  const prepared: PreparedCourseRow[] = filtered.map((row) => {
    const classification = classifyAreaCode(row.title)
    return {
      ...row,
      courseType: STUDY_TYPE_BY_SECTION[row.section],
      areaCode: classification.areaCode,
      classificationSource: classification.source,
      matchedRules: classification.matchedRules,
    }
  })

  const unmapped = prepared.filter((row) => !row.areaCode)
  const ambiguousCount = prepared.filter(
    (row) => row.classificationSource === 'rule' && row.matchedRules.length > 1
  ).length

  return {
    rows: prepared,
    unmapped,
    stats: {
      rawRows: parsed.length,
      dedupedByType: deduped.length,
      excludedCycles,
      finalRows: prepared.length,
      overlapAcrossTypes: overlaps.count,
      overlapTitles: overlaps.titles,
      ambiguousCount,
      unmappedCount: unmapped.length,
    },
  }
}

function buildNaturalKey(normalizedTitle: string, courseType: CourseTypeValue): string {
  return `${normalizedTitle}||${courseType}`
}

function getStudyTypeCode(courseType: CourseTypeValue): string {
  return TYPE_CODE_4[courseType]
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

export function buildSlugBase(title: string, courseType: CourseTypeValue): string {
  const suffix = TYPE_SLUG_SUFFIX[courseType]
  const base = `${toSlug(title)}-${suffix}`.replace(/-+/g, '-')
  return base.slice(0, 500)
}

export function ensureUniqueSlug(baseSlug: string, slugRegistry: Set<string>): string {
  let candidate = baseSlug
  let counter = 2

  while (slugRegistry.has(candidate)) {
    const suffix = `-${counter}`
    const truncatedBase = baseSlug.slice(0, Math.max(1, 500 - suffix.length))
    candidate = `${truncatedBase}${suffix}`
    counter += 1
  }

  slugRegistry.add(candidate)
  return candidate
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

async function fetchAll(
  payload: PayloadClient,
  args: Record<string, unknown>
): Promise<any[]> {
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
  if (!tenant) {
    throw new Error(`Tenant ${tenantId} no encontrado.`)
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
    if (OFFICIAL_AREA_CODES.includes(code) && Number.isFinite(id)) {
      map.set(code, id)
    }
  }

  const missing = OFFICIAL_AREA_CODES.filter((code) => !map.has(code))
  if (missing.length > 0) {
    throw new Error(`Faltan áreas oficiales en DB: ${missing.join(', ')}. Ejecuta sync:cep:website primero.`)
  }

  return map
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
    throw new Error(`Faltan tipos de estudio oficiales en DB: ${missing.join(', ')}. Ejecuta sync:cep:website primero.`)
  }
}

function parseArgs(argv: string[]): CliOptions {
  let inputPath = process.env.CEP_COURSES_INPUT?.trim() || DEFAULT_INPUT_PATH
  let tenantId = Number.parseInt(process.env.TENANT_ID ?? '', 10)
  let apply = false
  let excludeCycles = true
  let json = false
  let parseOnly = false

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
    if (arg.startsWith('--input=')) {
      inputPath = arg.slice('--input='.length).trim()
      continue
    }
    if (arg.startsWith('--tenant-id=')) {
      tenantId = Number.parseInt(arg.slice('--tenant-id='.length), 10)
      continue
    }
    if (arg.startsWith('--exclude-cycles=')) {
      excludeCycles = parseBooleanFlag(arg.slice('--exclude-cycles='.length), true)
    }
  }

  if (!Number.isFinite(tenantId) || tenantId <= 0) {
    tenantId = DEFAULT_TENANT_ID
  }

  return {
    inputPath,
    tenantId,
    apply,
    excludeCycles,
    json,
    parseOnly,
  }
}

function printHumanSummary(report: ImportReport): void {
  console.log('=== CEP Courses 2026 Import ===')
  console.log(`Mode: ${report.mode}`)
  console.log(`Tenant: ${report.tenantId}`)
  console.log(`Input: ${report.inputPath}`)
  console.log(
    `Rows: raw=${report.stats.rawRows} dedupe=${report.stats.dedupedByType} excludedCycles=${report.stats.excludedCycles} final=${report.stats.finalRows}`
  )
  console.log(
    `Overlap inter-type=${report.stats.overlapAcrossTypes} ambiguous=${report.stats.ambiguousCount} unmapped=${report.stats.unmappedCount}`
  )
  console.log(
    `Actions: created=${report.result.created} updated=${report.result.updated} skipped=${report.result.skipped} conflicts=${report.result.conflicts} errors=${report.result.errors}`
  )
  if (report.unmappedTitles.length > 0) {
    console.log('--- Unmapped Titles ---')
    for (const title of report.unmappedTitles) {
      console.log(`- ${title}`)
    }
  }
}

export async function runImport(options: CliOptions): Promise<ImportReport> {
  if (!existsSync(options.inputPath)) {
    throw new Error(`No existe el archivo de entrada: ${options.inputPath}`)
  }

  const markdown = await readFile(options.inputPath, 'utf8')
  const prepared = buildRowsFromMarkdown(markdown, { excludeCycles: options.excludeCycles })

  const unmappedTitles = prepared.unmapped.map((row) => `${row.section} | ${row.title}`)
  if (prepared.unmapped.length > 0) {
    throw new Error(
      `Hay ${prepared.unmapped.length} cursos sin área asignada. Corrige overrides/reglas antes de continuar.\n${unmappedTitles.join('\n')}`
    )
  }

  if (options.parseOnly) {
    return {
      mode: 'dry-run',
      tenantId: options.tenantId,
      inputPath: options.inputPath,
      stats: prepared.stats,
      result: { created: 0, updated: 0, skipped: 0, conflicts: 0, errors: 0 },
      unmappedTitles,
      sampleActions: [],
    }
  }

  const payloadModule = await import('payload')
  const payloadConfig = await import('@payload-config')
  const payload = (await payloadModule.getPayload({ config: payloadConfig.default })) as PayloadClient

  await ensureTenantExists(payload, options.tenantId)
  await ensureCourseTypes(payload)
  const areaByCode = await loadAreaMap(payload)

  const tenantCoursesDocs = (await fetchAll(payload, {
    collection: 'courses',
    where: { tenant: { equals: options.tenantId } },
  })) as ExistingCourse[]

  const globalCoursesDocs = (await fetchAll(payload, { collection: 'courses' })) as ExistingCourse[]

  const slugRegistry = new Set(
    globalCoursesDocs.map((doc) => (doc.slug || '').trim()).filter((slug) => slug.length > 0)
  )
  const codeRegistry = new Set(
    globalCoursesDocs.map((doc) => (doc.codigo || '').trim()).filter((code) => code.length > 0)
  )
  const maxCodeByPrefix = new Map<string, number>()

  for (const doc of globalCoursesDocs) {
    if (!doc.codigo) continue
    const parsed = parseCodigoSequence(doc.codigo)
    if (!parsed) continue
    const current = maxCodeByPrefix.get(parsed.prefix) ?? 0
    if (parsed.sequence > current) maxCodeByPrefix.set(parsed.prefix, parsed.sequence)
  }

  const indexByNaturalKey = new Map<string, ExistingCourseIndexItem[]>()
  for (const doc of tenantCoursesDocs) {
    const courseType = normalizeCourseTypeValue(doc.course_type)
    if (!courseType) continue
    const normalizedTitle = normalizeCourseTitle(doc.name ?? '')
    if (!normalizedTitle) continue

    const item: ExistingCourseIndexItem = {
      id: doc.id,
      name: String(doc.name || '').trim(),
      normalizedTitle,
      courseType,
      slug: doc.slug ?? null,
      codigo: doc.codigo ?? null,
      areaFormativaId: extractRelationshipId(doc.area_formativa),
      active: Boolean(doc.active),
    }

    const key = buildNaturalKey(normalizedTitle, courseType)
    if (!indexByNaturalKey.has(key)) indexByNaturalKey.set(key, [])
    indexByNaturalKey.get(key)!.push(item)
  }

  let created = 0
  let updated = 0
  let skipped = 0
  let conflicts = 0
  let errors = 0
  const actions: UpsertResult[] = []

  for (const row of prepared.rows) {
    const key = buildNaturalKey(row.normalizedTitle, row.courseType)
    const existingMatches = indexByNaturalKey.get(key) ?? []
    const areaCode = row.areaCode as AreaCode
    const areaId = areaByCode.get(areaCode)

    if (!areaId) {
      errors += 1
      actions.push({
        action: 'conflict',
        title: row.title,
        section: row.section,
        courseType: row.courseType,
        areaCode,
        reason: `Área ${areaCode} no encontrada en BD`,
      })
      continue
    }

    if (existingMatches.length > 1) {
      conflicts += 1
      actions.push({
        action: 'conflict',
        title: row.title,
        section: row.section,
        courseType: row.courseType,
        areaCode,
        reason: `Clave natural duplicada en BD (${existingMatches.length} cursos)`,
      })
      continue
    }

    if (existingMatches.length === 1) {
      const existing = existingMatches[0]
      const updateData: Record<string, unknown> = {}

      if (existing.name !== row.title) updateData.name = row.title
      if (existing.courseType !== row.courseType) updateData.course_type = row.courseType
      if (existing.areaFormativaId !== areaId) updateData.area_formativa = areaId
      if (!existing.active) updateData.active = true

      if (!existing.slug) {
        const baseSlug = buildSlugBase(row.title, row.courseType)
        updateData.slug = ensureUniqueSlug(baseSlug, slugRegistry)
      }

      if (!existing.codigo) {
        const prefix = `${areaCode}-${getStudyTypeCode(row.courseType)}`
        updateData.codigo = nextCodigo(prefix, codeRegistry, maxCodeByPrefix)
      }

      if (Object.keys(updateData).length === 0) {
        skipped += 1
        actions.push({
          action: 'skip',
          id: existing.id,
          title: row.title,
          section: row.section,
          courseType: row.courseType,
          areaCode,
          reason: 'Sin cambios',
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
      actions.push({
        action: 'update',
        id: existing.id,
        title: row.title,
        section: row.section,
        courseType: row.courseType,
        areaCode,
        slug: String(updateData.slug ?? existing.slug ?? ''),
        codigo: String(updateData.codigo ?? existing.codigo ?? ''),
      })
      continue
    }

    const baseSlug = buildSlugBase(row.title, row.courseType)
    const slug = ensureUniqueSlug(baseSlug, slugRegistry)
    const prefix = `${areaCode}-${getStudyTypeCode(row.courseType)}`
    const codigo = nextCodigo(prefix, codeRegistry, maxCodeByPrefix)

    const createData = {
      name: row.title,
      slug,
      codigo,
      course_type: row.courseType,
      area_formativa: areaId,
      tenant: options.tenantId,
      active: true,
      featured: false,
      modality: 'presencial',
      short_description: '',
    }

    if (options.apply) {
      const createdDoc = await payload.create({
        collection: 'courses',
        data: createData,
        overrideAccess: true,
        depth: 0,
      })
      actions.push({
        action: 'create',
        id: createdDoc.id,
        title: row.title,
        section: row.section,
        courseType: row.courseType,
        areaCode,
        slug,
        codigo,
      })
    } else {
      actions.push({
        action: 'create',
        title: row.title,
        section: row.section,
        courseType: row.courseType,
        areaCode,
        slug,
        codigo,
      })
    }

    created += 1
  }

  const report: ImportReport = {
    mode: options.apply ? 'apply' : 'dry-run',
    tenantId: options.tenantId,
    inputPath: options.inputPath,
    stats: prepared.stats,
    result: { created, updated, skipped, conflicts, errors },
    unmappedTitles,
    sampleActions: actions.slice(0, 25),
  }

  return report
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  const report = await runImport(options)
  if (options.json) {
    console.log(JSON.stringify(report, null, 2))
    return
  }
  printHumanSummary(report)
}

const currentFile = fileURLToPath(import.meta.url)
const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : ''
if (entryFile && entryFile === currentFile) {
  void main().catch((error) => {
    console.error('✗ import-cep-courses-2026 failed:', error)
    process.exitCode = 1
  })
}
