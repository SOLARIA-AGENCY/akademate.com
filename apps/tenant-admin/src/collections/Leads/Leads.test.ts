import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { getPayload } from 'payload';
import type { Payload } from 'payload';

/**
 * Leads Collection - Comprehensive Test Suite (TDD RED Phase)
 *
 * This test suite covers:
 * - CRUD Operations (20+ tests)
 * - Validation (20+ tests)
 * - Access Control (15+ tests)
 * - GDPR Compliance (10+ tests)
 *
 * Total: 65+ test cases
 *
 * CRITICAL GDPR REQUIREMENTS:
 * - gdpr_consent MUST be true (database CHECK constraint)
 * - privacy_policy_accepted MUST be true (database CHECK constraint)
 * - consent_timestamp and consent_ip_address auto-captured
 * - PII fields protected by role-based access control
 * - Public can CREATE leads only (not read)
 * - Asesor can READ leads assigned to them only
 *
 * Following TDD methodology:
 * 1. RED: Tests written first (this file) ✅
 * 2. GREEN: Implementation to make tests pass
 * 3. REFACTOR: Clean up and optimize
 */

describe('Leads Collection - Comprehensive Test Suite', () => {
  let payload: Payload;
  let adminToken: string;
  let gestorToken: string;
  let marketingToken: string;
  let asesorToken: string;
  let lecturaToken: string;

  let adminUserId: string;
  let marketingUserId: string;
  let asesorUserId: string;

  let testCycleId: string;
  let testCampusId: string;
  let testCourseId: string;
  let testLeadId: string;
  let testLeadIds: string[] = [];

  beforeAll(async () => {
    // Initialize Payload
    payload = await getPayload({ config: await import('../../payload.config') });

    // Login as admin
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
    asesorUserId = asesorLogin.body.user.id;

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
        slug: 'test-cycle-leads',
        name: 'Test Cycle for Leads',
        level: 'grado_superior',
        order_display: 999,
      },
    });
    testCycleId = cycle.id;

    // Create test campus
    const campus = await payload.create({
      collection: 'campuses',
      data: {
        slug: 'test-campus-leads',
        name: 'Test Campus for Leads',
        city: 'Madrid',
      },
    });
    testCampusId = campus.id;

    // Create test course
    const course = await payload.create({
      collection: 'courses',
      data: {
        name: 'Test Course for Leads',
        cycle: testCycleId,
        modality: 'presencial',
      },
    });
    testCourseId = course.id;
  });

  afterAll(async () => {
    // Cleanup test leads
    for (const leadId of testLeadIds) {
      try {
        await payload.delete({ collection: 'leads', id: leadId });
      } catch (error) {
        // Lead might already be deleted
      }
    }

    // Cleanup test data
    if (testCourseId) {
      await payload.delete({ collection: 'courses', id: testCourseId }).catch(() => {});
    }
    if (testCampusId) {
      await payload.delete({ collection: 'campuses', id: testCampusId }).catch(() => {});
    }
    if (testCycleId) {
      await payload.delete({ collection: 'cycles', id: testCycleId }).catch(() => {});
    }
  });

  // ============================================================================
  // CRUD OPERATIONS TESTS (20+ tests)
  // ============================================================================

  describe('CRUD Operations', () => {
    describe('POST /api/leads - Create Lead', () => {
      it('should create lead with all required fields and GDPR consent', async () => {
        const leadData = {
          first_name: 'Juan',
          last_name: 'Pérez',
          email: 'juan.perez@example.com',
          phone: '+34 612 345 678',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        };

        const response = await request(payload.express)
          .post('/api/leads')
          .send(leadData)
          .expect(201);

        expect(response.body.doc).toHaveProperty('id');
        expect(response.body.doc.first_name).toBe('Juan');
        expect(response.body.doc.last_name).toBe('Pérez');
        expect(response.body.doc.email).toBe('juan.perez@example.com');
        expect(response.body.doc.phone).toBe('+34 612 345 678');
        expect(response.body.doc.gdpr_consent).toBe(true);
        expect(response.body.doc.privacy_policy_accepted).toBe(true);
        expect(response.body.doc.status).toBe('new'); // Default
        expect(response.body.doc.priority).toBe('medium'); // Default
        expect(response.body.doc.lead_score).toBeGreaterThanOrEqual(0);

        testLeadId = response.body.doc.id;
        testLeadIds.push(response.body.doc.id);
      });

      it('should auto-capture consent timestamp when lead is created', async () => {
        const leadData = {
          first_name: 'María',
          last_name: 'García',
          email: 'maria.garcia@example.com',
          phone: '+34 623 456 789',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        };

        const response = await request(payload.express)
          .post('/api/leads')
          .send(leadData)
          .expect(201);

        expect(response.body.doc.consent_timestamp).toBeDefined();
        expect(new Date(response.body.doc.consent_timestamp)).toBeInstanceOf(Date);

        testLeadIds.push(response.body.doc.id);
      });

      it('should auto-capture IP address from request', async () => {
        const leadData = {
          first_name: 'Pedro',
          last_name: 'López',
          email: 'pedro.lopez@example.com',
          phone: '+34 634 567 890',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        };

        const response = await request(payload.express)
          .post('/api/leads')
          .send(leadData)
          .expect(201);

        // IP address should be captured (might be ::1 or 127.0.0.1 in tests)
        expect(response.body.doc.consent_ip_address).toBeDefined();

        testLeadIds.push(response.body.doc.id);
      });

      it('should create lead with course relationship', async () => {
        const leadData = {
          first_name: 'Ana',
          last_name: 'Martínez',
          email: 'ana.martinez@example.com',
          phone: '+34 645 678 901',
          course: testCourseId,
          gdpr_consent: true,
          privacy_policy_accepted: true,
        };

        const response = await request(payload.express)
          .post('/api/leads')
          .send(leadData)
          .expect(201);

        expect(response.body.doc.course).toBe(testCourseId);

        testLeadIds.push(response.body.doc.id);
      });

      it('should create lead with campus relationship', async () => {
        const leadData = {
          first_name: 'Carlos',
          last_name: 'Sánchez',
          email: 'carlos.sanchez@example.com',
          phone: '+34 656 789 012',
          campus: testCampusId,
          gdpr_consent: true,
          privacy_policy_accepted: true,
        };

        const response = await request(payload.express)
          .post('/api/leads')
          .send(leadData)
          .expect(201);

        expect(response.body.doc.campus).toBe(testCampusId);

        testLeadIds.push(response.body.doc.id);
      });

      it('should create lead with optional message', async () => {
        const leadData = {
          first_name: 'Laura',
          last_name: 'Fernández',
          email: 'laura.fernandez@example.com',
          phone: '+34 667 890 123',
          message: 'Estoy interesado en el curso de marketing digital',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        };

        const response = await request(payload.express)
          .post('/api/leads')
          .send(leadData)
          .expect(201);

        expect(response.body.doc.message).toBe('Estoy interesado en el curso de marketing digital');

        testLeadIds.push(response.body.doc.id);
      });

      it('should create lead with preferred contact method', async () => {
        const leadData = {
          first_name: 'Miguel',
          last_name: 'Ruiz',
          email: 'miguel.ruiz@example.com',
          phone: '+34 678 901 234',
          preferred_contact_method: 'whatsapp',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        };

        const response = await request(payload.express)
          .post('/api/leads')
          .send(leadData)
          .expect(201);

        expect(response.body.doc.preferred_contact_method).toBe('whatsapp');

        testLeadIds.push(response.body.doc.id);
      });

      it('should create lead with marketing consent (optional)', async () => {
        const leadData = {
          first_name: 'Elena',
          last_name: 'Torres',
          email: 'elena.torres@example.com',
          phone: '+34 689 012 345',
          marketing_consent: true,
          gdpr_consent: true,
          privacy_policy_accepted: true,
        };

        const response = await request(payload.express)
          .post('/api/leads')
          .send(leadData)
          .expect(201);

        expect(response.body.doc.marketing_consent).toBe(true);

        testLeadIds.push(response.body.doc.id);
      });

      it('should create lead with UTM tracking parameters', async () => {
        const leadData = {
          first_name: 'David',
          last_name: 'Morales',
          email: 'david.morales@example.com',
          phone: '+34 690 123 456',
          utm: {
            source: 'google',
            medium: 'cpc',
            campaign: 'summer-2025',
            term: 'marketing-digital',
            content: 'ad-variant-a',
          },
          gdpr_consent: true,
          privacy_policy_accepted: true,
        };

        const response = await request(payload.express)
          .post('/api/leads')
          .send(leadData)
          .expect(201);

        expect(response.body.doc.utm.source).toBe('google');
        expect(response.body.doc.utm.medium).toBe('cpc');
        expect(response.body.doc.utm.campaign).toBe('summer-2025');

        testLeadIds.push(response.body.doc.id);
      });

      it('should calculate lead score automatically', async () => {
        const leadData = {
          first_name: 'Isabel',
          last_name: 'Jiménez',
          email: 'isabel.jimenez@example.com',
          phone: '+34 601 234 567',
          course: testCourseId,
          message: 'Me gustaría recibir más información sobre este curso',
          preferred_contact_method: 'email',
          preferred_contact_time: 'morning',
          marketing_consent: true,
          gdpr_consent: true,
          privacy_policy_accepted: true,
        };

        const response = await request(payload.express)
          .post('/api/leads')
          .send(leadData)
          .expect(201);

        // Lead score should be calculated based on completeness
        expect(response.body.doc.lead_score).toBeGreaterThan(0);
        expect(response.body.doc.lead_score).toBeLessThanOrEqual(100);

        testLeadIds.push(response.body.doc.id);
      });
    });

    describe('GET /api/leads - Read Leads', () => {
      it('should read single lead by ID (authenticated user)', async () => {
        const response = await request(payload.express)
          .get(`/api/leads/${testLeadId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.id).toBe(testLeadId);
        expect(response.body).toHaveProperty('first_name');
        expect(response.body).toHaveProperty('email');
      });

      it('should read lead list with pagination', async () => {
        const response = await request(payload.express)
          .get('/api/leads')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ limit: 10, page: 1 })
          .expect(200);

        expect(response.body.docs).toBeInstanceOf(Array);
        expect(response.body).toHaveProperty('totalDocs');
        expect(response.body).toHaveProperty('limit');
        expect(response.body).toHaveProperty('page');
      });

      it('should query leads by status', async () => {
        const response = await request(payload.express)
          .get('/api/leads')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ where: { status: { equals: 'new' } } })
          .expect(200);

        response.body.docs.forEach((lead: any) => {
          expect(lead.status).toBe('new');
        });
      });

      it('should query leads by course', async () => {
        const response = await request(payload.express)
          .get('/api/leads')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ where: { course: { equals: testCourseId } } })
          .expect(200);

        response.body.docs.forEach((lead: any) => {
          if (lead.course) {
            expect(lead.course).toBe(testCourseId);
          }
        });
      });

      it('should query leads by campus', async () => {
        const response = await request(payload.express)
          .get('/api/leads')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ where: { campus: { equals: testCampusId } } })
          .expect(200);

        response.body.docs.forEach((lead: any) => {
          if (lead.campus) {
            expect(lead.campus).toBe(testCampusId);
          }
        });
      });

      it('should query leads by assigned user', async () => {
        // First assign a lead to marketing user
        await payload.update({
          collection: 'leads',
          id: testLeadId,
          data: {
            assigned_to: marketingUserId,
          },
        });

        const response = await request(payload.express)
          .get('/api/leads')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ where: { assigned_to: { equals: marketingUserId } } })
          .expect(200);

        response.body.docs.forEach((lead: any) => {
          if (lead.assigned_to) {
            expect(lead.assigned_to).toBe(marketingUserId);
          }
        });
      });

      it('should filter leads by date range', async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const response = await request(payload.express)
          .get('/api/leads')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ where: { createdAt: { greater_than: yesterday.toISOString() } } })
          .expect(200);

        expect(response.body.docs).toBeInstanceOf(Array);
      });

      it('should search leads by email', async () => {
        const response = await request(payload.express)
          .get('/api/leads')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ where: { email: { like: 'juan.perez' } } })
          .expect(200);

        expect(response.body.docs).toBeInstanceOf(Array);
      });
    });

    describe('PATCH /api/leads/:id - Update Lead', () => {
      it('should update lead status (new → contacted)', async () => {
        const response = await request(payload.express)
          .patch(`/api/leads/${testLeadId}`)
          .set('Authorization', `Bearer ${marketingToken}`)
          .send({ status: 'contacted' })
          .expect(200);

        expect(response.body.doc.status).toBe('contacted');
      });

      it('should update lead priority', async () => {
        const response = await request(payload.express)
          .patch(`/api/leads/${testLeadId}`)
          .set('Authorization', `Bearer ${marketingToken}`)
          .send({ priority: 'high' })
          .expect(200);

        expect(response.body.doc.priority).toBe('high');
      });

      it('should assign lead to user', async () => {
        const response = await request(payload.express)
          .patch(`/api/leads/${testLeadId}`)
          .set('Authorization', `Bearer ${marketingToken}`)
          .send({ assigned_to: asesorUserId })
          .expect(200);

        expect(response.body.doc.assigned_to).toBe(asesorUserId);
      });

      it('should add notes to lead', async () => {
        const response = await request(payload.express)
          .patch(`/api/leads/${testLeadId}`)
          .set('Authorization', `Bearer ${marketingToken}`)
          .send({ notes: 'Llamar mañana a las 10am' })
          .expect(200);

        expect(response.body.doc.notes).toContain('Llamar mañana');
      });
    });

    describe('DELETE /api/leads/:id - Delete Lead', () => {
      it('should delete lead (GDPR right to be forgotten - Admin only)', async () => {
        // Create a test lead
        const testLead = await payload.create({
          collection: 'leads',
          data: {
            first_name: 'ToDelete',
            last_name: 'User',
            email: 'delete@example.com',
            phone: '+34 699 999 999',
            gdpr_consent: true,
            privacy_policy_accepted: true,
          },
        });

        await request(payload.express)
          .delete(`/api/leads/${testLead.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // Verify deletion
        const deleted = await payload
          .findByID({ collection: 'leads', id: testLead.id })
          .catch(() => null);

        expect(deleted).toBeNull();
      });
    });
  });

  // ============================================================================
  // VALIDATION TESTS (20+ tests)
  // ============================================================================

  describe('Validation Tests', () => {
    it('should reject lead without required fields', async () => {
      const response = await request(payload.express)
        .post('/api/leads')
        .send({})
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should reject lead without first_name', async () => {
      const response = await request(payload.express)
        .post('/api/leads')
        .send({
          last_name: 'Test',
          email: 'test@example.com',
          phone: '+34 612 345 678',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should reject lead without last_name', async () => {
      const response = await request(payload.express)
        .post('/api/leads')
        .send({
          first_name: 'Test',
          email: 'test@example.com',
          phone: '+34 612 345 678',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should reject lead without email', async () => {
      const response = await request(payload.express)
        .post('/api/leads')
        .send({
          first_name: 'Test',
          last_name: 'User',
          phone: '+34 612 345 678',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should reject lead without phone', async () => {
      const response = await request(payload.express)
        .post('/api/leads')
        .send({
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate email format (RFC 5322)', async () => {
      const response = await request(payload.express)
        .post('/api/leads')
        .send({
          first_name: 'Test',
          last_name: 'User',
          email: 'invalid-email',
          phone: '+34 612 345 678',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate Spanish phone format (+34 XXX XXX XXX)', async () => {
      const response = await request(payload.express)
        .post('/api/leads')
        .send({
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com',
          phone: '612345678', // Missing +34 prefix
          gdpr_consent: true,
          privacy_policy_accepted: true,
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should reject invalid Spanish phone format', async () => {
      const response = await request(payload.express)
        .post('/api/leads')
        .send({
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com',
          phone: '+1 555 123 4567', // US format, not Spanish
          gdpr_consent: true,
          privacy_policy_accepted: true,
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate status enum values', async () => {
      const lead = await payload.create({
        collection: 'leads',
        data: {
          first_name: 'Test',
          last_name: 'Status',
          email: 'status@example.com',
          phone: '+34 612 345 678',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        },
      });

      const response = await request(payload.express)
        .patch(`/api/leads/${lead.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.errors).toBeDefined();

      // Cleanup
      await payload.delete({ collection: 'leads', id: lead.id });
    });

    it('should validate preferred_contact_method enum', async () => {
      const response = await request(payload.express)
        .post('/api/leads')
        .send({
          first_name: 'Test',
          last_name: 'Contact',
          email: 'contact@example.com',
          phone: '+34 612 345 678',
          preferred_contact_method: 'invalid_method',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate preferred_contact_time enum', async () => {
      const response = await request(payload.express)
        .post('/api/leads')
        .send({
          first_name: 'Test',
          last_name: 'Time',
          email: 'time@example.com',
          phone: '+34 612 345 678',
          preferred_contact_time: 'invalid_time',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate priority enum values', async () => {
      const lead = await payload.create({
        collection: 'leads',
        data: {
          first_name: 'Test',
          last_name: 'Priority',
          email: 'priority@example.com',
          phone: '+34 612 345 678',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        },
      });

      const response = await request(payload.express)
        .patch(`/api/leads/${lead.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ priority: 'invalid_priority' })
        .expect(400);

      expect(response.body.errors).toBeDefined();

      // Cleanup
      await payload.delete({ collection: 'leads', id: lead.id });
    });

    it('should validate lead_score range (0-100)', async () => {
      const lead = await payload.create({
        collection: 'leads',
        data: {
          first_name: 'Test',
          last_name: 'Score',
          email: 'score@example.com',
          phone: '+34 612 345 678',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        },
      });

      const response = await request(payload.express)
        .patch(`/api/leads/${lead.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ lead_score: 150 }) // Over 100
        .expect(400);

      expect(response.body.errors).toBeDefined();

      // Cleanup
      await payload.delete({ collection: 'leads', id: lead.id });
    });

    it('should accept optional fields (message, notes, utm_*)', async () => {
      const response = await request(payload.express)
        .post('/api/leads')
        .send({
          first_name: 'Test',
          last_name: 'Optional',
          email: 'optional@example.com',
          phone: '+34 612 345 678',
          gdpr_consent: true,
          privacy_policy_accepted: true,
          // All optional fields omitted
        })
        .expect(201);

      expect(response.body.doc).toHaveProperty('id');

      testLeadIds.push(response.body.doc.id);
    });

    it('should validate course_id exists (foreign key)', async () => {
      const response = await request(payload.express)
        .post('/api/leads')
        .send({
          first_name: 'Test',
          last_name: 'Course',
          email: 'course@example.com',
          phone: '+34 612 345 678',
          course: '00000000-0000-0000-0000-000000000000', // Non-existent UUID
          gdpr_consent: true,
          privacy_policy_accepted: true,
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate campus_id exists (foreign key)', async () => {
      const response = await request(payload.express)
        .post('/api/leads')
        .send({
          first_name: 'Test',
          last_name: 'Campus',
          email: 'campus@example.com',
          phone: '+34 612 345 678',
          campus: '00000000-0000-0000-0000-000000000000', // Non-existent UUID
          gdpr_consent: true,
          privacy_policy_accepted: true,
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate assigned_to exists (foreign key)', async () => {
      const lead = await payload.create({
        collection: 'leads',
        data: {
          first_name: 'Test',
          last_name: 'Assign',
          email: 'assign@example.com',
          phone: '+34 612 345 678',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        },
      });

      const response = await request(payload.express)
        .patch(`/api/leads/${lead.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assigned_to: '00000000-0000-0000-0000-000000000000' }) // Non-existent UUID
        .expect(400);

      expect(response.body.errors).toBeDefined();

      // Cleanup
      await payload.delete({ collection: 'leads', id: lead.id });
    });

    it('should prevent duplicate leads (same email + course within 24 hours)', async () => {
      const leadData = {
        first_name: 'Duplicate',
        last_name: 'Test',
        email: 'duplicate@example.com',
        phone: '+34 612 345 678',
        course: testCourseId,
        gdpr_consent: true,
        privacy_policy_accepted: true,
      };

      // First submission should succeed
      const first = await request(payload.express)
        .post('/api/leads')
        .send(leadData)
        .expect(201);

      testLeadIds.push(first.body.doc.id);

      // Second submission within 24 hours should fail
      const response = await request(payload.express)
        .post('/api/leads')
        .send(leadData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('24 hours');
    });

    it('should enforce max lengths on text fields', async () => {
      const longName = 'a'.repeat(101); // Exceeds 100 chars

      const response = await request(payload.express)
        .post('/api/leads')
        .send({
          first_name: longName,
          last_name: 'Test',
          email: 'maxlength@example.com',
          phone: '+34 612 345 678',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate consent_ip_address format', async () => {
      const lead = await payload.create({
        collection: 'leads',
        data: {
          first_name: 'Test',
          last_name: 'IP',
          email: 'ip@example.com',
          phone: '+34 612 345 678',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        },
      });

      // Try to manually set invalid IP (should be auto-captured)
      const response = await request(payload.express)
        .patch(`/api/leads/${lead.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ consent_ip_address: 'invalid-ip' })
        .expect(400);

      expect(response.body.errors).toBeDefined();

      // Cleanup
      await payload.delete({ collection: 'leads', id: lead.id });
    });
  });

  // ============================================================================
  // ACCESS CONTROL TESTS (15+ tests)
  // ============================================================================

  describe('Access Control Tests', () => {
    describe('Public Access (Form Submission)', () => {
      it('should allow public (unauthenticated) to create leads', async () => {
        const leadData = {
          first_name: 'Public',
          last_name: 'User',
          email: 'public@example.com',
          phone: '+34 612 345 678',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        };

        // No auth token - public access
        const response = await request(payload.express)
          .post('/api/leads')
          .send(leadData)
          .expect(201);

        expect(response.body.doc).toHaveProperty('id');

        testLeadIds.push(response.body.doc.id);
      });

      it('should prevent public from reading any leads', async () => {
        // No auth token - should be denied
        await request(payload.express)
          .get('/api/leads')
          .expect(401);
      });

      it('should prevent public from reading single lead', async () => {
        await request(payload.express)
          .get(`/api/leads/${testLeadId}`)
          .expect(401);
      });
    });

    describe('Lectura Role Access', () => {
      it('should prevent lectura from accessing leads', async () => {
        await request(payload.express)
          .get('/api/leads')
          .set('Authorization', `Bearer ${lecturaToken}`)
          .expect(403);
      });

      it('should prevent lectura from creating leads', async () => {
        await request(payload.express)
          .post('/api/leads')
          .set('Authorization', `Bearer ${lecturaToken}`)
          .send({
            first_name: 'Test',
            last_name: 'Lectura',
            email: 'lectura@example.com',
            phone: '+34 612 345 678',
            gdpr_consent: true,
            privacy_policy_accepted: true,
          })
          .expect(403);
      });
    });

    describe('Asesor Role Access', () => {
      it('should allow asesor to read leads assigned to them', async () => {
        // Create lead assigned to asesor
        const lead = await payload.create({
          collection: 'leads',
          data: {
            first_name: 'Asesor',
            last_name: 'Assigned',
            email: 'asesor.assigned@example.com',
            phone: '+34 612 345 678',
            assigned_to: asesorUserId,
            gdpr_consent: true,
            privacy_policy_accepted: true,
          },
        });

        const response = await request(payload.express)
          .get(`/api/leads/${lead.id}`)
          .set('Authorization', `Bearer ${asesorToken}`)
          .expect(200);

        expect(response.body.id).toBe(lead.id);

        testLeadIds.push(lead.id);
      });

      it('should prevent asesor from reading unassigned leads', async () => {
        // Create unassigned lead
        const unassignedLead = await payload.create({
          collection: 'leads',
          data: {
            first_name: 'Unassigned',
            last_name: 'Lead',
            email: 'unassigned@example.com',
            phone: '+34 612 345 678',
            gdpr_consent: true,
            privacy_policy_accepted: true,
          },
        });

        await request(payload.express)
          .get(`/api/leads/${unassignedLead.id}`)
          .set('Authorization', `Bearer ${asesorToken}`)
          .expect(403);

        testLeadIds.push(unassignedLead.id);
      });

      it('should prevent asesor from reading leads assigned to others', async () => {
        // Create lead assigned to marketing
        const otherLead = await payload.create({
          collection: 'leads',
          data: {
            first_name: 'Other',
            last_name: 'Assigned',
            email: 'other.assigned@example.com',
            phone: '+34 612 345 678',
            assigned_to: marketingUserId,
            gdpr_consent: true,
            privacy_policy_accepted: true,
          },
        });

        await request(payload.express)
          .get(`/api/leads/${otherLead.id}`)
          .set('Authorization', `Bearer ${asesorToken}`)
          .expect(403);

        testLeadIds.push(otherLead.id);
      });
    });

    describe('Marketing Role Access', () => {
      it('should allow marketing to read all leads', async () => {
        const response = await request(payload.express)
          .get('/api/leads')
          .set('Authorization', `Bearer ${marketingToken}`)
          .expect(200);

        expect(response.body.docs).toBeInstanceOf(Array);
      });

      it('should allow marketing to update leads', async () => {
        const response = await request(payload.express)
          .patch(`/api/leads/${testLeadId}`)
          .set('Authorization', `Bearer ${marketingToken}`)
          .send({ status: 'qualified' })
          .expect(200);

        expect(response.body.doc.status).toBe('qualified');
      });

      it('should allow marketing to assign leads', async () => {
        const response = await request(payload.express)
          .patch(`/api/leads/${testLeadId}`)
          .set('Authorization', `Bearer ${marketingToken}`)
          .send({ assigned_to: asesorUserId })
          .expect(200);

        expect(response.body.doc.assigned_to).toBe(asesorUserId);
      });

      it('should prevent marketing from deleting leads', async () => {
        await request(payload.express)
          .delete(`/api/leads/${testLeadId}`)
          .set('Authorization', `Bearer ${marketingToken}`)
          .expect(403);
      });
    });

    describe('Gestor Role Access', () => {
      it('should allow gestor to read all leads', async () => {
        const response = await request(payload.express)
          .get('/api/leads')
          .set('Authorization', `Bearer ${gestorToken}`)
          .expect(200);

        expect(response.body.docs).toBeInstanceOf(Array);
      });

      it('should allow gestor to update all leads', async () => {
        const response = await request(payload.express)
          .patch(`/api/leads/${testLeadId}`)
          .set('Authorization', `Bearer ${gestorToken}`)
          .send({ priority: 'urgent' })
          .expect(200);

        expect(response.body.doc.priority).toBe('urgent');
      });

      it('should allow gestor to delete leads', async () => {
        // Create test lead
        const testLead = await payload.create({
          collection: 'leads',
          data: {
            first_name: 'Gestor',
            last_name: 'Delete',
            email: 'gestor.delete@example.com',
            phone: '+34 612 345 678',
            gdpr_consent: true,
            privacy_policy_accepted: true,
          },
        });

        await request(payload.express)
          .delete(`/api/leads/${testLead.id}`)
          .set('Authorization', `Bearer ${gestorToken}`)
          .expect(200);
      });
    });

    describe('Admin Role Access', () => {
      it('should allow admin to do everything', async () => {
        // Read
        const readResponse = await request(payload.express)
          .get('/api/leads')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(readResponse.body.docs).toBeInstanceOf(Array);

        // Update
        const updateResponse = await request(payload.express)
          .patch(`/api/leads/${testLeadId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'converted' })
          .expect(200);

        expect(updateResponse.body.doc.status).toBe('converted');
      });
    });
  });

  // ============================================================================
  // GDPR COMPLIANCE TESTS (10+ tests)
  // ============================================================================

  describe('GDPR Compliance Tests', () => {
    it('should reject lead without gdpr_consent=true', async () => {
      const response = await request(payload.express)
        .post('/api/leads')
        .send({
          first_name: 'No',
          last_name: 'Consent',
          email: 'noconsent@example.com',
          phone: '+34 612 345 678',
          gdpr_consent: false, // MUST be true
          privacy_policy_accepted: true,
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('GDPR consent');
    });

    it('should reject lead without privacy_policy_accepted=true', async () => {
      const response = await request(payload.express)
        .post('/api/leads')
        .send({
          first_name: 'No',
          last_name: 'Privacy',
          email: 'noprivacy@example.com',
          phone: '+34 612 345 678',
          gdpr_consent: true,
          privacy_policy_accepted: false, // MUST be true
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('privacy policy');
    });

    it('should capture consent_timestamp automatically on creation', async () => {
      const beforeCreate = new Date();

      const response = await request(payload.express)
        .post('/api/leads')
        .send({
          first_name: 'Timestamp',
          last_name: 'Test',
          email: 'timestamp@example.com',
          phone: '+34 612 345 678',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        })
        .expect(201);

      const afterCreate = new Date();

      expect(response.body.doc.consent_timestamp).toBeDefined();
      const consentTime = new Date(response.body.doc.consent_timestamp);
      expect(consentTime.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(consentTime.getTime()).toBeLessThanOrEqual(afterCreate.getTime());

      testLeadIds.push(response.body.doc.id);
    });

    it('should capture consent_ip_address from request', async () => {
      const response = await request(payload.express)
        .post('/api/leads')
        .send({
          first_name: 'IP',
          last_name: 'Capture',
          email: 'ipcapture@example.com',
          phone: '+34 612 345 678',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        })
        .expect(201);

      expect(response.body.doc.consent_ip_address).toBeDefined();
      // IP might be ::1 or 127.0.0.1 in tests
      expect(response.body.doc.consent_ip_address).toMatch(/::1|127\.0\.0\.1/);

      testLeadIds.push(response.body.doc.id);
    });

    it('should allow marketing_consent to be false (optional)', async () => {
      const response = await request(payload.express)
        .post('/api/leads')
        .send({
          first_name: 'No',
          last_name: 'Marketing',
          email: 'nomarketing@example.com',
          phone: '+34 612 345 678',
          marketing_consent: false, // This is OPTIONAL
          gdpr_consent: true,
          privacy_policy_accepted: true,
        })
        .expect(201);

      expect(response.body.doc.marketing_consent).toBe(false);

      testLeadIds.push(response.body.doc.id);
    });

    it('should provide right to access (user can request their data)', async () => {
      // This would typically be a separate endpoint: GET /api/leads/my-data?email=xxx
      // For now, we verify that the data exists and can be retrieved
      const lead = await payload.create({
        collection: 'leads',
        data: {
          first_name: 'Access',
          last_name: 'Right',
          email: 'access@example.com',
          phone: '+34 612 345 678',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        },
      });

      const response = await request(payload.express)
        .get(`/api/leads/${lead.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.email).toBe('access@example.com');

      testLeadIds.push(lead.id);
    });

    it('should provide right to be forgotten (admin can delete)', async () => {
      const lead = await payload.create({
        collection: 'leads',
        data: {
          first_name: 'Forget',
          last_name: 'Me',
          email: 'forget@example.com',
          phone: '+34 612 345 678',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        },
      });

      // Admin deletes the lead
      await request(payload.express)
        .delete(`/api/leads/${lead.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify deletion
      const deleted = await payload
        .findByID({ collection: 'leads', id: lead.id })
        .catch(() => null);

      expect(deleted).toBeNull();
    });

    it('should track who created the lead (system vs authenticated user)', async () => {
      // Public submission (no user)
      const publicLead = await request(payload.express)
        .post('/api/leads')
        .send({
          first_name: 'Public',
          last_name: 'Creator',
          email: 'public.creator@example.com',
          phone: '+34 612 345 678',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        })
        .expect(201);

      // No created_by user (public form)
      expect(publicLead.body.doc.created_by).toBeUndefined();

      testLeadIds.push(publicLead.body.doc.id);

      // Authenticated submission
      const authLead = await request(payload.express)
        .post('/api/leads')
        .set('Authorization', `Bearer ${marketingToken}`)
        .send({
          first_name: 'Auth',
          last_name: 'Creator',
          email: 'auth.creator@example.com',
          phone: '+34 612 345 678',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        })
        .expect(201);

      // Should have created_by user
      expect(authLead.body.doc.created_by).toBeDefined();

      testLeadIds.push(authLead.body.doc.id);
    });

    it('should prevent unauthorized status changes', async () => {
      // Asesor should not be able to change status of unassigned lead
      const lead = await payload.create({
        collection: 'leads',
        data: {
          first_name: 'Status',
          last_name: 'Unauthorized',
          email: 'status.unauth@example.com',
          phone: '+34 612 345 678',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        },
      });

      await request(payload.express)
        .patch(`/api/leads/${lead.id}`)
        .set('Authorization', `Bearer ${asesorToken}`)
        .send({ status: 'contacted' })
        .expect(403);

      testLeadIds.push(lead.id);
    });

    it('should enforce PII protection (prevent direct access to sensitive fields)', async () => {
      // This test verifies that PII fields are properly handled
      // In a full implementation, you might hash or encrypt PII at rest
      const lead = await payload.create({
        collection: 'leads',
        data: {
          first_name: 'PII',
          last_name: 'Test',
          email: 'pii@example.com',
          phone: '+34 612 345 678',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        },
      });

      // Verify PII exists but is protected
      const response = await request(payload.express)
        .get(`/api/leads/${lead.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // PII fields should exist but only accessible to authorized users
      expect(response.body.email).toBeDefined();
      expect(response.body.phone).toBeDefined();

      testLeadIds.push(lead.id);
    });
  });
});
