import test from 'node:test'
import assert from 'node:assert/strict'
import worker from './index.mjs'

const validPayload = {
  kind: 'contact',
  replyTo: 'visitor@example.com',
  subject: '[Akademate] Demo request',
  text: 'A valid academy enquiry.',
}

function env(send = async () => ({ messageId: 'message-1' })) {
  return { CONTACT_MAILER_TOKEN: 'test-secret', CONTACT_TO: 'private@example.invalid', EMAIL: { send } }
}

function request(payload = validPayload, token = 'test-secret') {
  return new Request('https://mailer.example.workers.dev', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

test('rejects an invalid shared secret before parsing or sending', async () => {
  let sends = 0
  const response = await worker.fetch(request(validPayload, 'wrong-secret'), env(async () => { sends += 1 }))
  assert.equal(response.status, 401)
  assert.equal(sends, 0)
})

test('rejects unexpected fields instead of forwarding arbitrary input', async () => {
  let sends = 0
  const response = await worker.fetch(request({ ...validPayload, recipient: 'attacker@example.com' }), env(async () => { sends += 1 }))
  assert.equal(response.status, 400)
  assert.equal(sends, 0)
})

test('rejects an oversized body', async () => {
  const response = await worker.fetch(request({ ...validPayload, text: 'x'.repeat(20_001) }), env())
  assert.equal(response.status, 413)
})

test('sends only to the server-side destination and escapes HTML', async () => {
  let sent
  const response = await worker.fetch(request({ ...validPayload, text: 'Academy <script>alert(1)</script>' }), env(async (message) => { sent = message }))
  assert.equal(response.status, 200)
  assert.equal(sent.to, 'private@example.invalid')
  assert.equal(sent.from.email, 'info@akademate.com')
  assert.equal(sent.replyTo, 'visitor@example.com')
  assert.match(sent.html, /&lt;script&gt;/)
  assert.doesNotMatch(await response.text(), /private@example.invalid/)
})

test('returns a generic provider error without leaking details', async () => {
  const response = await worker.fetch(request(), env(async () => { throw new Error('sensitive provider detail') }))
  assert.equal(response.status, 502)
  assert.doesNotMatch(await response.text(), /sensitive|provider|private/i)
})
