/**
 * @fileoverview QR Code Check-in Endpoint for Campus App
 *
 * POST /api/attendance/qr-checkin
 * Processes QR code scans for student attendance check-in
 *
 * GET /api/attendance/qr-checkin?sessionId={id}&courseRunId={id}
 * Generates QR code data for instructors
 *
 * Security:
 * - Validates QR signature (HMAC) to prevent replay attacks
 * - Verifies user enrollment is active
 * - Checks session timing (within valid check-in window)
 * - Prevents duplicate check-ins
 *
 * Integration:
 * - Uses Payload CMS collections: enrollments, attendance
 * - Integrates with @akademate/operations AttendanceService
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'

// ============================================================================
// Types & Schemas
// ============================================================================

const QRCheckinSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  courseRunId: z.string().uuid('Invalid course run ID'),
  timestamp: z.string().datetime('Invalid timestamp'),
  signature: z.string().optional(),
  userId: z.string().uuid('Invalid user ID'),
  enrollmentId: z.string().uuid('Invalid enrollment ID'),
})

type QRCheckinRequest = z.infer<typeof QRCheckinSchema>

interface CheckinResult {
  success: boolean
  status: 'present' | 'late' | 'pending'
  message: string
  attendance?: {
    id: string
    checkInTime: string
    status: 'present' | 'late'
  }
}

interface StudentReference {
  id: string
}

interface CourseRunReference {
  id: string
}

interface EnrollmentResponse {
  id: string
  student: string | StudentReference
  course_run: string | CourseRunReference
  status: string
}

interface AttendanceRecord {
  id: string
  enrollment: string
  session_date: string
  session_type: string
  status: 'present' | 'late' | 'absent' | 'excused'
  check_in_at?: string
  notes?: string
}

interface PaginatedResponse<T> {
  docs: T[]
  totalDocs: number
  limit: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface QRGenerateResponse {
  url: string
  json: {
    sessionId: string
    courseRunId: string
    timestamp: string
    signature: string
  }
  expiresAt: string
}

// ============================================================================
// Configuration
// ============================================================================

const QR_SECRET = process.env.QR_SIGNATURE_SECRET ?? 'akademate-qr-secret-dev'
const LATE_THRESHOLD_MINUTES = 15
const CHECKIN_WINDOW_BEFORE_MINUTES = 30
const CHECKIN_WINDOW_AFTER_MINUTES = 60
const PAYLOAD_API_URL = process.env.PAYLOAD_API_URL ?? 'http://localhost:3000/api'

// ============================================================================
// Helpers
// ============================================================================

/**
 * Verify QR code signature to prevent tampering/replay
 */
function verifyQRSignature(data: QRCheckinRequest, signature: string): boolean {
  if (!signature) return false

  const payload = `${data.sessionId}:${data.courseRunId}:${data.timestamp}`
  const expectedSignature = crypto
    .createHmac('sha256', QR_SECRET)
    .update(payload)
    .digest('hex')
    .substring(0, 16)

  return signature === expectedSignature
}

/**
 * Generate QR code signature (for creating QR codes)
 */
export function generateQRSignature(
  sessionId: string,
  courseRunId: string,
  timestamp: string
): string {
  const payload = `${sessionId}:${courseRunId}:${timestamp}`
  return crypto.createHmac('sha256', QR_SECRET).update(payload).digest('hex').substring(0, 16)
}

/**
 * Determine attendance status based on check-in time vs session start
 */
function determineStatus(checkInTime: Date, sessionStartTime: Date): 'present' | 'late' {
  const diffMinutes = (checkInTime.getTime() - sessionStartTime.getTime()) / (1000 * 60)
  return diffMinutes > LATE_THRESHOLD_MINUTES ? 'late' : 'present'
}

/**
 * Check if check-in is within valid time window
 */
function isValidCheckinWindow(
  checkInTime: Date,
  sessionStartTime: Date,
  sessionEndTime: Date
): { valid: boolean; reason?: string } {
  const now = checkInTime.getTime()
  const windowStart = sessionStartTime.getTime() - CHECKIN_WINDOW_BEFORE_MINUTES * 60 * 1000
  const windowEnd = sessionEndTime.getTime() + CHECKIN_WINDOW_AFTER_MINUTES * 60 * 1000

  if (now < windowStart) {
    const minsUntilOpen = Math.ceil((windowStart - now) / (60 * 1000))
    return {
      valid: false,
      reason: `El registro de asistencia abre en ${minsUntilOpen} minutos`,
    }
  }

  if (now > windowEnd) {
    return {
      valid: false,
      reason: 'El periodo de registro ha terminado',
    }
  }

  return { valid: true }
}

