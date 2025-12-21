/**
 * @fileoverview Tests for LMS API Endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock getPayloadHMR
const mockPayload = {
    findByID: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
};

vi.mock('@payloadcms/next/utilities', () => ({
    getPayloadHMR: vi.fn().mockResolvedValue(mockPayload),
}));

vi.mock('@payload-config', () => ({}));

// Import handlers
import { GET as progressGet, POST as progressPost } from '../progress/route';
import { GET as contentGet } from '../content/route';
import { GET as gamificationGet, POST as gamificationPost } from '../gamification/route';

describe('LMS Progress API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('GET should return 400 if enrollmentId is missing', async () => {
        const request = new NextRequest('http://localhost/api/lms/progress');
        const response = await progressGet(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
    });

    it('GET should return 404 if enrollment not found', async () => {
        mockPayload.findByID.mockResolvedValue(null);

        const request = new NextRequest('http://localhost/api/lms/progress?enrollmentId=123');
        const response = await progressGet(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
    });

    it('GET should return progress summary', async () => {
        mockPayload.findByID.mockResolvedValue({
            id: '123',
            user: 'user-1',
            courseRun: 'cr-1',
            status: 'active',
        });
        mockPayload.find.mockResolvedValue({
            docs: [
                { id: 'lp1', isCompleted: true, timeSpent: 300 },
                { id: 'lp2', isCompleted: false, timeSpent: 60 },
            ],
        });

        const request = new NextRequest('http://localhost/api/lms/progress?enrollmentId=123');
        const response = await progressGet(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.completedLessons).toBe(1);
        expect(data.data.progressPercent).toBe(50);
    });

    it('POST should return 400 if required params missing', async () => {
        const request = new NextRequest('http://localhost/api/lms/progress', {
            method: 'POST',
            body: JSON.stringify({}),
        });
        const response = await progressPost(request);
        const data = await response.json();

        expect(response.status).toBe(400);
    });
});

describe('LMS Content API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('GET should return 400 if no params provided', async () => {
        const request = new NextRequest('http://localhost/api/lms/content');
        const response = await contentGet(request);
        const data = await response.json();

        expect(response.status).toBe(400);
    });

    it('GET should return modules for courseId', async () => {
        mockPayload.find.mockResolvedValue({
            docs: [{ id: 'm1', title: 'Module 1' }],
            totalDocs: 1,
        });

        const request = new NextRequest('http://localhost/api/lms/content?courseId=c1');
        const response = await contentGet(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.modules.length).toBe(1);
    });
});

describe('LMS Gamification API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('GET should return gamification data for userId', async () => {
        mockPayload.find.mockResolvedValue({ docs: [], totalDocs: 0 });

        const request = new NextRequest('http://localhost/api/lms/gamification?userId=u1');
        const response = await gamificationGet(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.totalPoints).toBe(0);
    });

    it('POST should award points', async () => {
        mockPayload.create.mockResolvedValue({ id: 'tx1', points: 100 });
        mockPayload.find.mockResolvedValue({ docs: [] });

        const request = new NextRequest('http://localhost/api/lms/gamification', {
            method: 'POST',
            body: JSON.stringify({
                userId: 'u1',
                points: 100,
                reason: 'Completed lesson',
            }),
        });
        const response = await gamificationPost(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
    });
});
