import { authenticateNextLearningRequest } from '@/src/lib/learning/next-learning-auth'
import { withNextLearningTransaction } from '@/src/lib/learning/next-learning-transaction'
import { createNextSessionHandlers } from '@/src/lib/learning/next-session-handler'
import { getNextSessionProfile } from '@/src/lib/learning/next-session-profile'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const handlers = createNextSessionHandlers({
  runtime: () => process.env.AKADEMATE_RUNTIME,
  authenticate: authenticateNextLearningRequest,
  read: ({ identity }) => withNextLearningTransaction(
    identity,
    (tx, principal) => getNextSessionProfile({ tx, principal }),
  ),
})

export const GET = handlers.GET
