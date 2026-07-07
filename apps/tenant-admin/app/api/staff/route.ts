import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import postgres from 'postgres'
import { getPayload, type Payload, type SanitizedConfig } from 'payload'
import configPromise from '@payload-config'
import type { Staff } from '../../../src/payload-types'
import { normalizeNominativeText } from '@/lib/nominative-text'
import { normalizeOptionalSpanishPhone, SPANISH_PHONE_ERROR } from '@/lib/phone'
import {
  STAFF_EMAIL_ERROR,
  STAFF_NIF_ERROR,
  validateStaffEmail,
  validateStaffNif,
} from '@/lib/staff-contact'
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth'

/**
 * Initialize Payload CMS instance.
 *
 * This wrapper centralizes Payload initialization for API routes.
 */
const initPayload = async (): Promise<Payload> => {
  // Cast config to satisfy ESLint's strict type checking
  // The configPromise is typed by Payload's buildConfig as Promise<SanitizedConfig>
  const config = (await configPromise) as SanitizedConfig
  return getPayload({ config })
}

const dbConnectionString = process.env.DATABASE_URL ?? process.env.DATABASE_URI
// PostgreSQL connection - support canonical DATABASE_URL first
const sql = dbConnectionString ? postgres(dbConnectionString) : null

// ============================================================================
// Type Definitions
// ============================================================================

/** Campus data returned from SQL JSON aggregation */
interface CampusData {
  id: number
  name: string
  city: string
}

/** Course run data returned from SQL JSON aggregation */
interface CourseRunData {
  id: number
  codigo: string
  status: string
  startDate: string
  endDate: string
  courseName: string
  courseSlug: string
  courseImage: string | null
  campusName: string
  campusCity: string
}

interface CertificationData {
  id: string
  title: string | null
  institution: string | null
  year: number | null
}

interface QualifiedAreaData {
  id: number
  codigo: string | null
  nombre: string
}

/** Raw staff row returned from SQL query */
interface StaffQueryRow {
  id: number
  staff_type: 'profesor' | 'administrativo' | 'jefatura_administracion' | 'academico'
  first_name: string
  first_surname: string | null
  second_surname: string | null
  last_name: string
  full_name: string | null
  nif: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  postal_code: string | null
  position: string
  contract_type: 'general_regime' | 'full_time' | 'part_time' | 'freelance'
  employment_status: 'active' | 'temporary_leave' | 'inactive'
  inactive_reason: string | null
  inactive_at: string | null
  reactivated_at: string | null
  hire_date: string | null
  bio: string | null
  data_quality_status: 'complete' | 'pending_validation'
  import_review_status: 'validated' | 'pending_review' | 'ambiguous' | 'retired_candidate'
  last_import_batch: string | null
  source: string | null
  alias_names: string | null
  detected_courses: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  photo_id: number | null
  photo_filename: string | null
  photo_url: string | null
  base_campus_id: number | null
  base_campus_name: string | null
  base_campus_city: string | null
  campuses: CampusData[]
  course_runs: CourseRunData[]
  certifications: CertificationData[]
  qualified_areas: QualifiedAreaData[]
}

/** Request body for creating a staff member */
interface CreateStaffBody {
  staffType: 'profesor' | 'administrativo' | 'jefatura_administracion' | 'academico'
  firstName: string
  lastName?: string
  firstSurname?: string
  secondSurname?: string
  nif?: string
  email: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  position: string
  contractType?: 'general_regime' | 'full_time' | 'part_time' | 'freelance'
  employmentStatus?: 'active' | 'temporary_leave' | 'inactive'
  inactiveReason?: string
  inactiveAt?: string
  reactivatedAt?: string
  importReviewStatus?: 'validated' | 'pending_review' | 'ambiguous' | 'retired_candidate'
  lastImportBatch?: string
  hireDate: string
  bio?: string
  specialties?: Staff['specialties']
  qualifiedAreas?: (string | number)[]
  aliasNames?: string
  detectedCourses?: string
  certifications?: {
    title: string
    institution: string
    year: number
    document?: number
  }[]
  assignedCampuses: (string | number)[]
  baseCampusId?: string | number | null
  photoId?: string | number
}

/** Request body for updating a staff member */
interface UpdateStaffBody {
  firstName?: string
  lastName?: string
  firstSurname?: string | null
  secondSurname?: string | null
  nif?: string | null
  email?: string
  phone?: string | null
  address?: string | null
  city?: string | null
  postalCode?: string | null
  position?: string
  contractType?: 'general_regime' | 'full_time' | 'part_time' | 'freelance'
  employmentStatus?: 'active' | 'temporary_leave' | 'inactive'
  inactiveReason?: string | null
  inactiveAt?: string | null
  reactivatedAt?: string | null
  importReviewStatus?: 'validated' | 'pending_review' | 'ambiguous' | 'retired_candidate'
  lastImportBatch?: string | null
  hireDate?: string
  bio?: string | null
  photoId?: string | number | null
  specialties?: Staff['specialties']
  qualifiedAreas?: (string | number)[]
  aliasNames?: string | null
  detectedCourses?: string | null
  certifications?: {
    title: string
    institution: string
    year: number
    document?: number
  }[]
  assignedCampuses?: (string | number)[]
  baseCampusId?: string | number | null
  isActive?: boolean
}

