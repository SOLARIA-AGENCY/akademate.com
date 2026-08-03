import { authenticateNextLearningRequest } from '@/src/lib/learning/next-learning-auth'
import { withNextLearningTransaction } from '@/src/lib/learning/next-learning-transaction'
import {
  getNextOfferConfiguration,
  updateNextOfferConfiguration,
} from '@/src/lib/offers/offer-configuration-command'
import { createOfferConfigurationHandlers } from '@/src/lib/offers/offer-configuration-handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const handlers = createOfferConfigurationHandlers({
  runtime: () => process.env.AKADEMATE_RUNTIME,
  enabled: () => process.env.AKADEMATE_NEXT_OFFERS_ENABLED === 'true',
  authenticate: authenticateNextLearningRequest,
  read: ({ identity, courseRunId }) => withNextLearningTransaction(
    identity,
    (tx, principal) => getNextOfferConfiguration({ tx, principal, courseRunId }),
  ),
  update: ({ identity, courseRunId, input }) => withNextLearningTransaction(
    identity,
    (tx, principal) => updateNextOfferConfiguration({
      tx,
      principal,
      courseRunId,
      input,
    }),
  ),
})

export const GET = handlers.GET
export const PATCH = handlers.PATCH
