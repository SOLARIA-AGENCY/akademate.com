import { ApiClient } from '@akademate/api-client'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003'

const client = new ApiClient({ baseUrl: API_URL })

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  message: string
  user: {
    id: string
    email: string
    role: string
    tenantId?: string
  }
  token: string
  exp: number
}

interface PayloadLoginResponse {
  user?: {
    id?: string
    email?: string
    roles?: string[]
    tenantId?: string
  }
  token?: string
}

interface PayloadMeResponse {
  user?: LoginResponse['user']
}

export async function storeSession(user: LoginResponse['user']) {
  if (typeof window === 'undefined') return
  // Store session in httpOnly cookie via server endpoint.
  // In dev mode the endpoint accepts a pre-authenticated user payload.
  try {
    await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(user),
    })
  } catch (error) {
    console.error('Failed to store session:', error)
  }
}

export async function clearSession() {
  if (typeof window === 'undefined') return
  // Clear httpOnly cookie via server endpoint
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
  } catch (error) {
    console.error('Failed to clear session:', error)
  }
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const usePayloadAuth = process.env.NEXT_PUBLIC_USE_PAYLOAD_AUTH === 'true'
  const devLoginEnabled = process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN !== 'false'

  if (usePayloadAuth) {
    const baseUrl = API_URL ?? 'http://localhost:3003'
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: credentials.email, password: credentials.password }),
      credentials: 'include',
    })

    if (!res.ok) {
      throw new Error('Login Payload falló')
    }

    const data = (await res.json()) as PayloadLoginResponse
    const user = {
      id: data.user?.id ?? 'unknown',
      email: data.user?.email ?? credentials.email,
      role: data.user?.roles?.[0] ?? 'admin',
      tenantId: data.user?.tenantId ?? 'unknown',
    }

    await storeSession(user)

    return {
      message: 'Login Payload',
      user,
      token: '', // Token is stored in httpOnly cookie, not exposed to client
      exp: Date.now() + 86400000,
    }
  }

  if (!devLoginEnabled) {
    throw new Error('Auth backend no configurado y login demo deshabilitado')
  }

  const user = {
    id: 'dev-superadmin',
    email: credentials.email ?? 'ops@akademate.com',
    role: 'superadmin',
    tenantId: 'global-ops',
  }

  await storeSession(user)

  return {
    message: 'Login demo (sin backend)',
    user,
    token: '', // Token is stored in httpOnly cookie, not exposed to client
    exp: Date.now() + 86400000,
  }
}

export function logout(): void {
  clearSession()
  // Placeholder: add call to auth provider when available
  if (typeof client.placeholderRequest === 'function') {
    client.placeholderRequest({ path: '/auth/logout' })
  }
}

export async function getCurrentUser() {
  const usePayloadAuth = process.env.NEXT_PUBLIC_USE_PAYLOAD_AUTH === 'true'

  if (usePayloadAuth) {
    try {
      const baseUrl = API_URL ?? 'http://localhost:3003'
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/users/me`, {
        credentials: 'include',
      })
      if (!res.ok) return null
      const data = (await res.json()) as PayloadMeResponse
      return { user: data.user }
    } catch (error) {
      console.warn('No se pudo obtener sesión Payload', error)
      return null
    }
  }

  // Fetch session from server-side httpOnly cookie endpoint
  try {
    const res = await fetch('/api/auth/session', { credentials: 'include' })
    if (!res.ok) return null
    const data = await res.json()
    if (data.authenticated && data.user) {
      return { user: data.user as LoginResponse['user'] }
    }
    return null
  } catch (error) {
    console.warn('Failed to fetch session', error)
    return null
  }
}
