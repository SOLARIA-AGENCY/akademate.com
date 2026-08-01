import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const route = readFileSync(path.join(
  root,
  'apps/tenant-admin/app/api/learning/conversations/[conversationId]/messages/route.ts',
), 'utf8')
const handler = readFileSync(path.join(
  root,
  'apps/tenant-admin/src/lib/learning/send-message-handler.ts',
), 'utf8')

test('wires only the dedicated Next session verifier', () => {
  assert.match(route, /authenticateNextLearningRequest/)
  assert.equal(route.includes('getAuthenticatedUserContext'), false)
  assert.equal(route.includes('cep_session'), false)
  assert.equal(route.includes('/api/leads/_lib/auth'), false)
})

test('keeps messaging default-off behind an explicit exact flag', () => {
  assert.match(route, /AKADEMATE_NEXT_LEARNING_MESSAGING_ENABLED === 'true'/)
  assert.match(handler, /dependencies\.runtime\(\) !== 'next' \|\| !dependencies\.enabled\(\)/)
})

test('keeps attachments fail-closed until scoped asset authorization exists', () => {
  assert.match(handler, /attachmentIds: z\.array\(z\.never\(\)\)\.max\(0\)/)
})
