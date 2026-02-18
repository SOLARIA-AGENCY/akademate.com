import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { getDb, users } from '../../../../lib/db'
import {
  verifyTotpToken,
  verifyAccessToken,
  generateAccessToken,
  type JWTConfig,
} from '@akademate/auth'

const MfaChallengeSchema = z.object({
  mfaToken: z.string().min(1),
  totpCode: z.string().min(6).max(8),
})

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
    accessTokenExpiry: 300,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const validation = MfaChallengeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { mfaToken, totpCode } = validation.data

    // Verify the short-lived MFA challenge token
    const mfaChallengeConfig = getMfaChallengeJwtConfig()
    const tokenResult = await verifyAccessToken(mfaChallengeConfig, mfaToken)

    if (!tokenResult.valid) {
      return NextResponse.json(
        { error: 'Invalid or expired MFA challenge token' },
        { status: 401 }
      )
    }

    const userId = tokenResult.payload.sub
    const db = getDb()

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .execute()

    if (!user?.mfaSecret) {
      return NextResponse.json(
        { error: 'User not found or MFA not configured' },
        { status: 401 }
      )
    }

    // Verify the TOTP code against the user's stored secret
    const totpValid = await verifyTotpToken(totpCode, user.mfaSecret)

    if (!totpValid) {
      return NextResponse.json(
        { error: 'Invalid TOTP code' },
        { status: 401 }
      )
    }

    // TOTP verified -- grant full access token
    const jwtConfig = getOpsJwtConfig()
    const accessToken = await generateAccessToken(jwtConfig, {
      sub: user.id,
      tid: 0,
      roles: ['ops_admin'],
    })

    return NextResponse.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error('MFA challenge error:', error)
    return NextResponse.json(
      { error: 'MFA verification failed' },
      { status: 500 }
    )
  }
}
