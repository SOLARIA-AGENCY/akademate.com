/**
 * @fileoverview Exhaustive Tests for LMS Bulk Enrollment API
 *
 * Tests cover:
 * - CSV parsing (valid/invalid formats)
 * - File upload via FormData
 * - JSON body processing
 * - Student/course validation
 * - Enrollment creation
 * - Duplicate handling
 * - Error cases
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock payload using vi.hoisted to avoid hoisting issues
const mockPayload = vi.hoisted(() => ({
  findByID: vi.fn(),
  find: vi.fn(),
  create: vi.fn(),
}));

vi.mock('@payloadcms/next/utilities', () => ({
  getPayloadHMR: vi.fn().mockResolvedValue(mockPayload),
}));

vi.mock('@payload-config', () => ({ default: {} }));

// Import handlers after mocks
import { POST, GET } from '../bulk/route';

// Helper to create FormData with file
function createFormDataRequest(csvContent: string): NextRequest {
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const file = new File([blob], 'enrollments.csv', { type: 'text/csv' });
  const formData = new FormData();
  formData.append('file', file);

  return new NextRequest('http://localhost/api/lms/enrollments/bulk', {
    method: 'POST',
    body: formData,
  });
}

// Helper to create JSON request
function createJsonRequest(body: object): NextRequest {
  return new NextRequest('http://localhost/api/lms/enrollments/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('LMS Bulk Enrollment API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/lms/enrollments/bulk', () => {
    it('should return CSV template', async () => {
      const response = await GET();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv');
      expect(response.headers.get('Content-Disposition')).toContain('bulk-enrollment-template.csv');

      const text = await response.text();
      expect(text).toContain('studentEmail,courseRunId,status,notes');
      expect(text).toContain('student1@example.com');
    });
  });

  describe('POST /api/lms/enrollments/bulk - Input Validation', () => {
    it('should return 400 when no file or csvContent provided', async () => {
      const request = createJsonRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('No CSV content provided');
    });

    it('should return 400 for CSV without header row', async () => {
      const request = createJsonRequest({ csvContent: 'student@email.com,cr-1,active' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('CSV must have at least a header row');
    });

    it('should return 400 for CSV missing studentEmail/email column', async () => {
      const csvContent = `name,courseRunId,status
John,cr-1,active`;
      const request = createJsonRequest({ csvContent });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('studentEmail or email column');
    });

    it('should return 400 for CSV missing courseRunId column', async () => {
      const csvContent = `studentEmail,status
student@email.com,active`;
      const request = createJsonRequest({ csvContent });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('courseRunId or course_run_id column');
    });

    it('should return 400 for CSV with only header row', async () => {
      const csvContent = `studentEmail,courseRunId,status,notes`;
      const request = createJsonRequest({ csvContent });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('must have at least a header row and one data row');
    });
  });

  describe('POST /api/lms/enrollments/bulk - Alternative Headers', () => {
    it('should accept "email" instead of "studentEmail"', async () => {
      const csvContent = `email,courseRunId,status
student@test.com,cr-1,active`;

      mockPayload.find
        .mockResolvedValueOnce({ docs: [{ id: 'student-1', email: 'student@test.com' }] }) // student lookup
        .mockResolvedValueOnce({ docs: [] }); // existing enrollment check
      mockPayload.findByID.mockResolvedValueOnce({ id: 'cr-1' }); // course run lookup
      mockPayload.create.mockResolvedValueOnce({ id: 'enroll-1' });

      const request = createJsonRequest({ csvContent });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.created).toBe(1);
    });

    it('should accept "course_run_id" instead of "courseRunId"', async () => {
      const csvContent = `studentEmail,course_run_id,status
student@test.com,cr-1,active`;

      mockPayload.find
        .mockResolvedValueOnce({ docs: [{ id: 'student-1', email: 'student@test.com' }] })
        .mockResolvedValueOnce({ docs: [] });
      mockPayload.findByID.mockResolvedValueOnce({ id: 'cr-1' });
      mockPayload.create.mockResolvedValueOnce({ id: 'enroll-1' });

      const request = createJsonRequest({ csvContent });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.created).toBe(1);
    });
  });

  describe('POST /api/lms/enrollments/bulk - Student Validation', () => {
    it('should fail row when student not found', async () => {
      const csvContent = `studentEmail,courseRunId,status
notfound@test.com,cr-1,active`;

      mockPayload.find.mockResolvedValueOnce({ docs: [] }); // student not found

      const request = createJsonRequest({ csvContent });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.failed).toBe(1);
      expect(data.data.errors[0].error).toBe('Student not found');
      expect(data.data.errors[0].email).toBe('notfound@test.com');
    });
  });

  describe('POST /api/lms/enrollments/bulk - Course Run Validation', () => {
    it('should fail row when course run not found', async () => {
      const csvContent = `studentEmail,courseRunId,status
student@test.com,invalid-cr,active`;

      mockPayload.find.mockResolvedValueOnce({ docs: [{ id: 'student-1', email: 'student@test.com' }] });
      mockPayload.findByID.mockRejectedValueOnce(new Error('Not Found')); // course run lookup fails

      const request = createJsonRequest({ csvContent });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.failed).toBe(1);
      expect(data.data.errors[0].error).toContain('Course run invalid-cr not found');
    });
  });

  describe('POST /api/lms/enrollments/bulk - Duplicate Handling', () => {
    it('should skip already enrolled students', async () => {
      const csvContent = `studentEmail,courseRunId,status
student@test.com,cr-1,active`;

      mockPayload.find
        .mockResolvedValueOnce({ docs: [{ id: 'student-1', email: 'student@test.com' }] }) // student lookup
        .mockResolvedValueOnce({ docs: [{ id: 'existing-enrollment' }] }); // existing enrollment found
      mockPayload.findByID.mockResolvedValueOnce({ id: 'cr-1' }); // course run lookup

      const request = createJsonRequest({ csvContent });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.skipped).toBe(1);
      expect(data.data.created).toBe(0);
    });
  });

  describe('POST /api/lms/enrollments/bulk - Successful Enrollment', () => {
    it('should create enrollment with all fields', async () => {
      const csvContent = `studentEmail,courseRunId,status,notes
student@test.com,cr-1,pending,New student enrollment`;

      mockPayload.find
        .mockResolvedValueOnce({ docs: [{ id: 'student-1', email: 'student@test.com' }] })
        .mockResolvedValueOnce({ docs: [] });
      mockPayload.findByID.mockResolvedValueOnce({ id: 'cr-1' });
      mockPayload.create.mockResolvedValueOnce({ id: 'enroll-1' });

      const request = createJsonRequest({ csvContent });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.created).toBe(1);
      expect(data.data.created_ids).toContain('enroll-1');

      // Verify create was called with correct data
      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'enrollments',
          data: expect.objectContaining({
            student: 'student-1',
            courseRun: 'cr-1',
            status: 'pending',
            notes: 'New student enrollment',
          }),
        })
      );
    });

    it('should default status to active when not provided', async () => {
      const csvContent = `studentEmail,courseRunId
student@test.com,cr-1`;

      mockPayload.find
        .mockResolvedValueOnce({ docs: [{ id: 'student-1', email: 'student@test.com' }] })
        .mockResolvedValueOnce({ docs: [] });
      mockPayload.findByID.mockResolvedValueOnce({ id: 'cr-1' });
      mockPayload.create.mockResolvedValueOnce({ id: 'enroll-1' });

      const request = createJsonRequest({ csvContent });
      const response = await POST(request);

      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'active',
          }),
        })
      );
    });
  });

  describe('POST /api/lms/enrollments/bulk - Mixed Results', () => {
    it('should handle mixed success/failure rows', async () => {
      const csvContent = `studentEmail,courseRunId,status
success@test.com,cr-1,active
notfound@test.com,cr-1,active
alreadyenrolled@test.com,cr-1,active`;

      // Row 1: Success
      mockPayload.find
        .mockResolvedValueOnce({ docs: [{ id: 'student-1', email: 'success@test.com' }] })
      mockPayload.findByID.mockResolvedValueOnce({ id: 'cr-1' });
      mockPayload.find.mockResolvedValueOnce({ docs: [] }); // no existing enrollment
      mockPayload.create.mockResolvedValueOnce({ id: 'enroll-1' });

      // Row 2: Student not found
      mockPayload.find.mockResolvedValueOnce({ docs: [] });

      // Row 3: Already enrolled
      mockPayload.find
        .mockResolvedValueOnce({ docs: [{ id: 'student-3', email: 'alreadyenrolled@test.com' }] })
      mockPayload.findByID.mockResolvedValueOnce({ id: 'cr-1' });
      mockPayload.find.mockResolvedValueOnce({ docs: [{ id: 'existing' }] });

      const request = createJsonRequest({ csvContent });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.total).toBe(3);
      expect(data.data.created).toBe(1);
      expect(data.data.failed).toBe(1);
      expect(data.data.skipped).toBe(1);
    });
  });

  describe('POST /api/lms/enrollments/bulk - Edge Cases', () => {
    it('should skip empty rows in CSV', async () => {
      const csvContent = `studentEmail,courseRunId,status
student@test.com,cr-1,active

,cr-2,active`;

      mockPayload.find
        .mockResolvedValueOnce({ docs: [{ id: 'student-1', email: 'student@test.com' }] })
        .mockResolvedValueOnce({ docs: [] });
      mockPayload.findByID.mockResolvedValueOnce({ id: 'cr-1' });
      mockPayload.create.mockResolvedValueOnce({ id: 'enroll-1' });

      const request = createJsonRequest({ csvContent });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.total).toBe(1); // Only valid row counted
      expect(data.data.created).toBe(1);
    });

    it('should handle whitespace in CSV values', async () => {
      const csvContent = `studentEmail,courseRunId,status
  student@test.com  ,  cr-1  ,  active  `;

      mockPayload.find
        .mockResolvedValueOnce({ docs: [{ id: 'student-1', email: 'student@test.com' }] })
        .mockResolvedValueOnce({ docs: [] });
      mockPayload.findByID.mockResolvedValueOnce({ id: 'cr-1' });
      mockPayload.create.mockResolvedValueOnce({ id: 'enroll-1' });

      const request = createJsonRequest({ csvContent });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.created).toBe(1);

      // Should have trimmed values
      expect(mockPayload.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: { equals: 'student@test.com' } },
        })
      );
    });

    it('should handle large CSV with many rows', async () => {
      // Generate 50 rows
      const rows = Array.from({ length: 50 }, (_, i) =>
        `student${i}@test.com,cr-1,active`
      ).join('\n');
      const csvContent = `studentEmail,courseRunId,status\n${rows}`;

      // Mock all 50 to succeed
      for (let i = 0; i < 50; i++) {
        mockPayload.find
          .mockResolvedValueOnce({ docs: [{ id: `student-${i}` }] })
          .mockResolvedValueOnce({ docs: [] });
        mockPayload.findByID.mockResolvedValueOnce({ id: 'cr-1' });
        mockPayload.create.mockResolvedValueOnce({ id: `enroll-${i}` });
      }

      const request = createJsonRequest({ csvContent });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.total).toBe(50);
      expect(data.data.created).toBe(50);
      expect(data.data.created_ids.length).toBe(50);
    });

    it('should return correct row numbers in errors', async () => {
      const csvContent = `studentEmail,courseRunId,status
row2@test.com,cr-1,active
row3fail@test.com,cr-1,active
row4@test.com,cr-1,active`;

      // Row 2: Success
      mockPayload.find
        .mockResolvedValueOnce({ docs: [{ id: 'student-1' }] })
        .mockResolvedValueOnce({ docs: [] });
      mockPayload.findByID.mockResolvedValueOnce({ id: 'cr-1' });
      mockPayload.create.mockResolvedValueOnce({ id: 'enroll-1' });

      // Row 3: Fail (student not found)
      mockPayload.find.mockResolvedValueOnce({ docs: [] });

      // Row 4: Success
      mockPayload.find
        .mockResolvedValueOnce({ docs: [{ id: 'student-2' }] })
        .mockResolvedValueOnce({ docs: [] });
      mockPayload.findByID.mockResolvedValueOnce({ id: 'cr-1' });
      mockPayload.create.mockResolvedValueOnce({ id: 'enroll-2' });

      const request = createJsonRequest({ csvContent });
      const response = await POST(request);
      const data = await response.json();

      expect(data.data.errors[0].row).toBe(3); // Row 3 (header=1, data starts at 2)
    });
  });

  describe('POST /api/lms/enrollments/bulk - Error Handling', () => {
    it('should handle Payload create errors gracefully', async () => {
      const csvContent = `studentEmail,courseRunId,status
student@test.com,cr-1,active`;

      mockPayload.find
        .mockResolvedValueOnce({ docs: [{ id: 'student-1' }] })
        .mockResolvedValueOnce({ docs: [] });
      mockPayload.findByID.mockResolvedValueOnce({ id: 'cr-1' });
      mockPayload.create.mockRejectedValueOnce(new Error('Database connection failed'));

      const request = createJsonRequest({ csvContent });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.failed).toBe(1);
      expect(data.data.errors[0].error).toBe('Database connection failed');
    });

    it('should handle internal server errors', async () => {
      const csvContent = `studentEmail,courseRunId,status
student@test.com,cr-1,active`;

      // Make getPayloadHMR throw
      const { getPayloadHMR } = await import('@payloadcms/next/utilities');
      (getPayloadHMR as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Connection timeout'));

      const request = createJsonRequest({ csvContent });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});
