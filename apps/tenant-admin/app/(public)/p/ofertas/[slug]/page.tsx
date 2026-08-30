import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Calendar, MapPin, User, Users } from 'lucide-react'
import { getTenantHostBranding } from '@/app/lib/server/tenant-host-branding'
import { parseTenantId } from '@/app/lib/server/tenant-scope'
import { findOfferBySlug, findTenantPaymentProvider } from '@/app/lib/offers/store'
import { remainingSeats } from '@/src/domain/activity-offer'
import { isLearnerStripeConnected } from '@/src/domain/tenant-learner-stripe'
import { OfferCheckoutForm } from './OfferCheckoutForm'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: (currency || 'eur').toUpperCase(),
  }).format(cents / 100)
}

function formatWhen(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const tenant = await getTenantHostBranding()
  const tenantId = parseTenantId(tenant.tenantId)
  if (!tenantId) return { title: 'Oferta' }
  const payload = await getPayload({ config: configPromise })
  const offer = await findOfferBySlug(payload as any, tenantId, slug)
  if (!offer || !offer.checkoutEnabled) return { title: 'Oferta no disponible' }
  return { title: `${offer.title} · Reserva`, description: offer.description || offer.scheduleText }
}

export default async function OfferLandingPage({ params }: Props) {
  const { slug } = await params
  const tenant = await getTenantHostBranding()
  const tenantId = parseTenantId(tenant.tenantId)
  if (!tenantId) notFound()

  const payload = await getPayload({ config: configPromise })
  const offer = await findOfferBySlug(payload as any, tenantId, slug)
  const stripe = await findTenantPaymentProvider(payload as any, tenantId)
  if (!offer || !offer.checkoutEnabled || !isLearnerStripeConnected(stripe)) notFound()

  const seatsLeft = remainingSeats(offer, new Date())
  const soldOut = seatsLeft <= 0
  const when = [formatWhen(offer.startsAt), formatWhen(offer.endsAt)].filter(Boolean).join(' — ')

  return (
    <main className="public-site mx-auto min-h-screen max-w-5xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
          {offer.coverUrl ? (
            <img src={offer.coverUrl} alt={offer.title} className="h-64 w-full object-cover" />
          ) : (
            <div className="h-40 bg-neutral-100" />
          )}
          <div className="space-y-4 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{offer.activityKind}</p>
            <h1 className="text-3xl font-semibold tracking-tight">{offer.title}</h1>
            {offer.description ? <p className="text-neutral-600">{offer.description}</p> : null}
            <div className="grid gap-3 sm:grid-cols-2">
              {when || offer.scheduleText ? (
                <p className="flex items-center gap-2 text-sm text-neutral-700">
                  <Calendar className="h-4 w-4" />
                  {when || offer.scheduleText}
                </p>
              ) : null}
              {offer.venueLabel ? (
                <p className="flex items-center gap-2 text-sm text-neutral-700">
                  <MapPin className="h-4 w-4" />
                  {offer.venueLabel}
                </p>
              ) : null}
              {offer.hostName ? (
                <p className="flex items-center gap-2 text-sm text-neutral-700">
                  <User className="h-4 w-4" />
                  {offer.hostName}
                </p>
              ) : null}
              <p className="flex items-center gap-2 text-sm text-neutral-700">
                <Users className="h-4 w-4" />
                {soldOut ? 'Sin plazas' : `${seatsLeft} plazas restantes`}
              </p>
            </div>
          </div>
        </section>

        <aside className="h-fit rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-500">Precio</p>
          <p className="mt-1 text-3xl font-semibold">{formatMoney(offer.amountCents, offer.currency)}</p>
          <div className="mt-6">
            <OfferCheckoutForm
              offerId={offer.id ?? ''}
              soldOut={soldOut}
              waitlistEnabled={offer.waitlistEnabled}
              checkoutEnabled={offer.checkoutEnabled}
            />
          </div>
        </aside>
      </div>
    </main>
  )
}
