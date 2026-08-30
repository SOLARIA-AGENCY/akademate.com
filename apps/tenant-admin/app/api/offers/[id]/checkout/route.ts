import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createLearnerStripeClient } from '@/app/lib/offers/learner-stripe'
import { findOfferById, findTenantPaymentProvider, saveOffer } from '@/app/lib/offers/store'
import { parseTenantId } from '@/app/lib/server/tenant-scope'
import { getTenantHostBranding } from '@/app/lib/server/tenant-host-branding'
import {
  attachSessionToHold,
  canEnableCheckout,
  publicOfferPath,
  remainingSeats,
  tryHoldSeat,
} from '@/src/domain/activity-offer'
import { resolveLearnerSecret } from '@/src/domain/tenant-learner-stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const payload = await getPayload({ config: configPromise })
  const { id } = await context.params
  const branding = await getTenantHostBranding()
  const tenantId = parseTenantId(branding.tenantId)
  if (!tenantId) {
    return NextResponse.json({ success: false, error: 'Tenant not resolved' }, { status: 400 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    email?: string
    name?: string
    gdprConsent?: boolean
  }
  if (!body.email || !body.gdprConsent) {
    return NextResponse.json({ success: false, error: 'Email y consentimiento RGPD son obligatorios' }, { status: 400 })
  }

  const offer = await findOfferById(payload as any, tenantId, id)
  if (!offer) {
    return NextResponse.json({ success: false, error: 'Oferta no encontrada' }, { status: 404 })
  }

  const stripeConnection = await findTenantPaymentProvider(payload as any, tenantId)
  const gate = canEnableCheckout(offer, stripeConnection)
  if (!gate.ok) {
    return NextResponse.json({ success: false, error: gate.reason, code: gate.reason }, { status: 409 })
  }

  const now = new Date()
  if (remainingSeats(offer, now) <= 0) {
    return NextResponse.json({
      success: false,
      error: 'sold_out',
      code: 'sold_out',
      waitlistEnabled: offer.waitlistEnabled,
    }, { status: 409 })
  }

  const held = tryHoldSeat(offer, now, { email: body.email })
  if (!held.ok) {
    return NextResponse.json({
      success: false,
      error: 'sold_out',
      code: 'sold_out',
      waitlistEnabled: offer.waitlistEnabled,
    }, { status: 409 })
  }

  const origin = branding.origin || request.nextUrl.origin
  const secret = resolveLearnerSecret(stripeConnection!)
  const stripe = createLearnerStripeClient(secret)
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: body.email,
    locale: 'es',
    expires_at: Math.floor((now.getTime() + 30 * 60 * 1000) / 1000),
    success_url: `${origin}${publicOfferPath(offer.publicSlug)}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}${publicOfferPath(offer.publicSlug)}/cancel`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: offer.currency || 'eur',
          unit_amount: offer.amountCents,
          product_data: {
            name: offer.title,
            description: offer.scheduleText || undefined,
          },
        },
      },
    ],
    metadata: {
      offerId: String(offer.id ?? id),
      tenantId: String(tenantId),
      holdId: held.hold.id,
      source: 'activity-offer',
    },
  })

  const withSession = attachSessionToHold(held.offer, held.hold.id, session.id)
  await saveOffer(payload as any, withSession)

  return NextResponse.json({
    success: true,
    data: {
      url: session.url,
      sessionId: session.id,
    },
  })
}
