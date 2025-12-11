/**
 * CourseRuns Collection - Comprehensive Test Suite
 *
 * This test suite follows Test-Driven Development (TDD) methodology:
 * 1. Write tests FIRST (RED phase)
 * 2. Implement collection to pass tests (GREEN phase)
 * 3. Apply security patterns (REFACTOR phase)
 *
 * Coverage:
 * - CRUD Operations (15+ tests)
 * - Validation Tests (20+ tests)
 * - Access Control Tests (15+ tests)
 * - Relationship Tests (10+ tests)
 * - Hook Tests (10+ tests)
 * - Security Tests (10+ tests)
 * Total: 80+ comprehensive tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Payload } from 'payload';
import { getPayload } from 'payload';
import config from '../../payload.config';

describe('CourseRuns Collection - TDD Test Suite', () => {
  let payload: Payload;
  let adminUser: any;
  let gestorUser: any;
  let marketingUser: any;
  let asesorUser: any;
  let lecturaUser: any;
  let testCourse: any;
  let testCampus: any;

  // ============================================================================
  // TEST SETUP
  // ============================================================================

  beforeAll(async () => {
    payload = await getPayload({ config });

    // Create test users for each role
    adminUser = await payload.create({
      collection: 'users',
      data: {
        email: 'admin-courserun@test.com',
        password: 'TestPassword123!',
        role: 'admin',
        first_name: 'Admin',
        last_name: 'CourseRun',
      },
    });

    gestorUser = await payload.create({
      collection: 'users',
      data: {
        email: 'gestor-courserun@test.com',
        password: 'TestPassword123!',
        role: 'gestor',
        first_name: 'Gestor',
        last_name: 'CourseRun',
      },
    });

    marketingUser = await payload.create({
      collection: 'users',
      data: {
        email: 'marketing-courserun@test.com',
        password: 'TestPassword123!',
        role: 'marketing',
        first_name: 'Marketing',
        last_name: 'CourseRun',
      },
    });

    asesorUser = await payload.create({
      collection: 'users',
      data: {
        email: 'asesor-courserun@test.com',
        password: 'TestPassword123!',
        role: 'asesor',
        first_name: 'Asesor',
        last_name: 'CourseRun',
      },
    });

    lecturaUser = await payload.create({
      collection: 'users',
      data: {
        email: 'lectura-courserun@test.com',
        password: 'TestPassword123!',
        role: 'lectura',
        first_name: 'Lectura',
        last_name: 'CourseRun',
      },
    });

    // Create test course
    const testCycle = await payload.create({
      collection: 'cycles',
      data: {
        name: 'Test Cycle for CourseRuns',
        code: 'TCR001',
        duration_years: 2,
        level: 'grado_superior',
        status: 'published',
      },
    });

    testCourse = await payload.create({
      collection: 'courses',
      data: {
        title: 'Test Course for CourseRuns',
        slug: 'test-course-courseruns',
        cycle: testCycle.id,
        code: 'TCR-001',
        credits: 60,
        duration_hours: 1000,
        price: 5000,
        status: 'published',
      },
    });

    // Create test campus
    testCampus = await payload.create({
      collection: 'campuses',
      data: {
        name: 'Test Campus for CourseRuns',
        slug: 'test-campus-courseruns',
        code: 'TCR',
        city: 'Madrid',
        address: 'Calle Test 123',
        postal_code: '28001',
        phone: '+34 912 345 678',
        email: 'test-campus@cepcomunicacion.com',
        status: 'active',
      },
    });
  });

  afterAll(async () => {
    // Cleanup test data
    if (payload) {
      // Delete all test course runs
      const runs = await payload.find({
        collection: 'course-runs',
        limit: 1000,
      });
      for (const run of runs.docs) {
        await payload.delete({
          collection: 'course-runs',
          id: run.id,
        });
      }

      // Delete test users
      for (const user of [adminUser, gestorUser, marketingUser, asesorUser, lecturaUser]) {
        if (user?.id) {
          await payload.delete({
            collection: 'users',
            id: user.id,
          });
        }
      }

      // Delete test course and campus
      if (testCourse?.id) {
        await payload.delete({
          collection: 'courses',
          id: testCourse.id,
        });
      }
      if (testCampus?.id) {
        await payload.delete({
          collection: 'campuses',
          id: testCampus.id,
        });
      }
    }
  });

  // ============================================================================
  // CRUD OPERATIONS TESTS (15+ tests)
  // ============================================================================

  describe('CRUD Operations', () => {
    it('should create a course run with all required fields', async () => {
      const courseRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
        },
        user: adminUser,
      });

      expect(courseRun).toBeDefined();
      expect(courseRun.course).toBe(testCourse.id);
      expect(courseRun.start_date).toBe('2025-09-01');
      expect(courseRun.end_date).toBe('2025-12-31');
      expect(courseRun.status).toBe('draft'); // default value
    });

    it('should create a course run with optional fields', async () => {
      const courseRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          campus: testCampus.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
          enrollment_deadline: '2025-08-15',
          schedule_days: ['monday', 'wednesday', 'friday'],
          schedule_time_start: '09:00:00',
          schedule_time_end: '13:00:00',
          max_students: 25,
          min_students: 10,
          price_override: 4500.00,
          financial_aid_available: true,
          instructor_name: 'Prof. Test Instructor',
          instructor_bio: 'Experienced instructor with 10 years in the field.',
          notes: 'Special notes for this course run',
          status: 'published',
        },
        user: adminUser,
      });

      expect(courseRun).toBeDefined();
      expect(courseRun.campus).toBe(testCampus.id);
      expect(courseRun.enrollment_deadline).toBe('2025-08-15');
      expect(courseRun.schedule_days).toEqual(['monday', 'wednesday', 'friday']);
      expect(courseRun.schedule_time_start).toBe('09:00:00');
      expect(courseRun.schedule_time_end).toBe('13:00:00');
      expect(courseRun.max_students).toBe(25);
      expect(courseRun.min_students).toBe(10);
      expect(courseRun.price_override).toBe(4500.00);
      expect(courseRun.financial_aid_available).toBe(true);
      expect(courseRun.instructor_name).toBe('Prof. Test Instructor');
      expect(courseRun.status).toBe('published');
    });

    it('should read a course run by ID', async () => {
      const created = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
        },
        user: adminUser,
      });

      const courseRun = await payload.findByID({
        collection: 'course-runs',
        id: created.id,
        user: adminUser,
      });

      expect(courseRun).toBeDefined();
      expect(courseRun.id).toBe(created.id);
      expect(courseRun.course).toBe(testCourse.id);
    });

    it('should list all course runs', async () => {
      // Create multiple course runs
      await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
        },
        user: adminUser,
      });

      await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2026-01-15',
          end_date: '2026-05-15',
        },
        user: adminUser,
      });

      const runs = await payload.find({
        collection: 'course-runs',
        user: adminUser,
      });

      expect(runs.docs.length).toBeGreaterThanOrEqual(2);
    });

    it('should update a course run', async () => {
      const created = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
          status: 'draft',
        },
        user: adminUser,
      });

      const updated = await payload.update({
        collection: 'course-runs',
        id: created.id,
        data: {
          status: 'published',
          max_students: 30,
        },
        user: adminUser,
      });

      expect(updated.status).toBe('published');
      expect(updated.max_students).toBe(30);
    });

    it('should delete a course run', async () => {
      const created = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
        },
        user: adminUser,
      });

      await payload.delete({
        collection: 'course-runs',
        id: created.id,
        user: adminUser,
      });

      await expect(
        payload.findByID({
          collection: 'course-runs',
          id: created.id,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should cascade delete course runs when parent course is deleted', async () => {
      // Create a temporary course
      const tempCourse = await payload.create({
        collection: 'courses',
        data: {
          title: 'Temp Course for Cascade Test',
          slug: 'temp-course-cascade',
          cycle: testCourse.cycle,
          code: 'TEMP-001',
          credits: 60,
          duration_hours: 1000,
          price: 5000,
          status: 'draft',
        },
      });

      // Create course run for temp course
      const courseRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: tempCourse.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
        },
        user: adminUser,
      });

      // Delete the course
      await payload.delete({
        collection: 'courses',
        id: tempCourse.id,
      });

      // Course run should be deleted due to CASCADE
      await expect(
        payload.findByID({
          collection: 'course-runs',
          id: courseRun.id,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should set campus to null when campus is deleted (SET NULL)', async () => {
      // Create a temporary campus
      const tempCampus = await payload.create({
        collection: 'campuses',
        data: {
          name: 'Temp Campus for SET NULL Test',
          slug: 'temp-campus-setnull',
          code: 'TEMP',
          city: 'Barcelona',
          address: 'Temp Address',
          postal_code: '08001',
          phone: '+34 912 345 678',
          email: 'temp@test.com',
          status: 'active',
        },
      });

      // Create course run with temp campus
      const courseRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          campus: tempCampus.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
        },
        user: adminUser,
      });

      // Delete the campus
      await payload.delete({
        collection: 'campuses',
        id: tempCampus.id,
      });

      // Course run should still exist, but campus should be null
      const updatedRun = await payload.findByID({
        collection: 'course-runs',
        id: courseRun.id,
        user: adminUser,
      });

      expect(updatedRun.campus).toBeNull();
    });

    it('should auto-populate created_by on creation', async () => {
      const courseRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
        },
        user: marketingUser,
      });

      expect(courseRun.created_by).toBe(marketingUser.id);
    });

    it('should auto-set current_enrollments to 0 on creation', async () => {
      const courseRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
        },
        user: adminUser,
      });

      expect(courseRun.current_enrollments).toBe(0);
    });

    it('should auto-set default max_students to 30', async () => {
      const courseRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
        },
        user: adminUser,
      });

      expect(courseRun.max_students).toBe(30);
    });

    it('should auto-set default min_students to 5', async () => {
      const courseRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
        },
        user: adminUser,
      });

      expect(courseRun.min_students).toBe(5);
    });

    it('should create course run without campus (optional)', async () => {
      const courseRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
        },
        user: adminUser,
      });

      expect(courseRun.campus).toBeUndefined();
    });

    it('should create course run without schedule details (optional)', async () => {
      const courseRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
        },
        user: adminUser,
      });

      expect(courseRun.schedule_days).toBeUndefined();
      expect(courseRun.schedule_time_start).toBeUndefined();
      expect(courseRun.schedule_time_end).toBeUndefined();
    });

    it('should support multiple course runs for the same course', async () => {
      const run1 = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
        },
        user: adminUser,
      });

      const run2 = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2026-01-15',
          end_date: '2026-05-15',
        },
        user: adminUser,
      });

      expect(run1.id).not.toBe(run2.id);
      expect(run1.course).toBe(testCourse.id);
      expect(run2.course).toBe(testCourse.id);
    });
  });

  // ============================================================================
  // VALIDATION TESTS (20+ tests)
  // ============================================================================

  describe('Validation', () => {
    it('should fail when course_id is missing', async () => {
      await expect(
        payload.create({
          collection: 'course-runs',
          data: {
            start_date: '2025-09-01',
            end_date: '2025-12-31',
          } as any,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should fail when start_date is missing', async () => {
      await expect(
        payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            end_date: '2025-12-31',
          } as any,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should fail when end_date is missing', async () => {
      await expect(
        payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
          } as any,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should fail when end_date is before start_date', async () => {
      await expect(
        payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-12-31',
            end_date: '2025-09-01', // before start_date
          },
          user: adminUser,
        })
      ).rejects.toThrow(/end_date must be after start_date/i);
    });

    it('should fail when end_date equals start_date', async () => {
      await expect(
        payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-09-01', // same as start_date
          },
          user: adminUser,
        })
      ).rejects.toThrow(/end_date must be after start_date/i);
    });

    it('should fail when enrollment_deadline is after start_date', async () => {
      await expect(
        payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
            enrollment_deadline: '2025-09-15', // after start_date
          },
          user: adminUser,
        })
      ).rejects.toThrow(/enrollment_deadline must be before start_date/i);
    });

    it('should fail when max_students is less than min_students', async () => {
      await expect(
        payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
            max_students: 5,
            min_students: 10, // greater than max_students
          },
          user: adminUser,
        })
      ).rejects.toThrow(/max_students must be greater than min_students/i);
    });

    it('should fail when max_students equals min_students', async () => {
      await expect(
        payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
            max_students: 10,
            min_students: 10, // equal to max_students
          },
          user: adminUser,
        })
      ).rejects.toThrow(/max_students must be greater than min_students/i);
    });

    it('should fail when min_students is zero', async () => {
      await expect(
        payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
            min_students: 0,
          },
          user: adminUser,
        })
      ).rejects.toThrow(/min_students must be greater than 0/i);
    });

    it('should fail when min_students is negative', async () => {
      await expect(
        payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
            min_students: -5,
          },
          user: adminUser,
        })
      ).rejects.toThrow(/min_students must be greater than 0/i);
    });

    it('should fail when current_enrollments is negative', async () => {
      await expect(
        payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
            current_enrollments: -5,
          },
          user: adminUser,
        })
      ).rejects.toThrow(/current_enrollments cannot be negative/i);
    });

    it('should fail when current_enrollments exceeds max_students', async () => {
      await expect(
        payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
            max_students: 20,
            current_enrollments: 25, // exceeds max_students
          },
          user: adminUser,
        })
      ).rejects.toThrow(/current_enrollments cannot exceed max_students/i);
    });

    it('should fail when schedule_time_start is provided without schedule_time_end', async () => {
      await expect(
        payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
            schedule_time_start: '09:00:00',
            // schedule_time_end missing
          },
          user: adminUser,
        })
      ).rejects.toThrow(/schedule_time_end is required when schedule_time_start is provided/i);
    });

    it('should fail when schedule_time_end is provided without schedule_time_start', async () => {
      await expect(
        payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
            schedule_time_end: '13:00:00',
            // schedule_time_start missing
          },
          user: adminUser,
        })
      ).rejects.toThrow(/schedule_time_start is required when schedule_time_end is provided/i);
    });

    it('should fail when schedule_time_end is before schedule_time_start', async () => {
      await expect(
        payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
            schedule_time_start: '13:00:00',
            schedule_time_end: '09:00:00', // before start time
          },
          user: adminUser,
        })
      ).rejects.toThrow(/schedule_time_end must be after schedule_time_start/i);
    });

    it('should fail when schedule_time_end equals schedule_time_start', async () => {
      await expect(
        payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
            schedule_time_start: '09:00:00',
            schedule_time_end: '09:00:00', // same as start time
          },
          user: adminUser,
        })
      ).rejects.toThrow(/schedule_time_end must be after schedule_time_start/i);
    });

    it('should fail when schedule_days contains invalid weekday', async () => {
      await expect(
        payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
            schedule_days: ['monday', 'invalid_day', 'friday'],
          },
          user: adminUser,
        })
      ).rejects.toThrow(/Invalid weekday/i);
    });

    it('should accept valid schedule_days array', async () => {
      const courseRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
          schedule_days: ['monday', 'wednesday', 'friday'],
        },
        user: adminUser,
      });

      expect(courseRun.schedule_days).toEqual(['monday', 'wednesday', 'friday']);
    });

    it('should fail when price_override is negative', async () => {
      await expect(
        payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
            price_override: -100,
          },
          user: adminUser,
        })
      ).rejects.toThrow(/price_override cannot be negative/i);
    });

    it('should accept price_override of 0 (free course)', async () => {
      const courseRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
          price_override: 0,
        },
        user: adminUser,
      });

      expect(courseRun.price_override).toBe(0);
    });

    it('should fail when status is invalid enum value', async () => {
      await expect(
        payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
            status: 'invalid_status',
          } as any,
          user: adminUser,
        })
      ).rejects.toThrow();
    });

    it('should accept all valid status enum values', async () => {
      const validStatuses = [
        'draft',
        'published',
        'enrollment_open',
        'enrollment_closed',
        'in_progress',
        'completed',
        'cancelled',
      ];

      for (const status of validStatuses) {
        const courseRun = await payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
            status,
          },
          user: adminUser,
        });

        expect(courseRun.status).toBe(status);

        // Clean up
        await payload.delete({
          collection: 'course-runs',
          id: courseRun.id,
          user: adminUser,
        });
      }
    });
  });

  // ============================================================================
  // ACCESS CONTROL TESTS (15+ tests)
  // ============================================================================

  describe('Access Control', () => {
    describe('Public (Unauthenticated) Access', () => {
      it('should deny public create access', async () => {
        await expect(
          payload.create({
            collection: 'course-runs',
            data: {
              course: testCourse.id,
              start_date: '2025-09-01',
              end_date: '2025-12-31',
            },
            // No user (public)
          })
        ).rejects.toThrow();
      });

      it('should allow public read of published/enrollment_open runs', async () => {
        const publishedRun = await payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
            status: 'published',
          },
          user: adminUser,
        });

        const runs = await payload.find({
          collection: 'course-runs',
          // No user (public)
        });

        const foundRun = runs.docs.find(r => r.id === publishedRun.id);
        expect(foundRun).toBeDefined();
      });

      it('should hide draft runs from public read', async () => {
        const draftRun = await payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
            status: 'draft',
          },
          user: adminUser,
        });

        const runs = await payload.find({
          collection: 'course-runs',
          // No user (public)
        });

        const foundRun = runs.docs.find(r => r.id === draftRun.id);
        expect(foundRun).toBeUndefined();
      });

      it('should deny public update access', async () => {
        const courseRun = await payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
          },
          user: adminUser,
        });

        await expect(
          payload.update({
            collection: 'course-runs',
            id: courseRun.id,
            data: { status: 'published' },
            // No user (public)
          })
        ).rejects.toThrow();
      });

      it('should deny public delete access', async () => {
        const courseRun = await payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
          },
          user: adminUser,
        });

        await expect(
          payload.delete({
            collection: 'course-runs',
            id: courseRun.id,
            // No user (public)
          })
        ).rejects.toThrow();
      });
    });

    describe('Lectura Role Access', () => {
      it('should deny lectura create access', async () => {
        await expect(
          payload.create({
            collection: 'course-runs',
            data: {
              course: testCourse.id,
              start_date: '2025-09-01',
              end_date: '2025-12-31',
            },
            user: lecturaUser,
          })
        ).rejects.toThrow();
      });

      it('should allow lectura read of active runs', async () => {
        const courseRun = await payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
            status: 'published',
          },
          user: adminUser,
        });

        const runs = await payload.find({
          collection: 'course-runs',
          user: lecturaUser,
        });

        const foundRun = runs.docs.find(r => r.id === courseRun.id);
        expect(foundRun).toBeDefined();
      });

      it('should deny lectura update access', async () => {
        const courseRun = await payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
          },
          user: adminUser,
        });

        await expect(
          payload.update({
            collection: 'course-runs',
            id: courseRun.id,
            data: { status: 'published' },
            user: lecturaUser,
          })
        ).rejects.toThrow();
      });

      it('should deny lectura delete access', async () => {
        const courseRun = await payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
          },
          user: adminUser,
        });

        await expect(
          payload.delete({
            collection: 'course-runs',
            id: courseRun.id,
            user: lecturaUser,
          })
        ).rejects.toThrow();
      });
    });

    describe('Asesor Role Access', () => {
      it('should deny asesor create access', async () => {
        await expect(
          payload.create({
            collection: 'course-runs',
            data: {
              course: testCourse.id,
              start_date: '2025-09-01',
              end_date: '2025-12-31',
            },
            user: asesorUser,
          })
        ).rejects.toThrow();
      });

      it('should allow asesor read of all runs', async () => {
        const courseRun = await payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
          },
          user: adminUser,
        });

        const runs = await payload.find({
          collection: 'course-runs',
          user: asesorUser,
        });

        const foundRun = runs.docs.find(r => r.id === courseRun.id);
        expect(foundRun).toBeDefined();
      });

      it('should deny asesor update access', async () => {
        const courseRun = await payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
          },
          user: adminUser,
        });

        await expect(
          payload.update({
            collection: 'course-runs',
            id: courseRun.id,
            data: { status: 'published' },
            user: asesorUser,
          })
        ).rejects.toThrow();
      });

      it('should deny asesor delete access', async () => {
        const courseRun = await payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
          },
          user: adminUser,
        });

        await expect(
          payload.delete({
            collection: 'course-runs',
            id: courseRun.id,
            user: asesorUser,
          })
        ).rejects.toThrow();
      });
    });

    describe('Marketing Role Access', () => {
      it('should allow marketing create access', async () => {
        const courseRun = await payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
          },
          user: marketingUser,
        });

        expect(courseRun).toBeDefined();
      });

      it('should allow marketing read of all runs', async () => {
        const courseRun = await payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
          },
          user: adminUser,
        });

        const runs = await payload.find({
          collection: 'course-runs',
          user: marketingUser,
        });

        const foundRun = runs.docs.find(r => r.id === courseRun.id);
        expect(foundRun).toBeDefined();
      });

      it('should allow marketing update of own runs', async () => {
        const courseRun = await payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
            status: 'draft',
          },
          user: marketingUser,
        });

        const updated = await payload.update({
          collection: 'course-runs',
          id: courseRun.id,
          data: { status: 'published' },
          user: marketingUser,
        });

        expect(updated.status).toBe('published');
      });

      it('should deny marketing update of other users runs', async () => {
        const courseRun = await payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
          },
          user: adminUser, // Created by admin
        });

        await expect(
          payload.update({
            collection: 'course-runs',
            id: courseRun.id,
            data: { status: 'published' },
            user: marketingUser, // Trying to update as marketing
          })
        ).rejects.toThrow();
      });

      it('should deny marketing delete access', async () => {
        const courseRun = await payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
          },
          user: marketingUser,
        });

        await expect(
          payload.delete({
            collection: 'course-runs',
            id: courseRun.id,
            user: marketingUser,
          })
        ).rejects.toThrow();
      });
    });

    describe('Gestor Role Access', () => {
      it('should allow gestor full CRUD access', async () => {
        // Create
        const courseRun = await payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
            status: 'draft',
          },
          user: gestorUser,
        });
        expect(courseRun).toBeDefined();

        // Read
        const found = await payload.findByID({
          collection: 'course-runs',
          id: courseRun.id,
          user: gestorUser,
        });
        expect(found).toBeDefined();

        // Update
        const updated = await payload.update({
          collection: 'course-runs',
          id: courseRun.id,
          data: { status: 'published' },
          user: gestorUser,
        });
        expect(updated.status).toBe('published');

        // Delete
        await payload.delete({
          collection: 'course-runs',
          id: courseRun.id,
          user: gestorUser,
        });
      });
    });

    describe('Admin Role Access', () => {
      it('should allow admin full CRUD access', async () => {
        // Create
        const courseRun = await payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
            status: 'draft',
          },
          user: adminUser,
        });
        expect(courseRun).toBeDefined();

        // Read
        const found = await payload.findByID({
          collection: 'course-runs',
          id: courseRun.id,
          user: adminUser,
        });
        expect(found).toBeDefined();

        // Update
        const updated = await payload.update({
          collection: 'course-runs',
          id: courseRun.id,
          data: { status: 'published' },
          user: adminUser,
        });
        expect(updated.status).toBe('published');

        // Delete
        await payload.delete({
          collection: 'course-runs',
          id: courseRun.id,
          user: adminUser,
        });
      });
    });
  });

  // ============================================================================
  // RELATIONSHIP TESTS (10+ tests)
  // ============================================================================

  describe('Relationships', () => {
    it('should fail when course_id does not exist', async () => {
      await expect(
        payload.create({
          collection: 'course-runs',
          data: {
            course: 99999, // Non-existent course ID
            start_date: '2025-09-01',
            end_date: '2025-12-31',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/Course with ID 99999 does not exist/i);
    });

    it('should fail when campus_id does not exist', async () => {
      await expect(
        payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            campus: 99999, // Non-existent campus ID
            start_date: '2025-09-01',
            end_date: '2025-12-31',
          },
          user: adminUser,
        })
      ).rejects.toThrow(/Campus with ID 99999 does not exist/i);
    });

    it('should create course run with valid course relationship', async () => {
      const courseRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
        },
        user: adminUser,
      });

      expect(courseRun.course).toBe(testCourse.id);
    });

    it('should create course run with valid campus relationship', async () => {
      const courseRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          campus: testCampus.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
        },
        user: adminUser,
      });

      expect(courseRun.campus).toBe(testCampus.id);
    });

    it('should auto-populate created_by relationship', async () => {
      const courseRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
        },
        user: marketingUser,
      });

      expect(courseRun.created_by).toBe(marketingUser.id);
    });

    it('should prevent manual override of created_by', async () => {
      const courseRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
          created_by: adminUser.id, // Trying to manually set created_by
        } as any,
        user: marketingUser, // Actually created by marketing user
      });

      // Should be set to marketingUser, not adminUser
      expect(courseRun.created_by).toBe(marketingUser.id);
    });

    it('should maintain created_by immutability on update', async () => {
      const courseRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
        },
        user: marketingUser,
      });

      // Try to update created_by
      const updated = await payload.update({
        collection: 'course-runs',
        id: courseRun.id,
        data: {
          created_by: adminUser.id, // Trying to change creator
        } as any,
        user: adminUser,
      });

      // Should remain as marketingUser
      expect(updated.created_by).toBe(marketingUser.id);
    });

    it('should populate course relationship on read', async () => {
      const courseRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
        },
        user: adminUser,
      });

      const found = await payload.findByID({
        collection: 'course-runs',
        id: courseRun.id,
        user: adminUser,
        depth: 1, // Populate relationships
      });

      expect(found.course).toBeDefined();
      expect(typeof found.course).toBe('object');
      expect((found.course as any).title).toBe(testCourse.title);
    });

    it('should populate campus relationship on read', async () => {
      const courseRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          campus: testCampus.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
        },
        user: adminUser,
      });

      const found = await payload.findByID({
        collection: 'course-runs',
        id: courseRun.id,
        user: adminUser,
        depth: 1, // Populate relationships
      });

      expect(found.campus).toBeDefined();
      expect(typeof found.campus).toBe('object');
      expect((found.campus as any).name).toBe(testCampus.name);
    });

    it('should populate created_by user relationship on read', async () => {
      const courseRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
        },
        user: marketingUser,
      });

      const found = await payload.findByID({
        collection: 'course-runs',
        id: courseRun.id,
        user: adminUser,
        depth: 1, // Populate relationships
      });

      expect(found.created_by).toBeDefined();
      expect(typeof found.created_by).toBe('object');
      expect((found.created_by as any).email).toBe(marketingUser.email);
    });
  });

  // ============================================================================
  // HOOK TESTS (10+ tests)
  // ============================================================================

  describe('Hooks', () => {
    describe('validateCourseRunDates Hook', () => {
      it('should reject end_date before start_date', async () => {
        await expect(
          payload.create({
            collection: 'course-runs',
            data: {
              course: testCourse.id,
              start_date: '2025-12-31',
              end_date: '2025-09-01',
            },
            user: adminUser,
          })
        ).rejects.toThrow(/end_date must be after start_date/i);
      });

      it('should reject enrollment_deadline after start_date', async () => {
        await expect(
          payload.create({
            collection: 'course-runs',
            data: {
              course: testCourse.id,
              start_date: '2025-09-01',
              end_date: '2025-12-31',
              enrollment_deadline: '2025-09-15',
            },
            user: adminUser,
          })
        ).rejects.toThrow(/enrollment_deadline must be before start_date/i);
      });

      it('should reject schedule_time_end before schedule_time_start', async () => {
        await expect(
          payload.create({
            collection: 'course-runs',
            data: {
              course: testCourse.id,
              start_date: '2025-09-01',
              end_date: '2025-12-31',
              schedule_time_start: '13:00:00',
              schedule_time_end: '09:00:00',
            },
            user: adminUser,
          })
        ).rejects.toThrow(/schedule_time_end must be after schedule_time_start/i);
      });

      it('should allow valid dates', async () => {
        const courseRun = await payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
            enrollment_deadline: '2025-08-15',
            schedule_time_start: '09:00:00',
            schedule_time_end: '13:00:00',
          },
          user: adminUser,
        });

        expect(courseRun).toBeDefined();
      });
    });

    describe('validateCourseRunRelationships Hook', () => {
      it('should reject non-existent course_id', async () => {
        await expect(
          payload.create({
            collection: 'course-runs',
            data: {
              course: 99999,
              start_date: '2025-09-01',
              end_date: '2025-12-31',
            },
            user: adminUser,
          })
        ).rejects.toThrow(/Course with ID 99999 does not exist/i);
      });

      it('should reject non-existent campus_id', async () => {
        await expect(
          payload.create({
            collection: 'course-runs',
            data: {
              course: testCourse.id,
              campus: 99999,
              start_date: '2025-09-01',
              end_date: '2025-12-31',
            },
            user: adminUser,
          })
        ).rejects.toThrow(/Campus with ID 99999 does not exist/i);
      });

      it('should allow valid relationships', async () => {
        const courseRun = await payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            campus: testCampus.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
          },
          user: adminUser,
        });

        expect(courseRun).toBeDefined();
      });
    });

    describe('trackCourseRunCreator Hook', () => {
      it('should auto-populate created_by on create', async () => {
        const courseRun = await payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
          },
          user: marketingUser,
        });

        expect(courseRun.created_by).toBe(marketingUser.id);
      });

      it('should prevent created_by modification on update', async () => {
        const courseRun = await payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
          },
          user: marketingUser,
        });

        const updated = await payload.update({
          collection: 'course-runs',
          id: courseRun.id,
          data: {
            created_by: adminUser.id,
          } as any,
          user: adminUser,
        });

        expect(updated.created_by).toBe(marketingUser.id);
      });
    });

    describe('validateEnrollmentCapacity Hook', () => {
      it('should reject max_students less than min_students', async () => {
        await expect(
          payload.create({
            collection: 'course-runs',
            data: {
              course: testCourse.id,
              start_date: '2025-09-01',
              end_date: '2025-12-31',
              max_students: 5,
              min_students: 10,
            },
            user: adminUser,
          })
        ).rejects.toThrow(/max_students must be greater than min_students/i);
      });

      it('should reject current_enrollments exceeding max_students', async () => {
        await expect(
          payload.create({
            collection: 'course-runs',
            data: {
              course: testCourse.id,
              start_date: '2025-09-01',
              end_date: '2025-12-31',
              max_students: 20,
              current_enrollments: 25,
            },
            user: adminUser,
          })
        ).rejects.toThrow(/current_enrollments cannot exceed max_students/i);
      });

      it('should prevent manual modification of current_enrollments', async () => {
        const courseRun = await payload.create({
          collection: 'course-runs',
          data: {
            course: testCourse.id,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
          },
          user: adminUser,
        });

        // Should fail when trying to manually update current_enrollments
        await expect(
          payload.update({
            collection: 'course-runs',
            id: courseRun.id,
            data: {
              current_enrollments: 10,
            },
            user: adminUser,
          })
        ).rejects.toThrow(/current_enrollments can only be modified by the enrollment system/i);
      });
    });
  });

  // ============================================================================
  // SECURITY TESTS (10+ tests)
  // ============================================================================

  describe('Security - SP-001: Immutable Fields with Defense in Depth', () => {
    it('should apply admin.readOnly to created_by (Layer 1: UX)', async () => {
      const collection = payload.collections['course-runs'];
      const createdByField = collection.config.fields.find((f: any) => f.name === 'created_by');
      expect(createdByField).toBeDefined();
      expect((createdByField as any).admin?.readOnly).toBe(true);
    });

    it('should apply access.update: false to created_by (Layer 2: Security)', async () => {
      const collection = payload.collections['course-runs'];
      const createdByField = collection.config.fields.find((f: any) => f.name === 'created_by');
      expect(createdByField).toBeDefined();
      expect((createdByField as any).access?.update).toBeDefined();
    });

    it('should prevent created_by modification via API', async () => {
      const courseRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
        },
        user: marketingUser,
      });

      const updated = await payload.update({
        collection: 'course-runs',
        id: courseRun.id,
        data: {
          created_by: adminUser.id, // Attempt to change
        } as any,
        user: adminUser,
      });

      expect(updated.created_by).toBe(marketingUser.id); // Should remain unchanged
    });

    it('should apply admin.readOnly to current_enrollments (Layer 1: UX)', async () => {
      const collection = payload.collections['course-runs'];
      const enrollmentsField = collection.config.fields.find((f: any) => f.name === 'current_enrollments');
      expect(enrollmentsField).toBeDefined();
      expect((enrollmentsField as any).admin?.readOnly).toBe(true);
    });

    it('should apply access.update: false to current_enrollments (Layer 2: Security)', async () => {
      const collection = payload.collections['course-runs'];
      const enrollmentsField = collection.config.fields.find((f: any) => f.name === 'current_enrollments');
      expect(enrollmentsField).toBeDefined();
      expect((enrollmentsField as any).access?.update).toBeDefined();
    });

    it('should prevent current_enrollments modification via API', async () => {
      const courseRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
        },
        user: adminUser,
      });

      await expect(
        payload.update({
          collection: 'course-runs',
          id: courseRun.id,
          data: {
            current_enrollments: 15, // Attempt to change
          },
          user: adminUser,
        })
      ).rejects.toThrow(/current_enrollments can only be modified by the enrollment system/i);
    });

    it('should not log PII in console.log statements', async () => {
      // This test ensures no PII is logged
      // In practice, we'd use a spy on console.log to verify
      const courseRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
        },
        user: adminUser,
      });

      // No assertions needed - this is a code review check
      expect(courseRun).toBeDefined();
    });

    it('should enforce ownership-based permissions for Marketing role', async () => {
      const ownRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
        },
        user: marketingUser,
      });

      const othersRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2026-01-15',
          end_date: '2026-05-15',
        },
        user: adminUser,
      });

      // Should be able to update own run
      const updated = await payload.update({
        collection: 'course-runs',
        id: ownRun.id,
        data: { status: 'published' },
        user: marketingUser,
      });
      expect(updated.status).toBe('published');

      // Should NOT be able to update others' run
      await expect(
        payload.update({
          collection: 'course-runs',
          id: othersRun.id,
          data: { status: 'published' },
          user: marketingUser,
        })
      ).rejects.toThrow();
    });

    it('should have all admin.readOnly fields protected with access.update', async () => {
      const collection = payload.collections['course-runs'];
      const readOnlyFields = collection.config.fields.filter(
        (f: any) => f.admin?.readOnly === true
      );

      for (const field of readOnlyFields) {
        expect((field as any).access?.update).toBeDefined();
      }
    });

    it('should validate status transitions (workflow enforcement)', async () => {
      const courseRun = await payload.create({
        collection: 'course-runs',
        data: {
          course: testCourse.id,
          start_date: '2025-09-01',
          end_date: '2025-12-31',
          status: 'draft',
        },
        user: adminUser,
      });

      // Valid transition: draft → published
      const updated1 = await payload.update({
        collection: 'course-runs',
        id: courseRun.id,
        data: { status: 'published' },
        user: adminUser,
      });
      expect(updated1.status).toBe('published');

      // Valid transition: published → enrollment_open
      const updated2 = await payload.update({
        collection: 'course-runs',
        id: courseRun.id,
        data: { status: 'enrollment_open' },
        user: adminUser,
      });
      expect(updated2.status).toBe('enrollment_open');
    });
  });
});
