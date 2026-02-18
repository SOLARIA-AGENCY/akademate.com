/**
 * @module @akademate/lms/content
 * Content delivery service - modules, lessons, resources management
 */

import { z } from 'zod'
import type {
  Module,
  Lesson,
  Resource,
  ContentStatus,
} from './types'

// ============================================================================
// Input Schemas
// ============================================================================

export const CreateModuleInput = z.object({
  tenantId: z.number().int().positive(),
  courseRunId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  order: z.number().int().min(0).default(0),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  unlockDate: z.date().optional(),
  prerequisiteModuleId: z.string().uuid().optional(),
  estimatedMinutes: z.number().int().min(0).optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
})

export type CreateModuleInput = z.infer<typeof CreateModuleInput>

export const UpdateModuleInput = CreateModuleInput.partial().omit({
  tenantId: true,
  courseRunId: true,
})

export type UpdateModuleInput = z.infer<typeof UpdateModuleInput>

export const CreateLessonInput = z.object({
  tenantId: z.number().int().positive(),
  moduleId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  content: z.string().optional(),
  order: z.number().int().min(0).default(0),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  estimatedMinutes: z.number().int().min(0).optional(),
  isMandatory: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).default({}),
})

export type CreateLessonInput = z.infer<typeof CreateLessonInput>

export const UpdateLessonInput = CreateLessonInput.partial().omit({
  tenantId: true,
  moduleId: true,
})

export type UpdateLessonInput = z.infer<typeof UpdateLessonInput>

export const CreateResourceInput = z.object({
  tenantId: z.number().int().positive(),
  lessonId: z.string().uuid(),
  title: z.string().min(1).max(200),
  type: z.enum(['video', 'document', 'link', 'quiz', 'assignment', 'live_session', 'recording']),
  url: z.string().url().optional(),
  storageKey: z.string().optional(),
  mimeType: z.string().optional(),
  sizeBytes: z.number().int().min(0).optional(),
  durationSeconds: z.number().int().min(0).optional(),
  order: z.number().int().min(0).default(0),
  isRequired: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).default({}),
})

export type CreateResourceInput = z.infer<typeof CreateResourceInput>

export const UpdateResourceInput = CreateResourceInput.partial().omit({
  tenantId: true,
  lessonId: true,
})

export type UpdateResourceInput = z.infer<typeof UpdateResourceInput>

// ============================================================================
// Query Options
// ============================================================================

