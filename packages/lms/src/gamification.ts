/**
 * @module @akademate/lms/gamification
 * Gamification service - badges, points, streaks, leaderboards
 */

import { z } from 'zod'
import type {
  BadgeDefinition,
  UserBadge,
  PointsTransaction,
  UserGamificationSummary,
  LeaderboardEntry,
  BadgeType,
} from './types'

// ============================================================================
// Input Schemas
// ============================================================================

export const CreateBadgeDefinitionInput = z.object({
  tenantId: z.number().int().positive().optional(),
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
  criteria: z.record(z.string(), z.unknown()).default({}),
  isActive: z.boolean().default(true),
})

export type CreateBadgeDefinitionInput = z.infer<typeof CreateBadgeDefinitionInput>

export const AwardPointsInput = z.object({
  tenantId: z.number().int().positive(),
  userId: z.string().uuid(),
  points: z.number().int(),
  reason: z.string().min(1).max(200),
  sourceType: z.enum(['lesson', 'resource', 'badge', 'streak', 'bonus', 'manual']),
  sourceId: z.string().uuid().optional(),
})

export type AwardPointsInput = z.infer<typeof AwardPointsInput>

// ============================================================================
// Gamification Repository Interface
// ============================================================================

export interface GamificationRepository {
  // Badge Definitions
  createBadgeDefinition(input: CreateBadgeDefinitionInput & { id: string }): Promise<BadgeDefinition>
  getBadgeDefinition(id: string): Promise<BadgeDefinition | null>
  getBadgeDefinitionByCode(code: string, tenantId?: number): Promise<BadgeDefinition | null>
  getBadgeDefinitions(tenantId?: number): Promise<BadgeDefinition[]>
  updateBadgeDefinition(
    id: string,
    input: Partial<CreateBadgeDefinitionInput>
  ): Promise<BadgeDefinition>
  deleteBadgeDefinition(id: string): Promise<void>

  // User Badges
  awardBadge(
    tenantId: number,
    userId: string,
    badgeId: string,
    metadata?: Record<string, unknown>
  ): Promise<UserBadge>
  getUserBadges(tenantId: number, userId: string): Promise<UserBadge[]>
  hasUserBadge(tenantId: number, userId: string, badgeId: string): Promise<boolean>
  revokeBadge(tenantId: number, userId: string, badgeId: string): Promise<void>

  // Points
  createPointsTransaction(input: AwardPointsInput & { id: string }): Promise<PointsTransaction>
  getPointsTransactions(
    tenantId: number,
    userId: string,
    options?: PointsQueryOptions
  ): Promise<PointsTransaction[]>
  getTotalPoints(tenantId: number, userId: string): Promise<number>

  // Streaks
  getCurrentStreak(tenantId: number, userId: string): Promise<number>
  getLongestStreak(tenantId: number, userId: string): Promise<number>
  updateStreak(tenantId: number, userId: string, activityDate: Date): Promise<StreakUpdate>

  // Leaderboard
  getLeaderboard(
    tenantId: number,
    options?: LeaderboardOptions
  ): Promise<LeaderboardEntry[]>
  getUserRank(tenantId: number, userId: string): Promise<number | null>

  // Summary
  getGamificationSummary(tenantId: number, userId: string): Promise<UserGamificationSummary>
}

// ============================================================================
// Query Options
// ============================================================================

export interface PointsQueryOptions {
  sourceType?: PointsTransaction['sourceType']
  fromDate?: Date
  toDate?: Date
  limit?: number
  offset?: number
}

export interface LeaderboardOptions {
  courseRunId?: string // Filter by course
  period?: 'all_time' | 'monthly' | 'weekly' | 'daily'
  limit?: number
  offset?: number
}

// ============================================================================
// Gamification Service Configuration
// ============================================================================

export interface GamificationServiceConfig {
  enabled?: boolean
  pointsPerLesson?: number
  pointsPerModule?: number
  pointsPerCourse?: number
  pointsPerPerfectScore?: number
  streakBonusMultiplier?: number
  leaderboardSize?: number
  streakResetHours?: number // Hours without activity to reset streak
}

// ============================================================================
// Gamification Service
// ============================================================================

export class GamificationService {
  private repository: GamificationRepository
  private config: GamificationServiceConfig

  constructor(repository: GamificationRepository, config: GamificationServiceConfig = {}) {
    this.repository = repository
    this.config = {
      enabled: config.enabled ?? true,
      pointsPerLesson: config.pointsPerLesson ?? 10,
      pointsPerModule: config.pointsPerModule ?? 50,
      pointsPerCourse: config.pointsPerCourse ?? 200,
      pointsPerPerfectScore: config.pointsPerPerfectScore ?? 25,
      streakBonusMultiplier: config.streakBonusMultiplier ?? 1.5,
      leaderboardSize: config.leaderboardSize ?? 100,
      streakResetHours: config.streakResetHours ?? 48,
    }
  }

