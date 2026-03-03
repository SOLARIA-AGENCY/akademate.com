import { NextRequest, NextResponse } from 'next/server'

// Rutas que requieren autenticación
const PROTECTED_PREFIXES = ['/dashboard', '/perfil', '/mi-academia']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir rutas de API de auth siempre
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  const needsAuth = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  if (!needsAuth) return NextResponse.next()

  // Verificar sesión leyendo la cookie de Better Auth
  const sessionCookie =
    request.cookies.get('better-auth.session_token') ??
    request.cookies.get('__Secure-better-auth.session_token')

  if (!sessionCookie?.value) {
    const loginUrl = new URL('/portal/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
