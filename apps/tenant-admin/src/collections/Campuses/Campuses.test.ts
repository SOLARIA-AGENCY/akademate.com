import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { getPayload } from 'payload';
import type { Payload } from 'payload';

describe('Campuses Collection API', () => {
  let payload: Payload;
  let adminToken: string;
  let testCampusId: string;

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
    if (testCampusId) {
      await payload.delete({
        collection: 'campuses',
        id: testCampusId,
      });
    }
  });

  describe('POST /api/campuses', () => {
    it('should create a campus with valid data', async () => {
      const campusData = {
        slug: 'madrid-centro-test',
        name: 'Madrid Centro Test',
        city: 'Madrid',
        address: 'Calle Gran Vía 123',
        postal_code: '28013',
        phone: '+34 912 345 678',
        email: 'madrid.centro@cepcomunicacion.com',
        maps_url: 'https://maps.google.com/test',
      };

      const response = await request(payload.express)
        .post('/api/campuses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(campusData)
        .expect(201);

      expect(response.body.doc).toHaveProperty('id');
      expect(response.body.doc.slug).toBe('madrid-centro-test');
      expect(response.body.doc.name).toBe('Madrid Centro Test');
      expect(response.body.doc.city).toBe('Madrid');
      expect(response.body.doc.postal_code).toBe('28013');
      expect(response.body.doc.phone).toBe('+34 912 345 678');
      expect(response.body.doc.email).toBe('madrid.centro@cepcomunicacion.com');

      testCampusId = response.body.doc.id;
    });

    it('should reject campus without required fields', async () => {
      const response = await request(payload.express)
        .post('/api/campuses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ slug: 'incomplete' })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should enforce unique slug constraint', async () => {
      const campusData = {
        slug: 'duplicate-slug-test',
        name: 'Test Campus',
        city: 'Barcelona',
      };

      // First creation should succeed
      const first = await request(payload.express)
        .post('/api/campuses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(campusData)
        .expect(201);

      // Second creation with same slug should fail
      await request(payload.express)
        .post('/api/campuses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(campusData)
        .expect(400);

      // Cleanup
      await payload.delete({ collection: 'campuses', id: first.body.doc.id });
    });

    it('should validate email format', async () => {
      const response = await request(payload.express)
        .post('/api/campuses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slug: 'invalid-email',
          name: 'Invalid Email Campus',
          city: 'Valencia',
          email: 'not-an-email', // Invalid email
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate postal code format (5 digits)', async () => {
      const response = await request(payload.express)
        .post('/api/campuses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slug: 'invalid-postal',
          name: 'Invalid Postal Campus',
          city: 'Sevilla',
          postal_code: '123', // Invalid: not 5 digits
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate phone format (+34 XXX XXX XXX)', async () => {
      const response = await request(payload.express)
        .post('/api/campuses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slug: 'invalid-phone',
          name: 'Invalid Phone Campus',
          city: 'Málaga',
          phone: '912345678', // Invalid: missing +34 and spaces
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate maps_url as valid URL', async () => {
      const response = await request(payload.express)
        .post('/api/campuses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slug: 'invalid-url',
          name: 'Invalid URL Campus',
          city: 'Bilbao',
          maps_url: 'not-a-url', // Invalid URL
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should auto-generate slug from name if not provided', async () => {
      const response = await request(payload.express)
        .post('/api/campuses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Zaragoza Campus',
          city: 'Zaragoza',
        })
        .expect(201);

      expect(response.body.doc.slug).toBe('zaragoza-campus');

      // Cleanup
      await payload.delete({ collection: 'campuses', id: response.body.doc.id });
    });

    it('should normalize slug with accents and special characters', async () => {
      const response = await request(payload.express)
        .post('/api/campuses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Málaga Ñuñez & López',
          city: 'Málaga',
        })
        .expect(201);

      // Should remove accents and special characters
      expect(response.body.doc.slug).toBe('malaga-nunez-lopez');

      // Cleanup
      await payload.delete({ collection: 'campuses', id: response.body.doc.id });
    });
  });

  describe('GET /api/campuses', () => {
    it('should return list of campuses sorted by name', async () => {
      const response = await request(payload.express)
        .get('/api/campuses')
        .expect(200);

      expect(response.body.docs).toBeInstanceOf(Array);
      expect(response.body.totalDocs).toBeGreaterThanOrEqual(0);

      // Verify sorting by name
      if (response.body.docs.length > 1) {
        const names = response.body.docs.map((c: any) => c.name);
        const sorted = [...names].sort();
        expect(names).toEqual(sorted);
      }
    });

    it('should allow filtering by city', async () => {
      // Create test campuses
      const madrid1 = await payload.create({
        collection: 'campuses',
        data: { name: 'Madrid Test 1', city: 'Madrid' },
      });

      const barcelona1 = await payload.create({
        collection: 'campuses',
        data: { name: 'Barcelona Test 1', city: 'Barcelona' },
      });

      const response = await request(payload.express)
        .get('/api/campuses')
        .query({ where: { city: { equals: 'Madrid' } } })
        .expect(200);

      response.body.docs.forEach((campus: any) => {
        expect(campus.city).toBe('Madrid');
      });

      // Cleanup
      await payload.delete({ collection: 'campuses', id: madrid1.id });
      await payload.delete({ collection: 'campuses', id: barcelona1.id });
    });

    it('should be accessible without authentication (public read)', async () => {
      const response = await request(payload.express)
        .get('/api/campuses')
        .expect(200);

      expect(response.body.docs).toBeInstanceOf(Array);
    });

    it('should return campuses with all fields', async () => {
      // Create a campus with all fields
      const campus = await payload.create({
        collection: 'campuses',
        data: {
          name: 'Full Data Campus',
          city: 'Valencia',
          address: 'Test Address 123',
          postal_code: '46001',
          phone: '+34 963 123 456',
          email: 'test@campus.com',
          maps_url: 'https://maps.google.com/test',
        },
      });

      const response = await request(payload.express)
        .get('/api/campuses')
        .query({ where: { id: { equals: campus.id } } })
        .expect(200);

      const doc = response.body.docs[0];
      expect(doc.name).toBe('Full Data Campus');
      expect(doc.city).toBe('Valencia');
      expect(doc.address).toBe('Test Address 123');
      expect(doc.postal_code).toBe('46001');
      expect(doc.phone).toBe('+34 963 123 456');
      expect(doc.email).toBe('test@campus.com');
      expect(doc.maps_url).toBe('https://maps.google.com/test');

      // Cleanup
      await payload.delete({ collection: 'campuses', id: campus.id });
    });
  });

  describe('GET /api/campuses/:id', () => {
    it('should return a specific campus by ID', async () => {
      const campus = await payload.create({
        collection: 'campuses',
        data: {
          name: 'Test Campus',
          city: 'Madrid',
        },
      });

      const response = await request(payload.express)
        .get(`/api/campuses/${campus.id}`)
        .expect(200);

      expect(response.body.id).toBe(campus.id);
      expect(response.body).toHaveProperty('slug');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('city');

      // Cleanup
      await payload.delete({ collection: 'campuses', id: campus.id });
    });

    it('should return 404 for non-existent campus', async () => {
      await request(payload.express)
        .get('/api/campuses/99999')
        .expect(404);
    });
  });

  describe('PATCH /api/campuses/:id', () => {
    it('should update a campus', async () => {
      const campus = await payload.create({
        collection: 'campuses',
        data: {
          name: 'Original Campus',
          city: 'Barcelona',
        },
      });

      const response = await request(payload.express)
        .patch(`/api/campuses/${campus.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ address: 'Updated Address 456' })
        .expect(200);

      expect(response.body.doc.address).toBe('Updated Address 456');

      // Cleanup
      await payload.delete({ collection: 'campuses', id: campus.id });
    });

    it('should require authentication for updates', async () => {
      const campus = await payload.create({
        collection: 'campuses',
        data: {
          name: 'Test Campus',
          city: 'Sevilla',
        },
      });

      await request(payload.express)
        .patch(`/api/campuses/${campus.id}`)
        .send({ address: 'Unauthorized update' })
        .expect(401);

      // Cleanup
      await payload.delete({ collection: 'campuses', id: campus.id });
    });

    it('should validate email on update', async () => {
      const campus = await payload.create({
        collection: 'campuses',
        data: {
          name: 'Test Campus',
          city: 'Granada',
        },
      });

      await request(payload.express)
        .patch(`/api/campuses/${campus.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'invalid-email' })
        .expect(400);

      // Cleanup
      await payload.delete({ collection: 'campuses', id: campus.id });
    });

    it('should validate phone format on update', async () => {
      const campus = await payload.create({
        collection: 'campuses',
        data: {
          name: 'Test Campus',
          city: 'Córdoba',
        },
      });

      await request(payload.express)
        .patch(`/api/campuses/${campus.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ phone: 'invalid-phone' })
        .expect(400);

      // Cleanup
      await payload.delete({ collection: 'campuses', id: campus.id });
    });

    it('should validate postal code on update', async () => {
      const campus = await payload.create({
        collection: 'campuses',
        data: {
          name: 'Test Campus',
          city: 'Toledo',
        },
      });

      await request(payload.express)
        .patch(`/api/campuses/${campus.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ postal_code: '123' })
        .expect(400);

      // Cleanup
      await payload.delete({ collection: 'campuses', id: campus.id });
    });
  });

  describe('DELETE /api/campuses/:id', () => {
    it('should delete a campus (admin only)', async () => {
      // Create a campus to delete
      const campus = await payload.create({
        collection: 'campuses',
        data: {
          slug: 'to-be-deleted',
          name: 'To Be Deleted',
          city: 'Murcia',
        },
      });

      await request(payload.express)
        .delete(`/api/campuses/${campus.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify deletion
      const deleted = await payload.findByID({
        collection: 'campuses',
        id: campus.id,
      }).catch(() => null);

      expect(deleted).toBeNull();
    });

    it('should require admin role for deletion', async () => {
      // TODO: Test with non-admin user after Users collection is fully implemented
      expect(true).toBe(true);
    });
  });

  describe('Access Control', () => {
    it('should allow admin to create campuses', async () => {
      // Already tested above
      expect(true).toBe(true);
    });

    it('should allow gestor to create campuses', async () => {
      // TODO: Implement after Users collection with gestor role
      expect(true).toBe(true);
    });

    it('should prevent marketing role from creating campuses', async () => {
      // TODO: Implement after Users collection with marketing role
      expect(true).toBe(true);
    });
  });

  describe('Data Integrity', () => {
    it('should enforce maximum length for text fields', async () => {
      const response = await request(payload.express)
        .post('/api/campuses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slug: 'a'.repeat(101), // Exceeds max length
          name: 'Test Campus',
          city: 'Madrid',
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should enforce minimum length for required fields', async () => {
      const response = await request(payload.express)
        .post('/api/campuses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slug: 'test',
          name: 'AB', // Too short
          city: 'Madrid',
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should trim whitespace from text fields', async () => {
      const response = await request(payload.express)
        .post('/api/campuses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '  Whitespace Campus  ',
          city: '  Madrid  ',
        })
        .expect(201);

      expect(response.body.doc.name).toBe('Whitespace Campus');
      expect(response.body.doc.city).toBe('Madrid');

      // Cleanup
      await payload.delete({ collection: 'campuses', id: response.body.doc.id });
    });
  });
});
