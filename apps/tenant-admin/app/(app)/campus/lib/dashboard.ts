export type UpcomingKind = 'session' | 'assignment' | 'tutoring'

export interface EnrollmentCard {
  id: string
  courseTitle: string
  courseThumbnail?: string | null
  courseRunTitle: string
  status: string
  progressPercent: number
  lastAccessedAt?: string
  estimatedMinutesRemaining: number
  lastLessonId?: string
}

export interface StudentStats {
  totalCourses: number
  completedCourses: number
  currentStreak: number
  totalBadges: number
  totalPoints: number
}

export interface LiveClass {
  title: string
  teacherName: string | null
  startsAt: string
  endsAt: string
  joinUrl: string | null
  lessonHref: string
  place?: string | null
}

export interface UpcomingItem {
  kind: UpcomingKind
  title: string
  at: string
  place?: string | null
  dueAt?: string | null
}

export interface RecentBadge {
  id: string
  name: string
}

export interface CampusDashboardPayload {
  enrollments: EnrollmentCard[]
  stats: StudentStats | null
  liveClass: LiveClass | null
  upcoming: UpcomingItem[]
  attendanceRate: number | null
  badges: RecentBadge[]
  weeklyActivity: number[]
}

export function greetingSubtitle(liveCount: number, pendingAssignments: number): string {
  const parts: string[] = []
  if (liveCount === 1) parts.push('1 clase en directo hoy')
  else if (liveCount > 1) parts.push(`${liveCount} clases en directo hoy`)
  if (pendingAssignments === 1) parts.push('1 tarea pendiente de entrega')
  else if (pendingAssignments > 1) parts.push(`${pendingAssignments} tareas pendientes de entrega`)
  if (parts.length === 0) return 'Continúa donde lo dejaste.'
  if (parts.length === 1) return `Tienes ${parts[0]}.`
  return `Tienes ${parts[0]} y ${parts[1]}.`
}

export function overallProgressPercent(enrollments: EnrollmentCard[]): number {
  const active = enrollments.filter((item) => item.status !== 'completed')
  if (active.length === 0) return 0
  const sum = active.reduce((acc, item) => acc + (item.progressPercent ?? 0), 0)
  return Math.round(sum / active.length)
}

export function continueEnrollments(enrollments: EnrollmentCard[], limit = 3): EnrollmentCard[] {
  return enrollments
    .filter((item) => item.status !== 'completed')
    .slice(0, limit)
}

export function dueBadgeLabel(dueAt: string | null | undefined, now = new Date()): string | null {
  if (!dueAt) return null
  const due = new Date(dueAt)
  if (Number.isNaN(due.getTime())) return null
  const hours = (due.getTime() - now.getTime()) / (1000 * 60 * 60)
  if (hours <= 0 || hours > 24) return null
  const rounded = Math.max(1, Math.round(hours))
  return `Quedan ${rounded}h`
}

export function isActiveEnrollmentStatus(status: string | undefined): boolean {
  return status === 'enrolled' || status === 'in_progress' || status === 'confirmed' || status === 'active'
}