  // ==========================================================================
  // Badge Management
  // ==========================================================================

  async createBadgeDefinition(input: CreateBadgeDefinitionInput): Promise<BadgeDefinition> {
    const validated = CreateBadgeDefinitionInput.parse(input)
    const id = crypto.randomUUID()

    // Check for duplicate code
    const existing = await this.repository.getBadgeDefinitionByCode(
      validated.code,
      validated.tenantId
    )
    if (existing) {
      throw new GamificationServiceError(
        'BADGE_CODE_EXISTS',
        `Badge with code ${validated.code} already exists`
      )
    }

    return this.repository.createBadgeDefinition({ ...validated, id })
  }

  async getBadgeDefinitions(tenantId?: number): Promise<BadgeDefinition[]> {
    return this.repository.getBadgeDefinitions(tenantId)
  }

  async awardBadge(
    tenantId: number,
    userId: string,
    badgeCode: string,
    metadata?: Record<string, unknown>
  ): Promise<UserBadge | null> {
    if (!this.config.enabled) return null

    // Find badge by code
    const badge = await this.repository.getBadgeDefinitionByCode(badgeCode, tenantId)
    if (!badge || !badge.isActive) {
      throw new GamificationServiceError('BADGE_NOT_FOUND', `Badge ${badgeCode} not found`)
    }

    // Check if user already has this badge
    const alreadyHas = await this.repository.hasUserBadge(tenantId, userId, badge.id)
    if (alreadyHas) {
      return null // Already has badge, no-op
    }

    // Award badge
    const userBadge = await this.repository.awardBadge(tenantId, userId, badge.id, metadata)

    // Award points for the badge
    if (badge.pointsValue > 0) {
      await this.awardPoints({
        tenantId,
        userId,
        points: badge.pointsValue,
        reason: `Earned badge: ${badge.name}`,
        sourceType: 'badge',
        sourceId: badge.id,
      })
    }

    return userBadge
  }

  async getUserBadges(tenantId: number, userId: string): Promise<UserBadgeWithDefinition[]> {
    const userBadges = await this.repository.getUserBadges(tenantId, userId)
    const definitions = await this.repository.getBadgeDefinitions(tenantId)

    const defMap = new Map(definitions.map((d) => [d.id, d]))

    return userBadges
      .map((ub) => ({
        ...ub,
        badge: defMap.get(ub.badgeId)!,
      }))
      .filter((ub) => ub.badge) // Filter out any orphaned badges
  }

  // ==========================================================================
  // Points Management
  // ==========================================================================

  async awardPoints(input: AwardPointsInput): Promise<PointsTransaction | null> {
    if (!this.config.enabled) return null

    const validated = AwardPointsInput.parse(input)
    const id = crypto.randomUUID()

    // Apply streak bonus if applicable
    let finalPoints = validated.points
    if (validated.sourceType === 'lesson' || validated.sourceType === 'resource') {
      const streak = await this.repository.getCurrentStreak(validated.tenantId, validated.userId)
      if (streak >= 3) {
        finalPoints = Math.round(finalPoints * this.config.streakBonusMultiplier!)
      }
    }

    return this.repository.createPointsTransaction({
      ...validated,
      points: finalPoints,
      id,
    })
  }

  async awardLessonPoints(
    tenantId: number,
    userId: string,
    lessonId: string
  ): Promise<PointsTransaction | null> {
    return this.awardPoints({
      tenantId,
      userId,
      points: this.config.pointsPerLesson!,
      reason: 'Completed lesson',
      sourceType: 'lesson',
      sourceId: lessonId,
    })
  }

  async awardModulePoints(
    tenantId: number,
    userId: string,
    moduleId: string
  ): Promise<PointsTransaction | null> {
    return this.awardPoints({
      tenantId,
      userId,
      points: this.config.pointsPerModule!,
      reason: 'Completed module',
      sourceType: 'lesson', // Module completion is a type of lesson milestone
      sourceId: moduleId,
    })
  }

  async awardCoursePoints(
    tenantId: number,
    userId: string,
    courseRunId: string
  ): Promise<PointsTransaction | null> {
    return this.awardPoints({
      tenantId,
      userId,
      points: this.config.pointsPerCourse!,
      reason: 'Completed course',
      sourceType: 'lesson',
      sourceId: courseRunId,
    })
  }

