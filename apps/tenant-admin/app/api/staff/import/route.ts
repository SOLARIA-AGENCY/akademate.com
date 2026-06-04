import { readFile } from 'node:fs/promises'
import { NextResponse, type NextRequest } from 'next/server'
import { getPayload, type Payload, type SanitizedConfig } from 'payload'
import * as XLSX from 'xlsx'
import configPromise from '@payload-config'

type EmploymentStatus = 'active' | 'temporary_leave' | 'inactive'
type ContractType = 'full_time' | 'part_time' | 'freelance'
type ImportReviewStatus = 'validated' | 'pending_review' | 'ambiguous' | 'retired_candidate'

const DEFAULT_XLSX_PATH = '/Users/carlosjperez/Downloads/CEP_FORMACION_PERSONAL_DEFINITIVO_ACTUALIZADO_CURSOS.xlsx'

interface ExcelPersonRow {
  NOMBRE?: unknown
  APELLIDOS?: unknown
  NIF?: unknown
  'MÓVIL'?: unknown
  EMAIL?: unknown
  'TIPO CONTRATO'?: unknown
  'CURSO ASIGNADO 1'?: unknown
  'CURSO ASIGNADO 2'?: unknown
  'SEDE CEP NORTE'?: unknown
  'SEDE CEP SANTA CRUZ'?: unknown
  'TITULACIÓN'?: unknown
  'DESCRIPCIÓN'?: unknown
  ESTADO?: unknown
  FUENTE?: unknown
  OBSERVACIONES?: unknown
  PERSONAL?: unknown
}

interface ExcelRetiredRow extends ExcelPersonRow {
  'CONTRATO INFORMADO'?: unknown
  'CURSOS ASIGNADOS'?: unknown
  'SOLICITADO RETIRAR COMO'?: unknown
  'CRITERIO COINCIDENCIA'?: unknown
}

interface StaffDoc {
  id: number | string
  first_name?: string
  last_name?: string
  full_name?: string | null
  nif?: string | null
  email?: string | null
  phone?: string | null
  qualified_areas?: Array<number | string | { id?: number | string | null }> | null
  employment_status?: EmploymentStatus
  contract_type?: ContractType
  is_active?: boolean
}

interface CourseDoc {
  id: number | string
  name?: string | null
  title?: string | null
  area_formativa?: number | string | { id?: number | string | null } | null
}

interface ImportAction {
  type: 'create' | 'update' | 'inactivate' | 'skip' | 'ambiguous'
  staffId?: number | string
  name: string
  nif?: string | null
  email?: string | null
  reason: string
  payload?: Record<string, unknown>
}

const initPayload = async (): Promise<Payload> => {
  const config = (await configPromise) as SanitizedConfig
  return getPayload({ config })
}

function text(value: unknown): string {
  if (value === null || value === undefined) return ''
  const raw = String(value).trim()
  if (!raw || raw.toUpperCase() === 'NAN') return ''
  return raw
}

function isMeaningful(value: unknown): boolean {
  const normalized = text(value).toUpperCase()
  return Boolean(normalized && normalized !== 'PENDIENTE' && normalized !== 'NO' && normalized !== 'N/A')
}

