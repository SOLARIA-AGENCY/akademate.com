import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  GraduationCap,
  MapPin,
  Users,
} from 'lucide-react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@akademate/ui'

import type { NextPublicOffer } from '@/src/lib/offers/public-offer-query'
import { PublicOfferSubmissionForm } from './PublicOfferSubmissionForm'

const modalityLabels: Record<string, string> = {
  presencial: 'In person',
  online: 'Online',
  hibrido: 'Hybrid',
  hybrid: 'Hybrid',
  semipresencial: 'Blended',
  dual: 'Dual',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(value)
}

function fallbackActionLabel(mode: NextPublicOffer['conversionMode']) {
  switch (mode) {
    case 'information_only': return 'Ask the academy'
    case 'interest_form': return 'Request information'
    case 'free_registration': return 'Register'
    case 'approval_required': return 'Apply'
    case 'paid_registration': return 'Reserve your place'
    case 'external_link': return 'Continue'
  }
}

export function PublicOfferPageView({
  offer,
  privacyNoticeUrl,
}: {
  offer: NextPublicOffer
  privacyNoticeUrl?: string | null
}) {
  const externalAction = offer.conversionMode === 'external_link' && offer.externalActionUrl
  const internalSubmission = privacyNoticeUrl && (
    offer.conversionMode === 'interest_form'
    || offer.conversionMode === 'approval_required'
    || offer.conversionMode === 'free_registration'
  )
  const contactAction = !externalAction && !internalSubmission && offer.tenantContactEmail
  const actionHref = externalAction
    || (contactAction
      ? `mailto:${encodeURIComponent(contactAction)}?subject=${encodeURIComponent(`Information about ${offer.courseName}`)}`
      : null)
  const actionLabel = externalAction
    ? (offer.ctaLabel || fallbackActionLabel(offer.conversionMode))
    : 'Ask about this course'

  return (
    <main style={{ '--offer-accent': offer.tenantPrimaryColor } as React.CSSProperties}>
      <header className="border-b border-border bg-background/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {offer.tenantLogoUrl ? (
              <img src={offer.tenantLogoUrl} alt="" className="h-9 w-auto max-w-40 object-contain" />
            ) : (
              <span className="grid size-10 place-items-center rounded-xl bg-[var(--offer-accent)] text-white">
                <GraduationCap className="size-5" aria-hidden="true" />
              </span>
            )}
            <span className="font-semibold tracking-tight">{offer.tenantName}</span>
          </div>
          <Badge variant="outline">{modalityLabels[offer.modality] ?? offer.modality}</Badge>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border bg-muted/30">
        <div className="absolute inset-x-0 top-0 h-1 bg-[var(--offer-accent)]" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] lg:px-8">
          <div className="flex flex-col justify-center">
            <div className="mb-5 flex flex-wrap gap-2">
              <Badge>{offer.code}</Badge>
              {offer.publicationAccess === 'unlisted' ? <Badge variant="secondary">Shared invitation</Badge> : null}
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              {offer.courseName}
            </h1>
            {offer.shortDescription ? (
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                {offer.shortDescription}
              </p>
            ) : null}
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-primary/5">
            {offer.courseImageUrl ? (
              <img
                src={offer.courseImageUrl}
                alt=""
                className="aspect-[4/3] h-full min-h-72 w-full object-cover"
              />
            ) : (
              <div className="grid aspect-[4/3] min-h-72 place-items-center bg-[linear-gradient(135deg,var(--offer-accent),#071a3d)] text-white">
                <GraduationCap className="size-20 opacity-80" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8 lg:py-14">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="size-5 text-[var(--offer-accent)]" />Dates</CardTitle></CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              {formatDate(offer.startsAt)} — {formatDate(offer.endsAt)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Clock3 className="size-5 text-[var(--offer-accent)]" />Schedule</CardTitle></CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              {offer.scheduleTimeStart && offer.scheduleTimeEnd
                ? `${offer.scheduleTimeStart.slice(0, 5)}–${offer.scheduleTimeEnd.slice(0, 5)}`
                : offer.durationHours ? `${offer.durationHours} learning hours` : 'Schedule provided by the academy'}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="size-5 text-[var(--offer-accent)]" />Location</CardTitle></CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              {offer.campusName || modalityLabels[offer.modality] || offer.modality}
              {offer.campusCity ? <span className="block">{offer.campusCity}</span> : null}
              {offer.campusAddress ? <span className="block">{offer.campusAddress}</span> : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="size-5 text-[var(--offer-accent)]" />Availability</CardTitle></CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              {offer.capacityPolicy === 'unlimited'
                ? 'Open capacity'
                : offer.capacityPolicy === 'waitlist' && offer.availablePlaces === 0
                  ? 'Join the waiting list'
                  : `${offer.availablePlaces} places available`}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle>Join this course</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {offer.priceAmount ? (
              <div>
                <p className="text-3xl font-semibold tracking-tight">{formatCurrency(offer.priceAmount)}</p>
                {offer.paymentPlan === 'deposit' && offer.depositAmount ? (
                  <p className="mt-1 text-sm text-muted-foreground">Reserve with {formatCurrency(offer.depositAmount)}</p>
                ) : null}
              </div>
            ) : null}
            {internalSubmission ? (
              <PublicOfferSubmissionForm
                mode={offer.conversionMode as 'interest_form' | 'approval_required' | 'free_registration'}
                shareSlug={offer.shareSlug}
                privacyNoticeUrl={privacyNoticeUrl!}
              />
            ) : actionHref ? (
              <Button asChild size="lg" className="w-full bg-[var(--offer-accent)] text-white hover:opacity-90">
                <a href={actionHref} rel={externalAction ? 'noopener noreferrer' : undefined}>
                  {actionLabel}
                  {externalAction ? <ArrowUpRight aria-hidden="true" /> : null}
                </a>
              </Button>
            ) : (
              <p className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
                Contact {offer.tenantName} to continue with this course.
              </p>
            )}
            <p className="text-xs leading-5 text-muted-foreground">
              Course information and availability are managed directly by {offer.tenantName}.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
