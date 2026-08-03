import assert from 'node:assert/strict'
import postgres from 'postgres'
import {
  NextOfferConfigurationError,
  getNextOfferConfiguration,
  updateNextOfferConfiguration,
} from '../src/lib/offers/offer-configuration-command.ts'
import { withNextLearningTransaction } from '../src/lib/learning/next-learning-transaction.ts'
import { withNextPublicOfferTransaction } from '../src/lib/offers/public-offer-database.ts'
import { NextPublicOfferError, getNextPublicOffer } from '../src/lib/offers/public-offer-query.ts'

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

  process.stdout.write(`${JSON.stringify({
    validModes: ['information_only', 'paid_registration', 'approval_required'],
    adversarialChecks: adversarialChecks.size,
    tenantScopedSlug: true,
    priceColumn: 'offer_price_amount',
    operatorCommand: 'app-role-rls-verified',
    publicProjection: 'host-scoped-read-only',
  })}\n`)
} finally {
  await Promise.allSettled([sql.end(), app.end()])
}
