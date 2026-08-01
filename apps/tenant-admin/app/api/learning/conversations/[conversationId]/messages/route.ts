import { authenticateNextLearningRequest } from '@/src/lib/learning/next-learning-auth'
import { createSendMessageHandler } from '@/src/lib/learning/send-message-handler'
import { sendNextLearningMessage } from '@/src/lib/learning/send-message-command'
import { withNextLearningTransaction } from '@/src/lib/learning/next-learning-transaction'

export const dynamic = 'force-dynamic'

export const POST = createSendMessageHandler({
  runtime: () => process.env.AKADEMATE_RUNTIME,
  enabled: () => process.env.AKADEMATE_NEXT_LEARNING_MESSAGING_ENABLED === 'true',
  now: () => new Date().toISOString(),
  authenticate: authenticateNextLearningRequest,
  execute: async ({ identity, conversationId, now, input }) => {
    return withNextLearningTransaction(identity, (tx, principal) => {
      return sendNextLearningMessage({
        tx,
        principal,
        conversationId,
        now,
        input,
      })
    })
  },
})
