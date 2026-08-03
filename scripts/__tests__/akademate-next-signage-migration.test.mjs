import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const migrationPath = path.join(
  root,
  'apps/tenant-admin/migrations/20260802_akademate_next_signage.ts',
)
const migrationText = readFileSync(migrationPath, 'utf8')
const migrationIndexText = readFileSync(
  path.join(root, 'apps/tenant-admin/migrations/index.ts'),
  'utf8',
)
const collectionText = readFileSync(
  path.join(root, 'apps/tenant-admin/src/runtime/next-collection-configs.ts'),
  'utf8',
)

const TABLES = [
  'signage_displays',
  'signage_playlists',
  'signage_playlist_items',
  'signage_publications',
  'signage_device_principals',
]

test('creates the exact append-only signage schema without idempotent DDL', () => {
  const created = [...migrationText.matchAll(/CREATE TABLE "(signage_[a-z_]+)"/g)]
    .map((match) => match[1])
  assert.deepEqual(created, TABLES)
  assert.equal(/CREATE TABLE IF NOT EXISTS "signage_/.test(migrationText), false)
  assert.match(migrationText, /ALTER TABLE "campuses" ALTER COLUMN "tenant_id" SET NOT NULL/)
  assert.match(
    migrationText,
    /CONSTRAINT "campuses_tenant_id_id_unique" UNIQUE \("tenant_id", "id"\)/,
  )
})

test('binds every child relation to the same tenant and site', () => {
  for (const table of TABLES) {
    assert.match(
      migrationText,
      new RegExp(`CONSTRAINT "${table}_site_fk"[\\s\\S]*FOREIGN KEY \\(\\"tenant_id\\", \\"site_id\\"\\)[\\s\\S]*REFERENCES \\"campuses\\"\\(\\"tenant_id\\", \\"id\\"\\)`),
    )
  }

  assert.match(
    migrationText,
    /FOREIGN KEY \("tenant_id", "site_id", "playlist_id"\)[\s\S]*REFERENCES "signage_playlists"\("tenant_id", "site_id", "id"\)/,
  )
  assert.match(
    migrationText,
    /FOREIGN KEY \("tenant_id", "site_id", "display_id"\)[\s\S]*REFERENCES "signage_displays"\("tenant_id", "site_id", "id"\)/,
  )
})

test('enables and forces tenant plus site RLS on every signage table', () => {
  assert.match(migrationText, /CREATE FUNCTION "akademate_next_current_site_id"\(\)/)
  assert.match(migrationText, /pg_input_is_valid\(current_setting\('app\.site_id'/)
  assert.equal(/current_setting\([^)]*app\.site_id[^)]*\)::integer/.test(migrationText), false)

  for (const table of TABLES) {
    assert.match(migrationText, new RegExp(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`))
    assert.match(migrationText, new RegExp(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`))
    assert.match(migrationText, new RegExp(`CREATE POLICY "${table}_tenant_site_isolation"`))
  }

  assert.match(migrationText, /"tenant_id" = akademate_next_current_tenant_id\(\)/)
  assert.match(migrationText, /"site_id" = akademate_next_current_site_id\(\)/)
  assert.match(migrationText, /current_setting\('app\.role', true\).*IN \('admin', 'gestor'\)/s)
})

test('stores only a device secret hash and enforces credential lifecycle', () => {
  assert.match(migrationText, /"secret_hash" char\(64\) NOT NULL/)
  assert.match(migrationText, /"secret_hash" ~ '\^\[a-f0-9\]\{64\}\$'/)
  assert.match(migrationText, /"credential_version" integer NOT NULL/)
  assert.match(migrationText, /"status" IN \('active', 'revoked'\)/)
  assert.match(migrationText, /\("status" = 'revoked'\) = \("revoked_at" IS NOT NULL\)/)
  assert.equal(/secret_plaintext|raw_secret|credential_secret"/i.test(migrationText), false)
})

test('enforces canonical keys, publication idempotency and bounded states', () => {
  assert.match(migrationText, /CHECK \("display_key" ~ '\^\[A-Za-z0-9\]/)
  assert.match(migrationText, /CHECK \("playlist_key" ~ '\^\[A-Za-z0-9\]/)
  assert.match(migrationText, /CHECK \("item_key" ~ '\^\[A-Za-z0-9\]/)
  assert.match(migrationText, /CHECK \("publication_key" ~ '\^\[A-Za-z0-9\]/)
  assert.match(
    migrationText,
    /UNIQUE \("tenant_id", "site_id", "display_id", "publication_key"\)/,
  )
  assert.match(migrationText, /"status" IN \('queued', 'accepted', 'rejected', 'unavailable', 'revoked'\)/)
  assert.match(migrationText, /"manifest_digest" ~ '\^sha256:\[a-f0-9\]\{64\}\$'/)
  assert.match(
    migrationText,
    /CREATE UNIQUE INDEX "signage_publications_one_accepted_per_display"[\s\S]*WHERE "status" = 'accepted'/,
  )
  assert.match(
    migrationText,
    /CREATE UNIQUE INDEX "signage_device_principals_one_active_per_display"[\s\S]*WHERE "status" = 'active'/,
  )
})

test('keeps publication snapshots and device credential identities immutable', () => {
  assert.match(migrationText, /CREATE FUNCTION "akademate_next_guard_signage_publication_update"/)
  assert.match(migrationText, /CREATE TRIGGER "signage_publications_immutable_snapshot"/)
  assert.match(migrationText, /OLD\."manifest_digest" IS DISTINCT FROM NEW\."manifest_digest"/)
  assert.match(migrationText, /CREATE FUNCTION "akademate_next_guard_signage_principal_update"/)
  assert.match(migrationText, /CREATE TRIGGER "signage_device_principals_immutable_identity"/)
  assert.match(migrationText, /OLD\."secret_hash" IS DISTINCT FROM NEW\."secret_hash"/)
  assert.match(migrationText, /Signage publication revocation is terminal/)
  assert.match(migrationText, /Terminal signage publication state can only be revoked/)
  assert.match(migrationText, /Signage device principal revocation is terminal/)
  assert.match(migrationText, /ERRCODE = 'P0001'/)
})

test('withholds device secret storage from generic application CRUD', () => {
  assert.match(
    migrationText,
    /REVOKE ALL ON "signage_device_principals" FROM \$\{applicationRoleIdentifier\}/,
  )
  assert.equal(
    /GRANT SELECT, INSERT, UPDATE, DELETE ON "signage_device_principals"/.test(migrationText),
    false,
  )

  const principalCollection = collectionText.split('export const SignageDevicePrincipals')[1]
    ?.split('export const nextCollectionConfigs')[0] ?? ''
  assert.equal(principalCollection.includes("name: 'secret_hash'"), false)
})

test('registers signage only in the exact Next migration and collection manifests', () => {
  assert.match(migrationIndexText, /migration_20260802_akademate_next_signage/)
  assert.match(migrationIndexText, /name: '20260802_akademate_next_signage'/)
  const nextManifest = migrationIndexText.split('const nextMigrations = [')[1]
    ?.split('export const migrations')[0] ?? ''
  const legacyManifest = migrationIndexText.split('const legacyMigrations = [')[1]
    ?.split('const nextMigrations')[0] ?? ''
  assert.match(nextManifest, /20260802_akademate_next_signage/)
  assert.equal(legacyManifest.includes('20260802_akademate_next_signage'), false)

  for (const slug of [
    'campuses',
    'signage-displays',
    'signage-playlists',
    'signage-playlist-items',
    'signage-publications',
    'signage-device-principals',
  ]) {
    assert.match(collectionText, new RegExp(`slug: '${slug}'`))
  }
})

test('guards destructive rollback once operational signage data exists', () => {
  const downBody = migrationText.split('export async function down')[1] ?? ''
  assert.match(downBody, /Cannot roll back Akademate Next signage: operational data exists/)
  for (const table of TABLES) {
    assert.match(downBody, new RegExp(`EXISTS \\(SELECT 1 FROM "${table}"\\)`))
  }
  assert.match(
    downBody,
    /REVOKE SELECT, INSERT, UPDATE, DELETE ON "campuses" FROM \$\{applicationRoleIdentifier\}/,
  )
  assert.ok(
    downBody.indexOf('REVOKE SELECT, INSERT, UPDATE, DELETE ON "campuses"') <
      downBody.indexOf('ALTER TABLE "campuses" DISABLE ROW LEVEL SECURITY'),
  )
})

test('keeps the migration fail-closed outside Next and resolves the app role safely', () => {
  assert.match(migrationText, /assertAkademateNextRuntime\(process\.env\.AKADEMATE_RUNTIME\)/)
  assert.match(
    migrationText,
    /resolveNextDatabaseAppRole\(process\.env\.AKADEMATE_NEXT_DB_APP_USER\)/,
  )
  const downBody = migrationText.split('export async function down')[1] ?? ''
  assert.match(
    downBody,
    /resolveNextDatabaseAppRole\(process\.env\.AKADEMATE_NEXT_DB_APP_USER\)/,
  )
  assert.equal(migrationText.includes('TO "akademate_next_app"'), false)
})
