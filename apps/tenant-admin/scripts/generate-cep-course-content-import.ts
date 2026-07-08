import { execFileSync } from 'child_process'
import { createHash } from 'crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { buildSlugBase, classifyAreaCode, normalizeCourseTitle } from './import-cep-courses-2026'
import { parsePdfExtractedText } from './import-cursostenerife-catalog'
import {
  CEP_COURSE_PROGRAM_ENTRIES,
  courseProgramRichText,
  type CourseProgramEntry,
} from './cep-course-programs-data'

type AreaCode = 'SCLN' | 'VETA' | 'SBD' | 'TDD' | 'EAG' | 'SVP' | 'IDIO'
type CourseType = 'privado' | 'ocupados' | 'desempleados' | 'teleformacion' | 'ciclo_medio' | 'ciclo_superior'

type SourceKind = 'cep-private-program' | 'official-specialty-pdf' | 'advertising-poster'

type NormalizedCourseContent = {
  sourceKind: SourceKind
  sourcePath: string
  sourceHash: string
  sourceTextPath: string | null
  pdfFilename: string
  title: string
  slug: string
  officialCode: string | null
  courseType: CourseType
  areaCode: AreaCode
  modality: 'presencial' | 'online' | 'hibrido'
  durationHours: number | null
  shortDescription: string | null
  longDescription: unknown | null
  objectives: string[]
  programBlocks: Array<{ title: string; body: string | null; items: string[] }>
  requirements: string | null
  outcomes: string | null
  status: 'ready' | 'skipped'
  notes: string[]
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '../../..')
const CEP_PROGRAM_ROOT = path.join(REPO_ROOT, 'docs/course-programs/cep')
const GENERATED_ROOT = path.join(CEP_PROGRAM_ROOT, 'generated-20260708')
const GENERATED_TEXT_DIR = path.join(GENERATED_ROOT, 'text')
const DOWNLOADS_DIR = '/Users/carlosjperez/Downloads'

const DOWNLOAD_PDFS = [
  'COML0209 - ORGANIZACION DEL TRANSPORTE Y LA DISTRIBUCION.pdf',
  'HOTR0020 - LOGISTICA EN LA COCINA. APROVISIONAMIENTO DE MATERIAS PRIMAS.pdf',
  'ADGN16 - FISCALIDAD EN LAS PYMES Y USO DE PROGRAMA DE GESTION FISCAL INTEGRADO.pdf',
  'ADGN11 - FINANCIACION Y PLANIFICACION FINANCIERA. NUEVAS HERRAMIENTAS DE FINANCIACION.pdf',
  'ADGD177PO - LIDERAZGO ESTRATEGICO.pdf',
  'ADGD352PO - TRANSFORMACION DIGITAL EN LA EMPRESA.pdf',
  'ADGD078PO - LIDERAZGO Y DIRECCION DE ORGANIZACIONES.pdf',
  'ADGD65 - DIGITALIZACION DE NOMINAS EN LA EMRPESA.pdf',
  'CARTEL PUBLICITARIO SANTA CRUZ 2026.pdf',
  'ADGD0032 - GESTION CONTABLE, FISCAL Y LABORAL.pdf',
  '2. CARTEL PUBLICITARIO LA OROTAVA 2025 Difusión 22-06.pdf',
  'IFCD107 Especialista en Inteligencia Artificial.pdf',
  'ADGG24 Gestión informatizada de ventas con programa .pdf',
  'IFCD60 Comunicación e interacción social en  .pdf',
  'ADGD068PO DIRECCION DE PERSONAS Y DESARROLLO DEL TALENTO.pdf',
  'IFCT117 INTRODUCCIÓN A LA INTELIGENCIA ARTIFICIAL.pdf',
  'IFCD0038 DISEÑO DE PÁGINAS WEBS PARA HOSTELERÍA.pdf',
  'ADGG06 Digitalización y RRSS como estrategia .pdf',
  'ADGN16 Fiscalidad en las pymes y uso de programa de .pdf',
  'ADGN11 Financiación y planificación financiera.pdf',
  'ADGD0032 GESTIÓN CONTABLE, FISCAL Y LABORAL.pdf',
  'ADGD0046 CONTABILIDAD INFORMATIZAD .pdf',
  'IFCD49 Tratamiento de imágenes para web y móvil .pdf',
  'SSCE05 INGLÉS C1 .pdf',
]

