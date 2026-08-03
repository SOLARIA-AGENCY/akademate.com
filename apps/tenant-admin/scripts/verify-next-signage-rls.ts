import assert from 'node:assert/strict'
import postgres, { type Sql, type TransactionSql } from 'postgres'

const ownerUrl = process.env.AKADEMATE_NEXT_TEST_OWNER_DATABASE_URL
const appUrl = process.env.AKADEMATE_NEXT_TEST_APP_DATABASE_URL
const appRole = process.env.AKADEMATE_NEXT_DB_APP_USER

if (!ownerUrl || !appUrl || !appRole) {
  throw new Error('Isolated owner/application test database URLs and application role are required')
}
if (!/^[a-z_][a-z0-9_]{0,62}$/.test(appRole)) {
  throw new Error('Application role must be a safe PostgreSQL identifier')
}

const owner = postgres(ownerUrl, { max: 1, onnotice: () => undefined })
const app = postgres(appUrl, { max: 1, onnotice: () => undefined })

async function withScope<T>(
  sql: Sql,
  scope: { tenantId?: number; siteId?: number; userId?: number; role?: string },
  work: (transaction: TransactionSql) => Promise<T>,
): Promise<T> {
  return sql.begin(async (transaction) => {
    if (scope.tenantId !== undefined) {
      await transaction`SELECT set_config('app.tenant_id', ${String(scope.tenantId)}, true)`
    }
    if (scope.siteId !== undefined) {
      await transaction`SELECT set_config('app.site_id', ${String(scope.siteId)}, true)`
    }
    if (scope.userId !== undefined) {
      await transaction`SELECT set_config('app.user_id', ${String(scope.userId)}, true)`
    }
    if (scope.role !== undefined) {
      await transaction`SELECT set_config('app.role', ${scope.role}, true)`
    }
    return work(transaction)
  }) as Promise<T>
}

type ExpectedDatabaseError = {
  code: string
  constraint?: string
  messageIncludes?: string
}

const adversarialChecks = new Set<string>()

function recordAdversarialCheck(name: string): void {
  assert.equal(adversarialChecks.has(name), false, `duplicate adversarial check name: ${name}`)
  adversarialChecks.add(name)
}

async function rejectsDatabaseOperation(
  name: string,
  work: () => Promise<unknown>,
  expected: ExpectedDatabaseError,
): Promise<void> {
  await assert.rejects(work, (error: unknown) => {
    if (typeof error !== 'object' || error === null || !('code' in error)) return false
    const databaseError = error as {
      code?: unknown
      constraint_name?: unknown
      message?: unknown
    }
    if (databaseError.code !== expected.code) return false
    if (expected.constraint && databaseError.constraint_name !== expected.constraint) return false
    if (
      expected.messageIncludes &&
      (typeof databaseError.message !== 'string' || !databaseError.message.includes(expected.messageIncludes))
    ) return false
    return true
  })
  recordAdversarialCheck(name)
}

