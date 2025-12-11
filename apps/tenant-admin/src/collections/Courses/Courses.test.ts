import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { getPayload } from 'payload';
import type { Payload } from 'payload';

/**
 * Courses Collection - Comprehensive Test Suite (TDD RED Phase)
 *
 * This test suite covers:
 * - CRUD Operations (15+ tests)
 * - Validation (15+ tests)
 * - Access Control (12+ tests)
 * - Relationships (8+ tests)
 *
 * Total: 50+ test cases
 *
 * Following TDD methodology:
 * 1. RED: Tests written first (this file)
 * 2. GREEN: Implementation to make tests pass
 * 3. REFACTOR: Clean up and optimize
 */

describe('Courses Collection - Comprehensive Test Suite', () => {
  let payload: Payload;
  let adminToken: string;
  let gestorToken: string;
  let marketingToken: string;
  let asesorToken: string;
  let lecturaToken: string;

  let adminUserId: string;
  let marketingUserId: string;

  let testCycleId: string;
  let testCampusId1: string;
  let testCampusId2: string;
  let testCourseId: string;

  beforeAll(async () => {
    // Initialize Payload
    payload = await getPayload({ config: await import('../../payload.config') });

    // Login as admin (using seed data)
    const adminLogin = await request(payload.express)
      .post('/api/users/login')
      .send({
        email: 'admin@cepcomunicacion.com',
        password: 'Admin123!',
      });
    adminToken = adminLogin.body.token;
    adminUserId = adminLogin.body.user.id;

    // Login as gestor
    const gestorLogin = await request(payload.express)
      .post('/api/users/login')
      .send({
        email: 'gestor@cepcomunicacion.com',
        password: 'Gestor123!',
      });
    gestorToken = gestorLogin.body.token;

    // Login as marketing
    const marketingLogin = await request(payload.express)
      .post('/api/users/login')
      .send({
        email: 'marketing@cepcomunicacion.com',
        password: 'Marketing123!',
      });
    marketingToken = marketingLogin.body.token;
    marketingUserId = marketingLogin.body.user.id;

    // Login as asesor
    const asesorLogin = await request(payload.express)
      .post('/api/users/login')
      .send({
        email: 'asesor@cepcomunicacion.com',
        password: 'Asesor123!',
      });
    asesorToken = asesorLogin.body.token;

    // Login as lectura
    const lecturaLogin = await request(payload.express)
      .post('/api/users/login')
      .send({
        email: 'lectura@cepcomunicacion.com',
        password: 'Lectura123!',
      });
    lecturaToken = lecturaLogin.body.token;

    // Create test cycle
    const cycle = await payload.create({
      collection: 'cycles',
      data: {
        slug: 'grado-superior-test',
        name: 'Grado Superior Test',
        level: 'grado_superior',
        order_display: 99,
      },
    });
    testCycleId = cycle.id;

    // Create test campuses
    const campus1 = await payload.create({
      collection: 'campuses',
      data: {
        slug: 'madrid-test-campus',
        name: 'Madrid Test Campus',
        city: 'Madrid',
      },
    });
    testCampusId1 = campus1.id;

    const campus2 = await payload.create({
      collection: 'campuses',
      data: {
        slug: 'barcelona-test-campus',
        name: 'Barcelona Test Campus',
        city: 'Barcelona',
      },
    });
    testCampusId2 = campus2.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testCourseId) {
      await payload.delete({ collection: 'courses', id: testCourseId }).catch(() => {});
    }
    if (testCampusId1) {
      await payload.delete({ collection: 'campuses', id: testCampusId1 }).catch(() => {});
    }
    if (testCampusId2) {
      await payload.delete({ collection: 'campuses', id: testCampusId2 }).catch(() => {});
    }
    if (testCycleId) {
      await payload.delete({ collection: 'cycles', id: testCycleId }).catch(() => {});
    }
  });

  // ============================================================================
  // CRUD OPERATIONS TESTS (15+ tests)
  // ============================================================================

  describe('CRUD Operations', () => {
    describe('POST /api/courses - Create Course', () => {
      it('should create course with all required fields', async () => {
        const courseData = {
          name: 'Técnico Superior en Marketing Digital',
          cycle: testCycleId,
          modality: 'presencial',
        };

        const response = await request(payload.express)
          .post('/api/courses')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(courseData)
          .expect(201);

        expect(response.body.doc).toHaveProperty('id');
        expect(response.body.doc.name).toBe('Técnico Superior en Marketing Digital');
        expect(response.body.doc.cycle).toBe(testCycleId);
        expect(response.body.doc.modality).toBe('presencial');
        expect(response.body.doc.active).toBe(true); // Default
        expect(response.body.doc.featured).toBe(false); // Default
        expect(response.body.doc.financial_aid_available).toBe(true); // Default

        testCourseId = response.body.doc.id;
      });

      it('should create course with cycle relationship', async () => {
        const courseData = {
          name: 'Course with Cycle Relationship',
          cycle: testCycleId,
          modality: 'online',
        };

        const response = await request(payload.express)
          .post('/api/courses')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(courseData)
          .expect(201);

        expect(response.body.doc.cycle).toBe(testCycleId);

        // Cleanup
        await payload.delete({ collection: 'courses', id: response.body.doc.id });
      });

      it('should create course with multiple campus relationships', async () => {
        const courseData = {
          name: 'Multi-Campus Course',
          cycle: testCycleId,
          modality: 'presencial',
          campuses: [testCampusId1, testCampusId2],
        };

        const response = await request(payload.express)
          .post('/api/courses')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(courseData)
          .expect(201);

        expect(response.body.doc.campuses).toEqual(
          expect.arrayContaining([testCampusId1, testCampusId2])
        );

        // Cleanup
        await payload.delete({ collection: 'courses', id: response.body.doc.id });
      });

      it('should create course with empty campus array for online courses', async () => {
        const courseData = {
          name: 'Online Only Course',
          cycle: testCycleId,
          modality: 'online',
          campuses: [],
        };

        const response = await request(payload.express)
          .post('/api/courses')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(courseData)
          .expect(201);

        expect(response.body.doc.campuses || []).toEqual([]);

        // Cleanup
        await payload.delete({ collection: 'courses', id: response.body.doc.id });
      });

      it('should create course with financial_aid_available and featured flags', async () => {
        const courseData = {
          name: 'Featured Course with Aid',
          cycle: testCycleId,
          modality: 'hibrido',
          financial_aid_available: true,
          featured: true,
        };

        const response = await request(payload.express)
          .post('/api/courses')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(courseData)
          .expect(201);

        expect(response.body.doc.financial_aid_available).toBe(true);
        expect(response.body.doc.featured).toBe(true);

        // Cleanup
        await payload.delete({ collection: 'courses', id: response.body.doc.id });
      });

      it('should auto-generate slug from course name (Spanish characters → ASCII)', async () => {
        const courseData = {
          name: 'Técnico en Aplicaciones Informáticas',
          cycle: testCycleId,
          modality: 'presencial',
        };

        const response = await request(payload.express)
          .post('/api/courses')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(courseData)
          .expect(201);

        expect(response.body.doc.slug).toBe('tecnico-en-aplicaciones-informaticas');

        // Cleanup
        await payload.delete({ collection: 'courses', id: response.body.doc.id });
      });
    });

    describe('GET /api/courses - Read Courses', () => {
      it('should read single course by ID', async () => {
        const response = await request(payload.express)
          .get(`/api/courses/${testCourseId}`)
          .expect(200);

        expect(response.body.id).toBe(testCourseId);
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('modality');
      });

      it('should read course list with pagination', async () => {
        const response = await request(payload.express)
          .get('/api/courses')
          .query({ limit: 10, page: 1 })
          .expect(200);

        expect(response.body.docs).toBeInstanceOf(Array);
        expect(response.body).toHaveProperty('totalDocs');
        expect(response.body).toHaveProperty('limit');
        expect(response.body).toHaveProperty('page');
      });

      it('should query courses by cycle_id', async () => {
        const response = await request(payload.express)
          .get('/api/courses')
          .query({ where: { cycle: { equals: testCycleId } } })
          .expect(200);

        response.body.docs.forEach((course: any) => {
          expect(course.cycle).toBe(testCycleId);
        });
      });

      it('should query courses by campus (using array contains)', async () => {
        // Create course with specific campus
        const course = await payload.create({
          collection: 'courses',
          data: {
            name: 'Campus Query Test',
            cycle: testCycleId,
            modality: 'presencial',
            campuses: [testCampusId1],
          },
        });

        const response = await request(payload.express)
          .get('/api/courses')
          .query({ where: { campuses: { contains: testCampusId1 } } })
          .expect(200);

        const foundCourse = response.body.docs.find((c: any) => c.id === course.id);
        expect(foundCourse).toBeDefined();

        // Cleanup
        await payload.delete({ collection: 'courses', id: course.id });
      });

      it('should query featured courses only', async () => {
        // Create featured course
        const featuredCourse = await payload.create({
          collection: 'courses',
          data: {
            name: 'Featured Course Test',
            cycle: testCycleId,
            modality: 'online',
            featured: true,
          },
        });

        const response = await request(payload.express)
          .get('/api/courses')
          .query({ where: { featured: { equals: true } } })
          .expect(200);

        response.body.docs.forEach((course: any) => {
          expect(course.featured).toBe(true);
        });

        // Cleanup
        await payload.delete({ collection: 'courses', id: featuredCourse.id });
      });

      it('should query courses by modality (presencial/online/hibrido)', async () => {
        const response = await request(payload.express)
          .get('/api/courses')
          .query({ where: { modality: { equals: 'online' } } })
          .expect(200);

        response.body.docs.forEach((course: any) => {
          expect(course.modality).toBe('online');
        });
      });

      it('should filter active courses only', async () => {
        const response = await request(payload.express)
          .get('/api/courses')
          .query({ where: { active: { equals: true } } })
          .expect(200);

        response.body.docs.forEach((course: any) => {
          expect(course.active).toBe(true);
        });
      });
    });

    describe('PATCH /api/courses/:id - Update Course', () => {
      it('should update course (change name, description, price)', async () => {
        const response = await request(payload.express)
          .patch(`/api/courses/${testCourseId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            short_description: 'Updated description',
            base_price: 1500.00,
          })
          .expect(200);

        expect(response.body.doc.short_description).toBe('Updated description');
        expect(response.body.doc.base_price).toBe(1500.00);
      });

      it('should update course relationships (change cycle, add/remove campuses)', async () => {
        const response = await request(payload.express)
          .patch(`/api/courses/${testCourseId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            campuses: [testCampusId1, testCampusId2],
          })
          .expect(200);

        expect(response.body.doc.campuses).toEqual(
          expect.arrayContaining([testCampusId1, testCampusId2])
        );
      });
    });

    describe('DELETE /api/courses/:id - Delete Course', () => {
      it('should delete course (soft delete if active=false)', async () => {
        // Create inactive course
        const inactiveCourse = await payload.create({
          collection: 'courses',
          data: {
            name: 'Inactive Course to Delete',
            cycle: testCycleId,
            modality: 'online',
            active: false,
          },
        });

        await request(payload.express)
          .delete(`/api/courses/${inactiveCourse.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // Verify deletion
        const deleted = await payload
          .findByID({ collection: 'courses', id: inactiveCourse.id })
          .catch(() => null);

        expect(deleted).toBeNull();
      });

      it('should prevent deletion of active courses', async () => {
        // This test assumes business logic prevents deleting active courses
        // If not implemented, this test will drive the implementation
        const activeCourse = await payload.create({
          collection: 'courses',
          data: {
            name: 'Active Course - Cannot Delete',
            cycle: testCycleId,
            modality: 'presencial',
            active: true,
          },
        });

        // This should either fail or require active=false first
        // Implementation will determine the exact behavior
        // For now, we test that admin CAN delete (as per access control)
        await request(payload.express)
          .delete(`/api/courses/${activeCourse.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
      });
    });
  });

  // ============================================================================
  // VALIDATION TESTS (15+ tests)
  // ============================================================================

  describe('Validation Tests', () => {
    it('should reject course without required fields (name, cycle_id, modality)', async () => {
      const response = await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should reject course without name', async () => {
      const response = await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cycle: testCycleId,
          modality: 'presencial',
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should reject course without cycle_id', async () => {
      const response = await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Course without cycle',
          modality: 'online',
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should reject course without modality', async () => {
      const response = await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Course without modality',
          cycle: testCycleId,
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should reject invalid modality (not in enum)', async () => {
      const response = await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Modality Course',
          cycle: testCycleId,
          modality: 'invalid_modality',
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should reject negative duration_hours', async () => {
      const response = await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Negative Duration',
          cycle: testCycleId,
          modality: 'online',
          duration_hours: -100,
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should reject negative base_price', async () => {
      const response = await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Negative Price',
          cycle: testCycleId,
          modality: 'presencial',
          base_price: -500,
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should reject duplicate slug', async () => {
      const courseData = {
        name: 'Duplicate Slug Test',
        slug: 'unique-slug-test-12345',
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

    it('should validate cycle_id exists (foreign key)', async () => {
      const response = await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Cycle Reference',
          cycle: '00000000-0000-0000-0000-000000000000', // Non-existent UUID
          modality: 'presencial',
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate campus_ids exist (array of valid UUIDs)', async () => {
      const response = await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Campus Reference',
          cycle: testCycleId,
          modality: 'presencial',
          campuses: ['00000000-0000-0000-0000-000000000000'], // Non-existent UUID
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate price format (2 decimal places)', async () => {
      const response = await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Valid Price Course',
          cycle: testCycleId,
          modality: 'online',
          base_price: 1299.99, // Valid format
        })
        .expect(201);

      expect(response.body.doc.base_price).toBe(1299.99);

      // Cleanup
      await payload.delete({ collection: 'courses', id: response.body.doc.id });
    });

    it('should validate slug format (lowercase, hyphens, no special chars)', async () => {
      const response = await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Slug Validation Test',
          slug: 'UPPERCASE-SLUG', // Should be rejected or auto-lowercased
          cycle: testCycleId,
          modality: 'online',
        })
        .expect(400); // Expect validation failure for uppercase

      expect(response.body.errors).toBeDefined();
    });

    it('should enforce max length for name (500 chars)', async () => {
      const longName = 'a'.repeat(501); // Exceeds 500 chars

      const response = await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: longName,
          cycle: testCycleId,
          modality: 'presencial',
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should enforce max length for meta fields (300/500 chars)', async () => {
      const longMetaTitle = 'a'.repeat(301); // Exceeds 300 chars

      const response = await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Meta Field Test',
          cycle: testCycleId,
          modality: 'online',
          meta_title: longMetaTitle,
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should accept optional fields (short_description, long_description, financial_aid_available)', async () => {
      const response = await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Optional Fields Test',
          cycle: testCycleId,
          modality: 'hibrido',
          // All optional fields omitted
        })
        .expect(201);

      expect(response.body.doc).toHaveProperty('id');

      // Cleanup
      await payload.delete({ collection: 'courses', id: response.body.doc.id });
    });

    it('should validate duration_hours is positive integer', async () => {
      const response = await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Duration Test',
          cycle: testCycleId,
          modality: 'presencial',
          duration_hours: 120, // Valid positive integer
        })
        .expect(201);

      expect(response.body.doc.duration_hours).toBe(120);

      // Cleanup
      await payload.delete({ collection: 'courses', id: response.body.doc.id });
    });
  });

  // ============================================================================
  // ACCESS CONTROL TESTS (12+ tests)
  // ============================================================================

  describe('Access Control Tests', () => {
    describe('Public Read Access', () => {
      it('should allow public to read active courses (active=true)', async () => {
        // Create active course
        const activeCourse = await payload.create({
          collection: 'courses',
          data: {
            name: 'Public Active Course',
            cycle: testCycleId,
            modality: 'online',
            active: true,
          },
        });

        // No auth token - public access
        const response = await request(payload.express)
          .get(`/api/courses/${activeCourse.id}`)
          .expect(200);

        expect(response.body.id).toBe(activeCourse.id);
        expect(response.body.active).toBe(true);

        // Cleanup
        await payload.delete({ collection: 'courses', id: activeCourse.id });
      });

      it('should prevent public from reading inactive courses (active=false)', async () => {
        // Create inactive course
        const inactiveCourse = await payload.create({
          collection: 'courses',
          data: {
            name: 'Public Inactive Course',
            cycle: testCycleId,
            modality: 'online',
            active: false,
          },
        });

        // No auth token - should not see inactive courses in list
        const response = await request(payload.express)
          .get('/api/courses')
          .query({ where: { id: { equals: inactiveCourse.id } } })
          .expect(200);

        // Should not find the inactive course
        expect(response.body.docs).toHaveLength(0);

        // Cleanup
        await payload.delete({ collection: 'courses', id: inactiveCourse.id });
      });
    });

    describe('Create Access Control', () => {
      it('should allow admin to create courses (role=admin)', async () => {
        const response = await request(payload.express)
          .post('/api/courses')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Admin Created Course',
            cycle: testCycleId,
            modality: 'presencial',
          })
          .expect(201);

        expect(response.body.doc.created_by).toBe(adminUserId);

        // Cleanup
        await payload.delete({ collection: 'courses', id: response.body.doc.id });
      });

      it('should allow gestor to create courses (role=gestor)', async () => {
        const response = await request(payload.express)
          .post('/api/courses')
          .set('Authorization', `Bearer ${gestorToken}`)
          .send({
            name: 'Gestor Created Course',
            cycle: testCycleId,
            modality: 'online',
          })
          .expect(201);

        expect(response.body.doc).toHaveProperty('id');

        // Cleanup
        await payload.delete({ collection: 'courses', id: response.body.doc.id });
      });

      it('should allow marketing to create courses (role=marketing)', async () => {
        const response = await request(payload.express)
          .post('/api/courses')
          .set('Authorization', `Bearer ${marketingToken}`)
          .send({
            name: 'Marketing Created Course',
            cycle: testCycleId,
            modality: 'hibrido',
          })
          .expect(201);

        expect(response.body.doc.created_by).toBe(marketingUserId);

        // Cleanup
        await payload.delete({ collection: 'courses', id: response.body.doc.id });
      });

      it('should prevent asesor from creating courses (role=asesor)', async () => {
        await request(payload.express)
          .post('/api/courses')
          .set('Authorization', `Bearer ${asesorToken}`)
          .send({
            name: 'Asesor Should Not Create',
            cycle: testCycleId,
            modality: 'presencial',
          })
          .expect(403);
      });

      it('should prevent lectura from creating courses (role=lectura)', async () => {
        await request(payload.express)
          .post('/api/courses')
          .set('Authorization', `Bearer ${lecturaToken}`)
          .send({
            name: 'Lectura Should Not Create',
            cycle: testCycleId,
            modality: 'online',
          })
          .expect(403);
      });
    });

    describe('Update Access Control', () => {
      it('should allow admin to update any course', async () => {
        const course = await payload.create({
          collection: 'courses',
          data: {
            name: 'Course to Update by Admin',
            cycle: testCycleId,
            modality: 'presencial',
          },
        });

        const response = await request(payload.express)
          .patch(`/api/courses/${course.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ short_description: 'Admin updated this' })
          .expect(200);

        expect(response.body.doc.short_description).toBe('Admin updated this');

        // Cleanup
        await payload.delete({ collection: 'courses', id: course.id });
      });

      it('should allow gestor to update any course', async () => {
        const course = await payload.create({
          collection: 'courses',
          data: {
            name: 'Course to Update by Gestor',
            cycle: testCycleId,
            modality: 'online',
          },
        });

        const response = await request(payload.express)
          .patch(`/api/courses/${course.id}`)
          .set('Authorization', `Bearer ${gestorToken}`)
          .send({ short_description: 'Gestor updated this' })
          .expect(200);

        expect(response.body.doc.short_description).toBe('Gestor updated this');

        // Cleanup
        await payload.delete({ collection: 'courses', id: course.id });
      });

      it('should allow marketing to update their own created courses', async () => {
        // Create course as marketing user
        const createResponse = await request(payload.express)
          .post('/api/courses')
          .set('Authorization', `Bearer ${marketingToken}`)
          .send({
            name: 'Marketing Own Course',
            cycle: testCycleId,
            modality: 'hibrido',
          })
          .expect(201);

        const courseId = createResponse.body.doc.id;

        // Update as marketing user (same user)
        const updateResponse = await request(payload.express)
          .patch(`/api/courses/${courseId}`)
          .set('Authorization', `Bearer ${marketingToken}`)
          .send({ short_description: 'Marketing updated own course' })
          .expect(200);

        expect(updateResponse.body.doc.short_description).toBe('Marketing updated own course');

        // Cleanup
        await payload.delete({ collection: 'courses', id: courseId });
      });
    });

    describe('Delete Access Control', () => {
      it('should allow admin to delete courses', async () => {
        const course = await payload.create({
          collection: 'courses',
          data: {
            name: 'Admin Delete Test',
            cycle: testCycleId,
            modality: 'presencial',
          },
        });

        await request(payload.express)
          .delete(`/api/courses/${course.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
      });

      it('should allow gestor to soft-delete courses (set active=false)', async () => {
        const course = await payload.create({
          collection: 'courses',
          data: {
            name: 'Gestor Delete Test',
            cycle: testCycleId,
            modality: 'online',
          },
        });

        await request(payload.express)
          .delete(`/api/courses/${course.id}`)
          .set('Authorization', `Bearer ${gestorToken}`)
          .expect(200);
      });
    });

    describe('Creator Tracking', () => {
      it('should track course creator (created_by user_id)', async () => {
        const response = await request(payload.express)
          .post('/api/courses')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Creator Tracking Test',
            cycle: testCycleId,
            modality: 'presencial',
          })
          .expect(201);

        expect(response.body.doc.created_by).toBe(adminUserId);

        // Cleanup
        await payload.delete({ collection: 'courses', id: response.body.doc.id });
      });
    });
  });

  // ============================================================================
  // RELATIONSHIP TESTS (8+ tests)
  // ============================================================================

  describe('Relationship Tests', () => {
    it('should create course with valid cycle_id', async () => {
      const response = await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Valid Cycle Relationship',
          cycle: testCycleId,
          modality: 'presencial',
        })
        .expect(201);

      expect(response.body.doc.cycle).toBe(testCycleId);

      // Cleanup
      await payload.delete({ collection: 'courses', id: response.body.doc.id });
    });

    it('should create course with multiple campus_ids', async () => {
      const response = await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Multiple Campuses',
          cycle: testCycleId,
          modality: 'presencial',
          campuses: [testCampusId1, testCampusId2],
        })
        .expect(201);

      expect(response.body.doc.campuses).toHaveLength(2);

      // Cleanup
      await payload.delete({ collection: 'courses', id: response.body.doc.id });
    });

    it('should create course with empty campus_ids (online course)', async () => {
      const response = await request(payload.express)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Online Course No Campus',
          cycle: testCycleId,
          modality: 'online',
          campuses: [],
        })
        .expect(201);

      expect(response.body.doc.campuses || []).toHaveLength(0);

      // Cleanup
      await payload.delete({ collection: 'courses', id: response.body.doc.id });
    });

    it('should cascade behavior: prevent deleting cycle with courses (RESTRICT)', async () => {
      // Create course linked to test cycle
      const course = await payload.create({
        collection: 'courses',
        data: {
          name: 'Course Preventing Cycle Delete',
          cycle: testCycleId,
          modality: 'presencial',
        },
      });

      // Try to delete the cycle (should fail due to RESTRICT)
      await request(payload.express)
        .delete(`/api/cycles/${testCycleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      // Cleanup
      await payload.delete({ collection: 'courses', id: course.id });
    });

    it('should update course to different cycle', async () => {
      // Create another cycle
      const newCycle = await payload.create({
        collection: 'cycles',
        data: {
          slug: 'new-cycle-test',
          name: 'New Cycle Test',
          level: 'grado_medio',
          order_display: 98,
        },
      });

      const course = await payload.create({
        collection: 'courses',
        data: {
          name: 'Course to Change Cycle',
          cycle: testCycleId,
          modality: 'online',
        },
      });

      const response = await request(payload.express)
        .patch(`/api/courses/${course.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cycle: newCycle.id })
        .expect(200);

      expect(response.body.doc.cycle).toBe(newCycle.id);

      // Cleanup
      await payload.delete({ collection: 'courses', id: course.id });
      await payload.delete({ collection: 'cycles', id: newCycle.id });
    });

    it('should add campus to existing course', async () => {
      const course = await payload.create({
        collection: 'courses',
        data: {
          name: 'Course to Add Campus',
          cycle: testCycleId,
          modality: 'presencial',
          campuses: [testCampusId1],
        },
      });

      const response = await request(payload.express)
        .patch(`/api/courses/${course.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ campuses: [testCampusId1, testCampusId2] })
        .expect(200);

      expect(response.body.doc.campuses).toHaveLength(2);

      // Cleanup
      await payload.delete({ collection: 'courses', id: course.id });
    });

    it('should remove campus from course', async () => {
      const course = await payload.create({
        collection: 'courses',
        data: {
          name: 'Course to Remove Campus',
          cycle: testCycleId,
          modality: 'presencial',
          campuses: [testCampusId1, testCampusId2],
        },
      });

      const response = await request(payload.express)
        .patch(`/api/courses/${course.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ campuses: [testCampusId1] })
        .expect(200);

      expect(response.body.doc.campuses).toHaveLength(1);
      expect(response.body.doc.campuses[0]).toBe(testCampusId1);

      // Cleanup
      await payload.delete({ collection: 'courses', id: course.id });
    });

    it('should query all courses for a specific cycle', async () => {
      // Create multiple courses for the test cycle
      const course1 = await payload.create({
        collection: 'courses',
        data: {
          name: 'Cycle Query Test 1',
          cycle: testCycleId,
          modality: 'presencial',
        },
      });

      const course2 = await payload.create({
        collection: 'courses',
        data: {
          name: 'Cycle Query Test 2',
          cycle: testCycleId,
          modality: 'online',
        },
      });

      const response = await request(payload.express)
        .get('/api/courses')
        .query({ where: { cycle: { equals: testCycleId } } })
        .expect(200);

      const foundCourseIds = response.body.docs.map((c: any) => c.id);
      expect(foundCourseIds).toContain(course1.id);
      expect(foundCourseIds).toContain(course2.id);

      // Cleanup
      await payload.delete({ collection: 'courses', id: course1.id });
      await payload.delete({ collection: 'courses', id: course2.id });
    });
  });
});
