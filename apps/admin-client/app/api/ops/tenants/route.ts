import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const PAYLOAD_URL =
  process.env.PAYLOAD_CMS_URL?.trim() ||
  process.env.NEXT_PUBLIC_PAYLOAD_URL?.trim() ||
  'http://localhost:3003'

interface SessionCookie {
  token?: string
  role?: string
}

async function getPayloadToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get('akademate_admin_session')?.value
  if (!raw) return null
  try {
    const session = JSON.parse(raw) as SessionCookie
    return session.token ?? null
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const token = await getPayloadToken()

  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = searchParams.get('limit') ?? '100'
  const page = searchParams.get('page') ?? '1'

  try {
    const res = await fetch(
      `${PAYLOAD_URL}/api/tenants?limit=${limit}&page=${page}&sort=-createdAt`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    )

    if (!res.ok) {
      const text = await res.text()
      console.error('[ops/tenants] Payload error', res.status, text)
      return NextResponse.json(
        { error: 'Error al obtener tenants de Payload' },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[ops/tenants] Fetch error', error)
    return NextResponse.json({ error: 'Error de conexión con Payload CMS' }, { status: 503 })
  }
}
