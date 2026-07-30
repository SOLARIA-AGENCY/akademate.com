import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { validateNextDatabaseRoles } from '../lib/akademate-next-isolation.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const composeText = readFileSync(path.join(root, 'infrastructure/akademate-next/compose.yaml'), 'utf8')
const envText = readFileSync(path.join(root, 'infrastructure/akademate-next/.env.example'), 'utf8')
const initRoleText = readFileSync(
  path.join(root, 'infrastructure/akademate-next/postgres-init/010-create-app-role.sh'),
  'utf8',
)

test('separates the database owner, migrator and non-bypass application role', () => {
  assert.deepEqual(validateNextDatabaseRoles({ composeText, envText, initRoleText }), {
    databaseRoles: 'separated',
  })
})

test('rejects an application connection that uses owner credentials', () => {
  assert.throws(
    () => validateNextDatabaseRoles({
      composeText: composeText.replace(
        '${AKADEMATE_NEXT_DB_APP_USER}:${AKADEMATE_NEXT_DB_APP_PASSWORD}',
        '${AKADEMATE_NEXT_DB_OWNER_USER}:${AKADEMATE_NEXT_DB_OWNER_PASSWORD}',
      ),
      envText,
      initRoleText,
    }),
    /tenant-admin must connect with the non-owner application role/,
  )
})

test('rejects a role with superuser or RLS bypass capabilities', () => {
  for (const capability of ['NOSUPERUSER', 'NOBYPASSRLS']) {
    assert.throws(
      () => validateNextDatabaseRoles({
        composeText,
        envText,
        initRoleText: initRoleText.replaceAll(capability, capability.slice(2)),
      }),
      /application role must explicitly disable privileged capabilities/,
    )
  }
})

test('requires migrations to complete before tenant-admin starts', () => {
  assert.throws(
    () => validateNextDatabaseRoles({
      composeText: composeText.replace('condition: service_completed_successfully', 'condition: service_started'),
      envText,
      initRoleText,
    }),
    /tenant-admin must wait for the migration job to complete/,
  )
})
