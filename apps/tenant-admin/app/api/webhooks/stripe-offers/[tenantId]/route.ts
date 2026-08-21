import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { constructLearnerWebhookEvent } from '@/app/lib/offers/learner-stripe'
import { findOfferById, findTenantPaymentProvider, saveOffer } from '@/app/lib/offers/store'
import { parseTenantId } from '@/app/lib/server/tenant-scope'
import { confirmHold, releaseHold } from '@/src/domain/activity-offer'
import { resolveLearnerWebhookSecret } from '@/src/domain/tenant-learner-stripe'
import { findOrCreateStudent } from '@/src/domain/ensure-student'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function fulfillPaidOffer(
  payload: any,
  tenantId: number,
  offerId: string,
  session: Stripe.Checkout.Session,
) {
  const offer = await findOfferById(payload, tenantId, offerId)
  if (!offer) return

  const alreadyConfirmed = offer.seatHolds.some(
    (hold) => hold.sessionId === session.id && hold.status === 'confirmed',
  )
  const confirmed = alreadyConfirmed
    ? { ok: true as const, offer }
    : confirmHold(offer, { sessionId: session.id, holdId: session.metadata?.holdId })
  if (!confirmed.ok) return
  await saveOffer(payload, confirmed.offer)

  const email = session.customer_details?.email || session.customer_email || ''
  const name = session.customer_details?.name || 'Alumno'
  if (!email) return

  const lead = await payload.create({
    collection: 'leads',
    data: {
      tenant: tenantId,
      email,
      first_name: name,
      phone: session.customer_details?.phone || '+34 000 000 000',
      gdpr_consent: true,
      privacy_policy_accepted: true,
      consent_timestamp: new Date().toISOString(),
      source_form: 'offer_checkout',
      source_page: `/p/ofertas/${offer.publicSlug}`,
      lead_type: 'inscripcion',
      convocatoria_id: offer.sourceCourseRunId ?? undefined,
      notes: `Pago oferta ${offer.publicSlug}`,
    },
    overrideAccess: true,
  })

  if (offer.sourceCourseRunId && lead?.id) {
    const student = await findOrCreateStudent(payload, {
      email,
      firstName: name,
      lastName: 'Checkout',
      phone: session.customer_details?.phone || '+34 000 000 000',
      tenantId,
    })
    await payload.create({
      collection: 'enrollments',
      data: {
        tenant: tenantId,
        student: student.id,
        course_run: offer.sourceCourseRunId,
        status: 'confirmed',
        payment_status: 'paid',
        total_amount: offer.amountCents / 100,
        amount_paid: offer.amountCents / 100,
      },
      overrideAccess: true,
    }).catch(() => undefined)
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId: rawTenantId } = await context.params
  const tenantId = parseTenantId(rawTenantId)
  if (!tenantId) {
    return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })
  const connection = await findTenantPaymentProvider(payload as any, tenantId)
  if (!connection) {
    return NextResponse.json({ error: 'Stripe not connected' }, { status: 409 })
  }

  const webhookSecret = resolveLearnerWebhookSecret(connection)
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret missing' }, { status: 409 })
  }

  const rawBody = await request.text()
  let event: Stripe.Event
  try {
    event = constructLearnerWebhookEvent(rawBody, signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const offerId = session.metadata?.offerId
    if (offerId && session.metadata?.source === 'activity-offer') {
      await fulfillPaidOffer(payload, tenantId, offerId, session)
    }
  }

  if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
    const session = event.data.object as Stripe.Checkout.Session
    const offerId = session.metadata?.offerId
    if (offerId) {
      const offer = await findOfferById(payload as any, tenantId, offerId)
      if (offer) {
        await saveOffer(payload as any, releaseHold(offer, { sessionId: session.id, holdId: session.metadata?.holdId }, new Date()))
      }
    }
  }

  return NextResponse.json({ received: true })
}
