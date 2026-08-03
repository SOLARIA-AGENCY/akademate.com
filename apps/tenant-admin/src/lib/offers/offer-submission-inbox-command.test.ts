import assert from 'node:assert/strict'
import test from 'node:test'

import type {
  LearningSqlClient,
  NextLearningPrincipal,
} from '../learning/next-learning-transaction.ts'
import {
  NextOfferSubmissionInboxError,
  listNextOfferSubmissions,
  parseOfferSubmissionInboxQuery,
} from './offer-submission-inbox-command.ts'

type Row = Record<string, unknown>

const principal: NextLearningPrincipal = {
  userId: 41,
  tenantId: 7,
  active: true,
  platformRole: 'gestor',
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

const storedSubmission = {
  id: 91,
  course_run_id: 12,
  course_name: 'Creative Leadership',
  course_run_code: 'CL-2026-09',
  submission_kind: 'application',
  status: 'pending_review',
  first_name: 'Ada',
  last_name: 'Lovelace',
  email: 'ada@example.com',
  phone: '+34 600 000 000',
  message: 'I would like to join.',
  privacy_notice_version: '2026-08-v1',
  marketing_consent: false,
  source_host: 'north-star.localhost',
  source_slug: 'creative-leadership-weekend',
  created_at: '2026-08-03T10:00:00.000Z',
  total_count: 1,
}

test('parses a bounded canonical query and rejects unknown or abusive values', () => {
  assert.deepEqual(parseOfferSubmissionInboxQuery(new URLSearchParams()), {
    kind: 'all',
    page: 1,
    pageSize: 25,
    search: '',
    status: 'all',
  })
  assert.deepEqual(parseOfferSubmissionInboxQuery(new URLSearchParams({
    kind: 'application',
    page: '2',
    pageSize: '50',
    search: '  Ada  ',
    status: 'pending_review',
  })), {
    kind: 'application',
    page: 2,
    pageSize: 50,
    search: 'Ada',
    status: 'pending_review',
  })

  for (const params of [
    new URLSearchParams({ tenantId: '999' }),
    new URLSearchParams({ status: 'deleted' }),
    new URLSearchParams({ kind: 'payment' }),
    new URLSearchParams({ page: '1e3' }),
    new URLSearchParams({ pageSize: '100' }),
    new URLSearchParams({ search: 'x'.repeat(81) }),
  ]) {
    assert.throws(
      () => parseOfferSubmissionInboxQuery(params),
      (error: unknown) => error instanceof NextOfferSubmissionInboxError
        && error.code === 'submission_query_invalid',
    )
  }
})

test('lists only the authenticated tenant with fixed filters and pagination', async () => {
  const { calls, client } = fakeClient((query) => {
    if (query.startsWith('SELECT')) return [storedSubmission]
    throw new Error(`unexpected query: ${query}`)
  })

  const result = await listNextOfferSubmissions({
    tx: client,
    principal,
    query: {
      kind: 'application',
      page: 1,
      pageSize: 25,
      search: 'Ada',
      status: 'pending_review',
    },
  })

  assert.equal(result.items.length, 1)
  assert.equal(result.canReview, true)
  assert.equal(result.items[0]?.id, 91)
  assert.equal(result.items[0]?.courseName, 'Creative Leadership')
  assert.equal(result.total, 1)
  assert.equal(result.page, 1)
  assert.equal(result.pageSize, 25)
  assert.match(calls[0]?.query ?? '', /os\.tenant_id = \$1/)
  assert.match(calls[0]?.query ?? '', /os\.status = \$2/)
  assert.match(calls[0]?.query ?? '', /os\.submission_kind = \$3/)
  assert.deepEqual(calls[0]?.params, [7, 'pending_review', 'application', '%ada%', 25, 0])
})

test('rejects non-manager roles before any SQL executes', async () => {
  const { calls, client } = fakeClient(() => {
    throw new Error('query must not run')
  })

  for (const platformRole of ['lectura', 'student', 'instructor']) {
    await assert.rejects(
      listNextOfferSubmissions({
        tx: client,
        principal: { ...principal, platformRole },
        query: parseOfferSubmissionInboxQuery(new URLSearchParams()),
      }),
      (error: unknown) => error instanceof NextOfferSubmissionInboxError
        && error.code === 'submission_inbox_forbidden',
    )
  }
  assert.equal(calls.length, 0)
})

test('fails closed when persisted rows do not match the bounded projection', async () => {
  const { client } = fakeClient(() => [{ ...storedSubmission, email: 'not-an-email' }])
  await assert.rejects(
    listNextOfferSubmissions({
      tx: client,
      principal,
      query: parseOfferSubmissionInboxQuery(new URLSearchParams()),
    }),
    (error: unknown) => error instanceof NextOfferSubmissionInboxError
      && error.code === 'submission_persistence_invalid',
  )
})

test('preserves the filtered total for an empty out-of-range page', async () => {
  const { calls, client } = fakeClient((query) => {
    if (query.includes('count(*) OVER()')) return []
    if (query.startsWith('SELECT count(*)')) return [{ total_count: 1 }]
    throw new Error(`unexpected query: ${query}`)
  })
  const result = await listNextOfferSubmissions({
    tx: client,
    principal,
    query: { ...parseOfferSubmissionInboxQuery(new URLSearchParams()), page: 2 },
  })
  assert.deepEqual(result, { items: [], canReview: true, page: 2, pageSize: 25, total: 1, totalPages: 1 })
  assert.equal(calls.length, 2)
  assert.deepEqual(calls[1]?.params, [7, 'all', 'all', ''])
})

test('escapes user LIKE metacharacters while keeping the query parameterized', async () => {
  const { calls, client } = fakeClient((query) => (
    query.startsWith('SELECT count(*)') ? [{ total_count: 0 }] : []
  ))
  await listNextOfferSubmissions({
    tx: client,
    principal,
    query: { ...parseOfferSubmissionInboxQuery(new URLSearchParams()), search: 'Ada%_' },
  })
  assert.equal(calls[0]?.params[3], '%ada\\%\\_%')
  assert.match(calls[0]?.query ?? '', /LIKE \$4 ESCAPE '\\'/)
})
