import assert from 'node:assert/strict'
import test from 'node:test'

import type { NextLearningPrincipal } from '../learning/next-learning-transaction.ts'
import {
  deleteNextEventTicketType,
  listNextEventTicketTypes,
  upsertNextEventTicketType,
} from './event-ticket-type-command.ts'
import { NextEventTicketTypeError } from './event-ticket-type.ts'

const principal: NextLearningPrincipal = {
  userId: 7, tenantId: 11, active: true, platformRole: 'gestor',
}

function fakeClient(rows: Record<string, unknown>[] = []) {
  const calls: Array<{ query: string; params: unknown[] }> = []
  return {
    calls,
    unsafe: async <T extends Record<string, unknown>>(query: string, params: unknown[] = []) => {
      calls.push({ query, params })
      return rows as T[]
    },
  }
}

const row = {
  id: 4, course_run_id: 42, slug: 'standard-entry', name: 'Standard entry', description: null,
  ticket_kind: 'paid', price_amount: '120', deposit_amount: null, capacity: 30,
  max_per_registration: 2, sales_start: null, sales_end: null, sort_order: 0, is_active: true,
}

test('lists tickets through tenant-bound SQL and keeps ordering in the query', async () => {
  const client = fakeClient([row])
  const result = await listNextEventTicketTypes({ tx: client, principal, courseRunId: '42' })
  assert.equal(result[0]?.slug, 'standard-entry')
  assert.match(client.calls[0]?.query ?? '', /tenant_id = \$1 AND course_run_id = \$2/)
  assert.deepEqual(client.calls[0]?.params, [11, 42])
})
test('upserts server-owned tenant and run with normalized nullable values', async () => {
  const client = fakeClient([row])
  const result = await upsertNextEventTicketType({
    tx: client,
    principal,
    courseRunId: 42,
    input: {
      slug: 'standard-entry', name: 'Standard entry', ticketKind: 'paid', priceAmount: 120,
      capacity: 30, maxPerRegistration: 2, sortOrder: 0, isActive: true,
    },
  })
  assert.equal(result.id, 4)
  assert.match(client.calls[0]?.query ?? '', /ON CONFLICT \(tenant_id, course_run_id, slug\)/)
  assert.deepEqual(client.calls[0]?.params.slice(0, 3), [11, 42, 'standard-entry'])
})

test('rejects unauthorized roles and malformed identifiers before SQL', async () => {
  const client = fakeClient([row])
  await assert.rejects(
    listNextEventTicketTypes({ tx: client, principal: { ...principal, platformRole: 'student' }, courseRunId: 42 }),
    (error: unknown) => error instanceof NextEventTicketTypeError && error.code === 'ticket_types_forbidden',
  )
  await assert.rejects(
    deleteNextEventTicketType({ tx: client, principal, courseRunId: '0', ticketTypeId: 4 }),
    (error: unknown) => error instanceof NextEventTicketTypeError && error.code === 'course_run_id_invalid',
  )
  assert.equal(client.calls.length, 0)
})