const FORCED_SLUG_BY_OFFICIAL_CODE: Record<string, string> = {
  COML0209: 'organizacion-del-transporte-y-la-distribucion-des',
  HOTR0020: 'logistica-en-la-cocina-aprovisionamiento-de-materias-primas-des',
  ADGN16: 'fiscalidad-en-las-pymes-y-uso-de-programa-de-gestion-fiscal-integrado-des',
  ADGN11: 'financiacion-y-planificacion-financiera-nuevas-herramientas-de-financiacion-des',
  ADGD177PO: 'liderazgo-estrategico-des',
  ADGD352PO: 'transformacion-digital-en-la-empresa-des',
  ADGD078PO: 'liderazgo-y-direccion-de-organizaciones-des',
  ADGD65: 'digitalizacion-de-nominas-en-la-empresa-des',
  ADGD0032: 'gestion-contable-fiscal-y-laboral-des',
  IFCD107: 'especialista-en-inteligencia-artificial-des',
  ADGG24: 'gestion-informatizada-de-ventas-con-programa-de-gestion-integrado-des',
  IFCD60: 'comunicacion-e-interaccion-social-en-entornos-tic-des',
  ADGD068PO: 'direccion-de-personas-y-desarrollo-del-talento-des',
  IFCT117: 'introduccion-a-la-inteligencia-artificial-des',
  IFCD0038: 'diseno-de-paginas-web-para-hosteleria-des',
  ADGG06: 'digitalizacion-y-rrss-como-estrategia-corporativa-des',
  ADGD0046: 'contabilidad-informatizada-des',
  IFCD49: 'tratamiento-de-imagenes-para-web-y-movil-des',
  SSCE05: 'ingles-c1-des',
}

const FORCED_AREA_BY_OFFICIAL_CODE: Record<string, AreaCode> = {
  IFCD107: 'TDD',
  IFCT117: 'TDD',
  IFCD0038: 'TDD',
  IFCD49: 'TDD',
  IFCD60: 'TDD',
  ADGD352PO: 'TDD',
  ADGD65: 'TDD',
  ADGG06: 'TDD',
  SSCE05: 'IDIO',
}

function ensureDir(dir: string): void {
  mkdirSync(dir, { recursive: true })
}

function sha256(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

function readPdfText(pdfPath: string): string {
  return execFileSync('pdftotext', ['-layout', pdfPath, '-'], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  })
}

function compact(value: string | null | undefined): string | null {
  if (!value) return null
  return value.replace(/\s+/g, ' ').trim() || null
}

function sqlString(value: string | null | undefined): string {
  if (value == null || value === '') return 'NULL'
  return `'${value.replace(/'/g, "''")}'`
}

function sqlJson(value: unknown | null | undefined): string {
  if (value == null) return 'NULL'
  return `${sqlString(JSON.stringify(value))}::jsonb`
}

function courseTypeSuffix(courseType: CourseType): string {
  if (courseType === 'ocupados') return 'OCUP'
  if (courseType === 'teleformacion') return 'TELE'
  if (courseType === 'ciclo_medio') return 'CMED'
  if (courseType === 'ciclo_superior') return 'CSUP'
  if (courseType === 'privado') return 'PRIV'
  return 'DESE'
}

function areaFromTitle(title: string, officialCode: string | null): AreaCode {
  if (officialCode && FORCED_AREA_BY_OFFICIAL_CODE[officialCode]) return FORCED_AREA_BY_OFFICIAL_CODE[officialCode]
  if (/nutricosm[eé]tica/i.test(title)) return 'SBD'
  const classified = classifyAreaCode(title).areaCode
  if (classified === 'SCLN' || classified === 'VETA' || classified === 'SBD' || classified === 'TDD' || classified === 'EAG' || classified === 'SVP') {
    return classified
  }
  return 'EAG'
}

function inferModality(modalityText: string | null): NormalizedCourseContent['modality'] {
  const text = (modalityText ?? '').toLowerCase()
  if (text.includes('teleformaci') || text.includes('online')) return 'online'
  if (text.includes('mixta') || text.includes('hibrid')) return 'hibrido'
  return 'presencial'
}

function firstSentences(text: string | null, max = 420): string | null {
  if (!text) return null
  const clean = compact(text)
  if (!clean) return null
  if (clean.length <= max) return clean
  return `${clean.slice(0, max).replace(/\s+\S*$/, '')}.`
}

