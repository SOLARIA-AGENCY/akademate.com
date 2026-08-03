import { authenticateNextLearningRequest } from '@/src/lib/learning/next-learning-auth'
import { withNextLearningTransaction } from '@/src/lib/learning/next-learning-transaction'
import { listNextOfferSubmissions } from '@/src/lib/offers/offer-submission-inbox-command'
import { createOfferSubmissionInboxHandlers } from '@/src/lib/offers/offer-submission-inbox-handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const handlers = createOfferSubmissionInboxHandlers({
  runtime: () => process.env.AKADEMATE_RUNTIME,
  enabled: () => process.env.AKADEMATE_NEXT_OFFERS_ENABLED === 'true',
  authenticate: authenticateNextLearningRequest,
  list: ({ identity, query }) => withNextLearningTransaction(
    identity,
    (tx, principal) => listNextOfferSubmissions({ tx, principal, query }),
  ),
})

export const GET = handlers.GET
