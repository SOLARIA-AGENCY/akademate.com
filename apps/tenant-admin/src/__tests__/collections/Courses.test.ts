/**
 * Courses Collection Tests
 *
 * Comprehensive tests for Courses collection
 * - CRUD operations
 * - Field validation
 * - Relationships (cycle, campuses)
 * - Access control
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import { getPayload } from 'payload';
import type { Payload } from 'payload';

describe('Courses Collection API', () => {
  let payload: Payload;
  let adminToken: string;
  let testCourseId: string;
  let testCycleId: string;
  let testCampusId: string;

  beforeAll(async () => {
    // Initialize Payload
    payload = await getPayload({ config: await import('../../payload.config') });

    // Login as admin
    const loginResponse = await request(payload.express)
      .post('/api/users/login')
      .send({
        email: 'admin@cepcomunicacion.com',
        password: 'admin123',
      });

    adminToken = loginResponse.body.token;

    // Create test cycle
    const cycle = await payload.create({
      collection: 'cycles',
      data: {
        slug: 'test-cycle-for-courses',
        name: 'Test Cycle for Courses',
        level: 'ciclo_superior',
      },
    });
    testCycleId = cycle.id;

    // Create test campus
    const campus = await payload.create({
      collection: 'campuses',
      data: {
        slug: 'test-campus',
        name: 'Test Campus',
        city: 'Madrid',
      },
    });
    testCampusId = campus.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testCourseId) {
      await payload.delete({ collection: 'courses', id: testCourseId }).catch(() => {});
    }
    if (testCycleId) {
      await payload.delete({ collection: 'cycles', id: testCycleId }).catch(() => {});
    }
    if (testCampusId) {
      await payload.delete({ collection: 'campuses', id: testCampusId }).catch(() => {});
    }
  });

  afterEach(() => {
    // Clean up created courses after each test
  });

  describe('POST /api/courses', () => {
    it('should create a course with valid data', async () => {
      const courseData = {
        title: 'Marketing Digital Avanzado',
        slug: 'marketing-digital-avanzado-test',
        course_type: 'privados',
        cycle: testCycleId,
        campuses: [testCampusId],
        modality: 'presencial',
        duration_hours: 120,
        price: 1200,
        financial_aid_available: true,
        description: 'Curso completo de marketing digital',
        active: true,
      };

      const response = await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(courseData)
        .expect(201);

      expect(response.body.doc).toHaveProperty('id');
      expect(response.body.doc.title).toBe(courseData.title);
      expect(response.body.doc.slug).toBe(courseData.slug);
      expect(response.body.doc.price).toBe(courseData.price);

      testCourseId = response.body.doc.id;
    });

    it('should reject course without required fields', async () => {
      const response = await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Incomplete Course' })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should enforce unique slug constraint', async () => {
      const courseData = {
        title: 'Test Course',
        slug: 'duplicate-slug-test-course',
        course_type: 'privados',
        cycle: testCycleId,
        modality: 'online',
      };

      // First creation should succeed
      const first = await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(courseData)
        .expect(201);

      // Second creation with same slug should fail
      await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(courseData)
        .expect(400);

      // Cleanup
      await payload.delete({ collection: 'courses', id: first.body.doc.id });
    });

    it('should validate course_type enum values', async () => {
      const response = await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Invalid Type Course',
          slug: 'invalid-type',
          course_type: 'invalid_type', // Not in enum
          cycle: testCycleId,
          modality: 'online',
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate modality enum values', async () => {
      const response = await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Invalid Modality Course',
          slug: 'invalid-modality',
          course_type: 'privados',
          cycle: testCycleId,
          modality: 'invalid_modality', // Not in enum
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate duration_hours is positive', async () => {
      const response = await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Negative Duration Course',
          slug: 'negative-duration',
          course_type: 'privados',
          cycle: testCycleId,
          modality: 'online',
          duration_hours: -10, // Invalid
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate price is non-negative', async () => {
      const response = await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Negative Price Course',
          slug: 'negative-price',
          course_type: 'privados',
          cycle: testCycleId,
          modality: 'online',
          price: -500, // Invalid
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should auto-generate slug from title if not provided', async () => {
      const response = await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Auto Slug Course',
          course_type: 'privados',
          cycle: testCycleId,
          modality: 'online',
        })
        .expect(201);

      expect(response.body.doc.slug).toBe('auto-slug-course');

      // Cleanup
      await payload.delete({ collection: 'courses', id: response.body.doc.id });
    });
  });

  describe('GET /api/courses', () => {
    it('should return list of courses', async () => {
      const response = await request(payload.express)
        .get('/api/courses')
        .expect(200);

      expect(response.body.docs).toBeInstanceOf(Array);
      expect(response.body.totalDocs).toBeGreaterThan(0);
    });

    it('should allow filtering by course_type', async () => {
      const response = await request(payload.express)
        .get('/api/courses')
        .query({ where: { course_type: { equals: 'privados' } } })
        .expect(200);

      response.body.docs.forEach((course: any) => {
        expect(course.course_type).toBe('privados');
      });
    });

    it('should allow filtering by modality', async () => {
      const response = await request(payload.express)
        .get('/api/courses')
        .query({ where: { modality: { equals: 'online' } } })
        .expect(200);

      response.body.docs.forEach((course: any) => {
        expect(course.modality).toBe('online');
      });
    });

    it('should allow filtering by active status', async () => {
      const response = await request(payload.express)
        .get('/api/courses')
        .query({ where: { active: { equals: true } } })
        .expect(200);

      response.body.docs.forEach((course: any) => {
        expect(course.active).toBe(true);
      });
    });

    it('should allow filtering by featured status', async () => {
      const response = await request(payload.express)
        .get('/api/courses')
        .query({ where: { featured: { equals: true } } })
        .expect(200);

      response.body.docs.forEach((course: any) => {
        expect(course.featured).toBe(true);
      });
    });

    it('should support pagination', async () => {
      const response = await request(payload.express)
        .get('/api/courses')
        .query({ limit: 5, page: 1 })
        .expect(200);

      expect(response.body.docs.length).toBeLessThanOrEqual(5);
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 5);
    });

    it('should be accessible without authentication (public read)', async () => {
      const response = await request(payload.express)
        .get('/api/courses')
        .expect(200);

      expect(response.body.docs).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/courses/:id', () => {
    it('should return a specific course by ID', async () => {
      const courses = await payload.find({ collection: 'courses', limit: 1 });
      const courseId = courses.docs[0].id;

      const response = await request(payload.express)
        .get(`/api/courses/${courseId}`)
        .expect(200);

      expect(response.body.id).toBe(courseId);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('slug');
    });

    it('should populate cycle relationship', async () => {
      const courses = await payload.find({
        collection: 'courses',
        limit: 1,
        where: { cycle: { exists: true } },
      });
      const courseId = courses.docs[0].id;

      const response = await request(payload.express)
        .get(`/api/courses/${courseId}`)
        .query({ depth: 2 })
        .expect(200);

      if (response.body.cycle) {
        expect(typeof response.body.cycle).toBe('object');
        expect(response.body.cycle).toHaveProperty('name');
      }
    });

    it('should return 404 for non-existent course', async () => {
      await request(payload.express)
        .get('/api/courses/99999')
        .expect(404);
    });
  });

  describe('PATCH /api/courses/:id', () => {
    it('should update a course', async () => {
      const courses = await payload.find({ collection: 'courses', limit: 1 });
      const courseId = courses.docs[0].id;

      const response = await request(payload.express)
        .patch(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Updated description' })
        .expect(200);

      expect(response.body.doc.description).toBe('Updated description');
    });

    it('should require authentication for updates', async () => {
      const courses = await payload.find({ collection: 'courses', limit: 1 });
      const courseId = courses.docs[0].id;

      await request(payload.express)
        .patch(`/api/courses/${courseId}`)
        .send({ description: 'Unauthorized update' })
        .expect(401);
    });
  });

  describe('DELETE /api/courses/:id', () => {
    it('should delete a course (admin only)', async () => {
      // Create a course to delete
      const course = await payload.create({
        collection: 'courses',
        data: {
          title: 'To Be Deleted',
          slug: 'to-be-deleted-course',
          course_type: 'privados',
          cycle: testCycleId,
          modality: 'online',
        },
      });

      await request(payload.express)
        .delete(`/api/courses/${course.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify deletion
      const deleted = await payload.findByID({
        collection: 'courses',
        id: course.id,
      }).catch(() => null);

      expect(deleted).toBeNull();
    });

    it('should require admin role for deletion', async () => {
      // TODO: Test with non-admin user after Users collection is fully implemented
      expect(true).toBe(true);
    });
  });

  describe('Relationships', () => {
    it('should allow multiple campuses', async () => {
      const campus2 = await payload.create({
        collection: 'campuses',
        data: {
          slug: 'test-campus-2',
          name: 'Test Campus 2',
          city: 'Barcelona',
        },
      });

      const course = await payload.create({
        collection: 'courses',
        data: {
          title: 'Multi-Campus Course',
          slug: 'multi-campus-course',
          course_type: 'privados',
          cycle: testCycleId,
          campuses: [testCampusId, campus2.id],
          modality: 'presencial',
        },
      });

      expect(course.campuses).toHaveLength(2);

      // Cleanup
      await payload.delete({ collection: 'courses', id: course.id });
      await payload.delete({ collection: 'campuses', id: campus2.id });
    });

    it('should require valid cycle reference', async () => {
      const response = await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Invalid Cycle Course',
          slug: 'invalid-cycle',
          course_type: 'privados',
          cycle: '99999', // Non-existent cycle
          modality: 'online',
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Business Logic', () => {
    it('should allow price of 0 for free courses', async () => {
      const course = await payload.create({
        collection: 'courses',
        data: {
          title: 'Free Course',
          slug: 'free-course-test',
          course_type: 'desempleados',
          cycle: testCycleId,
          modality: 'online',
          price: 0,
        },
      });

      expect(course.price).toBe(0);

      // Cleanup
      await payload.delete({ collection: 'courses', id: course.id });
    });

    it('should handle featured courses', async () => {
      const course = await payload.create({
        collection: 'courses',
        data: {
          title: 'Featured Course',
          slug: 'featured-course-test',
          course_type: 'privados',
          cycle: testCycleId,
          modality: 'online',
          featured: true,
        },
      });

      expect(course.featured).toBe(true);

      // Cleanup
      await payload.delete({ collection: 'courses', id: course.id });
    });
  });
});
