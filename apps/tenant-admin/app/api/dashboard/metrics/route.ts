import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const upstream = new URL('/api/dashboard', request.nextUrl.origin)

    request.nextUrl.searchParams.forEach((value, key) => {
      upstream.searchParams.set(key, value)
    })

    const response = await fetch(upstream, {
      method: 'GET',
      headers: {
        cookie: request.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
    })

    const payload = (await response.json()) as unknown

    return NextResponse.json(payload, { status: response.status })
  } catch (error) {
    console.error('Dashboard metrics proxy error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'No se pudieron cargar las métricas del dashboard',
      },
      { status: 500 }
    )
  }
}
