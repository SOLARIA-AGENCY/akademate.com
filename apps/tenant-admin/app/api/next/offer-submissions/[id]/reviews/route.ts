import { authenticateNextLearningRequest } from '@/src/lib/learning/next-learning-auth'
import { withNextLearningTransaction } from '@/src/lib/learning/next-learning-transaction'
import { getNextOfferSubmissionHistory } from '@/src/lib/offers/offer-submission-review-history-command'
import { createOfferSubmissionHistoryHandlers } from '@/src/lib/offers/offer-submission-review-history-handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const handlers = createOfferSubmissionHistoryHandlers({
  runtime: () => process.env.AKADEMATE_RUNTIME,
  enabled: () => process.env.AKADEMATE_NEXT_OFFERS_ENABLED === 'true',
  authenticate: authenticateNextLearningRequest,
  history: ({ identity, submissionId }) => withNextLearningTransaction(
    identity,
    (tx, principal) => getNextOfferSubmissionHistory({ tx, principal, submissionId }),
  ),
})

export const GET = handlers.GET
