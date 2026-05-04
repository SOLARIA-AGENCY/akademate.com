import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'

import config from '../src/payload.config'
import {
  CEP_COURSE_PROGRAM_ENTRIES,
  CEP_DEPRECATED_COURSE_SLUGS,
  courseProgramRichText,
  type CourseProgramEntry,
} from './cep-course-programs-data'

type Options = {
  tenantId: number
  apply: boolean
  replaceCourseFields: boolean
  json: boolean
}

type PayloadClient = Awaited<ReturnType<typeof getPayload>>

type ScriptUser = {
  id: number | string
  role: string
  tenant?: number | string
  collection: 'users'
}

type ResultAction = {
  courseSlug: string
  pdfFilename: string
  status: 'would-update' | 'updated' | 'created' | 'skip' | 'conflict' | 'error'
  courseId?: number | string
  mediaId?: number | string
  materialId?: number | string
  changedFields: string[]
  reason?: string
}

type CleanupAction = {
  courseSlug: string
  status: 'would-deactivate' | 'deactivated' | 'skip' | 'error'
  courseId?: number | string
  changedFields: string[]
  reason?: string
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '../../..')
const PROGRAMS_DIR = path.resolve(REPO_ROOT, 'docs/course-programs/cep')
const PDF_DIR = path.join(PROGRAMS_DIR, 'originals')

const TYPE_CODE: Record<NonNullable<CourseProgramEntry['courseType']>, string> = {
  privado: 'PRIV',
  ocupados: 'OCUP',
  desempleados: 'DESE',
  teleformacion: 'TELE',
  ciclo_medio: 'CMED',
  ciclo_superior: 'CSUP',
}

function inferAreaCode(entry: CourseProgramEntry): NonNullable<CourseProgramEntry['areaCode']> {
  const text = `${entry.courseName} ${entry.courseSlug}`.toLowerCase()
  if (/(veterin|canin|felin|animal|adiestramiento|atv|acv)/.test(text)) return 'VETA'
  if (/(farmacia|odont|bucodental|enfermer|clinicas-esteticas|clinicas esteticas|unycop|funerario)/.test(text)) return 'SCLN'
  if (/(dietetica|nutric|pilates|yoga|quiromasaje|entrenamiento|nutricosmetica)/.test(text)) return 'SBD'
  return 'EAG'
}

function inferCourseType(entry: CourseProgramEntry): NonNullable<CourseProgramEntry['courseType']> {
  if (entry.courseType) return entry.courseType
  if (entry.modality === 'online') return 'teleformacion'
  return 'privado'
}

function parseArgs(argv: string[]): Options {
  const options: Options = {
    tenantId: 1,
    apply: false,
    replaceCourseFields: false,
    json: false,
  }

  for (const arg of argv) {
    if (arg === '--apply') options.apply = true
    if (arg === '--replace-course-fields') options.replaceCourseFields = true
    if (arg === '--json') options.json = true
    if (arg.startsWith('--tenant-id=')) options.tenantId = Number(arg.slice('--tenant-id='.length))
  }

  return options
}

function assertDatabaseConfig(): void {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL)
  const hasDatabaseParts = Boolean(
    process.env.DATABASE_USER &&
      process.env.DATABASE_PASSWORD &&
      process.env.DATABASE_HOST &&
      process.env.DATABASE_PORT &&
      process.env.DATABASE_NAME,
  )

  if (!hasDatabaseUrl && !hasDatabaseParts) {
    throw new Error('Missing database config. Set DATABASE_URL or DATABASE_USER/PASSWORD/HOST/PORT/NAME before running this importer.')
  }
}

function mimeTypeFromPath(filePath: string): string {
  if (filePath.toLowerCase().endsWith('.pdf')) return 'application/pdf'
  return 'application/octet-stream'
}

function relationId(value: unknown): string | number | null {
  if (typeof value === 'string' || typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: string | number }).id
    return typeof id === 'string' || typeof id === 'number' ? id : null
  }
  return null
}

function tenantWhere(tenantId: number) {
  return { tenant: { equals: tenantId } }
}

async function findScriptUser(_payload: PayloadClient, tenantId: number): Promise<ScriptUser> {
  return { id: 0, role: 'admin', tenant: tenantId, collection: 'users' }
}