/** Data structure for Payload CMS staff updates */
interface StaffUpdateData {
  first_name?: string
  first_surname?: string | null
  second_surname?: string | null
  last_name?: string
  nif?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  postal_code?: string | null
  position?: string
  contract_type?: 'general_regime' | 'full_time' | 'part_time' | 'freelance'
  employment_status?: 'active' | 'temporary_leave' | 'inactive'
  inactive_reason?: string | null
  inactive_at?: string | null
  reactivated_at?: string | null
  import_review_status?: 'validated' | 'pending_review' | 'ambiguous' | 'retired_candidate'
  last_import_batch?: string | null
  hire_date?: string
  bio?: string | null
  photo?: number | null
  specialties?: Staff['specialties']
  qualified_areas?: number[]
  alias_names?: string | null
  detected_courses?: string | null
  certifications?: {
    title: string
    institution: string
    year: number
    document?: number
  }[]
  assigned_campuses?: number[]
  base_campus?: number | null
  is_active?: boolean
}

function isTeachingStaffType(staffType?: string | null): boolean {
  return staffType === 'profesor' || staffType === 'academico'
}

function normalizeQualifiedAreaIds(qualifiedAreas?: (string | number)[]): number[] {
  return (qualifiedAreas ?? [])
    .map((areaId) => (typeof areaId === 'string' ? parseInt(areaId, 10) : areaId))
    .filter((areaId) => Number.isFinite(areaId))
}

function normalizeCampusIds(campusIds?: (string | number)[] | null): number[] {
  return Array.from(
    new Set(
      (campusIds ?? [])
        .map((campusId) => (typeof campusId === 'string' ? parseInt(campusId, 10) : campusId))
        .filter((campusId) => Number.isFinite(campusId))
    )
  )
}

function normalizeNullableText(value?: string | null): string | null {
  if (value === undefined) return null
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function parseNullableId(value?: string | number | null): number | null {
  if (value === undefined || value === null || value === '') return null
  const parsed = typeof value === 'string' ? parseInt(value, 10) : value
  return Number.isFinite(parsed) ? parsed : null
}

function splitSurnameParts(lastName?: string | null): {
  firstSurname: string | null
  secondSurname: string | null
} {
  const normalized = normalizeNominativeText(lastName ?? undefined)
  if (!normalized) return { firstSurname: null, secondSurname: null }
  const [first, ...rest] = normalized.split(/\s+/)
  return {
    firstSurname: first ?? null,
    secondSurname: rest.length > 0 ? rest.join(' ') : null,
  }
}

function combineSurnameParts(
  firstSurname?: string | null,
  secondSurname?: string | null,
  fallbackLastName?: string | null
): string | null {
  const normalizedFirst = normalizeNominativeText(firstSurname ?? undefined)
  const normalizedSecond = normalizeNominativeText(secondSurname ?? undefined)
  const combined = [normalizedFirst, normalizedSecond].filter(Boolean).join(' ').trim()
  return combined || normalizeNominativeText(fallbackLastName ?? undefined) || null
}

function getCurrentCampusIds(current: Staff | undefined | null): number[] {
  const currentWithCampuses = current as
    | (Staff & {
        assigned_campuses?: (number | string | { id?: number | string | null })[] | null
      })
    | undefined
    | null
  const campuses = currentWithCampuses?.assigned_campuses
  if (!Array.isArray(campuses)) return []
  return normalizeCampusIds(
    campuses.map((campus) => {
      if (typeof campus === 'number' || typeof campus === 'string') return campus
      return campus?.id ?? ''
    })
  )
}

function getCurrentBaseCampusId(current: Staff | undefined | null): number | null {
  const currentWithBase = current as
    | (Staff & { base_campus?: number | string | { id?: number | string | null } | null })
    | undefined
    | null
  const baseCampus = currentWithBase?.base_campus
  if (typeof baseCampus === 'number' || typeof baseCampus === 'string') {
    return parseNullableId(baseCampus)
  }
  return parseNullableId(baseCampus?.id ?? null)
}

function resolveCampusAssignment(
  assignedCampuses: number[],
  requestedBaseCampusId?: string | number | null,
  fallbackBaseCampusId?: number | null
): { assignedCampuses: number[]; baseCampusId: number | null } {
  const baseCampusId =
    requestedBaseCampusId !== undefined ? parseNullableId(requestedBaseCampusId) : fallbackBaseCampusId ?? null
  const nextAssignedCampuses = [...assignedCampuses]
  if (baseCampusId && !nextAssignedCampuses.includes(baseCampusId)) {
    nextAssignedCampuses.push(baseCampusId)
  }
  return {
    assignedCampuses: nextAssignedCampuses,
    baseCampusId: baseCampusId ?? nextAssignedCampuses[0] ?? null,
  }
}

function normalizeCertifications(certifications?: CreateStaffBody['certifications']) {
  return (certifications ?? []).map((certification) => ({
    ...certification,
    title: normalizeNominativeText(certification.title) ?? certification.title,
    institution: normalizeNominativeText(certification.institution) ?? certification.institution,
  }))
}

type StaffWithQualifiedAreas = Staff & {
  qualified_areas?: (number | string | { id?: number | string | null })[] | null
}

function getExistingQualifiedAreaIds(staff: StaffWithQualifiedAreas | undefined | null): number[] {
  const areas = staff?.qualified_areas
  if (!Array.isArray(areas)) return []
  return areas
    .map((area) => {
      if (typeof area === 'number') return area
      if (typeof area === 'string') return parseInt(area, 10)
      if (area && typeof area === 'object' && 'id' in area) return Number(area.id)
      return NaN
    })
    .filter((areaId) => Number.isFinite(areaId))
}

function isStatusOnlyUpdate(body: UpdateStaffBody): boolean {
  const allowedKeys = new Set([
    'employmentStatus',
    'inactiveReason',
    'inactiveAt',
    'reactivatedAt',
    'isActive',
    'lastImportBatch',
  ])

  return Object.keys(body).length > 0 && Object.keys(body).every((key) => allowedKeys.has(key))
}

/** Helper to extract error message from unknown error */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message
    const normalizedMessage = message.toLowerCase()

    if (
      normalizedMessage.includes('email') &&
      (normalizedMessage.includes('unique') ||
        normalizedMessage.includes('duplicate') ||
        normalizedMessage.includes('duplicat') ||
        normalizedMessage.includes('already exists') ||
        normalizedMessage.includes('ya existe'))
    ) {
      return 'Ya existe una ficha de personal con este email.'
    }

    if (
      (normalizedMessage.includes('nif') || normalizedMessage.includes('dni')) &&
      (normalizedMessage.includes('unique') ||
        normalizedMessage.includes('duplicate') ||
        normalizedMessage.includes('duplicat') ||
        normalizedMessage.includes('already exists') ||
        normalizedMessage.includes('ya existe'))
    ) {
      return 'Ya existe una ficha de personal con este DNI/NIF.'
    }

    if (normalizedMessage.includes('field is invalid: email')) return STAFF_EMAIL_ERROR
    if (normalizedMessage.includes('field is invalid: nif')) return STAFF_NIF_ERROR

    return error.message
  }
  return String(error)
}

