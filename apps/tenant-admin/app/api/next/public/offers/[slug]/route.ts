import { withNextPublicOfferTransaction } from '@/src/lib/offers/public-offer-database'
import { NextPublicOfferError, getNextPublicOffer } from '@/src/lib/offers/public-offer-query'
import { NextLearningInfrastructureError } from '@/src/lib/learning/next-learning-transaction'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function response(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': status === 200
        ? 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'
        : 'private, no-store',
    },
  })
}

function requestHost(request: Request): string {
  return request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
    || request.headers.get('host')?.trim()
    || ''
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  if (
    process.env.AKADEMATE_RUNTIME !== 'next'
    || process.env.AKADEMATE_NEXT_PUBLIC_OFFERS_ENABLED !== 'true'
  ) return response({ error: 'not_found' }, 404)

  try {
    const { slug } = await context.params
    const offer = await withNextPublicOfferTransaction((tx) => getNextPublicOffer({
      tx,
      host: requestHost(request),
      shareSlug: slug,
    }))
    return response({ offer }, 200)
  } catch (error) {
    if (error instanceof NextPublicOfferError) {
      if (error.code === 'public_offer_host_invalid' || error.code === 'public_offer_slug_invalid') {
        return response({ error: 'not_found' }, 404)
      }
      if (error.code === 'public_offer_not_found') return response({ error: 'not_found' }, 404)
      return response({ error: 'offer_service_unavailable' }, 503)
    }
    if (error instanceof NextLearningInfrastructureError) {
      return response({ error: 'offer_service_unavailable' }, 503)
    }
    console.error('[Akademate Next Public Offers] Unhandled read error', error)
    return response({ error: 'internal_error' }, 500)
  }
}