async function findCourse(payload: PayloadClient, entry: CourseProgramEntry, tenantId: number) {
  const result = await payload.find({
    collection: 'courses',
    where: {
      and: [
        { slug: { equals: entry.courseSlug } },
        tenantWhere(tenantId),
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return result.docs[0] as Record<string, unknown> | undefined
}

async function findCourseBySlug(payload: PayloadClient, slug: string, tenantId: number) {
  const result = await payload.find({
    collection: 'courses',
    where: {
      and: [
        { slug: { equals: slug } },
        tenantWhere(tenantId),
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return result.docs[0] as Record<string, unknown> | undefined
}

function parseCodigoSequence(codigo: string): { prefix: string; sequence: number } | null {
  const match = /^([A-Z]{3,4}-[A-Z]{4})-(\d{4})$/.exec(codigo)
  if (!match?.[1] || !match[2]) return null
  return { prefix: match[1], sequence: Number.parseInt(match[2], 10) }
}

function nextCodigo(prefix: string, existingCodes: Set<string>, maxByPrefix: Map<string, number>): string {
  let next = (maxByPrefix.get(prefix) ?? 0) + 1
  let candidate = `${prefix}-${String(next).padStart(4, '0')}`
  while (existingCodes.has(candidate)) {
    next += 1
    candidate = `${prefix}-${String(next).padStart(4, '0')}`
  }
  existingCodes.add(candidate)
  maxByPrefix.set(prefix, next)
  return candidate
}

async function fetchAll(payload: PayloadClient, collection: string, where?: Record<string, unknown>) {
  const docs: Record<string, unknown>[] = []
  let page = 1
  while (true) {
    const result = await payload.find({
      collection,
      where,
      page,
      limit: 100,
      depth: 0,
      overrideAccess: true,
    })
    docs.push(...(result.docs as Record<string, unknown>[]))
    if (!result.totalPages || page >= result.totalPages) break
    page += 1
  }
  return docs
}

async function buildCodeRegistry(payload: PayloadClient) {
  const courses = await fetchAll(payload, 'courses')
  const existingCodes = new Set<string>()
  const maxByPrefix = new Map<string, number>()
  for (const course of courses) {
    const codigo = typeof course.codigo === 'string' ? course.codigo.trim() : ''
    if (!codigo) continue
    existingCodes.add(codigo)
    const parsed = parseCodigoSequence(codigo)
    if (!parsed) continue
    maxByPrefix.set(parsed.prefix, Math.max(maxByPrefix.get(parsed.prefix) ?? 0, parsed.sequence))
  }
  return { existingCodes, maxByPrefix }
}

async function findAreaId(payload: PayloadClient, areaCode: NonNullable<CourseProgramEntry['areaCode']>) {
  const areas = await payload.find({
    collection: 'areas-formativas',
    where: { codigo: { equals: areaCode } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const area = areas.docs[0] as { id?: number | string } | undefined
  return area?.id ?? null
}

async function createCourseIfMissing(
  payload: PayloadClient,
  entry: CourseProgramEntry,
  options: Options,
  scriptUser: ScriptUser,
): Promise<{ course: Record<string, unknown> | null; fields: string[]; created: boolean; reason?: string }> {
  const existing = await findCourse(payload, entry, options.tenantId)
  if (existing?.id) return { course: existing, fields: [], created: false }

  const courseType = inferCourseType(entry)
  const areaCode = entry.areaCode ?? inferAreaCode(entry)

  const areaId = await findAreaId(payload, areaCode)
  if (!areaId) {
    return { course: null, fields: [], created: false, reason: `Area ${areaCode} not found.` }
  }

  const { existingCodes, maxByPrefix } = await buildCodeRegistry(payload)
  const codigo = nextCodigo(`${areaCode}-${TYPE_CODE[courseType]}`, existingCodes, maxByPrefix)
  const createData: Record<string, unknown> = {
    name: entry.courseName,
    slug: entry.courseSlug,
    codigo,
    course_type: courseType,
    area_formativa: areaId,
    tenant: options.tenantId,
    modality: entry.modality,
    active: true,
    featured: false,
    short_description: entry.shortDescription,
    long_description: courseProgramRichText([
      ...entry.longDescriptionLines,
      ...(entry.notes?.length ? ['Notas de extraccion:', ...entry.notes.map((note) => `- ${note}`)] : []),
    ]),
    operational_status: 'active',
  }
  if (entry.durationHours != null) createData.duration_hours = entry.durationHours

  const fields = ['courses.create', 'courses.codigo', 'courses.area_formativa', 'courses.course_type']
  if (!options.apply) {
    return {
      course: { id: `dry-run:${entry.courseSlug}`, ...createData },
      fields,
      created: false,
    }
  }

  const created = await payload.create({
    collection: 'courses',
    data: createData,
    overrideAccess: true,
    depth: 0,
  })
  return { course: created as Record<string, unknown>, fields, created: true }
}

async function ensureMediaFromPdf(
  payload: PayloadClient,
  entry: CourseProgramEntry,
  scriptUser: ScriptUser,
  apply: boolean,
): Promise<{ id: number | string | null; changed: boolean }> {
  const filePath = path.join(PDF_DIR, entry.pdfFilename)
  if (!existsSync(filePath)) {
    throw new Error(`PDF not found: ${filePath}`)
  }

  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: entry.pdfFilename } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (existing.docs[0]) {
    return { id: (existing.docs[0] as { id: number | string }).id, changed: false }
  }

  if (!apply) return { id: null, changed: true }

  const binary = readFileSync(filePath)
  const created = await payload.create({
    collection: 'media',
    data: {
      alt: entry.materialTitle,
      caption: `Programa PDF CEP: ${entry.courseName}`,
      folder: 'courses/cep-programs',
    },
    file: {
      data: binary,
      mimetype: mimeTypeFromPath(filePath),
      name: entry.pdfFilename,
      size: binary.byteLength,
    },
    overrideAccess: true,
    depth: 0,
  })

  return { id: (created as { id: number | string }).id, changed: true }
}

async function ensureMaterial(
  payload: PayloadClient,
  entry: CourseProgramEntry,
  courseId: number | string,
  mediaId: number | string | null,
  scriptUser: ScriptUser,
  apply: boolean,
) {
  const existing = await payload.find({
    collection: 'materials',
    where: {
      and: [
        { title: { equals: entry.materialTitle } },
        { course: { equals: courseId } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (existing.docs[0]) {
    const doc = existing.docs[0] as Record<string, unknown>
    const existingFileId = relationId(doc.file)
    const needsFile = mediaId != null && existingFileId == null
    const needsPublish = doc.is_published !== true

    if (!needsFile && !needsPublish) {
      return { id: doc.id as number | string, changed: false, fields: [] as string[] }
    }

    if (apply) {
      await payload.update({
        collection: 'materials',
        id: doc.id as number | string,
        data: {
          ...(needsFile ? { file: mediaId } : {}),
          ...(needsPublish ? { is_published: true } : {}),
        },
        overrideAccess: true,
        depth: 0,
      })
    }

    return {
      id: doc.id as number | string,
      changed: true,
      fields: [needsFile ? 'materials.file' : null, needsPublish ? 'materials.is_published' : null].filter(Boolean) as string[],
    }
  }

  if (!apply) return { id: null, changed: true, fields: ['materials.create'] }

  const created = await payload.create({
    collection: 'materials',
    data: {
      title: entry.materialTitle,
      description: entry.shortDescription,
      material_type: 'pdf',
      course: courseId,
      file: mediaId,
      order: 0,
      is_published: true,
      is_downloadable: true,
    },
    overrideAccess: true,
    depth: 0,
  })

  return { id: (created as { id: number | string }).id, changed: true, fields: ['materials.create'] }
}

function buildCourseUpdate(entry: CourseProgramEntry, course: Record<string, unknown>, replaceCourseFields: boolean) {
  const data: Record<string, unknown> = {}
  const changedFields: string[] = []

  const desiredLongDescription = courseProgramRichText([
    ...entry.longDescriptionLines,
    ...(entry.notes?.length ? ['Notas de extraccion:', ...entry.notes.map((note) => `- ${note}`)] : []),
  ])

  const fieldRules: Array<[string, unknown]> = [
    ['short_description', entry.shortDescription],
    ['long_description', desiredLongDescription],
    ['modality', entry.modality],
  ]

  if (entry.durationHours != null) {
    fieldRules.push(['duration_hours', entry.durationHours])
  }

  for (const [field, value] of fieldRules) {
    const current = course[field]
    const isEmpty = current == null || current === '' || (Array.isArray(current) && current.length === 0)
    if (replaceCourseFields || isEmpty) {
      data[field] = value
      changedFields.push(`courses.${field}`)
    }
  }

  return { data, changedFields }
}

async function processEntry(
  payload: PayloadClient,
  entry: CourseProgramEntry,
  options: Options,
  scriptUser: ScriptUser,
): Promise<ResultAction> {
  try {
    const courseResult = await createCourseIfMissing(payload, entry, options, scriptUser)
    const course = courseResult.course
    if (!course?.id) {
      return {
        courseSlug: entry.courseSlug,
        pdfFilename: entry.pdfFilename,
        status: 'conflict',
        changedFields: [],
        reason: courseResult.reason ?? 'Course not found for slug and tenant.',
      }
    }

    const courseId = course.id as number | string
    if (!options.apply && String(courseId).startsWith('dry-run:')) {
      return {
        courseSlug: entry.courseSlug,
        pdfFilename: entry.pdfFilename,
        status: 'would-update',
        courseId,
        changedFields: [...courseResult.fields, 'media.create', 'materials.create'],
      }
    }

    const media = await ensureMediaFromPdf(payload, entry, scriptUser, options.apply)
    const material = await ensureMaterial(payload, entry, courseId, media.id, scriptUser, options.apply)
    const courseUpdate = courseResult.created
      ? { data: {}, changedFields: [] as string[] }
      : buildCourseUpdate(entry, course, options.replaceCourseFields)

    if (options.apply && courseUpdate.changedFields.length > 0) {
      await payload.update({
        collection: 'courses',
        id: courseId,
        data: courseUpdate.data,
        overrideAccess: true,
        depth: 0,
      })
    }

    const changedFields = [
      ...courseResult.fields,
      ...(media.changed ? ['media.create'] : []),
      ...material.fields,
      ...courseUpdate.changedFields,
    ]

    return {
      courseSlug: entry.courseSlug,
      pdfFilename: entry.pdfFilename,
      status: courseResult.created ? 'created' : changedFields.length > 0 ? (options.apply ? 'updated' : 'would-update') : 'skip',
      courseId,
      mediaId: media.id ?? undefined,
      materialId: material.id ?? undefined,
      changedFields,
    }
  } catch (error) {
    return {
      courseSlug: entry.courseSlug,
      pdfFilename: entry.pdfFilename,
      status: 'error',
      changedFields: [],
      reason: error instanceof Error ? error.message : String(error),
    }
  }
}

async function deactivateDeprecatedCourse(
  payload: PayloadClient,
  slug: string,
  options: Options,
  scriptUser: ScriptUser,
): Promise<CleanupAction> {
  try {
    const course = await findCourseBySlug(payload, slug, options.tenantId)
    if (!course?.id) {
      return { courseSlug: slug, status: 'skip', changedFields: [], reason: 'Deprecated course not found.' }
    }

    const updateData: Record<string, unknown> = {}
    const changedFields: string[] = []
    if (course.active !== false) {
      updateData.active = false
      changedFields.push('courses.active')
    }
    if (course.operational_status !== 'inactive') {
      updateData.operational_status = 'inactive'
      changedFields.push('courses.operational_status')
    }

    if (changedFields.length === 0) {
      return { courseSlug: slug, status: 'skip', courseId: course.id as number | string, changedFields: [] }
    }

    if (options.apply) {
      await payload.update({
        collection: 'courses',
        id: course.id as number | string,
        data: updateData,
        overrideAccess: true,
        depth: 0,
      })
    }

    return {
      courseSlug: slug,
      status: options.apply ? 'deactivated' : 'would-deactivate',
      courseId: course.id as number | string,
      changedFields,
    }
  } catch (error) {
    return {
      courseSlug: slug,
      status: 'error',
      changedFields: [],
      reason: error instanceof Error ? error.message : String(error),
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  assertDatabaseConfig()

  const payload = await getPayload({ config })
  const scriptUser = await findScriptUser(payload, options.tenantId)
  const results: ResultAction[] = []
  const cleanup: CleanupAction[] = []

  for (const entry of CEP_COURSE_PROGRAM_ENTRIES) {
    results.push(await processEntry(payload, entry, options, scriptUser))
  }
  for (const slug of CEP_DEPRECATED_COURSE_SLUGS) {
    cleanup.push(await deactivateDeprecatedCourse(payload, slug, options, scriptUser))
  }

  const summary = {
    mode: options.apply ? 'apply' : 'dry-run',
    replaceCourseFields: options.replaceCourseFields,
    tenantId: options.tenantId,
    total: results.length,
    created: results.filter((result) => result.status === 'created').length,
    updated: results.filter((result) => result.status === 'updated').length,
    wouldUpdate: results.filter((result) => result.status === 'would-update').length,
    skipped: results.filter((result) => result.status === 'skip').length,
    conflicts: results.filter((result) => result.status === 'conflict').length,
    errors: results.filter((result) => result.status === 'error').length,
    cleanup,
    results,
  }

  if (options.json) {
    console.log(JSON.stringify(summary, null, 2))
    return
  }

  console.log(`CEP course programs import (${summary.mode})`)
  console.log(`Total: ${summary.total}`)
  console.log(`Created: ${summary.created}`)
  console.log(`Updated: ${summary.updated}`)
  console.log(`Would update: ${summary.wouldUpdate}`)
  console.log(`Skipped: ${summary.skipped}`)
  console.log(`Conflicts: ${summary.conflicts}`)
  console.log(`Errors: ${summary.errors}`)
  for (const result of cleanup) {
    console.log(`${result.status.padEnd(12)} ${result.courseSlug} :: ${result.changedFields.join(', ') || result.reason || 'no changes'}`)
  }
  for (const result of results) {
    console.log(`${result.status.padEnd(12)} ${result.courseSlug} :: ${result.changedFields.join(', ') || result.reason || 'no changes'}`)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
