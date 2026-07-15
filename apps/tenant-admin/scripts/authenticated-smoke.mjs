import path from 'node:path'
import { fileURLToPath } from 'node:url'

function requireValue(value, name) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${name} is required`)
  }

  return value.trim()
}

export function assertLoginResponse(body) {
  if (!body?.user?.id || typeof body.token !== 'string' || body.token.length === 0) {
    throw new Error('login response is not authenticated')
  }
}

export function assertSessionResponse(body) {
  if (body?.authenticated !== true || !body.user?.id) {
    throw new Error('session is not authenticated')
  }
}

export function assertConvocatoriasResponse(body) {
  if (body?.success !== true || !Array.isArray(body.data) || body.warning) {
    throw new Error('convocatorias response is not operational')
  }
}

async function requestJson(fetchImpl, url, init) {
  const response = await fetchImpl(url, init)
  let body

  try {
    body = await response.json()
  } catch {
    throw new Error(`invalid JSON response from ${new URL(url).pathname}`)
  }

  if (!response.ok) {
    throw new Error(`request failed for ${new URL(url).pathname} (${response.status})`)
  }

  return body
}

export async function runAuthenticatedSmoke(baseUrl, options = {}) {
  const env = options.env || process.env
  const fetchImpl = options.fetchImpl || fetch
  const email = requireValue(env.SMOKE_AUTH_EMAIL, 'SMOKE_AUTH_EMAIL')
  const password = requireValue(env.SMOKE_AUTH_PASSWORD, 'SMOKE_AUTH_PASSWORD')
  const base = new URL(requireValue(baseUrl, 'base URL')).toString().replace(/\/$/, '')

  const login = await requestJson(fetchImpl, `${base}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  assertLoginResponse(login)

  const headers = { Cookie: `payload-token=${encodeURIComponent(login.token)}` }
  const session = await requestJson(fetchImpl, `${base}/api/auth/session`, { headers })
  assertSessionResponse(session)

  const convocatorias = await requestJson(fetchImpl, `${base}/api/convocatorias`, { headers })
  assertConvocatoriasResponse(convocatorias)
}

async function main() {
  await runAuthenticatedSmoke(process.argv[2])
  console.log(`Authenticated smoke passed for ${process.argv[2]}`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Authenticated smoke failed: ${error instanceof Error ? error.message : 'unknown error'}`)
    process.exitCode = 1
  })
}
