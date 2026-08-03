import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const envPath = 'infrastructure/akademate-next/.env.example'
const composePath = 'infrastructure/akademate-next/compose.yaml'

function resolvedCompose() {
  return JSON.parse(execFileSync('docker', [
    'compose', '--env-file', envPath, '-f', composePath, 'config', '--format', 'json',
  ], { encoding: 'utf8' }))
}

test('gives payment egress only to tenant-admin while preserving the internal data plane', () => {
  const compose = resolvedCompose()
  assert.equal(compose.networks.akademate_next_internal.internal, true)
  assert.equal(compose.networks.akademate_next_egress.internal ?? false, false)
  assert.deepEqual(Object.keys(compose.services['tenant-admin'].networks).sort(), [
    'akademate_next_egress',
    'akademate_next_internal',
  ])
  for (const service of ['postgres', 'redis', 'migrate', 'campus']) {
    assert.deepEqual(Object.keys(compose.services[service].networks), ['akademate_next_internal'])
  }
})

test('keeps public offers and providers default-off while transporting the complete server contract', () => {
  const environment = resolvedCompose().services['tenant-admin'].environment
  assert.equal(environment.AKADEMATE_NEXT_OFFERS_ENABLED, 'false')
  assert.equal(environment.AKADEMATE_NEXT_PUBLIC_OFFERS_ENABLED, 'false')
  assert.equal(environment.AKADEMATE_NEXT_PUBLIC_SUBMISSIONS_ENABLED, 'false')
  assert.equal(environment.AKADEMATE_NEXT_PAID_OFFERS_ENABLED, 'false')

  for (const name of [
    'AKADEMATE_NEXT_PUBLIC_PRIVACY_NOTICE_URL',
    'AKADEMATE_NEXT_PUBLIC_PRIVACY_NOTICE_VERSION',
    'AKADEMATE_NEXT_PUBLIC_SUBMISSION_PEPPER',
    'AKADEMATE_NEXT_STRIPE_SECRET_KEY',
    'AKADEMATE_NEXT_STRIPE_WEBHOOK_SECRET',
    'AKADEMATE_NEXT_PAYPAL_ENVIRONMENT',
    'AKADEMATE_NEXT_PAYPAL_CLIENT_ID',
    'AKADEMATE_NEXT_PAYPAL_CLIENT_SECRET',
    'AKADEMATE_NEXT_PAYPAL_WEBHOOK_ID',
  ]) {
    assert.equal(Object.hasOwn(environment, name), true, `${name} must reach tenant-admin`)
    assert.equal(environment[name], '')
  }
})

test('documents names but never example values that resemble provider credentials', async () => {
  const example = await readFile(envPath, 'utf8')
  for (const name of [
    'AKADEMATE_NEXT_PAID_OFFERS_ENABLED',
    'AKADEMATE_NEXT_STRIPE_SECRET_KEY',
    'AKADEMATE_NEXT_STRIPE_WEBHOOK_SECRET',
    'AKADEMATE_NEXT_PAYPAL_ENVIRONMENT',
    'AKADEMATE_NEXT_PAYPAL_CLIENT_ID',
    'AKADEMATE_NEXT_PAYPAL_CLIENT_SECRET',
    'AKADEMATE_NEXT_PAYPAL_WEBHOOK_ID',
  ]) assert.match(example, new RegExp(`^${name}=`, 'm'))

  assert.doesNotMatch(example, /sk_(?:test|live)_[A-Za-z0-9]{16,}/)
  assert.doesNotMatch(example, /whsec_[A-Za-z0-9]{24,}/)
})
