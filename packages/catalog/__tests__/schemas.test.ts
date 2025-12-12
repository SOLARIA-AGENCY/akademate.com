/**
 * @module @akademate/catalog/__tests__/schemas
 * Tests for Zod validation schemas
 */

import { describe, it, expect } from 'vitest'
import {
  CourseSchema,
  CycleSchema,
  CenterSchema,
  InstructorSchema,
  CourseRunSchema,
} from '../src/index.js'

describe('Catalog Validation Schemas', () => {
  const validTenantId = '123e4567-e89b-12d3-a456-426614174000'
  const validCourseId = '123e4567-e89b-12d3-a456-426614174001'

  // ============================================================================
  // Course Schema Tests
  // ============================================================================

  describe('CourseSchema', () => {
    it('should validate minimal valid course', () => {
      const result = CourseSchema.safeParse({
        tenantId: validTenantId,
        title: 'Desarrollo de Aplicaciones Web',
        slug: 'desarrollo-aplicaciones-web',
      })
      expect(result.success).toBe(true)
    })

    it('should validate full course with all fields', () => {
      const result = CourseSchema.safeParse({
        tenantId: validTenantId,
        title: 'Desarrollo de Aplicaciones Web',
        slug: 'desarrollo-aplicaciones-web',
        description: 'Aprende a desarrollar aplicaciones web modernas',
        shortDescription: 'Curso de desarrollo web',
        status: 'draft',
        featuredImage: 'https://example.com/image.jpg',
        duration: 2000,
        price: 1500.00,
        currency: 'EUR',
        objectives: ['Dominar React', 'Aprender Node.js'],
        requirements: ['JavaScript básico'],
        targetAudience: 'Desarrolladores junior',
        seoTitle: 'Curso DAW - Aprende Desarrollo Web',
        seoDescription: 'El mejor curso de desarrollo web',
        seoKeywords: ['desarrollo web', 'react', 'node'],
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty title', () => {
      const result = CourseSchema.safeParse({
        tenantId: validTenantId,
        title: '',
        slug: 'test',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid slug format', () => {
      const result = CourseSchema.safeParse({
        tenantId: validTenantId,
        title: 'Test',
        slug: 'Invalid Slug With Spaces',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid UUID for tenantId', () => {
      const result = CourseSchema.safeParse({
        tenantId: 'not-a-uuid',
        title: 'Test',
        slug: 'test',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid status', () => {
      const result = CourseSchema.safeParse({
        tenantId: validTenantId,
        title: 'Test',
        slug: 'test',
        status: 'invalid-status',
      })
      expect(result.success).toBe(false)
    })

    it('should reject negative price', () => {
      const result = CourseSchema.safeParse({
        tenantId: validTenantId,
        title: 'Test',
        slug: 'test',
        price: -100,
      })
      expect(result.success).toBe(false)
    })

    it('should apply defaults', () => {
      const result = CourseSchema.parse({
        tenantId: validTenantId,
        title: 'Test',
        slug: 'test',
      })
      expect(result.status).toBe('draft')
      expect(result.currency).toBe('EUR')
      expect(result.objectives).toEqual([])
      expect(result.requirements).toEqual([])
    })
  })

  // ============================================================================
  // Cycle Schema Tests
  // ============================================================================

  describe('CycleSchema', () => {
    it('should validate minimal cycle', () => {
      const result = CycleSchema.safeParse({
        tenantId: validTenantId,
        name: 'Desarrollo de Aplicaciones Web',
        slug: 'daw',
      })
      expect(result.success).toBe(true)
    })

    it('should validate full cycle', () => {
      const result = CycleSchema.safeParse({
        tenantId: validTenantId,
        name: 'Desarrollo de Aplicaciones Web',
        slug: 'daw',
        description: 'Ciclo formativo de grado superior',
        level: 'Grado Superior',
        duration: 2000,
      })
      expect(result.success).toBe(true)
    })

    it('should reject negative duration', () => {
      const result = CycleSchema.safeParse({
        tenantId: validTenantId,
        name: 'Test',
        slug: 'test',
        duration: -100,
      })
      expect(result.success).toBe(false)
    })
  })

  // ============================================================================
  // Center Schema Tests
  // ============================================================================

  describe('CenterSchema', () => {
    it('should validate minimal center', () => {
      const result = CenterSchema.safeParse({
        tenantId: validTenantId,
        name: 'Campus Madrid',
        slug: 'campus-madrid',
      })
      expect(result.success).toBe(true)
    })

    it('should validate full center with coordinates', () => {
      const result = CenterSchema.safeParse({
        tenantId: validTenantId,
        name: 'Campus Madrid',
        slug: 'campus-madrid',
        address: 'Calle Mayor 1',
        city: 'Madrid',
        postalCode: '28001',
        country: 'ES',
        phone: '+34912345678',
        email: 'madrid@akademate.com',
        coordinates: { lat: 40.4168, lng: -3.7038 },
        capacity: 500,
        facilities: ['parking', 'wifi', 'cafeteria'],
        isActive: true,
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid coordinates', () => {
      const result = CenterSchema.safeParse({
        tenantId: validTenantId,
        name: 'Test',
        slug: 'test',
        coordinates: { lat: 200, lng: -3.7 }, // lat out of range
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid country code', () => {
      const result = CenterSchema.safeParse({
        tenantId: validTenantId,
        name: 'Test',
        slug: 'test',
        country: 'Spain', // Should be 2-letter code
      })
      expect(result.success).toBe(false)
    })

    it('should apply defaults', () => {
      const result = CenterSchema.parse({
        tenantId: validTenantId,
        name: 'Test',
        slug: 'test',
      })
      expect(result.country).toBe('ES')
      expect(result.isActive).toBe(true)
      expect(result.facilities).toEqual([])
    })
  })

  // ============================================================================
  // Instructor Schema Tests
  // ============================================================================

  describe('InstructorSchema', () => {
    it('should validate minimal instructor', () => {
      const result = InstructorSchema.safeParse({
        tenantId: validTenantId,
        name: 'Juan Garcia',
        email: 'juan@akademate.com',
      })
      expect(result.success).toBe(true)
    })

    it('should validate full instructor', () => {
      const result = InstructorSchema.safeParse({
        tenantId: validTenantId,
        userId: '123e4567-e89b-12d3-a456-426614174002',
        name: 'Juan Garcia',
        email: 'juan@akademate.com',
        phone: '+34600123456',
        bio: 'Experto en desarrollo web con 10 años de experiencia',
        specializations: ['React', 'Node.js', 'TypeScript'],
        avatar: 'https://example.com/avatar.jpg',
        isActive: true,
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = InstructorSchema.safeParse({
        tenantId: validTenantId,
        name: 'Test',
        email: 'not-an-email',
      })
      expect(result.success).toBe(false)
    })
  })

  // ============================================================================
  // Course Run Schema Tests
  // ============================================================================

  describe('CourseRunSchema', () => {
    it('should validate minimal course run', () => {
      const result = CourseRunSchema.safeParse({
        tenantId: validTenantId,
        courseId: validCourseId,
        name: 'DAW 2025-01',
      })
      expect(result.success).toBe(true)
    })

    it('should validate full course run', () => {
      const result = CourseRunSchema.safeParse({
        tenantId: validTenantId,
        courseId: validCourseId,
        cycleId: '123e4567-e89b-12d3-a456-426614174003',
        centerId: '123e4567-e89b-12d3-a456-426614174004',
        instructorId: '123e4567-e89b-12d3-a456-426614174005',
        name: 'DAW 2025-01 Madrid',
        modality: 'hybrid',
        status: 'enrolling',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-06-30'),
        enrollmentDeadline: new Date('2025-01-15'),
        maxStudents: 30,
        minStudents: 10,
        price: 3500.00,
        currency: 'EUR',
        schedule: {
          monday: ['09:00-14:00'],
          wednesday: ['09:00-14:00'],
          friday: ['09:00-14:00'],
        },
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid modality', () => {
      const result = CourseRunSchema.safeParse({
        tenantId: validTenantId,
        courseId: validCourseId,
        name: 'Test',
        modality: 'invalid',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid status', () => {
      const result = CourseRunSchema.safeParse({
        tenantId: validTenantId,
        courseId: validCourseId,
        name: 'Test',
        status: 'invalid',
      })
      expect(result.success).toBe(false)
    })

    it('should apply defaults', () => {
      const result = CourseRunSchema.parse({
        tenantId: validTenantId,
        courseId: validCourseId,
        name: 'Test',
      })
      expect(result.modality).toBe('presential')
      expect(result.status).toBe('scheduled')
      expect(result.currency).toBe('EUR')
      expect(result.schedule).toEqual({})
    })
  })
})
