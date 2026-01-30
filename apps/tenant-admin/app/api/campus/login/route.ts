/**
 * Campus Login API
 *
 * Authenticates students for Campus Virtual.
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
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

/** Avatar media object */
interface AvatarMedia {
  url?: string
}

/** Course information */
interface CourseInfo {
  title?: string
}

/** Course run with nested course */
interface CourseRunInfo {
  id: string | number
  course?: CourseInfo
}

/** Student document from Payload CMS */
interface StudentDocument {
  id: string | number
  email: string
  passwordHash?: string
  firstName?: string
  lastName?: string
  avatar?: AvatarMedia
  tenant?: string | number
  isActive?: boolean
  lastLoginAt?: string
}

/** Enrollment document from Payload CMS */
interface EnrollmentDocument {
  id: string | number
  courseRun?: CourseRunInfo | string | number
  status?: string
  progressPercent?: number
  startedAt?: string
  completedAt?: string
  student?: string | number
}

/** Login request body */
interface LoginRequestBody {
  email?: string
  password?: string
}

/** Student update data */
interface StudentUpdateData {
  lastLoginAt: string
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.CAMPUS_JWT_SECRET ?? 'campus-secret-key-change-in-production'
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
    const body = (await request.json()) as LoginRequestBody
    const { email, password } = body

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

    const student = studentsResult.docs[0] as unknown as StudentDocument

    // Verify password
    const passwordHash = student.passwordHash
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

    const enrollments = enrollmentsResult.docs.map((doc) => {
      const enrollment = doc as unknown as EnrollmentDocument
      const courseRun =
        typeof enrollment.courseRun === 'object' ? enrollment.courseRun : null
      return {
        id: enrollment.id,
        courseRunId: courseRun?.id ?? enrollment.courseRun,
        courseTitle: courseRun?.course?.title ?? 'Unknown Course',
        status: enrollment.status,
        progressPercent: enrollment.progressPercent ?? 0,
        startedAt: enrollment.startedAt,
        completedAt: enrollment.completedAt,
      }
    })

    // Generate JWT token
    const token = await new SignJWT({
      sub: String(student.id),
      email: student.email,
      tenantId: student.tenant,
      type: 'campus',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    // Reset rate limit on successful login
    resetRateLimit(clientIP)

    // Update last login
    const updateData: StudentUpdateData = {
      lastLoginAt: new Date().toISOString(),
    }
    await payload.update({
      collection: 'students',
      id: student.id,
      data: updateData as Record<string, unknown>,
    })

    const firstName = student.firstName ?? ''
    const lastName = student.lastName ?? ''

    return NextResponse.json({
      success: true,
      token,
      student: {
        id: String(student.id),
        email: student.email,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim(),
        avatar: student.avatar?.url ?? null,
        tenantId: student.tenant,
      },
      enrollments,
    })
  } catch (error: unknown) {
    console.error('[Campus Login] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500, headers: rateLimitHeaders }
    )
  }
}
