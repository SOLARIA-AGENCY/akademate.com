import { authenticateNextLearningRequest } from '@/src/lib/learning/next-learning-auth'
import { withNextLearningTransaction } from '@/src/lib/learning/next-learning-transaction'
import { reviewNextOfferSubmission } from '@/src/lib/offers/offer-submission-review-command'
import { createOfferSubmissionReviewHandlers } from '@/src/lib/offers/offer-submission-review-handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const handlers = createOfferSubmissionReviewHandlers({
  runtime: () => process.env.AKADEMATE_RUNTIME,
  enabled: () => process.env.AKADEMATE_NEXT_OFFERS_ENABLED === 'true',
  authenticate: authenticateNextLearningRequest,
  review: ({ identity, submissionId, decision }) => withNextLearningTransaction(
    identity,
    (tx, principal) => reviewNextOfferSubmission({ tx, principal, submissionId, decision }),
  ),
})

export const PATCH = handlers.PATCH
