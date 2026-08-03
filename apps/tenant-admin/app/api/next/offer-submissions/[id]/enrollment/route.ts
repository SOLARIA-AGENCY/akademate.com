import { authenticateNextLearningRequest } from '@/src/lib/learning/next-learning-auth'
import { withNextLearningTransaction } from '@/src/lib/learning/next-learning-transaction'
import { convertNextOfferSubmissionToEnrollment } from '@/src/lib/offers/offer-submission-enrollment-command'
import { createOfferSubmissionEnrollmentHandlers } from '@/src/lib/offers/offer-submission-enrollment-handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const handlers = createOfferSubmissionEnrollmentHandlers({
  runtime: () => process.env.AKADEMATE_RUNTIME,
  enabled: () => process.env.AKADEMATE_NEXT_OFFERS_ENABLED === 'true',
  authenticate: authenticateNextLearningRequest,
  convert: ({ identity, submissionId }) => withNextLearningTransaction(
    identity,
    (tx, principal) => convertNextOfferSubmissionToEnrollment({ tx, principal, submissionId }),
  ),
})

export const POST = handlers.POST