  async awardPerfectScorePoints(
    tenantId: number,
    userId: string,
    resourceId: string
  ): Promise<PointsTransaction | null> {
    return this.awardPoints({
      tenantId,
      userId,
      points: this.config.pointsPerPerfectScore!,
      reason: 'Perfect score on quiz/assignment',
      sourceType: 'resource',
      sourceId: resourceId,
    })
  }

  async getTotalPoints(tenantId: number, userId: string): Promise<number> {
    return this.repository.getTotalPoints(tenantId, userId)
  }

  async getPointsHistory(
    tenantId: number,
    userId: string,
    options?: PointsQueryOptions
  ): Promise<PointsTransaction[]> {
    return this.repository.getPointsTransactions(tenantId, userId, options)
  }

  // ==========================================================================
  // Streak Management
  // ==========================================================================

  async recordActivity(tenantId: number, userId: string): Promise<StreakUpdate> {
    if (!this.config.enabled) {
      return { currentStreak: 0, longestStreak: 0, streakIncreased: false }
    }

    const update = await this.repository.updateStreak(tenantId, userId, new Date())

    // Award streak badge if milestone reached
    if (update.streakIncreased) {
      await this.checkStreakBadges(tenantId, userId, update.currentStreak)
    }

    return update
  }

  async getCurrentStreak(tenantId: number, userId: string): Promise<number> {
    return this.repository.getCurrentStreak(tenantId, userId)
  }

  async getLongestStreak(tenantId: number, userId: string): Promise<number> {
    return this.repository.getLongestStreak(tenantId, userId)
  }

  private async checkStreakBadges(
    tenantId: number,
    userId: string,
    currentStreak: number
  ): Promise<void> {
    const streakMilestones = [
      { days: 7, badge: 'streak_7' },
      { days: 30, badge: 'streak_30' },
      { days: 100, badge: 'streak_100' },
    ]

    for (const milestone of streakMilestones) {
      if (currentStreak === milestone.days) {
        try {
          await this.awardBadge(tenantId, userId, milestone.badge, {
            streakDays: milestone.days,
          })
        } catch {
          // Badge might not exist, ignore
        }
      }
    }
  }

  // ==========================================================================
  // Leaderboard
  // ==========================================================================

  async getLeaderboard(
    tenantId: number,
    options?: LeaderboardOptions
  ): Promise<LeaderboardEntry[]> {
    return this.repository.getLeaderboard(tenantId, {
      ...options,
      limit: options?.limit ?? this.config.leaderboardSize,
    })
  }

  async getUserRank(tenantId: number, userId: string): Promise<number | null> {
    return this.repository.getUserRank(tenantId, userId)
  }

  // ==========================================================================
  // User Summary
  // ==========================================================================

  async getUserSummary(tenantId: number, userId: string): Promise<UserGamificationSummary> {
    return this.repository.getGamificationSummary(tenantId, userId)
  }

  // ==========================================================================
  // Achievement Checks (called from progress events)
  // ==========================================================================

  async checkAchievements(
    tenantId: number,
    userId: string,
    event: AchievementEvent
  ): Promise<AchievementResult[]> {
    if (!this.config.enabled) return []

    const results: AchievementResult[] = []

    switch (event.type) {
      case 'lesson_completed':
        // First lesson badge
        if (event.metadata?.lessonCount === 1) {
          const badge = await this.awardBadge(tenantId, userId, 'first_lesson', {
            lessonId: event.metadata.lessonId,
          })
          if (badge) {
            results.push({ type: 'badge', badge })
          }
        }
        // Award lesson points
        const lessonPoints = await this.awardLessonPoints(
          tenantId,
          userId,
          event.metadata?.lessonId as string
        )
        if (lessonPoints) {
          results.push({ type: 'points', transaction: lessonPoints })
        }
        break

      case 'module_completed':
        const moduleBadge = await this.awardBadge(tenantId, userId, 'module_complete', {
          moduleId: event.metadata?.moduleId,
        })
        if (moduleBadge) {
          results.push({ type: 'badge', badge: moduleBadge })
        }
        const modulePoints = await this.awardModulePoints(
          tenantId,
          userId,
          event.metadata?.moduleId as string
        )
        if (modulePoints) {
          results.push({ type: 'points', transaction: modulePoints })
        }
        break

      case 'course_completed':
        const courseBadge = await this.awardBadge(tenantId, userId, 'course_complete', {
          courseRunId: event.metadata?.courseRunId,
        })
        if (courseBadge) {
          results.push({ type: 'badge', badge: courseBadge })
        }
        const coursePoints = await this.awardCoursePoints(
          tenantId,
          userId,
          event.metadata?.courseRunId as string
        )
        if (coursePoints) {
          results.push({ type: 'points', transaction: coursePoints })
        }
        break

      case 'perfect_score':
        const perfectBadge = await this.awardBadge(tenantId, userId, 'perfect_score', {
          resourceId: event.metadata?.resourceId,
        })
        if (perfectBadge) {
          results.push({ type: 'badge', badge: perfectBadge })
        }
        const perfectPoints = await this.awardPerfectScorePoints(
          tenantId,
          userId,
          event.metadata?.resourceId as string
        )
        if (perfectPoints) {
          results.push({ type: 'points', transaction: perfectPoints })
        }
        break
    }

    // Always record activity for streak
    const streakUpdate = await this.recordActivity(tenantId, userId)
    if (streakUpdate.streakIncreased) {
      results.push({ type: 'streak', update: streakUpdate })
    }

    return results
  }

