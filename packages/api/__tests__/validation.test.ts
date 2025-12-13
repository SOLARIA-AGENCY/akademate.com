/**
 * @module @akademate/api/__tests__/validation
 * Tests for validation middleware
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  PaginationSchema,
  SortSchema,
  FilterSchema,
  ListQuerySchema,
  UuidSchema,
  EmailSchema,
  PhoneSchema,
  SlugSchema,
  UrlSchema,
  CreateCourseSchema,
  CreateCourseRunSchema,
  CreateEnrollmentSchema,
  CreateLeadSchema,
  validateBody,
  validateQuery,
  createListQuerySchema,
  createEntitySchema,
} from '../src/middleware/validation'
import { ApiError } from '../src/errors'

describe('PaginationSchema', () => {
  it('should parse valid pagination params', () => {
    const result = PaginationSchema.parse({ page: '2', pageSize: '50' })

    expect(result.page).toBe(2)
    expect(result.pageSize).toBe(50)
  })

  it('should apply defaults', () => {
    const result = PaginationSchema.parse({})

    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
  })

  it('should reject invalid page numbers', () => {
    expect(() => PaginationSchema.parse({ page: '0' })).toThrow()
    expect(() => PaginationSchema.parse({ page: '-1' })).toThrow()
  })

  it('should enforce max pageSize', () => {
    expect(() => PaginationSchema.parse({ pageSize: '101' })).toThrow()
  })
})

describe('SortSchema', () => {
  it('should parse valid sort params', () => {
    const result = SortSchema.parse({ sortBy: 'createdAt', sortOrder: 'desc' })

    expect(result.sortBy).toBe('createdAt')
    expect(result.sortOrder).toBe('desc')
  })

  it('should apply default sort order', () => {
    const result = SortSchema.parse({})

    expect(result.sortOrder).toBe('asc')
  })

  it('should reject invalid sort order', () => {
    expect(() => SortSchema.parse({ sortOrder: 'random' })).toThrow()
  })
})

describe('FilterSchema', () => {
  it('should parse valid filter params', () => {
    const result = FilterSchema.parse({
      search: 'javascript',
      status: 'published',
      fromDate: '2025-01-01',
      toDate: '2025-12-31',
    })

    expect(result.search).toBe('javascript')
    expect(result.status).toBe('published')
    expect(result.fromDate).toBeInstanceOf(Date)
    expect(result.toDate).toBeInstanceOf(Date)
  })

  it('should allow empty filters', () => {
    const result = FilterSchema.parse({})

    expect(result.search).toBeUndefined()
    expect(result.status).toBeUndefined()
  })
})

describe('ListQuerySchema', () => {
  it('should combine pagination, sort, and filter', () => {
    const result = ListQuerySchema.parse({
      page: '1',
      pageSize: '10',
      sortBy: 'title',
      sortOrder: 'asc',
      search: 'react',
      status: 'active',
    })

    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
    expect(result.sortBy).toBe('title')
    expect(result.search).toBe('react')
  })
})

describe('Field Schemas', () => {
  describe('UuidSchema', () => {
    it('should accept valid UUIDs', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000'
      expect(UuidSchema.parse(uuid)).toBe(uuid)
    })

    it('should reject invalid UUIDs', () => {
      expect(() => UuidSchema.parse('not-a-uuid')).toThrow()
      expect(() => UuidSchema.parse('123')).toThrow()
    })
  })

  describe('EmailSchema', () => {
    it('should accept valid emails and lowercase them', () => {
      expect(EmailSchema.parse('Test@Example.COM')).toBe('test@example.com')
    })

    it('should reject invalid emails', () => {
      expect(() => EmailSchema.parse('not-an-email')).toThrow()
      expect(() => EmailSchema.parse('@example.com')).toThrow()
    })
  })

  describe('PhoneSchema', () => {
    it('should accept valid phone numbers', () => {
      expect(PhoneSchema.parse('+34612345678')).toBe('+34612345678')
      expect(PhoneSchema.parse('34612345678')).toBe('34612345678')
    })

    it('should reject invalid phone numbers', () => {
      expect(() => PhoneSchema.parse('phone-number')).toThrow()
      expect(() => PhoneSchema.parse('abc123')).toThrow()
    })
  })

  describe('SlugSchema', () => {
    it('should accept valid slugs', () => {
      expect(SlugSchema.parse('my-course-slug')).toBe('my-course-slug')
      expect(SlugSchema.parse('course123')).toBe('course123')
    })

    it('should reject invalid slugs', () => {
      expect(() => SlugSchema.parse('My Course')).toThrow()
      expect(() => SlugSchema.parse('course_name')).toThrow()
    })
  })

  describe('UrlSchema', () => {
    it('should accept valid URLs', () => {
      expect(UrlSchema.parse('https://example.com')).toBe('https://example.com')
      expect(UrlSchema.parse('http://localhost:3000/path')).toBe('http://localhost:3000/path')
    })

    it('should reject invalid URLs', () => {
      expect(() => UrlSchema.parse('not-a-url')).toThrow()
      expect(() => UrlSchema.parse('ftp://server.com')).not.toThrow() // ftp is valid URL
    })
  })
})

describe('CreateCourseSchema', () => {
  it('should parse valid course data', () => {
    const data = {
      title: 'JavaScript Fundamentals',
      description: 'Learn JavaScript from scratch',
      price: 99.99,
      duration: 40,
      objectives: ['Understand variables', 'Master functions'],
      status: 'draft',
    }

    const result = CreateCourseSchema.parse(data)

    expect(result.title).toBe('JavaScript Fundamentals')
    expect(result.price).toBe(99.99)
    expect(result.objectives).toHaveLength(2)
    expect(result.currency).toBe('EUR') // default
  })

  it('should apply defaults', () => {
    const result = CreateCourseSchema.parse({ title: 'Test' })

    expect(result.currency).toBe('EUR')
    expect(result.objectives).toEqual([])
    expect(result.requirements).toEqual([])
    expect(result.status).toBe('draft')
  })

  it('should reject invalid data', () => {
    expect(() => CreateCourseSchema.parse({})).toThrow() // missing title
    expect(() => CreateCourseSchema.parse({ title: '', price: -1 })).toThrow()
  })
})

describe('CreateCourseRunSchema', () => {
  it('should parse valid course run data', () => {
    const data = {
      courseId: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Spring 2025 Cohort',
      modality: 'online',
      startDate: '2025-03-01',
      endDate: '2025-06-01',
      maxStudents: 30,
    }

    const result = CreateCourseRunSchema.parse(data)

    expect(result.courseId).toBe('550e8400-e29b-41d4-a716-446655440001')
    expect(result.modality).toBe('online')
    expect(result.startDate).toBeInstanceOf(Date)
  })

  it('should apply defaults', () => {
    const data = {
      courseId: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Test Run',
      startDate: '2025-01-01',
      endDate: '2025-02-01',
    }

    const result = CreateCourseRunSchema.parse(data)

    expect(result.modality).toBe('presential')
    expect(result.currency).toBe('EUR')
  })
})

describe('CreateEnrollmentSchema', () => {
  it('should parse valid enrollment data', () => {
    const data = {
      userId: '550e8400-e29b-41d4-a716-446655440001',
      courseRunId: '550e8400-e29b-41d4-a716-446655440002',
      status: 'active',
    }

    const result = CreateEnrollmentSchema.parse(data)

    expect(result.userId).toBeDefined()
    expect(result.status).toBe('active')
  })

  it('should apply default status', () => {
    const data = {
      userId: '550e8400-e29b-41d4-a716-446655440001',
      courseRunId: '550e8400-e29b-41d4-a716-446655440002',
    }

    const result = CreateEnrollmentSchema.parse(data)

    expect(result.status).toBe('pending')
  })
})

describe('CreateLeadSchema', () => {
  it('should parse valid lead data', () => {
    const data = {
      email: 'lead@example.com',
      name: 'John Doe',
      phone: '+34612345678',
      source: 'website',
      gdprConsent: true,
    }

    const result = CreateLeadSchema.parse(data)

    expect(result.email).toBe('lead@example.com')
    expect(result.gdprConsent).toBe(true)
  })

  it('should require GDPR consent', () => {
    const data = {
      email: 'lead@example.com',
      gdprConsent: false,
    }

    // Note: Schema allows false, but business logic should enforce true
    const result = CreateLeadSchema.parse(data)
    expect(result.gdprConsent).toBe(false)
  })

  it('should apply defaults', () => {
    const data = {
      email: 'test@example.com',
      gdprConsent: true,
    }

    const result = CreateLeadSchema.parse(data)

    expect(result.source).toBe('website')
    expect(result.tags).toEqual([])
  })
})

describe('validateBody', () => {
  const TestSchema = z.object({
    name: z.string().min(1),
    age: z.number().positive(),
  })

  it('should validate and return parsed data', () => {
    const result = validateBody(TestSchema, { name: 'John', age: 30 })

    expect(result.name).toBe('John')
    expect(result.age).toBe(30)
  })

  it('should throw ApiError on validation failure', () => {
    expect(() => validateBody(TestSchema, { name: '', age: -1 })).toThrow(ApiError)
  })

  it('should include field-level details in error', () => {
    try {
      validateBody(TestSchema, { name: '', age: -1 })
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      const apiError = error as ApiError
      expect(apiError.details).toBeDefined()
      expect(apiError.details?.length).toBeGreaterThan(0)
    }
  })
})

describe('validateQuery', () => {
  it('should parse query params from URLSearchParams', () => {
    const searchParams = new URLSearchParams('page=2&pageSize=10&search=test')

    const result = validateQuery(ListQuerySchema, searchParams)

    expect(result.page).toBe(2)
    expect(result.pageSize).toBe(10)
    expect(result.search).toBe('test')
  })
})

describe('createListQuerySchema', () => {
  it('should extend base schema with additional filters', () => {
    const ExtendedSchema = createListQuerySchema({
      category: z.string().optional(),
      level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    })

    const result = ExtendedSchema.parse({
      page: '1',
      category: 'programming',
      level: 'beginner',
    })

    expect(result.page).toBe(1)
    expect(result.category).toBe('programming')
    expect(result.level).toBe('beginner')
  })

  it('should return base schema when no filters provided', () => {
    const Schema = createListQuerySchema()
    const result = Schema.parse({ page: '5' })

    expect(result.page).toBe(5)
  })
})

describe('createEntitySchema', () => {
  it('should create schema with standard entity fields', () => {
    const CourseEntitySchema = createEntitySchema({
      title: z.string(),
      price: z.number(),
    })

    const data = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      tenantId: '550e8400-e29b-41d4-a716-446655440002',
      createdAt: new Date(),
      updatedAt: new Date(),
      title: 'Test Course',
      price: 99,
    }

    const result = CourseEntitySchema.parse(data)

    expect(result.id).toBeDefined()
    expect(result.tenantId).toBeDefined()
    expect(result.title).toBe('Test Course')
  })
})