function resolveMediaUrl(filename?: string | null, url?: string | null): string {
  if (url && url.trim().length > 0) return url
  if (filename && filename.trim().length > 0) return `/api/media/file/${filename}`
  return '/placeholder-avatar.svg'
}

function normalizeChangedById(value: string | number | null | undefined): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value)
  return undefined
}

async function createStaffStatusEvent(args: {
  payload: Payload
  staffId: number
  previousStatus: 'active' | 'temporary_leave' | 'inactive' | 'created'
  newStatus: 'active' | 'temporary_leave' | 'inactive' | 'created'
  reason: string
  source?: 'manual' | 'excel_import' | 'audit' | 'system'
  importBatch?: string | null
  notes?: string | null
  changedById?: string | number | null
}) {
  const create = args.payload.create as unknown as (
    options: Record<string, unknown>
  ) => Promise<unknown>
  await create({
    collection: 'staff-status-events',
    overrideAccess: true,
    data: {
      staff: args.staffId,
      previous_status: args.previousStatus,
      new_status: args.newStatus,
      reason: args.reason,
      source: args.source ?? 'manual',
      import_batch: args.importBatch ?? undefined,
      changed_at: new Date().toISOString(),
      notes: args.notes ?? undefined,
      changed_by: normalizeChangedById(args.changedById),
    },
  })
}

// ============================================================================
// API Route Handlers
// ============================================================================

/**
 * GET /api/staff?type=instructor|administrative&campus=X&status=active
 *
 * Lista miembros del personal con filtros opcionales (SQL directo)
 */
