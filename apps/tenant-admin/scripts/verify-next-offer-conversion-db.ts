import assert from 'node:assert/strict'
import postgres from 'postgres'
import {
  NextOfferConfigurationError,
  getNextOfferConfiguration,
  updateNextOfferConfiguration,
} from '../src/lib/offers/offer-configuration-command.ts'
import { withNextLearningTransaction } from '../src/lib/learning/next-learning-transaction.ts'
import {
  withNextPublicOfferTransaction,
  withNextPublicOfferWriteTransaction,
} from '../src/lib/offers/public-offer-database.ts'
import { NextPublicOfferError, getNextPublicOffer } from '../src/lib/offers/public-offer-query.ts'
import {
  NextPublicOfferSubmissionError,
  parseNextPublicOfferSubmission,
  submitNextPublicOffer,
} from '../src/lib/offers/public-offer-submission.ts'
import {
  listNextOfferSubmissions,
  parseOfferSubmissionInboxQuery,
} from '../src/lib/offers/offer-submission-inbox-command.ts'
import {
  NextOfferSubmissionReviewError,
  reviewNextOfferSubmission,
} from '../src/lib/offers/offer-submission-review-command.ts'
import {
  NextOfferSubmissionHistoryError,
  getNextOfferSubmissionHistory,
} from '../src/lib/offers/offer-submission-review-history-command.ts'
import {
  NextOfferSubmissionEnrollmentError,
  convertNextOfferSubmissionToEnrollment,
} from '../src/lib/offers/offer-submission-enrollment-command.ts'

const ownerUrl = process.env.AKADEMATE_NEXT_TEST_OWNER_DATABASE_URL
if (!ownerUrl) throw new Error('Isolated owner test database URL is required')
const appUrl = process.env.AKADEMATE_NEXT_TEST_APP_DATABASE_URL
if (!appUrl) throw new Error('Isolated app-role test database URL is required')

const sql = postgres(ownerUrl, { max: 1, onnotice: () => undefined })
const app = postgres(appUrl, { max: 1, onnotice: () => undefined })
const adversarialChecks = new Set<string>()

async function rejectsConstraint(
  name: string,
  work: () => Promise<unknown>,
  expectedConstraint: string,
): Promise<void> {
  await assert.rejects(work, (error: unknown) => {
    if (typeof error !== 'object' || error === null) return false
    const databaseError = error as { code?: unknown; constraint_name?: unknown }
    return databaseError.code === (expectedConstraint.endsWith('_unique') ? '23505' : '23514')
      && databaseError.constraint_name === expectedConstraint
  })
  assert.equal(adversarialChecks.has(name), false)
  adversarialChecks.add(name)
}

