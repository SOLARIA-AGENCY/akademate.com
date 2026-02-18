import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { getDb, users } from '../../../../lib/db'
import { verifyPassword, generateAccessToken, type JWTConfig } from '@akademate/auth'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const MFA_CHALLENGE_EXPIRY = 300 // 5 minutes

function getOpsJwtConfig(): JWTConfig {
  const secret = process.env.OPS_JWT_SECRET
  if (!secret) {
    throw new Error('OPS_JWT_SECRET environment variable is required')
  }
  return {
    secret,
    issuer: 'akademate-ops',
    audience: 'ops',
    accessTokenExpiry: 900,
  }
}

function getMfaChallengeJwtConfig(): JWTConfig {
  const secret = process.env.OPS_JWT_SECRET
  if (!secret) {
    throw new Error('OPS_JWT_SECRET environment variable is required')
  }
  return {
    secret,
    issuer: 'akademate-ops',
    audience: 'ops-mfa-challenge',
    accessTokenExpiry: MFA_CHALLENGE_EXPIRY,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const validation = LoginSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { email, password } = validation.data
    const db = getDb()

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)
      .execute()

    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const validPassword = await verifyPassword(password, user.passwordHash)
    if (!validPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // If MFA is enabled, return a short-lived challenge token instead of a session
    if (user.mfaEnabled && user.mfaSecret) {
      const mfaChallengeConfig = getMfaChallengeJwtConfig()
      const mfaToken = await generateAccessToken(mfaChallengeConfig, {
        sub: user.id,
        tid: 0,
        roles: [],
      })

      return NextResponse.json({
        requiresMfa: true,
        mfaToken,
      })
    }

    // No MFA -- grant full access token
    const jwtConfig = getOpsJwtConfig()
    const accessToken = await generateAccessToken(jwtConfig, {
      sub: user.id,
      tid: 0,
      roles: ['ops_admin'],
    })

    return NextResponse.json({
      requiresMfa: false,
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error('Ops login error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
