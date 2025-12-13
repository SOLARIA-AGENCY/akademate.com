/**
 * @module @akademate/lms
 * LMS Domain Module - Content Delivery, Progress Tracking, Gamification
 *
 * This module provides services for:
 * - Content delivery: Modules, Lessons, Resources management
 * - Progress tracking: Lesson progress, resource completion, course progress
 * - Gamification: Badges, points, streaks, leaderboards
 */

// Types
export * from './types'

// Content Service
export {
  ContentService,
  ContentServiceError,
  type ContentRepository,
  type ContentServiceConfig,
  type ModuleQueryOptions,
  type LessonQueryOptions,
  type ResourceQueryOptions,
  type LessonWithResources,
  type ModuleWithLessons,
  type CourseStatistics,
  type ContentServiceErrorCode,
  CreateModuleInput,
  UpdateModuleInput,
  CreateLessonInput,
  UpdateLessonInput,
  CreateResourceInput,
  UpdateResourceInput,
} from './content'

// Progress Service
export {
  ProgressService,
  ProgressServiceError,
  type ProgressRepository,
  type ProgressServiceConfig,
  type EnrollmentProgressSummary,
  type ProgressMilestone,
  type ProgressServiceErrorCode,
  UpdateLessonProgressInput,
  UpdateResourceProgressInput,
} from './progress'

// Gamification Service
export {
  GamificationService,
  GamificationServiceError,
  type GamificationRepository,
  type GamificationServiceConfig,
  type PointsQueryOptions,
  type LeaderboardOptions,
  type UserBadgeWithDefinition,
  type StreakUpdate,
  type AchievementEvent,
  type AchievementResult,
  type GamificationServiceErrorCode,
  CreateBadgeDefinitionInput,
  AwardPointsInput,
} from './gamification'
