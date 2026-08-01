export type CampusUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  avatarUrl?: string
  tenantId: number
  roles: ['student']
}

export type CampusDashboardEnrollment = {
  id: string
  courseTitle: string
  courseRunTitle: string
  status: string
  progressPercent: number
  totalModules: number
  completedModules: number
  lastAccessedAt: string | null
  estimatedMinutesRemaining: number
}

export type CampusDashboard = {
  enrollments: CampusDashboardEnrollment[]
  stats: {
    totalCourses: number
    completedCourses: number
    currentStreak: number
    totalBadges: number
    totalPoints: number
  }
}

export class CampusApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
    this.name = 'CampusApiError'
  }
}

function endpoint(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, '')}${path}`
}

async function responseJson(response: Response): Promise<Record<string, unknown>> {
  const body = await response.json().catch(() => ({}))
  return typeof body === 'object' && body !== null ? body as Record<string, unknown> : {}
}

function userFrom(body: Record<string, unknown>): CampusUser {
  const student = body.student
  if (!body.success || typeof student !== 'object' || student === null) {
    throw new CampusApiError(502, 'Respuesta de sesión no válida.')
  }
  const value = student as Record<string, unknown>
  const tenantId = Number(value.tenantId)
  if (!value.id || typeof value.email !== 'string' || !Number.isSafeInteger(tenantId) || tenantId <= 0) {
    throw new CampusApiError(502, 'Identidad de campus no válida.')
  }
  return {
    id: String(value.id),
    email: value.email,
    firstName: typeof value.firstName === 'string' ? value.firstName : '',
    lastName: typeof value.lastName === 'string' ? value.lastName : '',
    avatarUrl: typeof value.avatar === 'string' ? value.avatar : undefined,
    tenantId,
    roles: ['student'],
  }
}

async function checked(response: Response) {
  const body = await responseJson(response)
  if (!response.ok) {
    throw new CampusApiError(response.status, typeof body.error === 'string' ? body.error : 'Solicitud no válida.')
  }
  return body
}

export async function fetchCampusSession(baseUrl: string): Promise<CampusUser | null> {
  const response = await fetch(endpoint(baseUrl, '/api/campus/auth/session'), {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  if (response.status === 401) return null
  return userFrom(await checked(response))
}

export async function loginCampus(baseUrl: string, email: string, password: string): Promise<CampusUser> {
  const response = await fetch(endpoint(baseUrl, '/api/campus/auth/login'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return userFrom(await checked(response))
}

export async function logoutCampus(baseUrl: string): Promise<void> {
  const response = await fetch(endpoint(baseUrl, '/api/campus/auth/logout'), {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  await checked(response)
}

export async function fetchCampusDashboard(baseUrl: string): Promise<CampusDashboard> {
  const body = await checked(await fetch(endpoint(baseUrl, '/api/campus/dashboard'), {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  }))
  if (!Array.isArray(body.enrollments) || typeof body.stats !== 'object' || body.stats === null) {
    throw new CampusApiError(502, 'Respuesta de dashboard no válida.')
  }
  return {
    enrollments: body.enrollments,
    stats: body.stats,
  } as CampusDashboard
}
