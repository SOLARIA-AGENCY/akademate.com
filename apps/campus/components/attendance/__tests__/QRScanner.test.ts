/**
 * @fileoverview Tests for QR Scanner utilities
 *
 * Tests cover:
 * - QR code parsing (URL format)
 * - QR code parsing (JSON format)
 * - Invalid QR code handling
 * - Edge cases
 */

import { describe, it, expect } from 'vitest'
import { parseQRCode } from '../QRScanner'

describe('parseQRCode', () => {
  describe('URL format parsing', () => {
    it('should parse valid akademate URL with all parameters', () => {
      const qrData = 'akademate://attendance?session=123e4567-e89b-12d3-a456-426614174000&course=987fcdeb-51a2-34d5-b678-426614174111&ts=2025-12-21T10:00:00Z&sig=abc123def456'

      const result = parseQRCode(qrData)

      expect(result).not.toBeNull()
      expect(result?.sessionId).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(result?.courseRunId).toBe('987fcdeb-51a2-34d5-b678-426614174111')
      expect(result?.timestamp).toBe('2025-12-21T10:00:00Z')
      expect(result?.signature).toBe('abc123def456')
    })

    it('should parse URL without signature', () => {
      const qrData = 'akademate://attendance?session=session-123&course=course-456&ts=2025-12-21T10:00:00Z'

      const result = parseQRCode(qrData)

      expect(result).not.toBeNull()
      expect(result?.sessionId).toBe('session-123')
      expect(result?.courseRunId).toBe('course-456')
      expect(result?.signature).toBeUndefined()
    })

    it('should return null for URL missing sessionId', () => {
      const qrData = 'akademate://attendance?course=course-456&ts=2025-12-21T10:00:00Z'

      const result = parseQRCode(qrData)

      expect(result).toBeNull()
    })

    it('should return null for URL missing courseRunId', () => {
      const qrData = 'akademate://attendance?session=session-123&ts=2025-12-21T10:00:00Z'

      const result = parseQRCode(qrData)

      expect(result).toBeNull()
    })

    it('should return null for URL missing timestamp', () => {
      const qrData = 'akademate://attendance?session=session-123&course=course-456'

      const result = parseQRCode(qrData)

      expect(result).toBeNull()
    })

    it('should handle URL-encoded timestamps', () => {
      const qrData = 'akademate://attendance?session=session-123&course=course-456&ts=2025-12-21T10%3A00%3A00.000Z'

      const result = parseQRCode(qrData)

      expect(result).not.toBeNull()
      expect(result?.timestamp).toBe('2025-12-21T10:00:00.000Z')
    })
  })

  describe('JSON format parsing', () => {
    it('should parse valid JSON with all fields', () => {
      const qrData = JSON.stringify({
        sessionId: 'session-abc',
        courseRunId: 'course-xyz',
        timestamp: '2025-12-21T10:00:00Z',
        signature: 'sig123',
      })

      const result = parseQRCode(qrData)

      expect(result).not.toBeNull()
      expect(result?.sessionId).toBe('session-abc')
      expect(result?.courseRunId).toBe('course-xyz')
      expect(result?.timestamp).toBe('2025-12-21T10:00:00Z')
      expect(result?.signature).toBe('sig123')
    })

    it('should parse JSON without signature', () => {
      const qrData = JSON.stringify({
        sessionId: 'session-abc',
        courseRunId: 'course-xyz',
        timestamp: '2025-12-21T10:00:00Z',
      })

      const result = parseQRCode(qrData)

      expect(result).not.toBeNull()
      expect(result?.signature).toBeUndefined()
    })

    it('should return null for JSON missing sessionId', () => {
      const qrData = JSON.stringify({
        courseRunId: 'course-xyz',
        timestamp: '2025-12-21T10:00:00Z',
      })

      const result = parseQRCode(qrData)

      expect(result).toBeNull()
    })

    it('should return null for JSON missing courseRunId', () => {
      const qrData = JSON.stringify({
        sessionId: 'session-abc',
        timestamp: '2025-12-21T10:00:00Z',
      })

      const result = parseQRCode(qrData)

      expect(result).toBeNull()
    })

    it('should return null for JSON missing timestamp', () => {
      const qrData = JSON.stringify({
        sessionId: 'session-abc',
        courseRunId: 'course-xyz',
      })

      const result = parseQRCode(qrData)

      expect(result).toBeNull()
    })
  })

  describe('Invalid input handling', () => {
    it('should return null for empty string', () => {
      expect(parseQRCode('')).toBeNull()
    })

    it('should return null for random text', () => {
      expect(parseQRCode('hello world')).toBeNull()
    })

    it('should return null for invalid JSON', () => {
      expect(parseQRCode('{invalid json}')).toBeNull()
    })

    it('should return null for other URL schemes', () => {
      expect(parseQRCode('https://example.com?session=123')).toBeNull()
    })

    it('should return null for akademate URL without attendance path', () => {
      expect(parseQRCode('akademate://other?session=123&course=456&ts=2025')).toBeNull()
    })

    it('should return null for array JSON', () => {
      expect(parseQRCode('[1, 2, 3]')).toBeNull()
    })

    it('should return null for number', () => {
      expect(parseQRCode('12345')).toBeNull()
    })

    it('should return null for boolean JSON', () => {
      expect(parseQRCode('true')).toBeNull()
    })
  })

  describe('Edge cases', () => {
    it('should handle UUIDs correctly', () => {
      const uuid1 = '550e8400-e29b-41d4-a716-446655440000'
      const uuid2 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
      const qrData = `akademate://attendance?session=${uuid1}&course=${uuid2}&ts=2025-12-21T10:00:00Z`

      const result = parseQRCode(qrData)

      expect(result?.sessionId).toBe(uuid1)
      expect(result?.courseRunId).toBe(uuid2)
    })

    it('should handle ISO 8601 timestamps with milliseconds', () => {
      const qrData = JSON.stringify({
        sessionId: 'session-1',
        courseRunId: 'course-1',
        timestamp: '2025-12-21T10:30:45.123Z',
      })

      const result = parseQRCode(qrData)

      expect(result?.timestamp).toBe('2025-12-21T10:30:45.123Z')
    })

    it('should handle timestamps with timezone offset', () => {
      const qrData = JSON.stringify({
        sessionId: 'session-1',
        courseRunId: 'course-1',
        timestamp: '2025-12-21T10:30:45+01:00',
      })

      const result = parseQRCode(qrData)

      expect(result?.timestamp).toBe('2025-12-21T10:30:45+01:00')
    })

    it('should handle very long signature', () => {
      const longSig = 'a'.repeat(64)
      const qrData = `akademate://attendance?session=s1&course=c1&ts=2025-12-21T10:00:00Z&sig=${longSig}`

      const result = parseQRCode(qrData)

      expect(result?.signature).toBe(longSig)
    })

    it('should handle special characters in parameters', () => {
      const qrData = JSON.stringify({
        sessionId: 'session-with-dashes_and_underscores',
        courseRunId: 'course.with.dots',
        timestamp: '2025-12-21T10:00:00Z',
      })

      const result = parseQRCode(qrData)

      expect(result?.sessionId).toBe('session-with-dashes_and_underscores')
      expect(result?.courseRunId).toBe('course.with.dots')
    })
  })
})
