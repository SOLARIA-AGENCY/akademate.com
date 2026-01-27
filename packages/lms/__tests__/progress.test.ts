/**
 * @module @akademate/lms/__tests__/progress
 * Tests for ProgressService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  ProgressService,
  type ProgressRepository,
} from '../src/progress'
import type { ContentRepository } from '../src/content'
import type { LessonProgress, ResourceProgress, Module, Lesson, Resource } from '../src/types'

// Mock content repository
function createMockContentRepository(): ContentRepository {
  const modules: Module[] = [
    {
      id: 'module-1',
      tenantId: 1,
      courseRunId: 'course-1',
      title: 'Module 1',
      order: 0,
      status: 'published',
      estimatedMinutes: 60,
      metadata: {},
    },
    {
      id: 'module-2',
      tenantId: 1,
      courseRunId: 'course-1',
      title: 'Module 2',
      order: 1,
      status: 'published',
      estimatedMinutes: 45,
      metadata: {},
    },
  ]

  const lessons: Lesson[] = [
    {
      id: 'lesson-1',
      tenantId: 1,
      moduleId: 'module-1',
      title: 'Lesson 1',
      order: 0,
      status: 'published',
      estimatedMinutes: 20,
      isMandatory: true,
      metadata: {},
    },
    {
      id: 'lesson-2',
      tenantId: 1,
      moduleId: 'module-1',
      title: 'Lesson 2',
      order: 1,
      status: 'published',
      estimatedMinutes: 25,
      isMandatory: true,
      metadata: {},
    },
    {
      id: 'lesson-3',
      tenantId: 1,
      moduleId: 'module-2',
      title: 'Lesson 3',
      order: 0,
      status: 'published',
      estimatedMinutes: 30,
      isMandatory: true,
      metadata: {},
    },
  ]

  const resources: Resource[] = [
    {
      id: 'resource-1',
      tenantId: 1,
      lessonId: 'lesson-1',
      title: 'Video 1',
      type: 'video',
      order: 0,
      isRequired: true,
      metadata: {},
    },
    {
      id: 'resource-2',
      tenantId: 1,
      lessonId: 'lesson-1',
      title: 'Quiz 1',
      type: 'quiz',
      order: 1,
      isRequired: true,
      metadata: {},
    },
  ]

  return {
    getModule: vi.fn(async (tenantId, moduleId) => modules.find((m) => m.id === moduleId) ?? null),
    getModulesByCourseRun: vi.fn(async () => modules),
    getLessonsByModule: vi.fn(async (tenantId, moduleId) =>
      lessons.filter((l) => l.moduleId === moduleId)
    ),
    getLesson: vi.fn(async (tenantId, lessonId) => lessons.find((l) => l.id === lessonId) ?? null),
    getResourcesByLesson: vi.fn(async (tenantId, lessonId) =>
      resources.filter((r) => r.lessonId === lessonId)
    ),
    // Other methods not used in progress tests
    createModule: vi.fn(),
    getModules: vi.fn(),
    updateModule: vi.fn(),
    deleteModule: vi.fn(),
    reorderModules: vi.fn(),
    createLesson: vi.fn(),
    getLessons: vi.fn(),
    updateLesson: vi.fn(),
    deleteLesson: vi.fn(),
    reorderLessons: vi.fn(),
    createResource: vi.fn(),
    getResource: vi.fn(),
    getResources: vi.fn(),
    updateResource: vi.fn(),
    deleteResource: vi.fn(),
    reorderResources: vi.fn(),
  }
}

// Mock progress repository
function createMockProgressRepository(): ProgressRepository {
  const lessonProgress = new Map<string, LessonProgress>()
  const resourceProgress = new Map<string, ResourceProgress>()

  const makeKey = (enrollmentId: string, itemId: string) => `${enrollmentId}:${itemId}`

  return {
    getLessonProgress: vi.fn(async (tenantId, enrollmentId, lessonId) => {
      return lessonProgress.get(makeKey(enrollmentId, lessonId)) || null
    }),
    getLessonProgressByEnrollment: vi.fn(async (tenantId, enrollmentId) => {
      return Array.from(lessonProgress.values()).filter((p) => p.enrollmentId === enrollmentId)
    }),
    upsertLessonProgress: vi.fn(async (tenantId, enrollmentId, userId, lessonId, data) => {
      const key = makeKey(enrollmentId, lessonId)
      const existing = lessonProgress.get(key)
      const updated: LessonProgress = {
        id: existing?.id || crypto.randomUUID(),
        tenantId,
        enrollmentId,
        userId,
        lessonId,
        status: data.status || existing?.status || 'not_started',
        progressPercent: data.progressPercent ?? existing?.progressPercent ?? 0,
        startedAt: data.startedAt || existing?.startedAt,
        completedAt: data.completedAt || existing?.completedAt,
        lastAccessedAt: data.lastAccessedAt || existing?.lastAccessedAt,
        timeSpentSeconds: data.timeSpentSeconds ?? existing?.timeSpentSeconds ?? 0,
        metadata: { ...existing?.metadata, ...data.metadata },
      }
      lessonProgress.set(key, updated)
      return updated
    }),

    getResourceProgress: vi.fn(async (tenantId, enrollmentId, resourceId) => {
      return resourceProgress.get(makeKey(enrollmentId, resourceId)) || null
    }),
    getResourceProgressByEnrollment: vi.fn(async (tenantId, enrollmentId) => {
      return Array.from(resourceProgress.values()).filter((p) => p.enrollmentId === enrollmentId)
    }),
    upsertResourceProgress: vi.fn(async (tenantId, enrollmentId, userId, resourceId, data) => {
      const key = makeKey(enrollmentId, resourceId)
      const existing = resourceProgress.get(key)
      const updated: ResourceProgress = {
        id: existing?.id || crypto.randomUUID(),
        tenantId,
        enrollmentId,
        userId,
        resourceId,
        completed: data.completed ?? existing?.completed ?? false,
        completedAt: data.completedAt || existing?.completedAt,
        score: data.score ?? existing?.score,
        attempts: data.attempts ?? existing?.attempts ?? 0,
        lastAttemptAt: data.lastAttemptAt || existing?.lastAttemptAt,
        videoProgress: data.videoProgress ?? existing?.videoProgress,
        metadata: { ...existing?.metadata, ...data.metadata },
      }
      resourceProgress.set(key, updated)
      return updated
    }),
  }
}

describe('ProgressService', () => {
  let service: ProgressService
  let progressRepo: ProgressRepository
  let contentRepo: ContentRepository

  const tenantId = 1
  const enrollmentId = 'enrollment-1'
  const userId = 'user-1'
  const courseRunId = 'course-1'

  beforeEach(() => {
    progressRepo = createMockProgressRepository()
    contentRepo = createMockContentRepository()
    service = new ProgressService(progressRepo, contentRepo)
  })

  describe('Lesson Progress', () => {
    it('should start a lesson', async () => {
      const progress = await service.startLesson(tenantId, enrollmentId, userId, 'lesson-1')

      expect(progress).toBeDefined()
      expect(progress.status).toBe('in_progress')
      expect(progress.startedAt).toBeDefined()
      expect(progress.lastAccessedAt).toBeDefined()
    })

    it('should update lastAccessedAt on repeated start', async () => {
      await service.startLesson(tenantId, enrollmentId, userId, 'lesson-1')

      // Wait a bit to ensure different timestamp
      await new Promise((r) => setTimeout(r, 10))

      const progress = await service.startLesson(tenantId, enrollmentId, userId, 'lesson-1')

      expect(progress.status).toBe('in_progress')
      expect(progress.lastAccessedAt).toBeDefined()
    })

    it('should update lesson progress', async () => {
      await service.startLesson(tenantId, enrollmentId, userId, 'lesson-1')

      const progress = await service.updateLessonProgress(
        tenantId,
        enrollmentId,
        userId,
        'lesson-1',
        {
          progressPercent: 50,
          timeSpentSeconds: 300,
        }
      )

      expect(progress.progressPercent).toBe(50)
      expect(progress.status).toBe('in_progress')
    })

    it('should auto-complete lesson at 100%', async () => {
      await service.startLesson(tenantId, enrollmentId, userId, 'lesson-1')

      const progress = await service.updateLessonProgress(
        tenantId,
        enrollmentId,
        userId,
        'lesson-1',
        {
          progressPercent: 100,
        }
      )

      expect(progress.progressPercent).toBe(100)
      expect(progress.status).toBe('completed')
      expect(progress.completedAt).toBeDefined()
    })

    it('should complete a lesson explicitly', async () => {
      await service.startLesson(tenantId, enrollmentId, userId, 'lesson-1')

      const progress = await service.completeLesson(tenantId, enrollmentId, userId, 'lesson-1')

      expect(progress.status).toBe('completed')
      expect(progress.progressPercent).toBe(100)
      expect(progress.completedAt).toBeDefined()
    })

    it('should accumulate time spent', async () => {
      await service.startLesson(tenantId, enrollmentId, userId, 'lesson-1')

      await service.updateLessonProgress(tenantId, enrollmentId, userId, 'lesson-1', {
        timeSpentSeconds: 100,
      })

      const progress = await service.updateLessonProgress(
        tenantId,
        enrollmentId,
        userId,
        'lesson-1',
        {
          timeSpentSeconds: 50,
        }
      )

      expect(progress.timeSpentSeconds).toBe(150)
    })

    it('should get lesson progress', async () => {
      await service.startLesson(tenantId, enrollmentId, userId, 'lesson-1')

      const progress = await service.getLessonProgress(tenantId, enrollmentId, 'lesson-1')

      expect(progress).toBeDefined()
      expect(progress?.lessonId).toBe('lesson-1')
    })

    it('should return null for non-existent lesson progress', async () => {
      const progress = await service.getLessonProgress(tenantId, enrollmentId, 'lesson-999')

      expect(progress).toBeNull()
    })
  })

  describe('Resource Progress', () => {
    it('should update resource progress', async () => {
      const progress = await service.updateResourceProgress(
        tenantId,
        enrollmentId,
        userId,
        'resource-1',
        {
          videoProgress: 300,
        }
      )

      expect(progress).toBeDefined()
      expect(progress.videoProgress).toBe(300)
      expect(progress.attempts).toBe(1)
    })

    it('should track attempts', async () => {
      await service.updateResourceProgress(tenantId, enrollmentId, userId, 'resource-1', {
        videoProgress: 100,
      })

      const progress = await service.updateResourceProgress(
        tenantId,
        enrollmentId,
        userId,
        'resource-1',
        {
          videoProgress: 200,
        }
      )

      expect(progress.attempts).toBe(2)
    })

    it('should complete a resource', async () => {
      const progress = await service.completeResource(
        tenantId,
        enrollmentId,
        userId,
        'resource-1',
        95
      )

      expect(progress.completed).toBe(true)
      expect(progress.score).toBe(95)
      expect(progress.completedAt).toBeDefined()
    })

    it('should not decrease video progress', async () => {
      await service.updateResourceProgress(tenantId, enrollmentId, userId, 'resource-1', {
        videoProgress: 300,
      })

      const progress = await service.updateResourceProgress(
        tenantId,
        enrollmentId,
        userId,
        'resource-1',
        {
          videoProgress: 100, // Lower than before
        }
      )

      expect(progress.videoProgress).toBe(300) // Should remain at 300
    })
  })

  describe('Module Progress', () => {
    it('should calculate module progress with no lessons completed', async () => {
      const progress = await service.getModuleProgress(
        tenantId,
        enrollmentId,
        userId,
        'module-1'
      )

      expect(progress).toBeDefined()
      expect(progress.totalLessons).toBe(2)
      expect(progress.completedLessons).toBe(0)
      expect(progress.inProgressLessons).toBe(0)
      expect(progress.progressPercent).toBe(0)
      expect(progress.status).toBe('not_started')
    })

    it('should calculate module progress with some lessons in progress', async () => {
      await service.startLesson(tenantId, enrollmentId, userId, 'lesson-1')

      const progress = await service.getModuleProgress(
        tenantId,
        enrollmentId,
        userId,
        'module-1'
      )

      expect(progress.completedLessons).toBe(0)
      expect(progress.inProgressLessons).toBe(1)
      expect(progress.status).toBe('in_progress')
    })

    it('should calculate module progress with lessons completed', async () => {
      await service.completeLesson(tenantId, enrollmentId, userId, 'lesson-1')
      await service.completeLesson(tenantId, enrollmentId, userId, 'lesson-2')

      const progress = await service.getModuleProgress(
        tenantId,
        enrollmentId,
        userId,
        'module-1'
      )

      expect(progress.completedLessons).toBe(2)
      expect(progress.totalLessons).toBe(2)
      expect(progress.progressPercent).toBe(100)
      expect(progress.status).toBe('completed')
    })

    it('should calculate estimated minutes remaining', async () => {
      await service.completeLesson(tenantId, enrollmentId, userId, 'lesson-1')

      const progress = await service.getModuleProgress(
        tenantId,
        enrollmentId,
        userId,
        'module-1'
      )

      // Lesson 1 has 20 min, Lesson 2 has 25 min
      // Completed Lesson 1, so remaining should be 25
      expect(progress.estimatedMinutesRemaining).toBe(25)
    })
  })

  describe('Course Progress', () => {
    it('should calculate course progress with no activity', async () => {
      const progress = await service.getCourseProgress(
        tenantId,
        enrollmentId,
        userId,
        courseRunId
      )

      expect(progress).toBeDefined()
      expect(progress.totalModules).toBe(2)
      expect(progress.completedModules).toBe(0)
      expect(progress.totalLessons).toBe(3)
      expect(progress.completedLessons).toBe(0)
      expect(progress.progressPercent).toBe(0)
      expect(progress.status).toBe('not_started')
    })

    it('should calculate course progress with partial completion', async () => {
      await service.completeLesson(tenantId, enrollmentId, userId, 'lesson-1')

      const progress = await service.getCourseProgress(
        tenantId,
        enrollmentId,
        userId,
        courseRunId
      )

      expect(progress.completedLessons).toBe(1)
      expect(progress.progressPercent).toBe(33) // 1/3 = 33%
      expect(progress.status).toBe('in_progress')
    })

    it('should calculate course progress with module completion', async () => {
      await service.completeLesson(tenantId, enrollmentId, userId, 'lesson-1')
      await service.completeLesson(tenantId, enrollmentId, userId, 'lesson-2')

      const progress = await service.getCourseProgress(
        tenantId,
        enrollmentId,
        userId,
        courseRunId
      )

      expect(progress.completedModules).toBe(1) // Module 1 is complete
      expect(progress.completedLessons).toBe(2)
      expect(progress.status).toBe('in_progress')
    })

    it('should calculate course progress with full completion', async () => {
      await service.completeLesson(tenantId, enrollmentId, userId, 'lesson-1')
      await service.completeLesson(tenantId, enrollmentId, userId, 'lesson-2')
      await service.completeLesson(tenantId, enrollmentId, userId, 'lesson-3')

      const progress = await service.getCourseProgress(
        tenantId,
        enrollmentId,
        userId,
        courseRunId
      )

      expect(progress.completedModules).toBe(2)
      expect(progress.completedLessons).toBe(3)
      expect(progress.progressPercent).toBe(100)
      expect(progress.status).toBe('completed')
    })

    it('should track resource completion', async () => {
      await service.completeResource(tenantId, enrollmentId, userId, 'resource-1')

      const progress = await service.getCourseProgress(
        tenantId,
        enrollmentId,
        userId,
        courseRunId
      )

      expect(progress.completedResources).toBe(1)
      expect(progress.totalResources).toBeGreaterThan(0)
    })
  })

  describe('Enrollment Progress Summary', () => {
    it('should return complete enrollment progress summary', async () => {
      await service.completeLesson(tenantId, enrollmentId, userId, 'lesson-1')

      const summary = await service.getEnrollmentProgress(
        tenantId,
        enrollmentId,
        userId,
        courseRunId
      )

      expect(summary).toBeDefined()
      expect(summary.course).toBeDefined()
      expect(summary.modules).toBeDefined()
      expect(summary.modules).toHaveLength(2)
    })
  })

  describe('Milestones', () => {
    it('should detect first lesson milestone', async () => {
      // Complete first lesson
      await service.completeLesson(tenantId, enrollmentId, userId, 'lesson-1')

      // Mock the course progress to show 1 completed lesson
      vi.spyOn(service, 'getCourseProgress').mockResolvedValueOnce({
        courseRunId,
        enrollmentId,
        userId,
        totalModules: 2,
        completedModules: 0,
        totalLessons: 3,
        completedLessons: 1,
        totalResources: 2,
        completedResources: 0,
        progressPercent: 33,
        status: 'in_progress',
        estimatedMinutesRemaining: 55,
      })

      const milestones = await service.checkMilestones(
        tenantId,
        enrollmentId,
        userId,
        courseRunId
      )

      const firstLessonMilestone = milestones.find((m) => m.type === 'first_lesson')
      expect(firstLessonMilestone).toBeDefined()
    })

    it('should detect progress milestones', async () => {
      // Mock 50% progress
      vi.spyOn(service, 'getCourseProgress').mockResolvedValueOnce({
        courseRunId,
        enrollmentId,
        userId,
        totalModules: 2,
        completedModules: 1,
        totalLessons: 4,
        completedLessons: 2,
        totalResources: 4,
        completedResources: 2,
        progressPercent: 50,
        status: 'in_progress',
        estimatedMinutesRemaining: 30,
      })

      const milestones = await service.checkMilestones(
        tenantId,
        enrollmentId,
        userId,
        courseRunId
      )

      const progressMilestones = milestones.filter((m) => m.type === 'progress_milestone')
      expect(progressMilestones.length).toBeGreaterThan(0)
      expect(progressMilestones.some((m) => m.metadata.percent === 25)).toBe(true)
      expect(progressMilestones.some((m) => m.metadata.percent === 50)).toBe(true)
    })

    it('should detect course completion milestone', async () => {
      // Mock completed course
      vi.spyOn(service, 'getCourseProgress').mockResolvedValueOnce({
        courseRunId,
        enrollmentId,
        userId,
        totalModules: 2,
        completedModules: 2,
        totalLessons: 3,
        completedLessons: 3,
        totalResources: 2,
        completedResources: 2,
        progressPercent: 100,
        status: 'completed',
        estimatedMinutesRemaining: 0,
      })

      const milestones = await service.checkMilestones(
        tenantId,
        enrollmentId,
        userId,
        courseRunId
      )

      const completionMilestone = milestones.find((m) => m.type === 'course_complete')
      expect(completionMilestone).toBeDefined()
    })
  })

  describe('Configuration', () => {
    it('should respect custom completion threshold', async () => {
      const customService = new ProgressService(progressRepo, contentRepo, {
        completionThreshold: 80,
      })

      await customService.startLesson(tenantId, enrollmentId, userId, 'lesson-1')

      const progress = await customService.updateLessonProgress(
        tenantId,
        enrollmentId,
        userId,
        'lesson-1',
        {
          progressPercent: 80,
        }
      )

      expect(progress.status).toBe('completed')
    })
  })
})
