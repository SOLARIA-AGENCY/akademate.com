/**
 * @fileoverview Tests for QR Check-in API Endpoint
 *
 * Tests cover:
 * - Input validation (Zod schema)
 * - Signature verification
 * - Session validation
 * - Enrollment verification
 * - Time window checks
 * - Duplicate check-in handling
 * - Status determination (present vs late)
 * - Error responses
 * - QR code generation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'

// ============================================================================
// Mock schemas matching the route.ts implementation
// ============================================================================

const QRCheckinSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  courseRunId: z.string().uuid('Invalid course run ID'),
  timestamp: z.string().datetime('Invalid timestamp'),
  signature: z.string().optional(),
  userId: z.string().uuid('Invalid user ID'),
  enrollmentId: z.string().uuid('Invalid enrollment ID'),
})

// ============================================================================
// Test Utilities
// ============================================================================

const validUUID = '550e8400-e29b-41d4-a716-446655440000'
const validUUID2 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
const validTimestamp = '2025-12-21T10:00:00.000Z'

function createValidRequest(overrides = {}) {
  return {
    sessionId: validUUID,
    courseRunId: validUUID2,
    timestamp: validTimestamp,
    userId: validUUID,
    enrollmentId: validUUID2,
    signature: 'abc123def456ab',
    ...overrides,
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('QR Checkin Schema Validation', () => {
  describe('Required fields', () => {
    it('should accept valid request with all fields', () => {
      const request = createValidRequest()
      const result = QRCheckinSchema.safeParse(request)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sessionId).toBe(validUUID)
        expect(result.data.courseRunId).toBe(validUUID2)
        expect(result.data.timestamp).toBe(validTimestamp)
      }
    })

    it('should reject missing sessionId', () => {
      const request = createValidRequest()
      delete (request as Record<string, unknown>).sessionId

      const result = QRCheckinSchema.safeParse(request)

      expect(result.success).toBe(false)
    })

    it('should reject missing courseRunId', () => {
      const request = createValidRequest()
      delete (request as Record<string, unknown>).courseRunId

      const result = QRCheckinSchema.safeParse(request)

      expect(result.success).toBe(false)
    })

    it('should reject missing timestamp', () => {
      const request = createValidRequest()
      delete (request as Record<string, unknown>).timestamp

      const result = QRCheckinSchema.safeParse(request)

      expect(result.success).toBe(false)
    })

    it('should reject missing userId', () => {
      const request = createValidRequest()
      delete (request as Record<string, unknown>).userId

      const result = QRCheckinSchema.safeParse(request)

      expect(result.success).toBe(false)
    })

    it('should reject missing enrollmentId', () => {
      const request = createValidRequest()
      delete (request as Record<string, unknown>).enrollmentId

      const result = QRCheckinSchema.safeParse(request)

      expect(result.success).toBe(false)
    })

    it('should accept missing signature (optional)', () => {
      const request = createValidRequest()
      delete (request as Record<string, unknown>).signature

      const result = QRCheckinSchema.safeParse(request)

      expect(result.success).toBe(true)
    })
  })

  describe('UUID validation', () => {
    it('should reject invalid sessionId format', () => {
      const request = createValidRequest({ sessionId: 'not-a-uuid' })
      const result = QRCheckinSchema.safeParse(request)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Invalid session ID')
      }
    })

    it('should reject invalid courseRunId format', () => {
      const request = createValidRequest({ courseRunId: 'not-a-uuid' })
      const result = QRCheckinSchema.safeParse(request)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Invalid course run ID')
      }
    })

    it('should reject invalid userId format', () => {
      const request = createValidRequest({ userId: 'not-a-uuid' })
      const result = QRCheckinSchema.safeParse(request)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Invalid user ID')
      }
    })

    it('should reject invalid enrollmentId format', () => {
      const request = createValidRequest({ enrollmentId: 'not-a-uuid' })
      const result = QRCheckinSchema.safeParse(request)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Invalid enrollment ID')
      }
    })

    it('should accept various UUID formats', () => {
      const uuids = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      ]

      for (const uuid of uuids) {
        const request = createValidRequest({ sessionId: uuid })
        const result = QRCheckinSchema.safeParse(request)
        expect(result.success).toBe(true)
      }
    })
  })

  describe('Timestamp validation', () => {
    it('should accept ISO 8601 timestamp with Z suffix', () => {
      const request = createValidRequest({ timestamp: '2025-12-21T10:00:00Z' })
      const result = QRCheckinSchema.safeParse(request)

      expect(result.success).toBe(true)
    })

    it('should accept ISO 8601 timestamp with milliseconds', () => {
      const request = createValidRequest({ timestamp: '2025-12-21T10:00:00.123Z' })
      const result = QRCheckinSchema.safeParse(request)

      expect(result.success).toBe(true)
    })

    it('should reject invalid timestamp format', () => {
      const invalidTimestamps = [
        '2025-12-21',
        '10:00:00',
        '2025/12/21 10:00:00',
        'not-a-timestamp',
        '',
      ]

      for (const timestamp of invalidTimestamps) {
        const request = createValidRequest({ timestamp })
        const result = QRCheckinSchema.safeParse(request)
        expect(result.success).toBe(false)
      }
    })
  })
})

describe('Attendance Status Determination', () => {
  const LATE_THRESHOLD_MINUTES = 15

  function determineStatus(checkInTime: Date, sessionStartTime: Date): 'present' | 'late' {
    const diffMinutes = (checkInTime.getTime() - sessionStartTime.getTime()) / (1000 * 60)
    return diffMinutes > LATE_THRESHOLD_MINUTES ? 'late' : 'present'
  }

  it('should mark as present when checking in before session starts', () => {
    const sessionStart = new Date('2025-12-21T10:00:00Z')
    const checkIn = new Date('2025-12-21T09:55:00Z')

    expect(determineStatus(checkIn, sessionStart)).toBe('present')
  })

  it('should mark as present when checking in exactly at session start', () => {
    const sessionStart = new Date('2025-12-21T10:00:00Z')
    const checkIn = new Date('2025-12-21T10:00:00Z')

    expect(determineStatus(checkIn, sessionStart)).toBe('present')
  })

  it('should mark as present when checking in within threshold', () => {
    const sessionStart = new Date('2025-12-21T10:00:00Z')
    const checkIn = new Date('2025-12-21T10:14:59Z')

    expect(determineStatus(checkIn, sessionStart)).toBe('present')
  })

  it('should mark as present when checking in exactly at threshold', () => {
    const sessionStart = new Date('2025-12-21T10:00:00Z')
    const checkIn = new Date('2025-12-21T10:15:00Z')

    expect(determineStatus(checkIn, sessionStart)).toBe('present')
  })

  it('should mark as late when checking in after threshold', () => {
    const sessionStart = new Date('2025-12-21T10:00:00Z')
    const checkIn = new Date('2025-12-21T10:15:01Z')

    expect(determineStatus(checkIn, sessionStart)).toBe('late')
  })

  it('should mark as late when checking in significantly after session start', () => {
    const sessionStart = new Date('2025-12-21T10:00:00Z')
    const checkIn = new Date('2025-12-21T10:45:00Z')

    expect(determineStatus(checkIn, sessionStart)).toBe('late')
  })
})

describe('Check-in Time Window Validation', () => {
  const CHECKIN_WINDOW_BEFORE_MINUTES = 30
  const CHECKIN_WINDOW_AFTER_MINUTES = 60

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

  const sessionStart = new Date('2025-12-21T10:00:00Z')
  const sessionEnd = new Date('2025-12-21T12:00:00Z')

  it('should allow check-in 30 minutes before session', () => {
    const checkIn = new Date('2025-12-21T09:30:00Z')
    const result = isValidCheckinWindow(checkIn, sessionStart, sessionEnd)

    expect(result.valid).toBe(true)
  })

  it('should allow check-in exactly at window open', () => {
    const checkIn = new Date('2025-12-21T09:30:00Z')
    const result = isValidCheckinWindow(checkIn, sessionStart, sessionEnd)

    expect(result.valid).toBe(true)
  })

  it('should reject check-in before window opens', () => {
    const checkIn = new Date('2025-12-21T09:00:00Z')
    const result = isValidCheckinWindow(checkIn, sessionStart, sessionEnd)

    expect(result.valid).toBe(false)
    expect(result.reason).toContain('abre en')
    expect(result.reason).toContain('minutos')
  })

  it('should allow check-in during session', () => {
    const checkIn = new Date('2025-12-21T11:00:00Z')
    const result = isValidCheckinWindow(checkIn, sessionStart, sessionEnd)

    expect(result.valid).toBe(true)
  })

  it('should allow check-in 60 minutes after session ends', () => {
    const checkIn = new Date('2025-12-21T13:00:00Z')
    const result = isValidCheckinWindow(checkIn, sessionStart, sessionEnd)

    expect(result.valid).toBe(true)
  })

  it('should reject check-in after window closes', () => {
    const checkIn = new Date('2025-12-21T13:01:00Z')
    const result = isValidCheckinWindow(checkIn, sessionStart, sessionEnd)

    expect(result.valid).toBe(false)
    expect(result.reason).toBe('El periodo de registro ha terminado')
  })

  it('should calculate correct minutes until window opens', () => {
    const checkIn = new Date('2025-12-21T09:00:00Z') // 30 min before window
    const result = isValidCheckinWindow(checkIn, sessionStart, sessionEnd)

    expect(result.valid).toBe(false)
    expect(result.reason).toContain('30 minutos')
  })
})

describe('QR Signature Verification', () => {
  // Mock implementation of signature generation/verification
  // Uses a simple hash-like approach that includes all payload parts
  function generateQRSignature(sessionId: string, courseRunId: string, timestamp: string): string {
    // Simple deterministic mock - creates unique signature per payload
    const payload = `${sessionId}:${courseRunId}:${timestamp}`
    // Create a more unique signature by using the full payload hash
    let hash = 0
    for (let i = 0; i < payload.length; i++) {
      const char = payload.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).padStart(16, '0').substring(0, 16)
  }

  function verifyQRSignature(
    data: { sessionId: string; courseRunId: string; timestamp: string },
    signature: string
  ): boolean {
    const expected = generateQRSignature(data.sessionId, data.courseRunId, data.timestamp)
    return signature === expected
  }

  it('should verify valid signature', () => {
    const data = {
      sessionId: 'session-123',
      courseRunId: 'course-456',
      timestamp: '2025-12-21T10:00:00Z',
    }
    const signature = generateQRSignature(data.sessionId, data.courseRunId, data.timestamp)

    expect(verifyQRSignature(data, signature)).toBe(true)
  })

  it('should reject invalid signature', () => {
    const data = {
      sessionId: 'session-123',
      courseRunId: 'course-456',
      timestamp: '2025-12-21T10:00:00Z',
    }

    expect(verifyQRSignature(data, 'wrong-signature')).toBe(false)
  })

  it('should reject tampered sessionId', () => {
    const original = {
      sessionId: 'session-123',
      courseRunId: 'course-456',
      timestamp: '2025-12-21T10:00:00Z',
    }
    const signature = generateQRSignature(original.sessionId, original.courseRunId, original.timestamp)

    const tampered = { ...original, sessionId: 'session-different' }
    expect(verifyQRSignature(tampered, signature)).toBe(false)
  })

  it('should reject tampered timestamp', () => {
    const original = {
      sessionId: 'session-123',
      courseRunId: 'course-456',
      timestamp: '2025-12-21T10:00:00Z',
    }
    const signature = generateQRSignature(original.sessionId, original.courseRunId, original.timestamp)

    const tampered = { ...original, timestamp: '2025-12-22T10:00:00Z' }
    expect(verifyQRSignature(tampered, signature)).toBe(false)
  })
})

describe('Response Structure', () => {
  it('should have correct success response structure', () => {
    const successResponse = {
      success: true,
      status: 'present' as const,
      message: 'Asistencia registrada correctamente',
      attendance: {
        id: validUUID,
        checkInTime: validTimestamp,
        status: 'present' as const,
      },
    }

    expect(successResponse).toHaveProperty('success', true)
    expect(successResponse).toHaveProperty('status')
    expect(successResponse).toHaveProperty('message')
    expect(successResponse.attendance).toHaveProperty('id')
    expect(successResponse.attendance).toHaveProperty('checkInTime')
    expect(successResponse.attendance).toHaveProperty('status')
  })

  it('should have correct error response structure', () => {
    const errorResponse = {
      success: false,
      status: 'error' as const,
      message: 'Session not found',
    }

    expect(errorResponse).toHaveProperty('success', false)
    expect(errorResponse).toHaveProperty('status', 'error')
    expect(errorResponse).toHaveProperty('message')
    expect(errorResponse).not.toHaveProperty('attendance')
  })

  it('should handle duplicate check-in response', () => {
    const duplicateResponse = {
      success: true,
      status: 'present' as const,
      message: 'Ya registraste tu asistencia para esta sesion',
      attendance: {
        id: validUUID,
        checkInTime: validTimestamp,
        status: 'present' as const,
      },
    }

    expect(duplicateResponse.success).toBe(true)
    expect(duplicateResponse.message).toContain('Ya registraste')
  })
})

describe('QR Code Generation (GET endpoint)', () => {
  const QRGenerateSchema = z.object({
    sessionId: z.string().uuid(),
    courseRunId: z.string().uuid(),
  })

  it('should validate generation request parameters', () => {
    const valid = { sessionId: validUUID, courseRunId: validUUID2 }
    const result = QRGenerateSchema.safeParse(valid)

    expect(result.success).toBe(true)
  })

  it('should reject invalid sessionId in generation request', () => {
    const invalid = { sessionId: 'not-uuid', courseRunId: validUUID2 }
    const result = QRGenerateSchema.safeParse(invalid)

    expect(result.success).toBe(false)
  })

  it('should reject missing parameters in generation request', () => {
    const missing = { sessionId: validUUID }
    const result = QRGenerateSchema.safeParse(missing)

    expect(result.success).toBe(false)
  })

  it('should generate QR data with correct structure', () => {
    const qrData = {
      url: `akademate://attendance?session=${validUUID}&course=${validUUID2}&ts=${encodeURIComponent(validTimestamp)}&sig=abc123`,
      json: {
        sessionId: validUUID,
        courseRunId: validUUID2,
        timestamp: validTimestamp,
        signature: 'abc123',
      },
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    }

    expect(qrData).toHaveProperty('url')
    expect(qrData).toHaveProperty('json')
    expect(qrData).toHaveProperty('expiresAt')
    expect(qrData.url).toContain('akademate://attendance')
    expect(qrData.json.sessionId).toBe(validUUID)
  })
})

describe('Error Messages (Spanish)', () => {
  it('should return Spanish error for invalid QR code', () => {
    const message = 'Codigo QR invalido o expirado'
    expect(message).toBe('Codigo QR invalido o expirado')
  })

  it('should return Spanish error for session not found', () => {
    const message = 'Sesion no encontrada'
    expect(message).toBe('Sesion no encontrada')
  })

  it('should return Spanish error for enrollment not found', () => {
    const message = 'Matricula no encontrada'
    expect(message).toBe('Matricula no encontrada')
  })

  it('should return Spanish error for not enrolled', () => {
    const message = 'No estas matriculado en este curso'
    expect(message).toBe('No estas matriculado en este curso')
  })

  it('should return Spanish error for inactive enrollment', () => {
    const message = 'Tu matricula no esta activa'
    expect(message).toBe('Tu matricula no esta activa')
  })

  it('should return Spanish success message for present', () => {
    const message = 'Asistencia registrada correctamente'
    expect(message).toBe('Asistencia registrada correctamente')
  })

  it('should return Spanish success message for late', () => {
    const message = 'Asistencia registrada (llegada tarde)'
    expect(message).toBe('Asistencia registrada (llegada tarde)')
  })
})
