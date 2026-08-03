import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationUrl = new URL(
  '../../apps/tenant-admin/migrations/20260803_zzzzz_akademate_next_paid_offer_orders.ts',
  import.meta.url,
)

test('paid offer migration owns orders, holds and an append-only provider event ledger', async () => {
  const source = await readFile(migrationUrl, 'utf8')
  assert.match(source, /ADD COLUMN "current_checkout_holds" integer DEFAULT 0 NOT NULL/)
  assert.match(source, /CREATE TABLE "paid_offer_orders"/)
  assert.match(source, /CONSTRAINT "paid_offer_orders_tenant_id_id_unique"[\s\S]*UNIQUE \("tenant_id", "id"\)/)
  assert.match(source, /CREATE TABLE "paid_offer_payment_events"/)
  assert.match(source, /CHECK \("current_checkout_holds" >= 0\)/)
  assert.match(source, /UNIQUE \("provider", "provider_event_id"\)/)
  assert.match(source, /ALTER TABLE "paid_offer_orders" FORCE ROW LEVEL SECURITY/)
  assert.match(source, /ALTER TABLE "paid_offer_payment_events" FORCE ROW LEVEL SECURITY/)
  assert.doesNotMatch(source, /GRANT (INSERT|UPDATE|DELETE) ON "paid_offer_(orders|payment_events)"/)
})

test('public creation derives money and capacity while provider commands stay bounded', async () => {
  const source = await readFile(migrationUrl, 'utf8')
  assert.match(source, /CREATE FUNCTION "akademate_next_create_paid_offer_order"/)
  assert.match(source, /conversion_mode"::text = 'paid_registration'/)
  assert.match(source, /offer_price_amount" \* 100/)
  assert.match(source, /SELECT cr\.\*[\s\S]*INTO current_run/)
  assert.match(source, /resolved_tenant_id := current_run\."tenant_id"/)
  assert.doesNotMatch(source, /resolved_course_name/)
  assert.match(source, /current_run\."deposit_amount"/)
  assert.match(source, /current_run\."current_enrollments" \+ current_run\."current_checkout_holds"/)
  assert.match(source, /paid_offer_sold_out/)
  assert.match(source, /paid_offer_idempotency_conflict/)
  assert.match(source, /paid_offer_duplicate_contact/)
  assert.match(source, /CREATE FUNCTION "akademate_next_attach_paid_offer_checkout"/)
  assert.match(source, /CREATE FUNCTION "akademate_next_fail_paid_offer_checkout"/)
  assert.match(source, /CREATE FUNCTION "akademate_next_get_paypal_return"/)
  assert.match(source, /"id" = requested_order_id[\s\S]*"provider_order_id" = requested_provider_order_id/)
})

test('verified events alone can consume holds and create paid enrollments', async () => {
  const source = await readFile(migrationUrl, 'utf8')
  assert.match(source, /CREATE FUNCTION "akademate_next_reconcile_paid_offer_event"/)
  assert.match(source, /normalized_status NOT IN \('processing', 'succeeded', 'failed', 'cancelled'\)/)
  assert.match(source, /INSERT INTO public\."paid_offer_payment_events"/)
  assert.match(source, /IF normalized_status = 'processing'/)
  assert.match(source, /INSERT INTO public\."enrollments"/)
  assert.match(source, /current_checkout_holds" = "current_checkout_holds" - 1/)
  assert.match(source, /current_enrollments" = "current_enrollments" \+ 1/)
  assert.match(source, /payment_status".*CASE.*partial.*paid/s)
  assert.match(source, /END::public\.enum_enrollments_payment_status/)
  assert.match(source, /requires_review/)
  assert.match(source, /SET "status" = 'requires_review', "hold_active" = false/)
  assert.match(source, /ELSIF current_order\."status" = 'requires_review' THEN[\s\S]*manual_review := true/)
})

test('rollback refuses financial evidence and removes the isolated schema only when empty', async () => {
  const source = await readFile(migrationUrl, 'utf8')
  assert.match(source, /Cannot roll back paid offer orders while payment evidence exists/)
  assert.match(source, /DROP TABLE "paid_offer_payment_events"/)
  assert.match(source, /DROP TABLE "paid_offer_orders"/)
  assert.match(source, /DROP COLUMN "current_checkout_holds"/)
  assert.match(source, /assertAkademateNextRuntime/)
})
