import { dueBadgeLabel, isActiveEnrollmentStatus, type UpcomingItem } from '../../../(app)/campus/lib/dashboard'

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

export type LooseMedia = { url?: string }

export type LooseStaff = {
  first_name?: string
  last_name?: string
  full_name?: string
}

export type LooseClassroom = { name?: string }
export type LooseCampus = { name?: string }

export type LooseCourse = {
  title?: string
  name?: string
  thumbnail?: LooseMedia
  featured_image?: LooseMedia
  estimatedHours?: number
  duration_hours?: number
}

export type LooseCourseRun = {
  id?: string | number
  title?: string
  codigo?: string
  course?: LooseCourse | string | number
  instructor?: LooseStaff | string | number
  classroom?: LooseClassroom | string | number
  campus?: LooseCampus | string | number
  start_date?: string
  end_date?: string
  schedule_days?: string[]
  schedule_time_start?: string
  schedule_time_end?: string
}

export type LooseEnrollmentDoc = {
  id: string | number
  status?: string
  course_run?: LooseCourseRun | string | number
  courseRun?: LooseCourseRun | string | number
  progressPercent?: number
  progress_percent?: number
  attendance_percentage?: number
  lastAccessedAt?: string
  last_accessed_at?: string
  updatedAt?: string
}

export type LooseBadge = { id?: string | number; name?: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asObject<T>(value: unknown): T | undefined {
  if (!isRecord(value)) return undefined
  return value as T
}

function mediaUrl(media: unknown): string | null {
  const obj = asObject<LooseMedia>(media)
  return obj?.url ?? null
}

function staffName(staff: unknown): string | null {
  const obj = asObject<LooseStaff>(staff)
  if (!obj) return null
  if (obj.full_name?.trim()) return obj.full_name.trim()
  const combined = [obj.first_name, obj.last_name].filter(Boolean).join(' ').trim()
  return combined || null
}

function placeName(run: LooseCourseRun): string | null {
  const classroom = asObject<LooseClassroom>(run.classroom)
  if (classroom?.name) return classroom.name
  const campus = asObject<LooseCampus>(run.campus)
  return campus?.name ?? null
}

export function resolveCourseRun(enrollment: LooseEnrollmentDoc): LooseCourseRun | undefined {
  return asObject<LooseCourseRun>(enrollment.course_run) ?? asObject<LooseCourseRun>(enrollment.courseRun)
}

export function resolveCourse(run: LooseCourseRun | undefined): LooseCourse | undefined {
  if (!run) return undefined
  return asObject<LooseCourse>(run.course)
}

export function progressFromEnrollment(enrollment: LooseEnrollmentDoc): number {
  const value = enrollment.progressPercent ?? enrollment.progress_percent
  if (typeof value !== 'number' || Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, value))
}

export function mapEnrollmentCard(enrollment: LooseEnrollmentDoc) {
  const run = resolveCourseRun(enrollment)
  const course = resolveCourse(run)
  const progressPercent = progressFromEnrollment(enrollment)
  const hours = course?.estimatedHours ?? course?.duration_hours ?? 10

  return {
    id: String(enrollment.id),
    courseTitle: course?.title ?? course?.name ?? 'Curso',
    courseThumbnail: mediaUrl(course?.thumbnail) ?? mediaUrl(course?.featured_image),
    courseRunTitle: run?.title ?? run?.codigo ?? '',
    status: enrollment.status ?? 'unknown',
    progressPercent,
    lastAccessedAt: enrollment.lastAccessedAt ?? enrollment.last_accessed_at ?? enrollment.updatedAt,
    estimatedMinutesRemaining: Math.round(((100 - progressPercent) / 100) * hours * 60),
  }
}

export function averageAttendance(docs: LooseEnrollmentDoc[]): number | null {
  const values = docs
    .map((doc) => doc.attendance_percentage)
    .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value))
  if (values.length === 0) return null
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function combineDateAndTime(day: Date, time?: string): Date {
  const next = new Date(day)
  if (!time) {
    next.setHours(9, 0, 0, 0)
    return next
  }
  const [hours, minutes, seconds] = time.split(':').map((part) => Number(part) || 0)
  next.setHours(hours, minutes, seconds, 0)
  return next
}

function runCoversDate(run: LooseCourseRun, day: Date): boolean {
  const start = run.start_date ? new Date(run.start_date) : null
  const end = run.end_date ? new Date(run.end_date) : null
  if (start && day < new Date(start.getFullYear(), start.getMonth(), start.getDate())) return false
  if (end) {
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59)
    if (day > endDay) return false
  }
  const days = run.schedule_days
  if (!days || days.length === 0) return false
  return days.includes(WEEKDAYS[day.getDay()])
}

export function buildLiveAndUpcoming(
  enrollments: LooseEnrollmentDoc[],
  now = new Date()
): { liveClass: import('../../../(app)/campus/lib/dashboard').LiveClass | null; upcoming: UpcomingItem[] } {
  const upcoming: UpcomingItem[] = []
  let liveClass: import('../../../(app)/campus/lib/dashboard').LiveClass | null = null

  for (const enrollment of enrollments) {
    if (!isActiveEnrollmentStatus(enrollment.status) && enrollment.status !== 'in_progress') {
      if (enrollment.status === 'completed' || enrollment.status === 'cancelled' || enrollment.status === 'withdrawn') {
        continue
      }
    }
    const run = resolveCourseRun(enrollment)
    if (!run) continue
    const course = resolveCourse(run)
    const title = course?.title ?? course?.name ?? run.title ?? run.codigo ?? 'Sesión'
    const teacherName = staffName(run.instructor)
    const place = placeName(run)
    const href = `/campus/cursos/${enrollment.id}`

    for (let offset = 0; offset < 7; offset += 1) {
      const day = new Date(now)
      day.setHours(0, 0, 0, 0)
      day.setDate(day.getDate() + offset)
      if (!runCoversDate(run, day)) continue
      const startsAt = combineDateAndTime(day, run.schedule_time_start)
      const endsAt = combineDateAndTime(day, run.schedule_time_end || run.schedule_time_start)
      if (endsAt.getTime() <= startsAt.getTime()) {
        endsAt.setHours(startsAt.getHours() + 2)
      }
      if (offset === 0 && now >= startsAt && now <= endsAt && !liveClass) {
        liveClass = {
          title,
          teacherName,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          joinUrl: null,
          lessonHref: href,
          place,
        }
        continue
      }
      if (endsAt > now) {
        upcoming.push({
          kind: 'session',
          title,
          at: startsAt.toISOString(),
          place,
          dueAt: null,
        })
      }
    }
  }

  upcoming.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
  return { liveClass, upcoming: upcoming.slice(0, 5) }
}

export function mapBadges(docs: unknown[]): { id: string; name: string }[] {
  return docs
    .map((doc) => asObject<LooseBadge>(doc))
    .filter((doc): doc is LooseBadge => Boolean(doc?.name))
    .map((doc) => ({ id: String(doc.id ?? doc.name), name: String(doc.name) }))
    .slice(0, 6)
}

export function weeklyActivityFromStreak(currentStreak: number): number[] {
  const days = [0, 0, 0, 0, 0, 0, 0]
  const filled = Math.max(0, Math.min(7, currentStreak))
  for (let i = 0; i < filled; i += 1) {
    days[6 - i] = 1
  }
  return days
}

export { dueBadgeLabel }
