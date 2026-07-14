export interface CampusProgressActivity {
  completedAt: string | Date | null
  timeSpentMinutes: number
}

export interface CampusGamificationStats {
  totalPoints: number
  currentStreak: number
  longestStreak: number
  daysActive: number
  lessonsCompleted: number
  hoursLearned: number
  coursesCompleted: number
}

export interface CampusGamificationBadge {
  id: string
  name: string
  description: string
  icon: string
  category: 'learning' | 'achievement' | 'streak' | 'special'
  requirement: string
  isEarned: boolean
  progress: number
  earnedAt?: string
}

export interface CampusRecentActivityItem {
  id: string
  type: 'points' | 'badge'
  title: string
  description: string
  points: number
  earnedAt: string
}

interface BadgeDefinition {
  id: string
  name: string
  description: string
  icon: string
  category: CampusGamificationBadge['category']
  requirement: string
  lessonsRequired?: number
  coursesRequired?: number
  streakRequired?: number
}

export const CAMPUS_BADGE_DEFINITIONS: readonly BadgeDefinition[] = [
  {
    id: 'first-lesson',
    name: 'Primera lección',
    description: 'Completa tu primera lección',
    icon: 'book',
    category: 'learning',
    requirement: 'Completa 1 lección',
    lessonsRequired: 1,
  },
  {
    id: 'fast-learner',
    name: 'Aprendiz rápido',
    description: 'Completa 10 lecciones',
    icon: 'zap',
    category: 'learning',
    requirement: 'Completa 10 lecciones',
    lessonsRequired: 10,
  },
  {
    id: 'dedicated',
    name: 'Dedicado',
    description: 'Completa 50 lecciones',
    icon: 'target',
    category: 'learning',
    requirement: 'Completa 50 lecciones',
    lessonsRequired: 50,
  },
  {
    id: 'scholar',
    name: 'Erudito',
    description: 'Completa tu primer curso',
    icon: 'award',
    category: 'achievement',
    requirement: 'Completa 1 curso',
    coursesRequired: 1,
  },
  {
    id: 'streak-3',
    name: 'En racha',
    description: 'Estudia 3 días seguidos',
    icon: 'flame',
    category: 'streak',
    requirement: 'Racha de 3 días',
    streakRequired: 3,
  },
  {
    id: 'streak-7',
    name: 'Semana perfecta',
    description: 'Estudia 7 días seguidos',
    icon: 'flame',
    category: 'streak',
    requirement: 'Racha de 7 días',
    streakRequired: 7,
  },
  {
    id: 'streak-30',
    name: 'Mes imparable',
    description: 'Estudia 30 días seguidos',
    icon: 'flame',
    category: 'streak',
    requirement: 'Racha de 30 días',
    streakRequired: 30,
  },
]

function utcDay(value: string | Date | null): string | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
}

function dayDifference(left: string, right: string): number {
  const leftTime = Date.parse(`${left}T00:00:00Z`)
  const rightTime = Date.parse(`${right}T00:00:00Z`)
  return Math.round((leftTime - rightTime) / 86_400_000)
}

export function calculateStreaks(
  activityDates: readonly (string | Date | null)[],
  now: Date = new Date(),
): { currentStreak: number; longestStreak: number; daysActive: number } {
  const days = [...new Set(activityDates.map(utcDay).filter((day): day is string => Boolean(day)))].sort()
  if (days.length === 0) return { currentStreak: 0, longestStreak: 0, daysActive: 0 }

  let longestStreak = 1
  let run = 1
  for (let index = 1; index < days.length; index += 1) {
    if (dayDifference(days[index], days[index - 1]) === 1) {
      run += 1
      longestStreak = Math.max(longestStreak, run)
    } else {
      run = 1
    }
  }

  const today = now.toISOString().slice(0, 10)
  const yesterday = new Date(now.getTime() - 86_400_000).toISOString().slice(0, 10)
  const latest = days[days.length - 1]
  let currentStreak = 0
  if (latest === today || latest === yesterday) {
    currentStreak = 1
    for (let index = days.length - 1; index > 0; index -= 1) {
      if (dayDifference(days[index], days[index - 1]) !== 1) break
      currentStreak += 1
    }
  }

  return { currentStreak, longestStreak, daysActive: days.length }
}

function progressForBadge(required: number | undefined, value: number): number {
  if (!required) return 0
  return Math.min(100, Math.round((value / required) * 100))
}

export function buildCampusGamification(
  activities: readonly CampusProgressActivity[],
  coursesCompleted: number,
  now: Date = new Date(),
): {
  stats: CampusGamificationStats
  badges: CampusGamificationBadge[]
  recentActivity: CampusRecentActivityItem[]
  level: number
  levelProgress: number
  nextLevelPoints: number
} {
  const completedActivities = activities.filter((activity) => Boolean(utcDay(activity.completedAt)))
  const lessonsCompleted = completedActivities.length
  const totalPoints = lessonsCompleted * 10
  const hoursLearned = Math.round(
    completedActivities.reduce((total, activity) => total + Math.max(0, activity.timeSpentMinutes), 0) / 60,
  )
  const streaks = calculateStreaks(completedActivities.map((activity) => activity.completedAt), now)
  const latestActivity = [...completedActivities]
    .sort((left, right) => String(right.completedAt).localeCompare(String(left.completedAt)))[0]
  const latestActivityDate = latestActivity?.completedAt
    ? new Date(latestActivity.completedAt).toISOString()
    : now.toISOString()

  const stats: CampusGamificationStats = {
    totalPoints,
    currentStreak: streaks.currentStreak,
    longestStreak: streaks.longestStreak,
    daysActive: streaks.daysActive,
    lessonsCompleted,
    hoursLearned,
    coursesCompleted: Math.max(0, coursesCompleted),
  }

  const badges = CAMPUS_BADGE_DEFINITIONS.map((definition) => {
    const value = definition.lessonsRequired
      ? lessonsCompleted
      : definition.coursesRequired
        ? stats.coursesCompleted
        : streaks.longestStreak
    const required = definition.lessonsRequired ?? definition.coursesRequired ?? definition.streakRequired
    const isEarned = Boolean(required && value >= required)
    return {
      ...definition,
      isEarned,
      progress: isEarned ? 100 : progressForBadge(required, value),
      earnedAt: isEarned ? latestActivityDate : undefined,
    }
  })

  const recentActivity = completedActivities
    .slice()
    .sort((left, right) => String(right.completedAt).localeCompare(String(left.completedAt)))
    .slice(0, 5)
    .map((activity, index) => ({
      id: `lesson-${index + 1}-${utcDay(activity.completedAt)}`,
      type: 'points' as const,
      title: 'Lección completada',
      description: 'Has ganado puntos por completar una lección',
      points: 10,
      earnedAt: new Date(activity.completedAt as string | Date).toISOString(),
    }))

  const level = Math.floor(totalPoints / 100) + 1
  const currentLevelPoints = (level - 1) * 100
  const nextLevelPoints = level * 100
  const levelProgress = Math.round(((totalPoints - currentLevelPoints) / 100) * 100)

  return { stats, badges, recentActivity, level, levelProgress, nextLevelPoints }
}
