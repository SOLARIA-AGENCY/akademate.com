import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { jwtVerify, SignJWT, type JWTPayload } from 'jose'
import { getPayload } from 'payload'
import postgres from 'postgres'
import config from '@payload-config'
import type { NextRequest, NextResponse } from 'next/server'
import { CAMPUS_SESSION_COOKIE, campusJwtSecret } from './environment'

const campusDatabaseUrl = process.env.DATABASE_URL ?? process.env.DATABASE_URI
export const campusSql = campusDatabaseUrl ? postgres(campusDatabaseUrl) : null

export interface CampusStudent {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  avatar: string | null
  tenantId: string | number | null
}

export interface CampusEnrollment {
  id: string
  courseRunId: string | null
  courseId: string | null
  courseTitle: string
  courseRunTitle: string
  courseThumbnail: string | null
  status: string
  startedAt?: string
  completedAt?: string
}

export interface CampusSession {
  student: CampusStudent
  enrollments: CampusEnrollment[]
  token: JWTPayload
}

export interface CampusAdminSession {
  id: string
  role: string
  tenantId: string | number | null
}

interface StudentDocument {
  id: string | number
  email?: string
  first_name?: string
  last_name?: string
  firstName?: string
  lastName?: string
  status?: string
  password_hash?: string
  passwordHash?: string
  last_login_at?: string
  tenant?: string | number | { id?: string | number }
  photo?: { url?: string }
  avatar?: { url?: string }
}

interface CampusPayload {
  find: (args: Record<string, unknown>) => Promise<{ docs: unknown[] }>
  findByID: (args: Record<string, unknown>) => Promise<unknown>
  update: (args: Record<string, unknown>) => Promise<unknown>
}

export function relatedId(value: unknown): string | null {
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id?: string | number }).id
    return id === undefined || id === null ? null : String(id)
  }
  return typeof value === 'string' || typeof value === 'number' ? String(value) : null
}

function tenantIdOf(tenant: StudentDocument['tenant']): string | number | null {
  if (typeof tenant === 'object' && tenant !== null) return tenant.id ?? null
  return typeof tenant === 'string' || typeof tenant === 'number' ? tenant : null
}

function normalizeStudent(document: StudentDocument): CampusStudent {
  const firstName = document.first_name ?? document.firstName ?? ''
  const lastName = document.last_name ?? document.lastName ?? ''
  return {
    id: String(document.id),
    email: String(document.email ?? '').toLowerCase(),
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    avatar: document.photo?.url ?? document.avatar?.url ?? null,
    tenantId: tenantIdOf(document.tenant),
  }
}

function studentDocumentFromRow(row: Record<string, unknown>): StudentDocument {
  return {
    id: String(row.id ?? ''),
    email: typeof row.email === 'string' ? row.email : undefined,
    first_name: typeof row.first_name === 'string' ? row.first_name : undefined,
    last_name: typeof row.last_name === 'string' ? row.last_name : undefined,
    status: typeof row.status === 'string' ? row.status : undefined,
    password_hash: typeof row.password_hash === 'string' ? row.password_hash : undefined,
    last_login_at: typeof row.last_login_at === 'string' ? row.last_login_at : undefined,
    tenant: typeof row.tenant_id === 'number' || typeof row.tenant_id === 'string'
      ? row.tenant_id
      : null,
  }
}

export function normalizedCampusEmail(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F\u00A0\u200B-\u200D\uFEFF]/g, '').trim().toLowerCase()
}

export function hashCampusAuthToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function generateCampusAuthToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function studentPasswordHash(document: StudentDocument): string | null {
  return document.password_hash ?? document.passwordHash ?? null
}

export async function findStudentByEmail(email: string): Promise<{ document: StudentDocument; student: CampusStudent } | null> {
  if (!campusSql) return null

  const normalizedEmail = normalizedCampusEmail(email)
  const rows = await campusSql`
    SELECT id, email, first_name, last_name, status::text, password_hash, tenant_id, last_login_at
    FROM students
    WHERE LOWER(email) = ${normalizedEmail}
      AND status::text = 'active'
    LIMIT 1
  `
  const document = rows[0] ? studentDocumentFromRow(rows[0] as Record<string, unknown>) : undefined
  return document ? { document, student: normalizeStudent(document) } : null
}

export async function findStudentByIdForAdmin(id: string): Promise<StudentDocument | null> {
  const payload = (await getPayload({ config })) as unknown as CampusPayload
  return (await payload.findByID({
    collection: 'students',
    id,
    overrideAccess: true,
    depth: 0,
  })) as StudentDocument | null
}

export async function readCampusAdminSession(request: NextRequest): Promise<CampusAdminSession | null> {
  try {
    const payload = (await getPayload({ config })) as unknown as CampusPayload & {
      auth: (args: { collection: string; headers: Headers }) => Promise<{ user?: { id: string | number; role?: string; tenant?: string | number | { id?: string | number } } }>
    }

    const token = request.cookies.get('payload-token')?.value
    const requestHeaders = new Headers(request.headers)
    const attempts: Headers[] = [requestHeaders]
    if (token) {
      attempts.push(
        new Headers({ cookie: `payload-token=${token}`, DisableAutologin: 'true' }),
        new Headers({ authorization: `JWT ${token}`, DisableAutologin: 'true' }),
        new Headers({ authorization: `Bearer ${token}`, DisableAutologin: 'true' }),
      )
    }

    for (const headers of attempts) {
      try {
        const result = await payload.auth({ collection: 'users', headers })
        const user = result?.user
        if (!user || !['superadmin', 'admin', 'gestor'].includes(user.role ?? '')) continue
        return {
          id: String(user.id),
          role: user.role ?? '',
          tenantId: tenantIdOf(user.tenant),
        }
      } catch {
        // Try the next canonical Payload auth representation.
      }
    }

    return null
  } catch {
    return null
  }
}