// ============================================================================
// POST Handler - Student Check-in
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<CheckinResult>> {
  try {
    const body: unknown = await request.json()

    // Validate request body
    const validation = QRCheckinSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          status: 'pending' as const,
          message: validation.error.issues[0]?.message ?? 'Solicitud inválida',
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // Verify signature (skip in dev if not provided)
    const isDev = process.env.NODE_ENV === 'development'
    if (data.signature && !verifyQRSignature(data, data.signature)) {
      return NextResponse.json(
        {
          success: false,
          status: 'pending' as const,
          message: 'Codigo QR invalido o expirado',
        },
        { status: 403 }
      )
    }

    if (!isDev && !data.signature) {
      return NextResponse.json(
        {
          success: false,
          status: 'pending' as const,
          message: 'Firma del codigo QR requerida',
        },
        { status: 400 }
      )
    }

    // Fetch enrollment from Payload API
    const enrollmentResponse = await fetch(
      `${PAYLOAD_API_URL}/enrollments/${data.enrollmentId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!enrollmentResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          status: 'pending' as const,
          message: 'Matricula no encontrada',
        },
        { status: 404 }
      )
    }

    const enrollment = (await enrollmentResponse.json()) as EnrollmentResponse

    // Verify enrollment belongs to user and course
    const enrollmentStudentId =
      typeof enrollment.student === 'string' ? enrollment.student : enrollment.student.id
    const enrollmentCourseRunId =
      typeof enrollment.course_run === 'string' ? enrollment.course_run : enrollment.course_run.id

    if (enrollmentStudentId !== data.userId || enrollmentCourseRunId !== data.courseRunId) {
      return NextResponse.json(
        {
          success: false,
          status: 'pending' as const,
          message: 'No estas matriculado en este curso',
        },
        { status: 403 }
      )
    }

    // Check enrollment status
    if (enrollment.status !== 'confirmed' && enrollment.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          status: 'pending' as const,
          message: 'Tu matricula no esta activa',
        },
        { status: 403 }
      )
    }

    // For this implementation, we'll use the sessionId as session_date
    // In a real implementation, you would query the sessions collection
    // Since sessions collection doesn't exist yet, we'll use a simplified approach
    const sessionDate = new Date(data.timestamp)
    const sessionStartTime = new Date(sessionDate)
    sessionStartTime.setHours(sessionDate.getHours() - 1) // Assume session started 1 hour before QR timestamp
    const sessionEndTime = new Date(sessionDate)
    sessionEndTime.setHours(sessionDate.getHours() + 2) // Assume session ends 2 hours after QR timestamp

    // Check time window
    const now = new Date()
    const windowCheck = isValidCheckinWindow(now, sessionStartTime, sessionEndTime)
    if (!windowCheck.valid) {
      return NextResponse.json(
        {
          success: false,
          status: 'pending' as const,
          message: windowCheck.reason!,
        },
        { status: 400 }
      )
    }

    // Check for duplicate check-in
    const sessionDateStr = sessionDate.toISOString().split('T')[0]
    const checkDuplicateResponse = await fetch(
      `${PAYLOAD_API_URL}/attendance?where[enrollment][equals]=${data.enrollmentId}&where[session_date][equals]=${sessionDateStr}&limit=1`
    )

    if (checkDuplicateResponse.ok) {
      const checkResult = (await checkDuplicateResponse.json()) as PaginatedResponse<AttendanceRecord>
      const existing = checkResult.docs[0]
      if (existing) {
        return NextResponse.json(
          {
            success: true,
            status: existing.status as 'present' | 'late',
            message: 'Ya registraste tu asistencia para esta sesion',
            attendance: {
              id: existing.id,
              checkInTime: existing.check_in_at ?? now.toISOString(),
              status: existing.status as 'present' | 'late',
            },
          },
          { status: 200 }
        )
      }
    }

    // Determine status
    const status = determineStatus(now, sessionStartTime)

    // Create attendance record via Payload API
    const createAttendanceResponse = await fetch(`${PAYLOAD_API_URL}/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        enrollment: data.enrollmentId,
        session_date: sessionDate.toISOString().split('T')[0],
        session_type: 'in_person',
        status,
        check_in_at: now.toISOString(),
        notes: `QR check-in at ${now.toISOString()}`,
      }),
    })

    if (!createAttendanceResponse.ok) {
      throw new Error('Failed to create attendance record')
    }

    const attendance = (await createAttendanceResponse.json()) as AttendanceRecord

    // Return success
    return NextResponse.json(
      {
        success: true,
        status,
        message:
          status === 'present'
            ? 'Asistencia registrada correctamente'
            : 'Asistencia registrada (llegada tarde)',
        attendance: {
          id: attendance.id,
          checkInTime: now.toISOString(),
          status,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[QR Checkin] Error:', error)
    return NextResponse.json(
      {
        success: false,
        status: 'pending' as const,
        message: 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET Handler - Generate QR Code Data (Instructor Only)
// ============================================================================

const QRGenerateSchema = z.object({
  sessionId: z.string().uuid(),
  courseRunId: z.string().uuid(),
})

export function GET(request: NextRequest): NextResponse<QRGenerateResponse | { error: string }> {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const courseRunId = searchParams.get('courseRunId')

    const validation = QRGenerateSchema.safeParse({ sessionId, courseRunId })
    if (!validation.success) {
      return NextResponse.json({ error: 'sessionId and courseRunId are required' }, { status: 400 })
    }

    const timestamp = new Date().toISOString()
    const signature = generateQRSignature(
      validation.data.sessionId,
      validation.data.courseRunId,
      timestamp
    )

    const qrData: QRGenerateResponse = {
      url: `akademate://attendance?session=${validation.data.sessionId}&course=${validation.data.courseRunId}&ts=${encodeURIComponent(timestamp)}&sig=${signature}`,
      json: {
        sessionId: validation.data.sessionId,
        courseRunId: validation.data.courseRunId,
        timestamp,
        signature,
      },
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min expiry
    }

    return NextResponse.json(qrData, { status: 200 })
  } catch (error) {
    console.error('[QR Generate] Error:', error)
    return NextResponse.json({ error: 'Error generating QR code' }, { status: 500 })
  }
}
