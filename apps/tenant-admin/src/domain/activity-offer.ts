import { isLearnerStripeConnected, type LearnerStripePublicConnection, type LearnerStripeStoredConnection } from './tenant-learner-stripe'

export const ACTIVITY_KINDS = [
  'workshop',
  'class',
  'camp',
  'coaching',
  'season',
  'course_run',
  'other',
] as const
export type ActivityKind = (typeof ACTIVITY_KINDS)[number]

export const OFFER_SOURCE_TYPES = ['course_run', 'standalone'] as const
export type OfferSourceType = (typeof OFFER_SOURCE_TYPES)[number]

export const VENUE_KINDS = ['in_person', 'online', 'hybrid'] as const
export type VenueKind = (typeof VENUE_KINDS)[number]

export type SeatHoldStatus = 'held' | 'confirmed' | 'released'

export type SeatHold = {
  id: string
  sessionId?: string
  email?: string
  expiresAt: string
  status: SeatHoldStatus
}

export type ActivityOffer = {
  id?: number | string
  tenant: number
  title: string
  publicSlug: string
  activityKind: ActivityKind
  description: string
  coverUrl: string
  startsAt: string | null
  endsAt: string | null
  scheduleText: string
  venueKind: VenueKind
  venueLabel: string
  hostName: string
  capacity: number
  seatsTaken: number
  waitlistEnabled: boolean
  amountCents: number
  currency: string
  checkoutEnabled: boolean
  sourceType: OfferSourceType
  sourceCourseRunId: number | null
  seatHolds: SeatHold[]
}

export type CourseRunProjectionInput = {
  id: number | string
  tenant?: number | string | { id?: number | string } | null
  codigo?: string | null
  start_date?: string | null
  end_date?: string | null
  schedule_days?: string[] | null
  schedule_time_start?: string | null
  schedule_time_end?: string | null
  max_students?: number | null
  current_enrollments?: number | null
  price_snapshot?: number | null
  price_override?: number | null
  course?: { name?: string | null; featured_image?: { url?: string | null } | string | null } | string | number | null
  cycle?: { name?: string | null } | string | number | null
  campus?: { name?: string | null; city?: string | null; campus_kind?: string | null } | string | number | null
  instructor?: { full_name?: string | null; first_name?: string | null; last_name?: string | null } | string | number | null
}

const HOLD_TTL_MS = 30 * 60 * 1000

