import assert from 'node:assert/strict'
import test from 'node:test'

import type {
  LearningSqlClient,
  NextLearningPrincipal,
} from '../learning/next-learning-transaction.ts'
import {
  NextOfferConfigurationError,
  getNextOfferConfiguration,
  updateNextOfferConfiguration,
} from './offer-configuration-command.ts'

type Row = Record<string, unknown>

const principal: NextLearningPrincipal = {
  userId: 41,
  tenantId: 7,
  active: true,
  platformRole: 'gestor',
}

const storedOffer = {
  id: 12,
  tenant_id: 7,
  course_id: 5,
  course_name: 'Creative Leadership',
  codigo: 'CL-2026-09',
  start_date: '2026-09-12T09:00:00.000Z',
  end_date: '2026-09-13T17:00:00.000Z',
  publication_access: 'public',
  conversion_mode: 'interest_form',
  share_slug: 'creative-leadership-weekend',
  form_template_key: 'lead-standard',
  external_action_url: null,
  payment_plan: null,
  offer_price_amount: null,
  deposit_amount: null,
  cta_label: 'Request information',
  capacity_policy: 'limited',
}

function fakeClient(respond: (query: string, params: unknown[]) => Row[]) {
  const calls: Array<{ query: string; params: unknown[] }> = []
  const client: LearningSqlClient = {
    async unsafe<T extends Row>(query: string, params: unknown[] = []) {
      const normalized = query.replace(/\s+/g, ' ').trim()
      calls.push({ query: normalized, params })
      return respond(normalized, params) as T[]
    },
  }
  return { calls, client }
}

test('loads an offer through the server-derived tenant scope', async () => {
  const { client, calls } = fakeClient((query) => {
    if (query.startsWith('SELECT')) return [storedOffer]
    throw new Error(`unexpected query: ${query}`)
  })

  const result = await getNextOfferConfiguration({ tx: client, principal, courseRunId: '12' })

  assert.equal(result.courseRunId, 12)
  assert.equal(result.courseName, 'Creative Leadership')
  assert.equal(result.publicationAccess, 'public')
  assert.deepEqual(calls[0]?.params, [7, 12])
  assert.match(calls[0]?.query ?? '', /WHERE cr\.tenant_id = \$1 AND cr\.id = \$2/)
})

test('updates only the tenant-scoped course run with normalized nullable fields', async () => {
  const { client, calls } = fakeClient((query) => {
    if (query.startsWith('UPDATE course_runs')) {
      return [{
        ...storedOffer,
        conversion_mode: 'paid_registration',
        form_template_key: null,
        payment_plan: 'deposit',
        offer_price_amount: 249,
        deposit_amount: 60,
        cta_label: 'Reserve your place',
      }]
    }
    throw new Error(`unexpected query: ${query}`)
  })

  const result = await updateNextOfferConfiguration({
    tx: client,
    principal,
    courseRunId: 12,
    input: {
      publicationAccess: 'public',
      conversionMode: 'paid_registration',
      shareSlug: 'creative-leadership-weekend',
      paymentPlan: 'deposit',
      priceAmount: 249,
      depositAmount: 60,
      ctaLabel: 'Reserve your place',
      capacityPolicy: 'limited',
    },
  })

  assert.equal(result.conversionMode, 'paid_registration')
  assert.equal(result.priceAmount, 249)
  const update = calls[0]
  assert.match(update?.query ?? '', /WHERE cr\.tenant_id = \$1 AND cr\.id = \$2/)
  assert.deepEqual(update?.params.slice(0, 2), [7, 12])
  assert.equal(update?.params.includes(null), true)
})

test('rejects roles without offer-management authority before querying', async () => {
  const { client, calls } = fakeClient(() => {
    throw new Error('query must not run')
  })

  await assert.rejects(
    updateNextOfferConfiguration({
      tx: client,
      principal: { ...principal, platformRole: 'lectura' },
      courseRunId: 12,
      input: {
        publicationAccess: 'private',
        conversionMode: 'information_only',
        capacityPolicy: 'limited',
      },
    }),
    (error: unknown) => error instanceof NextOfferConfigurationError
      && error.code === 'offer_configuration_forbidden',
  )
  assert.equal(calls.length, 0)
})

test('returns not found when RLS or tenant scope hides the course run', async () => {
  const { client } = fakeClient(() => [])

  await assert.rejects(
    getNextOfferConfiguration({ tx: client, principal, courseRunId: 999 }),
    (error: unknown) => error instanceof NextOfferConfigurationError
      && error.code === 'offer_not_found',
  )
})

test('rejects non-canonical identifiers and invalid conditional settings before SQL', async () => {
  const { client, calls } = fakeClient(() => {
    throw new Error('query must not run')
  })

  for (const courseRunId of ['1e3', '0x10', '+1', ' 1', '0']) {
    await assert.rejects(
      getNextOfferConfiguration({ tx: client, principal, courseRunId }),
      (error: unknown) => error instanceof NextOfferConfigurationError
        && error.code === 'course_run_id_invalid',
    )
  }

  await assert.rejects(
    updateNextOfferConfiguration({
      tx: client,
      principal,
      courseRunId: 12,
      input: {
        publicationAccess: 'public',
        conversionMode: 'external_link',
        shareSlug: 'unsafe-link',
        externalActionUrl: 'http://example.com/register',
        capacityPolicy: 'limited',
      },
    }),
  )
  assert.equal(calls.length, 0)
})
