/**
 * @module @akademate/lms/progress
 * Progress tracking service - lesson progress, resource completion, course progress
 */

import { z } from 'zod'
import type {
  LessonProgress,
  ResourceProgress,
  ModuleProgress,
  CourseProgress,
  ProgressStatus,
} from './types'
import type { ContentRepository } from './content'

// ============================================================================
// Input Schemas
// ============================================================================

export const UpdateLessonProgressInput = z.object({
  status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
  progressPercent: z.number().int().min(0).max(100).optional(),
  timeSpentSeconds: z.number().int().min(0).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type UpdateLessonProgressInput = z.infer<typeof UpdateLessonProgressInput>

export const UpdateResourceProgressInput = z.object({
  completed: z.boolean().optional(),
  score: z.number().min(0).max(100).optional(),
  videoProgress: z.number().int().min(0).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type UpdateResourceProgressInput = z.infer<typeof UpdateResourceProgressInput>

// ============================================================================
// Progress Repository Interface
// ============================================================================

export interface ProgressRepository {
  // Lesson Progress
  getLessonProgress(
    tenantId: number,
    enrollmentId: string,
    lessonId: string
  ): Promise<LessonProgress | null>
  getLessonProgressByEnrollment(
    tenantId: number,
    enrollmentId: string
  ): Promise<LessonProgress[]>
  upsertLessonProgress(
    tenantId: number,
    enrollmentId: string,
    userId: string,
    lessonId: string,
    data: Partial<LessonProgress>
  ): Promise<LessonProgress>

  // Resource Progress
  getResourceProgress(
    tenantId: number,
    enrollmentId: string,
    resourceId: string
  ): Promise<ResourceProgress | null>
  getResourceProgressByEnrollment(
    tenantId: number,
    enrollmentId: string
  ): Promise<ResourceProgress[]>
  upsertResourceProgress(
    tenantId: number,
    enrollmentId: string,
    userId: string,
    resourceId: string,
    data: Partial<ResourceProgress>
  ): Promise<ResourceProgress>
}

// ============================================================================
// Progress Service Configuration
// ============================================================================

export interface ProgressServiceConfig {
  completionThreshold?: number // Percent to consider "completed" (default 100)
  trackVideoProgress?: boolean
  autoCompleteOnView?: boolean // Auto-complete when lesson is viewed
}

// ============================================================================
// Progress Service
// ============================================================================

export class ProgressService {
  private progressRepo: ProgressRepository
  private contentRepo: ContentRepository
  private config: ProgressServiceConfig

  constructor(
    progressRepo: ProgressRepository,
    contentRepo: ContentRepository,
    config: ProgressServiceConfig = {}
  ) {
    this.progressRepo = progressRepo
    this.contentRepo = contentRepo
    this.config = {
      completionThreshold: config.completionThreshold ?? 100,
      trackVideoProgress: config.trackVideoProgress ?? true,
      autoCompleteOnView: config.autoCompleteOnView ?? false,
    }
  }

  // ==========================================================================
  // Lesson Progress
  // ==========================================================================

  async startLesson(
    tenantId: number,
    enrollmentId: string,
    userId: string,
    lessonId: string
  ): Promise<LessonProgress> {
    const existing = await this.progressRepo.getLessonProgress(tenantId, enrollmentId, lessonId)

    if (existing && existing.status !== 'not_started') {
      // Already started, just update lastAccessedAt
      return this.progressRepo.upsertLessonProgress(tenantId, enrollmentId, userId, lessonId, {
        lastAccessedAt: new Date(),
      })
    }

    return this.progressRepo.upsertLessonProgress(tenantId, enrollmentId, userId, lessonId, {
      status: 'in_progress',
      startedAt: new Date(),
      lastAccessedAt: new Date(),
    })
  }

  async updateLessonProgress(
    tenantId: number,
    enrollmentId: string,
    userId: string,
    lessonId: string,
    input: UpdateLessonProgressInput
  ): Promise<LessonProgress> {
    const validated = UpdateLessonProgressInput.parse(input)

    const existing = await this.progressRepo.getLessonProgress(tenantId, enrollmentId, lessonId)

    const updateData: Partial<LessonProgress> = {
      ...validated,
      lastAccessedAt: new Date(),
    }

    // Auto-set status based on progress
    if (validated.progressPercent !== undefined) {
      if (validated.progressPercent >= this.config.completionThreshold!) {
        updateData.status = 'completed'
        if (!existing?.completedAt) {
          updateData.completedAt = new Date()
        }
      } else if (validated.progressPercent > 0) {
        updateData.status = 'in_progress'
        if (!existing?.startedAt) {
          updateData.startedAt = new Date()
        }
      }
    }

    // Handle explicit status change
    if (validated.status === 'completed' && !existing?.completedAt) {
      updateData.completedAt = new Date()
      updateData.progressPercent = 100
    }

    // Accumulate time spent
    if (validated.timeSpentSeconds !== undefined && existing?.timeSpentSeconds) {
      updateData.timeSpentSeconds = existing.timeSpentSeconds + validated.timeSpentSeconds
    }

    return this.progressRepo.upsertLessonProgress(
      tenantId,
      enrollmentId,
      userId,
      lessonId,
      updateData
    )
  }

  async completeLesson(
    tenantId: number,
    enrollmentId: string,
    userId: string,
    lessonId: string
  ): Promise<LessonProgress> {
    return this.updateLessonProgress(tenantId, enrollmentId, userId, lessonId, {
      status: 'completed',
      progressPercent: 100,
    })
  }

  async getLessonProgress(
    tenantId: number,
    enrollmentId: string,
    lessonId: string
  ): Promise<LessonProgress | null> {
    return this.progressRepo.getLessonProgress(tenantId, enrollmentId, lessonId)
  }

  // ==========================================================================
  // Resource Progress
  // ==========================================================================

  async updateResourceProgress(
    tenantId: number,
    enrollmentId: string,
    userId: string,
    resourceId: string,
    input: UpdateResourceProgressInput
  ): Promise<ResourceProgress> {
    const validated = UpdateResourceProgressInput.parse(input)

    const existing = await this.progressRepo.getResourceProgress(
      tenantId,
      enrollmentId,
      resourceId
    )

    const updateData: Partial<ResourceProgress> = {
      ...validated,
      lastAttemptAt: new Date(),
    }

    // Track attempts
    if (existing) {
      updateData.attempts = (existing.attempts ?? 0) + 1
    } else {
      updateData.attempts = 1
    }

    // Handle completion
    if (validated.completed && !existing?.completedAt) {
      updateData.completedAt = new Date()
    }

    // For video progress, track max progress reached
    if (this.config.trackVideoProgress && validated.videoProgress !== undefined) {
      if (existing?.videoProgress && validated.videoProgress < existing.videoProgress) {
        // Don't decrease video progress
        delete updateData.videoProgress
      }
    }

    return this.progressRepo.upsertResourceProgress(
      tenantId,
      enrollmentId,
      userId,
      resourceId,
      updateData
    )
  }

  async completeResource(
    tenantId: number,
    enrollmentId: string,
    userId: string,
    resourceId: string,
    score?: number
  ): Promise<ResourceProgress> {
    return this.updateResourceProgress(tenantId, enrollmentId, userId, resourceId, {
      completed: true,
      score,
    })
  }

  async getResourceProgress(
    tenantId: number,
    enrollmentId: string,
    resourceId: string
  ): Promise<ResourceProgress | null> {
    return this.progressRepo.getResourceProgress(tenantId, enrollmentId, resourceId)
  }

  // ==========================================================================
  // Module Progress (Computed)
  // ==========================================================================

  async getModuleProgress(
    tenantId: number,
    enrollmentId: string,
    userId: string,
    moduleId: string
  ): Promise<ModuleProgress> {
    const lessons = await this.contentRepo.getLessonsByModule(tenantId, moduleId)
    const lessonProgress = await this.progressRepo.getLessonProgressByEnrollment(
      tenantId,
      enrollmentId
    )

    const lessonIds = new Set(lessons.map((l) => l.id))
    const relevantProgress = lessonProgress.filter((p) => lessonIds.has(p.lessonId))

    let completedLessons = 0
    let inProgressLessons = 0
    let totalEstimatedMinutes = 0
    let completedEstimatedMinutes = 0

    for (const lesson of lessons) {
      const progress = relevantProgress.find((p) => p.lessonId === lesson.id)
      const lessonMinutes = lesson.estimatedMinutes ?? 0
      totalEstimatedMinutes += lessonMinutes

      if (progress?.status === 'completed') {
        completedLessons++
        completedEstimatedMinutes += lessonMinutes
      } else if (progress?.status === 'in_progress') {
        inProgressLessons++
        // Estimate partial completion
        completedEstimatedMinutes += lessonMinutes * ((progress.progressPercent ?? 0) / 100)
      }
    }

    const totalLessons = lessons.length
    const progressPercent =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

    let status: ProgressStatus = 'not_started'
    if (completedLessons === totalLessons && totalLessons > 0) {
      status = 'completed'
    } else if (completedLessons > 0 || inProgressLessons > 0) {
      status = 'in_progress'
    }

    return {
      moduleId,
      enrollmentId,
      userId,
      totalLessons,
      completedLessons,
      inProgressLessons,
      progressPercent,
      status,
      estimatedMinutesRemaining: Math.round(totalEstimatedMinutes - completedEstimatedMinutes),
    }
  }

  // ==========================================================================
  // Course Progress (Computed)
  // ==========================================================================

  async getCourseProgress(
    tenantId: number,
    enrollmentId: string,
    userId: string,
    courseRunId: string
  ): Promise<CourseProgress> {
    const modules = await this.contentRepo.getModulesByCourseRun(tenantId, courseRunId)
    const allLessonProgress = await this.progressRepo.getLessonProgressByEnrollment(
      tenantId,
      enrollmentId
    )
    const allResourceProgress = await this.progressRepo.getResourceProgressByEnrollment(
      tenantId,
      enrollmentId
    )

    const totalModules = modules.length
    let completedModules = 0
    let totalLessons = 0
    let completedLessons = 0
    let totalResources = 0
    let completedResources = 0
    let totalEstimatedMinutes = 0
    let completedEstimatedMinutes = 0
    let lastAccessedAt: Date | undefined

    for (const module of modules) {
      const lessons = await this.contentRepo.getLessonsByModule(tenantId, module.id)
      const moduleEstimated = module.estimatedMinutes ?? 0

      let moduleCompletedLessons = 0

      for (const lesson of lessons) {
        totalLessons++
        const lessonMinutes = lesson.estimatedMinutes ?? 0
        totalEstimatedMinutes += lessonMinutes

        const progress = allLessonProgress.find((p) => p.lessonId === lesson.id)
        if (progress) {
          if (progress.lastAccessedAt) {
            if (!lastAccessedAt || progress.lastAccessedAt > lastAccessedAt) {
              lastAccessedAt = progress.lastAccessedAt
            }
          }

          if (progress.status === 'completed') {
            completedLessons++
            moduleCompletedLessons++
            completedEstimatedMinutes += lessonMinutes
          } else if (progress.status === 'in_progress') {
            completedEstimatedMinutes += lessonMinutes * ((progress.progressPercent ?? 0) / 100)
          }
        }

        const resources = await this.contentRepo.getResourcesByLesson(tenantId, lesson.id)
        for (const resource of resources) {
          totalResources++
          const resourceProgress = allResourceProgress.find((p) => p.resourceId === resource.id)
          if (resourceProgress?.completed) {
            completedResources++
          }
        }
      }

      if (moduleCompletedLessons === lessons.length && lessons.length > 0) {
        completedModules++
      }

      totalEstimatedMinutes += moduleEstimated
    }

    const progressPercent =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

    let status: ProgressStatus = 'not_started'
    if (completedModules === totalModules && totalModules > 0) {
      status = 'completed'
    } else if (completedLessons > 0) {
      status = 'in_progress'
    }

    return {
      courseRunId,
      enrollmentId,
      userId,
      totalModules,
      completedModules,
      totalLessons,
      completedLessons,
      totalResources,
      completedResources,
      progressPercent,
      status,
      estimatedMinutesRemaining: Math.round(totalEstimatedMinutes - completedEstimatedMinutes),
      lastAccessedAt,
    }
  }

  // ==========================================================================
  // Bulk Operations
  // ==========================================================================

  async getEnrollmentProgress(
    tenantId: number,
    enrollmentId: string,
    userId: string,
    courseRunId: string
  ): Promise<EnrollmentProgressSummary> {
    const [courseProgress, modules] = await Promise.all([
      this.getCourseProgress(tenantId, enrollmentId, userId, courseRunId),
      this.contentRepo.getModulesByCourseRun(tenantId, courseRunId),
    ])

    const moduleProgressList = await Promise.all(
      modules.map((m) => this.getModuleProgress(tenantId, enrollmentId, userId, m.id))
    )

    return {
      course: courseProgress,
      modules: moduleProgressList,
    }
  }

  // ==========================================================================
  // Progress Events (for gamification integration)
  // ==========================================================================

  async checkMilestones(
    tenantId: number,
    enrollmentId: string,
    userId: string,
    courseRunId: string
  ): Promise<ProgressMilestone[]> {
    const courseProgress = await this.getCourseProgress(
      tenantId,
      enrollmentId,
      userId,
      courseRunId
    )

    const milestones: ProgressMilestone[] = []

    // First lesson completed
    if (courseProgress.completedLessons === 1) {
      milestones.push({
        type: 'first_lesson',
        achievedAt: new Date(),
        metadata: { lessonCount: 1 },
      })
    }

    // Module completion milestones
    if (courseProgress.completedModules > 0) {
      milestones.push({
        type: 'module_complete',
        achievedAt: new Date(),
        metadata: { moduleCount: courseProgress.completedModules },
      })
    }

    // Progress milestones (25%, 50%, 75%)
    const progressMilestones = [25, 50, 75, 100]
    for (const milestone of progressMilestones) {
      if (courseProgress.progressPercent >= milestone) {
        milestones.push({
          type: 'progress_milestone',
          achievedAt: new Date(),
          metadata: { percent: milestone },
        })
      }
    }

    // Course completion
    if (courseProgress.status === 'completed') {
      milestones.push({
        type: 'course_complete',
        achievedAt: new Date(),
        metadata: { courseRunId },
      })
    }

    return milestones
  }
}

// ============================================================================
// Extended Types
// ============================================================================

export interface EnrollmentProgressSummary {
  course: CourseProgress
  modules: ModuleProgress[]
}

export interface ProgressMilestone {
  type:
    | 'first_lesson'
    | 'module_complete'
    | 'progress_milestone'
    | 'course_complete'
    | 'perfect_score'
  achievedAt: Date
  metadata: Record<string, unknown>
}

// ============================================================================
// Errors
// ============================================================================

export type ProgressServiceErrorCode =
  | 'ENROLLMENT_NOT_FOUND'
  | 'LESSON_NOT_FOUND'
  | 'RESOURCE_NOT_FOUND'
  | 'INVALID_PROGRESS'

export class ProgressServiceError extends Error {
  constructor(
    public readonly code: ProgressServiceErrorCode,
    message: string
  ) {
    super(message)
    this.name = 'ProgressServiceError'
  }
}