try {
  const [tenantA, tenantB] = await sql<{ id: number; slug: string }[]>`
    SELECT id, slug FROM tenants WHERE slug IN ('tenant-a', 'tenant-b') ORDER BY slug
  `
  assert.equal(tenantA?.slug, 'tenant-a')
  assert.equal(tenantB?.slug, 'tenant-b')
  await sql`
    UPDATE tenants
    SET domain = CASE slug
      WHEN 'tenant-a' THEN 'learn.tenant-a.example'
      WHEN 'tenant-b' THEN 'learn.tenant-b.example'
      ELSE domain
    END
    WHERE slug IN ('tenant-a', 'tenant-b')
  `

  const [area] = await sql<{ id: number }[]>`
    INSERT INTO areas_formativas (nombre, codigo)
    VALUES ('Offer proof area', 'OFFER-PROOF') RETURNING id
  `
  assert.ok(area)

  const [courseA] = await sql<{ id: number }[]>`
    INSERT INTO courses (codigo, slug, name, area_formativa_id, tenant_id)
    VALUES ('OFFER-A', 'offer-a', 'Offer A', ${area.id}, ${tenantA!.id}) RETURNING id
  `
  const [courseB] = await sql<{ id: number }[]>`
    INSERT INTO courses (codigo, slug, name, area_formativa_id, tenant_id)
    VALUES ('OFFER-B', 'offer-b', 'Offer B', ${area.id}, ${tenantB!.id}) RETURNING id
  `
  assert.ok(courseA && courseB)

  await sql`
    INSERT INTO course_runs (course_id, codigo, start_date, end_date, tenant_id)
    VALUES (${courseA.id}, 'INFO-A', '2099-01-01', '2099-01-02', ${tenantA!.id})
  `

  await rejectsConstraint('public-offer-requires-share-slug', () => sql`
    INSERT INTO course_runs (
      course_id, codigo, start_date, end_date, tenant_id, publication_access
    ) VALUES (
      ${courseA.id}, 'PUBLIC-NO-SLUG', '2099-01-03', '2099-01-04',
      ${tenantA!.id}, 'public'
    )
  `, 'course_runs_public_share_slug_check')

  await rejectsConstraint('interest-form-requires-template', () => sql`
    INSERT INTO course_runs (
      course_id, codigo, start_date, end_date, tenant_id, conversion_mode
    ) VALUES (
      ${courseA.id}, 'FORM-NO-TEMPLATE', '2099-01-05', '2099-01-06',
      ${tenantA!.id}, 'interest_form'
    )
  `, 'course_runs_form_mode_check')

  await rejectsConstraint('external-action-requires-https', () => sql`
    INSERT INTO course_runs (
      course_id, codigo, start_date, end_date, tenant_id,
      conversion_mode, external_action_url
    ) VALUES (
      ${courseA.id}, 'HTTP-EXTERNAL', '2099-01-07', '2099-01-08',
      ${tenantA!.id}, 'external_link', 'http://example.test/insecure'
    )
  `, 'course_runs_external_action_check')

  await rejectsConstraint('paid-offer-requires-frozen-price', () => sql`
    INSERT INTO course_runs (
      course_id, codigo, start_date, end_date, tenant_id,
      conversion_mode, payment_plan
    ) VALUES (
      ${courseA.id}, 'PAID-NO-PRICE', '2099-01-09', '2099-01-10',
      ${tenantA!.id}, 'paid_registration', 'full_amount'
    )
  `, 'course_runs_payment_mode_check')

  await rejectsConstraint('deposit-must-be-lower-than-price', () => sql`
    INSERT INTO course_runs (
      course_id, codigo, start_date, end_date, tenant_id,
      conversion_mode, payment_plan, offer_price_amount, deposit_amount
    ) VALUES (
      ${courseA.id}, 'INVALID-DEPOSIT', '2099-01-11', '2099-01-12',
      ${tenantA!.id}, 'paid_registration', 'deposit', 100, 100
    )
  `, 'course_runs_payment_mode_check')

  await sql`
    INSERT INTO course_runs (
      course_id, codigo, start_date, end_date, tenant_id,
      publication_access, share_slug, conversion_mode,
      payment_plan, offer_price_amount
    ) VALUES (
      ${courseA.id}, 'PAID-A', '2099-01-13', '2099-01-14', ${tenantA!.id},
      'public', 'shared-offer', 'paid_registration', 'full_amount', 149.50
    )
  `
  await sql`UPDATE course_runs SET status = 'published' WHERE codigo = 'PAID-A'`

  await rejectsConstraint('share-slug-is-unique-inside-tenant', () => sql`
    INSERT INTO course_runs (
      course_id, codigo, start_date, end_date, tenant_id, share_slug
    ) VALUES (
      ${courseA.id}, 'DUPLICATE-SLUG', '2099-01-15', '2099-01-16',
      ${tenantA!.id}, 'shared-offer'
    )
  `, 'course_runs_tenant_share_slug_unique')

  await sql`
    INSERT INTO course_runs (
      course_id, codigo, start_date, end_date, tenant_id,
      publication_access, share_slug, conversion_mode,
      form_template_key, capacity_policy
    ) VALUES (
      ${courseB.id}, 'FORM-B', '2099-01-17', '2099-01-18', ${tenantB!.id},
      'unlisted', 'shared-offer', 'approval_required',
      'admissions_form', 'waitlist'
    )
  `
  await sql`UPDATE course_runs SET status = 'enrollment_open' WHERE codigo = 'FORM-B'`

  const configured = await sql<{ conversion_mode: string; share_slug: string }[]>`
    SELECT conversion_mode, share_slug
    FROM course_runs
    WHERE share_slug = 'shared-offer'
    ORDER BY tenant_id
  `
  assert.deepEqual([...configured], [
    { conversion_mode: 'paid_registration', share_slug: 'shared-offer' },
    { conversion_mode: 'approval_required', share_slug: 'shared-offer' },
  ])

  const [userA, userB] = await sql<{ id: number; tenant_id: number }[]>`
    SELECT id, tenant_id
    FROM users
    WHERE email IN ('admin-a@example.test', 'admin-b@example.test')
    ORDER BY email
  `
  assert.ok(userA && userB)
  const [infoRun] = await sql<{ id: number }[]>`
    SELECT id FROM course_runs WHERE codigo = 'INFO-A'
  `
  const [tenantBRun] = await sql<{ id: number }[]>`
    SELECT id FROM course_runs WHERE codigo = 'FORM-B'
  `
  assert.ok(infoRun && tenantBRun)

  const updated = await withNextLearningTransaction(
    { userId: userA.id, tenantId: tenantA!.id },
    (tx, principal) => updateNextOfferConfiguration({
      tx,
      principal,
      courseRunId: infoRun.id,
      input: {
        publicationAccess: 'unlisted',
        conversionMode: 'external_link',
        shareSlug: 'operator-configured-offer',
        externalActionUrl: 'https://events.example.test/operator-configured-offer',
        ctaLabel: 'Continue to registration',
        capacityPolicy: 'unlimited',
      },
    }),
  )
  assert.equal(updated.courseRunId, infoRun.id)
  assert.equal(updated.conversionMode, 'external_link')
  assert.equal(updated.shareSlug, 'operator-configured-offer')

  const loaded = await withNextLearningTransaction(
    { userId: userA.id, tenantId: tenantA!.id },
    (tx, principal) => getNextOfferConfiguration({
      tx,
      principal,
      courseRunId: infoRun.id,
    }),
  )
  assert.equal(loaded.externalActionUrl, 'https://events.example.test/operator-configured-offer')

  await assert.rejects(
    withNextLearningTransaction(
      { userId: userA.id, tenantId: tenantA!.id },
      (tx, principal) => getNextOfferConfiguration({
        tx,
        principal,
        courseRunId: tenantBRun.id,
      }),
    ),
    (error: unknown) => error instanceof NextOfferConfigurationError
      && error.code === 'offer_not_found',
  )
  adversarialChecks.add('command-cannot-read-cross-tenant-offer')

  const appRole = process.env.AKADEMATE_NEXT_DB_APP_USER!
  const [columnPrivileges] = await sql<{
    can_update_offer: boolean
    can_update_tenant: boolean
    can_insert: boolean
    can_delete: boolean
  }[]>`
    SELECT
      has_column_privilege(${appRole}, 'course_runs', 'conversion_mode', 'UPDATE') AS can_update_offer,
      has_column_privilege(${appRole}, 'course_runs', 'tenant_id', 'UPDATE') AS can_update_tenant,
      has_table_privilege(${appRole}, 'course_runs', 'INSERT') AS can_insert,
      has_table_privilege(${appRole}, 'course_runs', 'DELETE') AS can_delete
  `
  assert.deepEqual(columnPrivileges, {
    can_update_offer: true,
    can_update_tenant: false,
    can_insert: false,
    can_delete: false,
  })

  const crossTenantRows = await app.begin(async (transaction) => {
    await transaction`SELECT set_config('app.tenant_id', ${String(tenantA!.id)}, true)`
    await transaction`SELECT set_config('app.user_id', ${String(userA.id)}, true)`
    await transaction`SELECT set_config('app.role', 'admin', true)`
    return transaction<{ id: number }[]>`
      UPDATE course_runs
      SET cta_label = 'Cross tenant attempt'
      WHERE tenant_id = ${tenantB!.id} AND id = ${tenantBRun.id}
      RETURNING id
    `
  })
  assert.equal(crossTenantRows.length, 0)
  adversarialChecks.add('database-rls-hides-cross-tenant-update')

  const publicOfferA = await withNextPublicOfferTransaction(
    (tx) => getNextPublicOffer({
      tx,
      host: 'learn.tenant-a.example',
      shareSlug: 'shared-offer',
    }),
  )
  assert.equal(publicOfferA.tenantSlug, 'tenant-a')
  assert.equal(publicOfferA.conversionMode, 'paid_registration')

  const publicOfferB = await withNextPublicOfferTransaction(
    (tx) => getNextPublicOffer({
      tx,
      host: 'tenant-b.akademate.com',
      shareSlug: 'shared-offer',
    }),
  )
  assert.equal(publicOfferB.tenantSlug, 'tenant-b')
  assert.equal(publicOfferB.conversionMode, 'approval_required')
  adversarialChecks.add('same-slug-resolves-by-exact-host')

  for (const attempt of [
    { host: 'other.akademate.com', shareSlug: 'shared-offer' },
    { host: 'tenant-a.akademate.com', shareSlug: 'operator-configured-offer' },
  ]) {
    await assert.rejects(
      withNextPublicOfferTransaction((tx) => getNextPublicOffer({ tx, ...attempt })),
      (error: unknown) => error instanceof NextPublicOfferError
        && error.code === 'public_offer_not_found',
    )
  }
  adversarialChecks.add('wrong-host-and-draft-offer-hidden')

  const [projectionPrivilege] = await sql<{ can_execute: boolean }[]>`
    SELECT has_function_privilege(
      ${appRole},
      'akademate_next_get_public_offer(character varying, character varying)',
      'EXECUTE'
    ) AS can_execute
  `
  assert.equal(projectionPrivilege?.can_execute, true)

  const submissionInput = parseNextPublicOfferSubmission({
    idempotencyKey: '018f6f52-86a7-7c8f-a477-01b9c6407a11',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.test',
    phone: '+46 70 123 45 67',
    message: 'Application proof',
    privacyAccepted: true,
    marketingConsent: false,
    companyWebsite: '',
  })
  const submit = (input = submissionInput, host = 'tenant-b.akademate.com') => (
    withNextPublicOfferWriteTransaction((tx) => submitNextPublicOffer({
      tx,
      host,
      shareSlug: 'shared-offer',
      input,
      privacyNoticeVersion: '2026-08-03',
      fingerprintPepper: 'public-submission-proof-pepper-32-bytes-minimum',
    }))
  )
  const createdSubmission = await submit()
  assert.deepEqual(createdSubmission, {
    submissionId: createdSubmission.submissionId,
    kind: 'application',
    status: 'pending_review',
    replayed: false,
  })
  assert.equal((await submit()).replayed, true)
  adversarialChecks.add('submission-idempotent-replay')

  await assert.rejects(
    submit({ ...submissionInput, message: 'Conflicting replay' }),
    (error: unknown) => error instanceof NextPublicOfferSubmissionError
      && error.code === 'submission_idempotency_conflict',
  )
  adversarialChecks.add('submission-conflicting-replay-rejected')

  await assert.rejects(
    submit({ ...submissionInput, idempotencyKey: '018f6f52-86a7-7c8f-a477-01b9c6407a12' }, 'tenant-a.akademate.com'),
    (error: unknown) => error instanceof NextPublicOfferSubmissionError
      && error.code === 'submission_not_available',
  )
  adversarialChecks.add('paid-offer-cannot-use-submission-command')

  for (let index = 2; index <= 5; index += 1) {
    await submit({
      ...submissionInput,
      idempotencyKey: `018f6f52-86a7-7c8f-a477-01b9c6407a1${index}`,
      message: `Application proof ${index}`,
    })
  }
  await assert.rejects(
    submit({
      ...submissionInput,
      idempotencyKey: '018f6f52-86a7-7c8f-a477-01b9c6407a16',
      message: 'Application proof 6',
    }),
    (error: unknown) => error instanceof NextPublicOfferSubmissionError
      && error.code === 'submission_rate_limited',
  )
  adversarialChecks.add('submission-rate-limit-is-database-enforced')

  const [submissionPrivileges] = await sql<{ can_select: boolean; can_insert: boolean }[]>`
    SELECT
      has_table_privilege(${appRole}, 'offer_submissions', 'SELECT') AS can_select,
      has_table_privilege(${appRole}, 'offer_submissions', 'INSERT') AS can_insert
  `
  assert.deepEqual(submissionPrivileges, { can_select: true, can_insert: false })
  const tenantSubmissionCounts = await app.begin(async (transaction) => {
    await transaction`SELECT set_config('app.tenant_id', ${String(tenantB!.id)}, true)`
    await transaction`SELECT set_config('app.user_id', ${String(userB.id)}, true)`
    await transaction`SELECT set_config('app.role', 'admin', true)`
    return transaction<{ tenant_id: number; count: number }[]>`
      SELECT tenant_id, count(*)::integer AS count
      FROM offer_submissions
      GROUP BY tenant_id
    `
  })
  assert.deepEqual([...tenantSubmissionCounts], [{ tenant_id: tenantB!.id, count: 5 }])
  adversarialChecks.add('submission-manager-read-remains-tenant-scoped')

  const inboxQuery = parseOfferSubmissionInboxQuery(new URLSearchParams({
    kind: 'application',
    status: 'pending_review',
    search: 'Ada',
  }))
  const tenantBInbox = await withNextLearningTransaction(
    { userId: userB.id, tenantId: tenantB!.id },
    (tx, principal) => listNextOfferSubmissions({ tx, principal, query: inboxQuery }),
  )
  assert.equal(tenantBInbox.total, 5)
  assert.equal(tenantBInbox.items.length, 5)
  assert.equal(tenantBInbox.items.every((item) => item.courseRunId === tenantBRun.id), true)
  assert.equal(tenantBInbox.items.every((item) => item.email === 'ada@example.test'), true)

  const tenantAInbox = await withNextLearningTransaction(
    { userId: userA.id, tenantId: tenantA!.id },
    (tx, principal) => listNextOfferSubmissions({ tx, principal, query: inboxQuery }),
  )
  assert.deepEqual(tenantAInbox, {
    items: [],
    canReview: true,
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
  })
  adversarialChecks.add('submission-inbox-command-cannot-cross-tenants')

  const approved = await withNextLearningTransaction(
    { userId: userB.id, tenantId: tenantB!.id },
    (tx, principal) => reviewNextOfferSubmission({
      tx,
      principal,
      submissionId: createdSubmission.submissionId,
      decision: { status: 'approved', note: 'Meets the academy requirements' },
    }),
  )
  assert.equal(approved.previousStatus, 'pending_review')
  assert.equal(approved.status, 'approved')
  assert.equal(approved.changed, true)

  const replayedDecision = await withNextLearningTransaction(
    { userId: userB.id, tenantId: tenantB!.id },
    (tx, principal) => reviewNextOfferSubmission({
      tx,
      principal,
      submissionId: createdSubmission.submissionId,
      decision: { status: 'approved', note: 'Ignored replay note' },
    }),
  )
  assert.equal(replayedDecision.changed, false)
  const [eventCount] = await sql<{ count: number }[]>`
    SELECT count(*)::integer AS count
    FROM offer_submission_review_events
    WHERE submission_id = ${createdSubmission.submissionId}
  `
  assert.equal(eventCount?.count, 1)
  adversarialChecks.add('submission-review-replay-does-not-duplicate-ledger')

  const [reviewPrivileges] = await sql<{
    can_update_submission: boolean
    can_insert_event: boolean
    can_delete_event: boolean
    can_execute_review: boolean
  }[]>`
    SELECT
      has_table_privilege(${appRole}, 'offer_submissions', 'UPDATE') AS can_update_submission,
      has_table_privilege(${appRole}, 'offer_submission_review_events', 'INSERT') AS can_insert_event,
      has_table_privilege(${appRole}, 'offer_submission_review_events', 'DELETE') AS can_delete_event,
      has_function_privilege(
        ${appRole},
        'akademate_next_review_offer_submission(bigint, character varying, character varying)',
        'EXECUTE'
      ) AS can_execute_review
  `
  assert.deepEqual(reviewPrivileges, {
    can_update_submission: false,
    can_insert_event: false,
    can_delete_event: false,
    can_execute_review: true,
  })
  adversarialChecks.add('submission-review-app-role-has-command-only-write-access')

  await assert.rejects(
    withNextLearningTransaction(
      { userId: userA.id, tenantId: tenantA!.id },
      (tx, principal) => reviewNextOfferSubmission({
        tx,
        principal,
        submissionId: createdSubmission.submissionId,
        decision: { status: 'archived', note: null },
      }),
    ),
    (error: unknown) => error instanceof NextOfferSubmissionReviewError
      && error.code === 'submission_not_found',
  )
  adversarialChecks.add('submission-review-command-cannot-cross-tenants')

  await assert.rejects(
    app.begin(async (transaction) => {
      await transaction`SELECT set_config('app.tenant_id', ${String(tenantB!.id)}, true)`
      await transaction`SELECT set_config('app.user_id', ${String(userB.id)}, true)`
      await transaction`SELECT set_config('app.role', 'marketing', true)`
      return transaction`
        SELECT * FROM akademate_next_review_offer_submission(
          ${createdSubmission.submissionId}, 'pending_review', NULL
        )
      `
    }),
    (error: unknown) => typeof error === 'object'
      && error !== null
      && 'code' in error
      && error.code === 'P0001'
      && 'message' in error
      && typeof error.message === 'string'
      && error.message.includes('offer_submission_review_forbidden'),
  )
  adversarialChecks.add('submission-review-database-rejects-marketing-role')

  await assert.rejects(
    withNextLearningTransaction(
      { userId: userB.id, tenantId: tenantB!.id },
      (tx, principal) => reviewNextOfferSubmission({
        tx,
        principal: { ...principal, platformRole: 'marketing' },
        submissionId: createdSubmission.submissionId,
        decision: { status: 'pending_review', note: null },
      }),
    ),
    (error: unknown) => error instanceof NextOfferSubmissionReviewError
      && error.code === 'submission_decision_forbidden',
  )
  adversarialChecks.add('submission-review-marketing-role-is-read-only')

  await assert.rejects(
    withNextLearningTransaction(
      { userId: userB.id, tenantId: tenantB!.id },
      (tx, principal) => reviewNextOfferSubmission({
        tx,
        principal,
        submissionId: createdSubmission.submissionId,
        decision: { status: 'rejected', note: 'Direct terminal rewrite' },
      }),
    ),
    (error: unknown) => error instanceof NextOfferSubmissionReviewError
      && error.code === 'submission_transition_invalid',
  )
  adversarialChecks.add('submission-review-terminal-state-requires-reopen')

  const reopened = await withNextLearningTransaction(
    { userId: userB.id, tenantId: tenantB!.id },
    (tx, principal) => reviewNextOfferSubmission({
      tx,
      principal,
      submissionId: createdSubmission.submissionId,
      decision: { status: 'pending_review', note: 'Reopened for a second assessment' },
    }),
  )
  assert.equal(reopened.status, 'pending_review')
  const rejected = await withNextLearningTransaction(
    { userId: userB.id, tenantId: tenantB!.id },
    (tx, principal) => reviewNextOfferSubmission({
      tx,
      principal,
      submissionId: createdSubmission.submissionId,
      decision: { status: 'rejected', note: 'Required prerequisite is missing' },
    }),
  )
  assert.equal(rejected.status, 'rejected')
  const [ledgerCount] = await sql<{ count: number }[]>`
    SELECT count(*)::integer AS count
    FROM offer_submission_review_events
    WHERE submission_id = ${createdSubmission.submissionId}
  `
  assert.equal(ledgerCount?.count, 3)
  adversarialChecks.add('submission-review-reopen-preserves-complete-ledger')

  const history = await withNextLearningTransaction(
    { userId: userB.id, tenantId: tenantB!.id },
    (tx, principal) => getNextOfferSubmissionHistory({
      tx,
      principal,
      submissionId: createdSubmission.submissionId,
    }),
  )
  assert.equal(history.events.length, 3)
  assert.equal(history.events[0]?.toStatus, 'rejected')
  assert.equal(history.events[0]?.actorUserId, userB.id)
  assert.equal(history.events[0]?.note, 'Required prerequisite is missing')
  assert.equal(history.truncated, false)
  adversarialChecks.add('submission-review-history-is-newest-first-and-bounded')

  await assert.rejects(
    withNextLearningTransaction(
      { userId: userA.id, tenantId: tenantA!.id },
      (tx, principal) => getNextOfferSubmissionHistory({
        tx,
        principal,
        submissionId: createdSubmission.submissionId,
      }),
    ),
    (error: unknown) => error instanceof NextOfferSubmissionHistoryError
      && error.code === 'submission_history_not_found',
  )
  adversarialChecks.add('submission-review-history-cannot-cross-tenants')

  const marketingHistoryRows = await app.begin(async (transaction) => {
    await transaction`SELECT set_config('app.tenant_id', ${String(tenantB!.id)}, true)`
    await transaction`SELECT set_config('app.user_id', ${String(userB.id)}, true)`
    await transaction`SELECT set_config('app.role', 'marketing', true)`
    return transaction<{ id: number }[]>`
      SELECT id FROM offer_submission_review_events
      WHERE submission_id = ${createdSubmission.submissionId}
    `
  })
  assert.equal(marketingHistoryRows.length, 0)
  adversarialChecks.add('submission-review-history-not-readable-by-marketing-role')

  await withNextLearningTransaction(
    { userId: userB.id, tenantId: tenantB!.id },
    (tx, principal) => reviewNextOfferSubmission({
      tx,
      principal,
      submissionId: createdSubmission.submissionId,
      decision: { status: 'pending_review', note: 'Reopened for enrollment conversion' },
    }),
  )
  await withNextLearningTransaction(
    { userId: userB.id, tenantId: tenantB!.id },
    (tx, principal) => reviewNextOfferSubmission({
      tx,
      principal,
      submissionId: createdSubmission.submissionId,
      decision: { status: 'approved', note: 'Approved for enrollment conversion' },
    }),
  )

  const converted = await withNextLearningTransaction(
    { userId: userB.id, tenantId: tenantB!.id },
    (tx, principal) => convertNextOfferSubmissionToEnrollment({
      tx,
      principal,
      submissionId: createdSubmission.submissionId,
    }),
  )
  assert.equal(converted.status, 'confirmed')
  assert.equal(converted.capacityReserved, true)
  assert.equal(converted.replayed, false)

  const [persistedConversion] = await sql<{
    tenant_id: number
    offer_submission_id: string
    status: string
    payment_status: string
    created_by_id: number
    current_enrollments: number
    email: string
    marketing_consent: boolean
  }[]>`
    SELECT enrollment.tenant_id, enrollment.offer_submission_id,
      enrollment.status::text, enrollment.payment_status::text,
      enrollment.created_by_id, run.current_enrollments::integer,
      learner.email, learner.marketing_consent
    FROM enrollments enrollment
    JOIN course_runs run
      ON run.tenant_id = enrollment.tenant_id AND run.id = enrollment.course_run_id
    JOIN leads learner
      ON learner.tenant_id = enrollment.tenant_id AND learner.id = enrollment.student_id
    WHERE enrollment.id = ${converted.enrollmentId}
  `
  assert.deepEqual(persistedConversion, {
    tenant_id: tenantB!.id,
    offer_submission_id: String(createdSubmission.submissionId),
    status: 'confirmed',
    payment_status: 'pending',
    created_by_id: userB.id,
    current_enrollments: 1,
    email: 'ada@example.test',
    marketing_consent: false,
  })
  adversarialChecks.add('approved-submission-converts-atomically-with-consent-and-capacity')

  const replayedEnrollment = await withNextLearningTransaction(
    { userId: userB.id, tenantId: tenantB!.id },
    (tx, principal) => convertNextOfferSubmissionToEnrollment({
      tx,
      principal,
      submissionId: createdSubmission.submissionId,
    }),
  )
  assert.equal(replayedEnrollment.replayed, true)
  assert.equal(replayedEnrollment.enrollmentId, converted.enrollmentId)
  const [replayCounts] = await sql<{ enrollments: number; current_enrollments: number }[]>`
    SELECT count(enrollment.id)::integer AS enrollments,
      max(run.current_enrollments)::integer AS current_enrollments
    FROM course_runs run
    LEFT JOIN enrollments enrollment
      ON enrollment.tenant_id = run.tenant_id AND enrollment.course_run_id = run.id
    WHERE run.id = ${tenantBRun.id}
    GROUP BY run.id
  `
  assert.deepEqual(replayCounts, { enrollments: 1, current_enrollments: 1 })
  adversarialChecks.add('submission-enrollment-replay-does-not-duplicate-seat-or-record')

  await assert.rejects(
    withNextLearningTransaction(
      { userId: userA.id, tenantId: tenantA!.id },
      (tx, principal) => convertNextOfferSubmissionToEnrollment({
        tx,
        principal,
        submissionId: createdSubmission.submissionId,
      }),
    ),
    (error: unknown) => error instanceof NextOfferSubmissionEnrollmentError
      && error.code === 'submission_not_found',
  )
  adversarialChecks.add('submission-enrollment-command-cannot-cross-tenants')

  await assert.rejects(
    app.begin(async (transaction) => {
      await transaction`SELECT set_config('app.tenant_id', ${String(tenantB!.id)}, true)`
      await transaction`SELECT set_config('app.user_id', ${String(userB.id)}, true)`
      await transaction`SELECT set_config('app.role', 'marketing', true)`
      return transaction`
        SELECT * FROM akademate_next_convert_offer_submission_to_enrollment(
          ${createdSubmission.submissionId}
        )
      `
    }),
    (error: unknown) => typeof error === 'object'
      && error !== null
      && 'message' in error
      && typeof error.message === 'string'
      && error.message.includes('offer_submission_enrollment_forbidden'),
  )
  adversarialChecks.add('submission-enrollment-database-rejects-marketing-role')

  const [enrollmentPrivileges] = await sql<{
    can_select: boolean
    can_insert: boolean
    can_update: boolean
    can_delete: boolean
    can_execute: boolean
  }[]>`
    SELECT
      has_table_privilege(${appRole}, 'enrollments', 'SELECT') AS can_select,
      has_table_privilege(${appRole}, 'enrollments', 'INSERT') AS can_insert,
      has_table_privilege(${appRole}, 'enrollments', 'UPDATE') AS can_update,
      has_table_privilege(${appRole}, 'enrollments', 'DELETE') AS can_delete,
      has_function_privilege(
        ${appRole},
        'akademate_next_convert_offer_submission_to_enrollment(bigint)',
        'EXECUTE'
      ) AS can_execute
  `
  assert.deepEqual(enrollmentPrivileges, {
    can_select: true,
    can_insert: false,
    can_update: false,
    can_delete: false,
    can_execute: true,
  })
  adversarialChecks.add('submission-enrollment-app-role-has-command-only-write-access')

  const capacityFixtureRows = await sql<{
    run_id: number
    run_code: string
    submission_id: string
  }[]>`
    WITH inserted_runs AS (
      INSERT INTO course_runs (
        course_id, codigo, start_date, end_date, tenant_id, status,
        conversion_mode, form_template_key, capacity_policy,
        max_students, current_enrollments
      ) VALUES
        (${courseB.id}, 'FULL-LIMITED-B', '2099-03-01', '2099-03-02', ${tenantB!.id},
          'enrollment_open', 'approval_required', 'admissions_form', 'limited', 1, 1),
        (${courseB.id}, 'FULL-WAITLIST-B', '2099-03-03', '2099-03-04', ${tenantB!.id},
          'enrollment_open', 'approval_required', 'admissions_form', 'waitlist', 1, 1),
        (${courseB.id}, 'LAST-SEAT-B', '2099-03-05', '2099-03-06', ${tenantB!.id},
          'enrollment_open', 'approval_required', 'admissions_form', 'limited', 1, 0)
      RETURNING id, codigo
    ), inserted_submissions AS (
      INSERT INTO offer_submissions (
        tenant_id, course_run_id, submission_kind, status,
        first_name, last_name, email, phone, privacy_accepted,
        privacy_notice_version, marketing_consent, source_host, source_slug,
        idempotency_key, payload_fingerprint, contact_fingerprint
      )
      SELECT ${tenantB!.id}, run.id, 'application', 'approved',
        'Capacity', suffix.label, lower(suffix.label) || '@example.test', '+46 700000000', true,
        '2026-08-03', false, 'tenant-b.akademate.com', lower(run.codigo),
        suffix.key::uuid, repeat(suffix.fingerprint, 64), repeat(suffix.contact, 64)
      FROM inserted_runs run
      JOIN LATERAL (
        VALUES
          ('Applicant A', '018f6f52-86a7-7c8f-a477-01b9c6407b01', 'a', '1'),
          ('Applicant B', '018f6f52-86a7-7c8f-a477-01b9c6407b02', 'b', '2')
      ) AS suffix(label, key, fingerprint, contact)
        ON run.codigo = 'LAST-SEAT-B' OR suffix.label = 'Applicant A'
      RETURNING id, course_run_id
    )
    SELECT run.id AS run_id, run.codigo AS run_code,
      submission.id::text AS submission_id
    FROM inserted_runs run
    JOIN inserted_submissions submission ON submission.course_run_id = run.id
    ORDER BY run.codigo, submission.id
  `
  const fullLimited = capacityFixtureRows.find((row) => row.run_code === 'FULL-LIMITED-B')
  const fullWaitlist = capacityFixtureRows.find((row) => row.run_code === 'FULL-WAITLIST-B')
  const lastSeat = capacityFixtureRows.filter((row) => row.run_code === 'LAST-SEAT-B')
  assert.ok(fullLimited && fullWaitlist)
  assert.equal(lastSeat.length, 2)

  await assert.rejects(
    withNextLearningTransaction(
      { userId: userB.id, tenantId: tenantB!.id },
      (tx, principal) => convertNextOfferSubmissionToEnrollment({
        tx,
        principal,
        submissionId: fullLimited.submission_id,
      }),
    ),
    (error: unknown) => error instanceof NextOfferSubmissionEnrollmentError
      && error.code === 'submission_capacity_full',
  )
  const [fullLimitedCount] = await sql<{ count: number }[]>`
    SELECT count(*)::integer AS count FROM enrollments
    WHERE course_run_id = ${fullLimited.run_id}
  `
  assert.equal(fullLimitedCount?.count, 0)
  adversarialChecks.add('limited-capacity-refuses-full-run-without-partial-write')

  const waitlisted = await withNextLearningTransaction(
    { userId: userB.id, tenantId: tenantB!.id },
    (tx, principal) => convertNextOfferSubmissionToEnrollment({
      tx,
      principal,
      submissionId: fullWaitlist.submission_id,
    }),
  )
  assert.equal(waitlisted.status, 'waitlisted')
  assert.equal(waitlisted.capacityReserved, false)
  const [waitlistState] = await sql<{ count: number; current_enrollments: number }[]>`
    SELECT count(enrollment.id)::integer AS count,
      max(run.current_enrollments)::integer AS current_enrollments
    FROM course_runs run
    LEFT JOIN enrollments enrollment
      ON enrollment.tenant_id = run.tenant_id AND enrollment.course_run_id = run.id
    WHERE run.id = ${fullWaitlist.run_id}
    GROUP BY run.id
  `
  assert.deepEqual(waitlistState, { count: 1, current_enrollments: 1 })
  adversarialChecks.add('waitlist-policy-creates-waitlisted-record-without-consuming-seat')

  const raceAttempts = await Promise.allSettled(lastSeat.map((fixture) => (
    withNextLearningTransaction(
      { userId: userB.id, tenantId: tenantB!.id },
      (tx, principal) => convertNextOfferSubmissionToEnrollment({
        tx,
        principal,
        submissionId: fixture.submission_id,
      }),
    )
  )))
  const raceSuccesses = raceAttempts.filter((attempt) => attempt.status === 'fulfilled')
  const raceFailures = raceAttempts.filter((attempt) => attempt.status === 'rejected')
  assert.equal(raceSuccesses.length, 1)
  assert.equal(raceFailures.length, 1)
  const failedFixture = lastSeat[raceAttempts.findIndex((attempt) => attempt.status === 'rejected')]
  assert.ok(failedFixture)
  await assert.rejects(
    withNextLearningTransaction(
      { userId: userB.id, tenantId: tenantB!.id },
      (tx, principal) => convertNextOfferSubmissionToEnrollment({
        tx,
        principal,
        submissionId: failedFixture.submission_id,
      }),
    ),
    (error: unknown) => error instanceof NextOfferSubmissionEnrollmentError
      && error.code === 'submission_capacity_full',
  )
  const [raceState] = await sql<{ count: number; current_enrollments: number }[]>`
    SELECT count(enrollment.id)::integer AS count,
      max(run.current_enrollments)::integer AS current_enrollments
    FROM course_runs run
    LEFT JOIN enrollments enrollment
      ON enrollment.tenant_id = run.tenant_id AND enrollment.course_run_id = run.id
    WHERE run.id = ${lastSeat[0]!.run_id}
    GROUP BY run.id
  `
  assert.deepEqual(raceState, { count: 1, current_enrollments: 1 })
  adversarialChecks.add('concurrent-last-seat-allows-exactly-one-confirmed-enrollment')

  process.stdout.write(`${JSON.stringify({
    validModes: ['information_only', 'paid_registration', 'approval_required'],
    adversarialChecks: adversarialChecks.size,
    tenantScopedSlug: true,
    priceColumn: 'offer_price_amount',
    operatorCommand: 'app-role-rls-verified',
    publicProjection: 'host-scoped-read-only',
    publicSubmissions: 'consented-idempotent-rate-limited',
    submissionInbox: 'manager-only-tenant-scoped',
    submissionReview: 'audited-reversible',
    submissionHistory: 'reviewer-only-bounded-timeline',
    submissionEnrollment: 'approved-idempotent-tenant-scoped-capacity-reserved',
  })}\n`)
} finally {
  await Promise.allSettled([sql.end(), app.end()])
}
