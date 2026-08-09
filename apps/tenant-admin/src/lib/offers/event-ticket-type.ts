import { z } from 'zod'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const EventTicketTypeInputSchema = z
  .object({
    id: z.number().int().positive().optional(),
    slug: z.string().trim().min(3).max(120).regex(SLUG_PATTERN),
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).optional().or(z.literal('')),
    ticketKind: z.enum(['free', 'paid', 'deposit']),
    priceAmount: z.number().finite().min(0).max(1000000),
    depositAmount: z.number().finite().positive().max(1000000).optional(),
    capacity: z.number().int().positive().max(1000000).nullable().optional(),
    maxPerRegistration: z.number().int().min(1).max(20).default(1),
    salesStart: z.string().datetime({ offset: true }).nullable().optional(),
    salesEnd: z.string().datetime({ offset: true }).nullable().optional(),
    sortOrder: z.number().int().min(0).max(100000).default(0),
    isActive: z.boolean().default(true),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.ticketKind === 'free' &&
      (value.priceAmount !== 0 || value.depositAmount !== undefined)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['priceAmount'],
        message: 'free_ticket_must_be_zero',
      })
    }
    if (value.ticketKind === 'paid' && value.priceAmount <= 0) {
      context.addIssue({
        code: 'custom',
        path: ['priceAmount'],
        message: 'paid_ticket_requires_price',
      })
    }
    if (
      value.ticketKind === 'deposit' &&
      (value.priceAmount <= 0 ||
        value.depositAmount === undefined ||
        value.depositAmount <= 0 ||
        value.depositAmount >= value.priceAmount)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['depositAmount'],
        message: 'deposit_ticket_requires_valid_deposit',
      })
    }
    if (
      value.salesStart &&
      value.salesEnd &&
      new Date(value.salesEnd) <= new Date(value.salesStart)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['salesEnd'],
        message: 'ticket_sales_window_invalid',
      })
    }
  })

export type EventTicketTypeInput = z.infer<typeof EventTicketTypeInputSchema>

export type EventTicketTypeRecord = {
  id: number
  courseRunId: number
  slug: string
  name: string
  description: string | null
  ticketKind: EventTicketTypeInput['ticketKind']
  priceAmount: number
  depositAmount: number | null
  capacity: number | null
  maxPerRegistration: number
  salesStart: string | null
  salesEnd: string | null
  sortOrder: number
  isActive: boolean
}

export class NextEventTicketTypeError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = 'NextEventTicketTypeError'
    this.code = code
  }
}

export function parseEventTicketTypeInput(value: unknown): EventTicketTypeInput {
  return EventTicketTypeInputSchema.parse(value)
}

export function parseEventTicketTypeId(value: string | number): number {
  if (typeof value === 'string' && !/^[1-9]\d*$/.test(value)) {
    throw new NextEventTicketTypeError('ticket_id_invalid')
  }
  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isSafeInteger(id) || id <= 0) throw new NextEventTicketTypeError('ticket_id_invalid')
  return id
}

function numberOrNull(value: number | string | null): number | null {
  if (value === null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function isoOrNull(value: string | Date | null): string | null {
  if (value === null) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) throw new NextEventTicketTypeError('ticket_persistence_invalid')
  return date.toISOString()
}

export function mapEventTicketType(row: {
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
}): EventTicketTypeRecord {
  const ticketKind = z.enum(['free', 'paid', 'deposit']).safeParse(row.ticket_kind)
  const id = Number(row.id)
  const courseRunId = Number(row.course_run_id)
  const priceAmount = numberOrNull(row.price_amount)
  const depositAmount = numberOrNull(row.deposit_amount)
  const capacity = numberOrNull(row.capacity)
  const maxPerRegistration = Number(row.max_per_registration)
  const sortOrder = Number(row.sort_order)
  if (
    !ticketKind.success ||
    !Number.isSafeInteger(id) ||
    !Number.isSafeInteger(courseRunId) ||
    priceAmount === null ||
    (depositAmount !== null && !Number.isFinite(depositAmount)) ||
    (capacity !== null && (!Number.isSafeInteger(capacity) || capacity <= 0)) ||
    !Number.isSafeInteger(maxPerRegistration) ||
    !Number.isSafeInteger(sortOrder)
  )
    throw new NextEventTicketTypeError('ticket_persistence_invalid')
  return {
    id,
    courseRunId,
    slug: row.slug,
    name: row.name,
    description: row.description,
    ticketKind: ticketKind.data,
    priceAmount,
    depositAmount,
    capacity,
    maxPerRegistration,
    salesStart: isoOrNull(row.sales_start),
    salesEnd: isoOrNull(row.sales_end),
    sortOrder,
    isActive: row.is_active,
  }
}