function extractFallbackTitle(text: string, pdfFilename: string): string | null {
  const certificateTitle = text.match(/\(([A-Z]{4}\d{2,4})\)\s*([^\n\r]+)/i)?.[2]
  if (certificateTitle) return compact(certificateTitle)
  const specialtyTitle = text.match(/PROGRAMA DE LA ESPECIALIDAD FORMATIVA:\s*([^\n\r]+)/i)?.[1]
  if (specialtyTitle) return compact(specialtyTitle)
  return compact(pdfFilename.replace(/\.pdf$/i, '').replace(/^[A-Z0-9]+\s*[-.]?\s*/i, ''))
}

function extractFallbackObjective(text: string): string | null {
  const competence = text.match(/COMPETENCIA GENERAL:\s*([\s\S]*?)(?:\n\s*Cualificaci[oó]n profesional|\n\s*Nivel\s+Unidades|\n\s*Correspondencia)/i)?.[1]
  if (competence) return compact(competence)

  const objective = text.match(/Objetivo General:\s*([\s\S]*?)(?:\n\s*5\.|\n\s*6\.|\n\s*Duraci[oó]n|\n\s*Requisitos)/i)?.[1]
  return compact(objective)
}

function extractFallbackDuration(text: string): number | null {
  const candidates = [
    text.match(/Duraci[oó]n horas totales certificado profesional\.\s*(\d{2,4})/i)?.[1],
    text.match(/Horas totales:\s*(\d{2,4})/i)?.[1],
    text.match(/Duraci[oó]n total:\s*(\d{2,4})/i)?.[1],
  ]
  for (const value of candidates) {
    if (!value) continue
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return null
}

function extractFallbackModules(text: string): Array<{ title: string; hours: number | null }> {
  const moduleLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const modules: Array<{ title: string; hours: number | null }> = []
  for (const line of moduleLines) {
    const mf = line.match(/^(MF\d+_\d+:\s*.+?)\s{2,}.*?(\d{2,4})$/i)
    if (mf?.[1]) {
      modules.push({ title: normalizeProgramTitle(mf[1]), hours: mf[2] ? Number.parseInt(mf[2], 10) : null })
      continue
    }

    const numbered = line.match(/^(\d+(?:\.\d+)?\.\s+[A-ZÁÉÍÓÚÑ][^:]{8,120})$/)
    if (numbered?.[1]) {
      modules.push({ title: normalizeProgramTitle(numbered[1]), hours: null })
    }
  }

  return modules.slice(0, 16)
}

function textFilenameFor(pdfFilename: string): string {
  return `${pdfFilename.replace(/\.pdf$/i, '')}.txt`
}

function longText(lines: string[]): unknown {
  return courseProgramRichText(lines.filter((line) => compact(line) != null))
}

function normalizeProgramTitle(title: string): string {
  return title.replace(/^[-•\s]+/, '').replace(/\s+/g, ' ').trim()
}

function privateEntryToContent(entry: CourseProgramEntry): NormalizedCourseContent {
  const sourcePath = path.join(CEP_PROGRAM_ROOT, 'originals', entry.pdfFilename)
  const textPath = path.join(CEP_PROGRAM_ROOT, 'text', entry.textFilename)
  const title = entry.courseName
  const areaCode = areaFromTitle(title, null)
  const objectives = entry.longDescriptionLines.slice(0, 3)
  const programItems = entry.longDescriptionLines
    .filter((line) => /contenido detectado|modulo|incluye|trabaja|organizacion detectada/i.test(line))
    .map((line) => line.replace(/^Contenido detectado:\s*/i, '').trim())

  return {
    sourceKind: 'cep-private-program',
    sourcePath,
    sourceHash: existsSync(sourcePath) ? sha256(sourcePath) : 'missing',
    sourceTextPath: existsSync(textPath) ? textPath : null,
    pdfFilename: entry.pdfFilename,
    title,
    slug: entry.courseSlug,
    officialCode: null,
    courseType:
      entry.courseType === 'teleformacion' || entry.courseType === 'ciclo_medio' || entry.courseType === 'ciclo_superior'
        ? entry.courseType
        : 'privado',
    areaCode,
    modality: entry.modality,
    durationHours: entry.durationHours,
    shortDescription: entry.shortDescription,
    longDescription: longText([
      ...entry.longDescriptionLines,
      ...(entry.notes?.length ? ['Notas de extracción:', ...entry.notes] : []),
    ]),
    objectives,
    programBlocks: [
      {
        title: 'Programa formativo',
        body: entry.shortDescription,
        items: programItems.length > 0 ? programItems : entry.longDescriptionLines.slice(0, 5),
      },
    ],
    requirements: entry.modality === 'online' ? 'Consultar requisitos técnicos y de acceso al campus virtual.' : 'Consultar requisitos de acceso con CEP Formación.',
    outcomes: entry.longDescriptionLines.find((line) => /trabajar|salidas|prepara/i.test(line)) ?? null,
    status: existsSync(sourcePath) ? 'ready' : 'skipped',
    notes: entry.notes ?? [],
  }
}

function officialPdfToContent(pdfPath: string): NormalizedCourseContent {
  const pdfFilename = path.basename(pdfPath)
  const hash = sha256(pdfPath)
  const text = readPdfText(pdfPath)
  const parsed = parsePdfExtractedText(text)
  const fallbackObjective = extractFallbackObjective(text)
  const objectiveSource = parsed.objective ?? fallbackObjective
  const moduleSource = parsed.modules.length > 0 ? parsed.modules : extractFallbackModules(text)
  const durationSource = parsed.durationHours ?? extractFallbackDuration(text)
  const officialCode =
    parsed.specialtyCode ??
    pdfFilename.match(/\b([A-Z]{4}\d{2,4}PO?|[A-Z]{4}\d{2,4})\b/i)?.[1]?.toUpperCase() ??
    null
  const isPoster = /cartel publicitario/i.test(pdfFilename)
  const title =
    compact(parsed.specialtyName) ??
    extractFallbackTitle(text, pdfFilename) ??
    pdfFilename
  const areaCode = areaFromTitle(title, officialCode)
  const slug =
    (officialCode && FORCED_SLUG_BY_OFFICIAL_CODE[officialCode]) ??
    `${buildSlugBase(title)}-des`

  const generatedTextFilename = textFilenameFor(pdfFilename)
  const generatedTextPath = path.join(GENERATED_TEXT_DIR, generatedTextFilename)
  writeFileSync(generatedTextPath, text)

  const moduleItems = moduleSource.map((module) =>
    module.hours ? `${normalizeProgramTitle(module.title)} (${module.hours} h)` : normalizeProgramTitle(module.title),
  )
  const requirements = firstSentences(parsed.requirements, 900)
  const objective = firstSentences(objectiveSource, 900)

  return {
    sourceKind: isPoster ? 'advertising-poster' : 'official-specialty-pdf',
    sourcePath: pdfPath,
    sourceHash: hash,
    sourceTextPath: generatedTextPath,
    pdfFilename,
    title,
    slug,
    officialCode,
    courseType: 'desempleados',
    areaCode,
    modality: inferModality(parsed.modalityText),
    durationHours: durationSource,
    shortDescription: firstSentences(objectiveSource),
    longDescription: isPoster
      ? null
      : longText([
          parsed.specialtyName ? `Especialidad: ${parsed.specialtyName}` : '',
          officialCode ? `Codigo oficial: ${officialCode}` : '',
          objective ? `Objetivo general: ${objective}` : '',
          moduleItems.length > 0 ? `Modulos formativos: ${moduleItems.join('; ')}` : '',
          requirements ? `Requisitos de acceso: ${requirements}` : '',
        ]),
    objectives: objective ? [objective] : [],
    programBlocks: moduleItems.length > 0 ? [{ title: 'Módulos formativos', body: null, items: moduleItems }] : [],
    requirements,
    outcomes: objective,
    status: isPoster || (!objectiveSource && moduleSource.length === 0) ? 'skipped' : 'ready',
    notes: [
      isPoster ? 'Cartel publicitario: indexado como fuente, no usado para poblar ficha de curso.' : '',
      parsed.specialtyName ? '' : 'No se detectó denominación de especialidad en el PDF.',
      objectiveSource ? '' : 'No se detectó objetivo general en el PDF.',
    ].filter(Boolean),
  }
}

function dedupeByHash(items: NormalizedCourseContent[]): NormalizedCourseContent[] {
  const seen = new Map<string, NormalizedCourseContent>()
  for (const item of items) {
    const key = item.sourceHash
    if (!seen.has(key)) {
      seen.set(key, item)
      continue
    }
    const existing = seen.get(key)!
    existing.notes.push(`Duplicado omitido por hash: ${item.pdfFilename}`)
  }
  return [...seen.values()]
}

function buildCourseSql(item: NormalizedCourseContent): string {
  const codigo =
    item.officialCode ? `SEPE-${item.officialCode}-${courseTypeSuffix(item.courseType)}` : `${item.areaCode}-${courseTypeSuffix(item.courseType)}-${item.slug}`

  return `
-- ${item.title} :: ${item.pdfFilename}
WITH area AS (
  SELECT id FROM areas_formativas WHERE codigo = ${sqlString(item.areaCode)} LIMIT 1
),
upsert_course AS (
  INSERT INTO courses (
    codigo, slug, name, short_description, long_description, modality, course_type,
    area_formativa_id, duration_hours, active, featured, tenant_id, operational_status,
    landing_enabled, landing_target_audience, landing_access_requirements, landing_outcomes,
    meta_title, meta_description, updated_at, created_at
  )
  SELECT
    ${sqlString(codigo)}, ${sqlString(item.slug)}, ${sqlString(item.title)}, ${sqlString(item.shortDescription)},
    ${sqlJson(item.longDescription)}, ${sqlString(item.modality)}::enum_courses_modality,
    ${sqlString(item.courseType)}::enum_courses_course_type, area.id, ${item.durationHours == null ? 'NULL' : item.durationHours},
    true, false, 1, 'active'::enum_courses_operational_status,
    true, ${sqlString(item.courseType === 'privado' ? 'Personas interesadas en formación profesionalizante del área.' : 'Personas que cumplen los requisitos de acceso de la convocatoria formativa.')},
    ${sqlString(item.requirements)}, ${sqlString(item.outcomes)},
    ${sqlString(`${item.title} | CEP Formación`)}, ${sqlString(item.shortDescription)}, now(), now()
  FROM area
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    short_description = COALESCE(EXCLUDED.short_description, courses.short_description),
    long_description = COALESCE(EXCLUDED.long_description, courses.long_description),
    modality = EXCLUDED.modality,
    course_type = COALESCE(EXCLUDED.course_type, courses.course_type),
    area_formativa_id = COALESCE(EXCLUDED.area_formativa_id, courses.area_formativa_id),
    duration_hours = COALESCE(EXCLUDED.duration_hours, courses.duration_hours),
    operational_status = 'active'::enum_courses_operational_status,
    landing_enabled = true,
    landing_target_audience = COALESCE(EXCLUDED.landing_target_audience, courses.landing_target_audience),
    landing_access_requirements = COALESCE(EXCLUDED.landing_access_requirements, courses.landing_access_requirements),
    landing_outcomes = COALESCE(EXCLUDED.landing_outcomes, courses.landing_outcomes),
    meta_title = COALESCE(EXCLUDED.meta_title, courses.meta_title),
    meta_description = COALESCE(EXCLUDED.meta_description, courses.meta_description),
    updated_at = now()
  RETURNING id
),
target AS (
  SELECT id FROM upsert_course
  UNION ALL
  SELECT id FROM courses WHERE slug = ${sqlString(item.slug)} AND NOT EXISTS (SELECT 1 FROM upsert_course)
  LIMIT 1
),
clean_objectives AS (
  DELETE FROM courses_landing_objectives WHERE _parent_id IN (SELECT id FROM target)
),
clean_items AS (
  DELETE FROM courses_landing_program_blocks_items
  WHERE _parent_id IN (SELECT id FROM courses_landing_program_blocks WHERE _parent_id IN (SELECT id FROM target))
),
clean_blocks AS (
  DELETE FROM courses_landing_program_blocks WHERE _parent_id IN (SELECT id FROM target)
),
clean_faqs AS (
  DELETE FROM courses_landing_faqs WHERE _parent_id IN (SELECT id FROM target)
)
SELECT id AS course_id FROM target;
${item.objectives
  .map((objective, index) => `INSERT INTO courses_landing_objectives (_order, _parent_id, path, text)
SELECT ${index + 1}, id, 'landing_objectives', ${sqlString(objective)} FROM courses WHERE slug = ${sqlString(item.slug)};`)
  .join('\n')}
${item.programBlocks
  .map((block, blockIndex) => {
    const blockSql = `WITH block AS (
  INSERT INTO courses_landing_program_blocks (_order, _parent_id, path, title, body)
  SELECT ${blockIndex + 1}, id, 'landing_program_blocks', ${sqlString(block.title)}, ${sqlString(block.body)}
  FROM courses WHERE slug = ${sqlString(item.slug)}
  RETURNING id
)
INSERT INTO courses_landing_program_blocks_items (_order, _parent_id, path, text)
SELECT source.item_order, block.id, 'items', source.item_text
FROM block
CROSS JOIN (VALUES
${block.items.map((blockItem, itemIndex) => `  (${itemIndex + 1}, ${sqlString(blockItem)})`).join(',\n')}
) AS source(item_order, item_text);`
    return blockSql
  })
  .join('\n')}
INSERT INTO courses_landing_faqs (_order, _parent_id, path, question, answer)
SELECT 1, id, 'landing_faqs', '¿Dónde se guarda la información de esta convocatoria?', 'La ficha del curso es la fuente canónica y las convocatorias publicadas reutilizan estos datos.' FROM courses WHERE slug = ${sqlString(item.slug)};
`
}

function buildSql(items: NormalizedCourseContent[]): string {
  const ready = items.filter((item) => item.status === 'ready')
  return `-- Generated by apps/tenant-admin/scripts/generate-cep-course-content-import.ts
-- Source: CEP course PDFs and user-provided Downloads PDFs on 2026-07-08.
-- Scope: canonical course ficha fields + landing blocks. Convocatorias inherit from courses.

BEGIN;

${ready.map(buildCourseSql).join('\n')}

COMMIT;
`
}

function main(): void {
  ensureDir(GENERATED_ROOT)
  ensureDir(GENERATED_TEXT_DIR)

  const privateItems = CEP_COURSE_PROGRAM_ENTRIES.map(privateEntryToContent)
  const downloadItems = DOWNLOAD_PDFS
    .map((filename) => path.join(DOWNLOADS_DIR, filename))
    .filter((filePath) => existsSync(filePath))
    .map(officialPdfToContent)
  const missingDownloads = DOWNLOAD_PDFS
    .map((filename) => path.join(DOWNLOADS_DIR, filename))
    .filter((filePath) => !existsSync(filePath))

  const items = dedupeByHash([...privateItems, ...downloadItems])
  const manifest = {
    generatedAt: new Date().toISOString(),
    stats: {
      totalSources: privateItems.length + downloadItems.length,
      dedupedSources: items.length,
      ready: items.filter((item) => item.status === 'ready').length,
      skipped: items.filter((item) => item.status === 'skipped').length,
      missingDownloads,
    },
    items: items.map((item) => ({
      sourceKind: item.sourceKind,
      pdfFilename: item.pdfFilename,
      sourcePath: item.sourcePath,
      sourceHash: item.sourceHash,
      textPath: item.sourceTextPath,
      title: item.title,
      slug: item.slug,
      officialCode: item.officialCode,
      courseType: item.courseType,
      areaCode: item.areaCode,
      modality: item.modality,
      durationHours: item.durationHours,
      hasShortDescription: Boolean(item.shortDescription),
      objectives: item.objectives.length,
      programBlocks: item.programBlocks.length,
      status: item.status,
      notes: item.notes,
    })),
  }

  writeFileSync(path.join(GENERATED_ROOT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  writeFileSync(path.join(GENERATED_ROOT, 'import-course-content.sql'), buildSql(items))

  const reportRows = [
    '# CEP Course Content Import Report',
    '',
    `Generated at: ${manifest.generatedAt}`,
    '',
    `- Total sources: ${manifest.stats.totalSources}`,
    `- Deduped sources: ${manifest.stats.dedupedSources}`,
    `- Ready for import: ${manifest.stats.ready}`,
    `- Skipped/non-course sources: ${manifest.stats.skipped}`,
    '',
    '| Status | Kind | Code | Course | Slug | Area | Hours | Notes |',
    '|---|---|---:|---|---|---|---:|---|',
    ...items.map((item) =>
      `| ${item.status} | ${item.sourceKind} | ${item.officialCode ?? ''} | ${item.title.replace(/\|/g, '/')} | ${item.slug} | ${item.areaCode} | ${item.durationHours ?? ''} | ${item.notes.join('; ').replace(/\|/g, '/')} |`,
    ),
    '',
  ]
  writeFileSync(path.join(GENERATED_ROOT, 'REPORT.md'), reportRows.join('\n'))

  console.log(JSON.stringify(manifest.stats, null, 2))
}

main()