function normalizeName(value: unknown): string {
  return text(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

function relationId(value: number | string | { id?: number | string | null } | null | undefined): number | null {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  if (value && typeof value === 'object' && 'id' in value) return relationId(value.id as number | string | null)
  return null
}

function existingQualifiedAreaIds(staff?: StaffDoc): number[] {
  return (staff?.qualified_areas ?? [])
    .map((area) => relationId(area))
    .filter((id): id is number => id != null)
}

function normalizeNif(value: unknown): string | null {
  const normalized = text(value).toUpperCase().replace(/\s+/g, '')
  return normalized || null
}

function normalizeEmail(value: unknown): string | null {
  const normalized = text(value).toLowerCase()
  return normalized.includes('@') ? normalized : null
}

function normalizePhone(value: unknown): string | null {
  const digits = text(value).replace(/\D/g, '')
  if (!digits) return null
  const local = digits.startsWith('34') && digits.length === 11 ? digits.slice(2) : digits
  if (local.length !== 9) return text(value)
  return `+34 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
}

function normalizeContract(value: unknown): ContractType {
  const normalized = normalizeName(value)
  if (normalized.includes('AUTONOMO') || normalized.includes('FREELANCE')) return 'freelance'
  if (normalized.includes('PARCIAL') || normalized.includes('HORAS')) return 'part_time'
  return 'full_time'
}

function splitFirstLast(row: ExcelPersonRow): { firstName: string; lastName: string; fullName: string } {
  const firstName = text(row.NOMBRE)
  const lastName = text(row.APELLIDOS)
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
  return { firstName, lastName, fullName }
}

function extractCourses(row: ExcelPersonRow | ExcelRetiredRow): string[] {
  const values = [
    text(row['CURSO ASIGNADO 1']),
    text(row['CURSO ASIGNADO 2']),
    text((row as ExcelRetiredRow)['CURSOS ASIGNADOS']),
  ]
  return values.filter((value) => value && value.toUpperCase() !== 'PENDIENTE')
}

function resolveAssignedCourseAreas(
  assignedCourses: string[],
  courses: CourseDoc[],
): { qualifiedAreaIds: number[]; unmatchedCourses: string[] } {
  const areaIds = new Set<number>()
  const unmatchedCourses: string[] = []

  const searchableCourses = courses
    .map((course) => {
      const title = text(course.name) || text(course.title)
      return {
        title,
        normalizedTitle: normalizeName(title),
        areaId: relationId(course.area_formativa),
      }
    })
    .filter((course) => course.normalizedTitle && course.areaId != null)

  for (const assignedCourse of assignedCourses) {
    const normalizedAssigned = normalizeName(assignedCourse)
    if (!normalizedAssigned) continue

    const match = searchableCourses.find((course) => (
      course.normalizedTitle === normalizedAssigned ||
      course.normalizedTitle.includes(normalizedAssigned) ||
      normalizedAssigned.includes(course.normalizedTitle)
    ))

    if (match?.areaId != null) {
      areaIds.add(match.areaId)
    } else {
      unmatchedCourses.push(assignedCourse)
    }
  }

  return { qualifiedAreaIds: Array.from(areaIds), unmatchedCourses }
}

function certificationFrom(row: ExcelPersonRow): { title: string; institution: string; year: number }[] {
  const title = text(row['TITULACIÓN'])
  if (!title || title.toUpperCase() === 'PENDIENTE') return []
  return [{ title, institution: 'CEP Formación', year: new Date().getFullYear() }]
}

async function loadWorkbookRows(request: NextRequest): Promise<{
  personalRows: ExcelPersonRow[]
  retiredRows: ExcelRetiredRow[]
  source: string
}> {
  const contentType = request.headers.get('content-type') ?? ''
  let buffer: Buffer
  let source = DEFAULT_XLSX_PATH

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      throw new Error('Debes adjuntar un archivo XLSX en el campo file')
    }
    buffer = Buffer.from(await file.arrayBuffer())
    source = file.name
  } else {
    const body = (await request.json().catch(() => ({}))) as { filePath?: string }
    source = body.filePath || DEFAULT_XLSX_PATH
    buffer = await readFile(source)
  }

  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false })
  const personalSheet = workbook.Sheets.PERSONAL
  const retiredSheet = workbook.Sheets['Retirados excluidos']

  if (!personalSheet) throw new Error('El archivo no contiene la hoja PERSONAL')
  if (!retiredSheet) throw new Error('El archivo no contiene la hoja Retirados excluidos')

  return {
    personalRows: XLSX.utils.sheet_to_json<ExcelPersonRow>(personalSheet, { defval: '' }),
    retiredRows: XLSX.utils.sheet_to_json<ExcelRetiredRow>(retiredSheet, { defval: '' }),
    source,
  }
}

async function getCampusMap(payload: Payload): Promise<Record<'norte' | 'santaCruz', number | undefined>> {
  const result = await payload.find({
    collection: 'campuses',
    limit: 100,
    overrideAccess: true,
    depth: 0,
  })
  const docs = result.docs as unknown as { id: number; name?: string; city?: string; slug?: string }[]
  return {
    norte: docs.find((campus) => normalizeName(`${campus.name ?? ''} ${campus.city ?? ''} ${campus.slug ?? ''}`).includes('NORTE') || normalizeName(campus.city).includes('OROTAVA'))?.id,
    santaCruz: docs.find((campus) => normalizeName(`${campus.name ?? ''} ${campus.city ?? ''} ${campus.slug ?? ''}`).includes('SANTA CRUZ'))?.id,
  }
}

function assignedCampusesFor(row: ExcelPersonRow | ExcelRetiredRow, campusMap: Record<'norte' | 'santaCruz', number | undefined>): number[] {
  const campusIds: number[] = []
  if (isMeaningful(row['SEDE CEP NORTE']) && campusMap.norte) campusIds.push(campusMap.norte)
  if (isMeaningful(row['SEDE CEP SANTA CRUZ']) && campusMap.santaCruz) campusIds.push(campusMap.santaCruz)
  return campusIds
}

function buildStaffIndexes(staff: StaffDoc[]) {
  const byNif = new Map<string, StaffDoc>()
  const byEmail = new Map<string, StaffDoc>()
  const byName = new Map<string, StaffDoc[]>()

  for (const member of staff) {
    const nif = normalizeNif(member.nif)
    const email = normalizeEmail(member.email)
    const fullName = normalizeName(member.full_name || `${member.first_name ?? ''} ${member.last_name ?? ''}`)
    if (nif) byNif.set(nif, member)
    if (email) byEmail.set(email, member)
    if (fullName) byName.set(fullName, [...(byName.get(fullName) ?? []), member])
  }

  return { byNif, byEmail, byName }
}

function matchStaff(row: ExcelPersonRow | ExcelRetiredRow, indexes: ReturnType<typeof buildStaffIndexes>): { match?: StaffDoc; ambiguous?: StaffDoc[]; reason: string } {
  const nif = normalizeNif(row.NIF)
  const email = normalizeEmail(row.EMAIL)
  const { fullName } = splitFirstLast(row)
  const nameKey = normalizeName(fullName)

  if (nif && indexes.byNif.has(nif)) return { match: indexes.byNif.get(nif), reason: 'NIF' }
  if (email && indexes.byEmail.has(email)) return { match: indexes.byEmail.get(email), reason: 'email' }
  const byName = nameKey ? indexes.byName.get(nameKey) ?? [] : []
  if (byName.length === 1) return { match: byName[0], reason: 'nombre exacto' }
  if (byName.length > 1) return { ambiguous: byName, reason: 'nombre duplicado' }
  return { reason: 'sin coincidencia' }
}

async function createStatusEvent(payload: Payload, action: ImportAction, importBatch: string) {
  if (!action.staffId || !['create', 'update', 'inactivate'].includes(action.type)) return
  const create = payload.create as unknown as (options: Record<string, unknown>) => Promise<unknown>
  await create({
    collection: 'staff-status-events',
    overrideAccess: true,
    data: {
      staff: Number(action.staffId),
      previous_status: action.type === 'create' ? 'created' : action.type === 'inactivate' ? 'active' : 'active',
      new_status: action.type === 'inactivate' ? 'inactive' : 'active',
      reason: action.reason,
      source: 'excel_import',
      import_batch: importBatch,
      changed_at: new Date().toISOString(),
      notes: action.name,
    },
  })
}

async function applyActions(payload: Payload, actions: ImportAction[], importBatch: string) {
  const create = payload.create as unknown as (options: Record<string, unknown>) => Promise<StaffDoc>
  const update = payload.update as unknown as (options: Record<string, unknown>) => Promise<StaffDoc>
  const applied: ImportAction[] = []

  for (const action of actions) {
    if (!action.payload || action.type === 'skip' || action.type === 'ambiguous') continue

    if (action.type === 'create') {
      const created = await create({
        collection: 'staff',
        overrideAccess: true,
        data: action.payload,
      })
      action.staffId = created.id
      applied.push(action)
      await createStatusEvent(payload, action, importBatch)
      continue
    }

    if (action.staffId) {
      await update({
        collection: 'staff',
        id: action.staffId,
        overrideAccess: true,
        data: action.payload,
      })
      applied.push(action)
      await createStatusEvent(payload, action, importBatch)
    }
  }

  return applied
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const apply = url.searchParams.get('apply') === 'true' || url.searchParams.get('apply') === '1'
    const importBatch = `cep-personal-${new Date().toISOString().replace(/[:.]/g, '-')}`
    const payload = await initPayload()
    const [{ personalRows, retiredRows, source }, campusMap, staffResult, coursesResult] = await Promise.all([
      loadWorkbookRows(request),
      getCampusMap(payload),
      payload.find({
        collection: 'staff',
        limit: 1000,
        overrideAccess: true,
        depth: 0,
        where: {},
      }),
      payload.find({
        collection: 'courses',
        limit: 1000,
        overrideAccess: true,
        depth: 1,
        where: {},
      }),
    ])

    const existingStaff = staffResult.docs as unknown as StaffDoc[]
    const courseDocs = coursesResult.docs as unknown as CourseDoc[]
    const indexes = buildStaffIndexes(existingStaff)
    const actions: ImportAction[] = []

    for (const row of personalRows) {
      if (normalizeName(row.PERSONAL) !== 'DOCENTE') continue
      const { firstName, lastName, fullName } = splitFirstLast(row)
      if (!firstName || !lastName) {
        actions.push({ type: 'skip', name: fullName || 'Sin nombre', reason: 'Fila sin nombre o apellidos' })
        continue
      }

      const match = matchStaff(row, indexes)
      const nif = normalizeNif(row.NIF)
      const email = normalizeEmail(row.EMAIL)
      const phone = normalizePhone(row['MÓVIL'])
      const assignedCampuses = assignedCampusesFor(row, campusMap)
      const courses = extractCourses(row)
      const { qualifiedAreaIds, unmatchedCourses } = resolveAssignedCourseAreas(courses, courseDocs)
      const reviewStatus: ImportReviewStatus = match.ambiguous ? 'ambiguous' : email || nif ? 'validated' : 'pending_review'
      const basePayload: Record<string, unknown> = {
        staff_type: 'profesor',
        first_name: firstName,
        last_name: lastName,
        nif: nif ?? undefined,
        email: email ?? undefined,
        phone: phone ?? undefined,
        position: text(row['TITULACIÓN']) && text(row['TITULACIÓN']).toUpperCase() !== 'PENDIENTE' ? text(row['TITULACIÓN']) : 'Docente',
        contract_type: normalizeContract(row['TIPO CONTRATO']),
        employment_status: 'active',
        is_active: true,
        reactivated_at: new Date().toISOString(),
        bio: isMeaningful(row['DESCRIPCIÓN']) ? text(row['DESCRIPCIÓN']) : undefined,
        certifications: certificationFrom(row),
        assigned_campuses: assignedCampuses,
        detected_courses: courses.length ? courses.join(', ') : undefined,
        source: 'excel_personal_cep',
        data_quality_status: email && assignedCampuses.length ? 'complete' : 'pending_validation',
        import_review_status: reviewStatus,
        last_import_batch: importBatch,
      }
      if (qualifiedAreaIds.length > 0) {
        basePayload.qualified_areas = qualifiedAreaIds
      }

      if (match.ambiguous) {
        actions.push({ type: 'ambiguous', name: fullName, nif, email, reason: 'Coincidencia múltiple por nombre', payload: basePayload })
      } else if (!match.match && qualifiedAreaIds.length === 0) {
        actions.push({
          type: 'skip',
          name: fullName,
          nif,
          email,
          reason: courses.length
            ? `No se pudo inferir área habilitada desde cursos asignados: ${unmatchedCourses.join(', ') || courses.join(', ')}`
            : 'Docente sin cursos asignados; requiere área habilitada antes de crear ficha',
          payload: basePayload,
        })
      } else if (match.match && existingQualifiedAreaIds(match.match).length === 0 && qualifiedAreaIds.length === 0) {
        actions.push({
          type: 'skip',
          staffId: match.match.id,
          name: fullName,
          nif,
          email,
          reason: 'Docente existente sin área habilitada; requiere asignación manual antes de actualizar',
          payload: basePayload,
        })
      } else if (match.match) {
        actions.push({ type: 'update', staffId: match.match.id, name: fullName, nif, email, reason: `Actualizar docente existente por ${match.reason}`, payload: basePayload })
      } else {
        actions.push({ type: 'create', name: fullName, nif, email, reason: 'Crear docente activo desde Excel validado', payload: basePayload })
      }
    }

    for (const row of retiredRows) {
      const { fullName } = splitFirstLast(row)
      const match = matchStaff(row, indexes)
      const nif = normalizeNif(row.NIF)
      const email = normalizeEmail(row.EMAIL)
      if (match.ambiguous) {
        actions.push({ type: 'ambiguous', name: fullName, nif, email, reason: 'Retirado con coincidencia múltiple' })
      } else if (match.match) {
        actions.push({
          type: 'inactivate',
          staffId: match.match.id,
          name: fullName,
          nif,
          email,
          reason: 'Docente marcado como retirado en Excel',
          payload: {
            employment_status: 'inactive',
            is_active: false,
            inactive_at: new Date().toISOString(),
            inactive_reason: `Retirado por importación CEP. ${text(row['CRITERIO COINCIDENCIA'])}`.trim(),
            import_review_status: 'retired_candidate',
            last_import_batch: importBatch,
          },
        })
      } else {
        actions.push({ type: 'skip', name: fullName, nif, email, reason: 'Retirado no existe en base actual; no se crea ni se borra' })
      }
    }

    const applied = apply ? await applyActions(payload, actions, importBatch) : []
    const summary = actions.reduce<Record<string, number>>((acc, action) => {
      acc[action.type] = (acc[action.type] ?? 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      mode: apply ? 'apply' : 'dry-run',
      source,
      importBatch,
      summary,
      applied: applied.length,
      actions,
    })
  } catch (error) {
    console.error('Error importing staff spreadsheet:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'No se pudo importar el archivo de personal' },
      { status: 500 },
    )
  }
}

export const __staffImportTestables = {
  resolveAssignedCourseAreas,
}
