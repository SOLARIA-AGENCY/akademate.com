import type {
  LearningSqlClient,
  NextLearningPrincipal,
} from '../learning/next-learning-transaction.ts'
import {
  EventTicketTypeInputSchema,
  mapEventTicketType,
  parseEventTicketTypeId,
  type EventTicketTypeRecord,
  NextEventTicketTypeError,
} from './event-ticket-type.ts'

const MANAGER_ROLES = new Set(['superadmin', 'admin', 'gestor', 'marketing'])

type TicketRow = {
  id: number | string
  course_run_id: number | string
  slug: string
  name: string
  description: string | null
  ticket_kind: string
  price_amount: number | string
  deposit_amount: number | string | null
  capacity: number | string | null
  max_per_registration: number | string
  sales_start: string | Date | null
  sales_end: string | Date | null
  sort_order: number | string
  is_active: boolean
}

function fail(code: string): never {
  throw new NextEventTicketTypeError(code)
}

function requireManager(principal: NextLearningPrincipal): void {
  if (!MANAGER_ROLES.has(principal.platformRole)) fail('ticket_types_forbidden')
}

function positiveCourseRunId(value: string | number): number {
  if (typeof value === 'string' && !/^[1-9]\d*$/.test(value)) fail('course_run_id_invalid')
  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isSafeInteger(id) || id <= 0) fail('course_run_id_invalid')
  return id
}

function toDbTimestamp(value: string | null | undefined): string | null {
  if (value === undefined || value === null || value === '') return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) fail('ticket_input_invalid')
  return date.toISOString()
}

const columns = `
  id, course_run_id, slug, name, description, ticket_kind, price_amount,
  deposit_amount, capacity, max_per_registration, sales_start, sales_end,
  sort_order, is_active
`

export async function listNextEventTicketTypes({
  tx,
  principal,
  courseRunId: rawCourseRunId,
}: {
  tx: LearningSqlClient
  principal: NextLearningPrincipal
  courseRunId: string | number
}): Promise<EventTicketTypeRecord[]> {
  requireManager(principal)
  const courseRunId = positiveCourseRunId(rawCourseRunId)
  const rows = await tx.unsafe<TicketRow>(
    `
    SELECT ${columns}
    FROM event_offer_ticket_types
    WHERE tenant_id = $1 AND course_run_id = $2
    ORDER BY sort_order, id
  `,
    [principal.tenantId, courseRunId]
  )
  return rows.map(mapEventTicketType)
}

export async function upsertNextEventTicketType({
  tx,
  principal,
  courseRunId: rawCourseRunId,
  input: rawInput,
}: {
  tx: LearningSqlClient
  principal: NextLearningPrincipal
  courseRunId: string | number
  input: unknown
}): Promise<EventTicketTypeRecord> {
  requireManager(principal)
  const courseRunId = positiveCourseRunId(rawCourseRunId)
  const parsed = EventTicketTypeInputSchema.parse(rawInput)
  const rows = await tx.unsafe<TicketRow>(
    `
    INSERT INTO event_offer_ticket_types (
      tenant_id, course_run_id, slug, name, description, ticket_kind,
      price_amount, deposit_amount, capacity, max_per_registration,
      sales_start, sales_end, sort_order, is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    ON CONFLICT (tenant_id, course_run_id, slug)
    DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      ticket_kind = EXCLUDED.ticket_kind,
      price_amount = EXCLUDED.price_amount,
      deposit_amount = EXCLUDED.deposit_amount,
      capacity = EXCLUDED.capacity,
      max_per_registration = EXCLUDED.max_per_registration,
      sales_start = EXCLUDED.sales_start,
      sales_end = EXCLUDED.sales_end,
      sort_order = EXCLUDED.sort_order,
      is_active = EXCLUDED.is_active,
      updated_at = NOW()
    WHERE event_offer_ticket_types.tenant_id = $1
      AND event_offer_ticket_types.course_run_id = $2
    RETURNING ${columns}
  `,
    [
      principal.tenantId,
      courseRunId,
      parsed.slug,
      parsed.name,
      parsed.description || null,
      parsed.ticketKind,
      parsed.priceAmount,
      parsed.depositAmount ?? null,
      parsed.capacity ?? null,
      parsed.maxPerRegistration,
      toDbTimestamp(parsed.salesStart),
      toDbTimestamp(parsed.salesEnd),
      parsed.sortOrder,
      parsed.isActive,
    ]
  )
  return mapEventTicketType(rows[0])
}

export async function deleteNextEventTicketType({
  tx,
  principal,
  courseRunId: rawCourseRunId,
  ticketTypeId: rawTicketTypeId,
}: {
  tx: LearningSqlClient
  principal: NextLearningPrincipal
  courseRunId: string | number
  ticketTypeId: string | number
}): Promise<void> {
  requireManager(principal)
  const courseRunId = positiveCourseRunId(rawCourseRunId)
  const ticketTypeId = parseEventTicketTypeId(rawTicketTypeId)
  const result = await tx.unsafe<{ id: number }>(
    `
    DELETE FROM event_offer_ticket_types
    WHERE tenant_id = $1 AND course_run_id = $2 AND id = $3
    RETURNING id
  `,
    [principal.tenantId, courseRunId, ticketTypeId]
  )
  if (!result[0]) fail('ticket_type_not_found')
}