export async function findStudentById(id: string): Promise<{ document: StudentDocument; student: CampusStudent } | null> {
  if (!campusSql) return null

  const numericStudentId = Number(id)
  if (!Number.isInteger(numericStudentId) || numericStudentId <= 0) return null

  const rows = await campusSql`
    SELECT id, email, first_name, last_name, status::text, password_hash, tenant_id, last_login_at
    FROM students
    WHERE id = ${numericStudentId}
    LIMIT 1
  `
  const document = rows[0] ? studentDocumentFromRow(rows[0] as Record<string, unknown>) : null
  if (!document || document.status !== 'active') return null
  return { document, student: normalizeStudent(document) }
}

export async function findCampusEnrollments(studentId: string, tenantId?: string | number | null): Promise<CampusEnrollment[]> {
  if (!campusSql) return []
  const numericStudentId = Number(studentId)
  if (!Number.isInteger(numericStudentId) || numericStudentId <= 0) return []

  const numericTenantId = tenantId === null || tenantId === undefined ? null : Number(tenantId)
  const rows = await campusSql`
    SELECT
      ce.enrollment_id,
      e.status::text AS enrollment_status,
      e.enrolled_at,
      e.completed_at,
      cr.id AS course_run_id,
      cr.codigo AS course_run_title,
      cr.course_id,
      c.name AS course_title
    FROM campus_enrollments ce
    INNER JOIN enrollments e ON e.id = ce.enrollment_id
    LEFT JOIN course_runs cr ON cr.id = e.course_run_id
    LEFT JOIN courses c ON c.id = cr.course_id
    WHERE ce.student_id = ${numericStudentId}
      AND ce.status = 'active'
      AND e.status::text NOT IN ('cancelled', 'withdrawn')
      AND (${numericTenantId}::integer IS NULL OR ce.tenant_id = ${numericTenantId})
    ORDER BY e.enrolled_at DESC NULLS LAST, ce.created_at DESC
    LIMIT 500
  `

  return rows.map((row) => ({
    id: String(row.enrollment_id),
    courseRunId: row.course_run_id === null ? null : String(row.course_run_id),
    courseId: row.course_id === null ? null : String(row.course_id),
    courseTitle: String(row.course_title ?? 'Curso'),
    courseRunTitle: String(row.course_run_title ?? ''),
    courseThumbnail: null,
    status: String(row.enrollment_status ?? 'pending'),
    startedAt: row.enrolled_at ? new Date(row.enrolled_at).toISOString() : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
  }))
}

export function setCampusSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(CAMPUS_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
}

export function clearCampusSessionCookie(response: NextResponse): void {
  response.cookies.set(CAMPUS_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

function requestToken(request: NextRequest): string | null {
  const authorization = request.headers.get('authorization')
  if (authorization?.startsWith('Bearer ')) return authorization.slice(7).trim() || null
  return request.cookies.get(CAMPUS_SESSION_COOKIE)?.value ?? null
}

export async function readCampusSession(request: NextRequest): Promise<CampusSession | null> {
  const secret = campusJwtSecret()
  const token = requestToken(request)
  if (!secret || !token) return null

  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] })
    if (payload.type !== 'campus' || typeof payload.sub !== 'string') return null
    const result = await findStudentById(payload.sub)
    if (!result) return null
    return {
      student: result.student,
      enrollments: await findCampusEnrollments(result.student.id, result.student.tenantId),
      token: payload,
    }
  } catch {
    return null
  }
}

export async function createCampusToken(student: CampusStudent): Promise<string> {
  const secret = campusJwtSecret()
  if (!secret) throw new Error('CAMPUS_JWT_SECRET no esta configurado o es demasiado corto')
  return new SignJWT({
    email: student.email,
    tenantId: student.tenantId,
    type: 'campus',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(student.id)
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret)
}

export async function verifyStudentPassword(document: StudentDocument, password: string): Promise<boolean> {
  const hash = studentPasswordHash(document)
  return Boolean(hash && password && await bcrypt.compare(password, hash))
}

export async function updateLastLogin(studentId: string): Promise<void> {
  const numericStudentId = Number(studentId)
  if (!campusSql || !Number.isInteger(numericStudentId) || numericStudentId <= 0) return

  await campusSql`
    UPDATE students
    SET last_login_at = NOW()
    WHERE id = ${numericStudentId}
  `
}

export async function campusEnrollmentBelongsToStudent(studentId: string, enrollmentId: string): Promise<boolean> {
  const result = await findStudentById(studentId)
  if (!result) return false
  return (await findCampusEnrollments(studentId, result.student.tenantId)).some((enrollment) => enrollment.id === String(enrollmentId))
}
