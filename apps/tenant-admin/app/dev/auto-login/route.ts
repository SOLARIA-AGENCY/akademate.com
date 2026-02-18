import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

/**
 * Development-only endpoint for convenient Payload login.
 * Performs a real server-side login using seeded superadmin credentials and
 * sets the `payload-token` cookie before redirecting to the requested path.
 *
 * FIX-16: Gated with defense-in-depth -- requires BOTH NODE_ENV=development
 * AND ALLOW_DEV_AUTO_LOGIN=true. Returns 404 in production.
 */
export async function GET(request: NextRequest) {
  // Defense-in-depth: two independent checks must BOTH pass
  const isDevEnv = process.env.NODE_ENV === 'development'
  const isExplicitlyAllowed = process.env.ALLOW_DEV_AUTO_LOGIN === 'true'

  if (!isDevEnv || !isExplicitlyAllowed) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const url = new URL(request.url)
  const redirectTo = url.searchParams.get('redirect') ?? '/admin'

  const email =
    process.env.PAYLOAD_SUPERADMIN_EMAIL ?? 'superadmin@cepcomunicacion.com'
  const password = process.env.PAYLOAD_SUPERADMIN_PASSWORD ?? 'Dev12345!'

  const origin = process.env.PAYLOAD_PUBLIC_SERVER_URL ?? request.nextUrl.origin
  const loginEndpoint = `${origin.replace(/\/$/, '')}/api/users/login`

  const loginRes = await fetch(loginEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  })

  if (!loginRes.ok) {
    const text = await loginRes.text()
    return NextResponse.json(
      {
        error: 'Auto-login failed',
        status: loginRes.status,
        details: text,
      },
      { status: 500 },
    )
  }

  const data = await loginRes.json()
  const token = data?.token

  if (!token) {
    return NextResponse.json(
      { error: 'No token returned from login response' },
      { status: 500 },
    )
  }

  const secure = process.env.NODE_ENV === 'production'
  const cookie = [
    `payload-token=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    secure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')

  const response = NextResponse.redirect(new URL(redirectTo, origin))
  response.headers.append('Set-Cookie', cookie)

  return response
}