export function slugifyOffer(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function generatePublicSlug(title: string, codigo?: string | null): string {
  const fromTitle = slugifyOffer(title)
  const fromCode = codigo ? slugifyOffer(codigo) : ''
  return [fromTitle, fromCode].filter(Boolean).join('-') || `oferta-${Date.now()}`
}

function eurosToCents(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return 0
  return Math.round(value * 100)
}

function objectName(value: unknown, keys: string[]): string {
  if (!value || typeof value !== 'object') return ''
  const record = value as Record<string, unknown>
  for (const key of keys) {
    const candidate = record[key]
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
  }
  return ''
}

export function projectCourseRunToOffer(run: CourseRunProjectionInput, tenantId: number): ActivityOffer {
  const courseName = objectName(run.course, ['name'])
  const cycleName = objectName(run.cycle, ['name'])
  const title = courseName || cycleName || run.codigo || 'Actividad'
  const campusName = objectName(run.campus, ['name'])
  const campusCity = objectName(run.campus, ['city'])
  const campusKind = objectName(run.campus, ['campus_kind'])
  const instructor =
    objectName(run.instructor, ['full_name']) ||
    [objectName(run.instructor, ['first_name']), objectName(run.instructor, ['last_name'])]
      .filter(Boolean)
      .join(' ')
  const days = Array.isArray(run.schedule_days) ? run.schedule_days.join(', ') : ''
  const time =
    run.schedule_time_start && run.schedule_time_end
      ? `${String(run.schedule_time_start).slice(0, 5)}-${String(run.schedule_time_end).slice(0, 5)}`
      : ''
  const cover =
    run.course && typeof run.course === 'object' && run.course.featured_image && typeof run.course.featured_image === 'object'
      ? String(run.course.featured_image.url ?? '')
      : ''

  return {
    tenant: tenantId,
    title,
    publicSlug: generatePublicSlug(title, run.codigo),
    activityKind: 'course_run',
    description: '',
    coverUrl: cover,
    startsAt: run.start_date ?? null,
    endsAt: run.end_date ?? null,
    scheduleText: [days, time].filter(Boolean).join(' · '),
    venueKind: campusKind === 'virtual' ? 'online' : 'in_person',
    venueLabel: [campusName, campusCity].filter(Boolean).join(', '),
    hostName: instructor,
    capacity: Number(run.max_students ?? 0),
    seatsTaken: Number(run.current_enrollments ?? 0),
    waitlistEnabled: true,
    amountCents: eurosToCents(run.price_snapshot ?? run.price_override ?? null),
    currency: 'eur',
    checkoutEnabled: false,
    sourceType: 'course_run',
    sourceCourseRunId: Number(run.id),
    seatHolds: [],
  }
}

export function activeHolds(holds: SeatHold[] | undefined, now: Date): SeatHold[] {
  return (holds ?? []).filter((hold) => hold.status === 'held' && new Date(hold.expiresAt).getTime() > now.getTime())
}

export function remainingSeats(offer: Pick<ActivityOffer, 'capacity' | 'seatsTaken' | 'seatHolds'>, now: Date): number {
  const held = activeHolds(offer.seatHolds, now).length
  return Math.max(0, Number(offer.capacity || 0) - Number(offer.seatsTaken || 0) - held)
}

export function canEnableCheckout(
  offer: Pick<ActivityOffer, 'checkoutEnabled' | 'amountCents'>,
  stripe: LearnerStripeStoredConnection | LearnerStripePublicConnection | null,
): { ok: true } | { ok: false; reason: 'stripe_disconnected' | 'checkout_disabled' | 'missing_price' } {
  if (!isLearnerStripeConnected(stripe)) return { ok: false, reason: 'stripe_disconnected' }
  if (!offer.checkoutEnabled) return { ok: false, reason: 'checkout_disabled' }
  if (!offer.amountCents || offer.amountCents <= 0) return { ok: false, reason: 'missing_price' }
  return { ok: true }
}

export function tryHoldSeat(
  offer: ActivityOffer,
  now: Date,
  extras?: { email?: string; id?: string },
): { ok: true; offer: ActivityOffer; hold: SeatHold } | { ok: false; reason: 'sold_out' } {
  if (remainingSeats(offer, now) <= 0) return { ok: false, reason: 'sold_out' }

  const hold: SeatHold = {
    id: extras?.id ?? `hold_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}`,
    email: extras?.email,
    expiresAt: new Date(now.getTime() + HOLD_TTL_MS).toISOString(),
    status: 'held',
  }

  return {
    ok: true,
    hold,
    offer: {
      ...offer,
      seatHolds: [...activeHolds(offer.seatHolds, now), hold],
    },
  }
}

export function attachSessionToHold(offer: ActivityOffer, holdId: string, sessionId: string): ActivityOffer {
  return {
    ...offer,
    seatHolds: offer.seatHolds.map((hold) => (hold.id === holdId ? { ...hold, sessionId } : hold)),
  }
}

export function confirmHold(
  offer: ActivityOffer,
  match: { holdId?: string; sessionId?: string },
): { ok: true; offer: ActivityOffer } | { ok: false; reason: 'hold_not_found' } {
  const index = offer.seatHolds.findIndex((hold) => {
    if (match.holdId && hold.id === match.holdId) return true
    if (match.sessionId && hold.sessionId === match.sessionId) return true
    return false
  })
  if (index < 0) return { ok: false, reason: 'hold_not_found' }

  const holds = offer.seatHolds.map((hold, i) => (i === index ? { ...hold, status: 'confirmed' as const } : hold))
  return {
    ok: true,
    offer: {
      ...offer,
      seatsTaken: Number(offer.seatsTaken || 0) + 1,
      seatHolds: holds,
    },
  }
}

export function releaseHold(
  offer: ActivityOffer,
  match: { holdId?: string; sessionId?: string },
  now: Date,
): ActivityOffer {
  return {
    ...offer,
    seatHolds: offer.seatHolds
      .map((hold) => {
        const matches = (match.holdId && hold.id === match.holdId) || (match.sessionId && hold.sessionId === match.sessionId)
        if (!matches) return hold
        return { ...hold, status: 'released' as const }
      })
      .filter((hold) => hold.status !== 'released' && !(hold.status === 'held' && new Date(hold.expiresAt).getTime() <= now.getTime())),
  }
}

export function publicOfferPath(slug: string): string {
  return `/p/ofertas/${slug}`
}
