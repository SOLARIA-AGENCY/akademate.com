/**
 * @fileoverview Tests for GDPR API Endpoints
 * 
 * Tests Article 15 (Right of Access) and Article 17 (Right to Erasure) APIs.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockPayload } = vi.hoisted(() => ({
    mockPayload: {
        findByID: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
    },
}));

vi.mock('@payloadcms/next/utilities', () => ({
    getPayloadHMR: vi.fn().mockResolvedValue(mockPayload),
}));

vi.mock('@payload-config', () => ({ default: {} }));

// Import after mocking
import { POST as exportHandler } from '../export/route';
import { GET as exportByIdHandler } from '../[userId]/export/route';
import { POST as deleteByIdHandler } from '../[userId]/delete/route';
import { POST as erasureHandler } from '../erasure/route';

describe('GDPR Export API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 400 if userId is missing', async () => {
        const request = new NextRequest('http://localhost/api/gdpr/export', {
            method: 'POST',
            body: JSON.stringify({}),
        });

        const response = await exportHandler(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('userId');
    });

    it('should return 404 if user is not found', async () => {
        mockPayload.findByID.mockResolvedValue(null);
        mockPayload.find.mockResolvedValue({ docs: [] });

        const request = new NextRequest('http://localhost/api/gdpr/export', {
            method: 'POST',
            body: JSON.stringify({ userId: 'non-existent-id' }),
        });

        const response = await exportHandler(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
    });

    it('should export user data successfully', async () => {
        const mockUser = {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01',
        };

        mockPayload.findByID.mockResolvedValue(mockUser);
        mockPayload.find.mockResolvedValue({ docs: [] });
        mockPayload.create.mockResolvedValue({});

        const request = new NextRequest('http://localhost/api/gdpr/export', {
            method: 'POST',
            body: JSON.stringify({ userId: 'user-123' }),
        });

        const response = await exportHandler(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.profile.email).toBe('test@example.com');
        expect(data.data.exportedAt).toBeDefined();
    });
});

describe('GDPR Export API (User Param)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 400 if userId is missing', async () => {
        const request = new NextRequest('http://localhost/api/gdpr/user/export', {
            method: 'GET',
        });

        const response = await exportByIdHandler(request, { params: { userId: '' } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('userId');
    });

    it('should return 404 if user is not found', async () => {
        mockPayload.findByID.mockResolvedValue(null);
        mockPayload.find.mockResolvedValue({ docs: [] });

        const request = new NextRequest('http://localhost/api/gdpr/user-123/export', {
            method: 'GET',
        });

        const response = await exportByIdHandler(request, { params: { userId: 'user-123' } });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
    });

    it('should export user data successfully', async () => {
        const mockUser = {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01',
        };

        mockPayload.findByID.mockResolvedValue(mockUser);
        mockPayload.find.mockResolvedValue({ docs: [] });
        mockPayload.create.mockResolvedValue({});

        const request = new NextRequest('http://localhost/api/gdpr/user-123/export', {
            method: 'GET',
        });

        const response = await exportByIdHandler(request, { params: { userId: 'user-123' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.profile.email).toBe('test@example.com');
        expect(data.data.exportedAt).toBeDefined();
    });
});

describe('GDPR Erasure API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 400 if userId is missing', async () => {
        const request = new NextRequest('http://localhost/api/gdpr/erasure', {
            method: 'POST',
            body: JSON.stringify({ confirmDeletion: true }),
        });

        const response = await erasureHandler(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('userId');
    });

    it('should return 400 if confirmDeletion is not true', async () => {
        const request = new NextRequest('http://localhost/api/gdpr/erasure', {
            method: 'POST',
            body: JSON.stringify({ userId: 'user-123', confirmDeletion: false }),
        });

        const response = await erasureHandler(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('confirmDeletion');
    });

    it('should return 404 if user is not found', async () => {
        mockPayload.findByID.mockResolvedValue(null);

        const request = new NextRequest('http://localhost/api/gdpr/erasure', {
            method: 'POST',
            body: JSON.stringify({ userId: 'non-existent-id', confirmDeletion: true }),
        });

        const response = await erasureHandler(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
    });

    it('should return 400 if user is already anonymized', async () => {
        mockPayload.findByID.mockResolvedValue({
            id: 'user-123',
            email: 'anonymized-abc@deleted.local',
            name: 'Deleted User',
        });

        const request = new NextRequest('http://localhost/api/gdpr/erasure', {
            method: 'POST',
            body: JSON.stringify({ userId: 'user-123', confirmDeletion: true }),
        });

        const response = await erasureHandler(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('already been anonymized');
    });

    it('should anonymize user data successfully', async () => {
        mockPayload.findByID.mockResolvedValue({
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
        });
        mockPayload.count.mockResolvedValue({ totalDocs: 5 });
        mockPayload.update.mockResolvedValue({});
        mockPayload.delete.mockResolvedValue({ docs: [] });
        mockPayload.create.mockResolvedValue({});

        const request = new NextRequest('http://localhost/api/gdpr/erasure', {
            method: 'POST',
            body: JSON.stringify({ userId: 'user-123', confirmDeletion: true, reason: 'User requested' }),
        });

        const response = await erasureHandler(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.fieldsAnonymized).toContain('email');
        expect(data.data.anonymizedAt).toBeDefined();
        expect(data.data.verificationToken).toBeDefined();
    });
});

describe('GDPR Delete API (User Param)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 400 if userId is missing', async () => {
        const request = new NextRequest('http://localhost/api/gdpr/user/delete', {
            method: 'POST',
            body: JSON.stringify({ confirmDeletion: true }),
        });

        const response = await deleteByIdHandler(request, { params: { userId: '' } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('userId');
    });

    it('should return 400 if confirmDeletion is not true', async () => {
        const request = new NextRequest('http://localhost/api/gdpr/user-123/delete', {
            method: 'POST',
            body: JSON.stringify({ confirmDeletion: false }),
        });

        const response = await deleteByIdHandler(request, { params: { userId: 'user-123' } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('confirmDeletion');
    });

    it('should return 404 if user is not found', async () => {
        mockPayload.findByID.mockResolvedValue(null);

        const request = new NextRequest('http://localhost/api/gdpr/user-123/delete', {
            method: 'POST',
            body: JSON.stringify({ confirmDeletion: true }),
        });

        const response = await deleteByIdHandler(request, { params: { userId: 'user-123' } });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
    });

    it('should return 400 if user is already anonymized', async () => {
        mockPayload.findByID.mockResolvedValue({
            id: 'user-123',
            email: 'anonymized-abc@deleted.local',
            name: 'Deleted User',
        });

        const request = new NextRequest('http://localhost/api/gdpr/user-123/delete', {
            method: 'POST',
            body: JSON.stringify({ confirmDeletion: true }),
        });

        const response = await deleteByIdHandler(request, { params: { userId: 'user-123' } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('already been anonymized');
    });

    it('should anonymize user data successfully', async () => {
        mockPayload.findByID.mockResolvedValue({
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
        });
        mockPayload.count.mockResolvedValue({ totalDocs: 5 });
        mockPayload.update.mockResolvedValue({});
        mockPayload.delete.mockResolvedValue({ docs: [] });
        mockPayload.create.mockResolvedValue({});

        const request = new NextRequest('http://localhost/api/gdpr/user-123/delete', {
            method: 'POST',
            body: JSON.stringify({ confirmDeletion: true, reason: 'User requested' }),
        });

        const response = await deleteByIdHandler(request, { params: { userId: 'user-123' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.fieldsAnonymized).toContain('email');
        expect(data.data.anonymizedAt).toBeDefined();
        expect(data.data.verificationToken).toBeDefined();
    });
});