export interface ModuleQueryOptions {
  courseRunId?: string
  status?: ContentStatus
  includeArchived?: boolean
  orderBy?: 'order' | 'title' | 'createdAt'
  orderDirection?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface LessonQueryOptions {
  moduleId?: string
  status?: ContentStatus
  includeArchived?: boolean
  orderBy?: 'order' | 'title' | 'createdAt'
  orderDirection?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface ResourceQueryOptions {
  lessonId?: string
  type?: Resource['type']
  isRequired?: boolean
  orderBy?: 'order' | 'title' | 'createdAt'
  orderDirection?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// ============================================================================
// Content Repository Interface
// ============================================================================

export interface ContentRepository {
  // Modules
  createModule(input: CreateModuleInput & { id: string }): Promise<Module>
  getModule(tenantId: number, moduleId: string): Promise<Module | null>
  getModules(tenantId: number, options?: ModuleQueryOptions): Promise<Module[]>
  getModulesByCourseRun(tenantId: number, courseRunId: string): Promise<Module[]>
  updateModule(tenantId: number, moduleId: string, input: UpdateModuleInput): Promise<Module>
  deleteModule(tenantId: number, moduleId: string): Promise<void>
  reorderModules(tenantId: number, courseRunId: string, moduleIds: string[]): Promise<void>

  // Lessons
  createLesson(input: CreateLessonInput & { id: string }): Promise<Lesson>
  getLesson(tenantId: number, lessonId: string): Promise<Lesson | null>
  getLessons(tenantId: number, options?: LessonQueryOptions): Promise<Lesson[]>
  getLessonsByModule(tenantId: number, moduleId: string): Promise<Lesson[]>
  updateLesson(tenantId: number, lessonId: string, input: UpdateLessonInput): Promise<Lesson>
  deleteLesson(tenantId: number, lessonId: string): Promise<void>
  reorderLessons(tenantId: number, moduleId: string, lessonIds: string[]): Promise<void>

  // Resources
  createResource(input: CreateResourceInput & { id: string }): Promise<Resource>
  getResource(tenantId: number, resourceId: string): Promise<Resource | null>
  getResources(tenantId: number, options?: ResourceQueryOptions): Promise<Resource[]>
  getResourcesByLesson(tenantId: number, lessonId: string): Promise<Resource[]>
  updateResource(tenantId: number, resourceId: string, input: UpdateResourceInput): Promise<Resource>
  deleteResource(tenantId: number, resourceId: string): Promise<void>
  reorderResources(tenantId: number, lessonId: string, resourceIds: string[]): Promise<void>
}

// ============================================================================
// Content Service
// ============================================================================

export interface ContentServiceConfig {
  defaultModulesPerCourse?: number
  defaultLessonsPerModule?: number
  maxResourceSizeBytes?: number
  allowedResourceTypes?: Resource['type'][]
}

export class ContentService {
  private repository: ContentRepository
  private config: ContentServiceConfig

  constructor(repository: ContentRepository, config: ContentServiceConfig = {}) {
    this.repository = repository
    this.config = {
      defaultModulesPerCourse: config.defaultModulesPerCourse ?? 10,
      defaultLessonsPerModule: config.defaultLessonsPerModule ?? 20,
      maxResourceSizeBytes: config.maxResourceSizeBytes ?? 500 * 1024 * 1024, // 500MB
      allowedResourceTypes: config.allowedResourceTypes ?? [
        'video',
        'document',
        'link',
        'quiz',
        'assignment',
        'live_session',
        'recording',
      ],
    }
  }

  // ==========================================================================
  // Module Operations
  // ==========================================================================

  async createModule(input: CreateModuleInput): Promise<Module> {
    const validated = CreateModuleInput.parse(input)
    const id = crypto.randomUUID()

    // If prerequisite is set, verify it exists
    if (validated.prerequisiteModuleId) {
      const prerequisite = await this.repository.getModule(
        validated.tenantId,
        validated.prerequisiteModuleId
      )
      if (!prerequisite) {
        throw new ContentServiceError(
          'PREREQUISITE_NOT_FOUND',
          `Prerequisite module ${validated.prerequisiteModuleId} not found`
        )
      }
    }

    return this.repository.createModule({ ...validated, id })
  }

  async getModule(tenantId: number, moduleId: string): Promise<Module> {
    const module = await this.repository.getModule(tenantId, moduleId)
    if (!module) {
      throw new ContentServiceError('MODULE_NOT_FOUND', `Module ${moduleId} not found`)
    }
    return module
  }

  async getModules(tenantId: number, options?: ModuleQueryOptions): Promise<Module[]> {
    return this.repository.getModules(tenantId, options)
  }

  async getCourseContent(tenantId: number, courseRunId: string): Promise<ModuleWithLessons[]> {
    const modules = await this.repository.getModulesByCourseRun(tenantId, courseRunId)

    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const lessons = await this.repository.getLessonsByModule(tenantId, module.id)
        const lessonsWithResources = await Promise.all(
          lessons.map(async (lesson) => {
            const resources = await this.repository.getResourcesByLesson(tenantId, lesson.id)
            return { ...lesson, resources }
          })
        )
        return { ...module, lessons: lessonsWithResources }
      })
    )

    return modulesWithLessons
  }

  async updateModule(
    tenantId: number,
    moduleId: string,
    input: UpdateModuleInput
  ): Promise<Module> {
    const validated = UpdateModuleInput.parse(input)

    // Verify module exists
    await this.getModule(tenantId, moduleId)

    // If changing prerequisite, verify it exists and isn't circular
    if (validated.prerequisiteModuleId) {
      if (validated.prerequisiteModuleId === moduleId) {
        throw new ContentServiceError(
          'CIRCULAR_PREREQUISITE',
          'Module cannot be its own prerequisite'
        )
      }
      const prerequisite = await this.repository.getModule(
        tenantId,
        validated.prerequisiteModuleId
      )
      if (!prerequisite) {
        throw new ContentServiceError(
          'PREREQUISITE_NOT_FOUND',
          `Prerequisite module ${validated.prerequisiteModuleId} not found`
        )
      }
    }

    return this.repository.updateModule(tenantId, moduleId, validated)
  }

  async deleteModule(tenantId: number, moduleId: string): Promise<void> {
    // Verify module exists
    await this.getModule(tenantId, moduleId)

    // Check if any other modules depend on this one
    const modules = await this.repository.getModules(tenantId)
    const dependents = modules.filter((m) => m.prerequisiteModuleId === moduleId)
    if (dependents.length > 0) {
      throw new ContentServiceError(
        'MODULE_HAS_DEPENDENTS',
        `Cannot delete module: ${dependents.length} module(s) depend on it`
      )
    }

    return this.repository.deleteModule(tenantId, moduleId)
  }

  async publishModule(tenantId: number, moduleId: string): Promise<Module> {
    return this.updateModule(tenantId, moduleId, { status: 'published' })
  }

  async archiveModule(tenantId: number, moduleId: string): Promise<Module> {
    return this.updateModule(tenantId, moduleId, { status: 'archived' })
  }