export async function GET(request: NextRequest) {
  if (!sql) {
    return NextResponse.json(
      { success: false, error: 'DATABASE_URL is required for /api/staff' },
      { status: 503 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const rawStaffType =
      searchParams.get('type') ??
      searchParams.get('staffType') ??
      searchParams.get('where[staff_type][equals]')
    const campusId = searchParams.get('campus')
    const qualifiedAreaId = searchParams.get('qualifiedArea') ?? searchParams.get('qualified_area')
    const employmentStatus = searchParams.get('status') // 'active' | 'temporary_leave' | 'inactive'
    const includeInactive =
      searchParams.get('includeInactive') === 'true' || searchParams.get('includeInactive') === '1'
    const limit = parseInt(searchParams.get('limit') ?? '50')

    // Build dynamic WHERE clause
    const conditions = includeInactive ? [] : ['s.is_active = true']
    const params: string[] = []

    if (rawStaffType) {
      const normalizedStaffType = rawStaffType.trim().toLowerCase()
      if (
        normalizedStaffType === 'profesor' ||
        normalizedStaffType === 'profesores' ||
        normalizedStaffType === 'docente' ||
        normalizedStaffType === 'docentes'
      ) {
        conditions.push(`s.staff_type IN ('profesor', 'academico')`)
      } else if (
        normalizedStaffType === 'administrativo' ||
        normalizedStaffType === 'administrativos' ||
        normalizedStaffType === 'admin'
      ) {
        conditions.push(`s.staff_type IN ('administrativo', 'jefatura_administracion')`)
      } else if (['jefatura_administracion', 'academico'].includes(normalizedStaffType)) {
        params.push(normalizedStaffType)
        conditions.push(`s.staff_type = $${params.length}`)
      } else {
        return NextResponse.json(
          { success: false, error: 'Tipo de personal no válido' },
          { status: 400 }
        )
      }
    }

    if (employmentStatus) {
      params.push(employmentStatus)
      conditions.push(`s.employment_status = $${params.length}`)
    }

    if (campusId) {
      const parsedCampusId = parseInt(campusId, 10)
      if (Number.isNaN(parsedCampusId)) {
        return NextResponse.json({ success: false, error: 'Sede no válida' }, { status: 400 })
      }
      params.push(String(parsedCampusId))
      conditions.push(
        `EXISTS (SELECT 1 FROM staff_rels sr2 WHERE sr2.parent_id = s.id AND sr2.campuses_id = $${params.length})`
      )
    }

    if (qualifiedAreaId) {
      const parsedQualifiedAreaId = parseInt(qualifiedAreaId, 10)
      if (Number.isNaN(parsedQualifiedAreaId)) {
        return NextResponse.json(
          { success: false, error: 'Área habilitada no válida' },
          { status: 400 }
        )
      }
      params.push(String(parsedQualifiedAreaId))
      conditions.push(
        `EXISTS (SELECT 1 FROM staff_rels sr3 WHERE sr3.parent_id = s.id AND sr3.path = 'qualified_areas' AND sr3.areas_formativas_id = $${params.length})`
      )
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Query staff with photo, campus relationships, and assigned course runs
    const query = `
      SELECT
        s.id,
        s.staff_type,
        s.first_name,
        s.first_surname,
        s.second_surname,
        s.last_name,
        s.full_name,
        s.nif,
        s.email,
        s.phone,
        s.address,
        s.city,
        s.postal_code,
        s.position,
        s.contract_type,
        s.employment_status,
        s.inactive_reason,
        s.inactive_at,
        s.reactivated_at,
        s.hire_date,
        s.bio,
        s.data_quality_status,
        s.import_review_status,
        s.last_import_batch,
        s.source,
        s.alias_names,
        s.detected_courses,
        s.is_active,
        s.created_at,
        s.updated_at,
        s.photo_id,
        m.filename as photo_filename,
        m.url as photo_url,
        s.base_campus_id,
        base_campus.name as base_campus_name,
        base_campus.city as base_campus_city,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', c.id, 'name', c.name, 'city', c.city)
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'::json
        ) as campuses,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', cr.id,
              'codigo', cr.codigo,
              'status', cr.status,
              'startDate', cr.start_date,
              'endDate', cr.end_date,
              'courseName', course.name,
              'courseSlug', course.slug,
              'courseImage', CASE
                WHEN course_media.url IS NOT NULL AND course_media.url <> '' THEN course_media.url
                WHEN course_media.filename IS NOT NULL AND course_media.filename <> '' THEN '/api/media/file/' || course_media.filename
                ELSE NULL
              END,
              'campusName', camp.name,
              'campusCity', camp.city
            )
          ) FILTER (WHERE cr.id IS NOT NULL),
          '[]'::json
        ) as course_runs,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', cert.id,
              'title', cert.title,
              'institution', cert.institution,
              'year', cert.year
            )
          ) FILTER (WHERE cert.id IS NOT NULL),
          '[]'::json
        ) as certifications,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', area.id,
              'codigo', area.codigo,
              'nombre', area.nombre
            )
          ) FILTER (WHERE area.id IS NOT NULL),
          '[]'::json
        ) as qualified_areas
      FROM staff s
      LEFT JOIN media m ON s.photo_id = m.id
      LEFT JOIN campuses base_campus ON base_campus.id = s.base_campus_id
      LEFT JOIN staff_rels sr ON sr.parent_id = s.id AND sr.path = 'assigned_campuses'
      LEFT JOIN campuses c ON c.id = sr.campuses_id
      LEFT JOIN staff_rels sr_area ON sr_area.parent_id = s.id AND sr_area.path = 'qualified_areas'
      LEFT JOIN areas_formativas area ON area.id = sr_area.areas_formativas_id
      LEFT JOIN course_runs_rels crr ON crr.staff_id = s.id AND crr.path = 'instructors'
      LEFT JOIN course_runs cr ON cr.instructor_id = s.id OR cr.id = crr.parent_id
      LEFT JOIN courses course ON course.id = cr.course_id
      LEFT JOIN media course_media ON course_media.id = course.featured_image_id
      LEFT JOIN campuses camp ON camp.id = cr.campus_id
      LEFT JOIN staff_certifications cert ON cert._parent_id = s.id
      ${whereClause}
      GROUP BY s.id, m.filename, m.url, base_campus.name, base_campus.city
      ORDER BY s.created_at DESC
      LIMIT ${limit}
    `

    const staff = (await sql.unsafe(query, params)) as StaffQueryRow[]

    return NextResponse.json({
      success: true,
      data: staff.map((member) => ({
        id: member.id,
        staffType: member.staff_type,
        firstName: member.first_name,
        firstSurname: member.first_surname ?? splitSurnameParts(member.last_name).firstSurname,
        secondSurname: member.second_surname ?? splitSurnameParts(member.last_name).secondSurname,
        lastName: member.last_name,
        fullName: member.full_name,
        nif: member.nif,
        email: member.email,
        phone: member.phone,
        address: member.address,
        city: member.city,
        postalCode: member.postal_code,
        position: member.position,
        contractType: member.contract_type,
        employmentStatus: member.employment_status,
        inactiveReason: member.inactive_reason,
        inactiveAt: member.inactive_at,
        reactivatedAt: member.reactivated_at,
        hireDate: member.hire_date,
        dataQualityStatus: member.data_quality_status,
        importReviewStatus: member.import_review_status,
        lastImportBatch: member.last_import_batch,
        source: member.source,
        aliasNames: member.alias_names,
        detectedCourses: member.detected_courses,
        photoId: member.photo_id,
        photo: resolveMediaUrl(member.photo_filename, member.photo_url),
        bio: member.bio,
        certifications: member.certifications || [],
        qualifiedAreas: member.qualified_areas || [],
        assignedCampuses: member.campuses || [],
        baseCampusId: member.base_campus_id ?? member.campuses?.[0]?.id ?? null,
        baseCampus:
          member.base_campus_id && member.base_campus_name
            ? {
                id: member.base_campus_id,
                name: member.base_campus_name,
                city: member.base_campus_city,
              }
            : member.campuses?.[0] ?? null,
        courseRuns: member.course_runs || [],
        courseRunsCount: Array.isArray(member.course_runs) ? member.course_runs.length : 0,
        isActive: member.is_active,
        createdAt: member.created_at,
        updatedAt: member.updated_at,
      })),
      total: staff.length,
    })
  } catch (error: unknown) {
    console.error('Error fetching staff:', error)
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || 'Error al obtener personal' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/staff
 *
 * Crea un nuevo miembro del personal
 */
export async function POST(request: NextRequest) {
  if (!sql) {
    return NextResponse.json(
      { success: false, error: 'DATABASE_URL is required for /api/staff' },
      { status: 503 }
    )
  }

  try {
    const body = (await request.json()) as CreateStaffBody
    const {
      staffType,
      firstName,
      lastName,
      firstSurname,
      secondSurname,
      nif,
      email,
      phone,
      address,
      city,
      postalCode,
      position,
      contractType,
      employmentStatus,
      inactiveReason,
      inactiveAt,
      reactivatedAt,
      importReviewStatus,
      lastImportBatch,
      hireDate,
      bio,
      specialties,
      qualifiedAreas,
      aliasNames,
      detectedCourses,
      certifications,
      assignedCampuses,
      baseCampusId,
      photoId,
    } = body

    const normalizedFirstName = normalizeNominativeText(firstName)
    const splitLastName = splitSurnameParts(lastName)
    const normalizedFirstSurname =
      normalizeNominativeText(firstSurname) ?? splitLastName.firstSurname
    const normalizedSecondSurname =
      normalizeNominativeText(secondSurname) ?? splitLastName.secondSurname
    const normalizedLastName = combineSurnameParts(
      normalizedFirstSurname,
      normalizedSecondSurname,
      lastName
    )
    const normalizedPosition = normalizeNominativeText(position)
    const normalizedAddress = normalizeNullableText(address)
    const normalizedCity = normalizeNominativeText(city)
    const normalizedPostalCode = normalizeNullableText(postalCode)
    const campusAssignment = resolveCampusAssignment(
      normalizeCampusIds(assignedCampuses),
      baseCampusId
    )

    // Validaciones básicas
    if (!staffType || !normalizedFirstName || !normalizedLastName || !normalizedPosition) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campos requeridos: staffType, firstName, apellidos, position',
        },
        { status: 400 }
      )
    }

    const normalizedQualifiedAreas = normalizeQualifiedAreaIds(qualifiedAreas)
    if (isTeachingStaffType(staffType) && normalizedQualifiedAreas.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Un docente debe tener al menos un área habilitada para poder darse de alta.',
        },
        { status: 400 }
      )
    }

    const normalizedPhone = normalizeOptionalSpanishPhone(phone)
    if (phone !== undefined && phone !== null && phone.trim() !== '' && !normalizedPhone) {
      return NextResponse.json({ success: false, error: SPANISH_PHONE_ERROR }, { status: 400 })
    }

    const emailValidation = validateStaffEmail(email)
    if (emailValidation.valid === false) {
      return NextResponse.json({ success: false, error: emailValidation.error }, { status: 400 })
    }
    const normalizedEmail = emailValidation.value

    const nifValidation = validateStaffNif(nif)
    if (nifValidation.valid === false) {
      return NextResponse.json({ success: false, error: nifValidation.error }, { status: 400 })
    }
    const normalizedNif = nifValidation.value

    const payload = await initPayload()
    const authContext = await getAuthenticatedUserContext(request, payload)

    // Crear miembro del personal
    const createStaff = payload.create as unknown as (
      args: Record<string, unknown>
    ) => Promise<unknown>
    const staffMember = (await createStaff({
      collection: 'staff',
      overrideAccess: true,
      data: {
        staff_type: staffType,
        first_name: normalizedFirstName,
        first_surname: normalizedFirstSurname ?? undefined,
        second_surname: normalizedSecondSurname ?? undefined,
        last_name: normalizedLastName,
        nif: normalizedNif ?? undefined,
        email: normalizedEmail ?? undefined,
        phone: normalizedPhone ?? undefined,
        address: normalizedAddress ?? undefined,
        city: normalizedCity ?? undefined,
        postal_code: normalizedPostalCode ?? undefined,
        position: normalizedPosition,
        contract_type: contractType ?? 'full_time',
        employment_status: employmentStatus ?? 'active',
        inactive_reason: inactiveReason ?? undefined,
        inactive_at: inactiveAt || undefined,
        reactivated_at: reactivatedAt || undefined,
        import_review_status: importReviewStatus ?? 'validated',
        last_import_batch: lastImportBatch ?? undefined,
        hire_date: hireDate || undefined,
        bio: bio ?? undefined,
        photo: photoId ? parseInt(String(photoId)) : undefined,
        specialties: (specialties ?? []) as Staff['specialties'],
        qualified_areas: normalizedQualifiedAreas,
        alias_names: aliasNames ?? undefined,
        detected_courses: detectedCourses ?? undefined,
        certifications: normalizeCertifications(certifications),
        assigned_campuses: campusAssignment.assignedCampuses,
        base_campus: campusAssignment.baseCampusId ?? undefined,
        is_active: true,
        data_quality_status:
          !normalizedEmail || !hireDate || campusAssignment.assignedCampuses.length === 0
            ? 'pending_validation'
            : 'complete',
      },
    })) as unknown as Staff

    await createStaffStatusEvent({
      payload,
      staffId: Number(staffMember.id),
      previousStatus: 'created',
      newStatus: (employmentStatus ?? 'active') as 'active' | 'temporary_leave' | 'inactive',
      reason: lastImportBatch
        ? 'Alta creada desde importación de personal'
        : 'Alta creada manualmente',
      source: lastImportBatch ? 'excel_import' : 'manual',
      importBatch: lastImportBatch,
      changedById: authContext?.userId,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: staffMember.id,
        fullName: staffMember.full_name,
      },
      message: 'Miembro del personal creado exitosamente',
    })
  } catch (error: unknown) {
    console.error('Error creating staff member:', error)
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error) || 'Error al crear miembro del personal',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/staff/:id
 *
 * Actualiza un miembro del personal
 */
