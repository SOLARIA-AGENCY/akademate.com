import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const findByIDMock = vi.fn();
const findMock = vi.fn();
const createMock = vi.fn();
const updateMock = vi.fn();

vi.mock('@payloadcms/next/utilities', () => ({
  getPayloadHMR: vi.fn(async () => ({
    findByID: findByIDMock,
    find: findMock,
    create: createMock,
    update: updateMock,
  })),
}));

vi.mock('@payload-config', () => ({
  default: {},
}));

describe('LMS progress route resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when enrollmentId is missing', async () => {
    const { GET } = await import('../../app/api/lms/progress/route');
    const request = new NextRequest('http://localhost/api/lms/progress');

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('returns empty progress payload when lesson_progress table is missing', async () => {
    findByIDMock.mockResolvedValue({
      id: '3',
      user: '2',
      courseRun: '5',
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const missingRelationError = Object.assign(new Error('relation "lesson_progress" does not exist'), {
      code: '42P01',
    });

    findMock.mockRejectedValueOnce(missingRelationError);

    const { GET } = await import('../../app/api/lms/progress/route');
    const request = new NextRequest('http://localhost/api/lms/progress?enrollmentId=3');

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.enrollmentId).toBe('3');
    expect(json.data.progressPercent).toBe(0);
    expect(json.data.lessonProgress).toEqual([]);
  });

  it('returns 503 on POST when lesson_progress storage is unavailable', async () => {
    const missingRelationError = Object.assign(new Error('relation "lesson_progress" does not exist'), {
      code: '42P01',
    });

    findMock.mockRejectedValueOnce(missingRelationError);

    const { POST } = await import('../../app/api/lms/progress/route');
    const request = new NextRequest('http://localhost/api/lms/progress', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        enrollmentId: '3',
        lessonId: 'lesson-1',
        isCompleted: true,
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.success).toBe(false);
    expect(String(json.error)).toContain('not available');
  });
});
