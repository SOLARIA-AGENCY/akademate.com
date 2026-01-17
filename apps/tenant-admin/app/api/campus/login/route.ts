/**
 * Campus Login API
 *
 * Authenticates students for Campus Virtual.
 */

import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { getPayload } from 'payload'
import config from '@payload-config'
import bcrypt from 'bcryptjs'
import {
  checkRateLimit,
  resetRateLimit,
  getClientIP,
  createRateLimitHeaders,
} from '../../../../lib/rateLimit'

const JWT_SECRET = new TextEncoder().encode(
  process.env.CAMPUS_JWT_SECRET || 'campus-secret-key-change-in-production'
)

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request)
  const rateLimitResult = checkRateLimit(clientIP)
  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult)

  if (rateLimitResult.isLimited) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many login attempts. Please try again later.',
        retryAfter: rateLimitResult.retryAfterSeconds,
      },
      {
        status: 429,
        headers: rateLimitHeaders,
      }
    )
  }

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400, headers: rateLimitHeaders }
      )
    }

    const payload = await getPayload({ config })

    // Find student by email
    const studentsResult = await payload.find({
      collection: 'students',
      where: {
        email: { equals: email.toLowerCase() },
        isActive: { equals: true },
      },
      limit: 1,
    })

    if (studentsResult.docs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const student = studentsResult.docs[0]

    // Verify password
    const passwordHash = (student as any).passwordHash
    if (!passwordHash) {
      return NextResponse.json(
        { success: false, error: 'Account not configured. Please contact support.' },
        { status: 401 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, passwordHash)
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401, headers: rateLimitHeaders }
      )
    }

    // Get student's active enrollments
    const enrollmentsResult = await payload.find({
      collection: 'enrollments',
      where: {
        student: { equals: student.id },
        status: { in: ['enrolled', 'in_progress'] },
      },
      depth: 2,
    })

    const enrollments = enrollmentsResult.docs.map((enrollment: any) => ({
      id: enrollment.id,
      courseRunId:
        typeof enrollment.courseRun === 'object' ? enrollment.courseRun.id : enrollment.courseRun,
      courseTitle: enrollment.courseRun?.course?.title || 'Unknown Course',
      status: enrollment.status,
      progressPercent: enrollment.progressPercent || 0,
      startedAt: enrollment.startedAt,
      completedAt: enrollment.completedAt,
    }))

    // Generate JWT token
    const token = await new SignJWT({
      sub: String(student.id),
      email: student.email,
      tenantId: (student as any).tenant,
      type: 'campus',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    // Reset rate limit on successful login
    resetRateLimit(clientIP)

    // Update last login
    await payload.update({
      collection: 'students',
      id: student.id,
      data: {
        lastLoginAt: new Date().toISOString(),
      } as any,
    })

    const response = NextResponse.json({
      success: true,
      token,
      student: {
        id: String(student.id),
        email: student.email,
        firstName: (student as any).firstName || '',
        lastName: (student as any).lastName || '',
        fullName: `${(student as any).firstName || ''} ${(student as any).lastName || ''}`.trim(),
        avatar: (student as any).avatar?.url || null,
        tenantId: (student as any).tenant,
      },
      enrollments,
    })
  } catch (error) {
    console.error('[Campus Login] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500, headers: rateLimitHeaders }
    )
  }
}
