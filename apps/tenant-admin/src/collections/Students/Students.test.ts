/**
 * Students Collection - Comprehensive Test Suite (TDD)
 *
 * Test Coverage: 120+ tests across 7 categories
 * - CRUD Operations (15+ tests)
 * - GDPR Compliance (20+ tests)
 * - Validation Tests (20+ tests)
 * - Access Control Tests (25+ tests)
 * - PII Protection Tests (15+ tests)
 * - Hook Tests (10+ tests)
 * - Security Tests (15+ tests)
 *
 * SECURITY PATTERNS APPLIED:
 * - SP-001: Immutable Fields (created_by)
 * - SP-002: GDPR Critical Fields (consent_timestamp, consent_ip_address, gdpr_consent, privacy_policy_accepted)
 * - SP-004: PII Data Handling (NO logging of email, phone, DNI, emergency contacts)
 *
 * This file follows TDD methodology:
 * 1. RED: Write tests first (they will fail)
 * 2. GREEN: Implement collection to pass tests
 * 3. REFACTOR: Apply security patterns
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createTestContext, cleanupTestContext, TestContext, cleanupCollection } from '../../utils/testHelpers';

// ============================================================================
// TEST SETUP
// ============================================================================

describe('Students Collection - TDD Test Suite', () => {
  // Test context with Payload instance
  let testContext: TestContext;
  let payload: any;
  let adminUser: any;
  let gestorUser: any;
  let marketingUser: any;
  let asesorUser: any;
  let lecturaUser: any;

  // Test data
  const validStudentData = {
    first_name: 'María',
    last_name: 'García López',
    email: 'maria.garcia@example.com',
    phone: '+34 612 345 678',
    dni: '12345678Z',
    address: 'Calle Mayor 123',
    city: 'Madrid',
    postal_code: '28001',
    country: 'España',
    date_of_birth: '2000-01-15', // 25 years old
    gender: 'female',
    emergency_contact_name: 'José García',
    emergency_contact_phone: '+34 623 456 789',
    emergency_contact_relationship: 'father',
    gdpr_consent: true,
    privacy_policy_accepted: true,
    marketing_consent: false,
    status: 'active',
    notes: 'Student is highly motivated',
  };

  beforeAll(async () => {
    // Initialize test context
    testContext = await createTestContext();
    payload = testContext.payload;

    // Create test users with different roles
    adminUser = await payload.create({
      collection: 'users',
      data: {
        email: 'admin@cepcomunicacion.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      },
    });

    gestorUser = await payload.create({
      collection: 'users',
      data: {
        email: 'gestor@cepcomunicacion.com',
        password: 'gestor123',
        firstName: 'Gestor',
        lastName: 'User',
        role: 'gestor',
      },
    });

    marketingUser = await payload.create({
      collection: 'users',
      data: {
        email: 'marketing@cepcomunicacion.com',
        password: 'marketing123',
        firstName: 'Marketing',
        lastName: 'User',
        role: 'marketing',
      },
    });

    asesorUser = await payload.create({
      collection: 'users',
      data: {
        email: 'asesor@cepcomunicacion.com',
        password: 'asesor123',
        firstName: 'Asesor',
        lastName: 'User',
        role: 'asesor',
      },
    });

    lecturaUser = await payload.create({
      collection: 'users',
      data: {
        email: 'lectura@cepcomunicacion.com',
        password: 'lectura123',
        firstName: 'Lectura',
        lastName: 'User',
        role: 'lectura',
      },
    });
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      // Clean up users
      await cleanupCollection(payload, 'users');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
    
    // Don't cleanup test context here - it's handled globally
  });

  beforeEach(async () => {
    // Clean up students before each test
    try {
      await cleanupCollection(payload, 'students');
    } catch (error) {
      // Ignore errors during cleanup
    }
  });

  // ============================================================================
  // CATEGORY 1: CRUD OPERATIONS (15+ tests)
  // ============================================================================

  describe('CRUD Operations', () => {
    test('should create student with all required fields', async () => {
      const student = await payload.create({
        collection: 'students',
        data: {
          first_name: validStudentData.first_name,
          last_name: validStudentData.last_name,
          email: validStudentData.email,
          phone: validStudentData.phone,
          gdpr_consent: true,
          privacy_policy_accepted: true,
        },
        user: adminUser,
      });

      expect(student).toBeDefined();
      expect(student.id).toBeDefined();
      expect(student.first_name).toBe(validStudentData.first_name);
      expect(student.last_name).toBe(validStudentData.last_name);
      expect(student.email).toBe(validStudentData.email);
      expect(student.gdpr_consent).toBe(true);
      expect(student.privacy_policy_accepted).toBe(true);
    });

    test('should create student with optional fields', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      expect(student.dni).toBe(validStudentData.dni);
      expect(student.address).toBe(validStudentData.address);
      expect(student.city).toBe(validStudentData.city);
      expect(student.postal_code).toBe(validStudentData.postal_code);
      expect(student.emergency_contact_name).toBe(validStudentData.emergency_contact_name);
    });

    test('should read student by ID', async () => {
      const created = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      const student = await payload.findByID({
        collection: 'students',
        id: created.id,
        user: adminUser,
      });

      expect(student).toBeDefined();
      expect(student.id).toBe(created.id);
      expect(student.email).toBe(validStudentData.email);
    });

    test('should list all students', async () => {
      await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      const result = await payload.find({
        collection: 'students',
        user: adminUser,
      });

      expect(result.docs).toBeDefined();
      expect(result.docs.length).toBeGreaterThan(0);
    });

    test('should update student fields', async () => {
      const created = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      const updated = await payload.update({
        collection: 'students',
        id: created.id,
        data: {
          notes: 'Updated notes',
          status: 'inactive',
        },
        user: adminUser,
      });

      expect(updated.notes).toBe('Updated notes');
      expect(updated.status).toBe('inactive');
    });

    test('should delete student (GDPR right to be forgotten)', async () => {
      const created = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      await payload.delete({
        collection: 'students',
        id: created.id,
        user: adminUser,
      });

      // Verify student no longer exists
      await expect(
        payload.findByID({
          collection: 'students',
          id: created.id,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    test('should enforce unique email constraint', async () => {
      await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      // Try to create another student with same email
      await expect(
        payload.create({
          collection: 'students',
          data: {
            ...validStudentData,
            dni: '87654321A', // Different DNI
          },
          user: adminUser,
        })
      ).rejects.toThrow(/unique/i);
    });

    test('should enforce unique DNI constraint', async () => {
      await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      // Try to create another student with same DNI
      await expect(
        payload.create({
          collection: 'students',
          data: {
            ...validStudentData,
            email: 'different.email@example.com',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/unique/i);
    });

    test('should allow missing DNI (optional field)', async () => {
      const student = await payload.create({
        collection: 'students',
        data: {
          ...validStudentData,
          dni: undefined,
        },
        user: adminUser,
      });

      expect(student.dni).toBeUndefined();
    });

    test('should allow multiple students with no DNI', async () => {
      const student1 = await payload.create({
        collection: 'students',
        data: {
          first_name: 'Student',
          last_name: 'One',
          email: 'student1@example.com',
          phone: '+34 611 111 111',
          gdpr_consent: true,
          privacy_policy_accepted: true,
          dni: null,
        },
        user: adminUser,
      });

      const student2 = await payload.create({
        collection: 'students',
        data: {
          first_name: 'Student',
          last_name: 'Two',
          email: 'student2@example.com',
          phone: '+34 622 222 222',
          gdpr_consent: true,
          privacy_policy_accepted: true,
          dni: null,
        },
        user: adminUser,
      });

      expect(student1.id).toBeDefined();
      expect(student2.id).toBeDefined();
      expect(student1.id).not.toBe(student2.id);
    });

    test('should filter students by status', async () => {
      await payload.create({
        collection: 'students',
        data: { ...validStudentData, status: 'active' },
        user: adminUser,
      });

      await payload.create({
        collection: 'students',
        data: {
          ...validStudentData,
          email: 'inactive@example.com',
          status: 'inactive',
        },
        user: adminUser,
      });

      const result = await payload.find({
        collection: 'students',
        where: { status: { equals: 'active' } },
        user: adminUser,
      });

      expect(result.docs.every((doc: any) => doc.status === 'active')).toBe(true);
    });

    test('should paginate students', async () => {
      // Create multiple students with unique emails and DNIs
      for (let i = 0; i < 15; i++) {
        await payload.create({
          collection: 'students',
          data: {
            first_name: `Student${i}`,
            last_name: 'Test',
            email: `student${i}@test${i}.com`,
            phone: '+34 612 345 678',
            dni: `1234567${i.toString().padStart(2, '0')}Z`, // Ensure 2-digit suffix for uniqueness
            gdpr_consent: true,
            privacy_policy_accepted: true,
          },
          user: adminUser,
        });
      }

      const page1 = await payload.find({
        collection: 'students',
        limit: 10,
        page: 1,
        user: adminUser,
      });

      expect(page1.docs.length).toBe(10);
      expect(page1.totalPages).toBeGreaterThan(1);

      const page2 = await payload.find({
        collection: 'students',
        limit: 10,
        page: 2,
        user: adminUser,
      });

      expect(page2.docs.length).toBeGreaterThan(0);
    });

    test('should sort students by created_at', async () => {
      const result = await payload.find({
        collection: 'students',
        sort: '-createdAt', // Descending (newest first)
        user: adminUser,
      });

      expect(result.docs.length).toBeGreaterThan(0);
      // Verify dates are in descending order
      for (let i = 1; i < result.docs.length; i++) {
        const prev = new Date(result.docs[i - 1].createdAt);
        const current = new Date(result.docs[i].createdAt);
        expect(prev >= current).toBe(true);
      }
    });

    test('should search students by email', async () => {
      await payload.create({
        collection: 'students',
        data: {
          ...validStudentData,
          email: 'searchable.email@example.com',
        },
        user: adminUser,
      });

      const result = await payload.find({
        collection: 'students',
        where: { email: { equals: 'searchable.email@example.com' } },
        user: adminUser,
      });

      expect(result.docs.length).toBe(1);
      expect(result.docs[0].email).toBe('searchable.email@example.com');
    });

    test('should handle bulk operations', async () => {
      const students = [];
      for (let i = 0; i < 5; i++) {
        const student = await payload.create({
          collection: 'students',
          data: {
            first_name: `Bulk${i}`,
            last_name: 'Student',
            email: `bulk${i}@testbulk${i}.com`,
            phone: '+34 612 345 678',
            dni: `9876543${i.toString().padStart(2, '0')}Z`, // Ensure 2-digit suffix
            gdpr_consent: true,
            privacy_policy_accepted: true,
          },
          user: adminUser,
        });
        students.push(student);
      }

      expect(students.length).toBe(5);
      expect(students.every((s) => s.id)).toBe(true);
    });
  });

  // ============================================================================
  // CATEGORY 2: GDPR COMPLIANCE TESTS (20+ tests)
  // ============================================================================

  describe('GDPR Compliance', () => {
    test('should reject creation without gdpr_consent=true', async () => {
      await expect(
        payload.create({
          collection: 'students',
          data: {
            ...validStudentData,
            gdpr_consent: false,
          },
          user: adminUser,
        })
      ).rejects.toThrow(/gdpr.*consent/i);
    });

    test('should reject creation with gdpr_consent=undefined', async () => {
      await expect(
        payload.create({
          collection: 'students',
          data: {
            ...validStudentData,
            gdpr_consent: undefined,
          },
          user: adminUser,
        })
      ).rejects.toThrow(/gdpr.*consent/i);
    });

    test('should reject creation without privacy_policy_accepted=true', async () => {
      await expect(
        payload.create({
          collection: 'students',
          data: {
            ...validStudentData,
            privacy_policy_accepted: false,
          },
          user: adminUser,
        })
      ).rejects.toThrow(/privacy.*policy/i);
    });

    test('should reject creation with privacy_policy_accepted=undefined', async () => {
      await expect(
        payload.create({
          collection: 'students',
          data: {
            ...validStudentData,
            privacy_policy_accepted: undefined,
          },
          user: adminUser,
        })
      ).rejects.toThrow(/privacy.*policy/i);
    });

    test('should auto-capture consent_timestamp on creation', async () => {
      const before = new Date();
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });
      const after = new Date();

      expect(student.consent_timestamp).toBeDefined();
      const timestamp = new Date(student.consent_timestamp);
      expect(timestamp >= before && timestamp <= after).toBe(true);
    });

    test('should auto-capture consent_ip_address on creation', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
        req: {
          ip: '192.168.1.100',
        } as any,
      });

      expect(student.consent_ip_address).toBeDefined();
      expect(student.consent_ip_address).toBe('192.168.1.100');
    });

    test('should prevent updating gdpr_consent after creation', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      await expect(
        payload.update({
          collection: 'students',
          id: student.id,
          data: { gdpr_consent: false },
          user: adminUser,
        })
      ).rejects.toThrow(/immutable|cannot.*modified/i);
    });

    test('should prevent updating privacy_policy_accepted after creation', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      await expect(
        payload.update({
          collection: 'students',
          id: student.id,
          data: { privacy_policy_accepted: false },
          user: adminUser,
        })
      ).rejects.toThrow(/immutable|cannot.*modified/i);
    });

    test('should prevent updating consent_timestamp', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      await expect(
        payload.update({
          collection: 'students',
          id: student.id,
          data: { consent_timestamp: new Date().toISOString() },
          user: adminUser,
        })
      ).rejects.toThrow(/immutable|cannot.*modified/i);
    });

    test('should prevent updating consent_ip_address', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      await expect(
        payload.update({
          collection: 'students',
          id: student.id,
          data: { consent_ip_address: '10.0.0.1' },
          user: adminUser,
        })
      ).rejects.toThrow(/immutable|cannot.*modified/i);
    });

    test('should allow updating marketing_consent', async () => {
      const student = await payload.create({
        collection: 'students',
        data: { ...validStudentData, marketing_consent: false },
        user: adminUser,
      });

      const updated = await payload.update({
        collection: 'students',
        id: student.id,
        data: { marketing_consent: true },
        user: adminUser,
      });

      expect(updated.marketing_consent).toBe(true);
    });

    test('should handle IPv4 addresses', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
        req: { ip: '203.0.113.45' } as any,
      });

      expect(student.consent_ip_address).toBe('203.0.113.45');
    });

    test('should handle IPv6 addresses', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
        req: { ip: '2001:0db8:85a3:0000:0000:8a2e:0370:7334' } as any,
      });

      expect(student.consent_ip_address).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    });

    test('should handle X-Forwarded-For header for IP', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
        req: {
          headers: { 'x-forwarded-for': '203.0.113.99, 192.168.1.1' },
        } as any,
      });

      // Should use first IP from X-Forwarded-For
      expect(student.consent_ip_address).toBeDefined();
    });

    test('should enforce database CHECK constraint for gdpr_consent', async () => {
      // Try to bypass validation by direct database insert
      // This should fail at database level
      await expect(
        payload.db.insert({
          table: 'students',
          data: {
            ...validStudentData,
            gdpr_consent: false, // Database should reject this
          },
        })
      ).rejects.toThrow();
    });

    test('should enforce database CHECK constraint for privacy_policy_accepted', async () => {
      await expect(
        payload.db.insert({
          table: 'students',
          data: {
            ...validStudentData,
            privacy_policy_accepted: false,
          },
        })
      ).rejects.toThrow();
    });

    test('should support GDPR right to be forgotten (Admin)', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      await payload.delete({
        collection: 'students',
        id: student.id,
        user: adminUser,
      });

      await expect(
        payload.findByID({
          collection: 'students',
          id: student.id,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    test('should support GDPR right to be forgotten (Gestor)', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      await payload.delete({
        collection: 'students',
        id: student.id,
        user: gestorUser,
      });

      await expect(
        payload.findByID({
          collection: 'students',
          id: student.id,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    test('should cascade delete to enrollments', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      // Create enrollment linked to student
      const enrollment = await payload.create({
        collection: 'enrollments',
        data: {
          student: student.id,
          course_run: 'some-course-run-id',
          status: 'confirmed',
          total_amount: 1000,
        },
        user: adminUser,
      });

      // Delete student (should cascade to enrollment)
      await payload.delete({
        collection: 'students',
        id: student.id,
        user: adminUser,
      });

      // Verify enrollment is also deleted
      await expect(
        payload.findByID({
          collection: 'enrollments',
          id: enrollment.id,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    test('should validate consent_timestamp format (ISO 8601)', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      // Verify ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
      expect(student.consent_timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
      );
    });

    test('should store consent metadata for audit trail', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
        req: { ip: '198.51.100.42' } as any,
      });

      // Verify all audit trail fields are present
      expect(student.gdpr_consent).toBe(true);
      expect(student.privacy_policy_accepted).toBe(true);
      expect(student.consent_timestamp).toBeDefined();
      expect(student.consent_ip_address).toBe('198.51.100.42');
      expect(student.created_by).toBeDefined();
    });
  });

  // ============================================================================
  // CATEGORY 3: VALIDATION TESTS (20+ tests)
  // ============================================================================

  describe('Validation', () => {
    // Email Validation
    test('should validate email uniqueness', async () => {
      await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      await expect(
        payload.create({
          collection: 'students',
          data: {
            ...validStudentData,
            dni: '98765432A',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/unique/i);
    });

    test('should validate email format (RFC 5322)', async () => {
      await expect(
        payload.create({
          collection: 'students',
          data: {
            ...validStudentData,
            email: 'invalid-email',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/email/i);
    });

    test('should reject email with spaces', async () => {
      await expect(
        payload.create({
          collection: 'students',
          data: {
            ...validStudentData,
            email: 'user name@example.com',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/email/i);
    });

    test('should accept valid international email formats', async () => {
      const student = await payload.create({
        collection: 'students',
        data: {
          ...validStudentData,
          email: 'user+tag@subdomain.example.co.uk',
        },
        user: adminUser,
      });

      expect(student.email).toBe('user+tag@subdomain.example.co.uk');
    });

    // Phone Validation
    test('should validate Spanish phone format', async () => {
      await expect(
        payload.create({
          collection: 'students',
          data: {
            ...validStudentData,
            phone: '612345678', // Missing +34 prefix
          },
          user: adminUser,
        })
      ).rejects.toThrow(/phone/i);
    });

    test('should reject phone without country code', async () => {
      await expect(
        payload.create({
          collection: 'students',
          data: {
            ...validStudentData,
            phone: '612 345 678',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/phone/i);
    });

    test('should reject phone with wrong country code', async () => {
      await expect(
        payload.create({
          collection: 'students',
          data: {
            ...validStudentData,
            phone: '+1 555 123 4567',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/phone/i);
    });

    test('should accept valid Spanish mobile phone', async () => {
      const student = await payload.create({
        collection: 'students',
        data: {
          ...validStudentData,
          phone: '+34 612 345 678',
        },
        user: adminUser,
      });

      expect(student.phone).toBe('+34 612 345 678');
    });

    test('should accept valid Spanish landline phone', async () => {
      const student = await payload.create({
        collection: 'students',
        data: {
          ...validStudentData,
          phone: '+34 912 345 678',
        },
        user: adminUser,
      });

      expect(student.phone).toBe('+34 912 345 678');
    });

    // DNI Validation
    test('should validate DNI format (8 digits + 1 letter)', async () => {
      await expect(
        payload.create({
          collection: 'students',
          data: {
            ...validStudentData,
            dni: '1234567', // Missing letter
          },
          user: adminUser,
        })
      ).rejects.toThrow(/dni/i);
    });

    test('should validate DNI letter checksum', async () => {
      await expect(
        payload.create({
          collection: 'students',
          data: {
            ...validStudentData,
            dni: '12345678X', // Wrong letter (should be Z)
          },
          user: adminUser,
        })
      ).rejects.toThrow(/dni/i);
    });

    test('should accept valid DNI', async () => {
      const student = await payload.create({
        collection: 'students',
        data: {
          ...validStudentData,
          dni: '12345678Z',
        },
        user: adminUser,
      });

      expect(student.dni).toBe('12345678Z');
    });

    test('should validate DNI uniqueness', async () => {
      await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      await expect(
        payload.create({
          collection: 'students',
          data: {
            ...validStudentData,
            email: 'different@example.com',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/unique/i);
    });

    // Date of Birth Validation
    test('should reject date_of_birth in the future', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      await expect(
        payload.create({
          collection: 'students',
          data: {
            ...validStudentData,
            date_of_birth: futureDate.toISOString().split('T')[0],
          },
          user: adminUser,
        })
      ).rejects.toThrow(/date.*birth.*past/i);
    });

    test('should reject student under 16 years old', async () => {
      const tooYoung = new Date();
      tooYoung.setFullYear(tooYoung.getFullYear() - 15);

      await expect(
        payload.create({
          collection: 'students',
          data: {
            ...validStudentData,
            date_of_birth: tooYoung.toISOString().split('T')[0],
          },
          user: adminUser,
        })
      ).rejects.toThrow(/16.*years/i);
    });

    test('should accept student exactly 16 years old', async () => {
      const exactly16 = new Date();
      exactly16.setFullYear(exactly16.getFullYear() - 16);

      const student = await payload.create({
        collection: 'students',
        data: {
          ...validStudentData,
          date_of_birth: exactly16.toISOString().split('T')[0],
        },
        user: adminUser,
      });

      expect(student.date_of_birth).toBeDefined();
    });

    // Status Validation
    test('should validate status enum values', async () => {
      await expect(
        payload.create({
          collection: 'students',
          data: {
            ...validStudentData,
            status: 'invalid_status',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/status/i);
    });

    test('should accept valid status values', async () => {
      const statuses = ['active', 'inactive', 'suspended', 'graduated'];

      for (const status of statuses) {
        const student = await payload.create({
          collection: 'students',
          data: {
            ...validStudentData,
            email: `${status}@example.com`,
            dni: undefined,
            status,
          },
          user: adminUser,
        });

        expect(student.status).toBe(status);
      }
    });

    // Gender Validation
    test('should accept valid gender values', async () => {
      const student = await payload.create({
        collection: 'students',
        data: {
          ...validStudentData,
          gender: 'female',
        },
        user: adminUser,
      });

      expect(student.gender).toBe('female');
    });

    // Emergency Contact Validation
    test('should validate emergency contact phone format', async () => {
      await expect(
        payload.create({
          collection: 'students',
          data: {
            ...validStudentData,
            emergency_contact_phone: '123456789', // Invalid format
          },
          user: adminUser,
        })
      ).rejects.toThrow(/phone/i);
    });

    test('should accept valid emergency contact data', async () => {
      const student = await payload.create({
        collection: 'students',
        data: {
          ...validStudentData,
          emergency_contact_name: 'Emergency Contact',
          emergency_contact_phone: '+34 654 321 987',
          emergency_contact_relationship: 'spouse',
        },
        user: adminUser,
      });

      expect(student.emergency_contact_name).toBe('Emergency Contact');
      expect(student.emergency_contact_phone).toBe('+34 654 321 987');
      expect(student.emergency_contact_relationship).toBe('spouse');
    });
  });

  // ============================================================================
  // CATEGORY 4: ACCESS CONTROL TESTS (25+ tests)
  // ============================================================================

  describe('Access Control', () => {
    // Public (Unauthenticated)
    test('should prevent public from creating students', async () => {
      await expect(
        payload.create({
          collection: 'students',
          data: validStudentData,
          user: null, // No authentication
        })
      ).rejects.toThrow(/unauthorized|permission/i);
    });

    test('should prevent public from reading students', async () => {
      await expect(
        payload.find({
          collection: 'students',
          user: null,
        })
      ).rejects.toThrow(/unauthorized|permission/i);
    });

    test('should prevent public from updating students', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      await expect(
        payload.update({
          collection: 'students',
          id: student.id,
          data: { notes: 'Hacked' },
          user: null,
        })
      ).rejects.toThrow(/unauthorized|permission/i);
    });

    test('should prevent public from deleting students', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      await expect(
        payload.delete({
          collection: 'students',
          id: student.id,
          user: null,
        })
      ).rejects.toThrow(/unauthorized|permission/i);
    });

    // Lectura Role
    test('should prevent Lectura from creating students', async () => {
      await expect(
        payload.create({
          collection: 'students',
          data: validStudentData,
          user: lecturaUser,
        })
      ).rejects.toThrow(/permission/i);
    });

    test('should allow Lectura to read limited fields only', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      const result = await payload.findByID({
        collection: 'students',
        id: student.id,
        user: lecturaUser,
      });

      // Lectura can read basic info but not PII
      expect(result.id).toBeDefined();
      expect(result.status).toBeDefined();
      // PII fields should be hidden
      expect(result.email).toBeUndefined();
      expect(result.phone).toBeUndefined();
      expect(result.dni).toBeUndefined();
      expect(result.address).toBeUndefined();
    });

    test('should prevent Lectura from updating students', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      await expect(
        payload.update({
          collection: 'students',
          id: student.id,
          data: { notes: 'Updated' },
          user: lecturaUser,
        })
      ).rejects.toThrow(/permission/i);
    });

    test('should prevent Lectura from deleting students', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      await expect(
        payload.delete({
          collection: 'students',
          id: student.id,
          user: lecturaUser,
        })
      ).rejects.toThrow(/permission/i);
    });

    // Asesor Role
    test('should allow Asesor to create students', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: asesorUser,
      });

      expect(student.id).toBeDefined();
      expect(student.email).toBe(validStudentData.email);
    });

    test('should allow Asesor to read all fields', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      const result = await payload.findByID({
        collection: 'students',
        id: student.id,
        user: asesorUser,
      });

      expect(result.email).toBeDefined();
      expect(result.phone).toBeDefined();
      expect(result.dni).toBeDefined();
      expect(result.emergency_contact_name).toBeDefined();
    });

    test('should allow Asesor to update limited fields', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      const updated = await payload.update({
        collection: 'students',
        id: student.id,
        data: {
          notes: 'Asesor notes',
          status: 'inactive',
        },
        user: asesorUser,
      });

      expect(updated.notes).toBe('Asesor notes');
      expect(updated.status).toBe('inactive');
    });

    test('should prevent Asesor from updating PII fields', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      await expect(
        payload.update({
          collection: 'students',
          id: student.id,
          data: { email: 'hacked@example.com' },
          user: asesorUser,
        })
      ).rejects.toThrow(/permission/i);
    });

    test('should prevent Asesor from deleting students', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      await expect(
        payload.delete({
          collection: 'students',
          id: student.id,
          user: asesorUser,
        })
      ).rejects.toThrow(/permission/i);
    });

    // Marketing Role
    test('should allow Marketing to create students', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: marketingUser,
      });

      expect(student.id).toBeDefined();
    });

    test('should hide sensitive PII from Marketing (DNI)', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      const result = await payload.findByID({
        collection: 'students',
        id: student.id,
        user: marketingUser,
      });

      // Marketing can see basic PII
      expect(result.email).toBeDefined();
      expect(result.phone).toBeDefined();

      // But NOT sensitive PII
      expect(result.dni).toBeUndefined();
      expect(result.emergency_contact_name).toBeUndefined();
    });

    test('should allow Marketing to update notes only', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      const updated = await payload.update({
        collection: 'students',
        id: student.id,
        data: { notes: 'Marketing notes' },
        user: marketingUser,
      });

      expect(updated.notes).toBe('Marketing notes');
    });

    test('should prevent Marketing from updating status', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      await expect(
        payload.update({
          collection: 'students',
          id: student.id,
          data: { status: 'suspended' },
          user: marketingUser,
        })
      ).rejects.toThrow(/permission/i);
    });

    test('should prevent Marketing from deleting students', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      await expect(
        payload.delete({
          collection: 'students',
          id: student.id,
          user: marketingUser,
        })
      ).rejects.toThrow(/permission/i);
    });

    // Gestor Role
    test('should allow Gestor full CRUD operations', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: gestorUser,
      });

      const updated = await payload.update({
        collection: 'students',
        id: student.id,
        data: { status: 'graduated' },
        user: gestorUser,
      });

      expect(updated.status).toBe('graduated');

      await payload.delete({
        collection: 'students',
        id: student.id,
        user: gestorUser,
      });
    });

    test('should allow Gestor to read all fields', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      const result = await payload.findByID({
        collection: 'students',
        id: student.id,
        user: gestorUser,
      });

      expect(result.email).toBeDefined();
      expect(result.dni).toBeDefined();
      expect(result.emergency_contact_name).toBeDefined();
    });

    test('should allow Gestor to update all fields', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      const updated = await payload.update({
        collection: 'students',
        id: student.id,
        data: {
          first_name: 'Updated',
          status: 'inactive',
          notes: 'Gestor notes',
        },
        user: gestorUser,
      });

      expect(updated.first_name).toBe('Updated');
      expect(updated.status).toBe('inactive');
      expect(updated.notes).toBe('Gestor notes');
    });

    // Admin Role
    test('should allow Admin full CRUD operations', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      const updated = await payload.update({
        collection: 'students',
        id: student.id,
        data: { status: 'suspended' },
        user: adminUser,
      });

      expect(updated.status).toBe('suspended');

      await payload.delete({
        collection: 'students',
        id: student.id,
        user: adminUser,
      });
    });

    test('should allow Admin to read all fields including sensitive PII', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      const result = await payload.findByID({
        collection: 'students',
        id: student.id,
        user: adminUser,
      });

      expect(result.email).toBe(validStudentData.email);
      expect(result.dni).toBe(validStudentData.dni);
      expect(result.emergency_contact_name).toBe(validStudentData.emergency_contact_name);
    });

    // Field-Level Access Control
    test('should enforce field-level access on email', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      const resultLectura = await payload.findByID({
        collection: 'students',
        id: student.id,
        user: lecturaUser,
      });

      expect(resultLectura.email).toBeUndefined();

      const resultAsesor = await payload.findByID({
        collection: 'students',
        id: student.id,
        user: asesorUser,
      });

      expect(resultAsesor.email).toBeDefined();
    });

    test('should enforce field-level access on DNI', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      const resultMarketing = await payload.findByID({
        collection: 'students',
        id: student.id,
        user: marketingUser,
      });

      expect(resultMarketing.dni).toBeUndefined();

      const resultGestor = await payload.findByID({
        collection: 'students',
        id: student.id,
        user: gestorUser,
      });

      expect(resultGestor.dni).toBeDefined();
    });

    test('should enforce field-level access on emergency contacts', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      const resultMarketing = await payload.findByID({
        collection: 'students',
        id: student.id,
        user: marketingUser,
      });

      expect(resultMarketing.emergency_contact_name).toBeUndefined();

      const resultAsesor = await payload.findByID({
        collection: 'students',
        id: student.id,
        user: asesorUser,
      });

      expect(resultAsesor.emergency_contact_name).toBeDefined();
    });
  });

  // ============================================================================
  // CATEGORY 5: PII PROTECTION TESTS (15+ tests)
  // ============================================================================

  describe('PII Protection', () => {
    test('should NOT log email in hooks', async () => {
      // Mock console.log to capture logs
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (...args) => {
        logs.push(args.join(' '));
      };

      await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      // Restore console.log
      console.log = originalLog;

      // Verify email is NOT in logs
      expect(logs.some((log) => log.includes(validStudentData.email))).toBe(false);
    });

    test('should NOT log phone in hooks', async () => {
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (...args) => {
        logs.push(args.join(' '));
      };

      await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      console.log = originalLog;

      expect(logs.some((log) => log.includes(validStudentData.phone))).toBe(false);
    });

    test('should NOT log DNI in hooks', async () => {
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (...args) => {
        logs.push(args.join(' '));
      };

      await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      console.log = originalLog;

      expect(logs.some((log) => log.includes(validStudentData.dni!))).toBe(false);
    });

    test('should NOT log first_name in hooks', async () => {
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (...args) => {
        logs.push(args.join(' '));
      };

      await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      console.log = originalLog;

      expect(logs.some((log) => log.includes(validStudentData.first_name))).toBe(false);
    });

    test('should NOT log emergency contact information', async () => {
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (...args) => {
        logs.push(args.join(' '));
      };

      await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      console.log = originalLog;

      expect(
        logs.some((log) => log.includes(validStudentData.emergency_contact_name!))
      ).toBe(false);
      expect(
        logs.some((log) => log.includes(validStudentData.emergency_contact_phone!))
      ).toBe(false);
    });

    test('should NOT log IP address', async () => {
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (...args) => {
        logs.push(args.join(' '));
      };

      await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
        req: { ip: '192.168.1.100' } as any,
      });

      console.log = originalLog;

      expect(logs.some((log) => log.includes('192.168.1.100'))).toBe(false);
    });

    test('should log student ID (non-PII) instead', async () => {
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (...args) => {
        logs.push(args.join(' '));
      };

      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      console.log = originalLog;

      // ID is NOT PII and can be logged
      expect(logs.some((log) => log.includes(student.id))).toBe(true);
    });

    test('should allow boolean flags in logs (not PII)', async () => {
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (...args) => {
        logs.push(args.join(' '));
      };

      await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      console.log = originalLog;

      // Boolean flags are NOT PII
      expect(logs.some((log) => log.includes('hasEmail'))).toBe(true);
    });

    test('should allow status in logs (not PII)', async () => {
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (...args) => {
        logs.push(args.join(' '));
      };

      await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      console.log = originalLog;

      // Status is NOT PII
      expect(logs.some((log) => log.includes('active'))).toBe(true);
    });

    test('should hide email from Lectura role', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      const result = await payload.findByID({
        collection: 'students',
        id: student.id,
        user: lecturaUser,
      });

      expect(result.email).toBeUndefined();
    });

    test('should hide phone from Lectura role', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      const result = await payload.findByID({
        collection: 'students',
        id: student.id,
        user: lecturaUser,
      });

      expect(result.phone).toBeUndefined();
    });

    test('should hide DNI from Marketing role', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      const result = await payload.findByID({
        collection: 'students',
        id: student.id,
        user: marketingUser,
      });

      expect(result.dni).toBeUndefined();
    });

    test('should hide emergency contacts from Marketing role', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      const result = await payload.findByID({
        collection: 'students',
        id: student.id,
        user: marketingUser,
      });

      expect(result.emergency_contact_name).toBeUndefined();
      expect(result.emergency_contact_phone).toBeUndefined();
      expect(result.emergency_contact_relationship).toBeUndefined();
    });

    test('should hide emergency contacts from Lectura role', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      const result = await payload.findByID({
        collection: 'students',
        id: student.id,
        user: lecturaUser,
      });

      expect(result.emergency_contact_name).toBeUndefined();
      expect(result.emergency_contact_phone).toBeUndefined();
      expect(result.emergency_contact_relationship).toBeUndefined();
    });

    test('should apply field-level access control consistently across all PII fields', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      const roles = [
        { user: lecturaUser, canReadEmail: false, canReadDNI: false, canReadEmergency: false },
        { user: asesorUser, canReadEmail: true, canReadDNI: true, canReadEmergency: true },
        { user: marketingUser, canReadEmail: true, canReadDNI: false, canReadEmergency: false },
        { user: gestorUser, canReadEmail: true, canReadDNI: true, canReadEmergency: true },
        { user: adminUser, canReadEmail: true, canReadDNI: true, canReadEmergency: true },
      ];

      for (const { user, canReadEmail, canReadDNI, canReadEmergency } of roles) {
        const result = await payload.findByID({
          collection: 'students',
          id: student.id,
          user,
        });

        if (canReadEmail) {
          expect(result.email).toBeDefined();
        } else {
          expect(result.email).toBeUndefined();
        }

        if (canReadDNI) {
          expect(result.dni).toBeDefined();
        } else {
          expect(result.dni).toBeUndefined();
        }

        if (canReadEmergency) {
          expect(result.emergency_contact_name).toBeDefined();
        } else {
          expect(result.emergency_contact_name).toBeUndefined();
        }
      }
    });
  });

  // ============================================================================
  // CATEGORY 6: HOOK TESTS (10+ tests)
  // ============================================================================

  describe('Hooks', () => {
    test('should auto-capture consent_timestamp on creation', async () => {
      const before = new Date();
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });
      const after = new Date();

      expect(student.consent_timestamp).toBeDefined();
      const timestamp = new Date(student.consent_timestamp);
      expect(timestamp >= before && timestamp <= after).toBe(true);
    });

    test('should auto-capture consent_ip_address on creation', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
        req: { ip: '203.0.113.45' } as any,
      });

      expect(student.consent_ip_address).toBe('203.0.113.45');
    });

    test('should NOT capture consent metadata on update', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
        req: { ip: '192.168.1.1' } as any,
      });

      const originalTimestamp = student.consent_timestamp;
      const originalIP = student.consent_ip_address;

      // Wait 100ms to ensure timestamp would be different
      await new Promise((resolve) => setTimeout(resolve, 100));

      const updated = await payload.update({
        collection: 'students',
        id: student.id,
        data: { notes: 'Updated' },
        user: adminUser,
        req: { ip: '10.0.0.1' } as any,
      });

      // Consent metadata should NOT change
      expect(updated.consent_timestamp).toBe(originalTimestamp);
      expect(updated.consent_ip_address).toBe(originalIP);
    });

    test('should auto-populate created_by on creation', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      expect(student.created_by).toBeDefined();
      expect(student.created_by).toBe(adminUser.id);
    });

    test('should prevent updating created_by', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      await expect(
        payload.update({
          collection: 'students',
          id: student.id,
          data: { created_by: marketingUser.id },
          user: adminUser,
        })
      ).rejects.toThrow(/immutable|cannot.*modified/i);
    });

    test('should validate email format in hook', async () => {
      await expect(
        payload.create({
          collection: 'students',
          data: {
            ...validStudentData,
            email: 'not-an-email',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/email/i);
    });

    test('should validate phone format in hook', async () => {
      await expect(
        payload.create({
          collection: 'students',
          data: {
            ...validStudentData,
            phone: '123456789',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/phone/i);
    });

    test('should validate DNI format in hook', async () => {
      await expect(
        payload.create({
          collection: 'students',
          data: {
            ...validStudentData,
            dni: '12345678',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/dni/i);
    });

    test('should validate age (>= 16 years) in hook', async () => {
      const tooYoung = new Date();
      tooYoung.setFullYear(tooYoung.getFullYear() - 15);

      await expect(
        payload.create({
          collection: 'students',
          data: {
            ...validStudentData,
            date_of_birth: tooYoung.toISOString().split('T')[0],
          },
          user: adminUser,
        })
      ).rejects.toThrow(/16.*years/i);
    });

    test('should validate created_by user exists', async () => {
      await expect(
        payload.create({
          collection: 'students',
          data: validStudentData,
          user: { id: 'non-existent-user-id', role: 'admin' },
        })
      ).rejects.toThrow(/user.*not.*found/i);
    });
  });

  // ============================================================================
  // CATEGORY 7: SECURITY TESTS (15+ tests)
  // ============================================================================

  describe('Security', () => {
    test('should enforce created_by immutability (SP-001)', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      await expect(
        payload.update({
          collection: 'students',
          id: student.id,
          data: { created_by: marketingUser.id },
          user: adminUser,
        })
      ).rejects.toThrow(/immutable/i);
    });

    test('should enforce gdpr_consent immutability (SP-002)', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      await expect(
        payload.update({
          collection: 'students',
          id: student.id,
          data: { gdpr_consent: false },
          user: adminUser,
        })
      ).rejects.toThrow(/immutable/i);
    });

    test('should enforce privacy_policy_accepted immutability (SP-002)', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      await expect(
        payload.update({
          collection: 'students',
          id: student.id,
          data: { privacy_policy_accepted: false },
          user: adminUser,
        })
      ).rejects.toThrow(/immutable/i);
    });

    test('should enforce consent_timestamp immutability (SP-002)', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      await expect(
        payload.update({
          collection: 'students',
          id: student.id,
          data: { consent_timestamp: new Date().toISOString() },
          user: adminUser,
        })
      ).rejects.toThrow(/immutable/i);
    });

    test('should enforce consent_ip_address immutability (SP-002)', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      await expect(
        payload.update({
          collection: 'students',
          id: student.id,
          data: { consent_ip_address: '10.0.0.1' },
          user: adminUser,
        })
      ).rejects.toThrow(/immutable/i);
    });

    test('should apply 3-layer defense for gdpr_consent', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      // Layer 1: UI (admin.readOnly) - tested manually
      // Layer 2: API (access.update: false)
      await expect(
        payload.update({
          collection: 'students',
          id: student.id,
          data: { gdpr_consent: false },
          user: adminUser,
        })
      ).rejects.toThrow();

      // Layer 3: Database CHECK constraint
      await expect(
        payload.db.update({
          table: 'students',
          id: student.id,
          data: { gdpr_consent: false },
        })
      ).rejects.toThrow();
    });

    test('should apply 3-layer defense for privacy_policy_accepted', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      await expect(
        payload.update({
          collection: 'students',
          id: student.id,
          data: { privacy_policy_accepted: false },
          user: adminUser,
        })
      ).rejects.toThrow();

      await expect(
        payload.db.update({
          table: 'students',
          id: student.id,
          data: { privacy_policy_accepted: false },
        })
      ).rejects.toThrow();
    });

    test('should NOT log PII in any hook (SP-004)', async () => {
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (...args) => {
        logs.push(args.join(' '));
      };

      await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      console.log = originalLog;

      // Verify NO PII in logs
      const piiFields = [
        validStudentData.email,
        validStudentData.phone,
        validStudentData.dni!,
        validStudentData.first_name,
        validStudentData.last_name,
        validStudentData.emergency_contact_name!,
        validStudentData.emergency_contact_phone!,
      ];

      for (const pii of piiFields) {
        expect(logs.some((log) => log.includes(pii))).toBe(false);
      }
    });

    test('should enforce field-level access control on email', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      const resultLectura = await payload.findByID({
        collection: 'students',
        id: student.id,
        user: lecturaUser,
      });

      expect(resultLectura.email).toBeUndefined();
    });

    test('should enforce field-level access control on DNI', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      const resultMarketing = await payload.findByID({
        collection: 'students',
        id: student.id,
        user: marketingUser,
      });

      expect(resultMarketing.dni).toBeUndefined();
    });

    test('should enforce field-level access control on emergency contacts', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      const resultMarketing = await payload.findByID({
        collection: 'students',
        id: student.id,
        user: marketingUser,
      });

      expect(resultMarketing.emergency_contact_name).toBeUndefined();
      expect(resultMarketing.emergency_contact_phone).toBeUndefined();
      expect(resultMarketing.emergency_contact_relationship).toBeUndefined();
    });

    test('should prevent privilege escalation via created_by manipulation', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: asesorUser,
      });

      // Verify created_by is set correctly
      expect(student.created_by).toBe(asesorUser.id);

      // Try to change ownership
      await expect(
        payload.update({
          collection: 'students',
          id: student.id,
          data: { created_by: adminUser.id },
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    test('should prevent GDPR consent revocation attack', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
      });

      // Try multiple attack vectors
      const attacks = [
        { gdpr_consent: false },
        { privacy_policy_accepted: false },
        { gdpr_consent: null },
        { privacy_policy_accepted: null },
        { gdpr_consent: undefined },
        { privacy_policy_accepted: undefined },
      ];

      for (const attack of attacks) {
        await expect(
          payload.update({
            collection: 'students',
            id: student.id,
            data: attack,
            user: adminUser,
          })
        ).rejects.toThrow();
      }
    });

    test('should prevent audit trail tampering (consent metadata)', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
        req: { ip: '192.168.1.100' } as any,
      });

      const tampering = [
        { consent_timestamp: new Date().toISOString() },
        { consent_ip_address: '10.0.0.1' },
        { consent_timestamp: null },
        { consent_ip_address: null },
      ];

      for (const attack of tampering) {
        await expect(
          payload.update({
            collection: 'students',
            id: student.id,
            data: attack,
            user: adminUser,
          })
        ).rejects.toThrow();
      }
    });

    test('should maintain data integrity across all immutable fields', async () => {
      const student = await payload.create({
        collection: 'students',
        data: validStudentData,
        user: adminUser,
        req: { ip: '198.51.100.1' } as any,
      });

      const immutableFields = {
        created_by: student.created_by,
        gdpr_consent: student.gdpr_consent,
        privacy_policy_accepted: student.privacy_policy_accepted,
        consent_timestamp: student.consent_timestamp,
        consent_ip_address: student.consent_ip_address,
      };

      // Try to update mutable field
      await payload.update({
        collection: 'students',
        id: student.id,
        data: { notes: 'Updated notes' },
        user: adminUser,
      });

      // Verify immutable fields unchanged
      const updated = await payload.findByID({
        collection: 'students',
        id: student.id,
        user: adminUser,
      });

      expect(updated.created_by).toBe(immutableFields.created_by);
      expect(updated.gdpr_consent).toBe(immutableFields.gdpr_consent);
      expect(updated.privacy_policy_accepted).toBe(immutableFields.privacy_policy_accepted);
      expect(updated.consent_timestamp).toBe(immutableFields.consent_timestamp);
      expect(updated.consent_ip_address).toBe(immutableFields.consent_ip_address);
    });
  });
});
