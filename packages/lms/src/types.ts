/**
 * @module @akademate/lms/types
 * Type definitions for LMS domain
 */

import { z } from 'zod'

// ============================================================================
// Content Types
// ============================================================================

export const ResourceType = {
  VIDEO: 'video',
  DOCUMENT: 'document',
  LINK: 'link',
  QUIZ: 'quiz',
  ASSIGNMENT: 'assignment',
  LIVE_SESSION: 'live_session',
  RECORDING: 'recording',
} as const

export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType]

export const ContentStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const

export type ContentStatus = (typeof ContentStatus)[keyof typeof ContentStatus]

// ============================================================================
// Module Schema
// ============================================================================

export const ModuleSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.number().int().positive(),
  courseRunId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  order: z.number().int().min(0),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  unlockDate: z.date().optional(),
  prerequisiteModuleId: z.string().uuid().optional(),
  estimatedMinutes: z.number().int().min(0).optional(),
  metadata: z.record(z.unknown()).default({}),
})

export type Module = z.infer<typeof ModuleSchema>

// ============================================================================
// Lesson Schema
// ============================================================================

export const LessonSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.number().int().positive(),
  moduleId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  content: z.string().optional(), // HTML/Markdown content
  order: z.number().int().min(0),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  estimatedMinutes: z.number().int().min(0).optional(),
  isMandatory: z.boolean().default(true),
  metadata: z.record(z.unknown()).default({}),
})

export type Lesson = z.infer<typeof LessonSchema>

// ============================================================================
// Resource Schema
// ============================================================================

export const ResourceSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.number().int().positive(),
  lessonId: z.string().uuid(),
  title: z.string().min(1).max(200),
  type: z.enum(['video', 'document', 'link', 'quiz', 'assignment', 'live_session', 'recording']),
  url: z.string().url().optional(),
  storageKey: z.string().optional(), // S3/R2 key
  mimeType: z.string().optional(),
  sizeBytes: z.number().int().min(0).optional(),
  durationSeconds: z.number().int().min(0).optional(), // For video/audio
  order: z.number().int().min(0),
  isRequired: z.boolean().default(false),
  metadata: z.record(z.unknown()).default({}),
})

export type Resource = z.infer<typeof ResourceSchema>

// ============================================================================
// Progress Types
// ============================================================================

export const ProgressStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const

export type ProgressStatus = (typeof ProgressStatus)[keyof typeof ProgressStatus]

// ============================================================================
// Lesson Progress Schema
// ============================================================================

export const LessonProgressSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.number().int().positive(),
  enrollmentId: z.string().uuid(),
  userId: z.string().uuid(),
  lessonId: z.string().uuid(),
  status: z.enum(['not_started', 'in_progress', 'completed']).default('not_started'),
  progressPercent: z.number().int().min(0).max(100).default(0),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  lastAccessedAt: z.date().optional(),
  timeSpentSeconds: z.number().int().min(0).default(0),
  metadata: z.record(z.unknown()).default({}),
})

export type LessonProgress = z.infer<typeof LessonProgressSchema>

// ============================================================================
// Resource Progress Schema
// ============================================================================

export const ResourceProgressSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.number().int().positive(),
  enrollmentId: z.string().uuid(),
  userId: z.string().uuid(),
  resourceId: z.string().uuid(),
  completed: z.boolean().default(false),
  completedAt: z.date().optional(),
  score: z.number().min(0).max(100).optional(), // For quizzes/assignments
  attempts: z.number().int().min(0).default(0),
  lastAttemptAt: z.date().optional(),
  videoProgress: z.number().int().min(0).optional(), // Seconds watched
  metadata: z.record(z.unknown()).default({}),
})

export type ResourceProgress = z.infer<typeof ResourceProgressSchema>

// ============================================================================
// Module Progress (Computed)
// ============================================================================

export interface ModuleProgress {
  moduleId: string
  enrollmentId: string
  userId: string
  totalLessons: number
  completedLessons: number
  inProgressLessons: number
  progressPercent: number
  status: ProgressStatus
  estimatedMinutesRemaining: number
}

// ============================================================================
// Course Progress (Computed)
// ============================================================================

export interface CourseProgress {
  courseRunId: string
  enrollmentId: string
  userId: string
  totalModules: number
  completedModules: number
  totalLessons: number
  completedLessons: number
  totalResources: number
  completedResources: number
  progressPercent: number
  status: ProgressStatus
  estimatedMinutesRemaining: number
  lastAccessedAt?: Date
}

// ============================================================================
// Gamification Types
// ============================================================================

