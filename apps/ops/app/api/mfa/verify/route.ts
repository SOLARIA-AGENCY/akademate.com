import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, users } from '../../../../lib/db'
import { verifyTotpToken } from '@akademate/auth'

const VerifySchema = z.object({
  userId: z.string().uuid(),
  token: z.string().min(6).max(8),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = VerifySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { userId, token } = validation.data

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .execute()

    if (!user || !user.mfaSecret) {
      return NextResponse.json(
        { error: 'MFA not initialized' },
        { status: 404 }
      )
    }

    const valid = await verifyTotpToken(token, user.mfaSecret)

    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      )
    }

    await db
      .update(users)
      .set({
        mfaEnabled: true,
        mfaVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .execute()

    return NextResponse.json({
      userId,
      verified: true,
    })
  } catch (error) {
    console.error('MFA verify error:', error)
    return NextResponse.json(
      { error: 'Failed to verify MFA' },
      { status: 500 }
    )
  }
}