  // ==========================================================================
  // Seed Default Badges
  // ==========================================================================

  async seedDefaultBadges(): Promise<BadgeDefinition[]> {
    const defaultBadges: CreateBadgeDefinitionInput[] = [
      {
        code: 'first_lesson',
        name: 'First Steps',
        description: 'Completed your first lesson',
        type: 'first_lesson',
        pointsValue: 10,
      },
      {
        code: 'module_complete',
        name: 'Module Master',
        description: 'Completed a module',
        type: 'module_complete',
        pointsValue: 25,
      },
      {
        code: 'course_complete',
        name: 'Course Champion',
        description: 'Completed an entire course',
        type: 'course_complete',
        pointsValue: 100,
      },
      {
        code: 'perfect_score',
        name: 'Perfectionist',
        description: 'Achieved a perfect score on a quiz',
        type: 'perfect_score',
        pointsValue: 25,
      },
      {
        code: 'streak_7',
        name: 'Week Warrior',
        description: '7-day learning streak',
        type: 'streak',
        pointsValue: 50,
      },
      {
        code: 'streak_30',
        name: 'Monthly Master',
        description: '30-day learning streak',
        type: 'streak',
        pointsValue: 200,
      },
      {
        code: 'streak_100',
        name: 'Century Club',
        description: '100-day learning streak',
        type: 'streak',
        pointsValue: 500,
      },
      {
        code: 'early_bird',
        name: 'Early Bird',
        description: 'Completed a lesson before 8 AM',
        type: 'early_bird',
        pointsValue: 15,
      },
      {
        code: 'night_owl',
        name: 'Night Owl',
        description: 'Completed a lesson after 10 PM',
        type: 'night_owl',
        pointsValue: 15,
      },
      {
        code: 'speed_learner',
        name: 'Speed Learner',
        description: 'Completed a module in record time',
        type: 'speed_learner',
        pointsValue: 50,
      },
      {
        code: 'dedicated',
        name: 'Dedicated Learner',
        description: 'Spent over 10 hours learning',
        type: 'dedicated',
        pointsValue: 75,
      },
    ]

    const created: BadgeDefinition[] = []
    for (const badge of defaultBadges) {
      try {
        const result = await this.createBadgeDefinition(badge)
        created.push(result)
      } catch (error) {
        // Skip if badge already exists
        if (
          error instanceof GamificationServiceError &&
          error.code === 'BADGE_CODE_EXISTS'
        ) {
          continue
        }
        throw error
      }
    }

    return created
  }
}

// ============================================================================
// Extended Types
// ============================================================================

export interface UserBadgeWithDefinition extends UserBadge {
  badge: BadgeDefinition
}

export interface StreakUpdate {
  currentStreak: number
  longestStreak: number
  streakIncreased: boolean
  bonusPoints?: number
}

export interface AchievementEvent {
  type:
    | 'lesson_completed'
    | 'module_completed'
    | 'course_completed'
    | 'resource_completed'
    | 'perfect_score'
  metadata?: Record<string, unknown>
}

export type AchievementResult =
  | { type: 'badge'; badge: UserBadge }
  | { type: 'points'; transaction: PointsTransaction }
  | { type: 'streak'; update: StreakUpdate }

// ============================================================================
// Errors
// ============================================================================

export type GamificationServiceErrorCode =
  | 'BADGE_NOT_FOUND'
  | 'BADGE_CODE_EXISTS'
  | 'BADGE_ALREADY_AWARDED'
  | 'INVALID_POINTS'

export class GamificationServiceError extends Error {
  constructor(
    public readonly code: GamificationServiceErrorCode,
    message: string
  ) {
    super(message)
    this.name = 'GamificationServiceError'
  }
}