export async function PUT(request: NextRequest) {
  if (!sql) {
    return NextResponse.json(
      { success: false, error: 'DATABASE_URL is required for /api/staff' },
      { status: 503 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
    }

    const body = (await request.json()) as UpdateStaffBody

    if (body.employmentStatus && isStatusOnlyUpdate(body)) {
      const staffId = parseInt(id, 10)
      if (Number.isNaN(staffId)) {
        return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 })
      }

      const currentRows = await sql`
        SELECT id, full_name, employment_status, last_import_batch
        FROM staff
        WHERE id = ${staffId}
        LIMIT 1
      `
      const current = currentRows[0] as
        | {
            id: number
            full_name: string | null
            employment_status: 'active' | 'temporary_leave' | 'inactive'
            last_import_batch: string | null
          }
        | undefined

      if (!current) {
        return NextResponse.json(
          { success: false, error: 'Miembro del personal no encontrado' },
          { status: 404 }
        )
      }

      const nextStatus = body.employmentStatus
      const nextIsActive = body.isActive ?? nextStatus === 'active'
      const statusReason =
        body.inactiveReason ||
        (nextStatus === 'active'
          ? 'Reactivación manual desde ficha docente'
          : nextStatus === 'temporary_leave'
            ? 'Baja temporal manual desde ficha docente'
            : 'Baja manual desde ficha docente')
      const payload = await initPayload()
      const authContext = await getAuthenticatedUserContext(request, payload)

      const updatedRows = await sql.begin(async (tx) => {
        const updated = await tx`
          UPDATE staff
          SET
            employment_status = ${nextStatus},
            is_active = ${nextIsActive},
            inactive_reason = ${nextStatus === 'active' ? null : statusReason},
            inactive_at = ${nextStatus === 'active' ? null : (body.inactiveAt ?? new Date().toISOString())},
            reactivated_at = ${nextStatus === 'active' ? (body.reactivatedAt ?? new Date().toISOString()) : null},
            import_review_status = CASE
              WHEN ${nextStatus} = 'active' AND import_review_status = 'retired_candidate' THEN 'validated'
              ELSE import_review_status
            END,
            updated_at = now()
          WHERE id = ${staffId}
          RETURNING id, full_name
        `

        if (nextStatus !== current.employment_status) {
          await tx`
            INSERT INTO staff_status_events (
              staff_id,
              previous_status,
              new_status,
              reason,
              source,
              import_batch,
              changed_by_id,
              changed_at,
              updated_at,
              created_at
            )
            VALUES (
              ${staffId},
              ${current.employment_status},
              ${nextStatus},
              ${statusReason},
              'manual',
              ${body.lastImportBatch ?? current.last_import_batch},
              ${normalizeChangedById(authContext?.userId) ?? null},
              now(),
              now(),
              now()
            )
          `
        }

        return updated
      })

      const updated = updatedRows[0] as { id: number; full_name: string | null }
      return NextResponse.json({
        success: true,
        data: {
          id: updated.id,
          fullName: updated.full_name,
        },
        message: 'Estado del personal actualizado exitosamente',
      })
    }

    const payload = await initPayload()
    const authContext = await getAuthenticatedUserContext(request, payload)
    const current = (await payload.findByID({
      collection: 'staff',
      id: parseInt(id),
      overrideAccess: true,
      depth: 0,
    })) as unknown as Staff

    // Preparar datos de actualización
    const updateData: StaffUpdateData = {}

    if (body.firstName !== undefined) {
      const normalizedFirstName = normalizeNominativeText(body.firstName)
      if (normalizedFirstName) updateData.first_name = normalizedFirstName
    }
    if (
      body.firstSurname !== undefined ||
      body.secondSurname !== undefined ||
      body.lastName !== undefined
    ) {
      const currentWithNames = current as Staff & {
        first_surname?: string | null
        second_surname?: string | null
      }
      const splitCurrentLastName = splitSurnameParts(current.last_name)
      const nextFirstSurname =
        body.firstSurname !== undefined
          ? normalizeNominativeText(body.firstSurname ?? undefined)
          : currentWithNames.first_surname ?? splitCurrentLastName.firstSurname
      const nextSecondSurname =
        body.secondSurname !== undefined
          ? normalizeNominativeText(body.secondSurname ?? undefined)
          : currentWithNames.second_surname ?? splitCurrentLastName.secondSurname
      const normalizedLastName = combineSurnameParts(
        nextFirstSurname,
        nextSecondSurname,
        body.lastName ?? current.last_name
      )
      updateData.first_surname = nextFirstSurname ?? null
      updateData.second_surname = nextSecondSurname ?? null
      if (normalizedLastName) updateData.last_name = normalizedLastName
    }
    if (body.nif !== undefined) {
      const nifValidation = validateStaffNif(body.nif)
      if (nifValidation.valid === false) {
        return NextResponse.json({ success: false, error: nifValidation.error }, { status: 400 })
      }
      updateData.nif = nifValidation.value
    }
    if (body.email !== undefined) {
      const emailValidation = validateStaffEmail(body.email)
      if (emailValidation.valid === false) {
        return NextResponse.json({ success: false, error: emailValidation.error }, { status: 400 })
      }
      updateData.email = emailValidation.value
    }
    if (body.phone !== undefined) {
      const normalizedPhone = normalizeOptionalSpanishPhone(body.phone)
      if (body.phone !== null && String(body.phone).trim() !== '' && !normalizedPhone) {
        return NextResponse.json({ success: false, error: SPANISH_PHONE_ERROR }, { status: 400 })
      }
      updateData.phone = normalizedPhone ?? null
    }
    if (body.address !== undefined) updateData.address = normalizeNullableText(body.address)
    if (body.city !== undefined) updateData.city = normalizeNominativeText(body.city ?? undefined) ?? null
    if (body.postalCode !== undefined) updateData.postal_code = normalizeNullableText(body.postalCode)
    if (body.position !== undefined) {
      const normalizedPosition = normalizeNominativeText(body.position)
      if (normalizedPosition) updateData.position = normalizedPosition
    }
    if (body.contractType) updateData.contract_type = body.contractType
    if (body.employmentStatus) updateData.employment_status = body.employmentStatus
    if (body.inactiveReason !== undefined) updateData.inactive_reason = body.inactiveReason
    if (body.inactiveAt !== undefined) updateData.inactive_at = body.inactiveAt
    if (body.reactivatedAt !== undefined) updateData.reactivated_at = body.reactivatedAt
    if (body.importReviewStatus) updateData.import_review_status = body.importReviewStatus
    if (body.lastImportBatch !== undefined) updateData.last_import_batch = body.lastImportBatch
    if (body.hireDate) updateData.hire_date = body.hireDate
    if (body.bio !== undefined) updateData.bio = body.bio
    if (body.photoId !== undefined)
      updateData.photo = body.photoId ? parseInt(String(body.photoId)) : null
    if (body.specialties) updateData.specialties = body.specialties as Staff['specialties']
    if (body.qualifiedAreas !== undefined)
      updateData.qualified_areas = normalizeQualifiedAreaIds(body.qualifiedAreas)
    if (body.aliasNames !== undefined) updateData.alias_names = body.aliasNames
    if (body.detectedCourses !== undefined) updateData.detected_courses = body.detectedCourses
    if (body.certifications) updateData.certifications = normalizeCertifications(body.certifications)
    if (body.assignedCampuses !== undefined || body.baseCampusId !== undefined) {
      const currentAssignedCampuses = getCurrentCampusIds(current)
      const currentBaseCampusId = getCurrentBaseCampusId(current)
      const requestedAssignedCampuses =
        body.assignedCampuses !== undefined
          ? normalizeCampusIds(body.assignedCampuses)
          : currentAssignedCampuses
      const campusAssignment = resolveCampusAssignment(
        requestedAssignedCampuses,
        body.baseCampusId,
        currentBaseCampusId ?? currentAssignedCampuses[0] ?? null
      )
      updateData.assigned_campuses = campusAssignment.assignedCampuses
      updateData.base_campus = campusAssignment.baseCampusId
    }
    if (body.isActive !== undefined) updateData.is_active = body.isActive

    const effectiveStaffType = current.staff_type
    const effectiveQualifiedAreas =
      updateData.qualified_areas ?? getExistingQualifiedAreaIds(current)
    if (isTeachingStaffType(effectiveStaffType) && effectiveQualifiedAreas.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Un docente debe tener al menos un área habilitada antes de guardar la ficha.',
        },
        { status: 400 }
      )
    }

    const staffMember = (await payload.update({
      collection: 'staff',
      id: parseInt(id),
      overrideAccess: true,
      data: updateData as unknown as Record<string, unknown>,
    })) as unknown as Staff

    if (body.employmentStatus && body.employmentStatus !== current.employment_status) {
      await createStaffStatusEvent({
        payload,
        staffId: parseInt(id),
        previousStatus: current.employment_status as 'active' | 'temporary_leave' | 'inactive',
        newStatus: body.employmentStatus,
        reason: body.inactiveReason || 'Cambio de estado laboral',
        source: body.lastImportBatch ? 'excel_import' : 'manual',
        importBatch: body.lastImportBatch,
        changedById: authContext?.userId,
      })
    } else if (body.contractType && body.contractType !== current.contract_type) {
      await createStaffStatusEvent({
        payload,
        staffId: parseInt(id),
        previousStatus: current.employment_status as 'active' | 'temporary_leave' | 'inactive',
        newStatus: current.employment_status as 'active' | 'temporary_leave' | 'inactive',
        reason: `Cambio de contrato: ${current.contract_type} -> ${body.contractType}`,
        source: body.lastImportBatch ? 'excel_import' : 'manual',
        importBatch: body.lastImportBatch,
        changedById: authContext?.userId,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: staffMember.id,
        fullName: staffMember.full_name,
      },
      message: 'Miembro del personal actualizado exitosamente',
    })
  } catch (error: unknown) {
    console.error('Error updating staff member:', error)
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error) || 'Error al actualizar miembro del personal',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/staff/:id
 *
 * Elimina (desactiva) un miembro del personal
 * Nota: No se elimina físicamente, solo se marca como inactivo
 */
