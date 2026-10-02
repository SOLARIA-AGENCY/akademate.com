import type { CatalogSnapshot } from './render'

export type PublicEnrollment = 'open' | 'closed' | 'upcoming'

export type HomeCourseBadge = 'open' | 'running' | 'upcoming'

export function isEnrollmentDeadlinePassed(deadline: string | null | undefined, now = new Date()): boolean {
  const raw = String(deadline || '').trim()
  if (!raw) return false
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T23:59:59.999`) : new Date(raw)
  if (Number.isNaN(date.getTime())) return false
  return now.getTime() > date.getTime()
}

export function runEnrollment(
  run: {
    status?: string | null
    enrollmentDeadline?: string | null
    enrollment_deadline?: string | null
  },
  now = new Date(),
): PublicEnrollment | null {
  const status = String(run.status || '').toLowerCase()
  const deadline = run.enrollmentDeadline ?? run.enrollment_deadline ?? null
  if (status === 'published') return 'upcoming'
  if (status === 'enrollment_closed' || status === 'in_progress' || status === 'completed') return 'closed'
  if (status === 'enrollment_open' || status === 'open') {
    return isEnrollmentDeadlinePassed(deadline, now) ? 'closed' : 'open'
  }
  return null
}

export function combineEnrollment(states: Array<PublicEnrollment | null | undefined>): PublicEnrollment | null {
  const values = states.filter((state): state is PublicEnrollment => Boolean(state))
  if (values.includes('open')) return 'open'
  if (values.includes('upcoming')) return 'upcoming'
  if (values.includes('closed')) return 'closed'
  return null
}

export function enrollmentLabel(state: PublicEnrollment | null | undefined): string {
  if (state === 'open') return 'Matrícula abierta'
  if (state === 'closed') return 'Matrícula cerrada'
  return 'Próximamente'
}

function isStartReached(start: string | null | undefined, now: Date): boolean {
  const raw = String(start || '').trim()
  if (!raw) return false
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00.000`) : new Date(raw)
  if (Number.isNaN(date.getTime())) return false
  return now.getTime() >= date.getTime()
}

/** Home list only. Completed runs paint nothing. Closed without a past start is upcoming. */
export function homeRunBadge(
  run: {
    status?: string | null
    enrollmentDeadline?: string | null
    enrollment_deadline?: string | null
    startDate?: string | null
    start_date?: string | null
  },
  now = new Date(),
): HomeCourseBadge | null {
  const status = String(run.status || '').toLowerCase()
  const deadline = run.enrollmentDeadline ?? run.enrollment_deadline ?? null
  const started = isStartReached(run.startDate ?? run.start_date ?? null, now)
  if (status === 'completed') return null
  if (status === 'published') return 'upcoming'
  if (status === 'in_progress') return 'running'
  if (status === 'enrollment_closed') return started ? 'running' : 'upcoming'
  if (status === 'enrollment_open' || status === 'open') {
    if (!isEnrollmentDeadlinePassed(deadline, now)) {
      return started ? 'running' : 'open'
    }
    return started ? 'running' : 'upcoming'
  }
  return null
}

export function combineHomeBadges(states: Array<HomeCourseBadge | null | undefined>): HomeCourseBadge | null {
  const values = states.filter((state): state is HomeCourseBadge => Boolean(state))
  if (values.includes('open')) return 'open'
  if (values.includes('running')) return 'running'
  if (values.includes('upcoming')) return 'upcoming'
  return null
}

export function homeBadgeByCourseSlug(
  snapshot: CatalogSnapshot | null | undefined,
  now = new Date(),
): Record<string, HomeCourseBadge | null> {
  const buckets: Record<string, HomeCourseBadge[]> = {}
  const seen = new Set<string>()
  for (const conv of snapshot?.data.convocatorias || []) {
    const slug = conv.course?.slug
    if (!slug) continue
    seen.add(slug)
    const badge = homeRunBadge(conv, now)
    if (badge) (buckets[slug] ||= []).push(badge)
  }

  const out: Record<string, HomeCourseBadge | null> = {}
  for (const slug of seen) {
    out[slug] = combineHomeBadges(buckets[slug] || [])
  }

  for (const course of snapshot?.data.courses || []) {
    if (!course.slug || seen.has(course.slug)) continue
    if (course.enrollmentStatus === 'open') out[course.slug] = 'open'
    else out[course.slug] = 'upcoming'
  }

  return out
}

export function enrollmentByCourseSlug(
  snapshot: CatalogSnapshot | null | undefined,
  now = new Date(),
): Record<string, PublicEnrollment> {
  const buckets: Record<string, PublicEnrollment[]> = {}
  const push = (slug: string | null | undefined, state: PublicEnrollment | null) => {
    if (!slug || !state) return
    ;(buckets[slug] ||= []).push(state)
  }

  for (const conv of snapshot?.data.convocatorias || []) {
    push(conv.course?.slug, runEnrollment(conv, now))
  }

  const out: Record<string, PublicEnrollment> = {}
  for (const [slug, states] of Object.entries(buckets)) {
    const combined = combineEnrollment(states)
    if (combined) out[slug] = combined
  }

  for (const course of snapshot?.data.courses || []) {
    if (!course.slug || out[course.slug]) continue
    if (course.enrollmentStatus === 'open') out[course.slug] = 'open'
    else if (course.enrollmentStatus === 'closed') out[course.slug] = 'closed'
    else if (course.enrollmentStatus === 'published') out[course.slug] = 'upcoming'
  }

  return out
}

export function enrollmentByCycleSlug(
  snapshot: CatalogSnapshot | null | undefined,
  now = new Date(),
): Record<string, PublicEnrollment> {
  const buckets: Record<string, PublicEnrollment[]> = {}
  const push = (slug: string | null | undefined, state: PublicEnrollment | null) => {
    if (!slug || !state) return
    ;(buckets[slug] ||= []).push(state)
  }

  for (const conv of snapshot?.data.convocatorias || []) {
    push(conv.cycle?.slug, runEnrollment(conv, now))
  }

  const out: Record<string, PublicEnrollment> = {}
  for (const [slug, states] of Object.entries(buckets)) {
    const combined = combineEnrollment(states)
    if (combined) out[slug] = combined
  }
  return out
}

export function closedConvocatoriaKeys(
  snapshot: CatalogSnapshot | null | undefined,
  now = new Date(),
): string[] {
  const keys: string[] = []
  for (const conv of snapshot?.data.convocatorias || []) {
    if (runEnrollment(conv, now) !== 'closed') continue
    if (conv.codigo) keys.push(String(conv.codigo))
    if (conv.id) keys.push(String(conv.id))
  }
  return keys
}
