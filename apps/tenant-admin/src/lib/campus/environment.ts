import { NextResponse } from 'next/server'

/**
 * Campus Virtual is developed behind an explicit environment gate.
 * Production must never become active by inheriting a default value.
 */
export function campusEnvironmentError(): NextResponse | null {
  const enabled = process.env.CAMPUS_INTERNAL_ENABLED === 'true'
  const environment = process.env.CAMPUS_ENVIRONMENT ?? 'production'
  const nonProductionEnvironment = /^(staging|development|test|local)$/i.test(environment)

  // NODE_ENV is compiled as "production" by Next in optimized images. The
  // explicit Campus environment label is the runtime safety boundary.
  if (enabled && nonProductionEnvironment) return null

  return NextResponse.json(
    {
      success: false,
      error: 'Campus Virtual interno no habilitado en este entorno',
    },
    { status: 404 },
  )
}

export function campusJwtSecret(): Uint8Array | null {
  const secret = process.env.CAMPUS_JWT_SECRET
  if (!secret || secret.length < 32) return null
  return new TextEncoder().encode(secret)
}

/**
 * Gamification is deliberately opt-in until its student-owned schema and
 * product rules are approved for the Campus MVP.
 */
export function campusGamificationEnabled(): boolean {
  return process.env.CAMPUS_GAMIFICATION_ENABLED === 'true'
}

export const CAMPUS_SESSION_COOKIE = 'campus_session'
