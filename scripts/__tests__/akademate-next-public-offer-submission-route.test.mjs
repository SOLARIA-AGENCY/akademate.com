import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const path = 'apps/tenant-admin/app/api/next/public/offers/[slug]/submissions/route.ts'
const source = await readFile(path, 'utf8')

test('keeps public submissions Next-only, separately flagged and size bounded', () => {
  assert.match(source, /AKADEMATE_RUNTIME !== 'next'/)
  assert.match(source, /AKADEMATE_NEXT_PUBLIC_SUBMISSIONS_ENABLED !== 'true'/)
  assert.match(source, /content-length/)
  assert.match(source, /submission_too_large/)
  assert.match(source, /privacyNoticeVersion/)
  assert.match(source, /fingerprintPepper/)
})

test('exposes only POST and never imports the CEP lead collection', () => {
  assert.match(source, /export async function POST/)
  assert.doesNotMatch(source, /export async function (GET|PUT|PATCH|DELETE)/)
  assert.doesNotMatch(source, /collections\/Leads|api\/leads|cepformacion|cepcomunicacion/i)
})
