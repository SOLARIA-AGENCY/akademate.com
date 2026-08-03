import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const migrationText = readFileSync(
  path.join(root, 'apps/tenant-admin/migrations/20260730_akademate_next_learning.ts'),
  'utf8',
)
const messageConsistencyMigrationText = readFileSync(
  path.join(
    root,
    'apps/tenant-admin/migrations/20260731_akademate_next_message_consistency.ts',
  ),
  'utf8',
)
const migrationIndexText = readFileSync(
  path.join(root, 'apps/tenant-admin/migrations/index.ts'),
  'utf8',
)

const TABLES = [
  'learning_memberships',
  'learning_conversations',
  'learning_conversation_participants',
  'learning_messages',
  'learning_assignments',
  'learning_submissions',
  'learning_grades',
]

test('creates exactly the seven canonical Next learning tables without drift masking', () => {
  const created = [...migrationText.matchAll(/CREATE TABLE "(learning_[a-z_]+)"/g)].map((match) => match[1])
  assert.deepEqual(created, TABLES)
  assert.equal(/CREATE TABLE IF NOT EXISTS "learning_/.test(migrationText), false)
})

test('adds explicit tenant-scoped user links for student and staff profiles', () => {
  assert.match(migrationText, /ALTER TABLE "students" ADD COLUMN "user_account_id" integer/)
  assert.match(migrationText, /ALTER TABLE "staff" ADD COLUMN "tenant_id" integer NOT NULL/)
  assert.match(migrationText, /ALTER TABLE "staff" ADD COLUMN "user_account_id" integer/)
  assert.match(migrationText, /FOREIGN KEY \("tenant_id", "user_account_id"\) REFERENCES "users"\("tenant_id", "id"\)/)
})

test('enables and forces fail-closed RLS on every learning table', () => {
  for (const table of TABLES) {
    assert.match(migrationText, new RegExp(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`))
    assert.match(migrationText, new RegExp(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`))
    assert.match(migrationText, new RegExp(`CREATE POLICY "${table}_tenant_isolation" ON "${table}"`))
  }
  assert.match(migrationText, /akademate_next_current_tenant_id\(\)/)
  assert.match(migrationText, /akademate_next_current_user_id\(\)/)
  assert.match(migrationText, /pg_input_is_valid\(current_setting\('app\.tenant_id'/)
  assert.match(migrationText, /pg_input_is_valid\(current_setting\('app\.user_id'/)
  assert.equal(/current_setting\([^)]*\)::integer/.test(migrationText), false)
})

test('does not grant participant reads through a broad instructor management policy', () => {
  assert.equal(migrationText.includes('learning_conversation_participants_manage'), false)
  assert.match(migrationText, /CREATE POLICY "learning_conversation_participants_create"/)
  assert.match(migrationText, /CREATE POLICY "learning_conversation_participants_update"/)
  assert.match(migrationText, /CREATE POLICY "learning_conversation_participants_delete"/)
  assert.match(migrationText, /CREATE FUNCTION "akademate_next_is_conversation_moderator"/)
  assert.match(messageConsistencyMigrationText, /CREATE FUNCTION "akademate_next_lock_learning_membership"/)
  assert.match(messageConsistencyMigrationText, /CREATE FUNCTION "akademate_next_lock_learning_conversation"/)
  assert.match(messageConsistencyMigrationText, /CREATE FUNCTION "akademate_next_lock_learning_participant"/)
  const participantPolicies = migrationText.split('CREATE POLICY "learning_conversation_participants_tenant_isolation"')[1]
    ?.split('CREATE POLICY "learning_messages_tenant_isolation"')[0] ?? ''
  assert.equal(participantPolicies.includes('FROM learning_conversation_participants moderator'), false)
})

test('allows operational membership administration without an academic surface bypass', () => {
  assert.match(migrationText, /CREATE FUNCTION "akademate_next_can_manage_memberships"/)
  assert.match(migrationText, /current_setting\('app\.role', true\).*IN \('admin', 'gestor'\)/s)
  assert.match(migrationText, /CREATE POLICY "learning_memberships_manage"/)

  const academicPolicies = migrationText.split('CREATE POLICY "learning_conversations_tenant_isolation"')[1]
    ?.split('REVOKE ALL ON "learning_memberships"')[0] ?? ''
  assert.equal(academicPolicies.includes('akademate_next_can_manage_memberships'), false)
})

test('validates the exact Next runtime before up and down execute SQL', () => {
  const upBody = migrationText.split('export async function up')[1]?.split('export async function down')[0] ?? ''
  const downBody = migrationText.split('export async function down')[1] ?? ''

  for (const body of [upBody, downBody]) {
    const gate = body.indexOf('assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)')
    const execute = body.indexOf('db.execute')
    assert.ok(gate >= 0 && execute > gate, 'runtime gate must execute before database SQL')
  }
})

test('derives the application grant target from a validated role identifier', () => {
  assert.match(migrationText, /resolveNextDatabaseAppRole\(process\.env\.AKADEMATE_NEXT_DB_APP_USER\)/)
  assert.match(migrationText, /sql\.raw\(`/)
  assert.equal(migrationText.includes('TO "akademate_next_app"'), false)
})

test('registers the migration only through the exact runtime selector', () => {
  assert.match(migrationIndexText, /selectRuntimeMigrations\(/)
  assert.match(migrationIndexText, /process\.env\.AKADEMATE_RUNTIME/)
  assert.match(migrationIndexText, /name: '20260730_akademate_next_learning'/)
  assert.match(migrationIndexText, /migration_20260730_akademate_next_learning\.up/)
  const nextManifest = migrationIndexText.split('const nextMigrations = [')[1]?.split('export const migrations')[0] ?? ''
  assert.deepEqual(
    [...nextManifest.matchAll(/name: '([^']+)'/g)].map((match) => match[1]),
    [
      '20251207_081627',
      '20260428_students_tenant',
      '20260730_akademate_next_learning',
      '20260731_akademate_next_message_consistency',
      '20260802_akademate_next_signage',
      '20260803_akademate_next_offer_conversion_modes',
      '20260803_akademate_next_offer_runtime_access',
      '20260803_akademate_next_public_offer_projection',
    ],
  )
  for (const forbidden of ['cep_planning', 'campus_virtual_internal', 'staging_']) {
    assert.equal(nextManifest.includes(forbidden), false)
  }
})

test('defines idempotency and cross-scope integrity constraints', () => {
  assert.match(
    messageConsistencyMigrationText,
    /UNIQUE \("tenant_id", "conversation_id", "sender_user_id", "client_message_id"\)/,
  )
  assert.match(migrationText, /UNIQUE \("tenant_id", "assignment_id", "student_user_id", "client_submission_id"\)/)
  assert.match(migrationText, /UNIQUE \("tenant_id", "submission_id"\)/)
  assert.match(migrationText, /FOREIGN KEY \("tenant_id", "assignment_id", "course_run_id"\)/)
  assert.match(migrationText, /FOREIGN KEY \("tenant_id", "submission_id", "course_run_id", "assignment_id", "student_user_id"\)/)
})

test('fails closed before destructive rollback when sender-scoped ids overlap', () => {
  const downBody = messageConsistencyMigrationText.split('export async function down')[1] ?? ''
  const preflight = downBody.indexOf('HAVING count(*) > 1')
  const destructiveChange = downBody.indexOf('DROP CONSTRAINT "learning_messages_sender_client_unique"')
  assert.ok(preflight >= 0 && destructiveChange > preflight)
  assert.match(downBody, /RAISE EXCEPTION/)
})

test('keeps Payload document locks aligned with every new collection', () => {
  for (const table of TABLES) {
    assert.match(
      migrationText,
      new RegExp(`ADD COLUMN "${table}_id" integer`),
    )
    assert.match(
      migrationText,
      new RegExp(`FOREIGN KEY \\("${table}_id"\\) REFERENCES "${table}"\\("id"\\)`),
    )
    const dropColumn = migrationText.indexOf(`DROP COLUMN "${table}_id"`)
    const dropTable = migrationText.indexOf(`DROP TABLE "${table}"`)
    assert.ok(dropColumn >= 0 && dropTable > dropColumn, `${table} lock relation must be dropped first`)
  }
})
