import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  if (
    process.env.NODE_ENV !== 'development' ||
    process.env.ALLOW_DEV_AUTO_LOGIN !== 'true'
  ) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const redirect = request.nextUrl.searchParams.get('redirect') ?? '/admin'
  const target = new URL('/api/auth/dev-login', request.url)
  target.searchParams.set('redirect', redirect)
  return NextResponse.redirect(target, 307)
}
