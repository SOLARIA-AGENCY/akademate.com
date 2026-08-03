import assert from 'node:assert/strict'
import postgres from 'postgres'

const ownerUrl = process.env.AKADEMATE_NEXT_TEST_OWNER_DATABASE_URL
if (!ownerUrl) throw new Error('Isolated owner test database URL is required')

const sql = postgres(ownerUrl, { max: 1, onnotice: () => undefined })
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

  process.stdout.write(`${JSON.stringify({
    validModes: ['information_only', 'paid_registration', 'approval_required'],
    adversarialChecks: adversarialChecks.size,
    tenantScopedSlug: true,
    priceColumn: 'offer_price_amount',
  })}\n`)
} finally {
  await sql.end()
}
