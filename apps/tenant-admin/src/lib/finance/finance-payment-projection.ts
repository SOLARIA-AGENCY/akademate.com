import type {
  LearningSqlClient,
  NextLearningPrincipal,
} from '../learning/next-learning-transaction.ts'

const projectionRoles = new Set(['superadmin', 'admin', 'gestor'])

type PaymentEventRow = {
  id: number
  tenant_id: number
  provider: 'stripe' | 'paypal'
  normalized_status: 'processing' | 'succeeded' | 'failed' | 'cancelled'
  amount_cents: number
  currency: string
  order_amount_cents: number
}

export class FinancePaymentProjectionError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = 'FinancePaymentProjectionError'
    this.code = code
  }
}

export async function projectPaidOfferPaymentEvents(input: {
  tx: LearningSqlClient
  principal: NextLearningPrincipal
  afterEventId: number | null
  limit: number
}): Promise<{ projected: number; lastEventId: number | null }> {
  if (!projectionRoles.has(input.principal.platformRole)) throw new FinancePaymentProjectionError('finance_forbidden')
  const afterEventId = input.afterEventId ?? 0
  const limit = Math.min(Math.max(Math.trunc(input.limit), 1), 500)
  const events = await input.tx.unsafe<PaymentEventRow>(`
    SELECT
      events.id,
      events.tenant_id,
      events.provider,
      events.normalized_status,
      events.amount_cents,
      events.currency,
      orders.amount_cents AS order_amount_cents
    FROM paid_offer_payment_events events
    JOIN paid_offer_orders orders
      ON orders.tenant_id = events.tenant_id AND orders.id = events.order_id
    WHERE events.tenant_id = $1
      AND events.id > $2
      AND events.normalized_status IN ('processing', 'succeeded', 'failed', 'cancelled')
    ORDER BY events.id ASC
    LIMIT $3
  `, [input.principal.tenantId, afterEventId, limit])

  let projected = 0
  let lastEventId: number | null = null
  for (const event of events) {
    lastEventId = event.id
    const status = event.amount_cents === event.order_amount_cents
      ? event.normalized_status
      : 'requires_review'
    const inserted = await input.tx.unsafe<{ id: string }>(`
      INSERT INTO finance_payment_projections (
        tenant_id, payment_event_id, provider, status, amount_cents, currency
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (tenant_id, payment_event_id) DO NOTHING
      RETURNING id
    `, [event.tenant_id, event.id, event.provider, status, event.amount_cents, event.currency])
    if (inserted.length > 0) projected += 1
  }
  return { projected, lastEventId }
}
