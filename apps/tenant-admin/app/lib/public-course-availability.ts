export type PublicRunCandidate = {
  id?: string | number | null
  status?: string | null
  enrollment_status?: string | null
  start_date?: string | null
  max_students?: number | null
  current_enrollments?: number | null
}

export type PublicCourseAvailability = {
  nombre: string
  enrollmentStatus?: string | null
  nextRun?: { startDate?: string | null } | null
}

function dateKey(value: string | Date, timeZone = 'Europe/Madrid'): string | null {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  return year && month && day ? `${year}-${month}-${day}` : null
}

export function isEligiblePublicOpenRun(run: PublicRunCandidate, now: Date = new Date()): boolean {
  const operationalStatus = String(run.status ?? '')
    .trim()
    .toLowerCase()
  if (!['published', 'enrollment_open'].includes(operationalStatus)) return false

  const enrollmentStatus = String(run.enrollment_status ?? '')
    .trim()
    .toLowerCase()
  if (['closed', 'scheduled'].includes(enrollmentStatus)) return false

  const startDateKey = run.start_date ? dateKey(run.start_date) : null
  const todayKey = dateKey(now)
  if (!startDateKey || !todayKey || startDateKey < todayKey) return false

  const capacity = Number(run.max_students)
  const enrollments = Number(run.current_enrollments ?? 0)
  if (Number.isFinite(capacity) && capacity > 0 && enrollments >= capacity) return false

  return true
}

export function comparePublicRunsByStartDate(
  a: Pick<PublicRunCandidate, 'start_date'>,
  b: Pick<PublicRunCandidate, 'start_date'>
): number {
  const aTime = a.start_date ? new Date(a.start_date).getTime() : Number.POSITIVE_INFINITY
  const bTime = b.start_date ? new Date(b.start_date).getTime() : Number.POSITIVE_INFINITY
  return (
    (Number.isFinite(aTime) ? aTime : Number.POSITIVE_INFINITY) -
    (Number.isFinite(bTime) ? bTime : Number.POSITIVE_INFINITY)
  )
}

export function selectEligiblePublicOpenRuns<T extends PublicRunCandidate>(
  runs: T[],
  now: Date = new Date()
): T[] {
  const seenIds = new Set<string>()
  return runs
    .filter((run) => isEligiblePublicOpenRun(run, now))
    .sort(comparePublicRunsByStartDate)
    .filter((run) => {
      const id = run.id == null ? '' : String(run.id)
      if (!id || seenIds.has(id)) return false
      seenIds.add(id)
      return true
    })
}

export function compareCoursesByPublicAvailability(
  a: PublicCourseAvailability,
  b: PublicCourseAvailability
): number {
  const aOpen = a.enrollmentStatus === 'open' ? 0 : 1
  const bOpen = b.enrollmentStatus === 'open' ? 0 : 1
  if (aOpen !== bOpen) return aOpen - bOpen

  const aTime = a.nextRun?.startDate
    ? new Date(a.nextRun.startDate).getTime()
    : Number.POSITIVE_INFINITY
  const bTime = b.nextRun?.startDate
    ? new Date(b.nextRun.startDate).getTime()
    : Number.POSITIVE_INFINITY
  const safeATime = Number.isFinite(aTime) ? aTime : Number.POSITIVE_INFINITY
  const safeBTime = Number.isFinite(bTime) ? bTime : Number.POSITIVE_INFINITY
  if (safeATime !== safeBTime) return safeATime - safeBTime

  return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
}
