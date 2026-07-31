const MAX_BODY_BYTES = 20_000
const allowedFields = new Set(['kind', 'replyTo', 'subject', 'text'])

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return json({ success: false }, 405)

    const expectedToken = env.CONTACT_MAILER_TOKEN
    const suppliedToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!expectedToken || !suppliedToken || !(await tokensMatch(expectedToken, suppliedToken))) {
      return json({ success: false }, 401)
    }

    const declaredLength = Number(request.headers.get('content-length') || 0)
    if (declaredLength > MAX_BODY_BYTES) return json({ success: false }, 413)

    let raw
    try {
      raw = await request.text()
      if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return json({ success: false }, 413)
    } catch {
      return json({ success: false }, 400)
    }

    let payload
    try {
      payload = JSON.parse(raw)
    } catch {
      return json({ success: false }, 400)
    }

    if (!isValidPayload(payload)) return json({ success: false }, 400)
    if (!env.CONTACT_TO) return json({ success: false }, 503)

    try {
      await env.EMAIL.send({
        to: env.CONTACT_TO,
        from: { email: 'info@akademate.com', name: 'Akademate' },
        replyTo: payload.replyTo,
        subject: payload.subject,
        text: payload.text,
        html: `<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap">${escapeHtml(payload.text)}</pre>`,
      })
      return json({ success: true }, 200)
    } catch {
      return json({ success: false }, 502)
    }
  },
}

function isValidPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false
  if (Object.keys(payload).some((key) => !allowedFields.has(key))) return false
  if (!['contact', 'waitlist'].includes(payload.kind)) return false
  if (typeof payload.replyTo !== 'string' || payload.replyTo.length > 254 || !/^\S+@\S+\.\S+$/.test(payload.replyTo)) return false
  if (typeof payload.subject !== 'string' || payload.subject.length < 1 || payload.subject.length > 160 || !payload.subject.startsWith('[Akademate] ')) return false
  if (typeof payload.text !== 'string' || payload.text.length < 1 || payload.text.length > 8_000) return false
  return true
}

async function tokensMatch(expected, supplied) {
  const encoder = new TextEncoder()
  const [expectedHash, suppliedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
    crypto.subtle.digest('SHA-256', encoder.encode(supplied)),
  ])
  const left = new Uint8Array(expectedHash)
  const right = new Uint8Array(suppliedHash)
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[character])
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}
