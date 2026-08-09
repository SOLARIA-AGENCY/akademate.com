import assert from 'node:assert/strict'
import postgres, { type Sql, type TransactionSql } from 'postgres'

const ownerUrl = process.env.AKADEMATE_NEXT_TEST_OWNER_DATABASE_URL
const appUrl = process.env.AKADEMATE_NEXT_TEST_APP_DATABASE_URL
const appRole = process.env.AKADEMATE_NEXT_DB_APP_USER
if (!ownerUrl || !appUrl || !appRole)
  throw new Error('Ticket RLS verifier requires owner/app URLs and role')

const owner = postgres(ownerUrl, { max: 1, onnotice: () => undefined })
const app = postgres(appUrl, { max: 1, onnotice: () => undefined })

async function withScope<T>(
  sql: Sql,
  tenantId: number,
  role: string,
  work: (transaction: TransactionSql) => Promise<T>
): Promise<T> {
  return sql.begin(async (transaction) => {
    await transaction`SELECT set_config('app.tenant_id', ${String(tenantId)}, true)`
    await transaction`SELECT set_config('app.role', ${role}, true)`
    return work(transaction)
  }) as Promise<T>
}

try {
  const [rls] = await owner<{ relrowsecurity: boolean; relforcerowsecurity: boolean }[]>`
    SELECT relrowsecurity, relforcerowsecurity
    FROM pg_class
    WHERE relname = 'event_offer_ticket_types'
  `
  assert.deepEqual(rls, { relrowsecurity: true, relforcerowsecurity: true })

  const policies = await owner<{ policyname: string; cmd: string }[]>`
    SELECT policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'event_offer_ticket_types'
    ORDER BY policyname
  `
  assert.equal(policies.length, 3)

  const [run] = await owner<{ id: number; tenant_id: number }[]>`
    SELECT id, tenant_id
    FROM course_runs
    WHERE codigo = 'PAID-A' AND conversion_mode = 'paid_registration'
    LIMIT 1
  `
  assert.ok(run)

  const [ticket] = await withScope(
    app,
    run.tenant_id,
    'admin',
    (transaction) => transaction<{ id: number }[]>`
    INSERT INTO event_offer_ticket_types (
      tenant_id, course_run_id, slug, name, ticket_kind, price_amount, max_per_registration
    ) VALUES (
      ${run.tenant_id}, ${run.id}, 'standard', 'Standard', 'paid', 149.50, 1
    ) RETURNING id
  `
  )
  assert.ok(ticket)

  const scoped = await withScope(
    app,
    run.tenant_id,
    'admin',
    (transaction) => transaction<{ slug: string }[]>`
    SELECT slug FROM event_offer_ticket_types ORDER BY id
  `
  )
  assert.deepEqual(
    scoped.map(({ slug }) => slug),
    ['standard']
  )

  const [tenantB] = await owner<
    { id: number }[]
  >`SELECT id FROM tenants WHERE slug = 'tenant-b' LIMIT 1`
  assert.ok(tenantB)
  const crossTenant = await withScope(
    app,
    tenantB.id,
    'admin',
    (transaction) => transaction`
    SELECT id FROM event_offer_ticket_types
  `
  )
  assert.equal(crossTenant.length, 0)

  const publicProjection = await app<{ ticket_slug: string }[]>`
    SELECT ticket_slug
    FROM akademate_next_get_public_offer_ticket_types('learn.tenant-a.example', 'shared-offer')
  `
  assert.deepEqual([...publicProjection], [{ ticket_slug: 'standard' }])

  await assert.rejects(
    withScope(
      app,
      run.tenant_id,
      'admin',
      (transaction) => transaction`
      INSERT INTO event_offer_ticket_types (
        tenant_id, course_run_id, slug, name, ticket_kind, price_amount
      )
      SELECT tenant_id, id, 'invalid', 'Invalid', 'free', 0
      FROM course_runs WHERE codigo = 'INFO-A'
    `
    ),
    (error: unknown) =>
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === '42501'
  )

  console.log(
    JSON.stringify({
      tableRls: true,
      policies: policies.length,
      publicProjection: publicProjection.length,
      crossTenantReadRows: crossTenant.length,
      appRole: `${appRole}:non-owner-nobypassrls`,
    })
  )
} finally {
  await owner.end()
  await app.end()
}
