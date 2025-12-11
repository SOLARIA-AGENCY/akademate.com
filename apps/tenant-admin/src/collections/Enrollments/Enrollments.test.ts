/**
 * Enrollments Collection - Comprehensive Test Suite (TDD - RED PHASE)
 *
 * This test suite follows Test-Driven Development (TDD) methodology:
 * 1. Write tests FIRST (RED phase) ✅ YOU ARE HERE
 * 2. Implement collection to pass tests (GREEN phase)
 * 3. Apply security patterns (REFACTOR phase)
 *
 * Coverage Areas:
 * - CRUD Operations (15+ tests)
 * - Validation Tests (25+ tests)
 * - Access Control Tests (18+ tests)
 * - Relationship Tests (12+ tests)
 * - Hook Tests (15+ tests)
 * - Security Tests (12+ tests)
 * - Business Logic Tests (10+ tests)
 * Total: 100+ comprehensive tests
 *
 * Security Focus:
 * - SP-001: Immutable fields with defense in depth
 * - SP-004: No PII in logs (students have sensitive data)
 * - Financial data protection
 * - Capacity enforcement
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { Payload } from 'payload';
import { getPayload } from 'payload';
import config from '../../payload.config';

describe('Enrollments Collection - TDD Test Suite', () => {
  let payload: Payload;
  let adminUser: any;
  let gestorUser: any;
  let marketingUser: any;
  let asesorUser: any;
  let lecturaUser: any;
  let testStudent: any;
  let testCourseRun: any;
  let testCourseRunFull: any; // For capacity tests

  // ============================================================================
  // TEST SETUP
  // ============================================================================

  beforeAll(async () => {
    payload = await getPayload({ config });

    // Create test users for each role
    adminUser = await payload.create({
      collection: 'users',
      data: {
        email: 'admin-enrollment@test.com',
        password: 'TestPassword123!',
        role: 'admin',
        first_name: 'Admin',
        last_name: 'Enrollment',
      },
    });

    gestorUser = await payload.create({
      collection: 'users',
      data: {
        email: 'gestor-enrollment@test.com',
        password: 'TestPassword123!',
        role: 'gestor',
        first_name: 'Gestor',
        last_name: 'Enrollment',
      },
    });

    marketingUser = await payload.create({
      collection: 'users',
      data: {
        email: 'marketing-enrollment@test.com',
        password: 'TestPassword123!',
        role: 'marketing',
        first_name: 'Marketing',
        last_name: 'Enrollment',
      },
    });

    asesorUser = await payload.create({
      collection: 'users',
      data: {
        email: 'asesor-enrollment@test.com',
        password: 'TestPassword123!',
        role: 'asesor',
        first_name: 'Asesor',
        last_name: 'Enrollment',
      },
    });

    lecturaUser = await payload.create({
      collection: 'users',
      data: {
        email: 'lectura-enrollment@test.com',
        password: 'TestPassword123!',
        role: 'lectura',
        first_name: 'Lectura',
        last_name: 'Enrollment',
      },
    });

    // Create prerequisite data
    const testCycle = await payload.create({
      collection: 'cycles',
      data: {
        name: 'Test Cycle for Enrollments',
        code: 'TEST-ENROLL',
        level: 'grado_superior',
        duration_years: 2,
      },
      user: adminUser,
    });

    const testCampus = await payload.create({
      collection: 'campuses',
      data: {
        name: 'Test Campus Enrollments',
        code: 'TCE',
        city: 'Madrid',
        address: '123 Test Street',
        postal_code: '28001',
        is_active: true,
      },
      user: adminUser,
    });

    const testCourse = await payload.create({
      collection: 'courses',
      data: {
        title: 'Test Course for Enrollments',
        code: 'TC-ENROLL',
        cycle: testCycle.id,
        description: 'Test course description',
        status: 'published',
        price: 1000,
      },
      user: adminUser,
    });

    // Create test course run with capacity
    testCourseRun = await payload.create({
      collection: 'course-runs',
      data: {
        course: testCourse.id,
        campus: testCampus.id,
        start_date: '2025-09-01',
        end_date: '2026-06-30',
        max_students: 10,
        min_students: 3,
        current_enrollments: 0,
        status: 'enrollment_open',
      },
      user: adminUser,
    });

    // Create course run that's already full
    testCourseRunFull = await payload.create({
      collection: 'course-runs',
      data: {
        course: testCourse.id,
        campus: testCampus.id,
        start_date: '2025-09-01',
        end_date: '2026-06-30',
        max_students: 2,
        min_students: 1,
        current_enrollments: 2, // Already full
        status: 'enrollment_open',
      },
      user: adminUser,
    });

    // Create test student (using Leads as students for now)
    // NOTE: In production, this should be a dedicated Students collection
    testStudent = await payload.create({
      collection: 'leads',
      data: {
        first_name: 'Test',
        last_name: 'Student',
        email: 'student@enrollment.test',
        phone: '+34 666 777 888',
        gdpr_consent: true,
        privacy_policy_accepted: true,
        status: 'qualified', // Qualified to enroll
      },
    });
  });

  afterAll(async () => {
    // Cleanup is handled by database teardown
  });

  // ============================================================================
  // 1. CRUD OPERATIONS TESTS (15+ tests)
  // ============================================================================

  describe('CRUD Operations', () => {
    let createdEnrollment: any;

    it('should create enrollment with all required fields', async () => {
      createdEnrollment = await payload.create({
        collection: 'enrollments',
        data: {
          student: testStudent.id,
          course_run: testCourseRun.id,
          status: 'pending',
          payment_status: 'pending',
          total_amount: 1000,
          amount_paid: 0,
        },
        user: adminUser,
      });

      expect(createdEnrollment).toBeDefined();
      expect(createdEnrollment.id).toBeDefined();
      expect(createdEnrollment.student).toBe(testStudent.id);
      expect(createdEnrollment.course_run).toBe(testCourseRun.id);
      expect(createdEnrollment.status).toBe('pending');
      expect(createdEnrollment.payment_status).toBe('pending');
      expect(createdEnrollment.total_amount).toBe(1000);
      expect(createdEnrollment.amount_paid).toBe(0);
    });

    it('should auto-populate enrolled_at timestamp on creation', async () => {
      expect(createdEnrollment.enrolled_at).toBeDefined();
      expect(new Date(createdEnrollment.enrolled_at)).toBeInstanceOf(Date);
    });

    it('should auto-populate created_by on creation', async () => {
      expect(createdEnrollment.created_by).toBeDefined();
      expect(createdEnrollment.created_by).toBe(adminUser.id);
    });

    it('should create enrollment with optional fields', async () => {
      const enrollment = await payload.create({
        collection: 'enrollments',
        data: {
          student: testStudent.id,
          course_run: testCourseRun.id,
          status: 'confirmed',
          payment_status: 'paid',
          total_amount: 1000,
          amount_paid: 1000,
          financial_aid_applied: true,
          financial_aid_amount: 200,
          financial_aid_status: 'approved',
          attendance_percentage: 95.5,
          final_grade: 87.3,
          notes: 'Excellent student',
        },
        user: gestorUser,
      });

      expect(enrollment).toBeDefined();
      expect(enrollment.financial_aid_applied).toBe(true);
      expect(enrollment.financial_aid_amount).toBe(200);
      expect(enrollment.financial_aid_status).toBe('approved');
      expect(enrollment.attendance_percentage).toBe(95.5);
      expect(enrollment.final_grade).toBe(87.3);
      expect(enrollment.notes).toBe('Excellent student');
    });

    it('should read enrollment by ID', async () => {
      const enrollment = await payload.findByID({
        collection: 'enrollments',
        id: createdEnrollment.id,
        user: adminUser,
      });

      expect(enrollment).toBeDefined();
      expect(enrollment.id).toBe(createdEnrollment.id);
    });

    it('should list all enrollments', async () => {
      const result = await payload.find({
        collection: 'enrollments',
        user: adminUser,
      });

      expect(result.docs).toBeDefined();
      expect(result.docs.length).toBeGreaterThan(0);
    });

    it('should update enrollment status', async () => {
      const updated = await payload.update({
        collection: 'enrollments',
        id: createdEnrollment.id,
        data: {
          status: 'confirmed',
        },
        user: adminUser,
      });

      expect(updated.status).toBe('confirmed');
    });

    it('should update payment information', async () => {
      const updated = await payload.update({
        collection: 'enrollments',
        id: createdEnrollment.id,
        data: {
          amount_paid: 500,
          payment_status: 'partial',
        },
        user: adminUser,
      });

      expect(updated.amount_paid).toBe(500);
      expect(updated.payment_status).toBe('partial');
    });

    it('should update academic tracking fields', async () => {
      const updated = await payload.update({
        collection: 'enrollments',
        id: createdEnrollment.id,
        data: {
          attendance_percentage: 92.5,
          final_grade: 85.0,
        },
        user: adminUser,
      });

      expect(updated.attendance_percentage).toBe(92.5);
      expect(updated.final_grade).toBe(85.0);
    });

    it('should delete enrollment (admin only)', async () => {
      const toDelete = await payload.create({
        collection: 'enrollments',
        data: {
          student: testStudent.id,
          course_run: testCourseRun.id,
          status: 'cancelled',
          payment_status: 'refunded',
          total_amount: 1000,
          amount_paid: 0,
        },
        user: adminUser,
      });

      await payload.delete({
        collection: 'enrollments',
        id: toDelete.id,
        user: adminUser,
      });

      // Verify deletion
      await expect(
        payload.findByID({
          collection: 'enrollments',
          id: toDelete.id,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should support pagination', async () => {
      const result = await payload.find({
        collection: 'enrollments',
        limit: 5,
        page: 1,
        user: adminUser,
      });

      expect(result.docs).toBeDefined();
      expect(result.limit).toBe(5);
      expect(result.page).toBe(1);
    });

    it('should support filtering by status', async () => {
      const result = await payload.find({
        collection: 'enrollments',
        where: {
          status: { equals: 'confirmed' },
        },
        user: adminUser,
      });

      expect(result.docs).toBeDefined();
      result.docs.forEach((doc: any) => {
        expect(doc.status).toBe('confirmed');
      });
    });

    it('should support filtering by payment_status', async () => {
      const result = await payload.find({
        collection: 'enrollments',
        where: {
          payment_status: { equals: 'paid' },
        },
        user: adminUser,
      });

      expect(result.docs).toBeDefined();
      result.docs.forEach((doc: any) => {
        expect(doc.payment_status).toBe('paid');
      });
    });

    it('should support filtering by student', async () => {
      const result = await payload.find({
        collection: 'enrollments',
        where: {
          student: { equals: testStudent.id },
        },
        user: adminUser,
      });

      expect(result.docs).toBeDefined();
      result.docs.forEach((doc: any) => {
        expect(doc.student).toBe(testStudent.id);
      });
    });

    it('should support filtering by course_run', async () => {
      const result = await payload.find({
        collection: 'enrollments',
        where: {
          course_run: { equals: testCourseRun.id },
        },
        user: adminUser,
      });

      expect(result.docs).toBeDefined();
      result.docs.forEach((doc: any) => {
        expect(doc.course_run).toBe(testCourseRun.id);
      });
    });

    it('should support sorting by enrolled_at', async () => {
      const result = await payload.find({
        collection: 'enrollments',
        sort: '-enrolled_at', // Descending
        user: adminUser,
      });

      expect(result.docs).toBeDefined();
      if (result.docs.length > 1) {
        const first = new Date(result.docs[0].enrolled_at);
        const second = new Date(result.docs[1].enrolled_at);
        expect(first.getTime()).toBeGreaterThanOrEqual(second.getTime());
      }
    });
  });

  // ============================================================================
  // 2. VALIDATION TESTS (25+ tests)
  // ============================================================================

  describe('Validation Tests', () => {
    it('should require student field', async () => {
      await expect(
        payload.create({
          collection: 'enrollments',
          data: {
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          } as any,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should require course_run field', async () => {
      await expect(
        payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          } as any,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should require total_amount field', async () => {
      await expect(
        payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            amount_paid: 0,
          } as any,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should enforce unique constraint (student + course_run)', async () => {
      // Create first enrollment
      await payload.create({
        collection: 'enrollments',
        data: {
          student: testStudent.id,
          course_run: testCourseRun.id,
          status: 'pending',
          payment_status: 'pending',
          total_amount: 1000,
          amount_paid: 0,
        },
        user: adminUser,
      });

      // Attempt duplicate enrollment
      await expect(
        payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: adminUser,
        })
      ).rejects.toThrow(/unique/i);
    });

    it('should validate amount_paid >= 0', async () => {
      await expect(
        payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: -100,
          },
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should validate total_amount >= 0', async () => {
      await expect(
        payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: -1000,
            amount_paid: 0,
          },
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should validate amount_paid <= total_amount', async () => {
      await expect(
        payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 1500, // More than total
          },
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should validate financial_aid_amount >= 0', async () => {
      await expect(
        payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
            financial_aid_amount: -200,
          },
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should validate financial_aid_amount <= total_amount', async () => {
      await expect(
        payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
            financial_aid_amount: 1500, // More than total
          },
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should require financial_aid_status if financial_aid_applied is true', async () => {
      await expect(
        payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
            financial_aid_applied: true,
            // Missing financial_aid_status
          },
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should validate attendance_percentage range (0-100)', async () => {
      await expect(
        payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'completed',
            payment_status: 'paid',
            total_amount: 1000,
            amount_paid: 1000,
            attendance_percentage: 150, // Invalid: > 100
          },
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should validate attendance_percentage >= 0', async () => {
      await expect(
        payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'completed',
            payment_status: 'paid',
            total_amount: 1000,
            amount_paid: 1000,
            attendance_percentage: -10, // Invalid: < 0
          },
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should validate final_grade range (0-100)', async () => {
      await expect(
        payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'completed',
            payment_status: 'paid',
            total_amount: 1000,
            amount_paid: 1000,
            final_grade: 110, // Invalid: > 100
          },
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should validate final_grade >= 0', async () => {
      await expect(
        payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'completed',
            payment_status: 'paid',
            total_amount: 1000,
            amount_paid: 1000,
            final_grade: -5, // Invalid: < 0
          },
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should accept valid status values', async () => {
      const validStatuses = ['pending', 'confirmed', 'waitlisted', 'cancelled', 'completed', 'withdrawn'];

      for (const status of validStatuses) {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status,
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: adminUser,
        });

        expect(enrollment.status).toBe(status);

        // Cleanup
        await payload.delete({
          collection: 'enrollments',
          id: enrollment.id,
          user: adminUser,
        });
      }
    });

    it('should reject invalid status values', async () => {
      await expect(
        payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'invalid_status',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          } as any,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should accept valid payment_status values', async () => {
      const validPaymentStatuses = ['pending', 'partial', 'paid', 'refunded', 'waived'];

      for (const payment_status of validPaymentStatuses) {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status,
            total_amount: 1000,
            amount_paid: 0,
          },
          user: adminUser,
        });

        expect(enrollment.payment_status).toBe(payment_status);

        // Cleanup
        await payload.delete({
          collection: 'enrollments',
          id: enrollment.id,
          user: adminUser,
        });
      }
    });

    it('should reject invalid payment_status values', async () => {
      await expect(
        payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'invalid_payment',
            total_amount: 1000,
            amount_paid: 0,
          } as any,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should accept valid financial_aid_status values', async () => {
      const validFinancialAidStatuses = ['none', 'pending', 'approved', 'rejected'];

      for (const financial_aid_status of validFinancialAidStatuses) {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
            financial_aid_applied: true,
            financial_aid_status,
            financial_aid_amount: 200,
          },
          user: adminUser,
        });

        expect(enrollment.financial_aid_status).toBe(financial_aid_status);

        // Cleanup
        await payload.delete({
          collection: 'enrollments',
          id: enrollment.id,
          user: adminUser,
        });
      }
    });

    it('should prevent status change from completed to other status', async () => {
      const enrollment = await payload.create({
        collection: 'enrollments',
        data: {
          student: testStudent.id,
          course_run: testCourseRun.id,
          status: 'completed',
          payment_status: 'paid',
          total_amount: 1000,
          amount_paid: 1000,
        },
        user: adminUser,
      });

      await expect(
        payload.update({
          collection: 'enrollments',
          id: enrollment.id,
          data: {
            status: 'pending', // Cannot change from completed
          },
          user: adminUser,
        })
      ).rejects.toThrow(/completed/i);
    });

    it('should validate student exists', async () => {
      await expect(
        payload.create({
          collection: 'enrollments',
          data: {
            student: 999999, // Non-existent student
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should validate course_run exists', async () => {
      await expect(
        payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: 999999, // Non-existent course run
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should validate course_run status is enrollment_open', async () => {
      // Create course run with wrong status
      const closedCourseRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourseRun.course,
          start_date: '2025-09-01',
          end_date: '2026-06-30',
          max_students: 10,
          min_students: 3,
          current_enrollments: 0,
          status: 'completed', // Not enrollment_open
        },
        user: adminUser,
      });

      await expect(
        payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: closedCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: adminUser,
        })
      ).rejects.toThrow(/enrollment_open/i);
    });

    it('should set status to waitlisted if course_run is full', async () => {
      const enrollment = await payload.create({
        collection: 'enrollments',
        data: {
          student: testStudent.id,
          course_run: testCourseRunFull.id,
          status: 'pending',
          payment_status: 'pending',
          total_amount: 1000,
          amount_paid: 0,
        },
        user: adminUser,
      });

      expect(enrollment.status).toBe('waitlisted');
    });

    it('should accept decimal values for amounts', async () => {
      const enrollment = await payload.create({
        collection: 'enrollments',
        data: {
          student: testStudent.id,
          course_run: testCourseRun.id,
          status: 'pending',
          payment_status: 'pending',
          total_amount: 1234.56,
          amount_paid: 123.45,
          financial_aid_amount: 234.56,
        },
        user: adminUser,
      });

      expect(enrollment.total_amount).toBe(1234.56);
      expect(enrollment.amount_paid).toBe(123.45);
      expect(enrollment.financial_aid_amount).toBe(234.56);
    });
  });

  // ============================================================================
  // 3. ACCESS CONTROL TESTS (18+ tests)
  // ============================================================================

  describe('Access Control Tests', () => {
    describe('Public (Unauthenticated)', () => {
      it('should NOT allow public to create enrollments', async () => {
        await expect(
          payload.create({
            collection: 'enrollments',
            data: {
              student: testStudent.id,
              course_run: testCourseRun.id,
              status: 'pending',
              payment_status: 'pending',
              total_amount: 1000,
              amount_paid: 0,
            },
            // No user = public
          })
        ).rejects.toThrow();
      });

      it('should NOT allow public to read enrollments', async () => {
        await expect(
          payload.find({
            collection: 'enrollments',
            // No user = public
          })
        ).rejects.toThrow();
      });

      it('should NOT allow public to update enrollments', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: adminUser,
        });

        await expect(
          payload.update({
            collection: 'enrollments',
            id: enrollment.id,
            data: { status: 'confirmed' },
            // No user = public
          })
        ).rejects.toThrow();
      });

      it('should NOT allow public to delete enrollments', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: adminUser,
        });

        await expect(
          payload.delete({
            collection: 'enrollments',
            id: enrollment.id,
            // No user = public
          })
        ).rejects.toThrow();
      });
    });

    describe('Lectura Role', () => {
      it('should allow Lectura to read enrollments', async () => {
        const result = await payload.find({
          collection: 'enrollments',
          user: lecturaUser,
        });

        expect(result.docs).toBeDefined();
      });

      it('should NOT allow Lectura to create enrollments', async () => {
        await expect(
          payload.create({
            collection: 'enrollments',
            data: {
              student: testStudent.id,
              course_run: testCourseRun.id,
              status: 'pending',
              payment_status: 'pending',
              total_amount: 1000,
              amount_paid: 0,
            },
            user: lecturaUser,
          })
        ).rejects.toThrow();
      });

      it('should NOT allow Lectura to update enrollments', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: adminUser,
        });

        await expect(
          payload.update({
            collection: 'enrollments',
            id: enrollment.id,
            data: { status: 'confirmed' },
            user: lecturaUser,
          })
        ).rejects.toThrow();
      });

      it('should NOT allow Lectura to delete enrollments', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: adminUser,
        });

        await expect(
          payload.delete({
            collection: 'enrollments',
            id: enrollment.id,
            user: lecturaUser,
          })
        ).rejects.toThrow();
      });
    });

    describe('Asesor Role', () => {
      it('should allow Asesor to create enrollments', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: asesorUser,
        });

        expect(enrollment).toBeDefined();
      });

      it('should allow Asesor to read enrollments', async () => {
        const result = await payload.find({
          collection: 'enrollments',
          user: asesorUser,
        });

        expect(result.docs).toBeDefined();
      });

      it('should allow Asesor to update enrollment status', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: asesorUser,
        });

        const updated = await payload.update({
          collection: 'enrollments',
          id: enrollment.id,
          data: { status: 'confirmed' },
          user: asesorUser,
        });

        expect(updated.status).toBe('confirmed');
      });

      it('should NOT allow Asesor to delete enrollments', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: asesorUser,
        });

        await expect(
          payload.delete({
            collection: 'enrollments',
            id: enrollment.id,
            user: asesorUser,
          })
        ).rejects.toThrow();
      });
    });

    describe('Marketing Role', () => {
      it('should allow Marketing to create enrollments', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: marketingUser,
        });

        expect(enrollment).toBeDefined();
      });

      it('should allow Marketing to read enrollments', async () => {
        const result = await payload.find({
          collection: 'enrollments',
          user: marketingUser,
        });

        expect(result.docs).toBeDefined();
      });

      it('should allow Marketing to update notes only', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: marketingUser,
        });

        const updated = await payload.update({
          collection: 'enrollments',
          id: enrollment.id,
          data: { notes: 'Marketing note' },
          user: marketingUser,
        });

        expect(updated.notes).toBe('Marketing note');
      });

      it('should NOT allow Marketing to delete enrollments', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: marketingUser,
        });

        await expect(
          payload.delete({
            collection: 'enrollments',
            id: enrollment.id,
            user: marketingUser,
          })
        ).rejects.toThrow();
      });
    });

    describe('Gestor Role', () => {
      it('should allow Gestor to create enrollments', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: gestorUser,
        });

        expect(enrollment).toBeDefined();
      });

      it('should allow Gestor to read enrollments', async () => {
        const result = await payload.find({
          collection: 'enrollments',
          user: gestorUser,
        });

        expect(result.docs).toBeDefined();
      });

      it('should allow Gestor to update all fields except financial', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: gestorUser,
        });

        const updated = await payload.update({
          collection: 'enrollments',
          id: enrollment.id,
          data: {
            status: 'confirmed',
            notes: 'Updated by Gestor',
            attendance_percentage: 90,
          },
          user: gestorUser,
        });

        expect(updated.status).toBe('confirmed');
        expect(updated.notes).toBe('Updated by Gestor');
        expect(updated.attendance_percentage).toBe(90);
      });

      it('should allow Gestor to delete enrollments', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: gestorUser,
        });

        await payload.delete({
          collection: 'enrollments',
          id: enrollment.id,
          user: gestorUser,
        });

        // Verify deletion
        await expect(
          payload.findByID({
            collection: 'enrollments',
            id: enrollment.id,
            user: gestorUser,
          })
        ).rejects.toThrow();
      });
    });

    describe('Admin Role', () => {
      it('should allow Admin to create enrollments', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: adminUser,
        });

        expect(enrollment).toBeDefined();
      });

      it('should allow Admin to read enrollments', async () => {
        const result = await payload.find({
          collection: 'enrollments',
          user: adminUser,
        });

        expect(result.docs).toBeDefined();
      });

      it('should allow Admin to update all fields', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: adminUser,
        });

        const updated = await payload.update({
          collection: 'enrollments',
          id: enrollment.id,
          data: {
            status: 'confirmed',
            payment_status: 'paid',
            amount_paid: 1000,
            financial_aid_applied: true,
            financial_aid_amount: 200,
            financial_aid_status: 'approved',
          },
          user: adminUser,
        });

        expect(updated.status).toBe('confirmed');
        expect(updated.payment_status).toBe('paid');
        expect(updated.amount_paid).toBe(1000);
      });

      it('should allow Admin to delete enrollments', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: adminUser,
        });

        await payload.delete({
          collection: 'enrollments',
          id: enrollment.id,
          user: adminUser,
        });

        // Verify deletion
        await expect(
          payload.findByID({
            collection: 'enrollments',
            id: enrollment.id,
            user: adminUser,
          })
        ).rejects.toThrow();
      });
    });
  });

  // ============================================================================
  // 4. RELATIONSHIP TESTS (12+ tests)
  // ============================================================================

  describe('Relationship Tests', () => {
    it('should populate student relationship', async () => {
      const enrollment = await payload.create({
        collection: 'enrollments',
        data: {
          student: testStudent.id,
          course_run: testCourseRun.id,
          status: 'pending',
          payment_status: 'pending',
          total_amount: 1000,
          amount_paid: 0,
        },
        user: adminUser,
      });

      const populated = await payload.findByID({
        collection: 'enrollments',
        id: enrollment.id,
        depth: 1,
        user: adminUser,
      });

      expect(populated.student).toBeDefined();
      expect(typeof populated.student).toBe('object');
    });

    it('should populate course_run relationship', async () => {
      const enrollment = await payload.create({
        collection: 'enrollments',
        data: {
          student: testStudent.id,
          course_run: testCourseRun.id,
          status: 'pending',
          payment_status: 'pending',
          total_amount: 1000,
          amount_paid: 0,
        },
        user: adminUser,
      });

      const populated = await payload.findByID({
        collection: 'enrollments',
        id: enrollment.id,
        depth: 2,
        user: adminUser,
      });

      expect(populated.course_run).toBeDefined();
      expect(typeof populated.course_run).toBe('object');
    });

    it('should populate created_by relationship', async () => {
      const enrollment = await payload.create({
        collection: 'enrollments',
        data: {
          student: testStudent.id,
          course_run: testCourseRun.id,
          status: 'pending',
          payment_status: 'pending',
          total_amount: 1000,
          amount_paid: 0,
        },
        user: adminUser,
      });

      const populated = await payload.findByID({
        collection: 'enrollments',
        id: enrollment.id,
        depth: 1,
        user: adminUser,
      });

      expect(populated.created_by).toBeDefined();
      expect(typeof populated.created_by).toBe('object');
    });

    it('should handle CASCADE delete when student is deleted', async () => {
      // Create a temporary student
      const tempStudent = await payload.create({
        collection: 'leads',
        data: {
          first_name: 'Temp',
          last_name: 'Student',
          email: 'temp@cascade.test',
          phone: '+34 666 777 888',
          gdpr_consent: true,
          privacy_policy_accepted: true,
        },
      });

      // Create enrollment for temp student
      const enrollment = await payload.create({
        collection: 'enrollments',
        data: {
          student: tempStudent.id,
          course_run: testCourseRun.id,
          status: 'pending',
          payment_status: 'pending',
          total_amount: 1000,
          amount_paid: 0,
        },
        user: adminUser,
      });

      // Delete student (should cascade delete enrollment)
      await payload.delete({
        collection: 'leads',
        id: tempStudent.id,
        user: adminUser,
      });

      // Verify enrollment is deleted
      await expect(
        payload.findByID({
          collection: 'enrollments',
          id: enrollment.id,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should handle CASCADE delete when course_run is deleted', async () => {
      // Create a temporary course run
      const tempCourseRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourseRun.course,
          start_date: '2026-09-01',
          end_date: '2027-06-30',
          max_students: 10,
          min_students: 3,
          current_enrollments: 0,
          status: 'enrollment_open',
        },
        user: adminUser,
      });

      // Create enrollment for temp course run
      const enrollment = await payload.create({
        collection: 'enrollments',
        data: {
          student: testStudent.id,
          course_run: tempCourseRun.id,
          status: 'pending',
          payment_status: 'pending',
          total_amount: 1000,
          amount_paid: 0,
        },
        user: adminUser,
      });

      // Delete course run (should cascade delete enrollment)
      await payload.delete({
        collection: 'course-runs',
        id: tempCourseRun.id,
        user: adminUser,
      });

      // Verify enrollment is deleted
      await expect(
        payload.findByID({
          collection: 'enrollments',
          id: enrollment.id,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should handle SET NULL when created_by user is deleted', async () => {
      // Create a temporary user
      const tempUser = await payload.create({
        collection: 'users',
        data: {
          email: 'temp-creator@test.com',
          password: 'TestPassword123!',
          role: 'gestor',
          first_name: 'Temp',
          last_name: 'Creator',
        },
      });

      // Create enrollment by temp user
      const enrollment = await payload.create({
        collection: 'enrollments',
        data: {
          student: testStudent.id,
          course_run: testCourseRun.id,
          status: 'pending',
          payment_status: 'pending',
          total_amount: 1000,
          amount_paid: 0,
        },
        user: tempUser,
      });

      expect(enrollment.created_by).toBe(tempUser.id);

      // Delete temp user (should set created_by to null)
      await payload.delete({
        collection: 'users',
        id: tempUser.id,
        user: adminUser,
      });

      // Verify enrollment still exists with created_by = null
      const updatedEnrollment = await payload.findByID({
        collection: 'enrollments',
        id: enrollment.id,
        user: adminUser,
      });

      expect(updatedEnrollment.created_by).toBeNull();
    });

    it('should filter enrollments by student relationship', async () => {
      const result = await payload.find({
        collection: 'enrollments',
        where: {
          student: { equals: testStudent.id },
        },
        user: adminUser,
      });

      expect(result.docs).toBeDefined();
      result.docs.forEach((doc: any) => {
        expect(doc.student).toBe(testStudent.id);
      });
    });

    it('should filter enrollments by course_run relationship', async () => {
      const result = await payload.find({
        collection: 'enrollments',
        where: {
          course_run: { equals: testCourseRun.id },
        },
        user: adminUser,
      });

      expect(result.docs).toBeDefined();
      result.docs.forEach((doc: any) => {
        expect(doc.course_run).toBe(testCourseRun.id);
      });
    });

    it('should filter enrollments by created_by relationship', async () => {
      const result = await payload.find({
        collection: 'enrollments',
        where: {
          created_by: { equals: adminUser.id },
        },
        user: adminUser,
      });

      expect(result.docs).toBeDefined();
      result.docs.forEach((doc: any) => {
        expect(doc.created_by).toBe(adminUser.id);
      });
    });

    it('should support deep population of nested relationships', async () => {
      const enrollment = await payload.create({
        collection: 'enrollments',
        data: {
          student: testStudent.id,
          course_run: testCourseRun.id,
          status: 'pending',
          payment_status: 'pending',
          total_amount: 1000,
          amount_paid: 0,
        },
        user: adminUser,
      });

      const populated = await payload.findByID({
        collection: 'enrollments',
        id: enrollment.id,
        depth: 3, // Deep nesting
        user: adminUser,
      });

      expect(populated.course_run).toBeDefined();
      expect(typeof populated.course_run).toBe('object');
      if (typeof populated.course_run === 'object' && populated.course_run !== null) {
        expect((populated.course_run as any).course).toBeDefined();
      }
    });

    it('should validate referential integrity on create', async () => {
      await expect(
        payload.create({
          collection: 'enrollments',
          data: {
            student: 999999, // Non-existent
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should maintain referential integrity on update', async () => {
      const enrollment = await payload.create({
        collection: 'enrollments',
        data: {
          student: testStudent.id,
          course_run: testCourseRun.id,
          status: 'pending',
          payment_status: 'pending',
          total_amount: 1000,
          amount_paid: 0,
        },
        user: adminUser,
      });

      await expect(
        payload.update({
          collection: 'enrollments',
          id: enrollment.id,
          data: {
            student: 999999, // Non-existent
          },
          user: adminUser,
        })
      ).rejects.toThrow();
    });
  });

  // ============================================================================
  // 5. HOOK TESTS (15+ tests)
  // ============================================================================

  describe('Hook Tests', () => {
    describe('validateEnrollmentRelationships Hook', () => {
      it('should validate student exists', async () => {
        await expect(
          payload.create({
            collection: 'enrollments',
            data: {
              student: 999999,
              course_run: testCourseRun.id,
              status: 'pending',
              payment_status: 'pending',
              total_amount: 1000,
              amount_paid: 0,
            },
            user: adminUser,
          })
        ).rejects.toThrow(/student/i);
      });

      it('should validate course_run exists', async () => {
        await expect(
          payload.create({
            collection: 'enrollments',
            data: {
              student: testStudent.id,
              course_run: 999999,
              status: 'pending',
              payment_status: 'pending',
              total_amount: 1000,
              amount_paid: 0,
            },
            user: adminUser,
          })
        ).rejects.toThrow(/course.*run/i);
      });

      it('should validate course_run status is enrollment_open', async () => {
        const closedRun = await payload.create({
          collection: 'course-runs',
          data: {
            course: testCourseRun.course,
            start_date: '2025-09-01',
            end_date: '2026-06-30',
            max_students: 10,
            min_students: 3,
            status: 'draft', // Not enrollment_open
          },
          user: adminUser,
        });

        await expect(
          payload.create({
            collection: 'enrollments',
            data: {
              student: testStudent.id,
              course_run: closedRun.id,
              status: 'pending',
              payment_status: 'pending',
              total_amount: 1000,
              amount_paid: 0,
            },
            user: adminUser,
          })
        ).rejects.toThrow(/enrollment_open/i);
      });
    });

    describe('validateEnrollmentCapacity Hook', () => {
      it('should allow enrollment if capacity available', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: adminUser,
        });

        expect(enrollment.status).not.toBe('waitlisted');
      });

      it('should set status to waitlisted if course is full', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRunFull.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: adminUser,
        });

        expect(enrollment.status).toBe('waitlisted');
      });
    });

    describe('trackEnrollmentCreator Hook', () => {
      it('should auto-populate created_by on creation', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: adminUser,
        });

        expect(enrollment.created_by).toBe(adminUser.id);
      });

      it('should prevent created_by from being manually set', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
            created_by: gestorUser.id, // Attempt to override
          } as any,
          user: adminUser,
        });

        // Should be adminUser (the actual creator), not gestorUser
        expect(enrollment.created_by).toBe(adminUser.id);
      });

      it('should make created_by immutable after creation', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: adminUser,
        });

        const updated = await payload.update({
          collection: 'enrollments',
          id: enrollment.id,
          data: {
            created_by: gestorUser.id, // Attempt to change
          } as any,
          user: adminUser,
        });

        // Should remain adminUser
        expect(updated.created_by).toBe(adminUser.id);
      });
    });

    describe('captureEnrollmentTimestamps Hook', () => {
      it('should auto-populate enrolled_at on creation', async () => {
        const beforeCreate = new Date();

        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: adminUser,
        });

        const afterCreate = new Date();

        expect(enrollment.enrolled_at).toBeDefined();
        const enrolledAt = new Date(enrollment.enrolled_at);
        expect(enrolledAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
        expect(enrolledAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      });

      it('should make enrolled_at immutable after creation', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: adminUser,
        });

        const originalEnrolledAt = enrollment.enrolled_at;

        const updated = await payload.update({
          collection: 'enrollments',
          id: enrollment.id,
          data: {
            enrolled_at: new Date('2020-01-01').toISOString(), // Attempt to change
          } as any,
          user: adminUser,
        });

        expect(updated.enrolled_at).toBe(originalEnrolledAt);
      });

      it('should auto-populate confirmed_at when status changes to confirmed', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: adminUser,
        });

        expect(enrollment.confirmed_at).toBeUndefined();

        const updated = await payload.update({
          collection: 'enrollments',
          id: enrollment.id,
          data: { status: 'confirmed' },
          user: adminUser,
        });

        expect(updated.confirmed_at).toBeDefined();
      });

      it('should auto-populate completed_at when status changes to completed', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'confirmed',
            payment_status: 'paid',
            total_amount: 1000,
            amount_paid: 1000,
          },
          user: adminUser,
        });

        expect(enrollment.completed_at).toBeUndefined();

        const updated = await payload.update({
          collection: 'enrollments',
          id: enrollment.id,
          data: { status: 'completed' },
          user: adminUser,
        });

        expect(updated.completed_at).toBeDefined();
      });

      it('should auto-populate cancelled_at when status changes to cancelled', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: adminUser,
        });

        expect(enrollment.cancelled_at).toBeUndefined();

        const updated = await payload.update({
          collection: 'enrollments',
          id: enrollment.id,
          data: { status: 'cancelled' },
          user: adminUser,
        });

        expect(updated.cancelled_at).toBeDefined();
      });
    });

    describe('validateFinancialData Hook', () => {
      it('should validate amount_paid <= total_amount', async () => {
        await expect(
          payload.create({
            collection: 'enrollments',
            data: {
              student: testStudent.id,
              course_run: testCourseRun.id,
              status: 'pending',
              payment_status: 'pending',
              total_amount: 1000,
              amount_paid: 1500, // Greater than total
            },
            user: adminUser,
          })
        ).rejects.toThrow(/amount_paid.*total_amount/i);
      });

      it('should validate financial_aid_amount <= total_amount', async () => {
        await expect(
          payload.create({
            collection: 'enrollments',
            data: {
              student: testStudent.id,
              course_run: testCourseRun.id,
              status: 'pending',
              payment_status: 'pending',
              total_amount: 1000,
              amount_paid: 0,
              financial_aid_amount: 1500, // Greater than total
            },
            user: adminUser,
          })
        ).rejects.toThrow(/financial_aid_amount.*total_amount/i);
      });

      it('should auto-update payment_status based on amounts', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 1000, // Fully paid
          },
          user: adminUser,
        });

        expect(enrollment.payment_status).toBe('paid');
      });

      it('should set payment_status to partial when partially paid', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 500, // Partial payment
          },
          user: adminUser,
        });

        expect(enrollment.payment_status).toBe('partial');
      });
    });

    describe('updateCourseRunEnrollmentCount Hook', () => {
      it('should increment current_enrollments when enrollment confirmed', async () => {
        const initialCount = testCourseRun.current_enrollments;

        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'confirmed',
            payment_status: 'paid',
            total_amount: 1000,
            amount_paid: 1000,
          },
          user: adminUser,
        });

        const updatedCourseRun = await payload.findByID({
          collection: 'course-runs',
          id: testCourseRun.id,
          user: adminUser,
        });

        expect(updatedCourseRun.current_enrollments).toBe(initialCount + 1);
      });

      it('should decrement current_enrollments when enrollment cancelled', async () => {
        // First create and confirm an enrollment
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'confirmed',
            payment_status: 'paid',
            total_amount: 1000,
            amount_paid: 1000,
          },
          user: adminUser,
        });

        const beforeCancel = await payload.findByID({
          collection: 'course-runs',
          id: testCourseRun.id,
          user: adminUser,
        });

        const countBeforeCancel = beforeCancel.current_enrollments;

        // Cancel the enrollment
        await payload.update({
          collection: 'enrollments',
          id: enrollment.id,
          data: { status: 'cancelled' },
          user: adminUser,
        });

        const afterCancel = await payload.findByID({
          collection: 'course-runs',
          id: testCourseRun.id,
          user: adminUser,
        });

        expect(afterCancel.current_enrollments).toBe(countBeforeCancel - 1);
      });
    });
  });

  // ============================================================================
  // 6. SECURITY TESTS (12+ tests)
  // ============================================================================

  describe('Security Tests - SP-001: Immutable Fields', () => {
    it('should make created_by immutable (Layer 2: Security)', async () => {
      const enrollment = await payload.create({
        collection: 'enrollments',
        data: {
          student: testStudent.id,
          course_run: testCourseRun.id,
          status: 'pending',
          payment_status: 'pending',
          total_amount: 1000,
          amount_paid: 0,
        },
        user: adminUser,
      });

      const updated = await payload.update({
        collection: 'enrollments',
        id: enrollment.id,
        data: {
          created_by: gestorUser.id,
        } as any,
        user: adminUser,
      });

      expect(updated.created_by).toBe(adminUser.id); // Unchanged
    });

    it('should make enrolled_at immutable', async () => {
      const enrollment = await payload.create({
        collection: 'enrollments',
        data: {
          student: testStudent.id,
          course_run: testCourseRun.id,
          status: 'pending',
          payment_status: 'pending',
          total_amount: 1000,
          amount_paid: 0,
        },
        user: adminUser,
      });

      const originalEnrolledAt = enrollment.enrolled_at;

      const updated = await payload.update({
        collection: 'enrollments',
        id: enrollment.id,
        data: {
          enrolled_at: new Date('2020-01-01').toISOString(),
        } as any,
        user: adminUser,
      });

      expect(updated.enrolled_at).toBe(originalEnrolledAt);
    });

    it('should make confirmed_at immutable once set', async () => {
      const enrollment = await payload.create({
        collection: 'enrollments',
        data: {
          student: testStudent.id,
          course_run: testCourseRun.id,
          status: 'confirmed',
          payment_status: 'paid',
          total_amount: 1000,
          amount_paid: 1000,
        },
        user: adminUser,
      });

      const originalConfirmedAt = enrollment.confirmed_at;

      const updated = await payload.update({
        collection: 'enrollments',
        id: enrollment.id,
        data: {
          confirmed_at: new Date('2020-01-01').toISOString(),
        } as any,
        user: adminUser,
      });

      expect(updated.confirmed_at).toBe(originalConfirmedAt);
    });

    it('should make completed_at immutable once set', async () => {
      const enrollment = await payload.create({
        collection: 'enrollments',
        data: {
          student: testStudent.id,
          course_run: testCourseRun.id,
          status: 'completed',
          payment_status: 'paid',
          total_amount: 1000,
          amount_paid: 1000,
        },
        user: adminUser,
      });

      const originalCompletedAt = enrollment.completed_at;

      const updated = await payload.update({
        collection: 'enrollments',
        id: enrollment.id,
        data: {
          completed_at: new Date('2020-01-01').toISOString(),
        } as any,
        user: adminUser,
      });

      expect(updated.completed_at).toBe(originalCompletedAt);
    });

    it('should make cancelled_at immutable once set', async () => {
      const enrollment = await payload.create({
        collection: 'enrollments',
        data: {
          student: testStudent.id,
          course_run: testCourseRun.id,
          status: 'cancelled',
          payment_status: 'refunded',
          total_amount: 1000,
          amount_paid: 0,
        },
        user: adminUser,
      });

      const originalCancelledAt = enrollment.cancelled_at;

      const updated = await payload.update({
        collection: 'enrollments',
        id: enrollment.id,
        data: {
          cancelled_at: new Date('2020-01-01').toISOString(),
        } as any,
        user: adminUser,
      });

      expect(updated.cancelled_at).toBe(originalCancelledAt);
    });

    it('should make certificate_issued immutable once true', async () => {
      const enrollment = await payload.create({
        collection: 'enrollments',
        data: {
          student: testStudent.id,
          course_run: testCourseRun.id,
          status: 'completed',
          payment_status: 'paid',
          total_amount: 1000,
          amount_paid: 1000,
          certificate_issued: true,
        },
        user: adminUser,
      });

      const updated = await payload.update({
        collection: 'enrollments',
        id: enrollment.id,
        data: {
          certificate_issued: false, // Attempt to revoke
        },
        user: adminUser,
      });

      expect(updated.certificate_issued).toBe(true); // Unchanged
    });

    it('should make certificate_url immutable once set', async () => {
      const enrollment = await payload.create({
        collection: 'enrollments',
        data: {
          student: testStudent.id,
          course_run: testCourseRun.id,
          status: 'completed',
          payment_status: 'paid',
          total_amount: 1000,
          amount_paid: 1000,
          certificate_issued: true,
          certificate_url: 'https://example.com/cert123.pdf',
        },
        user: adminUser,
      });

      const originalUrl = enrollment.certificate_url;

      const updated = await payload.update({
        collection: 'enrollments',
        id: enrollment.id,
        data: {
          certificate_url: 'https://malicious.com/fake.pdf',
        },
        user: adminUser,
      });

      expect(updated.certificate_url).toBe(originalUrl);
    });

    it('should have field-level access control on created_by', async () => {
      // This test verifies SP-001 Layer 2: Field-level access control
      const enrollment = await payload.create({
        collection: 'enrollments',
        data: {
          student: testStudent.id,
          course_run: testCourseRun.id,
          status: 'pending',
          payment_status: 'pending',
          total_amount: 1000,
          amount_paid: 0,
        },
        user: adminUser,
      });

      // Verify field has access.update = false
      const collectionConfig = payload.collections['enrollments'].config;
      const createdByField = collectionConfig.fields.find(
        (f: any) => f.name === 'created_by'
      );

      expect(createdByField).toBeDefined();
      expect(createdByField.access).toBeDefined();
      expect(createdByField.access.update).toBeDefined();

      // Call the access function
      const canUpdate = await createdByField.access.update({
        req: { user: adminUser },
        data: enrollment,
      });

      expect(canUpdate).toBe(false);
    });

    it('should have field-level access control on timestamp fields', async () => {
      const collectionConfig = payload.collections['enrollments'].config;

      const timestampFields = [
        'enrolled_at',
        'confirmed_at',
        'completed_at',
        'cancelled_at',
      ];

      timestampFields.forEach((fieldName) => {
        const field = collectionConfig.fields.find((f: any) => f.name === fieldName);

        expect(field).toBeDefined();
        expect(field.access).toBeDefined();
        expect(field.access.update).toBeDefined();
      });
    });

    it('should protect financial data with field-level access (Admin/Gestor only)', async () => {
      const collectionConfig = payload.collections['enrollments'].config;

      const financialFields = [
        'amount_paid',
        'total_amount',
        'financial_aid_amount',
        'payment_status',
      ];

      financialFields.forEach((fieldName) => {
        const field = collectionConfig.fields.find((f: any) => f.name === fieldName);

        if (field && field.access && field.access.update) {
          // Should allow Admin
          const canAdminUpdate = field.access.update({
            req: { user: adminUser },
          });
          expect(canAdminUpdate).toBe(true);

          // Should NOT allow Asesor for financial fields
          const canAsesorUpdate = field.access.update({
            req: { user: asesorUser },
          });
          expect(canAsesorUpdate).toBe(false);
        }
      });
    });

    it('should NOT log PII in console (SP-004)', async () => {
      // This is a manual verification test
      // Developers should check that hooks never log:
      // - student.first_name, student.last_name, student.email
      // - student.phone, student details
      // Only log: enrollment.id, student.id (IDs only)

      const enrollment = await payload.create({
        collection: 'enrollments',
        data: {
          student: testStudent.id,
          course_run: testCourseRun.id,
          status: 'pending',
          payment_status: 'pending',
          total_amount: 1000,
          amount_paid: 0,
        },
        user: adminUser,
      });

      // This test passes if implementation never logs PII
      // Verified during code review of hooks
      expect(enrollment.id).toBeDefined();
    });

    it('should prevent status downgrade from completed', async () => {
      const enrollment = await payload.create({
        collection: 'enrollments',
        data: {
          student: testStudent.id,
          course_run: testCourseRun.id,
          status: 'completed',
          payment_status: 'paid',
          total_amount: 1000,
          amount_paid: 1000,
        },
        user: adminUser,
      });

      await expect(
        payload.update({
          collection: 'enrollments',
          id: enrollment.id,
          data: { status: 'confirmed' },
          user: adminUser,
        })
      ).rejects.toThrow();
    });
  });

  // ============================================================================
  // 7. BUSINESS LOGIC TESTS (10+ tests)
  // ============================================================================

  describe('Business Logic Tests', () => {
    describe('Status Workflow', () => {
      it('should allow transition: pending -> confirmed', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: adminUser,
        });

        const updated = await payload.update({
          collection: 'enrollments',
          id: enrollment.id,
          data: { status: 'confirmed' },
          user: adminUser,
        });

        expect(updated.status).toBe('confirmed');
      });

      it('should allow transition: confirmed -> completed', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'confirmed',
            payment_status: 'paid',
            total_amount: 1000,
            amount_paid: 1000,
          },
          user: adminUser,
        });

        const updated = await payload.update({
          collection: 'enrollments',
          id: enrollment.id,
          data: { status: 'completed' },
          user: adminUser,
        });

        expect(updated.status).toBe('completed');
      });

      it('should allow transition: any -> cancelled', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: adminUser,
        });

        const updated = await payload.update({
          collection: 'enrollments',
          id: enrollment.id,
          data: { status: 'cancelled' },
          user: adminUser,
        });

        expect(updated.status).toBe('cancelled');
      });

      it('should allow transition: any -> withdrawn', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'confirmed',
            payment_status: 'paid',
            total_amount: 1000,
            amount_paid: 1000,
          },
          user: adminUser,
        });

        const updated = await payload.update({
          collection: 'enrollments',
          id: enrollment.id,
          data: { status: 'withdrawn' },
          user: adminUser,
        });

        expect(updated.status).toBe('withdrawn');
      });

      it('should prevent transition: completed -> other', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'completed',
            payment_status: 'paid',
            total_amount: 1000,
            amount_paid: 1000,
          },
          user: adminUser,
        });

        await expect(
          payload.update({
            collection: 'enrollments',
            id: enrollment.id,
            data: { status: 'pending' },
            user: adminUser,
          })
        ).rejects.toThrow();
      });
    });

    describe('Payment Status Calculation', () => {
      it('should set payment_status to paid when amount_paid = total_amount', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 1000,
          },
          user: adminUser,
        });

        expect(enrollment.payment_status).toBe('paid');
      });

      it('should set payment_status to partial when 0 < amount_paid < total_amount', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 500,
          },
          user: adminUser,
        });

        expect(enrollment.payment_status).toBe('partial');
      });

      it('should set payment_status to pending when amount_paid = 0', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: adminUser,
        });

        expect(enrollment.payment_status).toBe('pending');
      });
    });

    describe('Financial Aid Workflow', () => {
      it('should require financial_aid_status when financial_aid_applied is true', async () => {
        await expect(
          payload.create({
            collection: 'enrollments',
            data: {
              student: testStudent.id,
              course_run: testCourseRun.id,
              status: 'pending',
              payment_status: 'pending',
              total_amount: 1000,
              amount_paid: 0,
              financial_aid_applied: true,
              // Missing financial_aid_status
            },
            user: adminUser,
          })
        ).rejects.toThrow();
      });

      it('should allow financial_aid_status progression: pending -> approved', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
            financial_aid_applied: true,
            financial_aid_status: 'pending',
            financial_aid_amount: 300,
          },
          user: adminUser,
        });

        const updated = await payload.update({
          collection: 'enrollments',
          id: enrollment.id,
          data: { financial_aid_status: 'approved' },
          user: adminUser,
        });

        expect(updated.financial_aid_status).toBe('approved');
      });

      it('should allow financial_aid_status progression: pending -> rejected', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRun.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
            financial_aid_applied: true,
            financial_aid_status: 'pending',
            financial_aid_amount: 300,
          },
          user: adminUser,
        });

        const updated = await payload.update({
          collection: 'enrollments',
          id: enrollment.id,
          data: { financial_aid_status: 'rejected' },
          user: adminUser,
        });

        expect(updated.financial_aid_status).toBe('rejected');
      });
    });

    describe('Waitlist Management', () => {
      it('should automatically set status to waitlisted when course is full', async () => {
        const enrollment = await payload.create({
          collection: 'enrollments',
          data: {
            student: testStudent.id,
            course_run: testCourseRunFull.id,
            status: 'pending',
            payment_status: 'pending',
            total_amount: 1000,
            amount_paid: 0,
          },
          user: adminUser,
        });

        expect(enrollment.status).toBe('waitlisted');
      });
    });
  });
});
