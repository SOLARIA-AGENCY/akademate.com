import { z } from 'zod'

import type { LearningSqlClient, NextLearningPrincipal } from '../learning/next-learning-transaction.ts'

const REVIEWER_ROLES = new Set(['superadmin', 'admin', 'gestor'])
const dateValue = z.union([z.string(), z.date()]).nullable()
const nullableText = z.string().nullable()

const rowSchema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(['pending', 'confirmed', 'waitlisted', 'cancelled', 'completed', 'withdrawn']),
  payment_status: z.enum(['pending', 'partial', 'paid', 'refunded', 'waived']),
  total_amount: z.coerce.number(),
  amount_paid: z.coerce.number(),
  financial_aid_applied: z.boolean(),
  financial_aid_amount: z.coerce.number().nullable(),
  financial_aid_status: nullableText,
  notes: nullableText,
  cancellation_reason: nullableText,
  enrolled_at: dateValue,
  confirmed_at: dateValue,
  completed_at: dateValue,
  cancelled_at: dateValue,
  student_id: z.coerce.number().int().positive(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  phone: z.string(),
  course_run_id: z.coerce.number().int().positive(),
  course_run_code: nullableText,
  course_run_status: nullableText,
  course_run_start_date: dateValue,
  course_run_end_date: dateValue,
  max_students: z.coerce.number().nullable(),
  current_enrollments: z.coerce.number(),
  course_id: z.coerce.number().int().positive(),
  course_name: z.string(),
  campus_id: z.coerce.number().int().positive().nullable(),
  campus_name: nullableText,
}).strict()

export type NextEnrollmentDetail = {
  id: number
  status: z.infer<typeof rowSchema>['status']
  payment_status: z.infer<typeof rowSchema>['payment_status']
  total_amount: number
  amount_paid: number
  financial_aid_applied: boolean
  financial_aid_amount: number
  financial_aid_status: string | null
  notes: string | null
  cancellation_reason: string | null
  enrolled_at: string | null
  confirmed_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  lead: { id: number; first_name: string; last_name: string; email: string; phone: string }
  course_run: {
    id: number
    code: string | null
    status: string | null
    start_date: string | null
    end_date: string | null
    max_students: number | null
    current_enrollments: number
  }
  course: { id: number; name: string }
  campus: { id: number | null; name: string | null }
}

export class NextEnrollmentDetailError extends Error {
  readonly code: string
  constructor(code: string) {
    super(code)
    this.name = 'NextEnrollmentDetailError'
    this.code = code
  }
}

function fail(code: string): never {
  throw new NextEnrollmentDetailError(code)
}

function positiveId(value: string | number): number {
  const raw = String(value)
  if (!/^[1-9]\d*$/.test(raw)) fail('enrollment_detail_request_invalid')
  const parsed = Number(raw)
  if (!Number.isSafeInteger(parsed)) fail('enrollment_detail_request_invalid')
  return parsed
}

function iso(value: string | Date | null): string | null {
  if (value === null) return null
  return value instanceof Date ? value.toISOString() : value
}

export async function getNextEnrollmentDetail({
  tx,
  principal,
  enrollmentId,
}: {
  tx: LearningSqlClient
  principal: NextLearningPrincipal
  enrollmentId: string | number
}): Promise<NextEnrollmentDetail> {
  if (!REVIEWER_ROLES.has(principal.platformRole)) fail('enrollment_detail_forbidden')
  const id = positiveId(enrollmentId)
  const rows = await tx.unsafe<Record<string, unknown>>(`
    SELECT enrollment.id, enrollment.status::text, enrollment.payment_status::text,
      enrollment.total_amount, enrollment.amount_paid,
      enrollment.financial_aid_applied, enrollment.financial_aid_amount,
      enrollment.financial_aid_status::text, enrollment.notes,
      enrollment.cancellation_reason, enrollment.enrolled_at,
      enrollment.confirmed_at, enrollment.completed_at, enrollment.cancelled_at,
      learner.id AS student_id, learner.first_name, learner.last_name,
      learner.email, learner.phone,
      run.id AS course_run_id, run.codigo AS course_run_code,
      run.status::text AS course_run_status, run.start_date AS course_run_start_date,
      run.end_date AS course_run_end_date, run.max_students, run.current_enrollments,
      course.id AS course_id, course.name AS course_name,
      campus.id AS campus_id, campus.name AS campus_name
    FROM enrollments enrollment
    JOIN leads learner
      ON learner.tenant_id = enrollment.tenant_id AND learner.id = enrollment.student_id
    JOIN course_runs run
      ON run.tenant_id = enrollment.tenant_id AND run.id = enrollment.course_run_id
    JOIN courses course
      ON course.tenant_id = enrollment.tenant_id AND course.id = run.course_id
    LEFT JOIN campuses campus
      ON campus.tenant_id = enrollment.tenant_id AND campus.id = run.campus_id
    WHERE enrollment.id = $1 AND enrollment.tenant_id = $2
    LIMIT 1
  `, [id, principal.tenantId])
  if (rows.length === 0) fail('enrollment_not_found')
  const parsed = rowSchema.safeParse(rows[0])
  if (!parsed.success || rows.length !== 1 || parsed.data.id !== id) {
    fail('enrollment_detail_persistence_invalid')
  }
  const row = parsed.data
  return {
    id: row.id,
    status: row.status,
    payment_status: row.payment_status,
    total_amount: row.total_amount,
    amount_paid: row.amount_paid,
    financial_aid_applied: row.financial_aid_applied,
    financial_aid_amount: row.financial_aid_amount ?? 0,
    financial_aid_status: row.financial_aid_status,
    notes: row.notes,
    cancellation_reason: row.cancellation_reason,
    enrolled_at: iso(row.enrolled_at),
    confirmed_at: iso(row.confirmed_at),
    completed_at: iso(row.completed_at),
    cancelled_at: iso(row.cancelled_at),
    lead: {
      id: row.student_id,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      phone: row.phone,
    },
    course_run: {
      id: row.course_run_id,
      code: row.course_run_code,
      status: row.course_run_status,
      start_date: iso(row.course_run_start_date),
      end_date: iso(row.course_run_end_date),
      max_students: row.max_students,
      current_enrollments: row.current_enrollments,
    },
    course: { id: row.course_id, name: row.course_name },
    campus: { id: row.campus_id, name: row.campus_name },
  }
}