try {
  const migrationRows = await owner<{ name: string }[]>`
    SELECT name FROM payload_migrations ORDER BY id
  `
  assert.deepEqual(migrationRows.map(({ name }) => name), [
    '20251207_081627',
    '20260428_students_tenant',
    '20260730_akademate_next_learning',
    '20260731_akademate_next_message_consistency',
    '20260802_akademate_next_signage',
    '20260803_akademate_next_offer_conversion_modes',
    '20260803_akademate_next_offer_runtime_access',
    '20260803_akademate_next_public_offer_projection',
    '20260803_akademate_next_public_offer_submissions',
  ])

  const rlsRows = await owner<{ relname: string; relrowsecurity: boolean; relforcerowsecurity: boolean }[]>`
    SELECT relname, relrowsecurity, relforcerowsecurity
    FROM pg_class
    WHERE relname IN (
      'campuses',
      'signage_displays',
      'signage_playlists',
      'signage_playlist_items',
      'signage_publications',
      'signage_device_principals'
    )
    ORDER BY relname
  `
  assert.equal(rlsRows.length, 6)
  assert.equal(rlsRows.every((row) => row.relrowsecurity && row.relforcerowsecurity), true)

  const policyRows = await owner<{ tablename: string; policyname: string; cmd: string }[]>`
    SELECT tablename, policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'campuses',
        'signage_displays',
        'signage_playlists',
        'signage_playlist_items',
        'signage_publications',
        'signage_device_principals'
      )
    ORDER BY tablename, policyname
  `
  assert.equal(policyRows.length, 13)
  for (const table of rlsRows.map(({ relname }) => relname)) {
    const policies = policyRows.filter(({ tablename }) => tablename === table)
    const expectedCount = table === 'campuses' ? 3 : 2
    assert.equal(
      policies.length,
      expectedCount,
      `${table} must have restrictive scope plus its bounded access policies`,
    )
    assert.equal(
      policies.filter(({ cmd }) => cmd === 'ALL').length,
      2,
      `${table} must retain restrictive tenant scope plus management policies`,
    )
    if (table === 'campuses') {
      assert.deepEqual(
        policies.filter(({ cmd }) => cmd === 'SELECT').map(({ policyname }) => policyname),
        ['campuses_public_offer_read'],
      )
    }
  }

  const [role] = await owner<{ rolsuper: boolean; rolbypassrls: boolean; ownerTables: number }[]>`
    SELECT
      role.rolsuper,
      role.rolbypassrls,
      count(table_class.oid)::integer AS "ownerTables"
    FROM pg_roles role
    LEFT JOIN pg_class table_class ON table_class.relowner = role.oid
      AND table_class.relnamespace = 'public'::regnamespace
      AND table_class.relname IN (
        'campuses',
        'signage_displays',
        'signage_playlists',
        'signage_playlist_items',
        'signage_publications',
        'signage_device_principals'
      )
    WHERE role.rolname = ${appRole}
    GROUP BY role.rolsuper, role.rolbypassrls
  `
  assert.deepEqual(role, { rolsuper: false, rolbypassrls: false, ownerTables: 0 })

  const [devicePrivilege] = await owner<{ canSelect: boolean; canInsert: boolean; canUseSequence: boolean }[]>`
    SELECT
      has_table_privilege(${appRole}, 'signage_device_principals', 'SELECT') AS "canSelect",
      has_table_privilege(${appRole}, 'signage_device_principals', 'INSERT') AS "canInsert",
      has_sequence_privilege(${appRole}, 'signage_device_principals_id_seq', 'USAGE') AS "canUseSequence"
  `
  assert.deepEqual(devicePrivilege, { canSelect: false, canInsert: false, canUseSequence: false })

  const [tenantA] = await owner<{ id: number }[]>`
    INSERT INTO tenants (name, slug) VALUES ('Tenant A', 'tenant-a') RETURNING id
  `
  const [tenantB] = await owner<{ id: number }[]>`
    INSERT INTO tenants (name, slug) VALUES ('Tenant B', 'tenant-b') RETURNING id
  `
  assert.ok(tenantA && tenantB)

  const [userA] = await owner<{ id: number }[]>`
    INSERT INTO users (password, name, role, tenant_id, email)
    VALUES ('not-used', 'Admin A', 'admin', ${tenantA.id}, 'admin-a@example.test')
    RETURNING id
  `
  const [userB] = await owner<{ id: number }[]>`
    INSERT INTO users (password, name, role, tenant_id, email)
    VALUES ('not-used', 'Admin B', 'admin', ${tenantB.id}, 'admin-b@example.test')
    RETURNING id
  `
  const [siteA1] = await owner<{ id: number }[]>`
    INSERT INTO campuses (slug, name, city, tenant_id)
    VALUES ('site-a1', 'Site A1', 'Madrid', ${tenantA.id}) RETURNING id
  `
  const [siteA2] = await owner<{ id: number }[]>`
    INSERT INTO campuses (slug, name, city, tenant_id)
    VALUES ('site-a2', 'Site A2', 'Malaga', ${tenantA.id}) RETURNING id
  `
  const [siteB1] = await owner<{ id: number }[]>`
    INSERT INTO campuses (slug, name, city, tenant_id)
    VALUES ('site-b1', 'Site B1', 'Stockholm', ${tenantB.id}) RETURNING id
  `
  assert.ok(userA && userB && siteA1 && siteA2 && siteB1)

  let displayA1Id = 0
  let playlistA1Id = 0
  let publicationId = 0
  await withScope(app, {
    tenantId: tenantA.id,
    siteId: siteA1.id,
    userId: userA.id,
    role: 'admin',
  }, async (transaction) => {
    const [display] = await transaction<{ id: number }[]>`
      INSERT INTO signage_displays (tenant_id, site_id, display_key, name, status)
      VALUES (${tenantA.id}, ${siteA1.id}, 'reception-main', 'Reception', 'active')
      RETURNING id
    `
    const [playlist] = await transaction<{ id: number }[]>`
      INSERT INTO signage_playlists (
        tenant_id, site_id, playlist_key, name, timezone, revision, created_by_user_id
      ) VALUES (
        ${tenantA.id}, ${siteA1.id}, 'daily-programme', 'Daily programme',
        'Europe/Madrid', 1, ${userA.id}
      ) RETURNING id
    `
    assert.ok(display && playlist)
    displayA1Id = display.id
    playlistA1Id = playlist.id

    await transaction`
      INSERT INTO signage_playlist_items (
        tenant_id, site_id, playlist_id, item_key, asset_key,
        duration_seconds, priority, position, schedule_days_mask
      ) VALUES (
        ${tenantA.id}, ${siteA1.id}, ${playlist.id}, 'welcome', 'asset-welcome',
        15, 10, 0, 62
      )
    `
    const [publication] = await transaction<{ id: number }[]>`
      INSERT INTO signage_publications (
        tenant_id, site_id, display_id, playlist_id, playlist_revision,
        publication_key, manifest_url, manifest_digest, expires_at,
        status, provider_reference, created_by_user_id
      ) VALUES (
        ${tenantA.id}, ${siteA1.id}, ${display.id}, ${playlist.id}, 1,
        'publication-a1', 'https://assets.example.test/a1.json',
        ${`sha256:${'a'.repeat(64)}`}, '2099-01-01T00:00:00.000Z',
        'accepted', 'provider-a1', ${userA.id}
      ) RETURNING id
    `
    assert.ok(publication)
    publicationId = publication.id
  })

  await owner`
    INSERT INTO signage_displays (tenant_id, site_id, display_key, name, status)
    VALUES (${tenantB.id}, ${siteB1.id}, 'reception-main', 'Tenant B reception', 'active')
  `
  const [playlistA2] = await owner<{ id: number }[]>`
    INSERT INTO signage_playlists (
      tenant_id, site_id, playlist_key, name, timezone, revision, created_by_user_id
    ) VALUES (
      ${tenantA.id}, ${siteA2.id}, 'site-a2-list', 'Site A2',
      'Europe/Madrid', 1, ${userA.id}
    ) RETURNING id
  `
  assert.ok(playlistA2)

  const withoutContext = await app`SELECT id FROM signage_displays`
  assert.equal(withoutContext.length, 0)
  recordAdversarialCheck('missing-scope-reads-no-displays')
  const withoutSite = await withScope(app, { tenantId: tenantA.id, role: 'admin' },
    (transaction) => transaction`SELECT id FROM signage_displays`)
  assert.equal(withoutSite.length, 0)
  recordAdversarialCheck('missing-site-reads-no-displays')
  const malformedTenant = await app.begin(async (transaction) => {
    await transaction`SELECT set_config('app.tenant_id', '1x', true)`
    await transaction`SELECT set_config('app.site_id', ${String(siteA1.id)}, true)`
    await transaction`SELECT set_config('app.role', 'admin', true)`
    return transaction`SELECT id FROM signage_displays`
  })
  assert.equal(malformedTenant.length, 0)
  recordAdversarialCheck('malformed-tenant-reads-no-displays')
  const malformedSite = await app.begin(async (transaction) => {
    await transaction`SELECT set_config('app.tenant_id', ${String(tenantA.id)}, true)`
    await transaction`SELECT set_config('app.site_id', '1x', true)`
    await transaction`SELECT set_config('app.role', 'admin', true)`
    return transaction`SELECT id FROM signage_displays`
  })
  assert.equal(malformedSite.length, 0)
  recordAdversarialCheck('malformed-site-reads-no-displays')

  for (const deniedRole of ['', 'student', 'teacher', 'unknown']) {
    const denied = await withScope(app, {
      tenantId: tenantA.id,
      siteId: siteA1.id,
      role: deniedRole,
    }, (transaction) => transaction`SELECT id FROM signage_displays`)
    assert.equal(denied.length, 0)
    recordAdversarialCheck(`role-${deniedRole || 'empty'}-reads-no-displays`)
  }

  await rejectsDatabaseOperation('student-cannot-create-display', () => withScope(app, {
    tenantId: tenantA.id,
    siteId: siteA1.id,
    role: 'student',
  }, (transaction) => transaction`
    INSERT INTO signage_displays (tenant_id, site_id, display_key, name)
    VALUES (${tenantA.id}, ${siteA1.id}, 'student-display', 'Student display')
  `), { code: '42501' })

  const scopedA = await withScope(app, {
    tenantId: tenantA.id,
    siteId: siteA1.id,
    role: 'admin',
  }, (transaction) => transaction`SELECT display_key FROM signage_displays ORDER BY id`)
  assert.deepEqual(scopedA.map(({ display_key }) => display_key), ['reception-main'])

  const crossTenant = await withScope(app, {
    tenantId: tenantB.id,
    siteId: siteB1.id,
    role: 'admin',
  }, (transaction) => transaction`SELECT tenant_id, display_key FROM signage_displays ORDER BY id`)
  assert.deepEqual([...crossTenant], [{ tenant_id: tenantB.id, display_key: 'reception-main' }])
  recordAdversarialCheck('tenant-scope-excludes-other-tenant')

  await rejectsDatabaseOperation('cross-site-display-insert', () => withScope(app, {
    tenantId: tenantA.id,
    siteId: siteA1.id,
    role: 'admin',
  }, (transaction) => transaction`
    INSERT INTO signage_displays (tenant_id, site_id, display_key, name)
    VALUES (${tenantA.id}, ${siteA2.id}, 'cross-site', 'Cross site')
  `), { code: '42501' })

  await rejectsDatabaseOperation('duplicate-publication-idempotency-key', () => withScope(app, {
    tenantId: tenantA.id,
    siteId: siteA1.id,
    userId: userA.id,
    role: 'admin',
  }, (transaction) => transaction`
    INSERT INTO signage_publications (
      tenant_id, site_id, display_id, playlist_id, playlist_revision,
      publication_key, manifest_url, manifest_digest, expires_at,
      status, created_by_user_id
    ) VALUES (
      ${tenantA.id}, ${siteA1.id}, ${displayA1Id}, ${playlistA1Id}, 1,
      'publication-a1', 'https://assets.example.test/idempotent.json',
      ${`sha256:${'e'.repeat(64)}`}, '2099-01-01T00:00:00.000Z',
      'queued', ${userA.id}
    )
  `), { code: '23505', constraint: 'signage_publications_idempotency_unique' })

  await rejectsDatabaseOperation('cross-site-playlist-item', () => withScope(app, {
    tenantId: tenantA.id,
    siteId: siteA1.id,
    role: 'admin',
  }, (transaction) => transaction`
    INSERT INTO signage_playlist_items (
      tenant_id, site_id, playlist_id, item_key, asset_key,
      duration_seconds, priority, position
    ) VALUES (
      ${tenantA.id}, ${siteA1.id}, ${playlistA2.id}, 'cross-playlist', 'asset-cross',
      10, 0, 0
    )
  `), { code: '23503', constraint: 'signage_playlist_items_playlist_fk' })

  await rejectsDatabaseOperation('second-accepted-publication-per-display', () => withScope(app, {
    tenantId: tenantA.id,
    siteId: siteA1.id,
    userId: userA.id,
    role: 'admin',
  }, (transaction) => transaction`
    INSERT INTO signage_publications (
      tenant_id, site_id, display_id, playlist_id, playlist_revision,
      publication_key, manifest_url, manifest_digest, expires_at,
      status, provider_reference, created_by_user_id
    ) VALUES (
      ${tenantA.id}, ${siteA1.id}, ${displayA1Id}, ${playlistA1Id}, 1,
      'publication-a2', 'https://assets.example.test/a2.json',
      ${`sha256:${'b'.repeat(64)}`}, '2099-01-01T00:00:00.000Z',
      'accepted', 'provider-a2', ${userA.id}
    )
  `), { code: '23505', constraint: 'signage_publications_one_accepted_per_display' })

  await rejectsDatabaseOperation('publication-snapshot-is-immutable', () => withScope(app, {
    tenantId: tenantA.id,
    siteId: siteA1.id,
    role: 'admin',
  }, (transaction) => transaction`
    UPDATE signage_publications
    SET manifest_digest = ${`sha256:${'c'.repeat(64)}`}
    WHERE id = ${publicationId}
  `), { code: 'P0001', messageIncludes: 'snapshot fields are immutable' })

  const crossScopeDelete = await withScope(app, {
    tenantId: tenantA.id,
    siteId: siteA2.id,
    role: 'admin',
  }, (transaction) => transaction`
    DELETE FROM signage_displays WHERE id = ${displayA1Id} RETURNING id
  `)
  assert.equal(crossScopeDelete.length, 0)
  recordAdversarialCheck('cross-site-delete-affects-no-rows')

  await rejectsDatabaseOperation('cross-site-display-move', () => withScope(app, {
    tenantId: tenantA.id,
    siteId: siteA1.id,
    role: 'admin',
  }, (transaction) => transaction`
    UPDATE signage_displays SET site_id = ${siteA2.id} WHERE id = ${displayA1Id}
  `), { code: '42501' })

  await rejectsDatabaseOperation('publication-rejects-cross-site-playlist', () => withScope(app, {
    tenantId: tenantA.id,
    siteId: siteA1.id,
    userId: userA.id,
    role: 'admin',
  }, (transaction) => transaction`
    INSERT INTO signage_publications (
      tenant_id, site_id, display_id, playlist_id, playlist_revision,
      publication_key, manifest_url, manifest_digest, expires_at,
      status, created_by_user_id
    ) VALUES (
      ${tenantA.id}, ${siteA1.id}, ${displayA1Id}, ${playlistA2.id}, 1,
      'cross-site-playlist', 'https://assets.example.test/cross-site.json',
      ${`sha256:${'f'.repeat(64)}`}, '2099-01-01T00:00:00.000Z',
      'queued', ${userA.id}
    )
  `), { code: '23503', constraint: 'signage_publications_playlist_fk' })

  await rejectsDatabaseOperation('publication-rejects-cross-tenant-creator', () => withScope(app, {
    tenantId: tenantA.id,
    siteId: siteA1.id,
    userId: userA.id,
    role: 'admin',
  }, (transaction) => transaction`
    INSERT INTO signage_publications (
      tenant_id, site_id, display_id, playlist_id, playlist_revision,
      publication_key, manifest_url, manifest_digest, expires_at,
      status, created_by_user_id
    ) VALUES (
      ${tenantA.id}, ${siteA1.id}, ${displayA1Id}, ${playlistA1Id}, 1,
      'cross-tenant-creator', 'https://assets.example.test/cross-tenant.json',
      ${`sha256:${'1'.repeat(64)}`}, '2099-01-01T00:00:00.000Z',
      'queued', ${userB.id}
    )
  `), { code: '23503', constraint: 'signage_publications_creator_fk' })

  await rejectsDatabaseOperation('accepted-publication-requires-provider-reference', () => withScope(app, {
    tenantId: tenantA.id,
    siteId: siteA1.id,
    userId: userA.id,
    role: 'admin',
  }, (transaction) => transaction`
    INSERT INTO signage_publications (
      tenant_id, site_id, display_id, playlist_id, playlist_revision,
      publication_key, manifest_url, manifest_digest, expires_at,
      status, created_by_user_id
    ) VALUES (
      ${tenantA.id}, ${siteA1.id}, ${displayA1Id}, ${playlistA1Id}, 1,
      'invalid-accepted', 'https://assets.example.test/invalid-accepted.json',
      ${`sha256:${'2'.repeat(64)}`}, '2099-01-01T00:00:00.000Z',
      'accepted', ${userA.id}
    )
  `), { code: '23514', constraint: 'signage_publications_state_fields_check' })

  await rejectsDatabaseOperation('revoked-publication-requires-revoked-at', () => withScope(app, {
    tenantId: tenantA.id,
    siteId: siteA1.id,
    userId: userA.id,
    role: 'admin',
  }, (transaction) => transaction`
    INSERT INTO signage_publications (
      tenant_id, site_id, display_id, playlist_id, playlist_revision,
      publication_key, manifest_url, manifest_digest, expires_at,
      status, created_by_user_id
    ) VALUES (
      ${tenantA.id}, ${siteA1.id}, ${displayA1Id}, ${playlistA1Id}, 1,
      'invalid-revoked', 'https://assets.example.test/invalid-revoked.json',
      ${`sha256:${'3'.repeat(64)}`}, '2099-01-01T00:00:00.000Z',
      'revoked', ${userA.id}
    )
  `), { code: '23514', constraint: 'signage_publications_state_fields_check' })

  const [transitionPublication] = await withScope(app, {
    tenantId: tenantA.id,
    siteId: siteA1.id,
    userId: userA.id,
    role: 'admin',
  }, (transaction) => transaction<{ id: number }[]>`
    INSERT INTO signage_publications (
      tenant_id, site_id, display_id, playlist_id, playlist_revision,
      publication_key, manifest_url, manifest_digest, expires_at,
      status, created_by_user_id
    ) VALUES (
      ${tenantA.id}, ${siteA1.id}, ${displayA1Id}, ${playlistA1Id}, 1,
      'transition-publication', 'https://assets.example.test/transition.json',
      ${`sha256:${'4'.repeat(64)}`}, '2099-01-01T00:00:00.000Z',
      'queued', ${userA.id}
    ) RETURNING id
  `)
  assert.ok(transitionPublication)
  await owner`
    UPDATE signage_publications
    SET status = 'rejected', failure_reason = 'provider rejected request'
    WHERE id = ${transitionPublication.id}
  `
  await rejectsDatabaseOperation('rejected-publication-cannot-return-to-queue', () => owner`
    UPDATE signage_publications
    SET status = 'queued', failure_reason = NULL
    WHERE id = ${transitionPublication.id}
  `, { code: 'P0001', messageIncludes: 'can only be revoked' })
  await owner`
    UPDATE signage_publications
    SET status = 'revoked', revoked_at = now()
    WHERE id = ${transitionPublication.id}
  `
  await rejectsDatabaseOperation('revoked-publication-cannot-reactivate', () => owner`
    UPDATE signage_publications
    SET status = 'queued', failure_reason = NULL, revoked_at = NULL
    WHERE id = ${transitionPublication.id}
  `, { code: 'P0001', messageIncludes: 'revocation is terminal' })

  const [devicePrincipal] = await owner<{ id: number }[]>`
    INSERT INTO signage_device_principals (
      tenant_id, site_id, display_id, credential_key, credential_version,
      secret_hash, secret_hint, expires_at
    ) VALUES (
      ${tenantA.id}, ${siteA1.id}, ${displayA1Id}, 'device-credential-a1', 1,
      ${'d'.repeat(64)}, 'hintA123', '2099-01-01T00:00:00.000Z'
    ) RETURNING id
  `
  assert.ok(devicePrincipal)
  await rejectsDatabaseOperation('second-active-device-principal', () => owner`
    INSERT INTO signage_device_principals (
      tenant_id, site_id, display_id, credential_key, credential_version,
      secret_hash, secret_hint, expires_at
    ) VALUES (
      ${tenantA.id}, ${siteA1.id}, ${displayA1Id}, 'device-credential-a2', 2,
      ${'e'.repeat(64)}, 'hintB456', '2099-01-01T00:00:00.000Z'
    )
  `, { code: '23505', constraint: 'signage_device_principals_one_active_per_display' })
  await rejectsDatabaseOperation('app-role-cannot-read-device-secrets', () => withScope(app, {
    tenantId: tenantA.id,
    siteId: siteA1.id,
    role: 'admin',
  }, (transaction) => transaction`SELECT secret_hash FROM signage_device_principals`), { code: '42501' })

  await rejectsDatabaseOperation('device-principal-identity-is-immutable', () => owner`
    UPDATE signage_device_principals
    SET secret_hash = ${'9'.repeat(64)}
    WHERE id = ${devicePrincipal.id}
  `, { code: 'P0001', messageIncludes: 'identity fields are immutable' })
  await owner`
    UPDATE signage_device_principals
    SET status = 'revoked', revoked_at = now()
    WHERE id = ${devicePrincipal.id}
  `
  await rejectsDatabaseOperation('revoked-device-principal-cannot-reactivate', () => owner`
    UPDATE signage_device_principals
    SET status = 'active', revoked_at = NULL
    WHERE id = ${devicePrincipal.id}
  `, { code: 'P0001', messageIncludes: 'revocation is terminal' })

  await rejectsDatabaseOperation('device-principal-rejects-cross-site-display', () => owner`
    INSERT INTO signage_device_principals (
      tenant_id, site_id, display_id, credential_key, credential_version,
      secret_hash, secret_hint, expires_at
    ) VALUES (
      ${tenantA.id}, ${siteA2.id}, ${displayA1Id}, 'cross-site-device', 3,
      ${'8'.repeat(64)}, 'hintC789', '2099-01-01T00:00:00.000Z'
    )
  `, { code: '23503', constraint: 'signage_device_principals_display_fk' })

  const afterTransactions = await app`SELECT id FROM signage_displays`
  assert.equal(afterTransactions.length, 0)

  process.stdout.write(`${JSON.stringify({
    migrations: migrationRows.length,
    rlsTables: rlsRows.length,
    policies: policyRows.length,
    adversarialChecks: adversarialChecks.size,
    appRole: `${appRole}:non-owner-nobypassrls`,
    deviceSecrets: 'not-readable-by-app-role',
  })}\n`)
} finally {
  await Promise.allSettled([owner.end(), app.end()])
}