export async function DELETE(request: NextRequest) {
  if (!sql) {
    return NextResponse.json(
      { success: false, error: 'DATABASE_URL is required for /api/staff' },
      { status: 503 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
    }

    const payload = await initPayload()
    const authContext = await getAuthenticatedUserContext(request, payload)
    const current = (await payload.findByID({
      collection: 'staff',
      id: parseInt(id),
      overrideAccess: true,
      depth: 0,
    })) as unknown as Staff

    // En lugar de eliminar, marcamos como inactivo (soft delete)
    const update = payload.update as unknown as (
      options: Record<string, unknown>
    ) => Promise<unknown>
    await update({
      collection: 'staff',
      id: parseInt(id),
      overrideAccess: true,
      data: {
        is_active: false,
        employment_status: 'inactive',
        inactive_at: new Date().toISOString(),
        inactive_reason: 'Desactivación manual desde API',
      },
    })

    await createStaffStatusEvent({
      payload,
      staffId: parseInt(id),
      previousStatus: (current.employment_status ?? 'active') as
        | 'active'
        | 'temporary_leave'
        | 'inactive',
      newStatus: 'inactive',
      reason: 'Desactivación manual desde API',
      source: 'manual',
      changedById: authContext?.userId,
    })

    return NextResponse.json({
      success: true,
      message: 'Miembro del personal desactivado exitosamente',
    })
  } catch (error: unknown) {
    console.error('Error deleting staff member:', error)
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error) || 'Error al eliminar miembro del personal',
      },
      { status: 500 }
    )
  }
}
