import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const route = readFileSync(path.join(
  root,
  'apps/tenant-admin/app/api/next/public/offers/[slug]/route.ts',
), 'utf8')
const layout = readFileSync(path.join(
  root,
  'apps/tenant-admin/app/(next-public)/layout.tsx',
), 'utf8')

test('keeps the public offer route default-off and read-only', () => {
  assert.match(route, /AKADEMATE_NEXT_PUBLIC_OFFERS_ENABLED !== 'true'/)
  assert.match(route, /export async function GET/)
  assert.equal(/export const (POST|PATCH|PUT|DELETE)/.test(route), false)
})

test('does not import CEP public runtime, branding or trackers', () => {
  const combined = `${route}\n${layout}`.toLowerCase()
  for (const forbidden of [
    'cepformacion',
    'cep formación',
    'tenant-host-branding',
    'publicpageviewtracker',
    'publicconsentmanager',
    '@payload-config',
  ]) assert.equal(combined.includes(forbidden), false)
})
