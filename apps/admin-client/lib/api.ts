import { ApiClient } from '@akademate/api-client'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003'
const SESSION_KEY = 'akademate-ops-user'

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

export function storeSession(user: LoginResponse['user']) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function clearSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
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

    storeSession(user)

    return {
      message: 'Login Payload',
      user,
      token: data.token ?? '',
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

  storeSession(user)

  return {
    message: 'Login demo (sin backend)',
    user,
    token: 'dev-token-' + Date.now(),
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

  if (typeof window === 'undefined') return null

  const stored = localStorage.getItem(SESSION_KEY)
  if (!stored) return null

  try {
    const user = JSON.parse(stored) as LoginResponse['user']
    return { user }
  } catch (error) {
    console.warn('Sesión inválida en localStorage', error)
    clearSession()
    return null
  }
}
