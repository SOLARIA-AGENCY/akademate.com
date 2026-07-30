import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { validateDockerContext, validateNextIsolation } from '../lib/akademate-next-isolation.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const composeText = readFileSync(path.join(root, 'infrastructure/akademate-next/compose.yaml'), 'utf8')
const envText = readFileSync(path.join(root, 'infrastructure/akademate-next/.env.example'), 'utf8')
const dockerignoreText = readFileSync(path.join(root, '.dockerignore'), 'utf8')

test('accepts the committed isolated Next contract', () => {
  assert.deepEqual(validateNextIsolation({ composeText, envText }), {
    project: 'akademate-next',
    isolated: true,
  })
})

test('rejects CEP hosts and live container identities', () => {
  for (const injected of ['https://cepformacion.akademate.com', 'akademate-tenant-final']) {
    assert.throws(
      () => validateNextIsolation({ composeText: `${composeText}\n# ${injected}`, envText }),
      /forbidden production identifier/,
    )
  }
})

test('rejects a shared volume or external network', () => {
  assert.throws(
    () => validateNextIsolation({ composeText: composeText.replace('name: akademate_next_media_data', 'name: tenant-admin_media_data'), envText }),
    /forbidden production identifier|dedicated resource/,
  )
  assert.throws(
    () => validateNextIsolation({ composeText: composeText.replace('internal: true', 'external: true'), envText }),
    /external Docker networks/,
  )
})

test('rejects generic data-plane names and non-local example URLs', () => {
  assert.throws(
    () => validateNextIsolation({ composeText, envText: envText.replace('AKADEMATE_NEXT_DB_NAME=akademate_next', 'AKADEMATE_NEXT_DB_NAME=akademate') }),
    /environment contract missing/,
  )
  assert.throws(
    () => validateNextIsolation({ composeText, envText: envText.replace('http://localhost:3109', 'https://example.invalid') }),
    /example tenant URL must remain local/,
  )
})

test('rejects a Redis service that does not receive its healthcheck password', () => {
  const withoutRedisPassword = composeText.replace(
    '    environment:\n      AKADEMATE_NEXT_REDIS_PASSWORD: ${AKADEMATE_NEXT_REDIS_PASSWORD:?AKADEMATE_NEXT_REDIS_PASSWORD is required}\n',
    '',
  )
  assert.equal(/^ {6}AKADEMATE_NEXT_REDIS_PASSWORD:\s*/m.test(withoutRedisPassword), false)
  assert.throws(
    () => validateNextIsolation({ composeText: withoutRedisPassword, envText }),
    /Redis service must receive its dedicated password variable/,
  )
})

test('requires backup and release archives to stay outside the Docker context', () => {
  assert.deepEqual(validateDockerContext(dockerignoreText), { sensitiveArtifactsExcluded: true })
  assert.throws(
    () => validateDockerContext(dockerignoreText.replace('*.sql.gz\n', '')),
    /Docker context must exclude \*\.sql\.gz/,
  )
})
