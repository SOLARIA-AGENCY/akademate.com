import assert from 'node:assert/strict'
import test from 'node:test'

import type { LearningSqlClient } from '../learning/next-learning-transaction.ts'
import {
  NextPublicOfferError,
  getNextPublicOffer,
} from './public-offer-query.ts'

type Row = Record<string, unknown>

const storedOffer = {
  tenant_slug: 'north-star',
  tenant_name: 'North Star Academy',
  tenant_domain: 'learn.northstar.example',
  tenant_logo_url: '/media/north-star.svg',
  tenant_primary_color: '#2457F5',
  tenant_contact_email: 'hello@northstar.example',
  course_run_id: 12,
  course_id: 5,
  course_name: 'Creative Leadership',
  short_description: 'Build confident, collaborative leadership habits.',
  modality: 'hybrid',
  duration_hours: 16,
  course_image_url: '/media/creative-leadership.webp',
  code: 'CL-2026-09',
  starts_at: '2026-09-12T09:00:00.000Z',
  ends_at: '2026-09-13T17:00:00.000Z',
  enrollment_deadline: '2026-09-10T23:59:59.000Z',
  schedule_time_start: '09:00',
  schedule_time_end: '17:00',
  max_students: 24,
  current_enrollments: 16,
  campus_name: 'Central Campus',
  campus_city: 'Malmö',
  campus_address: 'Example 12',
  publication_access: 'unlisted',
  conversion_mode: 'external_link',
  share_slug: 'creative-leadership-weekend',
  form_template_key: null,
  external_action_url: 'https://events.example.test/creative-leadership',
  payment_plan: null,
  offer_price_amount: null,
  deposit_amount: null,
  cta_label: 'Reserve your place',
  capacity_policy: 'limited',
}

function fakeClient(rows: Row[], ticketRows: Row[] = []) {
  const calls: Array<{ query: string; params: unknown[] }> = []
  const tx: LearningSqlClient = {
    async unsafe<T extends Row>(query: string, params: unknown[] = []) {
      calls.push({ query: query.replace(/\s+/g, ' ').trim(), params })
      if (query.includes('akademate_next_get_public_offer_ticket_types')) return ticketRows as T[]
      return rows as T[]
    },
  }
  return { calls, tx }
}

test('maps the bounded public ticket projection without trusting persisted money types', async () => {
  const { tx } = fakeClient([
    {
      ...storedOffer,
      conversion_mode: 'free_registration',
      external_action_url: null,
      cta_label: 'Register',
    },
  ], [{
    ticket_id: '101',
    ticket_slug: 'standard',
    ticket_name: 'Standard ticket',
    ticket_description: 'Access to the full workshop.',
    ticket_kind: 'paid',
    price_amount: '149.50',
    deposit_amount: null,
    capacity: '24',
    max_per_registration: '2',
    sales_start: '2026-08-01T00:00:00.000Z',
    sales_end: null,
    sort_order: '0',
  }])

  const offer = await getNextPublicOffer({
    tx,
    host: 'learn.northstar.example',
    shareSlug: 'creative-leadership-weekend',
  })

  assert.deepEqual(offer.ticketTypes, [{
    id: 101,
    slug: 'standard',
    name: 'Standard ticket',
    description: 'Access to the full workshop.',
    ticketKind: 'paid',
    priceAmount: 149.5,
    depositAmount: null,
    capacity: 24,
    maxPerRegistration: 2,
    salesStart: '2026-08-01T00:00:00.000Z',
    salesEnd: null,
    sortOrder: 0,
  }])
})

test('loads only the sanitized public projection for an exact host and slug', async () => {
  const { calls, tx } = fakeClient([storedOffer])
  const offer = await getNextPublicOffer({
    tx,
    host: 'LEARN.NORTHSTAR.EXAMPLE:443',
    shareSlug: 'creative-leadership-weekend',
  })

  assert.equal(offer.tenantName, 'North Star Academy')
  assert.equal(offer.availablePlaces, 8)
  assert.equal(offer.conversionMode, 'external_link')
  assert.equal(offer.externalActionUrl, 'https://events.example.test/creative-leadership')
  assert.equal(calls.length, 2)
  assert.match(calls[0]?.query ?? '', /akademate_next_get_public_offer\(\$1, \$2\)/)
  assert.deepEqual(calls[0]?.params, ['learn.northstar.example', 'creative-leadership-weekend'])
  assert.match(calls[1]?.query ?? '', /akademate_next_get_public_offer_ticket_types\(\$1, \$2\)/)
  assert.deepEqual(calls[1]?.params, ['learn.northstar.example', 'creative-leadership-weekend'])
})
test('fails closed for base, reserved, malformed and credential-bearing hosts', async () => {
  const { calls, tx } = fakeClient([storedOffer])
  for (const host of [
    'akademate.com',
    'www.akademate.com',
    'api.akademate.com',
    'tenant.example.com@evil.example',
    'https://tenant.akademate.com',
    'tenant..akademate.com',
    'tenant.akademate.com/path',
  ]) {
    await assert.rejects(
      getNextPublicOffer({ tx, host, shareSlug: 'creative-leadership-weekend' }),
      (error: unknown) => error instanceof NextPublicOfferError
        && error.code === 'public_offer_host_invalid',
    )
  }
  assert.equal(calls.length, 0)
})

test('rejects non-canonical share slugs before querying', async () => {
  const { calls, tx } = fakeClient([storedOffer])
  for (const shareSlug of ['A-Course', 'a_course', '../course', 'ab', 'course--name']) {
    await assert.rejects(
      getNextPublicOffer({ tx, host: 'north-star.akademate.com', shareSlug }),
      (error: unknown) => error instanceof NextPublicOfferError
        && error.code === 'public_offer_slug_invalid',
    )
  }
  assert.equal(calls.length, 0)
})

test('returns the same not-found boundary for private, draft and cross-tenant misses', async () => {
  const { tx } = fakeClient([])
  await assert.rejects(
    getNextPublicOffer({
      tx,
      host: 'other-tenant.akademate.com',
      shareSlug: 'creative-leadership-weekend',
    }),
    (error: unknown) => error instanceof NextPublicOfferError
      && error.code === 'public_offer_not_found',
  )
})