export const BadgeType = {
  COURSE_COMPLETE: 'course_complete',
  MODULE_COMPLETE: 'module_complete',
  STREAK: 'streak',
  FIRST_LESSON: 'first_lesson',
  PERFECT_SCORE: 'perfect_score',
  EARLY_BIRD: 'early_bird',
  NIGHT_OWL: 'night_owl',
  SPEED_LEARNER: 'speed_learner',
  DEDICATED: 'dedicated',
  CUSTOM: 'custom',
} as const

export type BadgeType = (typeof BadgeType)[keyof typeof BadgeType]

// ============================================================================
// Badge Definition Schema
// ============================================================================

export const BadgeDefinitionSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.number().int().positive().optional(), // null = global badge
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum([
    'course_complete',
    'module_complete',
    'streak',
    'first_lesson',
    'perfect_score',
    'early_bird',
    'night_owl',
    'speed_learner',
    'dedicated',
    'custom',
  ]),
  iconUrl: z.string().url().optional(),
  pointsValue: z.number().int().min(0).default(0),
  criteria: z.record(z.unknown()).default({}), // Criteria for earning
  isActive: z.boolean().default(true),
})

export type BadgeDefinition = z.infer<typeof BadgeDefinitionSchema>

// ============================================================================
// User Badge Schema
// ============================================================================

export const UserBadgeSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.number().int().positive(),
  userId: z.string().uuid(),
  badgeId: z.string().uuid(),
  earnedAt: z.date(),
  metadata: z.record(z.unknown()).default({}), // Context of earning
})

export type UserBadge = z.infer<typeof UserBadgeSchema>

// ============================================================================
// Points Transaction Schema
// ============================================================================

export const PointsTransactionSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.number().int().positive(),
  userId: z.string().uuid(),
  points: z.number().int(), // Can be negative for deductions
  reason: z.string().min(1).max(200),
  sourceType: z.enum(['lesson', 'resource', 'badge', 'streak', 'bonus', 'manual']),
  sourceId: z.string().uuid().optional(),
  createdAt: z.date(),
})

export type PointsTransaction = z.infer<typeof PointsTransactionSchema>

// ============================================================================
// User Gamification Summary
// ============================================================================

export interface UserGamificationSummary {
  userId: string
  tenantId: number
  totalPoints: number
  currentStreak: number
  longestStreak: number
  badgesCount: number
  rank?: number // Leaderboard position
  lastActivityAt?: Date
}

// ============================================================================
// Leaderboard Entry
// ============================================================================

export interface LeaderboardEntry {
  userId: string
  userName: string
  avatarUrl?: string
  totalPoints: number
  badgesCount: number
  rank: number
}

// ============================================================================
// Live Session Types
// ============================================================================

export const LiveSessionProvider = {
  ZOOM: 'zoom',
  GOOGLE_MEET: 'google_meet',
  TEAMS: 'teams',
  CUSTOM: 'custom',
} as const

export type LiveSessionProvider = (typeof LiveSessionProvider)[keyof typeof LiveSessionProvider]

export const LiveSessionSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.number().int().positive(),
  courseRunId: z.string().uuid(),
  lessonId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  provider: z.enum(['zoom', 'google_meet', 'teams', 'custom']),
  joinUrl: z.string().url(),
  hostUrl: z.string().url().optional(),
  scheduledAt: z.date(),
  durationMinutes: z.number().int().min(1),
  recordingUrl: z.string().url().optional(),
  recordingAvailableAt: z.date().optional(),
  maxParticipants: z.number().int().min(1).optional(),
  metadata: z.record(z.unknown()).default({}),
})

export type LiveSession = z.infer<typeof LiveSessionSchema>

// ============================================================================
// Certificate Types
// ============================================================================

export const CertificateSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.number().int().positive(),
  enrollmentId: z.string().uuid(),
  userId: z.string().uuid(),
  courseRunId: z.string().uuid(),
  templateId: z.string().uuid().optional(),
  verificationHash: z.string().min(32).max(64),
  issuedAt: z.date(),
  expiresAt: z.date().optional(),
  pdfUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).default({}),
})

export type Certificate = z.infer<typeof CertificateSchema>

// ============================================================================
// Service Configuration Types
// ============================================================================

export interface ContentServiceConfig {
  defaultModulesPerCourse?: number
  defaultLessonsPerModule?: number
  maxResourceSizeBytes?: number
  allowedResourceTypes?: ResourceType[]
}

export interface ProgressServiceConfig {
  completionThreshold?: number // Percent to consider "completed" (default 100)
  trackVideoProgress?: boolean
  autoCompleteOnView?: boolean // Auto-complete when lesson is viewed
}

export interface GamificationServiceConfig {
  enabled?: boolean
  pointsPerLesson?: number
  pointsPerModule?: number
  pointsPerCourse?: number
  streakBonusMultiplier?: number
  leaderboardSize?: number
}
