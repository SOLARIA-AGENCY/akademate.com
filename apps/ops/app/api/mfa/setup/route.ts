import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { getDb, users } from '../../../../lib/db'
import { generateTotpSecret } from '@akademate/auth'

const SetupSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  issuer: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = SetupSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { userId, email, issuer } = validation.data
    const { secret, otpauthUrl } = generateTotpSecret(email, issuer)

    const db = getDb()

    await db
      .update(users)
      .set({
        mfaSecret: secret,
        mfaEnabled: false,
        mfaVerifiedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .execute()

    return NextResponse.json({
      userId,
      otpauthUrl,
      secret,
    })
  } catch (error) {
    console.error('MFA setup error:', error)
    return NextResponse.json(
      { error: 'Failed to setup MFA' },
      { status: 500 }
    )
  }
}
