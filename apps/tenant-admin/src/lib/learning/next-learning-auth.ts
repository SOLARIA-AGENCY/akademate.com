import { jwtVerify } from 'jose'

import type { NextLearningIdentity } from './next-learning-transaction.ts'

const SESSION_COOKIE = 'akademate_next_session'
const ISSUER = 'akademate-next'
const AUDIENCE = 'akademate-next-learning'

type AuthEnvironment = {
  AKADEMATE_RUNTIME?: string
  AKADEMATE_NEXT_AUTH_SECRET?: string
}

function bearerToken(request: Request): string | null {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) return null
  return authorization.slice('Bearer '.length).trim() || null
}

function cookieToken(request: Request): string | null {
  const cookie = request.headers.get('cookie')
  if (!cookie) return null
  for (const item of cookie.split(';')) {
    const [rawName, ...rawValue] = item.trim().split('=')
    if (rawName !== SESSION_COOKIE) continue
    const value = rawValue.join('=')
    if (!value) return null
    try {
      return decodeURIComponent(value)
    } catch {
      return null
    }
  }
  return null
}

function positiveIntegerClaim(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  if (!/^[1-9]\d*$/.test(String(value))) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : null
}

export async function authenticateNextLearningRequest(
  request: Request,
  environment: AuthEnvironment = {
    AKADEMATE_RUNTIME: process.env.AKADEMATE_RUNTIME,
    AKADEMATE_NEXT_AUTH_SECRET: process.env.AKADEMATE_NEXT_AUTH_SECRET,
  },
): Promise<NextLearningIdentity | null> {
  if (environment.AKADEMATE_RUNTIME !== 'next') return null
  const secret = environment.AKADEMATE_NEXT_AUTH_SECRET
  if (!secret || secret.length < 32) return null
  const token = bearerToken(request) ?? cookieToken(request)
  if (!token) return null

  try {
    const verified = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ['HS256'],
      issuer: ISSUER,
      audience: AUDIENCE,
    })
    if (verified.payload.type !== 'akademate-next-session') return null
    const userId = positiveIntegerClaim(verified.payload.sub)
    const tenantId = positiveIntegerClaim(verified.payload.tenantId)
    if (!userId || !tenantId) return null
    return { userId, tenantId }
  } catch {
    return null
  }
}

export const nextLearningSessionContract = {
  audience: AUDIENCE,
  cookie: SESSION_COOKIE,
  issuer: ISSUER,
} as const