  async reorderModules(
    tenantId: number,
    courseRunId: string,
    moduleIds: string[]
  ): Promise<void> {
    // Verify all modules exist and belong to this course
    const existingModules = await this.repository.getModulesByCourseRun(tenantId, courseRunId)
    const existingIds = new Set(existingModules.map((m) => m.id))

    for (const id of moduleIds) {
      if (!existingIds.has(id)) {
        throw new ContentServiceError(
          'MODULE_NOT_IN_COURSE',
          `Module ${id} does not belong to course run ${courseRunId}`
        )
      }
    }

    return this.repository.reorderModules(tenantId, courseRunId, moduleIds)
  }

  // ==========================================================================
  // Lesson Operations
  // ==========================================================================

  async createLesson(input: CreateLessonInput): Promise<Lesson> {
    const validated = CreateLessonInput.parse(input)
    const id = crypto.randomUUID()

    // Verify parent module exists
    const module = await this.repository.getModule(validated.tenantId, validated.moduleId)
    if (!module) {
      throw new ContentServiceError(
        'MODULE_NOT_FOUND',
        `Module ${validated.moduleId} not found`
      )
    }

    return this.repository.createLesson({ ...validated, id })
  }

  async getLesson(tenantId: number, lessonId: string): Promise<Lesson> {
    const lesson = await this.repository.getLesson(tenantId, lessonId)
    if (!lesson) {
      throw new ContentServiceError('LESSON_NOT_FOUND', `Lesson ${lessonId} not found`)
    }
    return lesson
  }

  async getLessons(tenantId: number, options?: LessonQueryOptions): Promise<Lesson[]> {
    return this.repository.getLessons(tenantId, options)
  }

  async getLessonWithResources(
    tenantId: number,
    lessonId: string
  ): Promise<LessonWithResources> {
    const lesson = await this.getLesson(tenantId, lessonId)
    const resources = await this.repository.getResourcesByLesson(tenantId, lessonId)
    return { ...lesson, resources }
  }

  async updateLesson(
    tenantId: number,
    lessonId: string,
    input: UpdateLessonInput
  ): Promise<Lesson> {
    const validated = UpdateLessonInput.parse(input)
    await this.getLesson(tenantId, lessonId)
    return this.repository.updateLesson(tenantId, lessonId, validated)
  }

  async deleteLesson(tenantId: number, lessonId: string): Promise<void> {
    await this.getLesson(tenantId, lessonId)
    return this.repository.deleteLesson(tenantId, lessonId)
  }

  async publishLesson(tenantId: number, lessonId: string): Promise<Lesson> {
    return this.updateLesson(tenantId, lessonId, { status: 'published' })
  }

  async archiveLesson(tenantId: number, lessonId: string): Promise<Lesson> {
    return this.updateLesson(tenantId, lessonId, { status: 'archived' })
  }

  async reorderLessons(tenantId: number, moduleId: string, lessonIds: string[]): Promise<void> {
    // Verify all lessons exist and belong to this module
    const existingLessons = await this.repository.getLessonsByModule(tenantId, moduleId)
    const existingIds = new Set(existingLessons.map((l) => l.id))

    for (const id of lessonIds) {
      if (!existingIds.has(id)) {
        throw new ContentServiceError(
          'LESSON_NOT_IN_MODULE',
          `Lesson ${id} does not belong to module ${moduleId}`
        )
      }
    }

    return this.repository.reorderLessons(tenantId, moduleId, lessonIds)
  }

  // ==========================================================================
  // Resource Operations
  // ==========================================================================

  async createResource(input: CreateResourceInput): Promise<Resource> {
    const validated = CreateResourceInput.parse(input)
    const id = crypto.randomUUID()

    // Verify resource type is allowed
    if (!this.config.allowedResourceTypes!.includes(validated.type)) {
      throw new ContentServiceError(
        'RESOURCE_TYPE_NOT_ALLOWED',
        `Resource type ${validated.type} is not allowed`
      )
    }

    // Verify size limit
    if (validated.sizeBytes && validated.sizeBytes > this.config.maxResourceSizeBytes!) {
      throw new ContentServiceError(
        'RESOURCE_TOO_LARGE',
        `Resource size ${validated.sizeBytes} exceeds maximum ${this.config.maxResourceSizeBytes}`
      )
    }

    // Verify parent lesson exists
    const lesson = await this.repository.getLesson(validated.tenantId, validated.lessonId)
    if (!lesson) {
      throw new ContentServiceError(
        'LESSON_NOT_FOUND',
        `Lesson ${validated.lessonId} not found`
      )
    }

    return this.repository.createResource({ ...validated, id })
  }

