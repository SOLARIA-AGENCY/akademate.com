import assert from 'node:assert/strict'
import test from 'node:test'

import {
  EventTicketTypeInputSchema,
  NextEventTicketTypeError,
  mapEventTicketType,
  parseEventTicketTypeInput,
} from './event-ticket-type.ts'

const valid = {
  slug: 'standard-entry',
  name: 'Standard entry',
  description: 'Access to the workshop.',
  ticketKind: 'paid' as const,
  priceAmount: 120,
  maxPerRegistration: 2,
  sortOrder: 0,
  isActive: true,
}

test('accepts free, paid and deposit ticket invariants', () => {
  assert.equal(parseEventTicketTypeInput({ ...valid, ticketKind: 'free', priceAmount: 0 }).ticketKind, 'free')
  assert.equal(parseEventTicketTypeInput(valid).priceAmount, 120)
  assert.equal(parseEventTicketTypeInput({ ...valid, ticketKind: 'deposit', depositAmount: 30 }).depositAmount, 30)
})
test('rejects invalid ticket money, slug and sales windows before persistence', () => {
  for (const input of [
    { ...valid, ticketKind: 'free', priceAmount: 1 },
    { ...valid, ticketKind: 'deposit', depositAmount: 120 },
    { ...valid, slug: 'Not valid' },
    { ...valid, salesStart: '2026-08-10T10:00:00+02:00', salesEnd: '2026-08-09T10:00:00+02:00' },
  ]) {
    assert.throws(() => EventTicketTypeInputSchema.parse(input))
  }
})

test('maps a bounded database record without accepting malformed persisted state', () => {
  const mapped = mapEventTicketType({
    id: '5', course_run_id: 42, slug: 'standard-entry', name: 'Standard entry',
    description: null, ticket_kind: 'paid', price_amount: '120.00', deposit_amount: null,
    capacity: '30', max_per_registration: '2', sales_start: null, sales_end: null,
    sort_order: '0', is_active: true,
  })
  assert.deepEqual(mapped, {
    id: 5, courseRunId: 42, slug: 'standard-entry', name: 'Standard entry', description: null,
    ticketKind: 'paid', priceAmount: 120, depositAmount: null, capacity: 30,
    maxPerRegistration: 2, salesStart: null, salesEnd: null, sortOrder: 0, isActive: true,
  })
  assert.throws(
    () => mapEventTicketType({
      id: '5', course_run_id: 42, slug: 'bad', name: 'Bad', description: null, ticket_kind: 'unknown',
      price_amount: 'x', deposit_amount: null, capacity: null, max_per_registration: '1',
      sales_start: null, sales_end: null, sort_order: '0', is_active: true,
    }),
    (error: unknown) => error instanceof NextEventTicketTypeError
      && error.code === 'ticket_persistence_invalid',
  )
})
