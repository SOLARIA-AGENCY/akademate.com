/**
 * @fileoverview Tests for QR Check-in Endpoint
 *
 * Test Coverage:
 * - ✅ Successful check-in (on time)
 * - ✅ Late check-in
 * - ✅ Duplicate check-in (should return existing record)
 * - ✅ Invalid QR signature
 * - ✅ Outside time window (too early)
 * - ✅ Outside time window (too late)
 * - ✅ Invalid enrollment
 * - ✅ QR code generation (GET endpoint)
 * - ✅ Missing required fields
 * - ✅ Inactive enrollment
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST, GET, generateQRSignature } from '../../../app/api/attendance/qr-checkin/route'
import { NextRequest } from 'next/server'
import crypto from 'crypto'

// ============================================================================
// Test Helpers
// ============================================================================

const QR_SECRET = 'test-secret'
const VALID_SESSION_ID = crypto.randomUUID()
const VALID_COURSE_RUN_ID = crypto.randomUUID()
const VALID_USER_ID = crypto.randomUUID()
const VALID_ENROLLMENT_ID = crypto.randomUUID()

function createQRSignature(sessionId: string, courseRunId: string, timestamp: string): string {
  const payload = `${sessionId}:${courseRunId}:${timestamp}`
  return crypto.createHmac('sha256', QR_SECRET).update(payload).digest('hex').substring(0, 16)
}

function createMockRequest(body: any, method = 'POST'): NextRequest {
  const url = 'http://localhost:3000/api/attendance/qr-checkin'
  return new NextRequest(url, {
    method,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

function createMockGetRequest(params: Record<string, string>): NextRequest {
  const searchParams = new URLSearchParams(params)
  const url = `http://localhost:3000/api/attendance/qr-checkin?${searchParams.toString()}`
  return new NextRequest(url, {
    method: 'GET',
  })
}

// Mock enrollment data
const mockEnrollment = {
  id: VALID_ENROLLMENT_ID,
  student: VALID_USER_ID,
  course_run: VALID_COURSE_RUN_ID,
  status: 'confirmed',
}

const mockInactiveEnrollment = {
  ...mockEnrollment,
  status: 'cancelled',
}

// ============================================================================
// Setup & Teardown
// ============================================================================

beforeEach(() => {
  // Set environment variables
  process.env.QR_SIGNATURE_SECRET = QR_SECRET
  process.env.NODE_ENV = 'test'
  process.env.PAYLOAD_API_URL = 'http://localhost:3000/api'

  // Mock fetch globally
  global.fetch = vi.fn()
})

afterEach(() => {
  vi.clearAllMocks()
})

// ============================================================================
// POST /api/attendance/qr-checkin Tests
// ============================================================================

describe('POST /api/attendance/qr-checkin', () => {
  it('should successfully check-in on time', async () => {
    const timestamp = new Date().toISOString()
    const signature = createQRSignature(VALID_SESSION_ID, VALID_COURSE_RUN_ID, timestamp)

    // Mock enrollment fetch
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockEnrollment), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    // Mock duplicate check (no existing attendance)
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ docs: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    // Mock create attendance
    const mockAttendance = {
      id: crypto.randomUUID(),
      enrollment: VALID_ENROLLMENT_ID,
      status: 'present',
      check_in_at: new Date().toISOString(),
    }
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockAttendance), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const request = createMockRequest({
      sessionId: VALID_SESSION_ID,
      courseRunId: VALID_COURSE_RUN_ID,
      timestamp,
      signature,
      userId: VALID_USER_ID,
      enrollmentId: VALID_ENROLLMENT_ID,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.status).toBe('present')
    expect(data.attendance).toBeDefined()
    expect(data.message).toContain('registrada correctamente')
  })

  it('should mark as late when check-in is after threshold', async () => {
    // Create a timestamp that would be late (> 15 min after session start)
    const timestamp = new Date(Date.now() - 20 * 60 * 1000).toISOString() // 20 min ago
    const signature = createQRSignature(VALID_SESSION_ID, VALID_COURSE_RUN_ID, timestamp)

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockEnrollment), { status: 200 })
    )

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ docs: [] }), { status: 200 })
    )

    const mockAttendance = {
      id: crypto.randomUUID(),
      status: 'late',
      check_in_at: new Date().toISOString(),
    }
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockAttendance), { status: 201 })
    )

    const request = createMockRequest({
      sessionId: VALID_SESSION_ID,
      courseRunId: VALID_COURSE_RUN_ID,
      timestamp,
      signature,
      userId: VALID_USER_ID,
      enrollmentId: VALID_ENROLLMENT_ID,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.status).toBe('late')
    expect(data.message).toContain('llegada tarde')
  })

  it('should return existing attendance on duplicate check-in', async () => {
    const timestamp = new Date().toISOString()
    const signature = createQRSignature(VALID_SESSION_ID, VALID_COURSE_RUN_ID, timestamp)

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockEnrollment), { status: 200 })
    )

    // Mock existing attendance
    const existingAttendance = {
      id: crypto.randomUUID(),
      enrollment: VALID_ENROLLMENT_ID,
      status: 'present',
      check_in_at: new Date().toISOString(),
    }
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ docs: [existingAttendance] }), { status: 200 })
    )

    const request = createMockRequest({
      sessionId: VALID_SESSION_ID,
      courseRunId: VALID_COURSE_RUN_ID,
      timestamp,
      signature,
      userId: VALID_USER_ID,
      enrollmentId: VALID_ENROLLMENT_ID,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toContain('Ya registraste')
    expect(data.attendance?.id).toBe(existingAttendance.id)
  })

  it('should reject invalid QR signature', async () => {
    const timestamp = new Date().toISOString()
    const invalidSignature = 'invalid-signature'

    const request = createMockRequest({
      sessionId: VALID_SESSION_ID,
      courseRunId: VALID_COURSE_RUN_ID,
      timestamp,
      signature: invalidSignature,
      userId: VALID_USER_ID,
      enrollmentId: VALID_ENROLLMENT_ID,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.message).toContain('invalido o expirado')
  })

  it('should reject check-in outside time window (too early)', async () => {
    // Create timestamp for a session that hasn't started yet (more than 30 min in future)
    const futureTimestamp = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour in future
    const signature = createQRSignature(VALID_SESSION_ID, VALID_COURSE_RUN_ID, futureTimestamp)

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockEnrollment), { status: 200 })
    )

    const request = createMockRequest({
      sessionId: VALID_SESSION_ID,
      courseRunId: VALID_COURSE_RUN_ID,
      timestamp: futureTimestamp,
      signature,
      userId: VALID_USER_ID,
      enrollmentId: VALID_ENROLLMENT_ID,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.message).toMatch(/abre en|terminado/)
  })

  it('should reject check-in outside time window (too late)', async () => {
    // Create timestamp for a session that ended more than 60 min ago
    const pastTimestamp = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
    const signature = createQRSignature(VALID_SESSION_ID, VALID_COURSE_RUN_ID, pastTimestamp)

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockEnrollment), { status: 200 })
    )

    const request = createMockRequest({
      sessionId: VALID_SESSION_ID,
      courseRunId: VALID_COURSE_RUN_ID,
      timestamp: pastTimestamp,
      signature,
      userId: VALID_USER_ID,
      enrollmentId: VALID_ENROLLMENT_ID,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.message).toContain('terminado')
  })

  it('should reject invalid enrollment', async () => {
    const timestamp = new Date().toISOString()
    const signature = createQRSignature(VALID_SESSION_ID, VALID_COURSE_RUN_ID, timestamp)

    // Mock enrollment not found
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
    )

    const request = createMockRequest({
      sessionId: VALID_SESSION_ID,
      courseRunId: VALID_COURSE_RUN_ID,
      timestamp,
      signature,
      userId: VALID_USER_ID,
      enrollmentId: crypto.randomUUID(), // Invalid ID
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.message).toContain('no encontrada')
  })

  it('should reject inactive enrollment', async () => {
    const timestamp = new Date().toISOString()
    const signature = createQRSignature(VALID_SESSION_ID, VALID_COURSE_RUN_ID, timestamp)

    // Mock inactive enrollment
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockInactiveEnrollment), { status: 200 })
    )

    const request = createMockRequest({
      sessionId: VALID_SESSION_ID,
      courseRunId: VALID_COURSE_RUN_ID,
      timestamp,
      signature,
      userId: VALID_USER_ID,
      enrollmentId: VALID_ENROLLMENT_ID,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.message).toContain('no esta activa')
  })

  it('should reject request with missing required fields', async () => {
    const request = createMockRequest({
      sessionId: VALID_SESSION_ID,
      // Missing other required fields
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.message).toBeTruthy()
  })

  it('should reject enrollment mismatch (wrong user)', async () => {
    const timestamp = new Date().toISOString()
    const signature = createQRSignature(VALID_SESSION_ID, VALID_COURSE_RUN_ID, timestamp)

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockEnrollment), { status: 200 })
    )

    const request = createMockRequest({
      sessionId: VALID_SESSION_ID,
      courseRunId: VALID_COURSE_RUN_ID,
      timestamp,
      signature,
      userId: crypto.randomUUID(), // Different user
      enrollmentId: VALID_ENROLLMENT_ID,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.message).toContain('No estas matriculado')
  })
})

// ============================================================================
// GET /api/attendance/qr-checkin Tests
// ============================================================================

describe('GET /api/attendance/qr-checkin', () => {
  it('should generate QR code data with valid parameters', async () => {
    const request = createMockGetRequest({
      sessionId: VALID_SESSION_ID,
      courseRunId: VALID_COURSE_RUN_ID,
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.url).toContain('akademate://attendance')
    expect(data.url).toContain(`session=${VALID_SESSION_ID}`)
    expect(data.url).toContain(`course=${VALID_COURSE_RUN_ID}`)
    expect(data.json.sessionId).toBe(VALID_SESSION_ID)
    expect(data.json.courseRunId).toBe(VALID_COURSE_RUN_ID)
    expect(data.json.signature).toBeTruthy()
    expect(data.json.timestamp).toBeTruthy()
    expect(data.expiresAt).toBeTruthy()
  })

  it('should reject QR generation with missing parameters', async () => {
    const request = createMockGetRequest({
      sessionId: VALID_SESSION_ID,
      // Missing courseRunId
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeTruthy()
  })

  it('should reject QR generation with invalid UUID format', async () => {
    const request = createMockGetRequest({
      sessionId: 'invalid-uuid',
      courseRunId: VALID_COURSE_RUN_ID,
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeTruthy()
  })
})

// ============================================================================
// Helper Functions Tests
// ============================================================================

describe('generateQRSignature', () => {
  it('should generate consistent signatures', () => {
    const sessionId = crypto.randomUUID()
    const courseRunId = crypto.randomUUID()
    const timestamp = new Date().toISOString()

    const sig1 = generateQRSignature(sessionId, courseRunId, timestamp)
    const sig2 = generateQRSignature(sessionId, courseRunId, timestamp)

    expect(sig1).toBe(sig2)
    expect(sig1).toHaveLength(16)
  })

  it('should generate different signatures for different inputs', () => {
    const timestamp = new Date().toISOString()
    const sig1 = generateQRSignature(crypto.randomUUID(), VALID_COURSE_RUN_ID, timestamp)
    const sig2 = generateQRSignature(crypto.randomUUID(), VALID_COURSE_RUN_ID, timestamp)

    expect(sig1).not.toBe(sig2)
  })
})