  async getResource(tenantId: number, resourceId: string): Promise<Resource> {
    const resource = await this.repository.getResource(tenantId, resourceId)
    if (!resource) {
      throw new ContentServiceError('RESOURCE_NOT_FOUND', `Resource ${resourceId} not found`)
    }
    return resource
  }

  async getResources(tenantId: number, options?: ResourceQueryOptions): Promise<Resource[]> {
    return this.repository.getResources(tenantId, options)
  }

  async updateResource(
    tenantId: number,
    resourceId: string,
    input: UpdateResourceInput
  ): Promise<Resource> {
    const validated = UpdateResourceInput.parse(input)

    // Verify resource type is allowed if changing
    if (validated.type && !this.config.allowedResourceTypes!.includes(validated.type)) {
      throw new ContentServiceError(
        'RESOURCE_TYPE_NOT_ALLOWED',
        `Resource type ${validated.type} is not allowed`
      )
    }

    // Verify size limit if changing
    if (validated.sizeBytes && validated.sizeBytes > this.config.maxResourceSizeBytes!) {
      throw new ContentServiceError(
        'RESOURCE_TOO_LARGE',
        `Resource size ${validated.sizeBytes} exceeds maximum ${this.config.maxResourceSizeBytes}`
      )
    }

    await this.getResource(tenantId, resourceId)
    return this.repository.updateResource(tenantId, resourceId, validated)
  }

  async deleteResource(tenantId: number, resourceId: string): Promise<void> {
    await this.getResource(tenantId, resourceId)
    return this.repository.deleteResource(tenantId, resourceId)
  }

  async reorderResources(
    tenantId: number,
    lessonId: string,
    resourceIds: string[]
  ): Promise<void> {
    // Verify all resources exist and belong to this lesson
    const existingResources = await this.repository.getResourcesByLesson(tenantId, lessonId)
    const existingIds = new Set(existingResources.map((r) => r.id))

    for (const id of resourceIds) {
      if (!existingIds.has(id)) {
        throw new ContentServiceError(
          'RESOURCE_NOT_IN_LESSON',
          `Resource ${id} does not belong to lesson ${lessonId}`
        )
      }
    }

    return this.repository.reorderResources(tenantId, lessonId, resourceIds)
  }

  // ==========================================================================
  // Content Statistics
  // ==========================================================================

  async getCourseStatistics(tenantId: number, courseRunId: string): Promise<CourseStatistics> {
    const modules = await this.repository.getModulesByCourseRun(tenantId, courseRunId)

    let totalLessons = 0
    let totalResources = 0
    let totalEstimatedMinutes = 0
    let publishedModules = 0
    let publishedLessons = 0

    for (const module of modules) {
      if (module.status === 'published') publishedModules++
      if (module.estimatedMinutes) totalEstimatedMinutes += module.estimatedMinutes

      const lessons = await this.repository.getLessonsByModule(tenantId, module.id)
      totalLessons += lessons.length

      for (const lesson of lessons) {
        if (lesson.status === 'published') publishedLessons++
        if (lesson.estimatedMinutes) totalEstimatedMinutes += lesson.estimatedMinutes

        const resources = await this.repository.getResourcesByLesson(tenantId, lesson.id)
        totalResources += resources.length
      }
    }

    return {
      courseRunId,
      totalModules: modules.length,
      publishedModules,
      totalLessons,
      publishedLessons,
      totalResources,
      totalEstimatedMinutes,
    }
  }
}

// ============================================================================
// Extended Types
// ============================================================================

export interface LessonWithResources extends Lesson {
  resources: Resource[]
}

export interface ModuleWithLessons extends Module {
  lessons: LessonWithResources[]
}

export interface CourseStatistics {
  courseRunId: string
  totalModules: number
  publishedModules: number
  totalLessons: number
  publishedLessons: number
  totalResources: number
  totalEstimatedMinutes: number
}

// ============================================================================
// Errors
// ============================================================================

export type ContentServiceErrorCode =
  | 'MODULE_NOT_FOUND'
  | 'LESSON_NOT_FOUND'
  | 'RESOURCE_NOT_FOUND'
  | 'PREREQUISITE_NOT_FOUND'
  | 'CIRCULAR_PREREQUISITE'
  | 'MODULE_HAS_DEPENDENTS'
  | 'MODULE_NOT_IN_COURSE'
  | 'LESSON_NOT_IN_MODULE'
  | 'RESOURCE_NOT_IN_LESSON'
  | 'RESOURCE_TYPE_NOT_ALLOWED'
  | 'RESOURCE_TOO_LARGE'

export class ContentServiceError extends Error {
  constructor(
    public readonly code: ContentServiceErrorCode,
    message: string
  ) {
    super(message)
    this.name = 'ContentServiceError'
  }
}
