import { withTenantScope } from '@/app/lib/server/tenant-scope'
import type { ActivityOffer, SeatHold } from '@/src/domain/activity-offer'
import type { LearnerStripeStoredConnection } from '@/src/domain/tenant-learner-stripe'

type PayloadLike = {
  find: (args: Record<string, unknown>) => Promise<{ docs: Array<Record<string, unknown>> }>
  findByID: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
  create: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
  update: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
}

function relationId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value)
  if (value && typeof value === 'object' && 'id' in value) return relationId((value as { id: unknown }).id)
  return null
}

export function mapOfferDoc(doc: Record<string, unknown>): ActivityOffer {
  return {
    id: doc.id as number | string,
    tenant: relationId(doc.tenant) ?? 0,
    title: String(doc.title ?? ''),
    publicSlug: String(doc.public_slug ?? ''),
    activityKind: (doc.activity_kind as ActivityOffer['activityKind']) ?? 'workshop',
    description: String(doc.description ?? ''),
    coverUrl: String(doc.cover_url ?? ''),
    startsAt: (doc.starts_at as string | null) ?? null,
    endsAt: (doc.ends_at as string | null) ?? null,
    scheduleText: String(doc.schedule_text ?? ''),
    venueKind: (doc.venue_kind as ActivityOffer['venueKind']) ?? 'in_person',
    venueLabel: String(doc.venue_label ?? ''),
    hostName: String(doc.host_name ?? ''),
    capacity: Number(doc.capacity ?? 0),
    seatsTaken: Number(doc.seats_taken ?? 0),
    waitlistEnabled: Boolean(doc.waitlist_enabled),
    amountCents: Number(doc.amount_cents ?? 0),
    currency: String(doc.currency ?? 'eur'),
    checkoutEnabled: Boolean(doc.checkout_enabled),
    sourceType: (doc.source_type as ActivityOffer['sourceType']) ?? 'standalone',
    sourceCourseRunId: relationId(doc.source_course_run),
    seatHolds: Array.isArray(doc.seat_holds) ? (doc.seat_holds as SeatHold[]) : [],
  }
}

export function offerToDoc(offer: ActivityOffer): Record<string, unknown> {
  return {
    tenant: offer.tenant,
    title: offer.title,
    public_slug: offer.publicSlug,
    activity_kind: offer.activityKind,
    description: offer.description,
    cover_url: offer.coverUrl,
    starts_at: offer.startsAt,
    ends_at: offer.endsAt,
    schedule_text: offer.scheduleText,
    venue_kind: offer.venueKind,
    venue_label: offer.venueLabel,
    host_name: offer.hostName,
    capacity: offer.capacity,
    seats_taken: offer.seatsTaken,
    waitlist_enabled: offer.waitlistEnabled,
    amount_cents: offer.amountCents,
    currency: offer.currency,
    checkout_enabled: offer.checkoutEnabled,
    source_type: offer.sourceType,
    source_course_run: offer.sourceCourseRunId,
    seat_holds: offer.seatHolds,
  }
}

export function mapProviderDoc(doc: Record<string, unknown>): LearnerStripeStoredConnection {
  return {
    tenantId: relationId(doc.tenant) ?? 0,
    status: doc.status === 'connected' ? 'connected' : 'disconnected',
    publishableKey: String(doc.publishable_key ?? ''),
    secretCiphertext: String(doc.secret_ciphertext ?? ''),
    webhookSecretCiphertext: String(doc.webhook_secret_ciphertext ?? ''),
    secretLast4: String(doc.secret_last4 ?? ''),
    connectAccountId: String(doc.connect_account_id ?? ''),
    livemode: Boolean(doc.livemode),
  }
}

export async function findTenantPaymentProvider(
  payload: PayloadLike,
  tenantId: number,
): Promise<LearnerStripeStoredConnection | null> {
  const result = await payload.find({
    collection: 'tenant-payment-providers',
    where: withTenantScope({ provider: { equals: 'stripe' } }, tenantId),
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const doc = result.docs[0]
  return doc ? mapProviderDoc(doc) : null
}

export async function upsertTenantPaymentProvider(
  payload: PayloadLike,
  stored: LearnerStripeStoredConnection,
): Promise<LearnerStripeStoredConnection> {
  const existing = await payload.find({
    collection: 'tenant-payment-providers',
    where: withTenantScope({ provider: { equals: 'stripe' } }, stored.tenantId),
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const data = {
    tenant: stored.tenantId,
    provider: 'stripe',
    status: stored.status,
    publishable_key: stored.publishableKey,
    secret_ciphertext: stored.secretCiphertext,
    webhook_secret_ciphertext: stored.webhookSecretCiphertext,
    secret_last4: stored.secretLast4,
    connect_account_id: stored.connectAccountId,
    livemode: stored.livemode,
  }
  const doc = existing.docs[0]
    ? await payload.update({
        collection: 'tenant-payment-providers',
        id: existing.docs[0].id,
        data,
        overrideAccess: true,
      })
    : await payload.create({
        collection: 'tenant-payment-providers',
        data,
        overrideAccess: true,
      })
  return mapProviderDoc(doc)
}

export async function disconnectTenantPaymentProvider(payload: PayloadLike, tenantId: number): Promise<void> {
  const existing = await payload.find({
    collection: 'tenant-payment-providers',
    where: withTenantScope({ provider: { equals: 'stripe' } }, tenantId),
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (!existing.docs[0]) return
  await payload.update({
    collection: 'tenant-payment-providers',
    id: existing.docs[0].id,
    data: {
      status: 'disconnected',
      publishable_key: '',
      secret_ciphertext: '',
      webhook_secret_ciphertext: '',
      secret_last4: '',
      connect_account_id: '',
      livemode: false,
    },
    overrideAccess: true,
  })
}

export async function findOfferByCourseRun(
  payload: PayloadLike,
  tenantId: number,
  courseRunId: number | string,
): Promise<ActivityOffer | null> {
  const result = await payload.find({
    collection: 'activity-offers',
    where: withTenantScope({ source_course_run: { equals: courseRunId } }, tenantId),
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return result.docs[0] ? mapOfferDoc(result.docs[0]) : null
}

export async function findOfferBySlug(
  payload: PayloadLike,
  tenantId: number,
  slug: string,
): Promise<ActivityOffer | null> {
  const result = await payload.find({
    collection: 'activity-offers',
    where: withTenantScope({ public_slug: { equals: slug } }, tenantId),
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return result.docs[0] ? mapOfferDoc(result.docs[0]) : null
}

export async function findOfferById(
  payload: PayloadLike,
  tenantId: number,
  id: number | string,
): Promise<ActivityOffer | null> {
  try {
    const doc = await payload.findByID({
      collection: 'activity-offers',
      id,
      depth: 0,
      overrideAccess: true,
    })
    const offer = mapOfferDoc(doc)
    if (offer.tenant && offer.tenant !== tenantId) return null
    return offer
  } catch {
    return null
  }
}

export async function saveOffer(payload: PayloadLike, offer: ActivityOffer): Promise<ActivityOffer> {
  const data = offerToDoc(offer)
  const doc = offer.id
    ? await payload.update({
        collection: 'activity-offers',
        id: offer.id,
        data,
        overrideAccess: true,
      })
    : await payload.create({
        collection: 'activity-offers',
        data,
        overrideAccess: true,
      })
  return mapOfferDoc(doc)
}
