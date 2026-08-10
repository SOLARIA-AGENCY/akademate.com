import { createHash, createHmac, randomBytes } from 'node:crypto'

const drainUrl = process.env.AKADEMATE_NEXT_FINANCE_DRAINER_URL ?? 'http://tenant-admin:3009/api/internal/next/finance/drain'
const key = process.env.AKADEMATE_NEXT_FINANCE_DRAINER_HMAC_KEY ?? ''
const intervalMs = Math.max(Number(process.env.AKADEMATE_NEXT_FINANCE_DRAINER_INTERVAL_MS ?? 5000), 1000)

if (!key) {
  console.error('finance drainer disabled: missing internal HMAC key')
  process.exit(0)
}

let running = false
async function wake() {
  if (running) return
  running = true
  try {
    const url = new URL(drainUrl)
    const body = ''
    const timestamp = String(Math.floor(Date.now() / 1000))
    const nonce = randomBytes(18).toString('base64url')
    const bodyDigest = createHash('sha256').update(body).digest('base64url')
    const signature = createHmac('sha256', key)
      .update(['POST', url.pathname, timestamp, nonce, bodyDigest].join('\n'))
      .digest('base64url')
    await fetch(url, {
      method: 'POST',
      body,
      headers: {
        'x-akademate-internal-timestamp': timestamp,
        'x-akademate-internal-nonce': nonce,
        'x-akademate-internal-signature': signature,
      },
      signal: AbortSignal.timeout(4000),
    })
  } catch (error) {
    console.error('finance drainer wake failed', error instanceof Error ? error.name : 'unknown_error')
  } finally {
    running = false
  }
}

await wake()
setInterval(wake, intervalMs)
