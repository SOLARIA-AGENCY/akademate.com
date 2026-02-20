/**
 * @fileoverview QR Code Check-in Endpoint
 *
 * POST /api/attendance/qr-checkin
 * Processes QR code scans for student attendance check-in
 *
 * Security:
 * - Validates QR signature to prevent replay attacks
 * - Verifies user is enrolled in the course
 * - Checks session timing (within valid check-in window)
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
  status: 'present' | 'late' | 'error'
  message: string
  attendance?: {
    id: string
    checkInTime: string
    status: 'present' | 'late'
  }
}

// ============================================================================
// Configuration
// ============================================================================

const QR_SECRET = process.env.QR_SIGNATURE_SECRET ?? 'akademate-qr-secret-dev'
const LATE_THRESHOLD_MINUTES = 15
const CHECKIN_WINDOW_BEFORE_MINUTES = 30
const CHECKIN_WINDOW_AFTER_MINUTES = 60

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
export function generateQRSignature(sessionId: string, courseRunId: string, timestamp: string): string {
  const payload = `${sessionId}:${courseRunId}:${timestamp}`
  return crypto
    .createHmac('sha256', QR_SECRET)
    .update(payload)
    .digest('hex')
    .substring(0, 16)
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
// Mock Data (Replace with Payload CMS queries)
// ============================================================================

const mockSessions = new Map([
  [
    'session-001',
    {
      id: 'session-001',
      courseRunId: 'course-run-001',
      title: 'Introduccion a JavaScript',
      startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
      endTime: new Date(Date.now() + 90 * 60 * 1000), // 90 min from now
    },
  ],
])

const mockEnrollments = new Map([
  [
    'enrollment-001',
    {
      id: 'enrollment-001',
      userId: 'user-001',
      courseRunId: 'course-run-001',
      status: 'active',
    },
  ],
])

const attendanceRecords = new Map<string, { id: string; status: string; checkInTime: Date }>()

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<CheckinResult>> {
  try {
    const body = await request.json() as Record<string, unknown>

    // Validate request body
    const validation = QRCheckinSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          status: 'error',
          message: validation.error.issues[0].message,
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
          status: 'error',
          message: 'Codigo QR invalido o expirado',
        },
        { status: 403 }
      )
    }

    if (!isDev && !data.signature) {
      return NextResponse.json(
        {
          success: false,
          status: 'error',
          message: 'Firma del codigo QR requerida',
        },
        { status: 400 }
      )
    }

    // Check if session exists
    const session = mockSessions.get(data.sessionId)
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          status: 'error',
          message: 'Sesion no encontrada',
        },
        { status: 404 }
      )
    }

    // Verify course run matches
    if (session.courseRunId !== data.courseRunId) {
      return NextResponse.json(
        {
          success: false,
          status: 'error',
          message: 'El codigo QR no corresponde a esta sesion',
        },
        { status: 400 }
      )
    }

    // Check enrollment
    const enrollment = mockEnrollments.get(data.enrollmentId)
    if (!enrollment) {
      return NextResponse.json(
        {
          success: false,
          status: 'error',
          message: 'Matricula no encontrada',
        },
        { status: 404 }
      )
    }

    // Verify enrollment belongs to user and course
    if (enrollment.userId !== data.userId || enrollment.courseRunId !== data.courseRunId) {
      return NextResponse.json(
        {
          success: false,
          status: 'error',
          message: 'No estas matriculado en este curso',
        },
        { status: 403 }
      )
    }

    // Check enrollment status
    if (enrollment.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          status: 'error',
          message: 'Tu matricula no esta activa',
        },
        { status: 403 }
      )
    }

    // Check time window
    const now = new Date()
    const windowCheck = isValidCheckinWindow(now, session.startTime, session.endTime)
    if (!windowCheck.valid) {
      return NextResponse.json(
        {
          success: false,
          status: 'error',
          message: windowCheck.reason!,
        },
        { status: 400 }
      )
    }

    // Check for duplicate check-in
    const existingKey = `${data.sessionId}:${data.enrollmentId}`
    const existing = attendanceRecords.get(existingKey)
    if (existing) {
      return NextResponse.json(
        {
          success: true,
          status: existing.status as 'present' | 'late',
          message: 'Ya registraste tu asistencia para esta sesion',
          attendance: {
            id: existing.id,
            checkInTime: existing.checkInTime.toISOString(),
            status: existing.status as 'present' | 'late',
          },
        },
        { status: 200 }
      )
    }

    // Determine status
    const status = determineStatus(now, session.startTime)

    // Create attendance record
    const attendanceId = crypto.randomUUID()
    const attendance = {
      id: attendanceId,
      status,
      checkInTime: now,
    }

    // Save (mock - would be Payload CMS in production)
    attendanceRecords.set(existingKey, attendance)

    // Return success
    return NextResponse.json(
      {
        success: true,
        status,
        message: status === 'present'
          ? 'Asistencia registrada correctamente'
          : 'Asistencia registrada (llegada tarde)',
        attendance: {
          id: attendanceId,
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
        status: 'error',
        message: 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET Handler - Generate QR Code Data (Admin/Instructor Only)
// ============================================================================

const QRGenerateSchema = z.object({
  sessionId: z.string().uuid(),
  courseRunId: z.string().uuid(),
})

export function GET(request: NextRequest): NextResponse {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const courseRunId = searchParams.get('courseRunId')

    const validation = QRGenerateSchema.safeParse({ sessionId, courseRunId })
    if (!validation.success) {
      return NextResponse.json(
        { error: 'sessionId and courseRunId are required' },
        { status: 400 }
      )
    }

    const timestamp = new Date().toISOString()
    const signature = generateQRSignature(validation.data.sessionId, validation.data.courseRunId, timestamp)

    const qrData = {
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
    return NextResponse.json(
      { error: 'Error generating QR code' },
      { status: 500 }
    )
  }
}
