import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { findOfferById } from '@/app/lib/offers/store'
import { getTenantHostBranding } from '@/app/lib/server/tenant-host-branding'
import { parseTenantId } from '@/app/lib/server/tenant-scope'
import { remainingSeats } from '@/src/domain/activity-offer'

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
    phone?: string
    gdprConsent?: boolean
  }
  if (!body.email || !body.gdprConsent) {
    return NextResponse.json({ success: false, error: 'Email y consentimiento RGPD son obligatorios' }, { status: 400 })
  }

  const offer = await findOfferById(payload as any, tenantId, id)
  if (!offer || !offer.waitlistEnabled) {
    return NextResponse.json({ success: false, error: 'Lista de espera no disponible' }, { status: 409 })
  }
  if (remainingSeats(offer, new Date()) > 0) {
    return NextResponse.json({ success: false, error: 'Aún hay plazas. Usa el checkout.' }, { status: 409 })
  }

  await payload.create({
    collection: 'leads',
    data: {
      tenant: tenantId,
      email: body.email,
      first_name: body.name || 'Lista de espera',
      phone: body.phone || '+34 000 000 000',
      gdpr_consent: true,
      privacy_policy_accepted: true,
      consent_timestamp: new Date().toISOString(),
      source_form: 'waitlist_offer',
      source_page: `/p/ofertas/${offer.publicSlug}`,
      lead_type: 'inscripcion',
      convocatoria_id: offer.sourceCourseRunId ?? undefined,
      notes: `Waitlist offer ${offer.publicSlug}`,
    },
    overrideAccess: true,
  })

  return NextResponse.json({ success: true })
}
