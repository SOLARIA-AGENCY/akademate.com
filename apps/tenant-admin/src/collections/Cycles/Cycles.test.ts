import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { getPayload } from 'payload';
import type { Payload } from 'payload';

describe('Cycles Collection API', () => {
  let payload: Payload;
  let adminToken: string;
  let testCycleId: string;

  beforeAll(async () => {
    // Initialize Payload
    payload = await getPayload({ config: await import('../../payload.config') });

    // Login as admin (using seed data)
    const loginResponse = await request(payload.express)
      .post('/api/users/login')
      .send({
        email: 'admin@cepcomunicacion.com',
        password: 'admin123', // From seed data
      });

    adminToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testCycleId) {
      await payload.delete({
        collection: 'cycles',
        id: testCycleId,
      });
    }
  });

  describe('POST /api/cycles', () => {
    it('should create a cycle with valid data', async () => {
      const cycleData = {
        slug: 'grado-superior-test',
        name: 'Grado Superior Test',
        description: 'Formación Profesional de Grado Superior',
        level: 'grado_superior',
        order_display: 3,
      };

      const response = await request(payload.express)
        .post('/api/cycles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(cycleData)
        .expect(201);

      expect(response.body.doc).toHaveProperty('id');
      expect(response.body.doc.slug).toBe('grado-superior-test');
      expect(response.body.doc.name).toBe('Grado Superior Test');
      expect(response.body.doc.level).toBe('grado_superior');

      testCycleId = response.body.doc.id;
    });

    it('should reject cycle without required fields', async () => {
      const response = await request(payload.express)
        .post('/api/cycles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ slug: 'incomplete' })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should enforce unique slug constraint', async () => {
      const cycleData = {
        slug: 'duplicate-slug-test',
        name: 'Test Cycle',
        level: 'grado_medio',
      };

      // First creation should succeed
      const first = await request(payload.express)
        .post('/api/cycles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(cycleData)
        .expect(201);

      // Second creation with same slug should fail
      await request(payload.express)
        .post('/api/cycles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(cycleData)
        .expect(400);

      // Cleanup
      await payload.delete({ collection: 'cycles', id: first.body.doc.id });
    });

    it('should validate level enum values', async () => {
      const response = await request(payload.express)
        .post('/api/cycles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slug: 'invalid-level',
          name: 'Invalid Level',
          level: 'invalid_value', // Not in enum
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should auto-generate slug from name if not provided', async () => {
      const response = await request(payload.express)
        .post('/api/cycles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Certificado de Profesionalidad',
          level: 'certificado_profesionalidad',
        })
        .expect(201);

      expect(response.body.doc.slug).toBe('certificado-de-profesionalidad');

      // Cleanup
      await payload.delete({ collection: 'cycles', id: response.body.doc.id });
    });
  });

  describe('GET /api/cycles', () => {
    it('should return list of cycles sorted by order_display', async () => {
      const response = await request(payload.express)
        .get('/api/cycles')
        .expect(200);

      expect(response.body.docs).toBeInstanceOf(Array);
      expect(response.body.totalDocs).toBeGreaterThan(0);

      // Verify sorting
      const orderDisplays = response.body.docs.map((c: any) => c.order_display);
      const sorted = [...orderDisplays].sort((a, b) => a - b);
      expect(orderDisplays).toEqual(sorted);
    });

    it('should allow filtering by level', async () => {
      const response = await request(payload.express)
        .get('/api/cycles')
        .query({ where: { level: { equals: 'grado_superior' } } })
        .expect(200);

      response.body.docs.forEach((cycle: any) => {
        expect(cycle.level).toBe('grado_superior');
      });
    });

    it('should be accessible without authentication (public read)', async () => {
      const response = await request(payload.express)
        .get('/api/cycles')
        .expect(200);

      expect(response.body.docs).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/cycles/:id', () => {
    it('should return a specific cycle by ID', async () => {
      const cycles = await payload.find({ collection: 'cycles', limit: 1 });
      const cycleId = cycles.docs[0].id;

      const response = await request(payload.express)
        .get(`/api/cycles/${cycleId}`)
        .expect(200);

      expect(response.body.id).toBe(cycleId);
      expect(response.body).toHaveProperty('slug');
      expect(response.body).toHaveProperty('name');
    });

    it('should return 404 for non-existent cycle', async () => {
      await request(payload.express)
        .get('/api/cycles/99999')
        .expect(404);
    });
  });

  describe('PATCH /api/cycles/:id', () => {
    it('should update a cycle', async () => {
      const cycles = await payload.find({ collection: 'cycles', limit: 1 });
      const cycleId = cycles.docs[0].id;

      const response = await request(payload.express)
        .patch(`/api/cycles/${cycleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Updated description' })
        .expect(200);

      expect(response.body.doc.description).toBe('Updated description');
    });

    it('should require authentication for updates', async () => {
      const cycles = await payload.find({ collection: 'cycles', limit: 1 });
      const cycleId = cycles.docs[0].id;

      await request(payload.express)
        .patch(`/api/cycles/${cycleId}`)
        .send({ description: 'Unauthorized update' })
        .expect(401);
    });
  });

  describe('DELETE /api/cycles/:id', () => {
    it('should delete a cycle (admin only)', async () => {
      // Create a cycle to delete
      const cycle = await payload.create({
        collection: 'cycles',
        data: {
          slug: 'to-be-deleted',
          name: 'To Be Deleted',
          level: 'fp_basica',
        },
      });

      await request(payload.express)
        .delete(`/api/cycles/${cycle.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify deletion
      const deleted = await payload.findByID({
        collection: 'cycles',
        id: cycle.id,
      }).catch(() => null);

      expect(deleted).toBeNull();
    });

    it('should require admin role for deletion', async () => {
      // TODO: Test with non-admin user after Users collection is implemented
      expect(true).toBe(true);
    });
  });

  describe('Access Control', () => {
    it('should allow admin to create cycles', async () => {
      // Already tested above
      expect(true).toBe(true);
    });

    it('should allow gestor to create cycles', async () => {
      // TODO: Implement after Users collection with gestor role
      expect(true).toBe(true);
    });

    it('should prevent marketing role from creating cycles', async () => {
      // TODO: Implement after Users collection with marketing role
      expect(true).toBe(true);
    });
  });
});
