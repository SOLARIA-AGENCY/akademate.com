/**
 * @module @akademate/lms/__tests__/content
 * Tests for ContentService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  ContentService,
  ContentServiceError,
  type ContentRepository,
  type CreateModuleInput,
  type CreateLessonInput,
  type CreateResourceInput,
} from '../src/content'
import type { Module, Lesson, Resource } from '../src/types'

// Mock repository factory
function createMockRepository(): ContentRepository {
  const modules = new Map<string, Module>()
  const lessons = new Map<string, Lesson>()
  const resources = new Map<string, Resource>()

  return {
    // Modules
    createModule: vi.fn(async (input) => {
      const module = input as Module
      modules.set(module.id, module)
      return module
    }),
    getModule: vi.fn(async (tenantId, moduleId) => {
      const module = modules.get(moduleId)
      return module?.tenantId === tenantId ? module : null
    }),
    getModules: vi.fn(async (tenantId) => {
      return Array.from(modules.values()).filter((m) => m.tenantId === tenantId)
    }),
    getModulesByCourseRun: vi.fn(async (tenantId, courseRunId) => {
      return Array.from(modules.values())
        .filter((m) => m.tenantId === tenantId && m.courseRunId === courseRunId)
        .sort((a, b) => a.order - b.order)
    }),
    updateModule: vi.fn(async (tenantId, moduleId, input) => {
      const existing = modules.get(moduleId)
      if (!existing || existing.tenantId !== tenantId) throw new Error('Not found')
      const updated = { ...existing, ...input }
      modules.set(moduleId, updated)
      return updated
    }),
    deleteModule: vi.fn(async (tenantId, moduleId) => {
      const existing = modules.get(moduleId)
      if (!existing || existing.tenantId !== tenantId) throw new Error('Not found')
      modules.delete(moduleId)
    }),
    reorderModules: vi.fn(async (tenantId, courseRunId, moduleIds) => {
      moduleIds.forEach((id, index) => {
        const module = modules.get(id)
        if (module) {
          modules.set(id, { ...module, order: index })
        }
      })
    }),

    // Lessons
    createLesson: vi.fn(async (input) => {
      const lesson = input as Lesson
      lessons.set(lesson.id, lesson)
      return lesson
    }),
    getLesson: vi.fn(async (tenantId, lessonId) => {
      const lesson = lessons.get(lessonId)
      return lesson?.tenantId === tenantId ? lesson : null
    }),
    getLessons: vi.fn(async (tenantId) => {
      return Array.from(lessons.values()).filter((l) => l.tenantId === tenantId)
    }),
    getLessonsByModule: vi.fn(async (tenantId, moduleId) => {
      return Array.from(lessons.values())
        .filter((l) => l.tenantId === tenantId && l.moduleId === moduleId)
        .sort((a, b) => a.order - b.order)
    }),
    updateLesson: vi.fn(async (tenantId, lessonId, input) => {
      const existing = lessons.get(lessonId)
      if (!existing || existing.tenantId !== tenantId) throw new Error('Not found')
      const updated = { ...existing, ...input }
      lessons.set(lessonId, updated)
      return updated
    }),
    deleteLesson: vi.fn(async (tenantId, lessonId) => {
      const existing = lessons.get(lessonId)
      if (!existing || existing.tenantId !== tenantId) throw new Error('Not found')
      lessons.delete(lessonId)
    }),
    reorderLessons: vi.fn(async (tenantId, moduleId, lessonIds) => {
      lessonIds.forEach((id, index) => {
        const lesson = lessons.get(id)
        if (lesson) {
          lessons.set(id, { ...lesson, order: index })
        }
      })
    }),

    // Resources
    createResource: vi.fn(async (input) => {
      const resource = input as Resource
      resources.set(resource.id, resource)
      return resource
    }),
    getResource: vi.fn(async (tenantId, resourceId) => {
      const resource = resources.get(resourceId)
      return resource?.tenantId === tenantId ? resource : null
    }),
    getResources: vi.fn(async (tenantId) => {
      return Array.from(resources.values()).filter((r) => r.tenantId === tenantId)
    }),
    getResourcesByLesson: vi.fn(async (tenantId, lessonId) => {
      return Array.from(resources.values())
        .filter((r) => r.tenantId === tenantId && r.lessonId === lessonId)
        .sort((a, b) => a.order - b.order)
    }),
    updateResource: vi.fn(async (tenantId, resourceId, input) => {
      const existing = resources.get(resourceId)
      if (!existing || existing.tenantId !== tenantId) throw new Error('Not found')
      const updated = { ...existing, ...input }
      resources.set(resourceId, updated)
      return updated
    }),
    deleteResource: vi.fn(async (tenantId, resourceId) => {
      const existing = resources.get(resourceId)
      if (!existing || existing.tenantId !== tenantId) throw new Error('Not found')
      resources.delete(resourceId)
    }),
    reorderResources: vi.fn(async (tenantId, lessonId, resourceIds) => {
      resourceIds.forEach((id, index) => {
        const resource = resources.get(id)
        if (resource) {
          resources.set(id, { ...resource, order: index })
        }
      })
    }),
  }
}

describe('ContentService', () => {
  let service: ContentService
  let repository: ContentRepository

  const tenantId = 1
  const courseRunId = '550e8400-e29b-41d4-a716-446655440000'

  beforeEach(() => {
    repository = createMockRepository()
    service = new ContentService(repository)
  })

  describe('Module Operations', () => {
    const moduleInput: CreateModuleInput = {
      tenantId,
      courseRunId,
      title: 'Introduction to Programming',
      description: 'Learn the basics',
      order: 0,
      status: 'draft',
      estimatedMinutes: 60,
      metadata: {},
    }

    it('should create a module', async () => {
      const module = await service.createModule(moduleInput)

      expect(module).toBeDefined()
      expect(module.id).toBeDefined()
      expect(module.title).toBe('Introduction to Programming')
      expect(module.tenantId).toBe(tenantId)
      expect(repository.createModule).toHaveBeenCalled()
    })

    it('should get a module by id', async () => {
      const created = await service.createModule(moduleInput)
      const fetched = await service.getModule(tenantId, created.id)

      expect(fetched).toBeDefined()
      expect(fetched.id).toBe(created.id)
    })

    it('should throw MODULE_NOT_FOUND for non-existent module', async () => {
      await expect(
        service.getModule(tenantId, '550e8400-e29b-41d4-a716-446655440099')
      ).rejects.toThrow(ContentServiceError)
    })

    it('should update a module', async () => {
      const created = await service.createModule(moduleInput)
      const updated = await service.updateModule(tenantId, created.id, {
        title: 'Updated Title',
      })

      expect(updated.title).toBe('Updated Title')
    })

    it('should publish a module', async () => {
      const created = await service.createModule(moduleInput)
      const published = await service.publishModule(tenantId, created.id)

      expect(published.status).toBe('published')
    })

    it('should archive a module', async () => {
      const created = await service.createModule(moduleInput)
      const archived = await service.archiveModule(tenantId, created.id)

      expect(archived.status).toBe('archived')
    })

    it('should delete a module', async () => {
      const created = await service.createModule(moduleInput)
      await service.deleteModule(tenantId, created.id)

      await expect(service.getModule(tenantId, created.id)).rejects.toThrow(
        ContentServiceError
      )
    })

    it('should prevent deleting a module with dependents', async () => {
      const module1 = await service.createModule(moduleInput)
      await service.createModule({
        ...moduleInput,
        title: 'Advanced Programming',
        prerequisiteModuleId: module1.id,
      })

      await expect(service.deleteModule(tenantId, module1.id)).rejects.toThrow(
        ContentServiceError
      )
    })

    it('should prevent circular prerequisite', async () => {
      const module1 = await service.createModule(moduleInput)

      await expect(
        service.updateModule(tenantId, module1.id, {
          prerequisiteModuleId: module1.id,
        })
      ).rejects.toThrow(ContentServiceError)
    })

    it('should validate prerequisite exists', async () => {
      await expect(
        service.createModule({
          ...moduleInput,
          prerequisiteModuleId: '550e8400-e29b-41d4-a716-446655440099',
        })
      ).rejects.toThrow(ContentServiceError)
    })
  })

  describe('Lesson Operations', () => {
    let moduleId: string

    beforeEach(async () => {
      const module = await service.createModule({
        tenantId,
        courseRunId,
        title: 'Test Module',
        order: 0,
        metadata: {},
      })
      moduleId = module.id
    })

    const getLessonInput = (): CreateLessonInput => ({
      tenantId,
      moduleId: '', // Will be set in tests
      title: 'Variables and Data Types',
      description: 'Learn about variables',
      content: '<p>Lesson content here</p>',
      order: 0,
      status: 'draft',
      estimatedMinutes: 15,
      isMandatory: true,
      metadata: {},
    })

    it('should create a lesson', async () => {
      const input = { ...getLessonInput(), moduleId }
      const lesson = await service.createLesson(input)

      expect(lesson).toBeDefined()
      expect(lesson.id).toBeDefined()
      expect(lesson.title).toBe('Variables and Data Types')
      expect(lesson.moduleId).toBe(moduleId)
    })

    it('should throw if parent module does not exist', async () => {
      const input = {
        ...getLessonInput(),
        moduleId: '550e8400-e29b-41d4-a716-446655440099',
      }

      await expect(service.createLesson(input)).rejects.toThrow(ContentServiceError)
    })

    it('should get a lesson by id', async () => {
      const input = { ...getLessonInput(), moduleId }
      const created = await service.createLesson(input)
      const fetched = await service.getLesson(tenantId, created.id)

      expect(fetched).toBeDefined()
      expect(fetched.id).toBe(created.id)
    })

    it('should get lesson with resources', async () => {
      const input = { ...getLessonInput(), moduleId }
      const lesson = await service.createLesson(input)

      const withResources = await service.getLessonWithResources(tenantId, lesson.id)

      expect(withResources).toBeDefined()
      expect(withResources.resources).toBeDefined()
      expect(Array.isArray(withResources.resources)).toBe(true)
    })

    it('should update a lesson', async () => {
      const input = { ...getLessonInput(), moduleId }
      const created = await service.createLesson(input)
      const updated = await service.updateLesson(tenantId, created.id, {
        title: 'Updated Lesson Title',
      })

      expect(updated.title).toBe('Updated Lesson Title')
    })

    it('should publish a lesson', async () => {
      const input = { ...getLessonInput(), moduleId }
      const created = await service.createLesson(input)
      const published = await service.publishLesson(tenantId, created.id)

      expect(published.status).toBe('published')
    })
  })

  describe('Resource Operations', () => {
    let moduleId: string
    let lessonId: string

    beforeEach(async () => {
      const module = await service.createModule({
        tenantId,
        courseRunId,
        title: 'Test Module',
        order: 0,
        metadata: {},
      })
      moduleId = module.id

      const lesson = await service.createLesson({
        tenantId,
        moduleId,
        title: 'Test Lesson',
        order: 0,
        metadata: {},
      })
      lessonId = lesson.id
    })

    const getResourceInput = (): CreateResourceInput => ({
      tenantId,
      lessonId: '', // Will be set in tests
      title: 'Introduction Video',
      type: 'video',
      url: 'https://example.com/video.mp4',
      durationSeconds: 600,
      order: 0,
      isRequired: false,
      metadata: {},
    })

    it('should create a resource', async () => {
      const input = { ...getResourceInput(), lessonId }
      const resource = await service.createResource(input)

      expect(resource).toBeDefined()
      expect(resource.id).toBeDefined()
      expect(resource.title).toBe('Introduction Video')
      expect(resource.type).toBe('video')
    })

    it('should throw if parent lesson does not exist', async () => {
      const input = {
        ...getResourceInput(),
        lessonId: '550e8400-e29b-41d4-a716-446655440099',
      }

      await expect(service.createResource(input)).rejects.toThrow(ContentServiceError)
    })

    it('should enforce resource type restrictions', async () => {
      const restrictedService = new ContentService(repository, {
        allowedResourceTypes: ['video', 'document'],
      })

      const input = {
        ...getResourceInput(),
        lessonId,
        type: 'quiz' as const,
      }

      await expect(restrictedService.createResource(input)).rejects.toThrow(ContentServiceError)
    })

    it('should enforce resource size limits', async () => {
      const smallLimitService = new ContentService(repository, {
        maxResourceSizeBytes: 1000,
      })

      const input = {
        ...getResourceInput(),
        lessonId,
        sizeBytes: 5000,
      }

      await expect(smallLimitService.createResource(input)).rejects.toThrow(ContentServiceError)
    })

    it('should update a resource', async () => {
      const input = { ...getResourceInput(), lessonId }
      const created = await service.createResource(input)
      const updated = await service.updateResource(tenantId, created.id, {
        title: 'Updated Resource Title',
      })

      expect(updated.title).toBe('Updated Resource Title')
    })

    it('should delete a resource', async () => {
      const input = { ...getResourceInput(), lessonId }
      const created = await service.createResource(input)
      await service.deleteResource(tenantId, created.id)

      await expect(service.getResource(tenantId, created.id)).rejects.toThrow(
        ContentServiceError
      )
    })
  })

  describe('Course Content', () => {
    it('should get full course content with nested structure', async () => {
      // Create module
      const module = await service.createModule({
        tenantId,
        courseRunId,
        title: 'Module 1',
        order: 0,
        metadata: {},
      })

      // Create lesson
      const lesson = await service.createLesson({
        tenantId,
        moduleId: module.id,
        title: 'Lesson 1',
        order: 0,
        metadata: {},
      })

      // Create resource
      await service.createResource({
        tenantId,
        lessonId: lesson.id,
        title: 'Resource 1',
        type: 'video',
        order: 0,
        metadata: {},
      })

      const content = await service.getCourseContent(tenantId, courseRunId)

      expect(content).toHaveLength(1)
      expect(content[0].title).toBe('Module 1')
      expect(content[0].lessons).toHaveLength(1)
      expect(content[0].lessons[0].title).toBe('Lesson 1')
      expect(content[0].lessons[0].resources).toHaveLength(1)
    })
  })

  describe('Course Statistics', () => {
    it('should calculate course statistics', async () => {
      // Create modules
      const module1 = await service.createModule({
        tenantId,
        courseRunId,
        title: 'Module 1',
        order: 0,
        status: 'published',
        estimatedMinutes: 30,
        metadata: {},
      })

      const module2 = await service.createModule({
        tenantId,
        courseRunId,
        title: 'Module 2',
        order: 1,
        status: 'draft',
        estimatedMinutes: 45,
        metadata: {},
      })

      // Create lessons
      await service.createLesson({
        tenantId,
        moduleId: module1.id,
        title: 'Lesson 1.1',
        order: 0,
        status: 'published',
        estimatedMinutes: 15,
        metadata: {},
      })

      await service.createLesson({
        tenantId,
        moduleId: module2.id,
        title: 'Lesson 2.1',
        order: 0,
        status: 'draft',
        metadata: {},
      })

      const stats = await service.getCourseStatistics(tenantId, courseRunId)

      expect(stats.totalModules).toBe(2)
      expect(stats.publishedModules).toBe(1)
      expect(stats.totalLessons).toBe(2)
      expect(stats.publishedLessons).toBe(1)
      expect(stats.totalEstimatedMinutes).toBeGreaterThan(0)
    })
  })

  describe('Reordering', () => {
    it('should reorder modules', async () => {
      const module1 = await service.createModule({
        tenantId,
        courseRunId,
        title: 'Module 1',
        order: 0,
        metadata: {},
      })

      const module2 = await service.createModule({
        tenantId,
        courseRunId,
        title: 'Module 2',
        order: 1,
        metadata: {},
      })

      // Reorder: module2 first, then module1
      await service.reorderModules(tenantId, courseRunId, [module2.id, module1.id])

      expect(repository.reorderModules).toHaveBeenCalledWith(tenantId, courseRunId, [
        module2.id,
        module1.id,
      ])
    })

    it('should throw if module does not belong to course', async () => {
      const module1 = await service.createModule({
        tenantId,
        courseRunId,
        title: 'Module 1',
        order: 0,
        metadata: {},
      })

      await expect(
        service.reorderModules(tenantId, courseRunId, [
          module1.id,
          '550e8400-e29b-41d4-a716-446655440099', // Non-existent
        ])
      ).rejects.toThrow(ContentServiceError)
    })
  })
})
