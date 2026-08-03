import type { LearningSqlClient } from '../learning/next-learning-transaction.ts'
import { normalizePublicOfferHost, normalizeShareSlug } from '../offers/public-offer-query.ts'

export class NextPayPalReturnError extends Error {
  readonly code: string
  constructor(code: string) { super(code); this.name = 'NextPayPalReturnError'; this.code = code }
}
function fail(code: string): never { throw new NextPayPalReturnError(code) }

type ReturnRow = { source_host: string; source_slug: string; order_status: string }

export async function validateNextPayPalReturn(
  tx: LearningSqlClient,
  orderId: string,
  providerOrderId: string,
) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)
    || !/^[A-Z0-9]{8,255}$/.test(providerOrderId)
  ) fail('paypal_return_invalid')
  const rows = await tx.unsafe<ReturnRow>(`
    SELECT * FROM akademate_next_get_paypal_return($1::uuid, $2)
  `, [orderId, providerOrderId])
  const row = rows[0]
  if (!row) fail('paypal_return_not_found')
  return {
    host: normalizePublicOfferHost(row.source_host),
    shareSlug: normalizeShareSlug(row.source_slug),
    status: row.order_status,
  }
}
