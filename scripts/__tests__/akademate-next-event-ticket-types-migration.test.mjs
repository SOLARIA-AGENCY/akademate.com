import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(
  'apps/tenant-admin/migrations/20260809_akademate_next_event_ticket_types.ts',
  'utf8'
)
const wrapper = await readFile(
  'apps/tenant-admin/migrations-next/20260809_akademate_next_event_ticket_types.ts',
  'utf8'
)

test('creates tenant-scoped ticket types with bounded money, capacity and sales invariants', () => {
  assert.match(source, /CREATE TABLE "event_offer_ticket_types"/)
  assert.match(source, /FOREIGN KEY \("tenant_id", "course_run_id"\)/)
  assert.match(source, /ticket_kind" IN \('free', 'paid', 'deposit'\)/)
  assert.match(source, /event_offer_ticket_types_money_check/)
  assert.match(source, /event_offer_ticket_types_capacity_check/)
  assert.match(source, /event_offer_ticket_types_max_check/)
  assert.match(source, /event_offer_ticket_types_sales_window_check/)
})

test('exposes a bounded public projection without public table grants', () => {
  assert.match(source, /CREATE FUNCTION "akademate_next_get_public_offer_ticket_types"/)
  assert.match(source, /current_setting\('app\.role', true\) = 'public_offer'/)
  assert.match(source, /REVOKE ALL ON "event_offer_ticket_types" FROM PUBLIC/)
  assert.match(source, /GRANT EXECUTE ON FUNCTION "akademate_next_get_public_offer_ticket_types"/)
  assert.match(
    wrapper,
    /^export \{ down, up \} from '\.\.\/migrations\/20260809_akademate_next_event_ticket_types'\s*$/
  )
})

test('guards rollback when ticket configuration exists', () => {
  assert.match(source, /Cannot roll back event ticket types while ticket configuration exists/)
})
