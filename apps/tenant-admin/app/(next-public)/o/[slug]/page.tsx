import { cache } from 'react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

import { withNextPublicOfferTransaction } from '@/src/lib/offers/public-offer-database'
import { NextPublicOfferError, getNextPublicOffer } from '@/src/lib/offers/public-offer-query'
import { PublicOfferPageView } from './PublicOfferPageView'

export const dynamic = 'force-dynamic'

function normalizeRequestHost(value: string | null): string {
  return value?.split(',')[0]?.trim() ?? ''
}
const loadOffer = cache(async (host: string, slug: string) => {
  if (
    process.env.AKADEMATE_RUNTIME !== 'next'
    || process.env.AKADEMATE_NEXT_PUBLIC_OFFERS_ENABLED !== 'true'
  ) return null
  try {
    return await withNextPublicOfferTransaction((tx) => getNextPublicOffer({ tx, host, shareSlug: slug }))
  } catch (error) {
    if (error instanceof NextPublicOfferError && (
      error.code === 'public_offer_not_found'
      || error.code === 'public_offer_host_invalid'
      || error.code === 'public_offer_slug_invalid'
    )) return null
    throw error
  }
})

async function requestHost() {
  const store = await headers()
  return normalizeRequestHost(store.get('x-forwarded-host') || store.get('host'))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const [{ slug }, host] = await Promise.all([params, requestHost()])
  const offer = await loadOffer(host, slug)
  if (!offer) return { title: 'Course not found', robots: { index: false, follow: false } }
  const protocol = host.endsWith('.localhost') ? 'http' : 'https'
  const canonical = `${protocol}://${host}/o/${offer.shareSlug}`
  return {
    title: `${offer.courseName} · ${offer.tenantName}`,
    description: offer.shortDescription ?? `Explore ${offer.courseName} at ${offer.tenantName}.`,
    alternates: { canonical },
    robots: offer.publicationAccess === 'public'
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      type: 'website',
      url: canonical,
      title: offer.courseName,
      description: offer.shortDescription ?? `Explore this course from ${offer.tenantName}.`,
      ...(offer.courseImageUrl ? { images: [{ url: offer.courseImageUrl }] } : {}),
    },
  }
}

export default async function PublicOfferPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const [{ slug }, host] = await Promise.all([params, requestHost()])
  const offer = await loadOffer(host, slug)
  if (!offer) notFound()
  return <PublicOfferPageView offer={offer} />
}
