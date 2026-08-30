import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth'
import { findOfferById, findTenantPaymentProvider, saveOffer } from '@/app/lib/offers/store'
import { publicOfferPath } from '@/src/domain/activity-offer'
import { isLearnerStripeConnected } from '@/src/domain/tenant-learner-stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function canWrite(role: string | null): boolean {
  return ['marketing', 'gestor', 'admin', 'superadmin'].includes(role ?? '')
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const payload = await getPayload({ config: configPromise })
  const auth = await getAuthenticatedUserContext(request, payload as any)
  if (!auth?.tenantId || !canWrite(auth.role)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const offer = await findOfferById(payload as any, auth.tenantId, id)
  if (!offer) {
    return NextResponse.json({ success: false, error: 'Oferta no encontrada' }, { status: 404 })
  }

  const body = (await request.json().catch(() => ({}))) as { checkoutEnabled?: boolean }
  if (body.checkoutEnabled === true) {
    const stripe = await findTenantPaymentProvider(payload as any, auth.tenantId)
    if (!isLearnerStripeConnected(stripe)) {
      return NextResponse.json({
        success: false,
        error: 'Conecta Stripe en Configuración antes de publicar la landing de pago',
        code: 'stripe_disconnected',
      }, { status: 409 })
    }
    if (!offer.amountCents) {
      return NextResponse.json({
        success: false,
        error: 'La oferta necesita un precio mayor que cero',
        code: 'missing_price',
      }, { status: 409 })
    }
  }

  const saved = await saveOffer(payload as any, {
    ...offer,
    checkoutEnabled: body.checkoutEnabled ?? offer.checkoutEnabled,
  })

  return NextResponse.json({
    success: true,
    data: {
      offer: {
        ...saved,
        publicPath: publicOfferPath(saved.publicSlug),
      },
    },
  })
}
