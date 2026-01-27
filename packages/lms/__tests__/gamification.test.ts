/**
 * @module @akademate/lms/__tests__/gamification
 * Tests for GamificationService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  GamificationService,
  GamificationServiceError,
  type GamificationRepository,
  type CreateBadgeDefinitionInput,
  type StreakUpdate,
} from '../src/gamification'
import type {
  BadgeDefinition,
  UserBadge,
  PointsTransaction,
  UserGamificationSummary,
  LeaderboardEntry,
} from '../src/types'

// Mock repository factory
function createMockRepository(): GamificationRepository {
  const badges = new Map<string, BadgeDefinition>()
  const userBadges = new Map<string, UserBadge[]>()
  const pointsTransactions = new Map<string, PointsTransaction[]>()
  const streaks = new Map<string, { current: number; longest: number; lastActivity: Date }>()

  const getUserKey = (tenantId: number, userId: string) => `${tenantId}:${userId}`

  return {
    // Badge Definitions
    createBadgeDefinition: vi.fn(async (input) => {
      const badge = input as BadgeDefinition
      badges.set(badge.id, badge)
      return badge
    }),
    getBadgeDefinition: vi.fn(async (id) => badges.get(id) ?? null),
    getBadgeDefinitionByCode: vi.fn(async (code, tenantId) => {
      return (
        Array.from(badges.values()).find(
          (b) =>
            b.code === code && (b.tenantId === undefined || b.tenantId === tenantId)
        ) || null
      )
    }),
    getBadgeDefinitions: vi.fn(async (tenantId) => {
      return Array.from(badges.values()).filter(
        (b) => b.tenantId === undefined || b.tenantId === tenantId
      )
    }),
    updateBadgeDefinition: vi.fn(async (id, input) => {
      const existing = badges.get(id)
      if (!existing) throw new Error('Not found')
      const updated = { ...existing, ...input }
      badges.set(id, updated)
      return updated
    }),
    deleteBadgeDefinition: vi.fn(async (id) => {
      badges.delete(id)
    }),

    // User Badges
    awardBadge: vi.fn(async (tenantId, userId, badgeId, metadata) => {
      const key = getUserKey(tenantId, userId)
      const userBadge: UserBadge = {
        id: crypto.randomUUID(),
        tenantId,
        userId,
        badgeId,
        earnedAt: new Date(),
        metadata: metadata || {},
      }
      const existing = userBadges.get(key) ?? []
      userBadges.set(key, [...existing, userBadge])
      return userBadge
    }),
    getUserBadges: vi.fn(async (tenantId, userId) => {
      const key = getUserKey(tenantId, userId)
      return userBadges.get(key) ?? []
    }),
    hasUserBadge: vi.fn(async (tenantId, userId, badgeId) => {
      const key = getUserKey(tenantId, userId)
      const badges = userBadges.get(key) ?? []
      return badges.some((b) => b.badgeId === badgeId)
    }),
    revokeBadge: vi.fn(async (tenantId, userId, badgeId) => {
      const key = getUserKey(tenantId, userId)
      const badges = userBadges.get(key) ?? []
      userBadges.set(
        key,
        badges.filter((b) => b.badgeId !== badgeId)
      )
    }),

    // Points
    createPointsTransaction: vi.fn(async (input) => {
      const transaction = { ...input, createdAt: new Date() } as PointsTransaction
      const key = getUserKey(input.tenantId, input.userId)
      const existing = pointsTransactions.get(key) ?? []
      pointsTransactions.set(key, [...existing, transaction])
      return transaction
    }),
    getPointsTransactions: vi.fn(async (tenantId, userId) => {
      const key = getUserKey(tenantId, userId)
      return pointsTransactions.get(key) ?? []
    }),
    getTotalPoints: vi.fn(async (tenantId, userId) => {
      const key = getUserKey(tenantId, userId)
      const transactions = pointsTransactions.get(key) ?? []
      return transactions.reduce((sum, t) => sum + t.points, 0)
    }),

    // Streaks
    getCurrentStreak: vi.fn(async (tenantId, userId) => {
      const key = getUserKey(tenantId, userId)
      return streaks.get(key)?.current ?? 0
    }),
    getLongestStreak: vi.fn(async (tenantId, userId) => {
      const key = getUserKey(tenantId, userId)
      return streaks.get(key)?.longest ?? 0
    }),
    updateStreak: vi.fn(async (tenantId, userId, activityDate) => {
      const key = getUserKey(tenantId, userId)
      const existing = streaks.get(key)

      if (!existing) {
        streaks.set(key, { current: 1, longest: 1, lastActivity: activityDate })
        return { currentStreak: 1, longestStreak: 1, streakIncreased: true }
      }

      const hoursSinceLastActivity =
        (activityDate.getTime() - existing.lastActivity.getTime()) / (1000 * 60 * 60)

      let update: StreakUpdate

      if (hoursSinceLastActivity < 24) {
        // Same day, no change
        update = {
          currentStreak: existing.current,
          longestStreak: existing.longest,
          streakIncreased: false,
        }
      } else if (hoursSinceLastActivity < 48) {
        // Next day, increase streak
        const newCurrent = existing.current + 1
        const newLongest = Math.max(existing.longest, newCurrent)
        streaks.set(key, { current: newCurrent, longest: newLongest, lastActivity: activityDate })
        update = {
          currentStreak: newCurrent,
          longestStreak: newLongest,
          streakIncreased: true,
        }
      } else {
        // Streak broken, reset to 1
        streaks.set(key, { current: 1, longest: existing.longest, lastActivity: activityDate })
        update = {
          currentStreak: 1,
          longestStreak: existing.longest,
          streakIncreased: false,
        }
      }

      return update
    }),

    // Leaderboard
    getLeaderboard: vi.fn(async () => {
      const entries: LeaderboardEntry[] = []
      // Would aggregate from pointsTransactions in real implementation
      return entries
    }),
    getUserRank: vi.fn(async () => null),

    // Summary
    getGamificationSummary: vi.fn(async (tenantId, userId) => {
      const key = getUserKey(tenantId, userId)
      const badges = userBadges.get(key) ?? []
      const transactions = pointsTransactions.get(key) ?? []
      const streak = streaks.get(key)

      return {
        userId,
        tenantId,
        totalPoints: transactions.reduce((sum, t) => sum + t.points, 0),
        currentStreak: streak?.current ?? 0,
        longestStreak: streak?.longest ?? 0,
        badgesCount: badges.length,
      } as UserGamificationSummary
    }),
  }
}

describe('GamificationService', () => {
  let service: GamificationService
  let repository: GamificationRepository

  const tenantId = 1
  const userId = '550e8400-e29b-41d4-a716-446655440001' // Valid UUID

  beforeEach(() => {
    repository = createMockRepository()
    service = new GamificationService(repository)
  })

  describe('Badge Management', () => {
    const badgeInput: CreateBadgeDefinitionInput = {
      code: 'test_badge',
      name: 'Test Badge',
      description: 'A test badge',
      type: 'custom',
      pointsValue: 50,
      isActive: true,
    }

    it('should create a badge definition', async () => {
      const badge = await service.createBadgeDefinition(badgeInput)

      expect(badge).toBeDefined()
      expect(badge.id).toBeDefined()
      expect(badge.code).toBe('test_badge')
      expect(badge.pointsValue).toBe(50)
    })

    it('should prevent duplicate badge codes', async () => {
      await service.createBadgeDefinition(badgeInput)

      await expect(service.createBadgeDefinition(badgeInput)).rejects.toThrow(
        GamificationServiceError
      )
    })

    it('should get badge definitions', async () => {
      await service.createBadgeDefinition(badgeInput)
      await service.createBadgeDefinition({
        ...badgeInput,
        code: 'another_badge',
        name: 'Another Badge',
      })

      const badges = await service.getBadgeDefinitions(tenantId)

      expect(badges).toHaveLength(2)
    })

    it('should award a badge to user', async () => {
      const badge = await service.createBadgeDefinition(badgeInput)

      const userBadge = await service.awardBadge(tenantId, userId, 'test_badge', {
        reason: 'Testing',
      })

      expect(userBadge).toBeDefined()
      expect(userBadge?.badgeId).toBe(badge.id)
      expect(userBadge?.userId).toBe(userId)
    })

    it('should not award duplicate badge', async () => {
      await service.createBadgeDefinition(badgeInput)

      await service.awardBadge(tenantId, userId, 'test_badge')
      const duplicate = await service.awardBadge(tenantId, userId, 'test_badge')

      expect(duplicate).toBeNull()
    })

    it('should throw for non-existent badge', async () => {
      await expect(
        service.awardBadge(tenantId, userId, 'non_existent_badge')
      ).rejects.toThrow(GamificationServiceError)
    })

    it('should award points when badge is earned', async () => {
      await service.createBadgeDefinition(badgeInput)
      await service.awardBadge(tenantId, userId, 'test_badge')

      const totalPoints = await service.getTotalPoints(tenantId, userId)

      expect(totalPoints).toBe(50)
    })

    it('should get user badges with definitions', async () => {
      await service.createBadgeDefinition(badgeInput)
      await service.awardBadge(tenantId, userId, 'test_badge')

      const badges = await service.getUserBadges(tenantId, userId)

      expect(badges).toHaveLength(1)
      expect(badges[0].badge).toBeDefined()
      expect(badges[0].badge.name).toBe('Test Badge')
    })
  })

  describe('Points Management', () => {
    it('should award points', async () => {
      const transaction = await service.awardPoints({
        tenantId,
        userId,
        points: 100,
        reason: 'Test points',
        sourceType: 'manual',
      })

      expect(transaction).toBeDefined()
      expect(transaction?.points).toBe(100)
    })

    it('should get total points', async () => {
      await service.awardPoints({
        tenantId,
        userId,
        points: 100,
        reason: 'First award',
        sourceType: 'manual',
      })
      await service.awardPoints({
        tenantId,
        userId,
        points: 50,
        reason: 'Second award',
        sourceType: 'manual',
      })

      const total = await service.getTotalPoints(tenantId, userId)

      expect(total).toBe(150)
    })

    it('should award lesson points', async () => {
      const lessonId = '550e8400-e29b-41d4-a716-446655440010'
      const transaction = await service.awardLessonPoints(tenantId, userId, lessonId)

      expect(transaction).toBeDefined()
      expect(transaction?.points).toBe(10) // Default points per lesson
      expect(transaction?.sourceType).toBe('lesson')
    })

    it('should award module points', async () => {
      const moduleId = '550e8400-e29b-41d4-a716-446655440011'
      const transaction = await service.awardModulePoints(tenantId, userId, moduleId)

      expect(transaction).toBeDefined()
      expect(transaction?.points).toBe(50) // Default points per module
    })

    it('should award course points', async () => {
      const courseId = '550e8400-e29b-41d4-a716-446655440012'
      const transaction = await service.awardCoursePoints(tenantId, userId, courseId)

      expect(transaction).toBeDefined()
      expect(transaction?.points).toBe(200) // Default points per course
    })

    it('should award perfect score points', async () => {
      const resourceId = '550e8400-e29b-41d4-a716-446655440013'
      const transaction = await service.awardPerfectScorePoints(
        tenantId,
        userId,
        resourceId
      )

      expect(transaction).toBeDefined()
      expect(transaction?.points).toBe(25) // Default points for perfect score
    })

    it('should apply streak bonus for 3+ day streak', async () => {
      const lessonId = '550e8400-e29b-41d4-a716-446655440014'
      // Build up a 3-day streak
      const baseDate = new Date()
      await repository.updateStreak(tenantId, userId, new Date(baseDate.getTime() - 48 * 60 * 60 * 1000))
      await repository.updateStreak(tenantId, userId, new Date(baseDate.getTime() - 24 * 60 * 60 * 1000))
      await repository.updateStreak(tenantId, userId, baseDate)

      // Now current streak should be 3
      vi.mocked(repository.getCurrentStreak).mockResolvedValueOnce(3)

      const transaction = await service.awardLessonPoints(tenantId, userId, lessonId)

      // 10 points * 1.5 streak bonus = 15
      expect(transaction?.points).toBe(15)
    })

    it('should get points history', async () => {
      await service.awardPoints({
        tenantId,
        userId,
        points: 100,
        reason: 'First award',
        sourceType: 'manual',
      })
      await service.awardPoints({
        tenantId,
        userId,
        points: 50,
        reason: 'Second award',
        sourceType: 'lesson',
      })

      const history = await service.getPointsHistory(tenantId, userId)

      expect(history).toHaveLength(2)
    })
  })

  describe('Streak Management', () => {
    it('should record activity and start streak', async () => {
      const update = await service.recordActivity(tenantId, userId)

      expect(update.currentStreak).toBe(1)
      expect(update.streakIncreased).toBe(true)
    })

    it('should get current streak', async () => {
      await service.recordActivity(tenantId, userId)

      const streak = await service.getCurrentStreak(tenantId, userId)

      expect(streak).toBe(1)
    })

    it('should get longest streak', async () => {
      await service.recordActivity(tenantId, userId)

      const longest = await service.getLongestStreak(tenantId, userId)

      expect(longest).toBe(1)
    })
  })

  describe('User Summary', () => {
    it('should return user gamification summary', async () => {
      // Award some points
      await service.awardPoints({
        tenantId,
        userId,
        points: 100,
        reason: 'Test',
        sourceType: 'manual',
      })

      // Record activity
      await service.recordActivity(tenantId, userId)

      const summary = await service.getUserSummary(tenantId, userId)

      expect(summary).toBeDefined()
      expect(summary.userId).toBe(userId)
      expect(summary.totalPoints).toBe(100)
      expect(summary.currentStreak).toBe(1)
    })
  })

  describe('Achievement Checks', () => {
    beforeEach(async () => {
      // Create necessary badges
      await service.createBadgeDefinition({
        code: 'first_lesson',
        name: 'First Steps',
        type: 'first_lesson',
        pointsValue: 10,
      })
      await service.createBadgeDefinition({
        code: 'module_complete',
        name: 'Module Master',
        type: 'module_complete',
        pointsValue: 25,
      })
      await service.createBadgeDefinition({
        code: 'course_complete',
        name: 'Course Champion',
        type: 'course_complete',
        pointsValue: 100,
      })
      await service.createBadgeDefinition({
        code: 'perfect_score',
        name: 'Perfectionist',
        type: 'perfect_score',
        pointsValue: 25,
      })
    })

    it('should check first lesson achievement', async () => {
      const lessonId = '550e8400-e29b-41d4-a716-446655440020'
      const results = await service.checkAchievements(tenantId, userId, {
        type: 'lesson_completed',
        metadata: { lessonCount: 1, lessonId },
      })

      const badgeResult = results.find((r) => r.type === 'badge')
      expect(badgeResult).toBeDefined()
    })

    it('should check module completion achievement', async () => {
      const moduleId = '550e8400-e29b-41d4-a716-446655440021'
      const results = await service.checkAchievements(tenantId, userId, {
        type: 'module_completed',
        metadata: { moduleId },
      })

      const badgeResult = results.find((r) => r.type === 'badge')
      const pointsResult = results.find((r) => r.type === 'points')

      expect(badgeResult).toBeDefined()
      expect(pointsResult).toBeDefined()
    })

    it('should check course completion achievement', async () => {
      const courseRunId = '550e8400-e29b-41d4-a716-446655440022'
      const results = await service.checkAchievements(tenantId, userId, {
        type: 'course_completed',
        metadata: { courseRunId },
      })

      const badgeResult = results.find((r) => r.type === 'badge')
      const pointsResult = results.find((r) => r.type === 'points')

      expect(badgeResult).toBeDefined()
      expect(pointsResult).toBeDefined()
    })

    it('should check perfect score achievement', async () => {
      const resourceId = '550e8400-e29b-41d4-a716-446655440023'
      const results = await service.checkAchievements(tenantId, userId, {
        type: 'perfect_score',
        metadata: { resourceId },
      })

      const badgeResult = results.find((r) => r.type === 'badge')
      expect(badgeResult).toBeDefined()
    })

    it('should record streak on any achievement', async () => {
      const lessonId = '550e8400-e29b-41d4-a716-446655440024'
      const results = await service.checkAchievements(tenantId, userId, {
        type: 'lesson_completed',
        metadata: { lessonCount: 2, lessonId },
      })

      const streakResult = results.find((r) => r.type === 'streak')
      expect(streakResult).toBeDefined()
    })
  })

  describe('Default Badges', () => {
    it('should seed default badges', async () => {
      const created = await service.seedDefaultBadges()

      expect(created.length).toBeGreaterThan(0)
      expect(created.some((b) => b.code === 'first_lesson')).toBe(true)
      expect(created.some((b) => b.code === 'course_complete')).toBe(true)
      expect(created.some((b) => b.code === 'streak_7')).toBe(true)
    })

    it('should skip existing badges when seeding', async () => {
      // First seed
      await service.seedDefaultBadges()

      // Second seed should not fail
      const secondSeed = await service.seedDefaultBadges()

      // Should return empty array since all badges already exist
      expect(secondSeed).toHaveLength(0)
    })
  })

  describe('Disabled Gamification', () => {
    let disabledService: GamificationService

    beforeEach(() => {
      disabledService = new GamificationService(repository, { enabled: false })
    })

    it('should return null for points when disabled', async () => {
      const transaction = await disabledService.awardPoints({
        tenantId,
        userId,
        points: 100,
        reason: 'Test',
        sourceType: 'manual',
      })

      expect(transaction).toBeNull()
    })

    it('should return null for badges when disabled', async () => {
      await service.createBadgeDefinition({
        code: 'test_badge',
        name: 'Test',
        type: 'custom',
        pointsValue: 0,
      })

      const badge = await disabledService.awardBadge(tenantId, userId, 'test_badge')

      expect(badge).toBeNull()
    })

    it('should return empty achievements when disabled', async () => {
      const results = await disabledService.checkAchievements(tenantId, userId, {
        type: 'lesson_completed',
        metadata: {},
      })

      expect(results).toHaveLength(0)
    })
  })

  describe('Configuration', () => {
    it('should use custom points configuration', async () => {
      const customService = new GamificationService(repository, {
        pointsPerLesson: 20,
        pointsPerModule: 100,
        pointsPerCourse: 500,
      })

      const lessonId = '550e8400-e29b-41d4-a716-446655440030'
      const moduleId = '550e8400-e29b-41d4-a716-446655440031'
      const courseId = '550e8400-e29b-41d4-a716-446655440032'

      const lessonPoints = await customService.awardLessonPoints(
        tenantId,
        userId,
        lessonId
      )
      const modulePoints = await customService.awardModulePoints(
        tenantId,
        userId,
        moduleId
      )
      const coursePoints = await customService.awardCoursePoints(
        tenantId,
        userId,
        courseId
      )

      expect(lessonPoints?.points).toBe(20)
      expect(modulePoints?.points).toBe(100)
      expect(coursePoints?.points).toBe(500)
    })

    it('should use custom streak bonus multiplier', async () => {
      const customService = new GamificationService(repository, {
        streakBonusMultiplier: 2.0,
      })

      const lessonId = '550e8400-e29b-41d4-a716-446655440033'

      // Mock 3+ day streak
      vi.mocked(repository.getCurrentStreak).mockResolvedValueOnce(3)

      const transaction = await customService.awardLessonPoints(
        tenantId,
        userId,
        lessonId
      )

      // 10 points * 2.0 multiplier = 20
      expect(transaction?.points).toBe(20)
    })
  })
})
