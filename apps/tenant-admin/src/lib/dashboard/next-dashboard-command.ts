import { z } from 'zod'

import type {
  LearningSqlClient,
  NextLearningPrincipal,
} from '../learning/next-learning-transaction.ts'

const DASHBOARD_ROLES = new Set([
  'superadmin',
  'admin',
  'gestor',
  'marketing',
  'asesor',
  'lectura',
])

const nonNegativeInteger = z.coerce.number().int().nonnegative()

const nextDashboardSchema = z.object({
  generatedAt: z.iso.datetime(),
  metrics: z.object({
    courses: nonNegativeInteger,
    activeStudents: nonNegativeInteger,
    activeTeachers: nonNegativeInteger,
    campuses: nonNegativeInteger,
    activeCourseRuns: nonNegativeInteger,
    confirmedEnrollments: nonNegativeInteger,
    pendingRequests: nonNegativeInteger,
  }).strict(),
  attention: z.object({
    pendingReview: nonNegativeInteger,
    waitlisted: nonNegativeInteger,
    paymentReview: nonNegativeInteger,
  }).strict(),
  upcomingRuns: z.array(z.object({
    id: z.coerce.number().int().positive(),
    courseName: z.string().trim().min(1).max(240),
    code: z.string().trim().min(1).max(120),
    status: z.enum(['published', 'enrollment_open', 'enrollment_closed', 'in_progress']),
    startsAt: z.iso.datetime(),
    availablePlaces: nonNegativeInteger.nullable(),
  }).strict()).max(5),
  recentActivity: z.array(z.object({
    id: z.string().regex(/^submission-[1-9]\d*$/),
    kind: z.enum(['interest', 'application', 'registration_request']),
    title: z.string().trim().min(1).max(120),
    detail: z.string().trim().min(1).max(240),
    occurredAt: z.iso.datetime(),
    href: z.literal('/dashboard/cursos/solicitudes'),
  }).strict()).max(5),
}).strict()

export type NextDashboard = z.infer<typeof nextDashboardSchema>

type DashboardRow = { projection: unknown }

export class NextDashboardError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = 'NextDashboardError'
    this.code = code
  }
}

function fail(code: string): never {
  throw new NextDashboardError(code)
}

export async function getNextDashboard({
  tx,
  principal,
}: {
  tx: LearningSqlClient
  principal: NextLearningPrincipal
}): Promise<NextDashboard> {
  if (!DASHBOARD_ROLES.has(principal.platformRole)) fail('dashboard_forbidden')

  const rows = await tx.unsafe<DashboardRow>(`
    SELECT akademate_next_get_dashboard() AS projection
  `, [])
  const parsed = nextDashboardSchema.safeParse(rows[0]?.projection)
  if (!parsed.success) fail('dashboard_projection_invalid')
  return parsed.data
}
